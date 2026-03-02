package handlers

import (
	"errors"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

type HintHandler struct {
	svc    *service.HintService
	logger *zap.Logger
}

// SetupHintRoutes registers the hint endpoint. Requires authentication.
func SetupHintRoutes(rh *rest.RestHandlers, hintSvc *service.HintService) {
	handler := &HintHandler{
		svc:    hintSvc,
		logger: rh.Logger,
	}
	api := rh.App.Group("/hints", rh.Auth.Authorize)
	api.Post("", handler.GetHint)
}

func (h *HintHandler) GetHint(ctx *fiber.Ctx) error {
	// Extract authenticated user for per-user cooldown
	user, ok := ctx.Locals("user").(domain.User)
	if !ok {
		return ctx.Status(http.StatusUnauthorized).JSON(fiber.Map{"error": "authentication required"})
	}

	if err := h.svc.CheckCooldown(user.ID.String()); err != nil {
		h.logger.Info("Hint cooldown active", zap.String("user_id", user.ID.String()))
		return ctx.Status(http.StatusTooManyRequests).JSON(fiber.Map{"error": err.Error()})
	}

	var req dto.HintRequestDTO
	if err := ctx.BodyParser(&req); err != nil {
		h.logger.Warn("Invalid hint request payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	if req.ProblemTitle == "" || req.ProblemDesc == "" {
		h.logger.Warn("Missing problem info in hint request")
		return ctx.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "problem_title and problem_desc are required"})
	}

	hint, err := h.svc.GenerateHint(ctx.Context(), req.ProblemTitle, req.ProblemDesc, req.Difficulty, req.UserCode, req.HintLevel)
	if err != nil {
		if errors.Is(err, service.ErrRateLimited) || errors.Is(err, service.ErrCooldown) {
			h.logger.Warn("Hint rate limited", zap.Error(err))
			return ctx.Status(http.StatusTooManyRequests).JSON(fiber.Map{"error": err.Error()})
		}
		h.logger.Error("Failed to generate hint", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	// Only start cooldown after a successful generation
	h.svc.SetCooldown(user.ID.String())

	return ctx.JSON(dto.HintResponseDTO{
		Hint:  hint,
		Level: req.HintLevel,
	})
}
