package api

import (
	"fmt"

	"github.com/gofiber/fiber/v2"
	"github.com/sudankdk/codearena/configs"
)

func StartServer(cfg configs.AppConfigs) {
	app := fiber.New()
	fmt.Println(cfg.DSN)

	app.Listen(":" + cfg.PORT)
}
