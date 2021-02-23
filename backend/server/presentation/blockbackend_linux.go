// Copyright (C) 2021 Chronoscope. All rights reserved.

package presentation

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"net"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
)

func requetBlockInfo(dimen string, x, z int) *Block {
	conn, err := net.Dial("unix", env.BlockInfoSocketPath)
	if err != nil {
		log.Printf("Failed to connect to block info socket on %s\n",
			env.BlockInfoSocketPath)
		return nil
	}
	defer conn.Close()

	writer := bufio.NewWriter(conn)
	writer.WriteString("GET MMP/1.0\r\n")
	writer.WriteString(fmt.Sprintf("Dimension: %s\r\n", dimen))
	writer.WriteString(fmt.Sprintf("Coord-X: %d\r\n", x))
	writer.WriteString(fmt.Sprintf("Coord-Z: %d\r\n", z))
	writer.WriteString("\r\n")
	writer.Flush()

	reader := bufio.NewReader(conn)

	status, isPrefix, err := reader.ReadLine()
	if err != nil || isPrefix {
		return nil
	}

	if string(status) != "MMP/1.0 200" {
		return nil
	}

	// An empty line expected
	_, _, err = reader.ReadLine()
	if err != nil {
		return nil
	}

	data, isPrefix, err := reader.ReadLine()
	if err != nil || isPrefix {
		return nil
	}

	var result Block
	err = json.Unmarshal(data, &result)
	if err != nil {
		return nil
	}

	return &result
}
