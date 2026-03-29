package api

import (
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	executer "github.com/sudankdk/ceev2/internal/Executer"
)

type Server struct {
	exec *executer.Executor
}

func NewServer(exec *executer.Executor) *Server {
	return &Server{exec: exec}
}

func (s *Server) StartServer() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     "http://localhost:5173,https://sudan-khadka-code-arena.vercel.app,",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
	}))

	s.setupRoutes(app)

	return app.Listen(":" + port)
}
