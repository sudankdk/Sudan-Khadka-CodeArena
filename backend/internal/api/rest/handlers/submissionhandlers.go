package handlers

import (
	"net/http"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

type SubmissionHandlers struct {
	svc    service.SubmissionService
	logger *zap.Logger
}

func SetupSubmissionRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.SubmissionService{
		Repo:     repo.NewSubmissionRepo(rh.DB),
		UserRepo: repo.NewUserRepo(rh.DB),
		Auth:     rh.Auth,
		Config:   rh.Configs,
	}
	handler := SubmissionHandlers{
		svc:    svc,
		logger: rh.Logger,
	}

	submissionRoutes := app.Group("/submissions", rh.Auth.Authorize)
	submissionRoutes.Post("", handler.CreateSubmission)
	submissionRoutes.Get("", handler.ListSubmissions)
	submissionRoutes.Get("/:id", handler.GetSubmissionByID)
	submissionRoutes.Get("/stats/user", handler.GetUserStats)
	submissionRoutes.Get("/stats/problem/:problemId", handler.GetProblemStats)

	// Public route for topic stats
	app.Get("/stats/topics", handler.GetTopicStats)
}

func (sh *SubmissionHandlers) CreateSubmission(ctx *fiber.Ctx) error {
	var req dto.CreateSubmissionDTO

	if err := ctx.BodyParser(&req); err != nil {
		sh.logger.Warn("Invalid submission payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	// Get user from context
	user, err := sh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	sh.logger.Info("Creating submission",
		zap.String("user_id", user.ID.String()),
		zap.String("problem_id", req.ProblemID.String()),
		zap.String("status", req.Status))

	submission, err := sh.svc.CreateSubmission(user.ID, req)
	if err != nil {
		sh.logger.Error("Failed to create submission", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	sh.logger.Info("Submission created successfully", zap.String("id", submission.ID.String()))
	return rest.SuccessMessage(ctx, "Submission created successfully", submission)
}

func (sh *SubmissionHandlers) GetSubmissionByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	submission, err := sh.svc.GetSubmissionByID(id)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Submission retrieved", submission)
}

func (sh *SubmissionHandlers) ListSubmissions(ctx *fiber.Ctx) error {
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	var opts dto.SubmissionListQueryDTO
	if err := ctx.QueryParser(&opts); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	opts.Limit = pageSize
	opts.Offset = (page - 1) * pageSize

	submissions, total, err := sh.svc.ListSubmissions(opts)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"data": submissions,
		"meta": fiber.Map{
			"total":       total,
			"page":        page,
			"page_size":   pageSize,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func (sh *SubmissionHandlers) GetUserStats(ctx *fiber.Ctx) error {
	// Get user from context
	user, err := sh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	stats, err := sh.svc.GetUserStats(user.ID)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "User stats retrieved", stats)
}

func (sh *SubmissionHandlers) GetProblemStats(ctx *fiber.Ctx) error {
	problemIDStr := ctx.Params("problemId")
	problemID, err := uuid.Parse(problemIDStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	stats, err := sh.svc.GetProblemStats(problemID)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Problem stats retrieved", stats)
}

func (sh *SubmissionHandlers) GetTopicStats(ctx *fiber.Ctx) error {
	stats, err := sh.svc.GetTopicStats()
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Topic stats retrieved", stats)
}
