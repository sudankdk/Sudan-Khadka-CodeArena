package ws

import "encoding/json"

// WSMessage is the generic WebSocket message envelope.
type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// Message types for WebSocket communication.
const (
	MsgJoinQueue            = "join_queue"
	MsgLeaveQueue           = "leave_queue"
	MsgMatchFound           = "match_found"
	MsgSubmission           = "submission"
	MsgOpponentSubmitted    = "opponent_submitted"
	MsgJudgeResult          = "judge_result"
	MsgMatchOver            = "match_over"
	MsgTypingIndicator      = "typing_indicator"
	MsgOpponentDisconnected = "opponent_disconnected"
	MsgOpponentReconnected  = "opponent_reconnected"
	MsgReconnect            = "reconnect"
	MsgForfeit              = "forfeit"
	MsgRematchRequest       = "rematch_request"
	MsgRematchAccepted      = "rematch_accepted"
	MsgError                = "error"
	MsgQueueStatus          = "queue_status"
)

// MatchFoundPayload is sent to both players when a match is created.
type MatchFoundPayload struct {
	MatchID      string  `json:"match_id"`
	OpponentName string  `json:"opponent_name"`
	OpponentElo  float64 `json:"opponent_elo"`
	OpponentTier string  `json:"opponent_tier"`
	ChallengeID  string  `json:"challenge_id"`
	Title        string  `json:"title"`
	Description  string  `json:"description"`
	Difficulty   string  `json:"difficulty"`
	BrokenHTML   string  `json:"broken_html"`
	BrokenCSS    string  `json:"broken_css"`
	BrokenJS     string  `json:"broken_js"`
	TimeLimit    int     `json:"time_limit"`
	ReferenceURL string  `json:"reference_url"`
	StartTime    string  `json:"start_time"`
}

// SubmissionPayload is sent by a player when they submit code.
type SubmissionPayload struct {
	MatchID string `json:"match_id"`
	HTML    string `json:"html"`
	CSS     string `json:"css"`
	JS      string `json:"js"`
}

// OpponentSubmittedPayload notifies the other player of a submission.
type OpponentSubmittedPayload struct {
	SubmittedAt string `json:"submitted_at"`
}

// JudgeResultPayload contains the judge verdict for the submitting player.
type JudgeResultPayload struct {
	MatchID   string  `json:"match_id"`
	DiffRatio float64 `json:"diff_ratio"`
	Passed    bool    `json:"passed"`
}

// MatchOverPayload is sent to both players when the match concludes.
type MatchOverPayload struct {
	MatchID    string  `json:"match_id"`
	Result     string  `json:"result"`
	WinnerID   *string `json:"winner_id,omitempty"`
	EloChangeA float64 `json:"elo_change_a"`
	EloChangeB float64 `json:"elo_change_b"`
	NewRatingA float64 `json:"new_rating_a"`
	NewRatingB float64 `json:"new_rating_b"`
}

// DisconnectedPayload notifies opponent of a disconnection.
type DisconnectedPayload struct {
	GracePeriodSeconds int `json:"grace_period_seconds"`
}

// ErrorPayload is sent when an error occurs.
type ErrorPayload struct {
	Message string `json:"message"`
}

// QueueStatusPayload provides queue position/status updates.
type QueueStatusPayload struct {
	Status   string `json:"status"`    // searching, matched, cancelled
	WaitTime int    `json:"wait_time"` // seconds
}

// JoinQueuePayload is sent by the client to join the matchmaking queue.
type JoinQueuePayload struct {
	Difficulty string `json:"difficulty"`
}

// TypingPayload is sent by a player to indicate typing activity.
type TypingPayload struct {
	MatchID  string `json:"match_id"`
	IsTyping bool   `json:"is_typing"`
}

// ForfeitPayload is sent when a player forfeits.
type ForfeitPayload struct {
	MatchID     string `json:"match_id"`
	ForfeitedBy string `json:"forfeited_by"`
	Reason      string `json:"reason"`
}

// RematchPayload is sent when requesting/accepting a rematch.
type RematchPayload struct {
	MatchID    string `json:"match_id"`
	OpponentID string `json:"opponent_id"`
}
