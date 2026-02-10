package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/api/rest/handlers"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/logger"
	"github.com/sudankdk/codearena/internal/middleware"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func StartServer(cfg configs.AppConfigs) {

	app := fiber.New()

	// Add logging middleware
	app.Use(middleware.LoggingMiddleware(logger.Log))

	// store := session.New()
	// app.Use(func(c *fiber.Ctx) error {
	//     sess, _ := store.Get(c)
	//     c.Locals("session", sess)
	//     return c.Next()
	// })
	// goth_fiber.SessionStore = store
	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:5173",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
	}))

	logger.Info("Connecting to database", zap.String("dsn", cfg.DSN))
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	logger.Info("Database connected successfully")

	logger.Info("Running database migrations")
	if err := db.AutoMigrate(
		&domain.User{},
		&domain.Problem{},
		&domain.TestCases{},
		&domain.BoilerPlate{},
		&domain.Submission{},
		&domain.Discussion{},
		&domain.DiscussionComment{},
		&domain.DiscussionVote{},
		&domain.Contest{},
		&domain.GlobalLeaderboardEntry{},
		&domain.ContestLeaderboardEntry{},
	); err != nil {
		logger.Fatal("Failed to run migrations", zap.Error(err))
	}

	// Drop problem_id column from discussions table since it's no longer needed
	if db.Migrator().HasColumn(&domain.Discussion{}, "problem_id") {
		if err := db.Migrator().DropColumn(&domain.Discussion{}, "problem_id"); err != nil {
			logger.Warn("Failed to drop problem_id column from discussions", zap.Error(err))
		} else {
			logger.Info("Removed problem_id column from discussions table")
		}
	}

	logger.Info("Database migrations completed")

	auth := helper.SetupAuth(cfg.SECRETKEY)
	rh := &rest.RestHandlers{
		App:     app,
		DB:      db,
		Configs: cfg,
		Auth:    *auth,
		Logger:  logger.Log,
	}
	SetupRoutes(rh)

	logger.Info("Server starting", zap.String("port", cfg.PORT))
	if err := app.Listen(":" + cfg.PORT); err != nil {
		logger.Fatal("Failed to start server", zap.Error(err))
	}
}

func SetupRoutes(rh *rest.RestHandlers) {
	handlers.SetupRoutes(rh)
	handlers.SetupProblemTestRoutes(rh)
	handlers.SetupSubmissionRoutes(rh)
	handlers.SetupDiscussionRoutes(rh)
}
