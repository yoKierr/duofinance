package http

import (
	"errors"
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

		avatar := core.ProfileAvatarFromMeta(profile.Meta)

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: UserInfo{
				ID:       user.ID,
				Email:    user.Email,
				Username: user.Username,
				Profile: &ProfileInfo{
					Streak:   profile.Streak,
					Diamonds: diamonds,
					Avatar:   avatar,
					Stats:    make(map[string]interface{}), // TODO: правильно обработать datatypes.JSON
				},
			},
		})
	}
}

// Level handlers

// GetCoursesHandler — список курсов (пока один доступный курс без таблицы в БД).
func GetCoursesHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		courses := []CourseInfo{
			{
				ID:    "1",
				Slug:  "financial-literacy-basics",
				Title: "Основы финансовой грамотности",
				Description: "Базовый курс: доход и расход, бюджет, сбережения и осознанные траты. " +
					"Короткие уроки с проверкой усвоения.",
				Available: true,
				SortOrder: 1,
			},
		}
		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    courses,
			Meta: &Meta{
				Total: len(courses),
			},
		})
	}
}

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
				"reward_points": level.RewardPoints,
				"is_active":     level.IsActive,
				"description":   "",
				"steps_count":   len(level.Steps),
				"steps":         steps,
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

// UpdateProfileHandler - обновление имени и аватара пользователя
func UpdateProfileHandler(authService core.AuthService, userService core.UserService) gin.HandlerFunc {
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

		var req UpdateProfileRequest
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

		if req.Username == nil && req.Avatar == nil {
			c.JSON(http.StatusBadRequest, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: "Nothing to update",
				},
			})
			return
		}

		_, err = userService.UpdateUserProfile(c.Request.Context(), userID, req.Username, req.Avatar)
		if err != nil {
			switch {
			case errors.Is(err, core.ErrInvalidUsername), errors.Is(err, core.ErrInvalidAvatar), errors.Is(err, core.ErrAvatarTooLarge):
				c.JSON(http.StatusBadRequest, APIResponse{
					Success: false,
					Error: &APIError{
						Code:    ErrCodeValidation,
						Message: err.Error(),
					},
				})
			case errors.Is(err, core.ErrUsernameTaken):
				c.JSON(http.StatusConflict, APIResponse{
					Success: false,
					Error: &APIError{
						Code:    ErrCodeUserExists,
						Message: "Username already taken",
					},
				})
			default:
				c.JSON(http.StatusInternalServerError, APIResponse{
					Success: false,
					Error: &APIError{
						Code:    ErrCodeInternal,
						Message: "Failed to update profile",
						Details: err.Error(),
					},
				})
			}
			return
		}

		user, err := authService.GetCurrentUser(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to load user",
				},
			})
			return
		}

		profile, err := userService.GetProfile(c.Request.Context(), userID)
		if err != nil {
			profile = &domain.Profile{UserID: userID, Streak: 0}
		}

		diamonds, _ := userService.GetDiamondsBalance(c.Request.Context(), userID)

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: UserInfo{
				ID:       user.ID,
				Email:    user.Email,
				Username: user.Username,
				Profile: &ProfileInfo{
					Streak:   profile.Streak,
					Diamonds: diamonds,
					Avatar:   core.ProfileAvatarFromMeta(profile.Meta),
				},
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

// GetAchievementsCatalogHandler — каталог достижений с прогрессом для текущего пользователя.
func GetAchievementsCatalogHandler(achievementService core.AchievementService) gin.HandlerFunc {
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

		items, err := achievementService.GetCatalogForUser(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get achievements catalog",
					Details: err.Error(),
				},
			})
			return
		}

		var catalog []AchievementCatalogInfo
		for _, item := range items {
			info := AchievementCatalogInfo{
				ID:          item.ID,
				Code:        item.Code,
				Name:        item.Name,
				Description: item.Description,
				Icon:        item.Icon,
				Points:      item.Points,
				Unlocked:    item.Unlocked,
				Progress:    item.Progress,
				MaxProgress: item.MaxProgress,
			}
			if item.AwardedAt != nil {
				ts := item.AwardedAt.Format(time.RFC3339)
				info.AwardedAt = &ts
			}
			catalog = append(catalog, info)
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    catalog,
			Meta: &Meta{
				Total: len(catalog),
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

// GetShopItemsHandler — каталог магазина
func GetShopItemsHandler(achievementService core.AchievementService) gin.HandlerFunc {
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

		items, err := achievementService.GetShopItemsForUser(c.Request.Context(), userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Failed to get shop items",
				},
			})
			return
		}

		var catalog []ShopItemInfo
		for _, item := range items {
			catalog = append(catalog, ShopItemInfo{
				ID:          item.ID,
				Code:        item.Code,
				Name:        item.Name,
				Description: item.Description,
				Icon:        item.Icon,
				Price:       item.Price,
				Owned:       item.Owned,
			})
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    catalog,
			Meta: &Meta{
				Total: len(catalog),
			},
		})
	}
}

