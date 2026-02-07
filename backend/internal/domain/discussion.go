package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Discussion struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primaryKey"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null;index"`
	Title     string    `json:"title" gorm:"not null"`
	Content   string    `json:"content" gorm:"type:text;not null"`
	Tags      string    `json:"tags,omitempty"` // Comma-separated tags
	Upvotes   int       `json:"upvotes" gorm:"default:0"`
	Downvotes int       `json:"downvotes" gorm:"default:0"`
	ViewCount int       `json:"view_count" gorm:"default:0"`
	IsSolved  bool      `json:"is_solved" gorm:"default:false"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	// Relations
	User     User                `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Comments []DiscussionComment `json:"comments,omitempty" gorm:"foreignKey:DiscussionID"`
}

func (d *Discussion) BeforeCreate(db *gorm.DB) error {
	d.ID = uuid.New()
	return nil
}

type DiscussionComment struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	DiscussionID uuid.UUID  `json:"discussion_id" gorm:"type:uuid;not null;index"`
	UserID       uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	ParentID     *uuid.UUID `json:"parent_id,omitempty" gorm:"type:uuid;index"` // For nested replies
	Content      string     `json:"content" gorm:"type:text;not null"`
	Upvotes      int        `json:"upvotes" gorm:"default:0"`
	Downvotes    int        `json:"downvotes" gorm:"default:0"`
	IsSolution   bool       `json:"is_solution" gorm:"default:false"` // Mark as solution to the problem
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`

	// Relations
	User       User                `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Discussion Discussion          `json:"discussion,omitempty" gorm:"foreignKey:DiscussionID"`
	Parent     *DiscussionComment  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Replies    []DiscussionComment `json:"replies,omitempty" gorm:"foreignKey:ParentID"`
}

func (dc *DiscussionComment) BeforeCreate(db *gorm.DB) error {
	dc.ID = uuid.New()
	return nil
}

type DiscussionVote struct {
	ID           uuid.UUID  `json:"id" gorm:"type:uuid;primaryKey"`
	DiscussionID *uuid.UUID `json:"discussion_id,omitempty" gorm:"type:uuid;index"`
	CommentID    *uuid.UUID `json:"comment_id,omitempty" gorm:"type:uuid;index"`
	UserID       uuid.UUID  `json:"user_id" gorm:"type:uuid;not null;index"`
	VoteType     string     `json:"vote_type" gorm:"type:varchar(10);not null"` // "upvote" or "downvote"
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (dv *DiscussionVote) BeforeCreate(db *gorm.DB) error {
	dv.ID = uuid.New()
	return nil
}
