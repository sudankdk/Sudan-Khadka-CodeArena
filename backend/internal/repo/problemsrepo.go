package repo

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"gorm.io/gorm"
)

type ProblemsRepo interface {
	CreateProblem(p *domain.Problem) error
	GetProblemByID(id uuid.UUID, includeTC bool) (*domain.Problem, error)
	ListProblems(opts dto.ProblemListQueryDTO) ([]domain.Problem, int64, error)
}

type problemsRepo struct {
	db *gorm.DB
}

var _ ProblemsRepo = (*problemsRepo)(nil)  // compile-time interface check

// CreateProblem implements [ProblemsRepo].
func (pr *problemsRepo) CreateProblem(p *domain.Problem) error {
	var count int64

	if err := pr.db.Model(&domain.Problem{}).
		Where("slug = ?", p.Slug).
		Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return errors.New("problem with this slug already exists")
	}

	if err := pr.db.Create(p).Error; err != nil {
		return err
	}

	return nil
}

// GetProblemByID implements [ProblemsRepo].
func (p *problemsRepo) GetProblemByID(id uuid.UUID, includeTC bool) (*domain.Problem, error) {
	fmt.Println(id)
	var problem domain.Problem
	query := p.db.Model(&problem)
	if includeTC {
		query = query.Preload("TestCases")
	}
	if err := query.First(&problem, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &problem, nil
}

// ListProblems implements [ProblemsRepo].
func (p *problemsRepo) ListProblems(opts dto.ProblemListQueryDTO) ([]domain.Problem, int64, error) {
	var problems []domain.Problem
	var total int64

	// Count total records matching filters
	countQuery := p.db.Model(&domain.Problem{})
	if opts.Difficulty != "" {
		countQuery = countQuery.Where("difficulty = ?", opts.Difficulty)
	}
	if opts.Search != "" {
		countQuery = countQuery.Where("title ILIKE ?", "%"+opts.Search+"%")
	}
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Fetch paginated results
	query := p.db.Model(&domain.Problem{})
	if opts.Testcases {
		query = query.Preload("TestCases")
	}
	if opts.Difficulty != "" {
		query = query.Where("difficulty = ?", opts.Difficulty)
	}
	if opts.Search != "" {
		query = query.Where("title ILIKE ?", "%"+opts.Search+"%")
	}
	if opts.Limit > 0 {
		query = query.Limit(opts.Limit)
	}
	if opts.Offset >= 0 {
		query = query.Offset(opts.Offset)
	}

	if err := query.Order("created_at DESC").Find(&problems).Error; err != nil {
		return nil, 0, err
	}

	return problems, total, nil
}

func NewProblemsRepo(db *gorm.DB) ProblemsRepo {
	return &problemsRepo{
		db: db,
	}
}
