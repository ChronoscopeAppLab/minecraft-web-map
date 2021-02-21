// Copyright (C) 2021 Chronoscope. All rights reserved.

package mapdata

import (
	"bufio"
	"errors"
	"io"
	"log"
	"os"
	"strings"
)

var (
	ColorDataSyntaxError     = errors.New("Syntax error in colors.txt")
	DuplicateColorEntryError = errors.New("colors.txt has duplicate entry")
)

func readColorName(source string, index int) (string, int, error) {
	var result []rune
	var i int
	for i = index; i < len(source); i++ {
		chr := source[i]
		if ('0' <= chr && chr <= '9') ||
			('a' <= chr && chr <= 'z') ||
			('A' <= chr && chr <= 'Z') {
			result = append(result, rune(chr))
		} else {
			break
		}
	}

	if len(result) > 0 {
		return string(result), i, nil
	}

	return "", index, ColorDataSyntaxError
}

func readColorSpec(source string, index int) (string, int, error) {
	var result []rune
	var i int
	if source[index] == '#' {
		result = append(result, '#')
		for i = index + 1; i < len(source); i++ {
			chr := source[i]
			if ('0' <= chr && chr <= '9') ||
				('a' <= chr && chr <= 'f') ||
				('A' <= chr && chr <= 'F') {
				result = append(result, rune(chr))
			} else {
				break
			}
		}

	} else {
		for i = index; i < len(source); i++ {
			chr := source[i]
			if ('0' <= chr && chr <= '9') ||
				('a' <= chr && chr <= 'z') ||
				('A' <= chr && chr <= 'Z') {
				result = append(result, rune(chr))
			} else {
				break
			}
		}
	}

	if len(result) >= 4 {
		return string(result), i, nil
	}

	return "", index, ColorDataSyntaxError
}

func readColorDef(line string) (string, string, error) {
	i := skipSpace(line, 0)
	if len(line) <= i {
		return "", "", EmptyLine
	}
	name, i, err := readColorName(line, i)
	if err != nil {
		return "", "", err
	}

	i = skipSpace(line, i)
	if len(line) <= i {
		return "", "", ColorDataSyntaxError
	}

	if line[i] != '=' {
		return "", "", ColorDataSyntaxError
	}
	i++

	i = skipSpace(line, i)
	if len(line) <= i {
		return "", "", ColorDataSyntaxError
	}

	spec, i, err := readColorSpec(line, i)
	if err != nil {
		return "", "", err
	}

	i = skipSpace(line, i)
	if i != len(line) {
		return "", "", ColorDataSyntaxError
	}

	return name, spec, nil
}

func loadColors(path string) (map[string]string, error) {
	log.Println("Loading colors.txt...")

	colorsFile, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer colorsFile.Close()

	reader := bufio.NewReader(colorsFile)
	result := make(map[string]string)
	var lineBuilder strings.Builder
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

			name, spec, err := readColorDef(line)
			if err != nil {
				if err == EmptyLine {
					continue
				}
				return nil, err
			}
			if result[name] != "" {
				return nil, DuplicateColorEntryError
			}

			result[name] = spec
		}
	}

	return result, nil
}
