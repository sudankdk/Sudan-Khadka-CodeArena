package service

import (
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/mapper"
	"github.com/sudankdk/codearena/internal/repo"
)

type ProblemTestService struct {
	Repo   repo.ProblemsRepo
	Auth   helper.Auth
	Config configs.AppConfigs
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
