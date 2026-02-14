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

type ContestHandlers struct {
	svc    service.ContestService
	logger *zap.Logger
}

func SetupContestRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.ContestService{
		ContestRepo:    repo.NewContestRepo(rh.DB),
		SubmissionRepo: repo.NewSubmissionRepo(rh.DB),
		UserRepo:       repo.NewUserRepo(rh.DB),
		ScoringService: &service.ContestScoringService{},
	}
	handler := ContestHandlers{
		svc:    svc,
		logger: rh.Logger,
	}

	// Public routes
	app.Get("/contests", handler.ListContests)
	app.Get("/contests/:id", handler.GetContestByID)
	app.Get("/contests/:id/problems", handler.GetContestProblems)
	app.Get("/contests/:id/leaderboard", handler.GetContestLeaderboard)
	app.Get("/contests/:id/participants", handler.GetContestParticipants)
	app.Get("/leaderboard/global", handler.GetGlobalLeaderboard)

	// Protected routes (require authentication)
	contestRoutes := app.Group("/contests", rh.Auth.Authorize)
	contestRoutes.Post("", handler.CreateContest)
	contestRoutes.Post("/:id/problems", handler.AddProblemToContest)
	contestRoutes.Delete("/:id/problems/:problemId", handler.RemoveProblemFromContest)
	contestRoutes.Post("/:id/register", handler.RegisterParticipant)
	contestRoutes.Delete("/:id/register", handler.UnregisterParticipant)
	contestRoutes.Post("/:id/finalize", handler.FinalizeContestRankings)
}

