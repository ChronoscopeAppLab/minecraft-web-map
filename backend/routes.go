package main

import (
	"net/http"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/server"
)

func initRoutes(config env.Config) {
	http.HandleFunc("/api/points", server.ServePoints)
	http.HandleFunc("/api/initial_state.json", func(w http.ResponseWriter, r *http.Request) {
		server.ServeInitialState(w, r, config)
	})
	http.Handle("/", http.FileServer(http.Dir(config.StaticPath)))
}
