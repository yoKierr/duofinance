package repo

import (
	"context"
	"time"

	"github.com/ImCtyz/duofinance/backend/internal/domain"
	"gorm.io/gorm"
)

// Заглушки для репозиториев - нужно будет реализовать

type userRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) UserRepo {
	return &userRepo{db: db}
}

func (r *userRepo) Create(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) GetByID(ctx context.Context, id uint) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).Where("username = ?", username).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepo) Update(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepo) GetProfile(ctx context.Context, userID uint) (*domain.Profile, error) {
	var profile domain.Profile
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		return nil, err
	}
	return &profile, nil
}

func (r *userRepo) UpdateProfile(ctx context.Context, profile *domain.Profile) error {
	return r.db.WithContext(ctx).Save(profile).Error
}

func (r *userRepo) GetDiamondsBalance(ctx context.Context, userID uint) (int64, error) {
	var balance int64
	err := r.db.WithContext(ctx).Model(&domain.RewardTx{}).
		Where("user_id = ?", userID).
		Select("COALESCE(SUM(amount), 0)").
		Scan(&balance).Error
	return balance, err
}

type levelRepo struct {
	db *gorm.DB
}

func NewLevelRepo(db *gorm.DB) LevelRepo {
	return &levelRepo{db: db}
}

func (r *levelRepo) GetAll(ctx context.Context) ([]*domain.Level, error) {
	var levels []*domain.Level
	err := r.db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("id ASC").
		Find(&levels).Error
	if err != nil {
		return nil, err
	}
	return levels, nil
}

func (r *levelRepo) GetByID(ctx context.Context, id uint) (*domain.Level, error) {
	var level domain.Level
	if err := r.db.WithContext(ctx).First(&level, id).Error; err != nil {
		return nil, err
	}
	return &level, nil
}

func (r *levelRepo) GetWithSteps(ctx context.Context, id uint) (*domain.Level, error) {
	var level domain.Level
	err := r.db.WithContext(ctx).
		Preload("Steps", func(db *gorm.DB) *gorm.DB { return db.Order("\"order\" ASC") }).
		Preload("Steps.Question").
		Preload("Steps.Question.Choices", func(db *gorm.DB) *gorm.DB { return db.Order("\"order\" ASC") }).
		First(&level, id).Error
	if err != nil {
		return nil, err
	}
	return &level, nil
}

func (r *levelRepo) GetByDifficulty(ctx context.Context, difficulty string) ([]*domain.Level, error) {
	var levels []*domain.Level
	err := r.db.WithContext(ctx).
		Where("is_active = ? AND difficulty = ?", true, difficulty).
		Order("id ASC").
		Find(&levels).Error
	if err != nil {
		return nil, err
	}
	return levels, nil
}

func (r *levelRepo) GetByTopic(ctx context.Context, topic string) ([]*domain.Level, error) {
	var levels []*domain.Level
	err := r.db.WithContext(ctx).
		Where("is_active = ? AND topic = ?", true, topic).
		Order("id ASC").
		Find(&levels).Error
	if err != nil {
		return nil, err
	}
	return levels, nil
}

type questionRepo struct {
	db *gorm.DB
}

func NewQuestionRepo(db *gorm.DB) QuestionRepo {
	return &questionRepo{db: db}
}

func (r *questionRepo) GetByID(ctx context.Context, id uint) (*domain.Question, error) {
	var question domain.Question
	err := r.db.WithContext(ctx).First(&question, id).Error
	if err != nil {
		return nil, err
	}
	return &question, nil
}

func (r *questionRepo) GetWithChoices(ctx context.Context, id uint) (*domain.Question, error) {
	var question domain.Question
	err := r.db.WithContext(ctx).
		Preload("Choices", func(db *gorm.DB) *gorm.DB { return db.Order("\"order\" ASC") }).
		First(&question, id).Error
	if err != nil {
		return nil, err
	}
	return &question, nil
}

func (r *questionRepo) GetByLevelID(ctx context.Context, levelID uint) ([]*domain.Question, error) {
	var questions []*domain.Question
	err := r.db.WithContext(ctx).
		Joins("JOIN level_steps ON level_steps.question_id = questions.id").
		Where("level_steps.level_id = ?", levelID).
		Preload("Choices", func(db *gorm.DB) *gorm.DB { return db.Order("\"order\" ASC") }).
		Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}

func (r *questionRepo) GetByIDs(ctx context.Context, ids []uint) ([]*domain.Question, error) {
	var questions []*domain.Question
	err := r.db.WithContext(ctx).
		Where("id IN ?", ids).
		Preload("Choices", func(db *gorm.DB) *gorm.DB { return db.Order("\"order\" ASC") }).
		Find(&questions).Error
	if err != nil {
		return nil, err
	}
	return questions, nil
}

type attemptRepo struct {
	db *gorm.DB
}

func NewAttemptRepo(db *gorm.DB) AttemptRepo {
	return &attemptRepo{db: db}
}

func (r *attemptRepo) Create(ctx context.Context, attempt *domain.Attempt) error {
	return r.db.WithContext(ctx).Create(attempt).Error
}

