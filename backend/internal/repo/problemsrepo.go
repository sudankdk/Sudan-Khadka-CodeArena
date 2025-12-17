package repo

import (
	"context"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type ProblemsRepo interface {
	CreateProblem(ctx context.Context, p *domain.Problem) error
	GetProblemByID(ctx context.Context, id uuid.UUID, includeTC bool) (*domain.Problem, error)
	GetProblemBySlug(ctx context.Context, slug string, includeTC bool) (*domain.Problem, error)
	ListProblems(ctx context.Context, opts ListProblemsOptions) ([]domain.Problem, error)
}

type ListProblemsOptions struct {
	IncludeTestCases bool
	Tag              string
	Difficulty       string
	Search           string
	OrderBy          string
	Limit            int
	Offset           int
}

type problemsRepo struct {
	db *gorm.DB
}

// CreateProblem implements [ProblemsRepo].
func (*problemsRepo) CreateProblem(ctx context.Context, p *domain.Problem) error {
	panic("unimplemented")
}

// GetProblemByID implements [ProblemsRepo].
func (p *problemsRepo) GetProblemByID(ctx context.Context, id uuid.UUID, includeTC bool) (*domain.Problem, error) {
	panic("unimplemented")
}

// GetProblemBySlug implements [ProblemsRepo].
func (p *problemsRepo) GetProblemBySlug(ctx context.Context, slug string, includeTC bool) (*domain.Problem, error) {
	panic("unimplemented")
}

// ListProblems implements [ProblemsRepo].
func (p *problemsRepo) ListProblems(ctx context.Context, opts ListProblemsOptions) ([]domain.Problem, error) {
	panic("unimplemented")
}

func NewProblemsRepo(db *gorm.DB) ProblemsRepo {
	return &problemsRepo{
		db: db,
	}
}
