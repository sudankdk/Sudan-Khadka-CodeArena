package rest

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/helper"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type RestHandlers struct {
	App     *fiber.App
	DB      *gorm.DB
	Configs configs.AppConfigs
	Auth    helper.Auth
	Logger  *zap.Logger
}
