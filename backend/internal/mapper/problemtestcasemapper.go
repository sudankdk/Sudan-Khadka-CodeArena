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
	return p
}
