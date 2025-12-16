package main

import (
	"fmt"
	"log"

	"github.com/markbates/goth"
	"github.com/sudankdk/codearena/configs"
	"github.com/sudankdk/codearena/internal/api"
)

func main() {
	fmt.Println("welcome to code arena")

	cfg, err := configs.SetUpEnv()
	configs.InintOAuthConfigs()
	fmt.Println("Providers:", goth.GetProviders())

	if err != nil {
		log.Fatalf("configs files not loaded properly : %v\n", err)
	}
	fmt.Println("Listeninng...")

	api.StartServer(cfg)

}