func (r *attemptRepo) GetByID(ctx context.Context, id uint) (*domain.Attempt, error) {
	var attempt domain.Attempt
	err := r.db.WithContext(ctx).
		Preload("Steps", func(db *gorm.DB) *gorm.DB { return db.Order("step_order ASC") }).
		First(&attempt, id).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

func (r *attemptRepo) GetActiveByUserAndLevel(ctx context.Context, userID, levelID uint) (*domain.Attempt, error) {
	var attempt domain.Attempt
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND level_id = ? AND status = ?", userID, levelID, "in_progress").
		First(&attempt).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

func (r *attemptRepo) GetByUserID(ctx context.Context, userID uint) ([]*domain.Attempt, error) {
	var attempts []*domain.Attempt
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("started_at DESC").
		Find(&attempts).Error
	if err != nil {
		return nil, err
	}
	return attempts, nil
}

func (r *attemptRepo) Update(ctx context.Context, attempt *domain.Attempt) error {
	return r.db.WithContext(ctx).Save(attempt).Error
}

func (r *attemptRepo) AddStep(ctx context.Context, step *domain.AttemptStep) error {
	return r.db.WithContext(ctx).Create(step).Error
}

func (r *attemptRepo) GetSteps(ctx context.Context, attemptID uint) ([]*domain.AttemptStep, error) {
	var steps []*domain.AttemptStep
	err := r.db.WithContext(ctx).
		Where("attempt_id = ?", attemptID).
		Order("step_order ASC").
		Find(&steps).Error
	if err != nil {
		return nil, err
	}
	return steps, nil
}

func (r *attemptRepo) GetNextUnansweredStep(ctx context.Context, attemptID uint) (*domain.AttemptStep, error) {
	var step domain.AttemptStep
	err := r.db.WithContext(ctx).
		Where("attempt_id = ? AND response IS NULL", attemptID).
		Order("step_order ASC").
		First(&step).Error
	if err != nil {
		return nil, err
	}
	return &step, nil
}

type rewardTxRepo struct {
	db *gorm.DB
}

func NewRewardTxRepo(db *gorm.DB) RewardTxRepo {
	return &rewardTxRepo{db: db}
}

func (r *rewardTxRepo) Create(ctx context.Context, tx *domain.RewardTx) error {
	return r.db.WithContext(ctx).Create(tx).Error
}

func (r *rewardTxRepo) GetByUserID(ctx context.Context, userID uint) ([]*domain.RewardTx, error) {
	var transactions []*domain.RewardTx
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&transactions).Error
	return transactions, err
}

func (r *rewardTxRepo) GetBalance(ctx context.Context, userID uint) (int64, error) {
	var balance int64
	err := r.db.WithContext(ctx).Model(&domain.RewardTx{}).
		Select("COALESCE(SUM(amount), 0)").
		Where("user_id = ?", userID).
		Scan(&balance).Error
	return balance, err
}

func (r *rewardTxRepo) GetByType(ctx context.Context, userID uint, txType string) ([]*domain.RewardTx, error) {
	var transactions []*domain.RewardTx
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND type = ?", userID, txType).
		Order("created_at DESC").
		Find(&transactions).Error
	return transactions, err
}

type achievementRepo struct {
	db *gorm.DB
}

func NewAchievementRepo(db *gorm.DB) AchievementRepo {
	return &achievementRepo{db: db}
}

func (r *achievementRepo) GetAll(ctx context.Context) ([]*domain.Achievement, error) {
	var achievements []*domain.Achievement
	err := r.db.WithContext(ctx).
		Order("id ASC").
		Find(&achievements).Error
	if err != nil {
		return nil, err
	}
	return achievements, nil
}

func (r *achievementRepo) GetByCode(ctx context.Context, code string) (*domain.Achievement, error) {
	var achievement domain.Achievement
	err := r.db.WithContext(ctx).Where("code = ?", code).First(&achievement).Error
	if err != nil {
		return nil, err
	}
	return &achievement, nil
}

func (r *achievementRepo) GetByUserID(ctx context.Context, userID uint) ([]*domain.Achievement, error) {
	var achievements []*domain.Achievement
	err := r.db.WithContext(ctx).
		Joins("JOIN user_achievements ON user_achievements.achievement_id = achievements.id").
		Where("user_achievements.user_id = ?", userID).
		Order("user_achievements.awarded_at DESC").
		Find(&achievements).Error
	if err != nil {
		return nil, err
	}
	return achievements, nil
}

func (r *achievementRepo) AwardToUser(ctx context.Context, userID, achievementID uint) error {
	userAchievement := &domain.UserAchievement{
		UserID:        userID,
		AchievementID: achievementID,
		AwardedAt:     time.Now(),
	}
	return r.db.WithContext(ctx).Create(userAchievement).Error
}

func (r *achievementRepo) HasAchievement(ctx context.Context, userID, achievementID uint) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&domain.UserAchievement{}).
		Where("user_id = ? AND achievement_id = ?", userID, achievementID).
		Count(&count).Error
	return count > 0, err
}
