package dto

import "time"

type CreateTestCaseDTO struct {
	Input    string `json:"input" binding:"required"`
	Expected string `json:"expected" binding:"required"`
}

type CreateProblemDTO struct {
	MainHeading string              `json:"main_heading" binding:"required"`
	Slug        string              `json:"slug" binding:"omitempty"`
	Description string              `json:"description" binding:"omitempty"`
	Tag         string              `json:"tag" binding:"omitempty"`
	Difficulty  string              `json:"difficulty" binding:"omitempty,oneof=easy medium hard"`
	TestCases   []CreateTestCaseDTO `json:"test_cases" binding:"omitempty,dive"`
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
	ID          string                `json:"id"`
	MainHeading string                `json:"main_heading"`
	Slug        string                `json:"slug"`
	Description string                `json:"description"`
	Tag         string                `json:"tag"`
	Difficulty  string                `json:"difficulty"`
	TestCases   []TestCaseResponseDTO `json:"test_cases,omitempty"`
	CreatedAt   time.Time             `json:"created_at"`
	UpdatedAt   time.Time             `json:"updated_at"`
}
