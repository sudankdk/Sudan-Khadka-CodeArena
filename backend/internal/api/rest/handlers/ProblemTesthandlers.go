package handlers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
)

type ProblemTestHandlers struct {
	svc service.ProblemTestService
}

func SetupProblemTestRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.ProblemTestService{
		Repo:   repo.NewProblemsRepo(rh.DB),
		Auth:   rh.Auth,
		Config: rh.Configs,
	}
	handler := ProblemTestHandlers{
		svc: svc,
	}
	// priRoutes := app.Group("/problems", rh.Auth.Authorize)
	priRoutes := app.Group("/problems")
	priRoutes.Post("", handler.Create)
	priRoutes.Get("", handler.List)

}

func (u *ProblemTestHandlers) Create(ctx *fiber.Ctx) error {
	var req dto.CreateProblemDTO

	// Parse request body
	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, errors.New("invalid payload"))
	}

	// Call service to create problem
	err := u.svc.CreateProblem(req)
	if err != nil {
		if strings.Contains(err.Error(), "slug must be unique") {
			return rest.ErrorMessage(ctx, http.StatusConflict, err)
		}
		return rest.InternalError(ctx, err)
	}

	// Success response
	return rest.SuccessMessage(ctx, "Problem created successfully", map[string]string{
		"slug": req.Slug,
	})
}

func (u *ProblemTestHandlers) List(ctx *fiber.Ctx) error {
	// var res []dto.ProblemResponseDTO
	var q dto.ProblemListQueryDTO
	if err := ctx.QueryParser(&q); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	res, err := u.svc.ListProblems(q)
	if err != nil {
		return rest.InternalError(ctx, err)
	}
	return rest.SuccessMessage(ctx, "Problems list", res)
}
