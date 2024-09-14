package mapdata

import "testing"

func TestSkipSpace(t *testing.T) {
	i := skipSpace("  a", 0)
	if i != 2 {
		t.Errorf("Expected 2, but got %d\n", i)
	}
}

func TestSkipSpaceMixed(t *testing.T) {
	i := skipSpace(" \t a", 0)
	if i != 3 {
		t.Errorf("Expected 3, but got %d\n", i)
	}
}

func TestSkipSpaceNotHead(t *testing.T) {
	i := skipSpace(" a  b", 2)
	if i != 4 {
		t.Errorf("Expected 4, but got %d\n", i)
	}
}
