package mapdata

import "log"

var waypoints []Waypoint
var metadataPath string

func ReloadMetadata() error {
	log.Println("Reloading metadata...")

	colorDef, err := loadColors()
	if err != nil {
		return err
	}

	waypointDef, err := loadWaypoints(colorDef)
	if err != nil {
		return err
	}
	waypoints = waypointDef

	log.Println("Reloading metadata... Done")

	return nil
}

func SetMetadataPath(path string) {
	metadataPath = path
}
