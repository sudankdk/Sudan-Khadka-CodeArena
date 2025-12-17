package repo

import (
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type TestcaseRepo interface {
	CreateTestcase(testcases domain.TestCases) error
	ListTestcase() (domain.TestCases, error)
}

type testcaseRepo struct {
	db *gorm.DB
}

// CreateTestcase implements TestcaseRepo.
func (t *testcaseRepo) CreateTestcase(testcases domain.TestCases) error {
	panic("unimplemented")
}

// ListTestcase implements TestcaseRepo.
func (t *testcaseRepo) ListTestcase() (domain.TestCases, error) {
	panic("unimplemented")
}

func NewTestcase(db *gorm.DB) TestcaseRepo {
	return &testcaseRepo{
		db: db,
	}
}
