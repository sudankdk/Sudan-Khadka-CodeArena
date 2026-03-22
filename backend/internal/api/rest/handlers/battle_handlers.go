package handlers

import (
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

// BattleHandlers handles REST endpoints for battles.
type BattleHandlers struct {
	battleSvc     *service.BattleService
	challengeRepo repo.FrontendChallengeRepo
	judgeSvc      *service.JudgeService
	logger        *zap.Logger
}

// SetupBattleRoutes registers battle-related REST endpoints.
func SetupBattleRoutes(rh *rest.RestHandlers, battleSvc *service.BattleService, challengeRepo repo.FrontendChallengeRepo, judgeSvc *service.JudgeService) {
	handler := &BattleHandlers{
		battleSvc:     battleSvc,
		challengeRepo: challengeRepo,
		judgeSvc:      judgeSvc,
		logger:        rh.Logger,
	}

	// Public routes
	app := rh.App
	app.Get("/battles/challenges", handler.ListChallenges)
	app.Get("/battles/challenges/:id", handler.GetChallenge)
	app.Get("/battles/challenges/:id/reference", handler.GetReferenceScreenshot)
	app.Get("/battles/leaderboard", handler.GetBattleLeaderboard)

	// Protected routes
	battleRoutes := app.Group("/battles", rh.Auth.Authorize)
	battleRoutes.Post("/challenges", handler.CreateChallenge)
	battleRoutes.Get("/history", handler.GetBattleHistory)
	battleRoutes.Get("/stats", handler.GetBattleStats)
	battleRoutes.Get("/match/:id", handler.GetMatchDetail)
	battleRoutes.Get("/elo-history", handler.GetEloHistory)
}

// CreateChallenge creates a new frontend battle challenge.
func (bh *BattleHandlers) CreateChallenge(ctx *fiber.Ctx) error {
	// Verify admin role
	user := ctx.Locals("user").(domain.User)
	if user.Role != domain.ADMIN {
		return ctx.Status(http.StatusForbidden).JSON(fiber.Map{"message": "Admin access required"})
	}

	var req dto.CreateFrontendChallengeDTO
	if err := ctx.BodyParser(&req); err != nil {
		bh.logger.Warn("Invalid challenge payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, err)
	}

	if req.Title == "" || req.BrokenHTML == "" || req.BrokenCSS == "" {
		return ctx.Status(http.StatusBadRequest).JSON(fiber.Map{"message": "title, broken_html, and broken_css are required"})
	}

	// Set defaults
	if req.PixelThreshold == 0 {
		req.PixelThreshold = 0.1
	}
	if req.DiffThreshold == 0 {
		req.DiffThreshold = 0.02
	}
	if req.TimeLimit == 0 {
		switch req.Difficulty {
		case "easy":
			req.TimeLimit = 300 // 5 minutes
		case "hard":
			req.TimeLimit = 1200 // 20 minutes
		default:
			req.TimeLimit = 720 // 12 minutes
		}
	}
	if req.ViewportWidth == 0 {
		req.ViewportWidth = 1280
	}
	if req.ViewportHeight == 0 {
		req.ViewportHeight = 720
	}

	// Generate reference screenshot from the correct/fixed code
	// The admin must provide the correct version in a separate field or we generate from a reference HTML
	// For now, we expect a reference_html, reference_css, reference_js in the form
	refHTML := ctx.FormValue("reference_html")
	refCSS := ctx.FormValue("reference_css")
	refJS := ctx.FormValue("reference_js")

	var refScreenshotPath string

	if refHTML != "" || refCSS != "" {
		// Generate screenshot from reference code
		var err error
		refScreenshotPath, err = bh.judgeSvc.GenerateReferenceScreenshot(
			refHTML, refCSS, refJS,
			req.ViewportWidth, req.ViewportHeight,
		)
		if err != nil {
			bh.logger.Error("Failed to generate reference screenshot", zap.Error(err))
			return rest.InternalError(ctx, err)
		}
	} else {
		// Check for uploaded file
		file, err := ctx.FormFile("reference_screenshot")
		if err != nil {
			return ctx.Status(http.StatusBadRequest).JSON(fiber.Map{
				"message": "Either reference code (reference_html + reference_css) or reference_screenshot file is required",
			})
		}
		refScreenshotPath = "screenshots/ref_" + uuid.New().String() + ".png"
		if err := ctx.SaveFile(file, refScreenshotPath); err != nil {
			bh.logger.Error("Failed to save reference screenshot", zap.Error(err))
			return rest.InternalError(ctx, err)
		}
	}

	challenge := &domain.FrontendChallenge{
		Title:                   req.Title,
		Description:             req.Description,
		Difficulty:              req.Difficulty,
		BrokenHTML:              req.BrokenHTML,
		BrokenCSS:               req.BrokenCSS,
		BrokenJS:                req.BrokenJS,
		ReferenceScreenshotPath: refScreenshotPath,
		PixelThreshold:          req.PixelThreshold,
		DiffThreshold:           req.DiffThreshold,
		TimeLimit:               req.TimeLimit,
		ViewportWidth:           req.ViewportWidth,
		ViewportHeight:          req.ViewportHeight,
		DOMAssertions:           req.DOMAssertions,
	}

	if err := bh.challengeRepo.Create(challenge); err != nil {
		bh.logger.Error("Failed to create challenge", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	bh.logger.Info("Challenge created", zap.String("id", challenge.ID.String()), zap.String("title", challenge.Title))
	return rest.SuccessMessage(ctx, "Challenge created successfully", challenge)
}

// ListChallenges returns paginated list of challenges.
func (bh *BattleHandlers) ListChallenges(ctx *fiber.Ctx) error {
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("page_size", "10"))
	difficulty := ctx.Query("difficulty")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	challenges, total, err := bh.challengeRepo.List(page, pageSize, difficulty)
	if err != nil {
		bh.logger.Error("Failed to list challenges", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Challenges retrieved", fiber.Map{
		"challenges": challenges,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
	})
}

// GetChallenge returns a single challenge by ID.
func (bh *BattleHandlers) GetChallenge(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(fiber.Map{"message": "Invalid challenge ID"})
	}

	challenge, err := bh.challengeRepo.GetByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(fiber.Map{"message": "Challenge not found"})
	}

	return rest.SuccessMessage(ctx, "Challenge retrieved", challenge)
}

// GetReferenceScreenshot serves the reference screenshot image for a challenge.
func (bh *BattleHandlers) GetReferenceScreenshot(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(fiber.Map{"message": "Invalid challenge ID"})
	}

	challenge, err := bh.challengeRepo.GetByID(id)
	if err != nil {
		return ctx.Status(http.StatusNotFound).JSON(fiber.Map{"message": "Challenge not found"})
	}

	// Normalize separators in case the path was saved on a different OS.
	refPath := strings.ReplaceAll(challenge.ReferenceScreenshotPath, "\\", string(os.PathSeparator))
	refPath = strings.ReplaceAll(refPath, "/", string(os.PathSeparator))
	refPath = filepath.Clean(refPath)
	if refPath == "" {
		return ctx.Status(http.StatusNotFound).JSON(fiber.Map{"message": "Reference screenshot not found"})
	}

	if !filepath.IsAbs(refPath) {
		screenshotsDir := os.Getenv("SCREENSHOTS_DIR")
		if screenshotsDir == "" {
			screenshotsDir = "screenshots"
		}

		// Normalize screenshotsDir and make absolute for consistent joining.
		screenshotsDir = filepath.Clean(strings.ReplaceAll(screenshotsDir, "\\", string(os.PathSeparator)))
		if !filepath.IsAbs(screenshotsDir) {
			cwd, _ := os.Getwd()
			screenshotsDir = filepath.Join(cwd, screenshotsDir)
		}

		// If the stored path already starts with the screenshots folder name, strip it to avoid duplication.
		base := filepath.Base(screenshotsDir)
		if strings.HasPrefix(refPath, base+string(os.PathSeparator)) {
			refPath = strings.TrimPrefix(refPath, base+string(os.PathSeparator))
		}

		refPath = filepath.Join(screenshotsDir, refPath)
	}

	if _, err := os.Stat(refPath); err != nil {
		return ctx.Status(http.StatusNotFound).JSON(fiber.Map{"message": "Reference screenshot not found"})
	}

	ctx.Set("Content-Type", "image/png")
	ctx.Set("Cache-Control", "public, max-age=3600")
	return ctx.SendFile(refPath)
}

