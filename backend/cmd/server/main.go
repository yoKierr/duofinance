package main

import (
	"fmt"
	"log"
	"time"

	"github.com/ImCtyz/duofinance/backend/config"
	authpkg "github.com/ImCtyz/duofinance/backend/internal/auth"
	"github.com/ImCtyz/duofinance/backend/internal/core"
	"github.com/ImCtyz/duofinance/backend/internal/http"
	"github.com/ImCtyz/duofinance/backend/internal/repo"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Загружаем конфигурацию
	cfg, err := config.Load()
	if err != nil {
		log.Fatal("Failed to load config:", err)
	}

	// Применяем режим Gin
	gin.SetMode(cfg.GinMode)

	// Подключаемся к базе данных
	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Тестируем подключение
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatal("Failed to get database instance:", err)
	}
	defer sqlDB.Close()

	// Создаем репозитории (пока заглушки - нужно будет реализовать)
	userRepo := repo.NewUserRepo(db)
	levelRepo := repo.NewLevelRepo(db)
	questionRepo := repo.NewQuestionRepo(db)
	attemptRepo := repo.NewAttemptRepo(db)
	rewardTxRepo := repo.NewRewardTxRepo(db)
	achievementRepo := repo.NewAchievementRepo(db)

	// Создаем сервисы (пока заглушки - нужно будет реализовать)
	jwtManager := authpkg.NewJWTManager(
		cfg.JWTAccessSecret,
		cfg.JWTRefreshSecret,
		time.Duration(cfg.JWTAccessTTLMin)*time.Minute,
		time.Duration(cfg.JWTRefreshTTLDays)*24*time.Hour,
	)
	authService := core.NewAuthService(userRepo, jwtManager)
	userService := core.NewUserService(userRepo, rewardTxRepo, attemptRepo)
	levelService := core.NewLevelService(levelRepo, questionRepo, attemptRepo)
	attemptService := core.NewAttemptService(attemptRepo, levelRepo, questionRepo, rewardTxRepo, userService)
	rewardService := core.NewRewardService(rewardTxRepo)
	achievementService := core.NewAchievementService(achievementRepo, userRepo)

	// Создаем структуру сервисов
	services := http.NewServices(
		authService,
		userService,
		levelService,
		attemptService,
		rewardService,
		achievementService,
	)

	// Создаем Gin роутер
	router := gin.Default()

	// Настраиваем маршруты
	http.SetupRoutes(router, services, db)

	// Запускаем сервер
	log.Printf("Starting server on port %d", cfg.Port)
	if err := router.Run(fmt.Sprintf(":%d", cfg.Port)); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
