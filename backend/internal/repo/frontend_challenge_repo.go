package repo

import (
	"math/rand"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type FrontendChallengeRepo interface {
	Create(challenge *domain.FrontendChallenge) error
	GetByID(id uuid.UUID) (*domain.FrontendChallenge, error)
	List(page, pageSize int, difficulty string) ([]domain.FrontendChallenge, int64, error)
	GetRandomByDifficulty(difficulty string) (*domain.FrontendChallenge, error)
	Update(id uuid.UUID, updates map[string]interface{}) error
	Delete(id uuid.UUID) error
}

type frontendChallengeRepo struct {
	db *gorm.DB
}

var _ FrontendChallengeRepo = (*frontendChallengeRepo)(nil)

func (r *frontendChallengeRepo) Create(challenge *domain.FrontendChallenge) error {
	return r.db.Create(challenge).Error
}

func (r *frontendChallengeRepo) GetByID(id uuid.UUID) (*domain.FrontendChallenge, error) {
	var challenge domain.FrontendChallenge
	if err := r.db.First(&challenge, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &challenge, nil
}

func (r *frontendChallengeRepo) List(page, pageSize int, difficulty string) ([]domain.FrontendChallenge, int64, error) {
	var challenges []domain.FrontendChallenge
	var total int64

	query := r.db.Model(&domain.FrontendChallenge{})
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * pageSize
	if err := query.Offset(offset).Limit(pageSize).Order("created_at DESC").Find(&challenges).Error; err != nil {
		return nil, 0, err
	}

	return challenges, total, nil
}

func (r *frontendChallengeRepo) GetRandomByDifficulty(difficulty string) (*domain.FrontendChallenge, error) {
	var challenges []domain.FrontendChallenge
	query := r.db.Model(&domain.FrontendChallenge{})
	if difficulty != "" {
		query = query.Where("difficulty = ?", difficulty)
	}
	if err := query.Find(&challenges).Error; err != nil {
		return nil, err
	}
	if len(challenges) == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return &challenges[rand.Intn(len(challenges))], nil
}

func (r *frontendChallengeRepo) Update(id uuid.UUID, updates map[string]interface{}) error {
	return r.db.Model(&domain.FrontendChallenge{}).Where("id = ?", id).Updates(updates).Error
}

func (r *frontendChallengeRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&domain.FrontendChallenge{}, "id = ?", id).Error
}

func NewFrontendChallengeRepo(db *gorm.DB) FrontendChallengeRepo {
	return &frontendChallengeRepo{db: db}
}
