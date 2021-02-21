// Copyright (C) 2021 Chronoscope. All rights reserved.

package mapdata

import (
	"log"
	"path/filepath"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
)

var waypoints [3][]Waypoint

func ReloadMetadata() error {
	log.Println("Reloading metadata...")

	colorDef, err := loadColors(filepath.Join(env.MetadataPath, "colors.txt"))
	if err != nil {
		return err
	}

	for i, dimen := range env.Dimensions {
		waypointDir := filepath.Join(env.MetadataPath, "waypoints", dimen)
		waypointDef, err := loadWaypoints(colorDef, waypointDir)
		if err != nil {
			return err
		}
		waypoints[i] = waypointDef
	}

	log.Println("Reloading metadata... Done")

	return nil
}
