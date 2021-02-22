// Copyright (C) 2021 Chronoscope. All rights reserved.

package presentation

import "github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"

type Waypoint struct {
	Name   string `json:"name"`
	Yomi   string `json:"hira"`
	Detail string `json:"detail"`
	Type   int    `json:"type"`
	Color  string `json:"color"`
	X      int    `json:"x"`
	Z      int    `json:"z"`
}

func ConvertWaypoints(data *[]mapdata.Waypoint) []Waypoint {
	result := make([]Waypoint, len(*data))

	for i, src := range *data {
		result[i] = Waypoint{
			src.Name,
			src.Yomi,
			src.Detail,
			src.Type,
			src.Color,
			src.X,
			src.Z,
		}
	}

	return result
}
