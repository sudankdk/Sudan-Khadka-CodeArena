package service

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/repo"
)

type DiscussionService struct {
	Repo     repo.DiscussionRepo
	UserRepo repo.UserRepo
	Auth     helper.Auth
	Config   configs.AppConfigs
}

func (ds *DiscussionService) CreateDiscussion(userID uuid.UUID, req dto.CreateDiscussionDTO) (*domain.Discussion, error) {
	discussion := &domain.Discussion{
		UserID:  userID,
		Title:   req.Title,
		Content: req.Content,
		Tags:    req.Tags,
	}
	if err := ds.Repo.CreateDiscussion(discussion); err != nil {
		return nil, err
	}

	return ds.Repo.GetDiscussionByID(discussion.ID)
}

func (ds *DiscussionService) GetDiscussionByID(id uuid.UUID, incrementView bool) (*dto.DiscussionResponseDTO, error) {
	discussion, err := ds.Repo.GetDiscussionByID(id)
	if err != nil {
		return nil, err
	}

	if incrementView {
		_ = ds.Repo.IncrementViewCount(id)
	}

	commentCount, _ := ds.Repo.GetCommentCount(id)

	return ds.toDiscussionResponse(discussion, int(commentCount)), nil
}

func (ds *DiscussionService) UpdateDiscussion(id, userID uuid.UUID, req dto.UpdateDiscussionDTO) (*dto.DiscussionResponseDTO, error) {
	discussion, err := ds.Repo.GetDiscussionByID(id)
	if err != nil {
		return nil, err
	}

	if discussion.UserID != userID {
		return nil, errors.New("unauthorized to update this discussion")
	}

	updates := make(map[string]interface{})
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.Tags != "" {
		updates["tags"] = req.Tags
	}
	if req.IsSolved != nil {
		updates["is_solved"] = *req.IsSolved
	}

	if len(updates) > 0 {
		if err := ds.Repo.UpdateDiscussion(id, updates); err != nil {
			return nil, err
		}
	}

	return ds.GetDiscussionByID(id, false)
}

func (ds *DiscussionService) DeleteDiscussion(id, userID uuid.UUID) error {
	discussion, err := ds.Repo.GetDiscussionByID(id)
	if err != nil {
		return err
	}

	if discussion.UserID != userID {
		return errors.New("unauthorized to delete this discussion")
	}

	return ds.Repo.DeleteDiscussion(id)
}

func (ds *DiscussionService) ListDiscussions(opts dto.DiscussionListQueryDTO) ([]dto.DiscussionResponseDTO, int64, error) {
	discussions, total, err := ds.Repo.ListDiscussions(opts)
	if err != nil {
		return nil, 0, err
	}

	response := make([]dto.DiscussionResponseDTO, len(discussions))
	for i, disc := range discussions {
		commentCount, _ := ds.Repo.GetCommentCount(disc.ID)
		response[i] = *ds.toDiscussionResponse(&disc, int(commentCount))
	}

	return response, total, nil
}

// Comments
func (ds *DiscussionService) CreateComment(userID uuid.UUID, req dto.CreateCommentDTO) (*dto.CommentResponseDTO, error) {
	comment := &domain.DiscussionComment{
		DiscussionID: req.DiscussionID,
		UserID:       userID,
		ParentID:     req.ParentID,
		Content:      req.Content,
	}

	if err := ds.Repo.CreateComment(comment); err != nil {
		return nil, err
	}

	created, err := ds.Repo.GetCommentByID(comment.ID)
	if err != nil {
		return nil, err
	}

	return ds.toCommentResponse(created), nil
}

func (ds *DiscussionService) UpdateComment(id, userID uuid.UUID, req dto.UpdateCommentDTO) (*dto.CommentResponseDTO, error) {
	comment, err := ds.Repo.GetCommentByID(id)
	if err != nil {
		return nil, err
	}

	if comment.UserID != userID {
		return nil, errors.New("unauthorized to update this comment")
	}

	updates := make(map[string]interface{})
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.IsSolution != nil {
		updates["is_solution"] = *req.IsSolution

		// If marking as solution, mark discussion as solved
		if *req.IsSolution {
			_ = ds.Repo.UpdateDiscussion(comment.DiscussionID, map[string]interface{}{"is_solved": true})
		}
	}

	if len(updates) > 0 {
		if err := ds.Repo.UpdateComment(id, updates); err != nil {
			return nil, err
		}
	}

	updated, err := ds.Repo.GetCommentByID(id)
	if err != nil {
		return nil, err
	}

	return ds.toCommentResponse(updated), nil
}