func (ch *ContestHandlers) CreateContest(ctx *fiber.Ctx) error {
	var req dto.CreateContestDTO

	if err := ctx.BodyParser(&req); err != nil {
		ch.logger.Warn("Invalid contest payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	ch.logger.Info("Creating contest", zap.String("name", req.Name))
	contest, err := ch.svc.CreateContest(req)
	if err != nil {
		ch.logger.Error("Failed to create contest", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	ch.logger.Info("Contest created successfully", zap.String("id", contest.ID.String()))
	return rest.SuccessMessage(ctx, "Contest created successfully", contest)
}

func (ch *ContestHandlers) GetContestByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")

	ch.logger.Info("Fetching contest", zap.String("id", idStr))
	contest, err := ch.svc.GetByID(idStr)
	if err != nil {
		ch.logger.Error("Failed to fetch contest", zap.String("id", idStr), zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Contest retrieved successfully", contest)
}

func (ch *ContestHandlers) ListContests(ctx *fiber.Ctx) error {
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("page_size", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	var q dto.ListQuery
	if err := ctx.QueryParser(&q); err != nil {
		ch.logger.Warn("Invalid query parameters", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	q.Page = page
	q.PageSize = pageSize

	ch.logger.Info("Listing contests", zap.Int("page", page), zap.Int("limit", pageSize))
	contests, err := ch.svc.ListContests(q)
	if err != nil {
		ch.logger.Error("Failed to list contests", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Contests retrieved successfully", contests)
}

func (ch *ContestHandlers) AddProblemToContest(ctx *fiber.Ctx) error {
	var req dto.AddProblemToContestDTO

	if err := ctx.BodyParser(&req); err != nil {
		ch.logger.Warn("Invalid add problem payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	// Get contest ID from URL params
	req.ContestID = ctx.Params("id")

	ch.logger.Info("Adding problem to contest",
		zap.String("contest_id", req.ContestID),
		zap.String("problem_id", req.ProblemID))

	err := ch.svc.AddProblemsToContest(req)
	if err != nil {
		ch.logger.Error("Failed to add problem to contest", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Problem added to contest successfully", nil)
}

func (ch *ContestHandlers) RemoveProblemFromContest(ctx *fiber.Ctx) error {
	contestID := ctx.Params("id")
	problemID := ctx.Params("problemId")

	ch.logger.Info("Removing problem from contest",
		zap.String("contest_id", contestID),
		zap.String("problem_id", problemID))

	err := ch.svc.RemoveProblemFromContest(contestID, problemID)
	if err != nil {
		ch.logger.Error("Failed to remove problem from contest", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Problem removed from contest successfully", nil)
}

func (ch *ContestHandlers) RegisterParticipant(ctx *fiber.Ctx) error {
	contestID := ctx.Params("id")

	// Get user ID from request body or context
	type RegisterRequest struct {
		UserID string `json:"user_id"`
	}
	var req RegisterRequest
	if err := ctx.BodyParser(&req); err != nil {
		ch.logger.Warn("Invalid register payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	ch.logger.Info("Registering participant",
		zap.String("contest_id", contestID),
		zap.String("user_id", req.UserID))

	err := ch.svc.RegisterParticipant(contestID, req.UserID)
	if err != nil {
		ch.logger.Error("Failed to register participant", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Registered for contest successfully", nil)
}

func (ch *ContestHandlers) UnregisterParticipant(ctx *fiber.Ctx) error {
	contestID := ctx.Params("id")

	// Get user ID from request body
	type UnregisterRequest struct {
		UserID string `json:"user_id"`
	}
	var req UnregisterRequest
	if err := ctx.BodyParser(&req); err != nil {
		ch.logger.Warn("Invalid unregister payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	ch.logger.Info("Unregistering participant",
		zap.String("contest_id", contestID),
		zap.String("user_id", req.UserID))

	err := ch.svc.UnregisterParticipant(contestID, req.UserID)
	if err != nil {
		ch.logger.Error("Failed to unregister participant", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Unregistered from contest successfully", nil)
}

func (ch *ContestHandlers) GetContestParticipants(ctx *fiber.Ctx) error {
	contestID := ctx.Params("id")

	ch.logger.Info("Fetching contest participants", zap.String("contest_id", contestID))
	participants, err := ch.svc.GetContestParticipants(contestID)
	if err != nil {
		ch.logger.Error("Failed to fetch participants", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Participants retrieved successfully", participants)
}

func (ch *ContestHandlers) GetContestProblems(ctx *fiber.Ctx) error {
	contestID := ctx.Params("id")

	ch.logger.Info("Fetching contest problems", zap.String("contest_id", contestID))
	problems, err := ch.svc.GetContestProblems(contestID)
	if err != nil {
		ch.logger.Error("Failed to fetch problems", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Problems retrieved successfully", problems)
}

func (ch *ContestHandlers) GetContestLeaderboard(ctx *fiber.Ctx) error {
	contestID := ctx.Params("id")
	limit, _ := strconv.Atoi(ctx.Query("limit", "100"))

	ch.logger.Info("Fetching contest leaderboard",
		zap.String("contest_id", contestID),
		zap.Int("limit", limit))

	leaderboard, err := ch.svc.GetContestLeaderboard(contestID, limit)
	if err != nil {
		ch.logger.Error("Failed to fetch leaderboard", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Leaderboard retrieved successfully", leaderboard)
}

func (ch *ContestHandlers) FinalizeContestRankings(ctx *fiber.Ctx) error {
	contestIDStr := ctx.Params("id")
	contestID, err := uuid.Parse(contestIDStr)
	if err != nil {
		ch.logger.Warn("Invalid contest ID", zap.String("id", contestIDStr))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	ch.logger.Info("Finalizing contest rankings", zap.String("contest_id", contestIDStr))
	err = ch.svc.FinalizeContestRankings(contestID)
	if err != nil {
		ch.logger.Error("Failed to finalize contest rankings", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Contest rankings finalized successfully", nil)
}

func (ch *ContestHandlers) GetGlobalLeaderboard(ctx *fiber.Ctx) error {
	limit, _ := strconv.Atoi(ctx.Query("limit", "100"))

	ch.logger.Info("Fetching global leaderboard", zap.Int("limit", limit))
	leaderboard, err := ch.svc.ContestRepo.GetGlobalLeaderboard(limit)
	if err != nil {
		ch.logger.Error("Failed to fetch global leaderboard", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Global leaderboard retrieved successfully", leaderboard)
}