// GetBattleHistory returns the current user's battle match history.
func (bh *BattleHandlers) GetBattleHistory(ctx *fiber.Ctx) error {
	user := ctx.Locals("user").(domain.User)
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("page_size", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}

	history, total, err := bh.battleSvc.GetMatchHistory(user.ID, page, pageSize)
	if err != nil {
		bh.logger.Error("Failed to get battle history", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Battle history retrieved", fiber.Map{
		"history":   history,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetBattleStats returns the current user's battle statistics.
func (bh *BattleHandlers) GetBattleStats(ctx *fiber.Ctx) error {
	user := ctx.Locals("user").(domain.User)

	stats, err := bh.battleSvc.GetBattleStats(user.ID)
	if err != nil {
		bh.logger.Error("Failed to get battle stats", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Battle stats retrieved", stats)
}

// GetMatchDetail returns detailed match information (for replay).
func (bh *BattleHandlers) GetMatchDetail(ctx *fiber.Ctx) error {
	id, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return ctx.Status(http.StatusBadRequest).JSON(fiber.Map{"message": "Invalid match ID"})
	}

	detail, err := bh.battleSvc.GetMatchDetail(id)
	if err != nil {
		bh.logger.Error("Failed to get match detail", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Match detail retrieved", detail)
}

// GetBattleLeaderboard returns the battle leaderboard.
func (bh *BattleHandlers) GetBattleLeaderboard(ctx *fiber.Ctx) error {
	page, _ := strconv.Atoi(ctx.Query("page", "1"))
	pageSize, _ := strconv.Atoi(ctx.Query("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}

	entries, total, err := bh.battleSvc.GetBattleLeaderboard(page, pageSize)
	if err != nil {
		bh.logger.Error("Failed to get battle leaderboard", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "Battle leaderboard retrieved", fiber.Map{
		"entries":   entries,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetEloHistory returns the current user's ELO rating history.
func (bh *BattleHandlers) GetEloHistory(ctx *fiber.Ctx) error {
	user := ctx.Locals("user").(domain.User)
	limit, _ := strconv.Atoi(ctx.Query("limit", "50"))

	if limit < 1 {
		limit = 50
	}

	history, err := bh.battleSvc.GetEloHistory(user.ID, limit)
	if err != nil {
		bh.logger.Error("Failed to get ELO history", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "ELO history retrieved", history)
}
