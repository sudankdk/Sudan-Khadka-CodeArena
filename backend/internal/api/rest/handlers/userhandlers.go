package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/shareed2k/goth_fiber"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
	"go.uber.org/zap"
)

type UserHandlers struct {
	svc    service.UserService
	logger *zap.Logger
}

func SetupRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.UserService{
		Repo:   repo.NewUserRepo(rh.DB),
		Auth:   rh.Auth,
		Config: rh.Configs,
	}
	handler := UserHandlers{
		svc:    svc,
		logger: rh.Logger,
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

	u.svc.Auth.CreateCookie(ctx, "token", token)
	u.logger.Info("Login successful", zap.String("email", user.Email))
	return rest.SuccessMessage(ctx, "Auth complete", fiber.Map{
		"token": token,
		"user":  user,
	})

}

func (u *UserHandlers) Logout(ctx *fiber.Ctx) error {
	ctx.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		MaxAge:   -1,
		HTTPOnly: true,
		Secure:   false,
		SameSite: "None",
		Path:     "/",
	})

	return ctx.JSON(fiber.Map{
		"message": "logout successful",
	})
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

	cookie := &fiber.Cookie{
		Name:     "token",
		Value:    token,
		HTTPOnly: true,
		Secure:   true,
		SameSite: "None",
		Path:     "/",
		MaxAge:   3600,
	}
	ctx.Cookie(cookie)

	ctx.Locals("user", dbUser)
	u.logger.Info("OAuth login successful", zap.String("email", dbUser.Email))
	return ctx.Redirect("http://localhost:5173/oauth/success")
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
