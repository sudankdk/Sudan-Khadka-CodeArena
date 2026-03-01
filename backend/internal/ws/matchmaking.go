package ws

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/sudankdk/codearena/internal/logger"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

const (
	queueKey         = "battle:matchmaking:queue"
	playerMetaPrefix = "battle:matchmaking:player:"
	baseEloWindow    = 100.0
	eloWindowGrowth  = 5.0 // ELO window expands by 5 per second waited
	pollInterval     = 2 * time.Second
)

// MatchmakingService handles player queue management and matchmaking.
type MatchmakingService struct {
	redis         *redis.Client
	hub           *Hub
	battleService *service.BattleService
	challengeRepo repo.FrontendChallengeRepo
	userRepo      repo.UserRepo
	ctx           context.Context
	cancel        context.CancelFunc
	mu            sync.Mutex
}

// NewMatchmakingService creates a new matchmaking service.
func NewMatchmakingService(
	redisClient *redis.Client,
	hub *Hub,
	battleService *service.BattleService,
	challengeRepo repo.FrontendChallengeRepo,
	userRepo repo.UserRepo,
) *MatchmakingService {
	ctx, cancel := context.WithCancel(context.Background())
	return &MatchmakingService{
		redis:         redisClient,
		hub:           hub,
		battleService: battleService,
		challengeRepo: challengeRepo,
		userRepo:      userRepo,
		ctx:           ctx,
		cancel:        cancel,
	}
}

// Start begins the matchmaking polling loop. Call as a goroutine.
func (ms *MatchmakingService) Start() {
	logger.Info("Matchmaking service started")
	ticker := time.NewTicker(pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ms.ctx.Done():
			logger.Info("Matchmaking service stopped")
			return
		case <-ticker.C:
			ms.processQueue()
		}
	}
}

// Stop halts the matchmaking service.
func (ms *MatchmakingService) Stop() {
	ms.cancel()
}

