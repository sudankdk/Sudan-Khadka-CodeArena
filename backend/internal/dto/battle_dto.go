package dto

import "github.com/google/uuid"

// CreateFrontendChallengeDTO is the payload for creating a new frontend battle challenge.
type CreateFrontendChallengeDTO struct {
	Title          string  `json:"title" validate:"required"`
	Description    string  `json:"description" validate:"required"`
	Difficulty     string  `json:"difficulty" validate:"required,oneof=easy medium hard"`
	BrokenHTML     string  `json:"broken_html" validate:"required"`
	BrokenCSS      string  `json:"broken_css" validate:"required"`
	BrokenJS       string  `json:"broken_js"`
	PixelThreshold float64 `json:"pixel_threshold"`
	DiffThreshold  float64 `json:"diff_threshold"`
	TimeLimit      int     `json:"time_limit"`
	ViewportWidth  int     `json:"viewport_width"`
	ViewportHeight int     `json:"viewport_height"`
	DOMAssertions  string  `json:"dom_assertions"`
}

// UpdateFrontendChallengeDTO is the payload for updating a challenge.
type UpdateFrontendChallengeDTO struct {
	Title          *string  `json:"title,omitempty"`
	Description    *string  `json:"description,omitempty"`
	Difficulty     *string  `json:"difficulty,omitempty"`
	BrokenHTML     *string  `json:"broken_html,omitempty"`
	BrokenCSS      *string  `json:"broken_css,omitempty"`
	BrokenJS       *string  `json:"broken_js,omitempty"`
	PixelThreshold *float64 `json:"pixel_threshold,omitempty"`
	DiffThreshold  *float64 `json:"diff_threshold,omitempty"`
	TimeLimit      *int     `json:"time_limit,omitempty"`
	ViewportWidth  *int     `json:"viewport_width,omitempty"`
	ViewportHeight *int     `json:"viewport_height,omitempty"`
	DOMAssertions  *string  `json:"dom_assertions,omitempty"`
}

// BattleSubmissionDTO is the payload for a battle code submission via WebSocket.
type BattleSubmissionDTO struct {
	MatchID string `json:"match_id" validate:"required"`
	HTML    string `json:"html"`
	CSS     string `json:"css"`
	JS      string `json:"js"`
}

// JoinQueueDTO is the payload for joining the matchmaking queue.
type JoinQueueDTO struct {
	Difficulty string `json:"difficulty" validate:"required,oneof=easy medium hard"`
}

// JudgeResult holds the output of the visual judge.
type JudgeResult struct {
	DiffRatio      float64 `json:"diff_ratio"`
	Passed         bool    `json:"passed"`
	ScreenshotPath string  `json:"screenshot_path"`
}

// BattleStatsDTO represents a user's battle statistics.
type BattleStatsDTO struct {
	TotalMatches  int     `json:"total_matches"`
	Wins          int     `json:"wins"`
	Losses        int     `json:"losses"`
	Draws         int     `json:"draws"`
	WinRate       float64 `json:"win_rate"`
	CurrentStreak int     `json:"current_streak"`
	BestStreak    int     `json:"best_streak"`
	Rating        float64 `json:"rating"`
	Tier          string  `json:"tier"`
}

// BattleHistoryDTO represents a single match in history.
type BattleHistoryDTO struct {
	MatchID      uuid.UUID `json:"match_id"`
	OpponentID   uuid.UUID `json:"opponent_id"`
	OpponentName string    `json:"opponent_name"`
	Result       string    `json:"result"` // win, loss, draw
	EloChange    float64   `json:"elo_change"`
	Difficulty   string    `json:"difficulty"`
	Duration     int       `json:"duration"` // seconds
	CreatedAt    string    `json:"created_at"`
}

// BattleLeaderboardEntryDTO represents a row in the battle leaderboard.
type BattleLeaderboardEntryDTO struct {
	Rank          int       `json:"rank"`
	UserID        uuid.UUID `json:"user_id"`
	Username      string    `json:"username"`
	Rating        float64   `json:"rating"`
	Tier          string    `json:"tier"`
	MatchesPlayed int       `json:"matches_played"`
	MatchesWon    int       `json:"matches_won"`
	WinRate       float64   `json:"win_rate"`
}

// BattleMatchDetailDTO is the detailed view of a match (for replay).
type BattleMatchDetailDTO struct {
	MatchID     uuid.UUID                 `json:"match_id"`
	Challenge   ChallengeInfoDTO          `json:"challenge"`
	PlayerA     BattlePlayerDTO           `json:"player_a"`
	PlayerB     BattlePlayerDTO           `json:"player_b"`
	Status      string                    `json:"status"`
	Result      string                    `json:"result"`
	WinnerID    *uuid.UUID                `json:"winner_id,omitempty"`
	TimeLimit   int                       `json:"time_limit"`
	StartTime   *string                   `json:"start_time,omitempty"`
	EndTime     *string                   `json:"end_time,omitempty"`
	Submissions []BattleSubmissionInfoDTO `json:"submissions"`
}

// ChallengeInfoDTO is a summary of a challenge for match context.
type ChallengeInfoDTO struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Difficulty  string    `json:"difficulty"`
}

// BattlePlayerDTO is player info within a match context.
type BattlePlayerDTO struct {
	UserID       uuid.UUID `json:"user_id"`
	Username     string    `json:"username"`
	Rating       float64   `json:"rating"`
	Tier         string    `json:"tier"`
	RatingBefore float64   `json:"rating_before"`
	EloChange    float64   `json:"elo_change"`
}

// BattleSubmissionInfoDTO is a submission visible in match detail / replay.
type BattleSubmissionInfoDTO struct {
	ID          uuid.UUID `json:"id"`
	PlayerID    uuid.UUID `json:"player_id"`
	DiffRatio   float64   `json:"diff_ratio"`
	Passed      bool      `json:"passed"`
	SubmittedAt string    `json:"submitted_at"`
}
