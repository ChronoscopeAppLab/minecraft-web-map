// Copyright (C) 2021 Chronoscope. All rights reserved.

package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"
)

func initSignalHandlers() {
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGWINCH)

	go func() {
		for {
			<-sigs
			if err := mapdata.ReloadMetadata(); err != nil {
				log.Fatal(err)
			}
		}
	}()
}
