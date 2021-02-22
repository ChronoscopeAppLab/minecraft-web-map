// Copyright (C) 2021 Chronoscope. All rights reserved.

package server

import "net/http"

func ServePoints(w http.ResponseWriter, r *http.Request) {
	w.Write([]byte("foo"))
}
