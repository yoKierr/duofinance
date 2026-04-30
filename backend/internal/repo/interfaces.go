package repo

import (
	"context"

	"github.com/ImCtyz/duofinance/backend/internal/domain"
)

// UserRepo - интерфейс для работы с пользователями
type UserRepo interface {
	// Создать нового пользователя
	Create(ctx context.Context, user *domain.User) error

	// Получить пользователя по email
	GetByEmail(ctx context.Context, email string) (*domain.User, error)

	// Получить пользователя по ID
	GetByID(ctx context.Context, id uint) (*domain.User, error)

	// Получить пользователя по username
	GetByUsername(ctx context.Context, username string) (*domain.User, error)

	// Обновить пользователя
	Update(ctx context.Context, user *domain.User) error

	// Получить профиль пользователя
	GetProfile(ctx context.Context, userID uint) (*domain.Profile, error)

	// Обновить профиль пользователя
	UpdateProfile(ctx context.Context, profile *domain.Profile) error

	// Получить баланс алмазов пользователя
	GetDiamondsBalance(ctx context.Context, userID uint) (int64, error)
}

// LevelRepo - интерфейс для работы с уровнями/уроками
type LevelRepo interface {
	// Получить все активные уровни
	GetAll(ctx context.Context) ([]*domain.Level, error)

	// Получить уровень по ID
	GetByID(ctx context.Context, id uint) (*domain.Level, error)

	// Получить уровень с шагами
	GetWithSteps(ctx context.Context, id uint) (*domain.Level, error)

	// Получить уровни по сложности
	GetByDifficulty(ctx context.Context, difficulty string) ([]*domain.Level, error)

	// Получить уровни по теме
	GetByTopic(ctx context.Context, topic string) ([]*domain.Level, error)
}

// QuestionRepo - интерфейс для работы с вопросами
type QuestionRepo interface {
	// Получить вопрос по ID
	GetByID(ctx context.Context, id uint) (*domain.Question, error)

	// Получить вопрос с вариантами ответов
	GetWithChoices(ctx context.Context, id uint) (*domain.Question, error)

	// Получить все вопросы уровня
	GetByLevelID(ctx context.Context, levelID uint) ([]*domain.Question, error)

	// Получить вопросы по ID списку
	GetByIDs(ctx context.Context, ids []uint) ([]*domain.Question, error)
}

// AttemptRepo - интерфейс для работы с попытками прохождения
type AttemptRepo interface {
	// Создать новую попытку
	Create(ctx context.Context, attempt *domain.Attempt) error

	// Получить попытку по ID
	GetByID(ctx context.Context, id uint) (*domain.Attempt, error)

	// Получить активную попытку пользователя для уровня
	GetActiveByUserAndLevel(ctx context.Context, userID, levelID uint) (*domain.Attempt, error)

	// Получить все попытки пользователя
	GetByUserID(ctx context.Context, userID uint) ([]*domain.Attempt, error)

	// Обновить попытку
	Update(ctx context.Context, attempt *domain.Attempt) error

	// Добавить шаг к попытке
	AddStep(ctx context.Context, step *domain.AttemptStep) error

	// Получить шаги попытки
	GetSteps(ctx context.Context, attemptID uint) ([]*domain.AttemptStep, error)

	// Получить следующий неотвеченный шаг
	GetNextUnansweredStep(ctx context.Context, attemptID uint) (*domain.AttemptStep, error)
}

// RewardTxRepo - интерфейс для работы с транзакциями наград
type RewardTxRepo interface {
	// Создать транзакцию награды
	Create(ctx context.Context, tx *domain.RewardTx) error

	// Получить транзакции пользователя
	GetByUserID(ctx context.Context, userID uint) ([]*domain.RewardTx, error)

	// Получить баланс пользователя (сумма всех транзакций)
	GetBalance(ctx context.Context, userID uint) (int64, error)

	// Получить транзакции по типу
	GetByType(ctx context.Context, userID uint, txType string) ([]*domain.RewardTx, error)
}

// AchievementRepo - интерфейс для работы с достижениями
type AchievementRepo interface {
	// Получить все достижения
	GetAll(ctx context.Context) ([]*domain.Achievement, error)

	// Получить достижение по коду
	GetByCode(ctx context.Context, code string) (*domain.Achievement, error)

	// Получить достижения пользователя
	GetByUserID(ctx context.Context, userID uint) ([]*domain.Achievement, error)

	// Назначить достижение пользователю
	AwardToUser(ctx context.Context, userID, achievementID uint) error

	// Проверить, есть ли у пользователя достижение
	HasAchievement(ctx context.Context, userID, achievementID uint) (bool, error)
}
