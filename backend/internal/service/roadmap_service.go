package service

import (
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
)

type RoadmapService struct {
	Repo     repo.RoadmapRepo
	UserRepo repo.UserRepo
}

func (rs *RoadmapService) CreateRoadmap(userID uuid.UUID, req dto.CreateRoadmapDTO) (*dto.RoadmapResponseDTO, error) {
	visibility := normalizeVisibility(req.Visibility)
	if visibility == "" {
		visibility = domain.RoadmapVisibilityPrivate
	}

	totalProblems := req.TotalProblems
	if totalProblems == 0 && len(req.Topics) > 0 {
		totalProblems = len(req.Topics)
	}

	roadmap := &domain.Roadmap{
		UserID:        userID,
		Name:          strings.TrimSpace(req.Name),
		Description:   strings.TrimSpace(req.Description),
		Visibility:    visibility,
		Topics:        req.Topics,
		TotalProblems: totalProblems,
		Progress:      0,
	}

	if roadmap.Name == "" {
		return nil, errors.New("roadmap name is required")
	}

	if err := rs.Repo.CreateRoadmap(roadmap); err != nil {
		return nil, err
	}

	created, err := rs.Repo.GetRoadmapByID(roadmap.ID)
	if err != nil {
		return nil, err
	}

	return rs.toRoadmapResponse(created), nil
}

func (rs *RoadmapService) ListRoadmapsByUser(userID uuid.UUID) ([]dto.RoadmapResponseDTO, error) {
	roadmaps, err := rs.Repo.ListRoadmapsByUser(userID)
	if err != nil {
		return nil, err
	}

	responses := make([]dto.RoadmapResponseDTO, 0, len(roadmaps))
	for i := range roadmaps {
		responses = append(responses, *rs.toRoadmapResponse(&roadmaps[i]))
	}

	return responses, nil
}

func (rs *RoadmapService) GetRoadmapByID(id uuid.UUID) (*dto.RoadmapResponseDTO, error) {
	roadmap, err := rs.Repo.GetRoadmapByID(id)
	if err != nil {
		return nil, err
	}

	return rs.toRoadmapResponse(roadmap), nil
}

func (rs *RoadmapService) UpdateRoadmap(id uuid.UUID, req dto.UpdateRoadmapDTO) (*dto.RoadmapResponseDTO, error) {
	updates := make(map[string]interface{})

	if req.Name != nil {
		updates["name"] = strings.TrimSpace(*req.Name)
	}
	if req.Description != nil {
		updates["description"] = strings.TrimSpace(*req.Description)
	}
	if req.Visibility != nil {
		visibility := normalizeVisibility(*req.Visibility)
		if visibility != "" {
			updates["visibility"] = visibility
		}
	}
	if req.Topics != nil {
		updates["topics"] = req.Topics
	}
	if req.TotalProblems != nil {
		updates["total_problems"] = *req.TotalProblems
	}

	if len(updates) == 0 {
		return rs.GetRoadmapByID(id)
	}

	if err := rs.Repo.UpdateRoadmap(id, updates); err != nil {
		return nil, err
	}

	return rs.GetRoadmapByID(id)
}

func (rs *RoadmapService) UpdateRoadmapProgress(id uuid.UUID, progress int) (*dto.RoadmapResponseDTO, error) {
	if progress < 0 || progress > 100 {
		return nil, errors.New("progress must be between 0 and 100")
	}

	if err := rs.Repo.UpdateRoadmap(id, map[string]interface{}{"progress": progress}); err != nil {
		return nil, err
	}

	return rs.GetRoadmapByID(id)
}

func (rs *RoadmapService) DeleteRoadmap(id uuid.UUID) error {
	return rs.Repo.DeleteRoadmap(id)
}

func (rs *RoadmapService) toRoadmapResponse(roadmap *domain.Roadmap) *dto.RoadmapResponseDTO {
	authorName := ""
	if roadmap.User.Username != "" {
		authorName = roadmap.User.Username
	}

	return &dto.RoadmapResponseDTO{
		ID:            roadmap.ID,
		UserID:        roadmap.UserID,
		AuthorName:    authorName,
		Name:          roadmap.Name,
		Description:   roadmap.Description,
		Visibility:    roadmap.Visibility,
		Topics:        roadmap.Topics,
		TotalProblems: roadmap.TotalProblems,
		Progress:      roadmap.Progress,
		CreatedAt:     roadmap.CreatedAt,
		UpdatedAt:     roadmap.UpdatedAt,
	}
}

func normalizeVisibility(value string) string {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case domain.RoadmapVisibilityPublic:
		return domain.RoadmapVisibilityPublic
	case domain.RoadmapVisibilityPrivate:
		return domain.RoadmapVisibilityPrivate
	default:
		return ""
	}
}
