package repo

import (
	"errors"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type RoadmapRepo interface {
	CreateRoadmap(roadmap *domain.Roadmap) error
	GetRoadmapByID(id uuid.UUID) (*domain.Roadmap, error)
	ListRoadmapsByUser(userID uuid.UUID) ([]domain.Roadmap, error)
	UpdateRoadmap(id uuid.UUID, updates map[string]interface{}) error
	DeleteRoadmap(id uuid.UUID) error
}

type roadmapRepo struct {
	db *gorm.DB
}

var _ RoadmapRepo = (*roadmapRepo)(nil)

func NewRoadmapRepo(db *gorm.DB) RoadmapRepo {
	return &roadmapRepo{db: db}
}

func (r *roadmapRepo) CreateRoadmap(roadmap *domain.Roadmap) error {
	if err := r.db.Create(roadmap).Error; err != nil {
		return errors.New("failed to create roadmap")
	}
	return nil
}

func (r *roadmapRepo) GetRoadmapByID(id uuid.UUID) (*domain.Roadmap, error) {
	var roadmap domain.Roadmap
	if err := r.db.Preload("User").First(&roadmap, "id = ?", id).Error; err != nil {
		return nil, errors.New("roadmap not found")
	}
	return &roadmap, nil
}

func (r *roadmapRepo) ListRoadmapsByUser(userID uuid.UUID) ([]domain.Roadmap, error) {
	var roadmaps []domain.Roadmap
	if err := r.db.Preload("User").Where("user_id = ?", userID).
		Order("created_at DESC").Find(&roadmaps).Error; err != nil {
		return nil, errors.New("failed to list roadmaps")
	}
	return roadmaps, nil
}

func (r *roadmapRepo) UpdateRoadmap(id uuid.UUID, updates map[string]interface{}) error {
	if err := r.db.Model(&domain.Roadmap{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return errors.New("failed to update roadmap")
	}
	return nil
}

func (r *roadmapRepo) DeleteRoadmap(id uuid.UUID) error {
	if err := r.db.Delete(&domain.Roadmap{}, "id = ?", id).Error; err != nil {
		return errors.New("failed to delete roadmap")
	}
	return nil
}
