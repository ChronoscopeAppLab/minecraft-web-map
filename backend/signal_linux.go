// Copyright (C) 2021 Chronoscope. All rights reserved.

package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/env"
	"github.com/ChronoscopeAppLab/minecraft-web-map/backend/mapdata"
)

func initSignalHandlers() {
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGWINCH, syscall.SIGUSR1)

	go func() {
		for {
			sig := <-sigs
			switch (sig) {
			case syscall.SIGWINCH:
				if err := mapdata.ReloadMetadata(); err != nil {
					log.Println(err)
					log.Println("Map metadata wasn't updated")
				}
			case syscall.SIGINT:
				fallthrough
			case syscall.SIGUSR1:
				if !env.Debug {
					os.Remove(env.SocketPath)
				}
				os.Exit(0)
			}
		}
	}()
}
