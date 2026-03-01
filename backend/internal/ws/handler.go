package ws

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/logger"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

// WSHandler routes incoming WebSocket messages to the appropriate handler.
type WSHandler struct {
	Hub                *Hub
	BattleService      *service.BattleService
	MatchmakingService *MatchmakingService

	// Grace period timers for disconnected players.
	gracePeriodTimers map[string]*time.Timer // matchID:userID -> timer
}

// NewWSHandler creates a new WebSocket handler.
func NewWSHandler(hub *Hub, battleService *service.BattleService, matchmakingService *MatchmakingService) *WSHandler {
	h := &WSHandler{
		Hub:                hub,
		BattleService:      battleService,
		MatchmakingService: matchmakingService,
		gracePeriodTimers:  make(map[string]*time.Timer),
	}

	// Set up disconnect handler on the hub
	hub.OnDisconnect = h.handleDisconnect

	return h
}

// HandleMessage routes a message to the appropriate handler based on type.
func (wh *WSHandler) HandleMessage(client *Client, msg WSMessage) {
	switch msg.Type {
	case MsgJoinQueue:
		wh.handleJoinQueue(client, msg.Payload)
	case MsgLeaveQueue:
		wh.handleLeaveQueue(client)
	case MsgSubmission:
		wh.handleSubmission(client, msg.Payload)
	case MsgTypingIndicator:
		wh.handleTypingIndicator(client, msg.Payload)
	case MsgReconnect:
		wh.handleReconnect(client)
	case MsgForfeit:
		wh.handleForfeit(client, msg.Payload)
	case MsgRematchRequest:
		wh.handleRematchRequest(client, msg.Payload)
	default:
		client.SendError("Unknown message type: " + msg.Type)
	}
}

func (wh *WSHandler) handleJoinQueue(client *Client, payload json.RawMessage) {
	var p JoinQueuePayload
	if err := json.Unmarshal(payload, &p); err != nil {
		client.SendError("Invalid join_queue payload")
		return
	}

	if p.Difficulty == "" {
		p.Difficulty = "medium"
	}

	if err := wh.MatchmakingService.AddToQueue(client.UserID, p.Difficulty); err != nil {
		client.SendError("Failed to join queue: " + err.Error())
		return
	}

	client.SendJSON(MsgQueueStatus, QueueStatusPayload{
		Status:   "searching",
		WaitTime: 0,
	})

	logger.Info("Player joined queue",
		zap.String("user_id", client.UserID.String()),
		zap.String("difficulty", p.Difficulty),
	)
}

func (wh *WSHandler) handleLeaveQueue(client *Client) {
	if err := wh.MatchmakingService.RemoveFromQueue(client.UserID); err != nil {
		logger.Warn("Failed to remove from queue", zap.Error(err))
	}

	client.SendJSON(MsgQueueStatus, QueueStatusPayload{
		Status: "cancelled",
	})
}

func (wh *WSHandler) handleSubmission(client *Client, payload json.RawMessage) {
	var p SubmissionPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		client.SendError("Invalid submission payload")
		return
	}

	matchID, err := uuid.Parse(p.MatchID)
	if err != nil {
		client.SendError("Invalid match ID")
		return
	}

	// Process submission (includes judging)
	submission, result, err := wh.BattleService.ProcessSubmission(matchID, client.UserID, p.HTML, p.CSS, p.JS)
	if err != nil {
		client.SendError("Submission failed: " + err.Error())
		return
	}

	// Notify opponent that a submission was made
	wh.Hub.SendToOpponent(p.MatchID, client.UserID, MsgOpponentSubmitted, OpponentSubmittedPayload{
		SubmittedAt: submission.SubmittedAt.Format(time.RFC3339),
	})

	// Send judge result to the submitting player
	if result != nil {
		client.SendJSON(MsgJudgeResult, JudgeResultPayload{
			MatchID:   p.MatchID,
			DiffRatio: result.DiffRatio,
			Passed:    result.Passed,
		})

		// If passed, notify both players the match is over
		if result.Passed {
			wh.broadcastMatchOver(p.MatchID)
		}
	}
}

func (wh *WSHandler) handleTypingIndicator(client *Client, payload json.RawMessage) {
	var p TypingPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		return
	}

	matchID := client.GetMatchID()
	if matchID == "" {
		return
	}

	wh.Hub.SendToOpponent(matchID, client.UserID, MsgTypingIndicator, p)
}

