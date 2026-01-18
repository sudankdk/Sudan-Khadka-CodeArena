package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreateTestCaseDTO struct {
	Input    string `json:"input" binding:"required"`
	Expected string `json:"expected" binding:"required"`
}

type CreateTestCaseWithProblemDTO struct {
	Input     string    `json:"input" binding:"required"`
	Expected  string    `json:"expected" binding:"required"`
	ProblemID uuid.UUID `json:"problem_id" binding:"required"`
}

type CreateProblemDTO struct {
	MainHeading  string                 `json:"main_heading" binding:"required"`
	Slug         string                 `json:"slug" binding:"omitempty"`
	Description  string                 `json:"description" binding:"omitempty"`
	Tag          string                 `json:"tag" binding:"omitempty"`
	Difficulty   string                 `json:"difficulty" binding:"omitempty,oneof=easy medium hard"`
	TestCases    []CreateTestCaseDTO    `json:"test_cases" binding:"omitempty,dive"`
	Boilerplates []CreateBoilerplateDTO `json:"boilerplates" binding:"omitempty,dive"`
}

type TestCaseResponseDTO struct {
	ID        string    `json:"id"`
	Input     string    `json:"input"`
	Expected  string    `json:"expected"`
	ProblemID string    `json:"problem_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ProblemResponseDTO struct {
	ID           string                   `json:"id"`
	MainHeading  string                   `json:"main_heading"`
	Slug         string                   `json:"slug"`
	Description  string                   `json:"description"`
	Tag          string                   `json:"tag"`
	Difficulty   string                   `json:"difficulty"`
	TestCases    []TestCaseResponseDTO    `json:"test_cases,omitempty"`
	Boilerplates []BoilerplateResponseDTO `json:"boilerplates,omitempty"`
	CreatedAt    time.Time                `json:"created_at"`
	UpdatedAt    time.Time                `json:"updated_at"`
}

type ProblemListQueryDTO struct {
	Limit      int    `query:"limit"`
	Offset     int    `query:"offset"`
	Difficulty string `query:"difficulty"`
	Search     string `query:"search"`
	Testcases  bool   `query:"test-cases"`
	Page       string `query:"page"`
}

type ProblemListResponse struct {
	Problems []ProblemResponseDTO `json:"problems"`
	Total    int64                `json:"total"`
	Page     int                  `json:"page"`
	PageSize int                  `json:"page_size"`
}

type CreateBoilerplateDTO struct {
	Language string `json:"language" binding:"required"` // e.g., "python", "go"
	Code     string `json:"code" binding:"required"`
}

type BoilerplateResponseDTO struct {
	ID        string    `json:"id"`
	Language  string    `json:"language"`
	Code      string    `json:"code"`
	ProblemID string    `json:"problem_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
