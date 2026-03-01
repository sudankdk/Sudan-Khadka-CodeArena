package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// FrontendChallenge represents a broken HTML/CSS/JS challenge that players must fix.
type FrontendChallenge struct {
	ID                      uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Title                   string    `json:"title" gorm:"not null"`
	Description             string    `json:"description" gorm:"type:text"`
	Difficulty              string    `json:"difficulty" gorm:"not null"` // easy, medium, hard
	BrokenHTML              string    `json:"broken_html" gorm:"type:text;not null"`
	BrokenCSS               string    `json:"broken_css" gorm:"type:text;not null"`
	BrokenJS                string    `json:"broken_js" gorm:"type:text"`
	ReferenceScreenshotPath string    `json:"reference_screenshot_path" gorm:"not null"`
	PixelThreshold          float64   `json:"pixel_threshold" gorm:"default:0.1"`
	DiffThreshold           float64   `json:"diff_threshold" gorm:"default:0.02"`
	TimeLimit               int       `json:"time_limit" gorm:"default:900"` // seconds
	ViewportWidth           int       `json:"viewport_width" gorm:"default:1280"`
	ViewportHeight          int       `json:"viewport_height" gorm:"default:720"`
	DOMAssertions           string    `json:"dom_assertions,omitempty" gorm:"type:text"` // JSON array of assertions
	CreatedAt               time.Time `json:"created_at"`
	UpdatedAt               time.Time `json:"updated_at"`
}

func (fc *FrontendChallenge) BeforeCreate(tx *gorm.DB) error {
	fc.ID = uuid.New()
	return nil
}

// BattleMatch represents a 1v1 match between two players.
type BattleMatch struct {
	ID                  uuid.UUID          `json:"id" gorm:"type:uuid;primaryKey"`
	ChallengeID         uuid.UUID          `json:"challenge_id" gorm:"type:uuid;not null"`
	Challenge           FrontendChallenge  `json:"challenge,omitempty" gorm:"foreignKey:ChallengeID"`
	PlayerAID           uuid.UUID          `json:"player_a_id" gorm:"type:uuid;not null"`
	PlayerA             User               `json:"player_a,omitempty" gorm:"foreignKey:PlayerAID"`
	PlayerBID           uuid.UUID          `json:"player_b_id" gorm:"type:uuid;not null"`
	PlayerB             User               `json:"player_b,omitempty" gorm:"foreignKey:PlayerBID"`
	Status              string             `json:"status" gorm:"default:'waiting'"` // waiting, ongoing, judging, finished
	WinnerID            *uuid.UUID         `json:"winner_id,omitempty" gorm:"type:uuid"`
	Result              string             `json:"result" gorm:"default:'pending'"` // player_a_wins, player_b_wins, draw, forfeit, pending
	StartTime           *time.Time         `json:"start_time"`
	EndTime             *time.Time         `json:"end_time"`
	TimeLimit           int                `json:"time_limit" gorm:"default:900"` // seconds
	PlayerARatingBefore float64            `json:"player_a_rating_before"`
	PlayerBRatingBefore float64            `json:"player_b_rating_before"`
	PlayerAEloChange    float64            `json:"player_a_elo_change" gorm:"default:0"`
	PlayerBEloChange    float64            `json:"player_b_elo_change" gorm:"default:0"`
	Submissions         []BattleSubmission `json:"submissions,omitempty" gorm:"foreignKey:MatchID;constraint:OnDelete:CASCADE"`
	CreatedAt           time.Time          `json:"created_at"`
	UpdatedAt           time.Time          `json:"updated_at"`
}

func (bm *BattleMatch) BeforeCreate(tx *gorm.DB) error {
	bm.ID = uuid.New()
	return nil
}

// BattleSubmission represents a player's code submission during a battle.
type BattleSubmission struct {
	ID             uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	MatchID        uuid.UUID  `json:"match_id" gorm:"type:uuid;not null;index"`
	PlayerID       uuid.UUID  `json:"player_id" gorm:"type:uuid;not null;index"`
	Player         User       `json:"player,omitempty" gorm:"foreignKey:PlayerID"`
	HTML           string     `json:"html" gorm:"type:text"`
	CSS            string     `json:"css" gorm:"type:text"`
	JS             string     `json:"js" gorm:"type:text"`
	DiffRatio      float64    `json:"diff_ratio" gorm:"default:1.0"`
	Passed         bool       `json:"passed" gorm:"default:false"`
	ScreenshotPath string     `json:"screenshot_path,omitempty"`
	SubmittedAt    time.Time  `json:"submitted_at" gorm:"not null"` // server-side timestamp
	JudgedAt       *time.Time `json:"judged_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (bs *BattleSubmission) BeforeCreate(tx *gorm.DB) error {
	bs.ID = uuid.New()
	return nil
}

// BattleEloHistory tracks rating changes for a user per battle match.
type BattleEloHistory struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID       uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	MatchID      uuid.UUID `json:"match_id" gorm:"type:uuid;not null"`
	RatingBefore float64   `json:"rating_before"`
	RatingAfter  float64   `json:"rating_after"`
	CreatedAt    time.Time `json:"created_at"`
}

func (beh *BattleEloHistory) BeforeCreate(tx *gorm.DB) error {
	beh.ID = uuid.New()
	return nil
}
