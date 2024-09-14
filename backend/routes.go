// Copyright (C) 2021 Chronoscope. All rights reserved.

package main

import (
	"net/http"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/server"
)

func initRoutes() {
	http.HandleFunc("/api/points", server.ServePoints)

	// If it's debug mode, serve static files for convenience.
	if env.Debug {
		http.Handle("/", http.FileServer(http.Dir(".")))
	}
}
