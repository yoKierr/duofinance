package core

import (
	"context"

	"github.com/ImCtyz/duofinance/backend/internal/domain"
)

// AuthService - интерфейс для аутентификации и авторизации
type AuthService interface {
	// Регистрация нового пользователя
	Register(ctx context.Context, email, username, password string) (*domain.User, error)

	// Вход в систему
	Login(ctx context.Context, email, password string) (accessToken, refreshToken string, user *domain.User, err error)

	// Обновление токена доступа
	RefreshToken(ctx context.Context, refreshToken string) (newAccessToken, newRefreshToken string, err error)

	// Получение текущего пользователя
	GetCurrentUser(ctx context.Context, userID uint) (*domain.User, error)

	// Валидация токена
	ValidateToken(ctx context.Context, token string) (userID uint, err error)

	// Выход из системы (инвалидация токенов)
	Logout(ctx context.Context, userID uint) error
}

// LevelService - интерфейс для работы с уровнями/уроками
type LevelService interface {
	// Получить список всех уровней
	GetLevels(ctx context.Context) ([]*domain.Level, error)

	// Получить детали уровня
	GetLevel(ctx context.Context, id uint) (*domain.Level, error)

	// Получить уровни по сложности
	GetLevelsByDifficulty(ctx context.Context, difficulty string) ([]*domain.Level, error)

	// Получить уровни по теме
	GetLevelsByTopic(ctx context.Context, topic string) ([]*domain.Level, error)

	// Проверить доступность уровня для пользователя
	IsLevelAvailable(ctx context.Context, levelID, userID uint) (bool, error)
}

// AttemptService - интерфейс для работы с попытками прохождения
type AttemptService interface {
	// Начать новую попытку прохождения уровня
	StartAttempt(ctx context.Context, userID, levelID uint) (*domain.Attempt, error)

	// Получить следующий вопрос в попытке
	GetNextQuestion(ctx context.Context, attemptID uint) (*domain.Question, error)

	// Ответить на вопрос
	AnswerQuestion(ctx context.Context, attemptID, questionID uint, choiceIDs []uint) (bool, string, error)

	// Завершить попытку и получить результаты
	CompleteAttempt(ctx context.Context, attemptID uint) (*AttemptResult, error)

	// Отменить (прервать) активную попытку
	CancelAttempt(ctx context.Context, attemptID uint, userID uint) error

	// Получить активную попытку пользователя для уровня
	GetActiveAttempt(ctx context.Context, userID, levelID uint) (*domain.Attempt, error)

	// Получить историю попыток пользователя
	GetUserAttempts(ctx context.Context, userID uint) ([]*domain.Attempt, error)
}

// UserService - интерфейс для работы с пользователями
type UserService interface {
	// Получить профиль пользователя
	GetProfile(ctx context.Context, userID uint) (*domain.Profile, error)

	// Обновить профиль пользователя
	UpdateProfile(ctx context.Context, userID uint, updates map[string]interface{}) error

	// Получить баланс алмазов
	GetDiamondsBalance(ctx context.Context, userID uint) (int64, error)

	// Получить статистику пользователя
	GetUserStats(ctx context.Context, userID uint) (*UserStats, error)

	// Обновить streak пользователя
	UpdateStreak(ctx context.Context, userID uint) error
}

// RewardService - интерфейс для работы с наградами
type RewardService interface {
	// Начислить алмазы пользователю
	AwardDiamonds(ctx context.Context, userID uint, amount int64, reason string, attemptID *uint) error

	// Списывать алмазы с пользователя
	SpendDiamonds(ctx context.Context, userID uint, amount int64, reason string) error

	// Получить историю транзакций
	GetTransactionHistory(ctx context.Context, userID uint) ([]*domain.RewardTx, error)

	// Проверить достаточность средств
	HasEnoughDiamonds(ctx context.Context, userID uint, amount int64) (bool, error)
}

// AchievementService - интерфейс для работы с достижениями
type AchievementService interface {
	// Получить все достижения
	GetAllAchievements(ctx context.Context) ([]*domain.Achievement, error)

	// Получить достижения пользователя
	GetUserAchievements(ctx context.Context, userID uint) ([]*domain.Achievement, error)

	// Проверить и выдать достижения
	CheckAndAwardAchievements(ctx context.Context, userID uint, eventType string, data map[string]interface{}) error

	// Получить прогресс по достижению
	GetAchievementProgress(ctx context.Context, userID, achievementID uint) (*AchievementProgress, error)
}

// AttemptResult - результат завершения попытки
type AttemptResult struct {
	Attempt         *domain.Attempt       `json:"attempt"`
	Score           int                   `json:"score"`
	TotalQuestions  int                   `json:"total_questions"`
	CorrectAnswers  int                   `json:"correct_answers"`
	WrongQuestions  []*WrongQuestion      `json:"wrong_questions"`
	Reward          *RewardInfo           `json:"reward"`
	NewAchievements []*domain.Achievement `json:"new_achievements,omitempty"`
}

// WrongQuestion - информация о неправильно отвеченном вопросе
type WrongQuestion struct {
	QuestionID       uint   `json:"question_id"`
	Prompt           string `json:"prompt"`
	YourChoiceIDs    []uint `json:"your_choice_ids"`
	CorrectChoiceIDs []uint `json:"correct_choice_ids"`
	Explanation      string `json:"explanation"`
}

// RewardInfo - информация о награде
type RewardInfo struct {
	Diamonds int64  `json:"diamonds"`
	TxID     uint   `json:"tx_id"`
	Reason   string `json:"reason"`
}

// UserStats - статистика пользователя
type UserStats struct {
	TotalAttempts     int     `json:"total_attempts"`
	CompletedLevels   int     `json:"completed_levels"`
	TotalDiamonds     int64   `json:"total_diamonds"`
	CurrentStreak     int     `json:"current_streak"`
	AverageScore      float64 `json:"average_score"`
	AchievementsCount int     `json:"achievements_count"`
}

// AchievementProgress - прогресс по достижению
type AchievementProgress struct {
	Achievement *domain.Achievement `json:"achievement"`
	Progress    int                 `json:"progress"`
	MaxProgress int                 `json:"max_progress"`
	IsCompleted bool                `json:"is_completed"`
}
