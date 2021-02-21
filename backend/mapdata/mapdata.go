package mapdata

var waypoints []Waypoint
var metadataPath string

func ReloadMetadata() error {
	colorDef, err := loadColors()
	_ = colorDef
	if err != nil {
		return err
	}

	waypointDef, err := loadWaypoints(colorDef)
	if err != nil {
		return err
	}

	waypoints = waypointDef

	return nil
}

func SetMetadataPath(path string) {
	metadataPath = path
}
