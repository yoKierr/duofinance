package domain

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Модель для всех таблиц
type Model struct {
	ID        uint `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// User — аккаунт игрока.
type User struct {
	Model
	Email        string  `gorm:"size:255;uniqueIndex;not null"`
	Username     string  `gorm:"size:255;uniqueIndex;not null"`
	PasswordHash string  `gorm:"size:255;not null"`
	Profile      Profile `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`

	// Связи
	Attempts     []Attempt     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
	Achievements []Achievement `gorm:"many2many:user_achievements;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	RewardTxs    []RewardTx    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
	Hints        []Hint        `gorm:"foreignKey:CreatedByUserID"`
	Reminders    []Reminder    `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

// Profile — игровая мета-информация (статистика, серия/streak).
type Profile struct {
	Model
	UserID uint           `gorm:"uniqueIndex;not null"`
	Streak int            `gorm:"not null;default:0"`
	Stats  datatypes.JSON // произвольная статистика
	Meta   datatypes.JSON // дополнительная мета
}

// Level — карточка уровня (тема, сложность, награда, набор шагов).
type Level struct {
	Model
	Title        string      `gorm:"size:255;not null"`
	Topic        string      `gorm:"size:255"`
	Difficulty   string      `gorm:"size:50;index"` // e.g. easy|medium|hard
	RewardPoints int         `gorm:"not null;default:0"`
	IsActive     bool        `gorm:"not null;default:true"`
	Steps        []LevelStep `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

// LevelStep — шаг/этап уровня (вопрос, симуляция, текст, тип).
type LevelStep struct {
	Model
	LevelID uint           `gorm:"index:idx_level_step_order,unique,priority:1;not null"`
	Order   int            `gorm:"index:idx_level_step_order,unique,priority:2;not null"`
	Type    string         `gorm:"size:50;not null;index"` // question|simulation|text|...
	Title   string         `gorm:"size:255"`
	Payload datatypes.JSON // произвольный JSON для симуляций/текстовых шагов
	// If this step is a question, link to Question
	QuestionID *uint
	Question   *Question `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
}

// Question — структура вопроса/вариантов.
type Question struct {
	Model
	Prompt      string   `gorm:"type:text;not null"`
	Explanation string   `gorm:"type:text"`
	MultiSelect bool     `gorm:"not null;default:false"`
	Choices     []Choice `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

// Choice — варианты ответа.
type Choice struct {
	Model
	QuestionID uint   `gorm:"index;not null"`
	Text       string `gorm:"type:text;not null"`
	IsCorrect  bool   `gorm:"not null;default:false"`
	Order      int    `gorm:"not null;default:0"`
}

// Attempt — попытка прохождения уровня.
type Attempt struct {
	Model
	UserID      uint          `gorm:"index;not null"`
	LevelID     uint          `gorm:"index;not null"`
	Status      AttemptStatus `gorm:"size:50;index;not null;default:'in_progress'"`
	ResultScore int           `gorm:"not null;default:0"`
	StartedAt   time.Time     `gorm:"not null"`
	CompletedAt *time.Time
	Steps       []AttemptStep `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}

// AttemptStep — запись по шагам внутри попытки.
type AttemptStep struct {
	Model
	AttemptID   uint           `gorm:"index;not null"`
	LevelStepID uint           `gorm:"index;not null"`
	QuestionID  *uint          `gorm:"index"`
	StepOrder   int            `gorm:"not null;index"`
	Response    datatypes.JSON // ответы пользователя
	Correct     bool           `gorm:"not null;default:false"`
	DurationMs  int64          `gorm:"not null;default:0"`
}

// Achievement — достижения/бейджи.
type Achievement struct {
	Model
	Code        string `gorm:"size:100;uniqueIndex;not null"`
	Name        string `gorm:"size:255;not null"`
	Description string `gorm:"type:text"`
	Icon        string `gorm:"size:255"`
	Points      int    `gorm:"not null;default:0"`
}

// UserAchievement — связь многие-ко-многим пользователей и достижений с метаданными.
type UserAchievement struct {
	Model
	UserID        uint      `gorm:"index:idx_user_achievement_unique,unique,priority:1;not null"`
	AchievementID uint      `gorm:"index:idx_user_achievement_unique,unique,priority:2;not null"`
	AwardedAt     time.Time `gorm:"not null"`
}

// RewardTx — транзакция наград (начисления/списания).
type RewardTx struct {
	Model
	UserID    uint   `gorm:"index;not null"`
	Amount    int64  `gorm:"not null"`               // положительное — начисление, отрицательное — списание
	Type      string `gorm:"size:50;index;not null"` // earn|spend|bonus|...
	Reason    string `gorm:"size:255"`
	AttemptID *uint  `gorm:"index"`
}

func (RewardTx) TableName() string {
	return "reward_txs"
}

// Hint — подсказки, которые можно выдавать пользователю.
type Hint struct {
	Model
	CreatedByUserID *uint  `gorm:"index"`
	LevelID         *uint  `gorm:"index"`
	LevelStepID     *uint  `gorm:"index"`
	Text            string `gorm:"type:text;not null"`
	Cost            *int   // в очках/монетах, если применимо
	IsActive        bool   `gorm:"not null;default:true"`
}

// Reminder — напоминания/уведомления о возвращении.
type Reminder struct {
	Model
	UserID  uint      `gorm:"index;not null"`
	Type    string    `gorm:"size:50;index;not null"` // email|push|in_app|...
	SendAt  time.Time `gorm:"index;not null"`
	SentAt  *time.Time
	Payload datatypes.JSON // параметры уведомления
}
