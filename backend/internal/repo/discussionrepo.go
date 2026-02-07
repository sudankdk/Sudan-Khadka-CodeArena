package repo

import (
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"gorm.io/gorm"
)

type DiscussionRepo interface {
	CreateDiscussion(discussion *domain.Discussion) error
	GetDiscussionByID(id uuid.UUID) (*domain.Discussion, error)
	UpdateDiscussion(id uuid.UUID, updates map[string]interface{}) error
	DeleteDiscussion(id uuid.UUID) error
	ListDiscussions(opts dto.DiscussionListQueryDTO) ([]domain.Discussion, int64, error)
	IncrementViewCount(id uuid.UUID) error

	// Comments
	CreateComment(comment *domain.DiscussionComment) error
	GetCommentByID(id uuid.UUID) (*domain.DiscussionComment, error)
	UpdateComment(id uuid.UUID, updates map[string]interface{}) error
	DeleteComment(id uuid.UUID) error
	GetCommentsByDiscussionID(discussionID uuid.UUID) ([]domain.DiscussionComment, error)
	GetCommentCount(discussionID uuid.UUID) (int64, error)

	// Votes
	CreateOrUpdateVote(vote *domain.DiscussionVote) error
	DeleteVote(userID, targetID uuid.UUID, targetType string) error
	GetUserVote(userID, targetID uuid.UUID, targetType string) (*domain.DiscussionVote, error)

	// Stats
	GetDiscussionStats() (*dto.DiscussionStatsDTO, error)
}

type discussionRepoImpl struct {
	db *gorm.DB
}

func NewDiscussionRepo(db *gorm.DB) DiscussionRepo {
	return &discussionRepoImpl{db: db}
}

func (r *discussionRepoImpl) CreateDiscussion(discussion *domain.Discussion) error {
	return r.db.Create(discussion).Error
}

func (r *discussionRepoImpl) GetDiscussionByID(id uuid.UUID) (*domain.Discussion, error) {
	var discussion domain.Discussion
	err := r.db.Preload("User").First(&discussion, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &discussion, nil
}

func (r *discussionRepoImpl) UpdateDiscussion(id uuid.UUID, updates map[string]interface{}) error {
	return r.db.Model(&domain.Discussion{}).Where("id = ?", id).Updates(updates).Error
}

func (r *discussionRepoImpl) DeleteDiscussion(id uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete all votes for this discussion
		if err := tx.Where("discussion_id = ?", id).Delete(&domain.DiscussionVote{}).Error; err != nil {
			return err
		}

		// Delete all comments (and their votes)
		var comments []domain.DiscussionComment
		if err := tx.Where("discussion_id = ?", id).Find(&comments).Error; err != nil {
			return err
		}

		for _, comment := range comments {
			if err := tx.Where("comment_id = ?", comment.ID).Delete(&domain.DiscussionVote{}).Error; err != nil {
				return err
			}
		}

		if err := tx.Where("discussion_id = ?", id).Delete(&domain.DiscussionComment{}).Error; err != nil {
			return err
		}

		// Delete the discussion
		return tx.Delete(&domain.Discussion{}, "id = ?", id).Error
	})
}

func (r *discussionRepoImpl) ListDiscussions(opts dto.DiscussionListQueryDTO) ([]domain.Discussion, int64, error) {
	var discussions []domain.Discussion
	var total int64

	query := r.db.Model(&domain.Discussion{}).Preload("User")

	// Filters
	if opts.UserID != nil {
		query = query.Where("user_id = ?", opts.UserID)
	}
	if opts.Tag != "" {
		query = query.Where("tags LIKE ?", "%"+opts.Tag+"%")
	}
	if opts.IsSolved != nil {
		query = query.Where("is_solved = ?", *opts.IsSolved)
	}
	if opts.Search != "" {
		searchPattern := "%" + opts.Search + "%"
		query = query.Where("title LIKE ? OR content LIKE ?", searchPattern, searchPattern)
	}

	// Sorting
	switch opts.SortBy {
	case "popular":
		query = query.Order("view_count DESC, created_at DESC")
	case "most_voted":
		query = query.Order("(upvotes - downvotes) DESC, created_at DESC")
	default: // "newest"
		query = query.Order("created_at DESC")
	}

	// Pagination
	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
	}
	if opts.Offset > 0 {
		query = query.Offset(opts.Offset)
	}

	err := query.Find(&discussions).Error
	return discussions, total, err
}

func (r *discussionRepoImpl) IncrementViewCount(id uuid.UUID) error {
	return r.db.Model(&domain.Discussion{}).Where("id = ?", id).UpdateColumn("view_count", gorm.Expr("view_count + ?", 1)).Error
}

// Comments
func (r *discussionRepoImpl) CreateComment(comment *domain.DiscussionComment) error {
	return r.db.Create(comment).Error
}

