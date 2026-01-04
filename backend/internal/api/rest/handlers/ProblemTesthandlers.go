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
	"go.uber.org/zap"
)

type ProblemTestHandlers struct {
	svc    service.ProblemTestService
	logger *zap.Logger
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
		svc:    svc,
		logger: rh.Logger,
	}
	// priRoutes := app.Group("/problems", rh.Auth.Authorize)
	priRoutes := app.Group("/problems")
	priRoutes.Post("", handler.Create)
	priRoutes.Get("", handler.List)
	priRoutes.Get(":id", handler.GetProblemByID)
	testRoutes := app.Group("/testcase")
	testRoutes.Post("", handler.CreateTestCases)
	testRoutes.Get(":id", handler.ListTestCasesOfProblems)

}

func (u *ProblemTestHandlers) Create(ctx *fiber.Ctx) error {
	var req dto.CreateProblemDTO

	// Parse request body
	if err := ctx.BodyParser(&req); err != nil {
		u.logger.Warn("Invalid create problem payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, errors.New("invalid payload"))
	}

	u.logger.Info("Creating problem", zap.String("slug", req.Slug))
	// Call service to create problem
	err := u.svc.CreateProblem(req)
	if err != nil {
		if strings.Contains(err.Error(), "slug must be unique") {
			u.logger.Warn("Problem slug already exists", zap.String("slug", req.Slug))
			return rest.ErrorMessage(ctx, http.StatusConflict, err)
		}
		u.logger.Error("Failed to create problem", zap.String("slug", req.Slug), zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	u.logger.Info("Problem created successfully", zap.String("slug", req.Slug))
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
		u.logger.Warn("Invalid query parameters", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	q.Limit = pageSize
	q.Offset = (page - 1) * pageSize

	u.logger.Info("Listing problems", zap.Int("page", page), zap.Int("limit", pageSize))
	res, err := u.svc.ListProblems(q)
	if err != nil {
		u.logger.Error("Failed to list problems", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	u.logger.Info("Problems listed successfully")
	return rest.SuccessMessage(ctx, "Problems list", res)
}

func (u *ProblemTestHandlers) GetProblemByID(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if id == "" {
		u.logger.Warn("Problem ID is required")
		return rest.ErrorMessage(ctx, http.StatusBadRequest, errors.New("id is required"))
	}

	includeTc := ctx.QueryBool("include_tc", false)
	u.logger.Info("Fetching problem by ID", zap.String("id", id), zap.Bool("include_tc", includeTc))

	problem, err := u.svc.GetProblemById(id, includeTc)
	if err != nil {
		u.logger.Error("Failed to fetch problem", zap.String("id", id), zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	u.logger.Info("Problem fetched successfully", zap.String("id", id))
	return rest.SuccessMessage(ctx, "Problem", problem)
}

func (u *ProblemTestHandlers) CreateTestCases(ctx *fiber.Ctx) error {
	var req dto.CreateTestCaseWithProblemDTO
	if err := ctx.BodyParser(&req); err != nil {
		u.logger.Warn("Invalid create testcase payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	u.logger.Info("Creating testcase", zap.String("problem_id", req.ProblemID.String()))
	if err := u.svc.CreateTestCase(req); err != nil {
		u.logger.Error("Failed to create testcase", zap.String("problem_id", req.ProblemID.String()), zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	u.logger.Info("Testcase created successfully", zap.String("problem_id", req.ProblemID.String()))
	return rest.SuccessMessage(ctx, "testcase createion", "successful")
}

func (u *ProblemTestHandlers) ListTestCasesOfProblems(ctx *fiber.Ctx) error {
	id := ctx.Params("id")
	if id == "" {
		u.logger.Warn("Problem ID parameter is missing")
		return rest.ErrorMessage(ctx, http.StatusBadRequest, errors.New("id param is missing"))
	}

	u.logger.Info("Listing testcases for problem", zap.String("problem_id", id))
	testcases, err := u.svc.ListTestCasesOfProblems(id)
	if err != nil {
		u.logger.Error("Failed to list testcases", zap.String("problem_id", id), zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	u.logger.Info("Testcases listed successfully", zap.String("problem_id", id), zap.Int("count", len(testcases)))
	return rest.SuccessMessage(ctx, "Success", testcases)
}
