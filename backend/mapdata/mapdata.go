package mapdata

import (
	"log"
	"path/filepath"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
)

var waypoints [3][]Waypoint

func ReloadMetadata(config env.Config) error {
	log.Println("Reloading metadata...")

	colorDef, err := loadColors(filepath.Join(config.MetadataPath, "colors.txt"))
	if err != nil {
		return err
	}

	for i, dimen := range env.Dimensions {
		waypointDir := filepath.Join(config.MetadataPath, "waypoints", dimen)
		waypointDef, err := loadWaypoints(colorDef, waypointDir)
		if err != nil {
			return err
		}
		waypoints[i] = waypointDef
	}

	log.Println("Reloading metadata... Done")

	return nil
}

func GetWaypoints(dimen string) *[]Waypoint {
	if dimen == "" {
		dimen = "overworld"
	}

	dimenNum := 0
	if dimen[0] == 'n' {
		// "nether"
		dimenNum = 1
	} else if dimen[0] == 'e' {
		// "end"
		dimenNum = 2
	}

	return &waypoints[dimenNum]
}
