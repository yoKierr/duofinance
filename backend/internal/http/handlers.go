package http

import (
	"net/http"
	"strconv"
	"time"

	"github.com/ImCtyz/duofinance/backend/internal/core"
	"github.com/ImCtyz/duofinance/backend/internal/domain"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// HealthHandler - проверка здоровья сервиса
func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data: gin.H{
			"status":  "ok",
			"message": "Duofinance backend is running",
		},
	})
}

// ReadyHandler - проверка готовности сервиса
func ReadyHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		checks := make(map[string]string)
		allOk := true

		// Проверка БД
		sqlDB, err := db.DB()
		if err != nil {
			checks["database"] = "not working"
			allOk = false
		} else {
			err = sqlDB.Ping()
			if err != nil {
				checks["database"] = "not working"
				allOk = false
			} else {
				checks["database"] = "ok"
			}
		}

		// Проверка других сервисов (если есть)
		checks["services"] = "ok"

		status := "ready"
		httpStatus := http.StatusOK
		if !allOk {
			status = "not ready"
			httpStatus = http.StatusServiceUnavailable
		}

		c.JSON(httpStatus, APIResponse{
			Success: allOk,
			Data: gin.H{
				"status": status,
				"checks": checks,
			},
		})
	}
}

// Auth handlers

// RegisterHandler - регистрация пользователя
func RegisterHandler(authService core.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req AuthRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid request data",
					Details: err.Error(),
				},
			})
			return
		}

		user, err := authService.Register(c.Request.Context(), req.Email, req.Username, req.Password)
		if err != nil {
			c.JSON(http.StatusConflict, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeUserExists,
					Message: "User already exists",
				},
			})
			return
		}

		c.JSON(http.StatusCreated, APIResponse{
			Success: true,
			Data: UserInfo{
				ID:       user.ID,
				Email:    user.Email,
				Username: user.Username,
			},
		})
	}
}

// LoginHandler - вход в систему
func LoginHandler(authService core.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid request data",
					Details: err.Error(),
				},
			})
			return
		}

		accessToken, refreshToken, user, err := authService.Login(c.Request.Context(), req.Email, req.Password)
		if err != nil {
			c.JSON(http.StatusUnauthorized, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInvalidCredentials,
					Message: "Invalid email or password",
				},
			})
			return
		}

		userInfo := &UserInfo{
			ID:       user.ID,
			Email:    user.Email,
			Username: user.Username,
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: AuthResponse{
				AccessToken:  accessToken,
				RefreshToken: refreshToken,
				User:         userInfo,
			},
		})
	}
}

// RefreshTokenHandler - обновление токена
func RefreshTokenHandler(authService core.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RefreshTokenRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid request data",
					Details: err.Error(),
				},
			})
			return
		}

		accessToken, refreshToken, err := authService.RefreshToken(c.Request.Context(), req.RefreshToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInvalidToken,
					Message: "Invalid or expired refresh token",
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: AuthResponse{
				AccessToken:  accessToken,
				RefreshToken: refreshToken,
			},
		})
	}
}

// LogoutHandler - выход из системы
func LogoutHandler(authService core.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		// Вызываем logout
		err = authService.Logout(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to logout",
					Details: err.Error(),
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: gin.H{
				"message": "Successfully logged out",
			},
		})
	}
}

// MeHandler - получение информации о текущем пользователе
func MeHandler(authService core.AuthService, userService core.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		user, err := authService.GetCurrentUser(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusNotFound, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeNotFound,
					Message: "User not found",
				},
			})
			return
		}

		profile, err := userService.GetProfile(c.Request.Context(), userID)
		if err != nil {
			// Если профиль не найден, создаем дефолтный
			profile = &domain.Profile{
				UserID: userID,
				Streak: 0,
				Stats:  nil,
				Meta:   nil,
			}
		}

		diamonds, err := userService.GetDiamondsBalance(c.Request.Context(), userID)
		if err != nil {
			// Временно установить 0 если ошибка
			diamonds = 0
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: UserInfo{
				ID:       user.ID,
				Email:    user.Email,
				Username: user.Username,
				Profile: &ProfileInfo{
					Streak:   profile.Streak,
					Diamonds: diamonds,
					Stats:    make(map[string]interface{}), // TODO: правильно обработать datatypes.JSON
				},
			},
		})
	}
}

