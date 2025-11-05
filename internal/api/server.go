package api

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/api/rest/handlers"
	"github.com/sudankdk/codearena/internal/domain"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func StartServer(cfg configs.AppConfigs) {
	app := fiber.New()
	fmt.Println(cfg.DSN)
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("error in connection of db: %v", err)
	}
	log.Println("Database connected")
	if err := db.AutoMigrate(&domain.User{}); err != nil {
		log.Fatalf("error in running migrations %v", err.Error())
	}
	rh := &rest.RestHandlers{
		App:     app,
		DB:      db,
		Configs: cfg,
	}
	SetupRoutes(rh)
	app.Listen(":" + cfg.PORT)
}

func SetupRoutes(rh *rest.RestHandlers) {
	handlers.SetupRoutes(rh)
}
