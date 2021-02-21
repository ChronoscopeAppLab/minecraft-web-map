// Copyright (C) 2021 Chronoscope. All rights reserved.

package main

import (
	"os"
	"fmt"
)

func main() {
	debugMode := false
	if len(os.Args) > 1 {
		if os.Args[1] == "--debug" {
			debugMode = true
		}
	}

	if debugMode {
		fmt.Println("Back-end is debug mode")
	} else {
		fmt.Println("Back-end is production mode")
	}
}
