package mapdata

import "testing"

func TestReadPointName(t *testing.T) {
	testData := "@foo"
	name, err := readPointName(testData)
	if err != nil {
		t.Errorf("%s: Error occurred, but shouldn't: %s",
			testData, err)
	}

	if name != "foo" {
		t.Errorf("Expected `foo', but got `%s'\n", name)
	}
}

func TestReadPointNameSurroundingSpace(t *testing.T) {
	testData := "@ foo  "
	name, err := readPointName(testData)
	if err != nil {
		t.Errorf("%s: Error occurred, but shouldn't: %s",
			testData, err)
	}

	if name != "foo" {
		t.Errorf("Expected `foo', but got `%s'\n", name)
	}
}

func TestReadPointNameWithComment(t *testing.T) {
	testData := "@ foo ;comment"
	name, err := readPointName(testData)
	if err != nil {
		t.Errorf("%s: Error occurred, but shouldn't: %s",
			testData, err)
	}

	if name != "foo" {
		t.Errorf("Expected `foo', but got `%s'\n", name)
	}
}

func TestReadPointData(t *testing.T) {
	testData := " foo = bar"
	key, val, err := readPointData(testData)
	if err != nil {
		t.Errorf("%s: Error occurred, but shouldn't: %s",
			testData, err)
	}

	if key != "foo" {
		t.Errorf("Expected `foo', but got `%s'\n", key)
	}
	if val != "bar" {
		t.Errorf("Expected `bar', but got `%s'\n", key)
	}
}

func TestReadPointDataWithComment(t *testing.T) {
	testData := " foo = bar;comment"
	key, val, err := readPointData(testData)
	if err != nil {
		t.Errorf("%s: Error occurred, but shouldn't: %s",
			testData, err)
	}

	if key != "foo" {
		t.Errorf("Expected `foo', but got `%s'\n", key)
	}
	if val != "bar" {
		t.Errorf("Expected `bar', but got `%s'\n", key)
	}
}

func TestReadPointDataActuallyEmpty(t *testing.T) {
	testData := " ;comment"
	_, _, err := readPointData(testData)
	if err == nil {
		t.Errorf("%s: Error didn't occurred, but should: %s",
			testData, err)
	}
	if err != EmptyLine {
		t.Errorf("%s: EmptyLine error should be occurred, but `%s' occurred",
			testData, err)
	}
}

var testColorDef = map[string]string {
	"blue": "#00f",
};

func TestCreateWaypointDefaultType(t *testing.T) {
	name := "foo"
	values := map[string]string{
		"yomi": "A",
		"detail": "B",
		"color": "blue",
		"x": "1",
		"z": "2",
		"type": "default",
	}
	wp, err := createWaypoint(name, values, testColorDef)
	if err != nil {
		t.Errorf("Error occurred, but shoudn't: %s\n", err)
	}
	if wp.Name != "foo" {
		t.Errorf("Expect `%s', but got `%s'\n", "foo", wp.Name)
	}
	if wp.Yomi != "A" {
		t.Errorf("Expect `%s', but got `%s'\n", "A", wp.Yomi)
	}
	if wp.Detail != "B" {
		t.Errorf("Expect `%s', but got `%s'\n", "B", wp.Detail)
	}
	if wp.Color != "#00f" {
		t.Errorf("Expect `%s', but got `%s'\n", "#00f", wp.Color)
	}
	if wp.X != 1 {
		t.Errorf("Expect `%d', but got `%d'\n", 1, wp.X)
	}
	if wp.Z != 2 {
		t.Errorf("Expect `%d', but got `%d'\n", 2, wp.X)
	}
	if wp.Type != TypeDefault {
		t.Errorf("Expect `%d', but got `%d'\n", TypeDefault, wp.Type)
	}
}

func TestCreateWaypointLabelType(t *testing.T) {
	name := "foo"
	values := map[string]string{
		"yomi": "A",
		"detail": "B",
		"color": "blue",
		"x": "1",
		"z": "2",
		"type": "label",
	}
	wp, err := createWaypoint(name, values, testColorDef)
	if err != nil {
		t.Errorf("Error occurred, but shoudn't: %s\n", err)
	}
	if wp.Type != TypeLabel {
		t.Errorf("Expect `%d', but got `%d'\n", TypeLabel, wp.Type)
	}
}

func TestCreateWaypointTrainType(t *testing.T) {
	name := "foo"
	values := map[string]string{
		"yomi": "A",
		"detail": "B",
		"color": "blue",
		"x": "1",
		"z": "2",
		"stationid": "STN",
		"type": "train",
	}
	wp, err := createWaypoint(name, values, testColorDef)
	if err != nil {
		t.Errorf("Error occurred, but shoudn't: %s\n", err)
	}
	if wp.StationId != "STN" {
		t.Errorf("Expect `%s', but got `%s'\n", "STN", wp.StationId)
	}

	if wp.Type != TypeTrain {
		t.Errorf("Expect `%d', but got `%d'\n", TypeTrain, wp.Type)
	}
}

func TestCreateWaypointSubwayType(t *testing.T) {
	name := "foo"
	values := map[string]string{
		"yomi": "A",
		"detail": "B",
		"color": "blue",
		"x": "1",
		"z": "2",
		"type": "subway",
	}
	wp, err := createWaypoint(name, values, testColorDef)
	if err != nil {
		t.Errorf("Error occurred, but shoudn't: %s\n", err)
	}
	if wp.Type != TypeSubway {
		t.Errorf("Expect `%d', but got `%d'\n", TypeSubway, wp.Type)
	}
}
