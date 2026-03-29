package api

import (
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/contrib/websocket"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/api/rest/handlers"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/helper"
	"github.com/sudankdk/codearena/internal/logger"
	"github.com/sudankdk/codearena/internal/middleware"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
	"github.com/sudankdk/codearena/internal/ws"
	"go.uber.org/zap"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// wsTicket is a short-lived one-time ticket for WebSocket authentication.
// Needed because browser WebSocket API cannot send HTTP-only cookies cross-origin.
type wsTicket struct {
	UserID    uuid.UUID
	ExpiresAt time.Time
}

var wsTickets sync.Map

func StartServer(cfg configs.AppConfigs) {

	app := fiber.New()

	// Build CORS allowlist from env so Render/Vercel domains can be injected without code changes.
	frontendOrigin := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
	if frontendOrigin == "" {
		frontendOrigin = "https://sudan-khadka-code-arena.vercel.app"
	}
	allowedOrigins := []string{
		"http://localhost:5173",
		"http://localhost:3000",
		frontendOrigin,
	}
	if extra := strings.TrimSpace(os.Getenv("CORS_ORIGINS")); extra != "" {
		allowedOrigins = append(allowedOrigins, strings.Split(extra, ",")...)
	}

	// Add logging middleware
	app.Use(middleware.LoggingMiddleware(logger.Log))

	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     strings.Join(allowedOrigins, ","),
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
		&domain.Roadmap{},
		&domain.Discussion{},
		&domain.DiscussionComment{},
		&domain.DiscussionVote{},
		&domain.Contest{},
		&domain.ContestProblem{},
		&domain.ContestParticipant{},
		&domain.ContestLeaderboardEntry{},
		&domain.GlobalLeaderboardEntry{},
		&domain.FrontendChallenge{},
		&domain.BattleMatch{},
		&domain.BattleSubmission{},
		&domain.BattleEloHistory{},
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

	// Fix existing users with zero rating (default should be 1000)
	db.Model(&domain.User{}).Where("rating = 0").Update("rating", 1000)

	// Initialize Redis
	redisAddr := cfg.REDISURL
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	redisOptions, err := redis.ParseURL(redisAddr)
	if err != nil {
		logger.Fatal("Failed to parse Redis URL", zap.Error(err))
	}
	redisClient := redis.NewClient(redisOptions)
	logger.Info("Redis client initialized", zap.String("addr", redisAddr))

	// Initialize services for battle system
	battleRepo := repo.NewBattleRepo(db)
	challengeRepo := repo.NewFrontendChallengeRepo(db)
	userRepo := repo.NewUserRepo(db)

	// Initialize admin stats service
	adminStatsRepo := repo.NewAdminStatsRepo(db)
	adminStatsSvc := service.NewAdminStatsService(adminStatsRepo, logger.Log)

	screenshotsDir := os.Getenv("SCREENSHOTS_DIR")
	if screenshotsDir == "" {
		screenshotsDir = "screenshots"
	}
	judgeSvc := service.NewJudgeService(screenshotsDir)
	defer judgeSvc.Close()

	// Seed default challenges if none exist
	service.SeedChallenges(challengeRepo, judgeSvc)

	battleSvc := &service.BattleService{
		BattleRepo:    battleRepo,
		ChallengeRepo: challengeRepo,
		UserRepo:      userRepo,
		JudgeService:  judgeSvc,
	}

	// Initialize WebSocket hub
	hub := ws.NewHub()
	go hub.Run()

	// Initialize matchmaking service
	matchmakingSvc := ws.NewMatchmakingService(redisClient, hub, battleSvc, challengeRepo, userRepo)
	go matchmakingSvc.Start()

	// Initialize WebSocket handler
	wsHandler := ws.NewWSHandler(hub, battleSvc, matchmakingSvc)

	auth := helper.SetupAuth(cfg.SECRETKEY)
	rh := &rest.RestHandlers{
		App:           app,
		DB:            db,
		Configs:       cfg,
		Auth:          *auth,
		Logger:        logger.Log,
		AdminStatsSvc: adminStatsSvc,
	}

	// Setup REST routes
	SetupRoutes(rh)

	// Setup battle REST routes
	handlers.SetupBattleRoutes(rh, battleSvc, challengeRepo, judgeSvc)

	// Setup admin stats routes
	handlers.SetupAdminStatsRoutes(rh, adminStatsSvc)

	// Setup Gemini hint service
	if cfg.GOOGLEAPIKEY != "" {
		hintSvc, err := service.NewHintService(cfg.GOOGLEAPIKEY)
		if err != nil {
			logger.Warn("Failed to initialize hint service, hints will be unavailable", zap.Error(err))
		} else {
			handlers.SetupHintRoutes(rh, hintSvc)
			logger.Info("Hint service initialized")
		}
	}

	// Periodically clean up expired WS tickets
	go func() {
		for range time.Tick(30 * time.Second) {
			wsTickets.Range(func(key, value any) bool {
				if t, ok := value.(*wsTicket); ok && time.Now().After(t.ExpiresAt) {
					wsTickets.Delete(key)
				}
				return true
			})
		}
	}()

	// WS ticket endpoint — exchanges a JWT (from Authorization header) for a one-time WS ticket.
	// The frontend calls this first, then passes the ticket as a query param when opening the WebSocket.
	app.Post("/api/ws-ticket", func(c *fiber.Ctx) error {
		tokenStr := strings.TrimSpace(c.Get("Authorization"))
		if tokenStr == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Authorization header required"})
		}
		user, err := auth.VerifyToken(tokenStr)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
		}

		ticketID := uuid.New().String()
		wsTickets.Store(ticketID, &wsTicket{
			UserID:    user.ID,
			ExpiresAt: time.Now().Add(120 * time.Second),
		})

		logger.Info("WS ticket issued", zap.String("user_id", user.ID.String()))
		return c.JSON(fiber.Map{"ticket": ticketID})
	})

	// Setup WebSocket endpoint
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			// Method 1: one-time ticket from query param (preferred — works cross-origin)
			ticket := c.Query("ticket")
			if ticket != "" {
				if val, ok := wsTickets.LoadAndDelete(ticket); ok {
					t := val.(*wsTicket)
					if time.Now().Before(t.ExpiresAt) {
						c.Locals("user_id", t.UserID)
						return c.Next()
					}
					logger.Warn("WS ticket expired", zap.String("ticket", ticket), zap.Time("expired_at", t.ExpiresAt))
				}
				logger.Warn("WS ticket invalid or missing", zap.String("ticket", ticket))
				return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired ticket"})
			}

			// No cookie fallback — WebSockets should use the ticket flow.
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired ticket"})
		}
		return fiber.ErrUpgradeRequired
	})

	app.Get("/ws/battle", websocket.New(func(c *websocket.Conn) {
		userID, ok := c.Locals("user_id").(uuid.UUID)
		if !ok {
			c.WriteJSON(fiber.Map{"type": "error", "payload": fiber.Map{"message": "Authentication failed"}})
			c.Close()
			return
		}

		client := &ws.Client{
			ID:     uuid.New().String(),
			UserID: userID,
			Conn:   c,
			Send:   make(chan []byte, 256),
			Hub:    hub,
		}

		hub.Register <- client

		go client.WritePump()
		client.ReadPump(wsHandler)
	}))

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
	handlers.SetupContestRoutes(rh)
	handlers.SetupRoadmapRoutes(rh)
}
