package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	STATUS_ACCEPTED      = "accepted"
	STATUS_WRONG_ANSWER  = "wrong_answer"
	STATUS_RUNTIME_ERROR = "runtime_error"
	STATUS_COMPILE_ERROR = "compile_error"
	STATUS_TIME_LIMIT    = "time_limit_exceeded"
	STATUS_MEMORY_LIMIT  = "memory_limit_exceeded"
)

type Submission struct {
	ID              uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID          uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	ProblemID       uuid.UUID `json:"problem_id" gorm:"type:uuid;not null;index"`
	Language        string    `json:"language" gorm:"not null"`
	Code            string    `json:"code" gorm:"type:text;not null"`
	Status          string    `json:"status" gorm:"type:varchar(50);not null;index"`
	ExecutionTime   int       `json:"execution_time"` // in milliseconds
	MemoryUsed      int       `json:"memory_used"`    // in KB
	TestCasesPassed int       `json:"test_cases_passed" gorm:"default:0"`
	TotalTestCases  int       `json:"total_test_cases" gorm:"default:0"`
	ErrorMessage    string    `json:"error_message,omitempty" gorm:"type:text"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`

	// Relations
	User    User    `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Problem Problem `json:"problem,omitempty" gorm:"foreignKey:ProblemID"`
}

func (s *Submission) BeforeCreate(db *gorm.DB) error {
	s.ID = uuid.New()
	return nil
}
