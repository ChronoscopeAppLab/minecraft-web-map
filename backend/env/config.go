package env

type Config struct {
	MetadataPath string `envconfig:"METADATA_PATH"`
	StaticPath   string `envconfig:"STATIC_PATH"`
}
