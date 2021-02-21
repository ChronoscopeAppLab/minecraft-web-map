// Copyright (C) 2021 Chronoscope. All rights reserved.

package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"
)

func main() {
	var debugMode bool
	var metadataPath string
	flag.BoolVar(&debugMode, "debug", false, "Run server in debug mode.")
	flag.StringVar(&metadataPath, "metadata-path", "../mapmeta",
		"Path to map metadata.")
	flag.Parse()

	if debugMode {
		fmt.Println("Back-end is debug mode")
	} else {
		fmt.Println("Back-end is production mode")
	}

	mapdata.SetMetadataPath(metadataPath)

	if err := mapdata.ReloadMetadata(); err != nil {
		log.Fatalf("Failed to load map metadata from %s: %s\n",
			metadataPath, err)
	}
}
