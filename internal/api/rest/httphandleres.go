package rest

import (
	"github.com/gofiber/fiber/v2"
	"github.com/sudankdk/codearena/configs"
	"gorm.io/gorm"
)


type RestHandlers struct{
	App *fiber.App
	DB *gorm.DB
	Configs configs.AppConfigs
}