package http

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/ImCtyz/duofinance/backend/internal/auth"
	"github.com/ImCtyz/duofinance/backend/internal/core"
	"github.com/gin-gonic/gin"
)

// LoggerMiddleware - логирование запросов
func LoggerMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

// CORSMiddleware - настройка CORS
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// RecoveryMiddleware - восстановление после паники
func RecoveryMiddleware() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			c.JSON(http.StatusInternalServerError, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeInternal,
					Message: "Internal server error",
					Details: err,
				},
			})
		}
		c.Abort()
	})
}

// AuthMiddleware - middleware для проверки аутентификации
func AuthMiddleware(authService core.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeUnauthorized,
					Message: "Authorization header is required",
				},
			})
			c.Abort()
			return
		}

		// Проверяем формат "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    ErrCodeUnauthorized,
					Message: "Invalid authorization header format",
				},
			})
			c.Abort()
			return
		}

		token := parts[1]
		userID, err := authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			var errorCode string
			if err == auth.ErrExpiredToken {
				errorCode = ErrCodeExpiredToken
			} else {
				errorCode = ErrCodeInvalidToken
			}

			c.JSON(http.StatusUnauthorized, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    errorCode,
					Message: "Invalid or expired token",
				},
			})
			c.Abort()
			return
		}

		// Сохраняем userID в контекст
		c.Set("userID", userID)
		c.Next()
	}
}

// GetUserIDFromContext - получение userID из контекста
func GetUserIDFromContext(c *gin.Context) (uint, error) {
	userID, exists := c.Get("userID")
	if !exists {
		return 0, fmt.Errorf("userID not found in context")
	}

	id, ok := userID.(uint)
	if !ok {
		return 0, fmt.Errorf("invalid userID type in context")
	}

	return id, nil
}

// RateLimitMiddleware - ограничение частоты запросов (базовая реализация)
func RateLimitMiddleware() gin.HandlerFunc {
	// Простая реализация in-memory rate limiting
	// В продакшене лучше использовать Redis
	requests := make(map[string][]time.Time)

	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		now := time.Now()

		// Очищаем старые запросы (старше 1 минуты)
		if clientRequests, exists := requests[clientIP]; exists {
			var validRequests []time.Time
			for _, reqTime := range clientRequests {
				if now.Sub(reqTime) < time.Minute {
					validRequests = append(validRequests, reqTime)
				}
			}
			requests[clientIP] = validRequests
		}

		// Проверяем лимит (60 запросов в минуту)
		if len(requests[clientIP]) >= 60 {
			c.JSON(http.StatusTooManyRequests, APIResponse{
				Success: false,
				Error: &APIError{
					Code:    "RATE_LIMIT_EXCEEDED",
					Message: "Too many requests",
				},
			})
			c.Abort()
			return
		}

		// Добавляем текущий запрос
		requests[clientIP] = append(requests[clientIP], now)
		c.Next()
	}
}
