package handlers

import (
	"fmt"
	"net/http"

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

}

func (u *ProblemTestHandlers) Create(ctx *fiber.Ctx) error {
	var req dto.CreateProblemDTO
	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("Invalid Payload"))
	}
	err := u.svc.CreateProblem(req)
	if err != nil {
		return rest.InternalError(ctx, err)
	}
	return rest.SuccessMessage(ctx, "problem created", "Success")
}
