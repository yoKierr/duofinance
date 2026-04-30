package http

import (
	"github.com/ImCtyz/duofinance/backend/internal/core"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes - настройка всех маршрутов API
func SetupRoutes(r *gin.Engine, services *Services, db *gorm.DB) {
	// Middleware для всех маршрутов
	r.Use(LoggerMiddleware())
	r.Use(CORSMiddleware())
	r.Use(RecoveryMiddleware())

	// Health check
	r.GET("/health", HealthHandler)
	r.GET("/ready", ReadyHandler(db))

	// API v1
	v1 := r.Group("/v1")
	{
		// Аутентификация (публичные эндпоинты)
		auth := v1.Group("/auth")
		{
			auth.POST("/register", RegisterHandler(services.Auth))
			auth.POST("/login", LoginHandler(services.Auth))
			auth.POST("/refresh", RefreshTokenHandler(services.Auth))
		}

		// Защищенные эндпоинты (требуют аутентификации)
		protected := v1.Group("", AuthMiddleware(services.Auth))
		{
			// Аутентификация (защищенные эндпоинты)
			protected.POST("/logout", LogoutHandler(services.Auth))

			// Профиль пользователя
			protected.GET("/me", MeHandler(services.Auth, services.User))
			protected.PUT("/me/profile", UpdateProfileHandler(services.User))
			protected.GET("/me/stats", GetUserStatsHandler(services.User))

			// Уровни/уроки
			levels := protected.Group("/levels")
			{
				levels.GET("", GetLevelsHandler(services.Level))
				levels.GET("/:id", GetLevelHandler(services.Level))
				levels.GET("/difficulty/:difficulty", GetLevelsByDifficultyHandler(services.Level))
				levels.GET("/topic/:topic", GetLevelsByTopicHandler(services.Level))
			}

			// Попытки прохождения
			attempts := protected.Group("/attempts")
			{
				attempts.POST("", StartAttemptHandler(services.Attempt))
				attempts.GET("", GetUserAttemptsHandler(services.Attempt))
				attempts.GET("/:id", GetAttemptHandler(services.Attempt))
				attempts.GET("/:id/next", GetNextQuestionHandler(services.Attempt))
				attempts.POST("/:id/answer", AnswerQuestionHandler(services.Attempt))
				attempts.POST("/:id/complete", CompleteAttemptHandler(services.Attempt))
				attempts.POST("/:id/cancel", CancelAttemptHandler(services.Attempt))
			}

			// Награды и транзакции
			rewards := protected.Group("/rewards")
			{
				rewards.GET("/balance", GetDiamondsBalanceHandler(services.Reward))
				rewards.GET("/transactions", GetTransactionHistoryHandler(services.Reward))
			}

			// Достижения
			achievements := protected.Group("/achievements")
			{
				achievements.GET("", GetAllAchievementsHandler(services.Achievement))
				achievements.GET("/my", GetUserAchievementsHandler(services.Achievement))
				achievements.GET("/:id/progress", GetAchievementProgressHandler(services.Achievement))
			}
		}
	}
}

// Services - структура с всеми сервисами
type Services struct {
	Auth        core.AuthService
	User        core.UserService
	Level       core.LevelService
	Attempt     core.AttemptService
	Reward      core.RewardService
	Achievement core.AchievementService
}

// NewServices - создание структуры сервисов
func NewServices(
	auth core.AuthService,
	user core.UserService,
	level core.LevelService,
	attempt core.AttemptService,
	reward core.RewardService,
	achievement core.AchievementService,
) *Services {
	return &Services{
		Auth:        auth,
		User:        user,
		Level:       level,
		Attempt:     attempt,
		Reward:      reward,
		Achievement: achievement,
	}
}
