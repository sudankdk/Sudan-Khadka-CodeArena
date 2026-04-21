package configs

import (
	"errors"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
)

type AppConfigs struct {
	PORT         string
	DSN          string
	SECRETKEY    string
	CLIENTSECRET string
	CLIENTID     string
	// GITHUBCLIENTSECRET string
	// GITHUBCLIENTID     string
	// GITHUBCALLBACKURL  string
	GOOGLECALLBACKURL string
	GOOGLEAPIKEY      string
	GOOGLEAPIURL      string
	REDISURL          string
	FRONTENDURL       string
	SMTPHost          string
	SMTPPort          int
	SMTPUser          string
	SMTPPass          string
	SMTPFrom          string
	SMTPFromName      string
	SMTPUseTLS        bool
	PasswordResetTTL  int
}

func SetUpEnv() (AppConfigs, error) {
	if os.Getenv("APP_ENV") == "dev" {
		if err := godotenv.Load(); err != nil {
			log.Fatal("Error loading .env file")
		}
		log.Println("Loaded .env file")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dsn := os.Getenv("DSN")
	if dsn == "" {
		dsn = os.Getenv("DATABASE_URL")
	}

	redisURL := os.Getenv("redis_url")
	if redisURL == "" {
		redisURL = os.Getenv("REDIS_URL")
	}
	if redisURL == "" {
		redisURL = os.Getenv("REDIS_ADDR")
	}

	frontendURL := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/")
	if frontendURL == "" {
		if os.Getenv("APP_ENV") == "dev" {
			frontendURL = "http://localhost:5173"
		} else {
			frontendURL = "https://sudan-khadka-code-arena.vercel.app"
		}
	}

	smtpPort := 587
	if portStr := strings.TrimSpace(os.Getenv("SMTP_PORT")); portStr != "" {
		if parsed, err := strconv.Atoi(portStr); err == nil {
			smtpPort = parsed
		}
	}

	resetTTL := 30
	if ttlStr := strings.TrimSpace(os.Getenv("PASSWORD_RESET_TTL_MINUTES")); ttlStr != "" {
		if parsed, err := strconv.Atoi(ttlStr); err == nil {
			resetTTL = parsed
		}
	}

	cfg := AppConfigs{
		PORT:         port,
		DSN:          dsn,
		SECRETKEY:    os.Getenv("SECRETKEY"),
		CLIENTSECRET: os.Getenv("CLIENTSECRET"),
		CLIENTID:     os.Getenv("CLIENTID"),
		// GITHUBCLIENTSECRET: os.Getenv("GITHUBCLIENTSECRET"),
		// GITHUBCLIENTID:     os.Getenv("GITHUBCLIENTID"),
		// GITHUBCALLBACKURL:  os.Getenv("GITHUB_CALLBACK_URL"),
		GOOGLECALLBACKURL: os.Getenv("GOOGLE_CALLBACK_URL"),
		GOOGLEAPIKEY:      os.Getenv("GOOGLE_API_KEY"),
		GOOGLEAPIURL:      os.Getenv("GOOGLE_API_URL"),
		REDISURL:          redisURL,
		FRONTENDURL:       frontendURL,
		SMTPHost:          os.Getenv("SMTP_HOST"),
		SMTPPort:          smtpPort,
		SMTPUser:          os.Getenv("SMTP_USER"),
		SMTPPass:          os.Getenv("SMTP_PASS"),
		SMTPFrom:          os.Getenv("SMTP_FROM"),
		SMTPFromName:      os.Getenv("SMTP_FROM_NAME"),
		SMTPUseTLS:        strings.EqualFold(os.Getenv("SMTP_USE_TLS"), "true"),
		PasswordResetTTL:  resetTTL,
	}

	switch {
	case cfg.DSN == "":
		return AppConfigs{}, errors.New("DSN missing in environment (set DSN or DATABASE_URL)")
	case cfg.SECRETKEY == "":
		return AppConfigs{}, errors.New("SECRETKEY missing in environment")
	case cfg.CLIENTID == "" || cfg.CLIENTSECRET == "":
		return AppConfigs{}, errors.New("Google CLIENTID or CLIENTSECRET missing in environment")
	case cfg.GOOGLECALLBACKURL == "":
		return AppConfigs{}, errors.New("GOOGLECALLBACKURL missing in environment")
	case cfg.GOOGLEAPIKEY == "":
		return AppConfigs{}, errors.New("GOOGLEAPIKEY missing in environment")
	case cfg.GOOGLEAPIURL == "":
		return AppConfigs{}, errors.New("GOOGLEAPIURL missing in environment")
	}
	// case cfg.GITHUBCLIENTID == "" || cfg.GITHUBCLIENTSECRET == "":
	// 	return AppConfigs{}, errors.New("GitHub CLIENTID or CLIENTSECRET missing in environment")
	// case cfg.GITHUBCALLBACKURL == "":
	// 	return AppConfigs{}, errors.New("GITHUBCALLBACKURL missing in environment")
	// }

	return cfg, nil
}

func InintOAuthConfigs() {
	goth.UseProviders(
		google.New(os.Getenv("CLIENTID"), os.Getenv("CLIENTSECRET"), os.Getenv("GOOGLE_CALLBACK_URL"), "email", "profile"),
		// github.New(os.Getenv("GITHUBCLIENTID"), os.Getenv("GITHUBCLIENTSECRET"), os.Getenv("GITHUB_CALLBACK_URL")),
	)
}
