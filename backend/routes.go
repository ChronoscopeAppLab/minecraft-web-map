package main

import (
	"net/http"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/server"
)

func initRoutes(config env.Config) {
	http.HandleFunc("/api/points", server.ServePoints)
	http.Handle("/", http.FileServer(http.Dir(config.StaticPath)))
}
