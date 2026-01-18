package service

import (
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/mapper"
	"github.com/sudankdk/codearena/internal/repo"
)

type ProblemTestService struct {
	Repo     repo.ProblemsRepo
	TestRepo repo.TestcaseRepo
	Auth     helper.Auth
	Config   configs.AppConfigs
}

func (p *ProblemTestService) CreateProblem(dto dto.CreateProblemDTO) error {
	problem := mapper.ToDomain(dto)
	if err := p.Repo.CreateProblem(&problem); err != nil {
		return err
	}
	return nil
}

func (p *ProblemTestService) ListProblems(q dto.ProblemListQueryDTO) (*dto.ProblemListResponse, error) {

	problems, count, err := p.Repo.ListProblems(q)
	if err != nil {
		return nil, err
	}

	res := make([]dto.ProblemResponseDTO, 0, len(problems))
	for _, problem := range problems {
		res = append(res, mapper.ToProblemResponse(problem))
	}

	return &dto.ProblemListResponse{
		Problems: res,
		Total:    count,
		Page:     (q.Offset / q.Limit) + 1,
		PageSize: q.Limit,
	}, nil
}

func (p *ProblemTestService) GetProblemById(id string, includeTc bool) (domain.Problem, error) {

	problem, err := p.Repo.GetProblemByID(uuid.MustParse(id), includeTc)
	if err != nil {
		return domain.Problem{}, err
	}
	return *problem, nil
}

func (p *ProblemTestService) GetProblemBySlug(slug string, includeTc bool) (domain.Problem, error) {

	problem, err := p.Repo.GetProblemBySlug(slug, includeTc)
	if err != nil {
		return domain.Problem{}, err
	}
	return *problem, nil
}

func (p *ProblemTestService) CreateTestCase(dto dto.CreateTestCaseWithProblemDTO) error {
	fmt.Println(dto.ProblemID.ID())
	_, err := p.Repo.GetProblemByID(dto.ProblemID, false)
	if err != nil {
		return errors.New("problem does not exist")
	}

	return p.TestRepo.CreateTestcase(domain.TestCases{
		Input:     dto.Input,
		Expected:  dto.Expected,
		ProblemID: dto.ProblemID,
	})
}

func (p *ProblemTestService) ListTestCasesOfProblems(id string) ([]domain.TestCases, error) {
	testcases, err := p.TestRepo.ListTestcase(uuid.MustParse(id))
	if err != nil {
		return []domain.TestCases{}, err
	}
	return testcases, nil
}
