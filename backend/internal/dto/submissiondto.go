package dto

import "github.com/google/uuid"

type CreateSubmissionDTO struct {
	ProblemID       uuid.UUID  `json:"problem_id" validate:"required"`
	ContestID       *uuid.UUID `json:"contest_id,omitempty"` // Optional: NULL for practice, UUID for contest
	Language        string     `json:"language" validate:"required,oneof=py js go cpp java"`
	Code            string     `json:"code" validate:"required"`
	Status          string     `json:"status" validate:"required"`
	ExecutionTime   int        `json:"execution_time"`
	MemoryUsed      int        `json:"memory_used"`
	TestCasesPassed int        `json:"test_cases_passed"`
	TotalTestCases  int        `json:"total_test_cases"`
	ErrorMessage    string     `json:"error_message,omitempty"`
}

type SubmissionListQueryDTO struct {
	UserID    *uuid.UUID `query:"user_id"`
	ProblemID *uuid.UUID `query:"problem_id"`
	Status    string     `query:"status"`
	Language  string     `query:"language"`
	Limit     int        `query:"limit"`
	Offset    int        `query:"offset"`
}

type SubmissionResponseDTO struct {
	ID              uuid.UUID  `json:"id"`
	UserID          uuid.UUID  `json:"user_id"`
	ProblemID       uuid.UUID  `json:"problem_id"`
	ContestID       *uuid.UUID `json:"contest_id,omitempty"`
	ProblemSlug     string     `json:"problem_slug"`
	ProblemTitle    string     `json:"problem_title"`
	Difficulty      string     `json:"difficulty"`
	Language        string     `json:"language"`
	Status          string     `json:"status"`
	ExecutionTime   int        `json:"execution_time"`
	MemoryUsed      int        `json:"memory_used"`
	TestCasesPassed int        `json:"test_cases_passed"`
	TotalTestCases  int        `json:"total_test_cases"`
	PointsEarned    int        `json:"points_earned"`
	CreatedAt       string     `json:"created_at"`
}

type UserStatsDTO struct {
	TotalSubmissions  int                     `json:"total_submissions"`
	AcceptedCount     int                     `json:"accepted_count"`
	AcceptanceRate    float64                 `json:"acceptance_rate"`
	EasySolved        int                     `json:"easy_solved"`
	MediumSolved      int                     `json:"medium_solved"`
	HardSolved        int                     `json:"hard_solved"`
	TotalSolved       int                     `json:"total_solved"`
	RecentSubmissions []SubmissionResponseDTO `json:"recent_submissions"`
}

type ProblemStatsDTO struct {
	ProblemID        uuid.UUID `json:"problem_id"`
	TotalSubmissions int       `json:"total_submissions"`
	AcceptedCount    int       `json:"accepted_count"`
	AcceptanceRate   float64   `json:"acceptance_rate"`
}

type TopicStatsDTO struct {
	Tag   string `json:"tag"`
	Count int    `json:"count"`
}