func (wh *WSHandler) handleReconnect(client *Client) {
	// Find active match for this user
	match, err := wh.BattleService.BattleRepo.GetActiveMatchForUser(client.UserID)
	if err != nil {
		client.SendError("No active match found")
		return
	}

	matchIDStr := match.ID.String()

	// Cancel grace period timer if exists
	timerKey := matchIDStr + ":" + client.UserID.String()
	if timer, ok := wh.gracePeriodTimers[timerKey]; ok {
		timer.Stop()
		delete(wh.gracePeriodTimers, timerKey)
	}

	// Rejoin the room
	wh.Hub.JoinRoom(matchIDStr, client)

	// Notify opponent of reconnection
	wh.Hub.SendToOpponent(matchIDStr, client.UserID, MsgOpponentReconnected, nil)

	// Send match state back to the reconnecting player
	opponentName := match.PlayerB.Username
	opponentRating := match.PlayerBRatingBefore
	if match.PlayerAID != client.UserID {
		opponentName = match.PlayerA.Username
		opponentRating = match.PlayerARatingBefore
	}

	startTimeStr := ""
	if match.StartTime != nil {
		startTimeStr = match.StartTime.Format(time.RFC3339)
	}

	client.SendJSON(MsgMatchFound, MatchFoundPayload{
		MatchID:      matchIDStr,
		OpponentName: opponentName,
		OpponentElo:  opponentRating,
		OpponentTier: service.GetEloTier(opponentRating),
		ChallengeID:  match.ChallengeID.String(),
		Title:        match.Challenge.Title,
		Description:  match.Challenge.Description,
		Difficulty:   match.Challenge.Difficulty,
		BrokenHTML:   match.Challenge.BrokenHTML,
		BrokenCSS:    match.Challenge.BrokenCSS,
		BrokenJS:     match.Challenge.BrokenJS,
		TimeLimit:    match.TimeLimit,
		ReferenceURL: "/battles/challenges/" + match.ChallengeID.String() + "/reference",
		StartTime:    startTimeStr,
	})

	logger.Info("Player reconnected to match",
		zap.String("user_id", client.UserID.String()),
		zap.String("match_id", matchIDStr),
	)
}

func (wh *WSHandler) handleDisconnect(client *Client) {
	matchID := client.GetMatchID()
	if matchID == "" {
		// Not in a match, just remove from queue
		wh.MatchmakingService.RemoveFromQueue(client.UserID)
		return
	}

	// Notify opponent
	wh.Hub.SendToOpponent(matchID, client.UserID, MsgOpponentDisconnected, DisconnectedPayload{
		GracePeriodSeconds: 30,
	})

	// Start grace period timer
	timerKey := matchID + ":" + client.UserID.String()
	timer := time.AfterFunc(30*time.Second, func() {
		// Grace period expired — forfeit
		mID, err := uuid.Parse(matchID)
		if err != nil {
			return
		}

		if err := wh.BattleService.ForfeitMatch(mID, client.UserID); err != nil {
			logger.Error("Failed to forfeit match", zap.Error(err))
			return
		}

		wh.broadcastMatchOver(matchID)
		delete(wh.gracePeriodTimers, timerKey)

		logger.Info("Player forfeited due to disconnect timeout",
			zap.String("user_id", client.UserID.String()),
			zap.String("match_id", matchID),
		)
	})

	wh.gracePeriodTimers[timerKey] = timer
}

func (wh *WSHandler) handleForfeit(client *Client, payload json.RawMessage) {
	var p struct {
		MatchID string `json:"match_id"`
	}
	if err := json.Unmarshal(payload, &p); err != nil {
		client.SendError("Invalid forfeit payload")
		return
	}

	matchID, err := uuid.Parse(p.MatchID)
	if err != nil {
		client.SendError("Invalid match ID")
		return
	}

	if err := wh.BattleService.ForfeitMatch(matchID, client.UserID); err != nil {
		client.SendError("Forfeit failed: " + err.Error())
		return
	}

	wh.broadcastMatchOver(p.MatchID)

	logger.Info("Player forfeited match",
		zap.String("user_id", client.UserID.String()),
		zap.String("match_id", p.MatchID),
	)
}

func (wh *WSHandler) handleRematchRequest(client *Client, payload json.RawMessage) {
	var p RematchPayload
	if err := json.Unmarshal(payload, &p); err != nil {
		client.SendError("Invalid rematch payload")
		return
	}

	opponentID, err := uuid.Parse(p.OpponentID)
	if err != nil {
		client.SendError("Invalid opponent ID")
		return
	}

	// Forward rematch request to opponent
	wh.Hub.SendToUser(opponentID, MsgRematchRequest, RematchPayload{
		MatchID:    p.MatchID,
		OpponentID: client.UserID.String(),
	})
}

// broadcastMatchOver sends match results to all players in the room.
func (wh *WSHandler) broadcastMatchOver(matchID string) {
	mID, err := uuid.Parse(matchID)
	if err != nil {
		return
	}

	detail, err := wh.BattleService.GetMatchDetail(mID)
	if err != nil {
		logger.Error("Failed to get match detail for broadcast", zap.Error(err))
		return
	}

	var winnerIDStr *string
	if detail.WinnerID != nil {
		s := detail.WinnerID.String()
		winnerIDStr = &s
	}

	wh.Hub.BroadcastToRoom(matchID, MsgMatchOver, MatchOverPayload{
		MatchID:    matchID,
		Result:     detail.Result,
		WinnerID:   winnerIDStr,
		EloChangeA: detail.PlayerA.EloChange,
		EloChangeB: detail.PlayerB.EloChange,
		NewRatingA: detail.PlayerA.RatingBefore + detail.PlayerA.EloChange,
		NewRatingB: detail.PlayerB.RatingBefore + detail.PlayerB.EloChange,
	})
}

// NotifyMatchFound notifies both players that a match has been found.
// Called by the matchmaking service when it pairs two players.
func (wh *WSHandler) NotifyMatchFound(matchIDStr string, playerAID, playerBID uuid.UUID, challenge interface{}, match interface{}) {
	// This is called from the matchmaking service with the actual match data
}
