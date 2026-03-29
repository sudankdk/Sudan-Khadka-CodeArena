package dto

import (
	"time"

	"github.com/google/uuid"
)

type RoadmapProblemSummary struct {
	ID         uuid.UUID `json:"id"`
	Slug       string    `json:"slug"`
	Title      string    `json:"title"`
	Difficulty string    `json:"difficulty"`
}

type CreateRoadmapDTO struct {
	Name          string      `json:"name" validate:"required,min=3,max=120"`
	Description   string      `json:"description" validate:"omitempty,max=500"`
	Visibility    string      `json:"visibility" validate:"omitempty,oneof=private public"`
	Topics        []string    `json:"topics"`
	ProblemIDs    []uuid.UUID `json:"problem_ids"`
	TotalProblems int         `json:"total_problems"`
}

type UpdateRoadmapDTO struct {
	Name          *string     `json:"name,omitempty" validate:"omitempty,min=3,max=120"`
	Description   *string     `json:"description,omitempty" validate:"omitempty,max=500"`
	Visibility    *string     `json:"visibility,omitempty" validate:"omitempty,oneof=private public"`
	Topics        []string    `json:"topics,omitempty"`
	ProblemIDs    []uuid.UUID `json:"problem_ids,omitempty"`
	TotalProblems *int        `json:"total_problems,omitempty"`
}

type UpdateRoadmapProgressDTO struct {
	Progress int `json:"progress" validate:"min=0,max=100"`
}

type RoadmapResponseDTO struct {
	ID            uuid.UUID               `json:"id"`
	UserID        uuid.UUID               `json:"user_id"`
	AuthorName    string                  `json:"author_name"`
	Name          string                  `json:"name"`
	Description   string                  `json:"description"`
	Visibility    string                  `json:"visibility"`
	Topics        []string                `json:"topics"`
	ProblemIDs    []uuid.UUID             `json:"problem_ids"`
	Problems      []RoadmapProblemSummary `json:"problems,omitempty"`
	TotalProblems int                     `json:"total_problems"`
	Progress      int                     `json:"progress"`
	CreatedAt     time.Time               `json:"created_at"`
	UpdatedAt     time.Time               `json:"updated_at"`
}
