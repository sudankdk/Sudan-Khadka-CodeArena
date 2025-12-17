package repo

import (
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type ProblemsRepo interface {
	CreateProblem(problem domain.Problem) error
	ListProblem() (domain.Problem, error)
}

type problemsRepo struct {
	db *gorm.DB
}

func (p *problemsRepo) CreateProblem(problem domain.Problem) error {
	panic("unimplemented")
}

func (p *problemsRepo) ListProblem() (domain.Problem, error) {
	panic("unimplemented")
}

func NewProblemsRepo(db *gorm.DB) ProblemsRepo {
	return &problemsRepo{
		db: db,
	}
}
