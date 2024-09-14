// Copyright (C) 2021 Chronoscope. All rights reserved.

package main

import (
	"fmt"
	"log"
	"net"
	"net/http"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"
	"github.com/kelseyhightower/envconfig"
)

func main() {
	var config env.Config
	if err := envconfig.Process("", &config); err != nil {
		log.Fatal(err)
	}

	if config.Debug {
		fmt.Println("Back-end is debug mode")
	} else {
		fmt.Println("Back-end is production mode")
	}

	if err := mapdata.ReloadMetadata(config); err != nil {
		log.Fatalf("Failed to load map metadata from %s: %s\n",
			config.MetadataPath, err)
	}

	initRoutes(config)

	l, err := net.Listen("tcp", ":8000")
	if err != nil {
		log.Fatal(err)
	}

	log.Fatal(http.Serve(l, nil))
}
