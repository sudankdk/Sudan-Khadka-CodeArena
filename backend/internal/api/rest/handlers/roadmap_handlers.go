package handlers

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

type RoadmapHandlers struct {
	svc    service.RoadmapService
	auth   helper.Auth
	logger *zap.Logger
}

func SetupRoadmapRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.RoadmapService{
		Repo:     repo.NewRoadmapRepo(rh.DB),
		UserRepo: repo.NewUserRepo(rh.DB),
	}
	handler := RoadmapHandlers{
		svc:    svc,
		auth:   rh.Auth,
		logger: rh.Logger,
	}

	roadmapRoutes := app.Group("/roadmaps", rh.Auth.Authorize)
	roadmapRoutes.Get("/custom", handler.ListCustomRoadmaps)
	roadmapRoutes.Post("/custom", handler.CreateCustomRoadmap)
	roadmapRoutes.Get("/custom/:id", handler.GetCustomRoadmap)
	roadmapRoutes.Put("/custom/:id", handler.UpdateCustomRoadmap)
	roadmapRoutes.Put("/custom/:id/progress", handler.UpdateCustomRoadmapProgress)
	roadmapRoutes.Delete("/custom/:id", handler.DeleteCustomRoadmap)
}

func (rh *RoadmapHandlers) CreateCustomRoadmap(ctx *fiber.Ctx) error {
	var req dto.CreateRoadmapDTO
	if err := ctx.BodyParser(&req); err != nil {
		rh.logger.Warn("Invalid roadmap payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := rh.auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	roadmap, err := rh.svc.CreateRoadmap(user.ID, req)
	if err != nil {
		rh.logger.Error("Failed to create roadmap", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Roadmap created successfully", roadmap)
}

func (rh *RoadmapHandlers) ListCustomRoadmaps(ctx *fiber.Ctx) error {
	user, err := rh.auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	roadmaps, err := rh.svc.ListRoadmapsByUser(user.ID)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Roadmaps retrieved successfully", roadmaps)
}

func (rh *RoadmapHandlers) GetCustomRoadmap(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := rh.auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	roadmap, err := rh.svc.GetRoadmapByID(id)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	if roadmap.UserID != user.ID {
		return rest.ErrorMessage(ctx, http.StatusForbidden, fiber.ErrForbidden)
	}

	return rest.SuccessMessage(ctx, "Roadmap retrieved successfully", roadmap)
}

func (rh *RoadmapHandlers) UpdateCustomRoadmap(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	var req dto.UpdateRoadmapDTO
	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := rh.auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	existing, err := rh.svc.GetRoadmapByID(id)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	if existing.UserID != user.ID {
		return rest.ErrorMessage(ctx, http.StatusForbidden, fiber.ErrForbidden)
	}

	roadmap, err := rh.svc.UpdateRoadmap(id, req)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Roadmap updated successfully", roadmap)
}

func (rh *RoadmapHandlers) UpdateCustomRoadmapProgress(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	var req dto.UpdateRoadmapProgressDTO
	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := rh.auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	existing, err := rh.svc.GetRoadmapByID(id)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	if existing.UserID != user.ID {
		return rest.ErrorMessage(ctx, http.StatusForbidden, fiber.ErrForbidden)
	}

	roadmap, err := rh.svc.UpdateRoadmapProgress(id, req.Progress)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Roadmap progress updated successfully", roadmap)
}

func (rh *RoadmapHandlers) DeleteCustomRoadmap(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	user, err := rh.auth.CurrentUserInfo(ctx)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusUnauthorized, err)
	}

	existing, err := rh.svc.GetRoadmapByID(id)
	if err != nil {
		return rest.InternalError(ctx, err)
	}

	if existing.UserID != user.ID {
		return rest.ErrorMessage(ctx, http.StatusForbidden, fiber.ErrForbidden)
	}

	if err := rh.svc.DeleteRoadmap(id); err != nil {
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Roadmap deleted successfully", nil)
}
