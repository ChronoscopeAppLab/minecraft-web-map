package presentation

import "github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"

type Waypoint struct {
	ID     int    `json:"id"`
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

	for i, src := range *data {
		if zoomLevel < src.ZoomLevel {
			continue
		}

		result = append(result, Waypoint{
			ID:     i,
			Name:   src.Name,
			Yomi:   src.Yomi,
			Detail: src.Detail,
			Type:   src.Type,
			Color:  src.Color,
			X:      src.X,
			Z:      src.Z,
		})
	}

	return result
}
