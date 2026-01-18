package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BoilerPlate struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	ProblemID uuid.UUID `json:"problem_id" gorm:"not null"`
	Language  string    `json:"language" gorm:"not null"`
	Code      string    `json:"code" gorm:"type:text"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *BoilerPlate) BeforeCreate(scope *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}
