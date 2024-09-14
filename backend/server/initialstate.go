package server

import (
	"encoding/json"
	"net/http"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
)

type InitialState struct {
	Prefix string `json:"prefix"`
}

func ServeInitialState(w http.ResponseWriter, r *http.Request, config env.Config) {
	initialState := InitialState{
		Prefix: config.AssetsPrefix,
	}

	if err := json.NewEncoder(w).Encode(initialState); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
	}
}
