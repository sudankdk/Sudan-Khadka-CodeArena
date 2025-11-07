package handlers

import (
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/dto"
	"github.com/sudankdk/codearena/internal/repo"
	"github.com/sudankdk/codearena/internal/service"
)

type UserHandlers struct {
	svc service.UserService
}

func SetupRoutes(rh *rest.RestHandlers) {
	app := rh.App
	svc := service.UserService{
		Repo:   repo.NewUserRepo(rh.DB),
		Auth:   rh.Auth,
		Config: rh.Configs,
	}
	handler := UserHandlers{
		svc: svc,
	}
	app.Get("/health", handler.HealthCheck)
	pubRoutes := app.Group("/users")
	pubRoutes.Post("/register", handler.Register)
	pubRoutes.Post("/login", handler.Login)
}

func (u *UserHandlers) Register(ctx *fiber.Ctx) error {
	var req dto.UserRegister
	if err := ctx.BodyParser(&req); err != nil {
		return rest.ErrorMessage(ctx, http.StatusBadRequest, fmt.Errorf("Invalid Payload"))
	}
	user, err := u.svc.Register(req)
	if err != nil {
		return rest.InternalError(ctx, err)
	}
	return rest.SuccessMessage(ctx, "user created", user)
}

func (u *UserHandlers) Login(ctx *fiber.Ctx) error {
	return nil
}

func (u *UserHandlers) HealthCheck(ctx *fiber.Ctx) error {
	return ctx.Status(http.StatusOK).JSON(fiber.Map{"successfull": "true"})
}