// Level handlers

// GetLevelsHandler - получение списка уровней
func GetLevelsHandler(levelService core.LevelService) gin.HandlerFunc {
	return func(c *gin.Context) {
		levels, err := levelService.GetLevels(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get levels",
				},
			})
			return
		}

		var levelInfos []LevelInfo
		for _, level := range levels {
			levelInfos = append(levelInfos, LevelInfo{
				ID:           level.ID,
				Title:        level.Title,
				Topic:        level.Topic,
				Difficulty:   level.Difficulty,
				RewardPoints: level.RewardPoints,
				IsActive:     level.IsActive,
			})
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    levelInfos,
			Meta: &Meta{
				Total: len(levelInfos),
			},
		})
	}
}

// GetLevelHandler - получение деталей уровня
func GetLevelHandler(levelService core.LevelService) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid level ID",
				},
			})
			return
		}

		level, err := levelService.GetLevel(c.Request.Context(), uint(id))
		if err != nil {
			c.JSON(http.StatusNotFound, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeLevelNotFound,
					Message: "Level not found",
				},
			})
			return
		}

		// Конвертируем шаги в нужный формат
		var steps []map[string]interface{}
		for _, step := range level.Steps {
			stepData := map[string]interface{}{
				"id":    step.ID,
				"order": step.Order,
				"type":  step.Type,
				"title": step.Title,
			}

			// Добавляем payload если есть
			if step.Payload != nil {
				stepData["payload"] = step.Payload
			}

			// Добавляем question_id если это вопрос
			if step.QuestionID != nil {
				stepData["question_id"] = *step.QuestionID
			}

			steps = append(steps, stepData)
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: map[string]interface{}{
				"id":            level.ID,
				"title":         level.Title,
				"topic":         level.Topic,
				"difficulty":    level.Difficulty,
				"reward_points": level.RewardPoints,
				"is_active":     level.IsActive,
				"description":   "",
				"steps_count":   len(level.Steps),
				"steps":         steps,
			},
		})
	}
}

// GetLevelsByDifficultyHandler - получение уровней по сложности
func GetLevelsByDifficultyHandler(levelService core.LevelService) gin.HandlerFunc {
	return func(c *gin.Context) {
		difficulty := c.Param("difficulty")
		levels, err := levelService.GetLevelsByDifficulty(c.Request.Context(), difficulty)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get levels by difficulty",
				},
			})
			return
		}

		var levelInfos []LevelInfo
		for _, level := range levels {
			levelInfos = append(levelInfos, LevelInfo{
				ID:           level.ID,
				Title:        level.Title,
				Topic:        level.Topic,
				Difficulty:   level.Difficulty,
				RewardPoints: level.RewardPoints,
				IsActive:     level.IsActive,
			})
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    levelInfos,
			Meta: &Meta{
				Total: len(levelInfos),
			},
		})
	}
}

// GetLevelsByTopicHandler - получение уровней по теме
func GetLevelsByTopicHandler(levelService core.LevelService) gin.HandlerFunc {
	return func(c *gin.Context) {
		topic := c.Param("topic")
		levels, err := levelService.GetLevelsByTopic(c.Request.Context(), topic)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get levels by topic",
				},
			})
			return
		}

		var levelInfos []LevelInfo
		for _, level := range levels {
			levelInfos = append(levelInfos, LevelInfo{
				ID:           level.ID,
				Title:        level.Title,
				Topic:        level.Topic,
				Difficulty:   level.Difficulty,
				RewardPoints: level.RewardPoints,
				IsActive:     level.IsActive,
			})
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    levelInfos,
			Meta: &Meta{
				Total: len(levelInfos),
			},
		})
	}
}

