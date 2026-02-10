package repo

import (
	"errors"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"gorm.io/gorm"
)

type ProblemsRepo interface {
	CreateProblem(p *domain.Problem) error
	GetProblemByID(id uuid.UUID, includeTC bool) (*domain.Problem, error)
	GetProblemBySlug(slug string, includeTC bool) (*domain.Problem, error)
	ListProblems(opts dto.ProblemListQueryDTO) ([]domain.Problem, int64, error)
	UpdateProblem(id uuid.UUID, updates map[string]interface{}) error
	DeleteProblem(id uuid.UUID) error
}

type problemsRepo struct {
	db *gorm.DB
}

var _ ProblemsRepo = (*problemsRepo)(nil) // compile-time interface check

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
	var problem domain.Problem
	query := p.db.Model(&problem)
	if includeTC {
		query = query.Preload("TestCases").Preload("Boilerplates")
	}
	if err := query.First(&problem, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &problem, nil
}

func (p *problemsRepo) GetProblemBySlug(slug string, includeTC bool) (*domain.Problem, error) {
	var problem domain.Problem
	query := p.db.Model(&problem)
	if includeTC {
		query = query.Preload("TestCases").Preload("Boilerplates")
	}
	if err := query.First(&problem, "slug = ?", slug).Error; err != nil {
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
		countQuery = countQuery.Where("main_heading ILIKE ?", "%"+opts.Search+"%")
	}
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Fetch paginated results
	query := p.db.Model(&domain.Problem{})

	// Always preload test cases and boilerplates for now
	query = query.Preload("TestCases").Preload("Boilerplates")

	if opts.Difficulty != "" {
		query = query.Where("difficulty = ?", opts.Difficulty)
	}
	if opts.Search != "" {
		query = query.Where("main_heading ILIKE ?", "%"+opts.Search+"%")
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

// UpdateProblem implements [ProblemsRepo].
func (pr *problemsRepo) UpdateProblem(id uuid.UUID, updates map[string]interface{}) error {
	// First check if problem exists
	var problem domain.Problem
	if err := pr.db.First(&problem, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("problem not found")
		}
		return err
	}

	// Update the problem
	if err := pr.db.Model(&problem).Updates(updates).Error; err != nil {
		return err
	}

	return nil
}

// DeleteProblem implements [ProblemsRepo].
func (pr *problemsRepo) DeleteProblem(id uuid.UUID) error {
	// Check if problem exists
	var problem domain.Problem
	if err := pr.db.First(&problem, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("problem not found")
		}
		return err
	}

	// Use a transaction to ensure all deletes succeed or rollback
	return pr.db.Transaction(func(tx *gorm.DB) error {
		// Delete associated test cases
		if err := tx.Where("problem_id = ?", id).Delete(&domain.TestCases{}).Error; err != nil {
			return err
		}

		// Delete associated boilerplates
		if err := tx.Where("problem_id = ?", id).Delete(&domain.BoilerPlate{}).Error; err != nil {
			return err
		}

		// Delete the problem
		if err := tx.Delete(&problem).Error; err != nil {
			return err
		}

		return nil
	})
}

func NewProblemsRepo(db *gorm.DB) ProblemsRepo {
	return &problemsRepo{
		db: db,
	}
}
