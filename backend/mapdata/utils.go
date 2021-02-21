// Copyright (C) 2021 Chronoscope. All rights reserved.

package mapdata

import "errors"

var (
	EmptyLine = errors.New("EmptyLine")
)

func skipSpace(source string, index int) int {
	for i := index; i < len(source); i++ {
		if source[i] == ' ' || source[i] == '\t' ||
			source[i] == '\r' || source[i] == '\n' {
			continue
		} else if source[i] == ';' {
			return len(source)
		}

		return i
	}
	return index
}
