package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/google/uuid"

	"github.com/gofiber/fiber/v2"
	"github.com/shareed2k/goth_fiber"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

type UserHandlers struct {
	svc           service.UserService
	logger        *zap.Logger
	adminStatsSvc *service.AdminStatsService
}

func SetupRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.UserService{
		Repo:   repo.NewUserRepo(rh.DB),
		Auth:   rh.Auth,
		Config: rh.Configs,
	}
	handler := UserHandlers{
		svc:           svc,
		logger:        rh.Logger,
		adminStatsSvc: rh.AdminStatsSvc,
	}
	app.Get("/health", handler.HealthCheck)
	app.Get("/auth/:provider", handler.OAuthRedirect)
	app.Get("/auth/:provider/callback", handler.OAuthCallback)
	pubRoutes := app.Group("/users")
	pubRoutes.Post("/register", handler.Register)
	pubRoutes.Post("/login", handler.Login)
	pubRoutes.Post("/logout", rh.Auth.Authorize, handler.Logout)
	pubRoutes.Get("/", handler.List)
	pubRoutes.Get("/me", rh.Auth.Authorize, func(c *fiber.Ctx) error {
		user, err := rh.Auth.CurrentUserInfo(c)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Not authenticated"})
		}
		return c.JSON(fiber.Map{
			"user": user,
		})
	})

	adminRoutes := app.Group("/admin/users", rh.Auth.Authorize, rh.Auth.RequireAdmin)
	adminRoutes.Get("/", handler.AdminList)
	adminRoutes.Get("/stats", handler.AdminStats)
	adminRoutes.Get("/:id", handler.AdminGet)
	adminRoutes.Post("/", handler.AdminCreate)
	adminRoutes.Put("/:id", handler.AdminUpdate)

}

func (u *UserHandlers) Register(ctx *fiber.Ctx) error {
	var req dto.UserRegister
	if err := ctx.BodyParser(&req); err != nil {
		u.logger.Warn("Invalid registration payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("Invalid Payload"))
	}

	u.logger.Info("User registration attempt", zap.String("email", req.Email))
	user, err := u.svc.Register(req)
	if err != nil {
		u.logger.Error("Failed to register user", zap.String("email", req.Email), zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	u.logger.Info("User registered successfully", zap.String("email", user.Email))

	return rest.SuccessMessage(ctx, "user created", user)
}

func (u *UserHandlers) Login(ctx *fiber.Ctx) error {
	var req dto.UserLogin
	if err := ctx.BodyParser(&req); err != nil {
		u.logger.Warn("Invalid login payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("Invalid Payload"))
	}

	u.logger.Info("Login attempt", zap.String("email", req.Email))
	token, user, err := u.svc.Login(req)
	if err != nil {
		u.logger.Warn("Login failed", zap.String("email", req.Email), zap.Error(err))
		return rest.InternalError(ctx, err)
	}
	ctx.Locals("user", user)
	u.logger.Info("Login successful", zap.String("email", user.Email))

	return rest.SuccessMessage(ctx, "Auth complete", fiber.Map{
		"token": token,
		"user":  user,
	})
}
func (u *UserHandlers) Logout(ctx *fiber.Ctx) error {

	return ctx.JSON(fiber.Map{"message": "logout successful"})
}

func (u *UserHandlers) OAuthRedirect(ctx *fiber.Ctx) error {
	provider := ctx.Params("provider")
	if provider == "" {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, errors.New("provider not specified"))
	}

	return goth_fiber.BeginAuthHandler(ctx)
}

func (u *UserHandlers) OAuthCallback(ctx *fiber.Ctx) error {
	u.logger.Info("OAuth callback initiated")
	oAuithUser, err := goth_fiber.CompleteUserAuth(ctx)
	if err != nil {
		u.logger.Error("OAuth authentication failed", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("OAuth failed: %v", err))
	}

	u.logger.Info("OAuth user retrieved", zap.String("email", oAuithUser.Email))
	dbUser, _ := u.svc.Repo.FindUser(oAuithUser.Email)
	if dbUser.ID == [16]byte{} {
		u.logger.Info("Creating new user from OAuth", zap.String("email", oAuithUser.Email))
		newUser := dto.UserRegister{
			Username: oAuithUser.Name,
			Email:    oAuithUser.Email,
			Password: "",
		}

		dbUser, err = u.svc.Register(newUser)
		if err != nil {
			u.logger.Error("Failed to register OAuth user", zap.String("email", oAuithUser.Email), zap.Error(err))
			return rest.InternalError(ctx, err)
		}
		u.logger.Info("New user created from OAuth", zap.String("email", dbUser.Email))
	}

	token, err := u.svc.Auth.GenerateToken(dbUser.ID, dbUser.Email, dbUser.Role)
	if err != nil {
		u.logger.Error("Failed to generate token", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	ctx.Locals("user", dbUser)
	u.logger.Info("OAuth login successful", zap.String("email", dbUser.Email))

	// Redirect back to frontend with the token in the URL fragment so it can be stored client-side.
	redirectURL := "http://localhost:5173/oauth/success#token=" + token
	return ctx.Redirect(redirectURL)
}

func (u *UserHandlers) HealthCheck(ctx *fiber.Ctx) error {
	return ctx.Status(http.StatusOK).JSON(fiber.Map{"successfull": "true"})
}

func (u *UserHandlers) List(ctx *fiber.Ctx) error {
	u.logger.Info("Listing all users")
	users, err := u.svc.ListUsers()
	if err != nil {
		u.logger.Error("Failed to list users", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("Listing of users failed: %v", err))
	}

	u.logger.Info("Users listed successfully", zap.Int("count", len(users)))
	return rest.SuccessMessage(ctx, "users list found", users)
}

func (u *UserHandlers) AdminList(ctx *fiber.Ctx) error {
	users, err := u.svc.ListUsers()
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("listing of users failed: %v", err))
	}
	return rest.SuccessMessage(ctx, "users list found", users)
}

func (u *UserHandlers) AdminGet(ctx *fiber.Ctx) error {
	userID, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("invalid user id"))
	}

	user, err := u.svc.Repo.FindUserById(userID)
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusNotFound, fmt.Errorf("user not found"))
	}

	return rest.SuccessMessage(ctx, "user found", user)
}

func (u *UserHandlers) AdminCreate(ctx *fiber.Ctx) error {
	var req dto.AdminCreateUser
	if err := ctx.BodyParser(&req); err != nil {
		u.logger.Warn("Invalid admin create payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("Invalid Payload"))
	}

	created, err := u.svc.AdminCreateUser(req)
	if err != nil {
		u.logger.Error("Failed to create user", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "user created", created)
}

func (u *UserHandlers) AdminUpdate(ctx *fiber.Ctx) error {
	userID, err := uuid.Parse(ctx.Params("id"))
	if err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("invalid user id"))
	}

	var req dto.UserUpdate
	if err := ctx.BodyParser(&req); err != nil {
		u.logger.Warn("Invalid admin update payload", zap.Error(err))
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("Invalid Payload"))
	}

	updated, err := u.svc.UpdateUser(userID, req)
	if err != nil {
		u.logger.Error("Failed to update user", zap.Error(err))
		return rest.InternalError(ctx, err)
	}

	return rest.SuccessMessage(ctx, "user updated", updated)
}

func (u *UserHandlers) AdminStats(ctx *fiber.Ctx) error {
	stats, err := u.svc.UserStats()
	if err != nil {
		u.logger.Error("Failed to get user stats", zap.Error(err))
		return rest.InternalError(ctx, err)
	}
	return rest.SuccessMessage(ctx, "user stats", stats)
}
