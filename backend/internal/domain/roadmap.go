package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	RoadmapVisibilityPrivate = "private"
	RoadmapVisibilityPublic  = "public"
)

type Roadmap struct {
	ID            uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID        uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	Name          string    `json:"name" gorm:"not null"`
	Description   string    `json:"description" gorm:"type:text"`
	Visibility    string    `json:"visibility" gorm:"type:varchar(10);default:'private'"`
	Topics        []string  `json:"topics" gorm:"type:jsonb;serializer:json;default:'[]'"`
	TotalProblems int       `json:"total_problems" gorm:"default:0"`
	Progress      int       `json:"progress" gorm:"default:0"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`

	User User `json:"user,omitempty" gorm:"foreignKey:UserID"`
}

func (r *Roadmap) BeforeCreate(tx *gorm.DB) error {
	r.ID = uuid.New()
	return nil
}
