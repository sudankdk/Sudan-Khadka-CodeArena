package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TestCases struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Input     string    `json:"input"`
	Expected  string    `json:"expected"`
	ProblemID uuid.UUID `json:"problem_id" gorm:"type:uuid;not null;constraint:OnDelete:CASCADE"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *TestCases) BeforeCreate(scope *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}