// User handlers

// UpdateProfileHandler - обновление профиля пользователя
func UpdateProfileHandler(userService core.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		var updates map[string]interface{}
		if err := c.ShouldBindJSON(&updates); err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid request data",
					Details: err.Error(),
				},
			})
			return
		}

		err = userService.UpdateProfile(c.Request.Context(), userID, updates)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to update profile",
					Details: err.Error(),
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: gin.H{
				"message": "Profile updated successfully",
			},
		})
	}
}

// GetUserStatsHandler - получение статистики пользователя
func GetUserStatsHandler(userService core.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		stats, err := userService.GetUserStats(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user stats",
					Details: err.Error(),
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    stats,
		})
	}
}

// Reward handlers

// GetDiamondsBalanceHandler - получение баланса алмазов
func GetDiamondsBalanceHandler(rewardService core.RewardService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		balance, err := rewardService.GetTransactionHistory(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get balance",
					Details: err.Error(),
				},
			})
			return
		}

		var totalBalance int64
		for _, tx := range balance {
			totalBalance += tx.Amount
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: gin.H{
				"balance": totalBalance,
			},
		})
	}
}

// GetTransactionHistoryHandler - получение истории транзакций
func GetTransactionHistoryHandler(rewardService core.RewardService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		transactions, err := rewardService.GetTransactionHistory(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get transaction history",
					Details: err.Error(),
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    transactions,
			Meta: &Meta{
				Total: len(transactions),
			},
		})
	}
}

// Achievement handlers

// GetAllAchievementsHandler - получение всех достижений
func GetAllAchievementsHandler(achievementService core.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		achievements, err := achievementService.GetAllAchievements(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get achievements",
					Details: err.Error(),
				},
			})
			return
		}

		var achievementInfos []AchievementInfo
		for _, achievement := range achievements {
			achievementInfos = append(achievementInfos, AchievementInfo{
				ID:          achievement.ID,
				Code:        achievement.Code,
				Name:        achievement.Name,
				Description: achievement.Description,
				Icon:        achievement.Icon,
				Points:      achievement.Points,
			})
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    achievementInfos,
			Meta: &Meta{
				Total: len(achievementInfos),
			},
		})
	}
}

// GetUserAchievementsHandler - получение достижений пользователя
func GetUserAchievementsHandler(achievementService core.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		achievements, err := achievementService.GetUserAchievements(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user achievements",
					Details: err.Error(),
				},
			})
			return
		}

		var achievementInfos []AchievementInfo
		for _, achievement := range achievements {
			achievementInfos = append(achievementInfos, AchievementInfo{
				ID:          achievement.ID,
				Code:        achievement.Code,
				Name:        achievement.Name,
				Description: achievement.Description,
				Icon:        achievement.Icon,
				Points:      achievement.Points,
			})
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    achievementInfos,
			Meta: &Meta{
				Total: len(achievementInfos),
			},
		})
	}
}

// GetAchievementProgressHandler - получение прогресса по достижению
func GetAchievementProgressHandler(achievementService core.AchievementService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		idStr := c.Param("id")
		achievementID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid achievement ID",
				},
			})
			return
		}

		progress, err := achievementService.GetAchievementProgress(c.Request.Context(), userID, uint(achievementID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get achievement progress",
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    progress,
		})
	}
}

// Attempt handlers

