package api

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/session"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/api/rest"
	"github.com/sudankdk/codearena/internal/api/rest/handlers"
	"github.com/sudankdk/codearena/internal/domain"
	"github.com/sudankdk/codearena/internal/helper"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func StartServer(cfg configs.AppConfigs) {
	
	// app := fiber.New()
	store := session.New()
	app := fiber.New()
	app.Use(func(c *fiber.Ctx) error {
    sess, err := store.Get(c)
    if err != nil {
        return err
    }
    c.Locals("session", sess)
    return c.Next()
})
	app.Use(cors.New(cors.Config{
    AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
    AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
	}))
	fmt.Println(cfg.DSN)
	db, err := gorm.Open(postgres.Open(cfg.DSN), &gorm.Config{})
	if err != nil {
		log.Fatalf("error in connection of db: %v", err)
	}
	log.Println("Database connected")
	if err := db.AutoMigrate(&domain.User{}); err != nil {
		log.Fatalf("error in running migrations %v", err.Error())
	}
	auth := helper.SetupAuth(cfg.SECRETKEY)
	rh := &rest.RestHandlers{
		App:     app,
		DB:      db,
		Configs: cfg,
		Auth:    *auth,
	}
	SetupRoutes(rh)
	app.Listen(":" + cfg.PORT)
}

func SetupRoutes(rh *rest.RestHandlers) {
	handlers.SetupRoutes(rh)
}
