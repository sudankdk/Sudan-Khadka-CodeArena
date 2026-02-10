package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	EASY   = "easy"
	MEDIUM = "medium"
	HARD   = "hard"
)

type Problem struct {
	ID           uuid.UUID     `json:"id" gorm:"type:uuid;primaryKey"`
	MainHeading  string        `json:"main_heading" gorm:"not null"`
	Slug         string        `json:"slug" gorm:"uniqueIndex;not null"`
	Description  string        `json:"description"`
	Tag          string        `json:"tag"`
	Difficulty   string        `json:"difficulty" gorm:"type:varchar(10)"`
	TestCases    []TestCases   `json:"test_cases" gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE"`
	CreatedAt    time.Time     `json:"created_at"`
	UpdatedAt    time.Time     `json:"updated_at"`
	Boilerplates []BoilerPlate `json:"boilerplates" gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE"`
	Contests     []Contest     `json:"contests,omitempty" gorm:"many2many:contest_problems;"`
}

func (u *Problem) BeforeCreate(scope *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}