// StartAttemptHandler - начало попытки прохождения уровня
func StartAttemptHandler(attemptService core.AttemptService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		var req StartAttemptRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid request data",
					Details: err.Error(),
				},
			})
			return
		}

		attempt, err := attemptService.StartAttempt(c.Request.Context(), userID, req.LevelID)
		if err != nil {
			// Разные ответы для разных причин отказа
			status := http.StatusBadRequest
			code := ErrCodeLevelNotFound
			msg := err.Error()
			if msg == "previous level not completed" {
				status = http.StatusForbidden
				code = ErrCodeForbidden
			} else if msg == "level is not active" {
				status = http.StatusForbidden
				code = ErrCodeForbidden
			} else if msg == "level not found" {
				status = http.StatusNotFound
				code = ErrCodeLevelNotFound
			}

			c.JSON(status, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    code,
					Message: msg,
				},
			})
			return
		}

		c.JSON(http.StatusCreated, APIResponse{
			Success: true,
			Data: AttemptInfo{
				ID:          attempt.ID,
				LevelID:     attempt.LevelID,
				Status:      string(attempt.Status),
				ResultScore: attempt.ResultScore,
				StartedAt:   attempt.StartedAt.Format(time.RFC3339),
				CompletedAt: nil,
			},
		})
	}
}

// GetUserAttemptsHandler - получение истории попыток пользователя
func GetUserAttemptsHandler(attemptService core.AttemptService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		attempts, err := attemptService.GetUserAttempts(c.Request.Context(), userID)
		if err != nil {
			// Если ошибка, возвращаем пустой массив вместо null
			c.JSON(http.StatusOK, APIResponse{
				Success: true,
				Data:    []AttemptInfo{},
				Meta: &Meta{
					Total: 0,
				},
			})
			return
		}

		var attemptInfos []AttemptInfo
		for _, attempt := range attempts {
			attemptInfo := AttemptInfo{
				ID:          attempt.ID,
				LevelID:     attempt.LevelID,
				Status:      string(attempt.Status),
				ResultScore: attempt.ResultScore,
				StartedAt:   attempt.StartedAt.Format(time.RFC3339),
			}
			if attempt.CompletedAt != nil {
				completedAt := attempt.CompletedAt.Format(time.RFC3339)
				attemptInfo.CompletedAt = &completedAt
			}
			attemptInfos = append(attemptInfos, attemptInfo)
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    attemptInfos,
			Meta: &Meta{
				Total: len(attemptInfos),
			},
		})
	}
}

// GetAttemptHandler - получение деталей попытки
func GetAttemptHandler(attemptService core.AttemptService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		idStr := c.Param("id")
		attemptID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid attempt ID",
				},
			})
			return
		}

		attempt, err := attemptService.GetUserAttempts(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get attempts",
				},
			})
			return
		}

		// Находим нужную попытку
		var targetAttempt *domain.Attempt
		for _, a := range attempt {
			if a.ID == uint(attemptID) {
				targetAttempt = a
				break
			}
		}

		if targetAttempt == nil {
			c.JSON(http.StatusNotFound, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeAttemptNotFound,
					Message: "Attempt not found",
				},
			})
			return
		}

		attemptInfo := AttemptInfo{
			ID:          targetAttempt.ID,
			LevelID:     targetAttempt.LevelID,
			Status:      string(targetAttempt.Status),
			ResultScore: targetAttempt.ResultScore,
			StartedAt:   targetAttempt.StartedAt.Format(time.RFC3339),
		}
		if targetAttempt.CompletedAt != nil {
			completedAt := targetAttempt.CompletedAt.Format(time.RFC3339)
			attemptInfo.CompletedAt = &completedAt
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    attemptInfo,
		})
	}
}

// GetNextQuestionHandler - получение следующего вопроса
func GetNextQuestionHandler(attemptService core.AttemptService) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		attemptID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid attempt ID",
				},
			})
			return
		}

		question, err := attemptService.GetNextQuestion(c.Request.Context(), uint(attemptID))
		if err != nil {
			if err.Error() == "no more questions" {
				c.JSON(http.StatusOK, APIResponse{
					Success: true,
					Data: gin.H{
						"message":  "No more questions",
						"question": nil,
					},
				})
				return
			}
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeQuestionNotFound,
					Message: err.Error(),
				},
			})
			return
		}

		if question == nil {
			c.JSON(http.StatusOK, APIResponse{
				Success: true,
				Data: gin.H{
					"message":  "No question available",
					"question": nil,
				},
			})
			return
		}

		var choices []ChoiceInfo
		for _, choice := range question.Choices {
			choices = append(choices, ChoiceInfo{
				ID:   choice.ID,
				Text: choice.Text,
			})
		}

		questionInfo := QuestionInfo{
			ID:          question.ID,
			Prompt:      question.Prompt,
			MultiSelect: question.MultiSelect,
			Choices:     choices,
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    questionInfo,
		})
	}
}

