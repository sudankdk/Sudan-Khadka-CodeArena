package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Contest struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Name            string    `json:"name" gorm:"not null"`
	Description     string    `json:"description" gorm:"type:text"`
	StartTime       time.Time `json:"start_time" gorm:"not null"`
	EndTime         time.Time `json:"end_time" gorm:"not null"`
	Duration        int       `json:"duration" gorm:"not null"`          // Duration in minutes
	MaxParticipants int       `json:"max_participants" gorm:"default:0"` // 0 = unlimited
	IsActive        bool      `json:"is_active" gorm:"default:false"`
	IsRated         bool      `json:"is_rated" gorm:"default:true"` // Whether contest affects user ratings
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relationships (explicit join tables for metadata)
	Problems     []ContestProblem          `json:"problems" gorm:"foreignKey:ContestID;constraint:OnDelete:CASCADE"`
	Participants []ContestParticipant      `json:"participants" gorm:"foreignKey:ContestID;constraint:OnDelete:CASCADE"`
	Leaderboard  []ContestLeaderboardEntry `json:"leaderboard" gorm:"foreignKey:ContestID;constraint:OnDelete:CASCADE"`
}

// ContestProblem represents a problem in a specific contest with scoring metadata
type ContestProblem struct {
	ID             uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ContestID      uuid.UUID `json:"contest_id" gorm:"type:uuid;not null;index"`
	Contest        Contest   `json:"contest" gorm:"foreignKey:ContestID;constraint:OnDelete:CASCADE"`
	ProblemID      uuid.UUID `json:"problem_id" gorm:"type:uuid;not null;index"`
	Problem        Problem   `json:"problem" gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE"`
	OrderIndex     int       `json:"order_index" gorm:"not null"`            // Problem order in contest (1, 2, 3...)
	MaxPoints      int       `json:"max_points" gorm:"not null;default:100"` // Max points for solving this problem
	PartialCredit  bool      `json:"partial_credit" gorm:"default:false"`    // Allow partial points for partial test cases
	TimeMultiplier float64   `json:"time_multiplier" gorm:"default:1.0"`     // Multiplier for time-based scoring
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// ContestParticipant represents a user's participation in a specific contest with scoring data
type ContestParticipant struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ContestID uuid.UUID `json:"contest_id" gorm:"type:uuid;not null;index"`
	Contest   Contest   `json:"-" gorm:"foreignKey:ContestID;constraint:OnDelete:CASCADE"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	User      User      `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`

	// Scoring and Performance Metrics
	TotalPoints       int     `json:"total_points" gorm:"default:0;index"` // Total points earned in this contest
	ProblemsSolved    int     `json:"problems_solved" gorm:"default:0"`    // Number of problems solved
	ProblemsAttempted int     `json:"problems_attempted" gorm:"default:0"` // Number of problems attempted
	PenaltyTime       int     `json:"penalty_time" gorm:"default:0"`       // Total penalty time in minutes
	Rank              int     `json:"rank" gorm:"default:0;index"`         // Final rank in contest
	RatingChange      int     `json:"rating_change" gorm:"default:0"`      // Rating gained/lost (+50, -20, etc.)
	OldRating         float64 `json:"old_rating" gorm:"default:1000"`      // Rating before contest
	NewRating         float64 `json:"new_rating" gorm:"default:1000"`      // Rating after contest

	// Timestamps
	RegisteredAt     time.Time  `json:"registered_at"`                // When user registered for contest
	StartedAt        *time.Time `json:"started_at,omitempty"`         // When user started the contest
	LastSubmissionAt *time.Time `json:"last_submission_at,omitempty"` // Last submission time
	FinishedAt       *time.Time `json:"finished_at,omitempty"`        // When user finished (optional)
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

func (c *Contest) BeforeCreate(tx *gorm.DB) error {
	c.ID = uuid.New()
	return nil
}

func (cp *ContestProblem) BeforeCreate(tx *gorm.DB) error {
	cp.ID = uuid.New()
	return nil
}

func (cp *ContestParticipant) BeforeCreate(tx *gorm.DB) error {
	cp.ID = uuid.New()
	if cp.RegisteredAt.IsZero() {
		cp.RegisteredAt = time.Now()
	}
	return nil
}
