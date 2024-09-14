package env

type Config struct {
	Debug        bool   `envconfig:"DEBUG"`
	MetadataPath string `envconfig:"METADATA_PATH"`
}
