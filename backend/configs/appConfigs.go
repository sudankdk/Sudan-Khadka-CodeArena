package configs

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/markbates/goth"
	"github.com/markbates/goth/providers/google"
	"github.com/markbates/goth/providers/github"
)

type AppConfigs struct {
	PORT               string
	DSN                string
	SECRETKEY          string
	CLIENTSECRET       string
	CLIENTID           string
	GITHUBCLIENTSECRET string
	GITHUBCLIENTID     string
	GITHUBCALLBACKURL  string
	GOOGLECALLBACKURL  string
}

func SetUpEnv() (AppConfigs, error) {
	if os.Getenv("APP_ENV") == "dev" {
		if err := godotenv.Load(); err != nil {
			log.Fatal("Error loading .env file")
		}
	}

	cfg := AppConfigs{
		PORT:               os.Getenv("PORT"),
		DSN:                os.Getenv("DSN"),
		SECRETKEY:          os.Getenv("SECRETKEY"),
		CLIENTSECRET:       os.Getenv("CLIENTSECRET"),
		CLIENTID:           os.Getenv("CLIENTID"),
		GITHUBCLIENTSECRET: os.Getenv("GITHUBCLIENTSECRET"),
		GITHUBCLIENTID:     os.Getenv("GITHUBCLIENTID"),
		GITHUBCALLBACKURL:  os.Getenv("GITHUB_CALLBACK_URL"),
		GOOGLECALLBACKURL:  os.Getenv("GOOGLE_CALLBACK_URL"),
	}

	switch {
	case cfg.PORT == "":
		return AppConfigs{}, errors.New("PORT missing in environment")
	case cfg.DSN == "":
		return AppConfigs{}, errors.New("DSN missing in environment")
	case cfg.SECRETKEY == "":
		return AppConfigs{}, errors.New("SECRETKEY missing in environment")
	case cfg.CLIENTID == "" || cfg.CLIENTSECRET == "":
		return AppConfigs{}, errors.New("Google CLIENTID or CLIENTSECRET missing in environment")
	case cfg.GOOGLECALLBACKURL == "":
		return AppConfigs{}, errors.New("GOOGLECALLBACKURL missing in environment")
	case cfg.GITHUBCLIENTID == "" || cfg.GITHUBCLIENTSECRET == "":
		return AppConfigs{}, errors.New("GitHub CLIENTID or CLIENTSECRET missing in environment")
	case cfg.GITHUBCALLBACKURL == "":
		return AppConfigs{}, errors.New("GITHUBCALLBACKURL missing in environment")
	}

	return cfg, nil
}


func InintOAuthConfigs() {
	goth.UseProviders(
		google.New(os.Getenv("CLIENTID"), os.Getenv("CLIENTSECRET"), os.Getenv("GOOGLE_CALLBACK_URL"), "email", "profile"),
		github.New(os.Getenv("GITHUBCLIENTID"), os.Getenv("GITHUBCLIENTSECRET"), os.Getenv("GITHUB_CALLBACK_URL")),
	)
}