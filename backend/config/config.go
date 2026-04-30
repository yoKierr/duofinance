package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL       string
	Port              int
	GinMode           string
	JWTAccessSecret   string
	JWTRefreshSecret  string
	JWTAccessTTLMin   int // minutes
	JWTRefreshTTLDays int // days
}

func Load() (*Config, error) {
	// Загружаем .env файл если он существует
	godotenv.Load()

	port, _ := strconv.Atoi(getEnv("PORT", "8080"))
	jwtAccessTTLMin, _ := strconv.Atoi(getEnv("JWT_ACCESS_TTL_MIN", "15"))
	jwtRefreshTTLDays, _ := strconv.Atoi(getEnv("JWT_REFRESH_TTL_DAYS", "7"))

	return &Config{
		DatabaseURL:       getEnv("DATABASE_URL", ""),
		Port:              port,
		GinMode:           getEnv("GIN_MODE", "debug"),
		JWTAccessSecret:   getEnv("JWT_ACCESS_SECRET", "change-me-access-secret"),
		JWTRefreshSecret:  getEnv("JWT_REFRESH_SECRET", "change-me-refresh-secret"),
		JWTAccessTTLMin:   jwtAccessTTLMin,
		JWTRefreshTTLDays: jwtRefreshTTLDays,
	}, nil
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
