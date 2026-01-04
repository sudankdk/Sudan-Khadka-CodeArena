package main

import (
	"os"

	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/api"
	"github.com/sudankdk/codearena/internal/logger"
	"go.uber.org/zap"
)

func main() {
	// Initialize logger
	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "production"
	}

	if err := logger.Initialize(env); err != nil {
		panic("Failed to initialize logger: " + err.Error())
	}
	defer logger.Sync()

	logger.Info("Starting Code Arena")

	// Load configurations
	cfg, err := configs.SetUpEnv()
	if err != nil {
		logger.Fatal("Failed to load configurations", zap.Error(err))
	}

	// Initialize OAuth
	configs.InintOAuthConfigs()
	logger.Info("OAuth providers initialized")

	logger.Info("Starting server", zap.String("port", cfg.PORT))
	api.StartServer(cfg)
}