// PurchaseShopItemHandler — покупка достижения за алмазы
func PurchaseShopItemHandler(achievementService core.AchievementService) gin.HandlerFunc {
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

		var req ShopPurchaseRequest
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

		result, err := achievementService.PurchaseShopItem(c.Request.Context(), userID, req.AchievementID)
		if err != nil {
			switch {
			case errors.Is(err, core.ErrShopItemNotFound):
				c.JSON(http.StatusNotFound, APIResponse{
					Success: false,
					Error: &APIError{
						Code:    ErrCodeNotFound,
						Message: "Товар не найден",
					},
				})
			case errors.Is(err, core.ErrAchievementOwned):
				c.JSON(http.StatusConflict, APIResponse{
					Success: false,
					Error: &APIError{
						Code:    ErrCodeConflict,
						Message: "Достижение уже куплено",
					},
				})
			case errors.Is(err, core.ErrInsufficientDiamonds):
				c.JSON(http.StatusPaymentRequired, APIResponse{
					Success: false,
					Error: &APIError{
						Code:    ErrCodeInsufficientFunds,
						Message: "Недостаточно алмазов",
					},
				})
			default:
				c.JSON(http.StatusInternalServerError, APIResponse{
					Success: false,
					Error: &APIError{
						Code:    ErrCodeInternal,
						Message: "Failed to purchase item",
						Details: err.Error(),
					},
				})
			}
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data: ShopPurchaseResponse{
				AchievementID: result.AchievementID,
				Balance:       result.Balance,
			},
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

// GetNextQuestionHandler - следующий шаг урока (текст или вопрос)
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

		next, err := attemptService.GetNextLessonStep(c.Request.Context(), uint(attemptID))
		if err != nil {
			if errors.Is(err, core.ErrNoMoreLessonSteps) {
				c.JSON(http.StatusOK, APIResponse{
					Success: true,
					Data: gin.H{
						"kind":    core.LessonStepKindNone,
						"message": "No more steps",
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

		if next == nil {
			c.JSON(http.StatusOK, APIResponse{
				Success: true,
				Data: gin.H{
					"kind":    core.LessonStepKindNone,
					"message": "No step available",
				},
			})
			return
		}

		switch next.Kind {
		case core.LessonStepKindText:
			c.JSON(http.StatusOK, APIResponse{
				Success: true,
				Data: gin.H{
					"kind":          next.Kind,
					"level_step_id": next.LevelStepID,
					"title":         next.Title,
					"body":          next.Body,
				},
			})
			return
		case core.LessonStepKindQuestion:
			if next.Question == nil {
				c.JSON(http.StatusOK, APIResponse{
					Success: true,
					Data: gin.H{
						"kind":    core.LessonStepKindNone,
						"message": "No question available",
					},
				})
				return
			}
			q := next.Question
			var choices []ChoiceInfo
			for _, choice := range q.Choices {
				choices = append(choices, ChoiceInfo{
					ID:   choice.ID,
					Text: choice.Text,
				})
			}
			questionInfo := QuestionInfo{
				ID:          q.ID,
				Prompt:      q.Prompt,
				MultiSelect: q.MultiSelect,
				Choices:     choices,
			}
			c.JSON(http.StatusOK, APIResponse{
				Success: true,
				Data: gin.H{
					"kind":          next.Kind,
					"level_step_id": next.LevelStepID,
					"question":      questionInfo,
				},
			})
			return
		default:
			c.JSON(http.StatusOK, APIResponse{
				Success: true,
				Data: gin.H{
					"kind":    core.LessonStepKindNone,
					"message": "Unknown step",
				},
			})
		}
	}
}

// AcknowledgeTextStepHandler - отметить просмотр текстовой карточки
func AcknowledgeTextStepHandler(attemptService core.AttemptService) gin.HandlerFunc {
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

		var req TextStepAckRequest
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

		if err := attemptService.AcknowledgeTextStep(c.Request.Context(), uint(attemptID), userID, req.LevelStepID); err != nil {
			status := http.StatusBadRequest
			msg := err.Error()
			if msg == "forbidden" {
				status = http.StatusForbidden
			}
			c.JSON(status, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeValidation,
					Message: msg,
				},
			})
			return
		}

		c.JSON(http.StatusOK, APIResponse{
			Success: true,
			Data:    gin.H{"ok": true},
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
