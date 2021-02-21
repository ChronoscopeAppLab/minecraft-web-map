package mapdata

type Waypoint struct {
	name, yomi, detail, color string
	x, z                      int
}

func loadWaypoints(colorDef map[string]string) ([]Waypoint, error) {
	return nil, nil
}
