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

type DiscussionHandlers struct {
	svc    service.DiscussionService
	logger *zap.Logger
}

func SetupDiscussionRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.DiscussionService{
		Repo:     repo.NewDiscussionRepo(rh.DB),
		UserRepo: repo.NewUserRepo(rh.DB),
		Auth:     rh.Auth,
		Config:   rh.Configs,
	}
	handler := DiscussionHandlers{
		svc:    svc,
		logger: rh.Logger,
	}

	// Stats (public) - using different path to avoid group middleware
	app.Get("/stats/discussions", handler.GetDiscussionStats)

	// Discussion routes (protected)
	discussionRoutes := app.Group("/discussions", rh.Auth.Authorize)
	discussionRoutes.Post("", handler.CreateDiscussion)
	discussionRoutes.Get("", handler.ListDiscussions)
	discussionRoutes.Get("/:id", handler.GetDiscussionByID)
	discussionRoutes.Put("/:id", handler.UpdateDiscussion)
	discussionRoutes.Delete("/:id", handler.DeleteDiscussion)

	// Comment routes (protected)
	discussionRoutes.Post("/comments", handler.CreateComment)
	discussionRoutes.Get("/:id/comments", handler.GetComments)
	discussionRoutes.Put("/comments/:commentId", handler.UpdateComment)
	discussionRoutes.Delete("/comments/:commentId", handler.DeleteComment)

	// Vote routes (protected)
	discussionRoutes.Post("/vote", handler.VoteOnTarget)
	discussionRoutes.Delete("/vote", handler.RemoveVote)
}

// Discussion handlers
func (dh *DiscussionHandlers) CreateDiscussion(ctx *fiber.Ctx) error {
	var req dto.CreateDiscussionDTO

	if err := ctx.BodyParser(&req); err != nil {
		dh.logger.Warn("Invalid discussion payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := dh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	dh.logger.Info("Creating discussion",
		zap.String("user_id", user.ID.String()),
		zap.String("title", req.Title))

	discussion, err := dh.svc.CreateDiscussion(user.ID, req)
	if err != nil {
		dh.logger.Error("Failed to create discussion", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	dh.logger.Info("Discussion created successfully", zap.String("id", discussion.ID.String()))
	return rest.SuccessMessage(ctx, "Discussion created successfully", discussion)
}

func (dh *DiscussionHandlers) GetDiscussionByID(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	discussion, err := dh.svc.GetDiscussionByID(id, true)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Discussion retrieved", discussion)
}

func (dh *DiscussionHandlers) UpdateDiscussion(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	var req dto.UpdateDiscussionDTO
	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := dh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	discussion, err := dh.svc.UpdateDiscussion(id, user.ID, req)
	if err != nil {
		if err.Error() == "unauthorized to update this discussion" {
			return rest.ErrorMessage(ctx, http.StatusForbidden, err)
		}
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Discussion updated successfully", discussion)
}

func (dh *DiscussionHandlers) DeleteDiscussion(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := dh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	if err := dh.svc.DeleteDiscussion(id, user.ID); err != nil {
		if err.Error() == "unauthorized to delete this discussion" {
			return rest.ErrorMessage(ctx, http.StatusForbidden, err)
		}
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Discussion deleted successfully", nil)
}

func (dh *DiscussionHandlers) ListDiscussions(ctx *fiber.Ctx) error {
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	var opts dto.DiscussionListQueryDTO
	if err := ctx.QueryParser(&opts); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	opts.Limit = pageSize
	opts.Offset = (page - 1) * pageSize

	discussions, total, err := dh.svc.ListDiscussions(opts)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return ctx.JSON(fiber.Map{
		"data": discussions,
		"meta": fiber.Map{
			"total":       total,
			"page":        page,
			"page_size":   pageSize,
			"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

// Comment handlers
func (dh *DiscussionHandlers) CreateComment(ctx *fiber.Ctx) error {
	var req dto.CreateCommentDTO

	if err := ctx.BodyParser(&req); err != nil {
		dh.logger.Warn("Invalid comment payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := dh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	comment, err := dh.svc.CreateComment(user.ID, req)
	if err != nil {
		dh.logger.Error("Failed to create comment", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Comment created successfully", comment)
}

func (dh *DiscussionHandlers) GetComments(ctx *fiber.Ctx) error {
	idStr := ctx.Params("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	comments, err := dh.svc.GetCommentsByDiscussionID(id)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Comments retrieved", comments)
}

func (dh *DiscussionHandlers) UpdateComment(ctx *fiber.Ctx) error {
	commentIDStr := ctx.Params("commentId")
	commentID, err := uuid.Parse(commentIDStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	var req dto.UpdateCommentDTO
	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := dh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	comment, err := dh.svc.UpdateComment(commentID, user.ID, req)
	if err != nil {
		if err.Error() == "unauthorized to update this comment" {
			return rest.ErrorMessage(ctx, http.StatusForbidden, err)
		}
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Comment updated successfully", comment)
}

func (dh *DiscussionHandlers) DeleteComment(ctx *fiber.Ctx) error {
	commentIDStr := ctx.Params("commentId")
	commentID, err := uuid.Parse(commentIDStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := dh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	if err := dh.svc.DeleteComment(commentID, user.ID); err != nil {
		if err.Error() == "unauthorized to delete this comment" {
			return rest.ErrorMessage(ctx, http.StatusForbidden, err)
		}
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Comment deleted successfully", nil)
}

// Vote handlers
func (dh *DiscussionHandlers) VoteOnTarget(ctx *fiber.Ctx) error {
	var req dto.VoteRequestDTO

	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := dh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	if err := dh.svc.VoteOnTarget(user.ID, req); err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Vote recorded successfully", nil)
}

func (dh *DiscussionHandlers) RemoveVote(ctx *fiber.Ctx) error {
	targetIDStr := ctx.Query("target_id")
	targetType := ctx.Query("target_type")

	if targetIDStr == "" || targetType == "" {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fiber.NewError(http.StatusBadRequest, "target_id and target_type are required"))
	}

	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := dh.svc.Auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	if err := dh.svc.RemoveVote(user.ID, targetID, targetType); err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Vote removed successfully", nil)
}

// Stats handler
func (dh *DiscussionHandlers) GetDiscussionStats(ctx *fiber.Ctx) error {
	stats, err := dh.svc.GetDiscussionStats()
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Discussion stats retrieved", stats)
}
