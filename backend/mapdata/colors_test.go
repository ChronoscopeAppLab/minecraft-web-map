// Copyright (C) 2021 Chronoscope. All rights reserved.

package mapdata

import "testing"

func TestReadColorDef(t *testing.T) {
	testdata := "foo = #123456"
	name, spec, err := readColorDef(testdata)
	if err != nil {
		t.Errorf("%s: Parse error occurred, but shouldn't: %s",
			testdata, err)
	}
	if name != "foo" {
		t.Errorf("`foo' expected, but got `%s'", name)
	}
	if spec != "#123456" {
		t.Errorf("`#123456' expected, but got `%s'", spec)
	}
}

func TestReadColorDefWithComment(t *testing.T) {
	testdata := "foo = #123456 ;this is a comment"
	name, spec, err := readColorDef(testdata)
	if err != nil {
		t.Errorf("%s: Parse error occurred, but shouldn't: %s",
			testdata, err)
	}
	if name != "foo" {
		t.Errorf("`foo' expected, but got `%s'", name)
	}
	if spec != "#123456" {
		t.Errorf("`#123456' expected, but got `%s'", spec)
	}
}

func TestReadColorDefFail1(t *testing.T) {
	testdata := "foo #123456"
	_, _, err := readColorDef(testdata)
	if err == nil {
		t.Errorf("Parse error didn't occurred, but should: %s",
			testdata)
	}
}

func TestReadColorDefFail2(t *testing.T) {
	testdata := "foo = bar = #123456"
	_, _, err := readColorDef(testdata)
	if err == nil {
		t.Errorf("Parse error didn't occurred, but should: %s",
			testdata)
	}
}