func (r *discussionRepoImpl) GetCommentByID(id uuid.UUID) (*domain.DiscussionComment, error) {
	var comment domain.DiscussionComment
	err := r.db.Preload("User").First(&comment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *discussionRepoImpl) UpdateComment(id uuid.UUID, updates map[string]interface{}) error {
	return r.db.Model(&domain.DiscussionComment{}).Where("id = ?", id).Updates(updates).Error
}

func (r *discussionRepoImpl) DeleteComment(id uuid.UUID) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete votes for this comment
		if err := tx.Where("comment_id = ?", id).Delete(&domain.DiscussionVote{}).Error; err != nil {
			return err
		}

		// Delete replies
		if err := tx.Where("parent_id = ?", id).Delete(&domain.DiscussionComment{}).Error; err != nil {
			return err
		}

		// Delete the comment
		return tx.Delete(&domain.DiscussionComment{}, "id = ?", id).Error
	})
}

func (r *discussionRepoImpl) GetCommentsByDiscussionID(discussionID uuid.UUID) ([]domain.DiscussionComment, error) {
	var comments []domain.DiscussionComment
	err := r.db.Where("discussion_id = ?", discussionID).
		Preload("User").
		Preload("Replies.User").
		Order("created_at ASC").
		Find(&comments).Error
	return comments, err
}

func (r *discussionRepoImpl) GetCommentCount(discussionID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.DiscussionComment{}).Where("discussion_id = ?", discussionID).Count(&count).Error
	return count, err
}

// Votes
func (r *discussionRepoImpl) CreateOrUpdateVote(vote *domain.DiscussionVote) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Find existing vote
		var existing domain.DiscussionVote
		var query *gorm.DB

		if vote.DiscussionID != nil {
			query = tx.Where("user_id = ? AND discussion_id = ?", vote.UserID, vote.DiscussionID)
		} else if vote.CommentID != nil {
			query = tx.Where("user_id = ? AND comment_id = ?", vote.UserID, vote.CommentID)
		}

		err := query.First(&existing).Error

		if err == gorm.ErrRecordNotFound {
			// Create new vote
			if err := tx.Create(vote).Error; err != nil {
				return err
			}
			return r.updateVoteCounts(tx, vote, 1)
		} else if err != nil {
			return err
		}

		// Update existing vote
		if existing.VoteType != vote.VoteType {
			// Reverse old vote and apply new vote
			if err := r.updateVoteCounts(tx, &existing, -1); err != nil {
				return err
			}
			if err := tx.Model(&existing).Update("vote_type", vote.VoteType).Error; err != nil {
				return err
			}
			return r.updateVoteCounts(tx, vote, 1)
		}

		return nil
	})
}

func (r *discussionRepoImpl) updateVoteCounts(tx *gorm.DB, vote *domain.DiscussionVote, delta int) error {
	var field string
	if vote.VoteType == "upvote" {
		field = "upvotes"
	} else {
		field = "downvotes"
	}

	if vote.DiscussionID != nil {
		return tx.Model(&domain.Discussion{}).Where("id = ?", vote.DiscussionID).
			UpdateColumn(field, gorm.Expr(field+" + ?", delta)).Error
	} else if vote.CommentID != nil {
		return tx.Model(&domain.DiscussionComment{}).Where("id = ?", vote.CommentID).
			UpdateColumn(field, gorm.Expr(field+" + ?", delta)).Error
	}
	return nil
}

func (r *discussionRepoImpl) DeleteVote(userID, targetID uuid.UUID, targetType string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var vote domain.DiscussionVote
		var query *gorm.DB

		if targetType == "discussion" {
			query = tx.Where("user_id = ? AND discussion_id = ?", userID, targetID)
		} else {
			query = tx.Where("user_id = ? AND comment_id = ?", userID, targetID)
		}

		if err := query.First(&vote).Error; err != nil {
			return err
		}

		if err := r.updateVoteCounts(tx, &vote, -1); err != nil {
			return err
		}

		return tx.Delete(&vote).Error
	})
}

func (r *discussionRepoImpl) GetUserVote(userID, targetID uuid.UUID, targetType string) (*domain.DiscussionVote, error) {
	var vote domain.DiscussionVote
	var query *gorm.DB

	if targetType == "discussion" {
		query = r.db.Where("user_id = ? AND discussion_id = ?", userID, targetID)
	} else {
		query = r.db.Where("user_id = ? AND comment_id = ?", userID, targetID)
	}

	err := query.First(&vote).Error
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &vote, err
}

func (r *discussionRepoImpl) GetDiscussionStats() (*dto.DiscussionStatsDTO, error) {
	var stats dto.DiscussionStatsDTO

	if err := r.db.Model(&domain.Discussion{}).Count(&stats.TotalDiscussions).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&domain.Discussion{}).Where("is_solved = ?", true).Count(&stats.SolvedCount).Error; err != nil {
		return nil, err
	}

	if err := r.db.Model(&domain.DiscussionComment{}).Count(&stats.TotalComments).Error; err != nil {
		return nil, err
	}

	return &stats, nil
}
