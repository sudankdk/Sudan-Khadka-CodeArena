package handlers

import (
	"errors"
	"net/http"
	"strconv"
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
		Repo:     repo.NewProblemsRepo(rh.DB),
		TestRepo: repo.NewTestcase(rh.DB),
		Auth:     rh.Auth,
		Config:   rh.Configs,
	}
	handler := ProblemTestHandlers{
		svc: svc,
	}
	// priRoutes := app.Group("/problems", rh.Auth.Authorize)
	priRoutes := app.Group("/problems")
	priRoutes.Post("", handler.Create)
	priRoutes.Get("", handler.List)
	priRoutes.Get(":id", handler.GetProblemByID)
	testRoutes := app.Group("/testcase")
	testRoutes.Post("", handler.CreateTestCases)

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
	pageSize := 3
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	var q dto.ProblemListQueryDTO
	if err := ctx.QueryParser(&q); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	q.Limit = pageSize
	q.Offset = (page - 1) * pageSize
	res, err := u.svc.ListProblems(q)
	if err != nil {
		return rest.InternalError(ctx, err)
	}
	return rest.SuccessMessage(ctx, "Problems list", res)
}

func (u *ProblemTestHandlers) GetProblemByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if id == "" {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, errors.New("id is required"))
	}
	includeTc := ctx.QueryBool("include_tc", false)
	problem, err := u.svc.GetProblemById(id, includeTc)
	if err != nil {
		return rest.InternalError(ctx, err)
	}
	return rest.SuccessMessage(ctx, "Problem", problem)
}

func (u *ProblemTestHandlers) CreateTestCases(ctx *fiber.Ctx) error {
	var req dto.CreateTestCaseWithProblemDTO
	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}
	if err := u.svc.CreateTestCase(req); err != nil {
		return rest.InternalError(ctx, err)
	}
	return rest.SuccessMessage(ctx, "testcase createion", "successful")
}
