package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PasswordReset struct {
	ID        uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID  `json:"user_id" gorm:"type:uuid;index"`
	TokenHash string     `json:"-" gorm:"size:64;uniqueIndex;not null"`
	ExpiresAt time.Time  `json:"expires_at"`
	UsedAt    *time.Time `json:"used_at"`
	CreatedAt time.Time  `json:"created_at"`
	User      User       `json:"-" gorm:"foreignKey:UserID"`
}

func (p *PasswordReset) BeforeCreate(scope *gorm.DB) error {
	p.ID = uuid.New()
	return nil
}