// AnswerQuestionHandler - ответ на вопрос
func AnswerQuestionHandler(attemptService core.AttemptService) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		attemptID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid attempt ID",
				},
			})
			return
		}

		var req AnswerRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid request data",
					Details: err.Error(),
				},
			})
			return
		}

		isCorrect, explanation, err := attemptService.AnswerQuestion(c.Request.Context(), uint(attemptID), req.QuestionID, req.ChoiceIDs)
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeAttemptNotFound,
					Message: err.Error(),
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: AnswerResponse{
				Correct:     isCorrect,
				Explanation: explanation,
			},
		})
	}
}

// CompleteAttemptHandler - завершение попытки
func CompleteAttemptHandler(attemptService core.AttemptService) gin.HandlerFunc {
	return func(c *gin.Context) {
		idStr := c.Param("id")
		attemptID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid attempt ID",
				},
			})
			return
		}

		result, err := attemptService.CompleteAttempt(c.Request.Context(), uint(attemptID))
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeAttemptNotFound,
					Message: err.Error(),
				},
			})
			return
		}

		attemptInfo := AttemptInfo{
			ID:          result.Attempt.ID,
			LevelID:     result.Attempt.LevelID,
			Status:      string(result.Attempt.Status),
			ResultScore: result.Attempt.ResultScore,
			StartedAt:   result.Attempt.StartedAt.Format(time.RFC3339),
		}
		if result.Attempt.CompletedAt != nil {
			completedAt := result.Attempt.CompletedAt.Format(time.RFC3339)
			attemptInfo.CompletedAt = &completedAt
		}

		// Конвертируем типы из core в http
		var wrongQuestions []*WrongQuestion
		for _, wq := range result.WrongQuestions {
			wrongQuestions = append(wrongQuestions, &WrongQuestion{
				QuestionID:       wq.QuestionID,
				Prompt:           wq.Prompt,
				YourChoiceIDs:    wq.YourChoiceIDs,
				CorrectChoiceIDs: wq.CorrectChoiceIDs,
				Explanation:      wq.Explanation,
			})
		}

		var rewardInfo *RewardInfo
		if result.Reward != nil {
			rewardInfo = &RewardInfo{
				Diamonds: result.Reward.Diamonds,
				TxID:     result.Reward.TxID,
				Reason:   result.Reward.Reason,
			}
		}

		attemptResult := AttemptResult{
			Attempt:        &attemptInfo,
			Score:          result.Score,
			TotalQuestions: result.TotalQuestions,
			CorrectAnswers: result.CorrectAnswers,
			WrongQuestions: wrongQuestions,
			Reward:         rewardInfo,
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    attemptResult,
		})
	}
}

// CancelAttemptHandler - отмена (прерывание) попытки
func CancelAttemptHandler(attemptService core.AttemptService) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get user ID",
				},
			})
			return
		}

		idStr := c.Param("id")
		attemptID, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Invalid attempt ID",
				},
			})
			return
		}

		err = attemptService.CancelAttempt(c.Request.Context(), uint(attemptID), userID)
		if err != nil {
			status := http.StatusBadRequest
			code := ErrCodeInternal
			if err.Error() == "forbidden" {
				status = http.StatusForbidden
				code = ErrCodeForbidden
			}
			c.JSON(status, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    code,
					Message: err.Error(),
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: gin.H{
				"message": "Attempt cancelled",
			},
		})
	}
}
