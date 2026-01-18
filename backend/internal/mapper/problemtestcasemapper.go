package mapper

import (
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
)

func ToDomain(in dto.CreateProblemDTO) domain.Problem {
	p := domain.Problem{
		MainHeading: in.MainHeading,
		Slug:        in.Slug,
		Description: in.Description,
		Tag:         in.Tag,
		Difficulty:  in.Difficulty,
	}
	for _, tc := range in.TestCases {
		p.TestCases = append(p.TestCases, domain.TestCases{
			Input:    tc.Input,
			Expected: tc.Expected,
		})
	}

	for _, bp := range in.Boilerplates {
		p.Boilerplates = append(p.Boilerplates, domain.BoilerPlate{
			Language: bp.Language,
			Code:     bp.Code,
		})
	}
	return p
}

func ToProblemResponse(p domain.Problem) dto.ProblemResponseDTO {
	out := dto.ProblemResponseDTO{
		ID:          p.ID.String(),
		MainHeading: p.MainHeading,
		Slug:        p.Slug,
		Description: p.Description,
		Tag:         p.Tag,
		Difficulty:  p.Difficulty,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
	for _, tc := range p.TestCases {
		out.TestCases = append(out.TestCases, dto.TestCaseResponseDTO{
			ID:        tc.ID.String(),
			Input:     tc.Input,
			Expected:  tc.Expected,
			ProblemID: tc.ProblemID.String(),
			CreatedAt: tc.CreatedAt,
			UpdatedAt: tc.UpdatedAt,
		})
	}

	for _, bp := range p.Boilerplates {
		out.Boilerplates = append(out.Boilerplates, dto.BoilerplateResponseDTO{
			ID:        bp.ID.String(),
			Language:  bp.Language,
			Code:      bp.Code,
			ProblemID: bp.ProblemID.String(),
			CreatedAt: bp.CreatedAt,
			UpdatedAt: bp.UpdatedAt,
		})
	}
	return out
}
