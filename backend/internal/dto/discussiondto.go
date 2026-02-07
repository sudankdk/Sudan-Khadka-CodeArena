package dto

import (
	"time"

	"github.com/google/uuid"
)

// Discussion DTOs
type CreateDiscussionDTO struct {
	Title   string `json:"title" validate:"required,min=5,max=200"`
	Content string `json:"content" validate:"required,min=10"`
	Tags    string `json:"tags,omitempty"`
}

type UpdateDiscussionDTO struct {
	Title    string `json:"title,omitempty" validate:"omitempty,min=5,max=200"`
	Content  string `json:"content,omitempty" validate:"omitempty,min=10"`
	Tags     string `json:"tags,omitempty"`
	IsSolved *bool  `json:"is_solved,omitempty"`
}

type DiscussionResponseDTO struct {
	ID           uuid.UUID `json:"id"`
	UserID       uuid.UUID `json:"user_id"`
	Username     string    `json:"username"`
	UserImage    string    `json:"user_image,omitempty"`
	Title        string    `json:"title"`
	Content      string    `json:"content"`
	Tags         []string  `json:"tags,omitempty"`
	Upvotes      int       `json:"upvotes"`
	Downvotes    int       `json:"downvotes"`
	ViewCount    int       `json:"view_count"`
	IsSolved     bool      `json:"is_solved"`
	CommentCount int       `json:"comment_count"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type DiscussionListQueryDTO struct {
	UserID   *uuid.UUID `query:"user_id"`
	Tag      string     `query:"tag"`
	IsSolved *bool      `query:"is_solved"`
	Search   string     `query:"search"`
	SortBy   string     `query:"sort_by"` // "newest", "popular", "most_voted"
	Limit    int        `query:"limit"`
	Offset   int        `query:"offset"`
}

// Comment DTOs
type CreateCommentDTO struct {
	DiscussionID uuid.UUID  `json:"discussion_id" validate:"required"`
	ParentID     *uuid.UUID `json:"parent_id,omitempty"`
	Content      string     `json:"content" validate:"required,min=1"`
}

type UpdateCommentDTO struct {
	Content    string `json:"content,omitempty" validate:"omitempty,min=1"`
	IsSolution *bool  `json:"is_solution,omitempty"`
}

type CommentResponseDTO struct {
	ID           uuid.UUID            `json:"id"`
	DiscussionID uuid.UUID            `json:"discussion_id"`
	UserID       uuid.UUID            `json:"user_id"`
	Username     string               `json:"username"`
	UserImage    string               `json:"user_image,omitempty"`
	ParentID     *uuid.UUID           `json:"parent_id,omitempty"`
	Content      string               `json:"content"`
	Upvotes      int                  `json:"upvotes"`
	Downvotes    int                  `json:"downvotes"`
	IsSolution   bool                 `json:"is_solution"`
	CreatedAt    time.Time            `json:"created_at"`
	UpdatedAt    time.Time            `json:"updated_at"`
	Replies      []CommentResponseDTO `json:"replies,omitempty"`
}

// Vote DTOs
type VoteRequestDTO struct {
	TargetID   uuid.UUID `json:"target_id" validate:"required"` // Discussion or Comment ID
	TargetType string    `json:"target_type" validate:"required,oneof=discussion comment"`
	VoteType   string    `json:"vote_type" validate:"required,oneof=upvote downvote"`
}

type DiscussionStatsDTO struct {
	TotalDiscussions int64 `json:"total_discussions"`
	SolvedCount      int64 `json:"solved_count"`
	TotalComments    int64 `json:"total_comments"`
}
