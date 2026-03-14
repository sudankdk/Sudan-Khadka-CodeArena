package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

type AdminStatsHandlers struct {
	svc    *service.AdminStatsService
	logger *zap.Logger
}

func SetupAdminStatsRoutes(rh *rest.RestHandlers, svc *service.AdminStatsService) {
	handler := &AdminStatsHandlers{
		svc:    svc,
		logger: rh.Logger,
	}

	admin := rh.App.Group("/api/admin")
	admin.Use(rh.Auth.Authorize)
	admin.Use(rh.Auth.RequireAdmin)

	admin.Get("/stats", handler.GetStats)
}

// GetStats returns the current admin statistics
func (h *AdminStatsHandlers) GetStats(c *fiber.Ctx) error {
	days := 30
	if daysParam := c.Query("days"); daysParam != "" {
		if parsed, err := strconv.Atoi(daysParam); err == nil && parsed > 0 {
			days = parsed
		}
	}

	stats, err := h.svc.GetStats(days)
	if err != nil {
		h.logger.Error("Failed to get admin stats", zap.Error(err))
		return rest.InternalError(c, err)
	}

	return c.JSON(stats)
}
