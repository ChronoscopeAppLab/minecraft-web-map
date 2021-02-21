// Copyright (C) 2021 Chronoscope. All rights reserved.

package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"
)

func main() {
	flag.BoolVar(&env.Debug, "debug", false, "Run server in debug mode.")
	flag.StringVar(&env.MetadataPath, "metadata-path", "../mapmeta",
		"Path to map metadata.")
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
}
