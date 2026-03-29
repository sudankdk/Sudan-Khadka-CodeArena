package api

import (
	"os"
	"strings"

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

	frontendOrigin := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
	if frontendOrigin == "" {
		frontendOrigin = "https://sudan-khadka-code-arena.vercel.app"
	}
	allowedOrigins := []string{
		"http://localhost:5173",
		frontendOrigin,
	}
	if extra := strings.TrimSpace(os.Getenv("CORS_ORIGINS")); extra != "" {
		allowedOrigins = append(allowedOrigins, strings.Split(extra, ",")...)
	}

	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowCredentials: true,
		AllowOrigins:     strings.Join(allowedOrigins, ","),
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
	}))

	s.setupRoutes(app)

	return app.Listen(":" + port)
}
