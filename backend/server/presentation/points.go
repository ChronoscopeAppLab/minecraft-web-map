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

func ConvertWaypoints(data *[]mapdata.Waypoint, zoomLevel int) []Waypoint {
	var result []Waypoint

	for _, src := range *data {
		if zoomLevel < src.ZoomLevel {
			continue
		}

		result = append(result, Waypoint{
			src.Name,
			src.Yomi,
			src.Detail,
			src.Type,
			src.Color,
			src.X,
			src.Z,
		})
	}

	return result
}
