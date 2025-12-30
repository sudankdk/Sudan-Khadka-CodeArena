package repo

import (
	"errors"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/gorm"
)

type TestcaseRepo interface {
	CreateTestcase(testcases domain.TestCases) error
	ListTestcase(id uuid.UUID) ([]domain.TestCases, error)
}

type testcaseRepo struct {
	db *gorm.DB
}

// CreateTestcase implements TestcaseRepo.
func (t *testcaseRepo) CreateTestcase(testcases domain.TestCases) error {
	if err := t.db.Create(&testcases).Error; err != nil {
		return errors.New("error in creating testcases")
	}
	return nil
}

// ListTestcase implements TestcaseRepo.
func (t *testcaseRepo) ListTestcase(id uuid.UUID) ([]domain.TestCases, error) {
	var testcases []domain.TestCases
	if err := t.db.Where("problem_id = ?",id).Find(&testcases).Error; err != nil {
		return []domain.TestCases{}, err
	}
	return testcases, nil

}

func NewTestcase(db *gorm.DB) TestcaseRepo {
	return &testcaseRepo{
		db: db,
	}
}
