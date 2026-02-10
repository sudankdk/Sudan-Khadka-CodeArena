package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GlobalLeaderboardEntry represents a snapshot of user's global ranking
type GlobalLeaderboardEntry struct {
	ID                   uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID               uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	User                 User      `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Username             string    `json:"username" gorm:"not null;index"`
	Rating               float64   `json:"rating" gorm:"not null;default:1000"`
	Rank                 int       `json:"rank" gorm:"not null;index"`
	SolvedCount          int       `json:"solved_count" gorm:"default:0"`
	ContestsParticipated int       `json:"contests_participated" gorm:"default:0"`
	Increment            int       `json:"increment" gorm:"default:0"` // Rank improvement
	Decrement            int       `json:"decrement" gorm:"default:0"` // Rank drop
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

func (g *GlobalLeaderboardEntry) BeforeCreate(tx *gorm.DB) error {
	g.ID = uuid.New()
	return nil
}

// ContestLeaderboardEntry represents a user's ranking in a specific contest
type ContestLeaderboardEntry struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ContestID uuid.UUID `json:"contest_id" gorm:"type:uuid;not null;index"`
	Contest   Contest   `json:"contest" gorm:"foreignKey:ContestID;constraint:OnDelete:CASCADE"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	User      User      `json:"user" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	Username  string    `json:"username" gorm:"not null"`
	Score     int       `json:"score" gorm:"default:0"`     // Total score in contest
	Rating    float64   `json:"rating" gorm:"default:1000"` // Rating after contest
	Rank      int       `json:"rank" gorm:"not null;index"` // Rank in this contest
	Solved    int       `json:"solved" gorm:"default:0"`    // Problems solved in contest
	Penalty   int       `json:"penalty" gorm:"default:0"`   // Time penalty (optional)
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (c *ContestLeaderboardEntry) BeforeCreate(tx *gorm.DB) error {
	c.ID = uuid.New()
	return nil
}
