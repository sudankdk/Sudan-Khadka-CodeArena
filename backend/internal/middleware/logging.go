package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"go.uber.org/zap"
)

// LoggingMiddleware logs all HTTP requests
func LoggingMiddleware(logger *zap.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Process request
		err := c.Next()

		// Calculate request duration
		duration := time.Since(start)

		// Log the request
		logger.Info("HTTP Request",
			zap.String("method", c.Method()),
			zap.String("path", c.Path()),
			zap.Int("status", c.Response().StatusCode()),
			zap.Duration("duration", duration),
			zap.String("ip", c.IP()),
			zap.String("user-agent", c.Get("User-Agent")),
		)

		return err
	}
}
