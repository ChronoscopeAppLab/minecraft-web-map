// Copyright (C) 2021 Chronoscope. All rights reserved.

package server

import (
	"encoding/json"
	"net/http"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/server/presentation"
)

func ServePoints(w http.ResponseWriter, r *http.Request) {
	waypoints := mapdata.GetWaypoints(r.URL.Query().Get("dimen"))

	data, err := json.Marshal(presentation.ConvertWaypoints(waypoints))
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Write(data)
}
