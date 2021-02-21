// Copyright (C) 2021 Chronoscope. All rights reserved.

package mapdata

import (
	"log"
	"path/filepath"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
)

var (
	waypoints [3][]Waypoint
	metadataPath string
)

func ReloadMetadata() error {
	log.Println("Reloading metadata...")

	colorDef, err := loadColors()
	if err != nil {
		return err
	}

	for i, dimen := range env.Dimensions {
		waypointDir := filepath.Join(metadataPath, "waypoints", dimen)
		waypointDef, err := loadWaypoints(colorDef, waypointDir)
		if err != nil {
			return err
		}
		waypoints[i] = waypointDef
	}

	log.Println("Reloading metadata... Done")

	return nil
}

func SetMetadataPath(path string) {
	metadataPath = path
}
