package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

type SubmissionHandlers struct {
	svc        service.SubmissionService
	contestSvc service.ContestService
	logger     *zap.Logger
}

func SetupSubmissionRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.SubmissionService{
		Repo:     repo.NewSubmissionRepo(rh.DB),
		UserRepo: repo.NewUserRepo(rh.DB),
		Auth:     rh.Auth,
		Config:   rh.Configs,
	}
	contestSvc := service.ContestService{
		ContestRepo:    repo.NewContestRepo(rh.DB),
		ProblemRepo:    repo.NewProblemsRepo(rh.DB),
		SubmissionRepo: repo.NewSubmissionRepo(rh.DB),
		UserRepo:       repo.NewUserRepo(rh.DB),
		ScoringService: &service.ContestScoringService{},
	}
	handler := SubmissionHandlers{
		svc:        svc,
		contestSvc: contestSvc,
		logger:     rh.Logger,
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

	// If this is a contest submission, validate contest is active
	if req.ContestID != nil {
		contest, err := sh.contestSvc.ContestRepo.GetByID(*req.ContestID)
		if err != nil {
			sh.logger.Error("Contest not found", zap.Error(err))
			return rest.ErrorMessage(ctx, http.StatusBadRequest, errors.New("contest not found"))
		}

		// Check if contest is active
		if !sh.isContestActive(contest) {
			sh.logger.Warn("Contest not active",
				zap.String("contest_id", req.ContestID.String()),
				zap.Time("start", contest.StartTime),
				zap.Time("end", contest.EndTime))
			return rest.ErrorMessage(ctx, http.StatusBadRequest, errors.New("contest is not currently active"))
		}

		// Check if user is registered
		isRegistered, err := sh.contestSvc.ContestRepo.IsUserRegistered(*req.ContestID, user.ID)
		if err != nil || !isRegistered {
			sh.logger.Warn("User not registered for contest",
				zap.String("user_id", user.ID.String()),
				zap.String("contest_id", req.ContestID.String()))
			return rest.ErrorMessage(ctx, http.StatusForbidden, errors.New("you must register for the contest first"))
		}
	}

	sh.logger.Info("Creating submission",
		zap.String("user_id", user.ID.String()),
		zap.String("problem_id", req.ProblemID.String()),
		zap.String("status", req.Status),
		zap.Bool("is_contest", req.ContestID != nil))

	submission, err := sh.svc.CreateSubmission(user.ID, req)
	if err != nil {
		sh.logger.Error("Failed to create submission", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	// If this is a contest submission, process scoring and update leaderboard
	if req.ContestID != nil {
		err = sh.contestSvc.ProcessSubmission(
			*req.ContestID,
			user.ID,
			req.ProblemID,
			submission.ID,
			req.Status,
			req.TestCasesPassed,
			req.TotalTestCases,
			req.ExecutionTime,
		)
		if err != nil {
			sh.logger.Error("Failed to process contest submission", zap.Error(err))
			// Don't fail the request, submission is saved, just log the error
		}

		// Reload submission to get updated points
		submission, _ = sh.svc.Repo.GetSubmissionByID(submission.ID)
	}

	sh.logger.Info("Submission created successfully",
		zap.String("id", submission.ID.String()),
		zap.Int("points", submission.PointsEarned))
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

// Helper function to check if contest is currently active
func (sh *SubmissionHandlers) isContestActive(contest *domain.Contest) bool {
	now := time.Now()
	return now.After(contest.StartTime) && now.Before(contest.EndTime)
}
