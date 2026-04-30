package http

// APIResponse - стандартный ответ API
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

// APIError - структура ошибки API
type APIError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Meta - метаинформация для ответа
type Meta struct {
	Total    int `json:"total,omitempty"`
	Page     int `json:"page,omitempty"`
	PageSize int `json:"page_size,omitempty"`
}

// AuthRequest - запрос на регистрацию/логин
type AuthRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Username string `json:"username" binding:"required,min=3,max=50"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest - запрос на вход
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshTokenRequest - запрос на обновление токена
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// AuthResponse - ответ с токенами
type AuthResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	User         *UserInfo `json:"user"`
}

// UserInfo - информация о пользователе для ответа
type UserInfo struct {
	ID       uint         `json:"id"`
	Email    string       `json:"email"`
	Username string       `json:"username"`
	Profile  *ProfileInfo `json:"profile,omitempty"`
}

// ProfileInfo - информация о профиле
type ProfileInfo struct {
	Streak   int                    `json:"streak"`
	Diamonds int64                  `json:"diamonds"`
	Stats    map[string]interface{} `json:"stats,omitempty"`
}

// StartAttemptRequest - запрос на начало попытки
type StartAttemptRequest struct {
	LevelID uint `json:"level_id" binding:"required"`
}

// AnswerRequest - запрос с ответом на вопрос
type AnswerRequest struct {
	QuestionID uint   `json:"question_id" binding:"required"`
	ChoiceIDs  []uint `json:"choice_ids" binding:"required"`
}

// AnswerResponse - ответ на вопрос
type AnswerResponse struct {
	Correct      bool          `json:"correct"`
	Explanation  string        `json:"explanation,omitempty"`
	NextQuestion *QuestionInfo `json:"next_question,omitempty"`
}

// QuestionInfo - информация о вопросе
type QuestionInfo struct {
	ID          uint         `json:"id"`
	Prompt      string       `json:"prompt"`
	MultiSelect bool         `json:"multi_select"`
	Choices     []ChoiceInfo `json:"choices"`
}

// ChoiceInfo - информация о варианте ответа
type ChoiceInfo struct {
	ID   uint   `json:"id"`
	Text string `json:"text"`
}

// LevelInfo - информация об уровне
type LevelInfo struct {
	ID           uint   `json:"id"`
	Title        string `json:"title"`
	Topic        string `json:"topic"`
	Difficulty   string `json:"difficulty"`
	RewardPoints int    `json:"reward_points"`
	IsActive     bool   `json:"is_active"`
}

// LevelDetail - детальная информация об уровне
type LevelDetail struct {
	LevelInfo
	Description string `json:"description"`
	StepsCount  int    `json:"steps_count"`
}

// AttemptInfo - информация о попытке
type AttemptInfo struct {
	ID          uint    `json:"id"`
	LevelID     uint    `json:"level_id"`
	Status      string  `json:"status"`
	ResultScore int     `json:"result_score"`
	StartedAt   string  `json:"started_at"`
	CompletedAt *string `json:"completed_at,omitempty"`
}

// AttemptResult - результат попытки
type AttemptResult struct {
	Attempt        *AttemptInfo     `json:"attempt"`
	Score          int              `json:"score"`
	TotalQuestions int              `json:"total_questions"`
	CorrectAnswers int              `json:"correct_answers"`
	WrongQuestions []*WrongQuestion `json:"wrong_questions"`
	Reward         *RewardInfo      `json:"reward"`
}

// WrongQuestion - неправильно отвеченный вопрос
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

// AchievementInfo - информация о достижении
type AchievementInfo struct {
	ID          uint   `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Points      int    `json:"points"`
}

// Коды ошибок
const (
	ErrCodeValidation         = "VALIDATION_ERROR"
	ErrCodeUnauthorized       = "UNAUTHORIZED"
	ErrCodeForbidden          = "FORBIDDEN"
	ErrCodeNotFound           = "NOT_FOUND"
	ErrCodeConflict           = "CONFLICT"
	ErrCodeInternal           = "INTERNAL_ERROR"
	ErrCodeInvalidToken       = "INVALID_TOKEN"
	ErrCodeExpiredToken       = "EXPIRED_TOKEN"
	ErrCodeUserExists         = "USER_EXISTS"
	ErrCodeInvalidCredentials = "INVALID_CREDENTIALS"
	ErrCodeLevelNotFound      = "LEVEL_NOT_FOUND"
	ErrCodeAttemptNotFound    = "ATTEMPT_NOT_FOUND"
	ErrCodeQuestionNotFound   = "QUESTION_NOT_FOUND"
	ErrCodeAttemptCompleted   = "ATTEMPT_COMPLETED"
	ErrCodeInsufficientFunds  = "INSUFFICIENT_FUNDS"
)
