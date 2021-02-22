// Copyright (C) 2021 Chronoscope. All rights reserved.

package server

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/server/presentation"
)

func ServePoints(w http.ResponseWriter, r *http.Request) {
	dimen := r.URL.Query().Get("dimen")
	zoomLevel, err := strconv.Atoi(r.URL.Query().Get("zoom_level"))
	if err != nil {
		zoomLevel = 100
	}

	waypoints := mapdata.GetWaypoints(dimen)

	data, err := json.Marshal(presentation.ConvertWaypoints(waypoints, zoomLevel))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Write(data)
}