func (ds *DiscussionService) DeleteComment(id, userID uuid.UUID) error {
	comment, err := ds.Repo.GetCommentByID(id)
	if err != nil {
		return err
	}

	if comment.UserID != userID {
		return errors.New("unauthorized to delete this comment")
	}

	return ds.Repo.DeleteComment(id)
}

func (ds *DiscussionService) GetCommentsByDiscussionID(discussionID uuid.UUID) ([]dto.CommentResponseDTO, error) {
	comments, err := ds.Repo.GetCommentsByDiscussionID(discussionID)
	if err != nil {
		return nil, err
	}

	// Build a tree structure for comments with replies
	commentMap := make(map[uuid.UUID]*dto.CommentResponseDTO)
	rootComments := []dto.CommentResponseDTO{}

	for _, c := range comments {
		resp := ds.toCommentResponse(&c)
		resp.Replies = []dto.CommentResponseDTO{}
		commentMap[c.ID] = resp
	}

	for _, c := range comments {
		resp := commentMap[c.ID]
		if c.ParentID == nil {
			rootComments = append(rootComments, *resp)
		} else {
			if parent, ok := commentMap[*c.ParentID]; ok {
				parent.Replies = append(parent.Replies, *resp)
			}
		}
	}

	return rootComments, nil
}

// Votes
func (ds *DiscussionService) VoteOnTarget(userID uuid.UUID, req dto.VoteRequestDTO) error {
	vote := &domain.DiscussionVote{
		UserID:   userID,
		VoteType: req.VoteType,
	}

	if req.TargetType == "discussion" {
		vote.DiscussionID = &req.TargetID
	} else {
		vote.CommentID = &req.TargetID
	}

	return ds.Repo.CreateOrUpdateVote(vote)
}

func (ds *DiscussionService) RemoveVote(userID, targetID uuid.UUID, targetType string) error {
	return ds.Repo.DeleteVote(userID, targetID, targetType)
}

func (ds *DiscussionService) GetUserVote(userID, targetID uuid.UUID, targetType string) (*domain.DiscussionVote, error) {
	return ds.Repo.GetUserVote(userID, targetID, targetType)
}

func (ds *DiscussionService) GetDiscussionStats() (*dto.DiscussionStatsDTO, error) {
	return ds.Repo.GetDiscussionStats()
}

// Helper functions
func (ds *DiscussionService) toDiscussionResponse(d *domain.Discussion, commentCount int) *dto.DiscussionResponseDTO {
	tags := []string{}
	if d.Tags != "" {
		tags = strings.Split(d.Tags, ",")
		for i := range tags {
			tags[i] = strings.TrimSpace(tags[i])
		}
	}

	resp := &dto.DiscussionResponseDTO{
		ID:           d.ID,
		UserID:       d.UserID,
		Title:        d.Title,
		Content:      d.Content,
		Tags:         tags,
		Upvotes:      d.Upvotes,
		Downvotes:    d.Downvotes,
		ViewCount:    d.ViewCount,
		IsSolved:     d.IsSolved,
		CommentCount: commentCount,
		CreatedAt:    d.CreatedAt,
		UpdatedAt:    d.UpdatedAt,
	}

	if d.User.Username != "" {
		resp.Username = d.User.Username
		resp.UserImage = d.User.ProfileImage
	}

	return resp
}

func (ds *DiscussionService) toCommentResponse(c *domain.DiscussionComment) *dto.CommentResponseDTO {
	resp := &dto.CommentResponseDTO{
		ID:           c.ID,
		DiscussionID: c.DiscussionID,
		UserID:       c.UserID,
		ParentID:     c.ParentID,
		Content:      c.Content,
		Upvotes:      c.Upvotes,
		Downvotes:    c.Downvotes,
		IsSolution:   c.IsSolution,
		CreatedAt:    c.CreatedAt,
		UpdatedAt:    c.UpdatedAt,
	}

	if c.User.Username != "" {
		resp.Username = c.User.Username
		resp.UserImage = c.User.ProfileImage
	}

	return resp
}
