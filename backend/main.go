// Copyright (C) 2021 Chronoscope. All rights reserved.

package main

import (
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"
)

func main() {
	flag.BoolVar(&env.Debug, "debug", true, "Run server in debug mode.")
	flag.StringVar(&env.MetadataPath, "metadata-path", "../mapmeta",
		"Path to map metadata.")
	flag.StringVar(&env.BlockInfoSocketPath, "block-info-sock-path", "/tmp/mcmap.sock",
		"Path to socket to retrive block info.")
	flag.Parse()

	if env.Debug {
		fmt.Println("Back-end is debug mode")
	} else {
		fmt.Println("Back-end is production mode")
	}

	if err := mapdata.ReloadMetadata(); err != nil {
		log.Fatalf("Failed to load map metadata from %s: %s\n",
			env.MetadataPath, err)
	}

	initRoutes()

	l, err := net.Listen("tcp", ":8000")
	if err != nil {
		log.Fatal(err)
	}

	log.Fatal(http.Serve(l, nil))
}
