package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	ADMIN   = "admin"
	REGULAR = "regular"
)

type User struct {
	ID                 uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	Username           string    `json:"username" gorm:"unique;not null"`
	Email              string    `json:"email" gorm:"uniqueIndex;not null"`
	Password           string    `json:"-" gorm:"not null"`
	Bio                string    `json:"bio,omitempty" gorm:"type:text"`
	ProfileImage       string    `json:"profile_image,omitempty"`
	Rank               int       `json:"rank" gorm:"default:0"`
	Rating             float64   `json:"rating" gorm:"default:1000"`
	MatchesPlayed      int       `json:"matches_played" gorm:"default:0"`
	MatchesWon         int       `json:"matches_won" gorm:"default:0"`
	SubmissionsCount   int       `json:"submissions_count" gorm:"default:0"`
	LanguagePreference string    `json:"language_preference" gorm:"default:'python'"`
	Role               string    `json:"role" gorm:"type:varchar(10);default:'regular'"`
	Code               string    `json:"code,omitempty"`
	Expiry             time.Time `json:"expiry,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(scope *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}
