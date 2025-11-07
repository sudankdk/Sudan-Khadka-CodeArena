package configs

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type AppConfigs struct {
	PORT      string
	DSN       string
	SECRETKEY string
}

func SetUpEnv() (AppConfigs, error) {
	if os.Getenv("APP_ENV") == "dev" {
		if err := godotenv.Load(); err != nil {
			log.Fatal("Error loading .env file")
		}
	}
	port := os.Getenv("PORT")
	if port == "" {
		return AppConfigs{}, errors.New("Port missing in env")
	}
	dsn := os.Getenv("DSN")
	if dsn == "" {
		return AppConfigs{}, errors.New("DSN missing in env")
	}
	sk := os.Getenv("SECRETKEY")
	if sk == "" {
		return AppConfigs{}, errors.New("Secret key missing in env")
	}
	cfg := AppConfigs{
		PORT:      port,
		DSN:       dsn,
		SECRETKEY: sk,
	}
	return cfg, nil
}
