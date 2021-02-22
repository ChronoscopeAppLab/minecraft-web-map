// Copyright (C) 2021 Chronoscope. All rights reserved.

package mapdata

import (
	"bufio"
	"errors"
	"io"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

var (
	NotANameLineError   = errors.New("The line is not a name line.")
	NotADataLineError   = errors.New("The line is not a name line.")
	DataSyntaxError     = errors.New("Syntax error in data line")
	NameMissingError    = errors.New("No waypoint name deflared before data")
	UndefinedColorError = errors.New("Specified color is undefined")
	UndefinedTypeError  = errors.New("Waypoint type is undefined")
)

// Types of waypoints
const (
	TypeDefault = iota
	TypeLabel
	TypeTrain
	TypeSubway
)

type Waypoint struct {
	// Name of this waypoint
	Name string
	// How the name read
	Yomi string
	// Description of this waypoint
	Detail string
	// ID to use in train graph (if this is a station)
	StationId string
	// Point type (one of Type*)
	Type int
	// Color name in colors.txt
	Color string
	// Coordinate of this waypoint
	X, Z int
	// Threshold for this waypoint to show up
	ZoomLevel int
}

func readPointName(line string) (string, error) {
	if len(line) == 0 || line[0] != '@' {
		return "", NotANameLineError
	}

	result := line[1:]
	commentStart := strings.IndexRune(result, ';')
	if commentStart >= 0 {
		result = result[:commentStart]
	}
	result = strings.Trim(result, " \t")

	return result, nil
}

func readPointData(line string) (string, string, error) {
	if len(line) == 0 || line[0] != ' ' {
		return "", "", NotADataLineError
	}

	var data string
	commentStart := strings.IndexRune(line, ';')
	if commentStart >= 0 {
		data = line[1:commentStart]
	} else {
		data = line[1:]
	}
	data = strings.Trim(data, " \t")
	if len(data) == 0 {
		return "", "", EmptyLine
	}

	eqIndex := strings.IndexRune(line, '=')
	if eqIndex < 0 {
		return "", "", DataSyntaxError
	}
	key := strings.Trim(data[0:eqIndex-1], " \t")
	val := strings.Trim(data[eqIndex:], " \t")

	return key, val, nil
}

func createWaypoint(name string, values map[string]string,
	colorDef map[string]string) (*Waypoint, error) {
	result := new(Waypoint)
	result.Name = name
	result.Yomi = values["yomi"]

	result.Color = colorDef[values["color"]]
	if result.Color == "" {
		return nil, UndefinedColorError
	}

	result.Detail = values["detail"]

	x, err := strconv.Atoi(values["x"])
	if err != nil {
		return nil, err
	}
	result.X = x

	z, err := strconv.Atoi(values["z"])
	if err != nil {
		return nil, err
	}
	result.Z = z

	result.StationId = values["stationid"]

	pointType := values["type"]
	switch pointType {
	case "default":
		result.Type = TypeDefault
	case "label":
		result.Type = TypeLabel
	case "train":
		result.Type = TypeTrain
	case "subway":
		result.Type = TypeSubway
	default:
		return nil, UndefinedTypeError
	}

	zoomLevel, err := strconv.Atoi(values["zoomlevel"])
	if err != nil {
		return nil, err
	}
	result.ZoomLevel = zoomLevel;

	return result, nil
}

func loadWaypointFile(path string, colorDef map[string]string) ([]Waypoint, error) {
	log.Printf("Loading waypoints from %s...\n", path)

	var result []Waypoint

	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	reader := bufio.NewReader(f)

	var lineBuilder strings.Builder
	hasName := false
	var curName string
	var curValues map[string]string
	for {
		buf, isPrefix, err := reader.ReadLine()
		if err != nil {
			if err == io.EOF {
				break
			} else {
				return nil, err
			}
		}

		lineBuilder.Write(buf)
		if isPrefix {
			continue
		} else {
			if lineBuilder.Len() == 0 {
				continue
			}

			line := lineBuilder.String()
			lineBuilder.Reset()

			if line[0] == '@' {
				if hasName {
					wp, err := createWaypoint(
						curName, curValues, colorDef)
					if err != nil {
						return nil, err
					}
					result = append(result, *wp)
				}

				name, _ := readPointName(line)
				hasName = true
				curName = name

				curValues = make(map[string]string)
			} else if line[0] == ' ' {
				key, val, err := readPointData(line)
				if err != nil {
					if err == EmptyLine {
						continue
					} else {
						return nil, err
					}
				}
				if !hasName {
					return nil, NameMissingError
				}
				curValues[key] = val
			} else if line[0] == ';' {
				continue
			} else {
				return nil, DataSyntaxError
			}
		}
	}

	if hasName {
		wp, err := createWaypoint(curName, curValues, colorDef)
		if err != nil {
			return nil, err
		}
		result = append(result, *wp)
	}

	return result, nil
}

func loadWaypoints(colorDef map[string]string, source_dir string) ([]Waypoint, error) {
	dirents, err := ioutil.ReadDir(source_dir)
	if err != nil {
		return nil, err
	}

	var result []Waypoint

	for _, entry := range dirents {
		if !entry.IsDir() && filepath.Ext(entry.Name()) == ".txt" {
			waypoints, err := loadWaypointFile(filepath.Join(source_dir,
				entry.Name()), colorDef)
			if err != nil {
				return nil, err
			}

			result = append(result, waypoints...)
		}
	}

	return result, nil
}