// AddToQueue adds a player to the matchmaking queue.
func (ms *MatchmakingService) AddToQueue(userID uuid.UUID, difficulty string) error {
	user, err := ms.userRepo.FindUserById(userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	ctx := context.Background()

	// Add to sorted set with ELO as score
	if err := ms.redis.ZAdd(ctx, queueKey, redis.Z{
		Score:  user.Rating,
		Member: userID.String(),
	}).Err(); err != nil {
		return fmt.Errorf("failed to add to queue: %w", err)
	}

	// Store player metadata
	metaKey := playerMetaPrefix + userID.String()
	if err := ms.redis.HSet(ctx, metaKey, map[string]interface{}{
		"elo":        user.Rating,
		"difficulty": difficulty,
		"joined_at":  time.Now().Unix(),
		"username":   user.Username,
	}).Err(); err != nil {
		return fmt.Errorf("failed to store player metadata: %w", err)
	}

	// Set expiry on metadata (auto-cleanup after 10 minutes)
	ms.redis.Expire(ctx, metaKey, 10*time.Minute)

	return nil
}

// RemoveFromQueue removes a player from the matchmaking queue.
func (ms *MatchmakingService) RemoveFromQueue(userID uuid.UUID) error {
	ctx := context.Background()
	ms.redis.ZRem(ctx, queueKey, userID.String())
	ms.redis.Del(ctx, playerMetaPrefix+userID.String())
	return nil
}

// processQueue scans the queue and tries to pair players.
func (ms *MatchmakingService) processQueue() {
	ms.mu.Lock()
	defer ms.mu.Unlock()

	ctx := context.Background()

	// Get all players in queue
	members, err := ms.redis.ZRangeWithScores(ctx, queueKey, 0, -1).Result()
	if err != nil || len(members) < 2 {
		return
	}

	matched := make(map[string]bool)

	for i := 0; i < len(members); i++ {
		playerID := members[i].Member.(string)
		if matched[playerID] {
			continue
		}

		playerElo := members[i].Score
		playerMeta, err := ms.redis.HGetAll(ctx, playerMetaPrefix+playerID).Result()
		if err != nil || len(playerMeta) == 0 {
			continue
		}

		joinedAt, _ := strconv.ParseInt(playerMeta["joined_at"], 10, 64)
		waitSeconds := float64(time.Now().Unix() - joinedAt)
		eloWindow := baseEloWindow + (waitSeconds * eloWindowGrowth)
		difficulty := playerMeta["difficulty"]

		// Find a suitable opponent
		for j := i + 1; j < len(members); j++ {
			opponentID := members[j].Member.(string)
			if matched[opponentID] || opponentID == playerID {
				continue
			}

			opponentElo := members[j].Score
			opponentMeta, err := ms.redis.HGetAll(ctx, playerMetaPrefix+opponentID).Result()
			if err != nil || len(opponentMeta) == 0 {
				continue
			}

			// Check ELO range
			eloDiff := playerElo - opponentElo
			if eloDiff < 0 {
				eloDiff = -eloDiff
			}
			if eloDiff > eloWindow {
				// Also check opponent's expanded window
				opponentJoinedAt, _ := strconv.ParseInt(opponentMeta["joined_at"], 10, 64)
				opponentWait := float64(time.Now().Unix() - opponentJoinedAt)
				opponentWindow := baseEloWindow + (opponentWait * eloWindowGrowth)
				if eloDiff > opponentWindow {
					continue
				}
			}

			// Check difficulty preference match
			opponentDifficulty := opponentMeta["difficulty"]
			matchDifficulty := difficulty
			if difficulty != opponentDifficulty {
				// Use the easier difficulty or skip if too different
				if difficulty == "hard" && opponentDifficulty == "easy" {
					continue
				}
				if difficulty == "easy" && opponentDifficulty == "hard" {
					continue
				}
				// medium matches with either
				if difficulty == "medium" {
					matchDifficulty = opponentDifficulty
				}
			}

			// Match found! Pair them
			matched[playerID] = true
			matched[opponentID] = true

			go ms.createMatch(playerID, opponentID, matchDifficulty)
			break
		}
	}
}

// createMatch pairs two players, creates a match, and notifies them.
func (ms *MatchmakingService) createMatch(playerAStr, playerBStr, difficulty string) {
	ctx := context.Background()

	playerAID, err := uuid.Parse(playerAStr)
	if err != nil {
		return
	}
	playerBID, err := uuid.Parse(playerBStr)
	if err != nil {
		return
	}

	// Remove both from queue atomically
	ms.redis.ZRem(ctx, queueKey, playerAStr, playerBStr)
	ms.redis.Del(ctx, playerMetaPrefix+playerAStr, playerMetaPrefix+playerBStr)

	// Get a random challenge
	challenge, err := ms.challengeRepo.GetRandomByDifficulty(difficulty)
	if err != nil {
		logger.Error("No challenges available for difficulty", zap.String("difficulty", difficulty), zap.Error(err))
		// Notify both players of failure
		ms.hub.SendToUser(playerAID, MsgError, ErrorPayload{Message: "No challenges available. Try again later."})
		ms.hub.SendToUser(playerBID, MsgError, ErrorPayload{Message: "No challenges available. Try again later."})
		return
	}

	// Create match
	match, err := ms.battleService.CreateMatch(playerAID, playerBID, challenge)
	if err != nil {
		logger.Error("Failed to create match", zap.Error(err))
		ms.hub.SendToUser(playerAID, MsgError, ErrorPayload{Message: "Failed to create match"})
		ms.hub.SendToUser(playerBID, MsgError, ErrorPayload{Message: "Failed to create match"})
		return
	}

	matchIDStr := match.ID.String()

	// Get player info
	playerA, _ := ms.userRepo.FindUserById(playerAID)
	playerB, _ := ms.userRepo.FindUserById(playerBID)

	// Join both players to the room
	clientA := ms.hub.GetClient(playerAID)
	clientB := ms.hub.GetClient(playerBID)

	if clientA != nil {
		ms.hub.JoinRoom(matchIDStr, clientA)
	}
	if clientB != nil {
		ms.hub.JoinRoom(matchIDStr, clientB)
	}

	startTimeStr := ""
	if match.StartTime != nil {
		startTimeStr = match.StartTime.Format(time.RFC3339)
	}

	// Notify player A
	ms.hub.SendToUser(playerAID, MsgMatchFound, MatchFoundPayload{
		MatchID:      matchIDStr,
		OpponentName: playerB.Username,
		OpponentElo:  playerB.Rating,
		OpponentTier: service.GetEloTier(playerB.Rating),
		ChallengeID:  challenge.ID.String(),
		Title:        challenge.Title,
		Description:  challenge.Description,
		Difficulty:   challenge.Difficulty,
		BrokenHTML:   challenge.BrokenHTML,
		BrokenCSS:    challenge.BrokenCSS,
		BrokenJS:     challenge.BrokenJS,
		TimeLimit:    challenge.TimeLimit,
		ReferenceURL: "/battles/challenges/" + challenge.ID.String() + "/reference",
		StartTime:    startTimeStr,
	})

	// Notify player B
	ms.hub.SendToUser(playerBID, MsgMatchFound, MatchFoundPayload{
		MatchID:      matchIDStr,
		OpponentName: playerA.Username,
		OpponentElo:  playerA.Rating,
		OpponentTier: service.GetEloTier(playerA.Rating),
		ChallengeID:  challenge.ID.String(),
		Title:        challenge.Title,
		Description:  challenge.Description,
		Difficulty:   challenge.Difficulty,
		BrokenHTML:   challenge.BrokenHTML,
		BrokenCSS:    challenge.BrokenCSS,
		BrokenJS:     challenge.BrokenJS,
		TimeLimit:    challenge.TimeLimit,
		ReferenceURL: "/battles/challenges/" + challenge.ID.String() + "/reference",
		StartTime:    startTimeStr,
	})

	// Start match timer
	go ms.startMatchTimer(match.ID, match.TimeLimit)

	logger.Info("Match created",
		zap.String("match_id", matchIDStr),
		zap.String("player_a", playerA.Username),
		zap.String("player_b", playerB.Username),
		zap.String("challenge", challenge.Title),
	)
}

// startMatchTimer starts a timer that ends the match when time expires.
func (ms *MatchmakingService) startMatchTimer(matchID uuid.UUID, timeLimitSeconds int) {
	timer := time.NewTimer(time.Duration(timeLimitSeconds) * time.Second)
	defer timer.Stop()

	select {
	case <-timer.C:
		// Time's up — end match
		if err := ms.battleService.EndMatchAsDraw(matchID); err != nil {
			logger.Error("Failed to end timed-out match", zap.Error(err))
			return
		}

		matchIDStr := matchID.String()
		detail, err := ms.battleService.GetMatchDetail(matchID)
		if err != nil {
			return
		}

		var winnerIDStr *string
		if detail.WinnerID != nil {
			s := detail.WinnerID.String()
			winnerIDStr = &s
		}

		ms.hub.BroadcastToRoom(matchIDStr, MsgMatchOver, MatchOverPayload{
			MatchID:    matchIDStr,
			Result:     detail.Result,
			WinnerID:   winnerIDStr,
			EloChangeA: detail.PlayerA.EloChange,
			EloChangeB: detail.PlayerB.EloChange,
			NewRatingA: detail.PlayerA.RatingBefore + detail.PlayerA.EloChange,
			NewRatingB: detail.PlayerB.RatingBefore + detail.PlayerB.EloChange,
		})

		logger.Info("Match timed out", zap.String("match_id", matchIDStr))
	case <-ms.ctx.Done():
		return
	}
}
