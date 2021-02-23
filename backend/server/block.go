// Copyright (C) 2021 Chronoscope. All rights reserved.

package server

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/server/presentation"
)

func ServeBlock(w http.ResponseWriter, r *http.Request) {
	dimen := r.URL.Query().Get("get")
	x, err := strconv.Atoi(r.URL.Query().Get("x"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	z, err := strconv.Atoi(r.URL.Query().Get("z"))
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	info := presentation.GetBlockAndCoord(dimen, x, z)
	if info == nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	data, err := json.Marshal(*info)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Add("Content-Type", "application/json")
	w.Write(data)
}
