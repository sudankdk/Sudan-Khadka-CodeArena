package dto

import (
	"time"

	"github.com/google/uuid"
)

type CreateRoadmapDTO struct {
	Name          string   `json:"name" validate:"required,min=3,max=120"`
	Description   string   `json:"description" validate:"omitempty,max=500"`
	Visibility    string   `json:"visibility" validate:"omitempty,oneof=private public"`
	Topics        []string `json:"topics"`
	TotalProblems int      `json:"total_problems"`
}

type UpdateRoadmapDTO struct {
	Name          *string  `json:"name,omitempty" validate:"omitempty,min=3,max=120"`
	Description   *string  `json:"description,omitempty" validate:"omitempty,max=500"`
	Visibility    *string  `json:"visibility,omitempty" validate:"omitempty,oneof=private public"`
	Topics        []string `json:"topics,omitempty"`
	TotalProblems *int     `json:"total_problems,omitempty"`
}

type UpdateRoadmapProgressDTO struct {
	Progress int `json:"progress" validate:"min=0,max=100"`
}

type RoadmapResponseDTO struct {
	ID            uuid.UUID `json:"id"`
	UserID        uuid.UUID `json:"user_id"`
	AuthorName    string    `json:"author_name"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	Visibility    string    `json:"visibility"`
	Topics        []string  `json:"topics"`
	TotalProblems int       `json:"total_problems"`
	Progress      int       `json:"progress"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
