package core

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/ImCtyz/duofinance/backend/internal/auth"
	"github.com/ImCtyz/duofinance/backend/internal/domain"
	"github.com/ImCtyz/duofinance/backend/internal/repo"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Заглушки для сервисов - нужно будет реализовать

type authService struct {
	userRepo   repo.UserRepo
	jwtManager *auth.JWTManager
}

func NewAuthService(userRepo repo.UserRepo, jwtManager *auth.JWTManager) AuthService {
	return &authService{userRepo: userRepo, jwtManager: jwtManager}
}

func (s *authService) Register(ctx context.Context, email, username, password string) (*domain.User, error) {
	// Проверяем, существует ли пользователь с таким email
	existingUser, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Проверяем, существует ли пользователь с таким username
	existingUser, err = s.userRepo.GetByUsername(ctx, username)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingUser != nil {
		return nil, errors.New("user with this username already exists")
	}

	// Хешируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Создаем пользователя
	user := &domain.User{
		Email:        email,
		Username:     username,
		PasswordHash: string(hashedPassword),
	}

	// Сохраняем в БД
	err = s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	// Создаем профиль пользователя
	profile := &domain.Profile{
		UserID: user.ID,
		Streak: 0,
		Stats:  nil, // Пустая статистика
		Meta:   nil, // Пустые метаданные
	}

	err = s.userRepo.UpdateProfile(ctx, profile)
	if err != nil {
		// Если профиль не создался, это не критично для регистрации
		// Просто логируем ошибку
	}

	return user, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (accessToken, refreshToken string, user *domain.User, err error) {
	// Получаем пользователя по email
	user, err = s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", "", nil, errors.New("invalid email or password")
		}
		return "", "", nil, err
	}

	// Проверяем пароль
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}

	// Генерируем токены
	accessToken, refreshToken, err = s.jwtManager.GenerateTokens(user.ID, user.Email, user.Username)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, user, nil
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (newAccessToken, newRefreshToken string, err error) {
	// Валидируем refresh токен
	claims, err := s.jwtManager.ValidateRefreshToken(refreshToken)
	if err != nil {
		return "", "", err
	}

	// Получаем пользователя
	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return "", "", err
	}

	// Генерируем новые токены
	newAccessToken, newRefreshToken, err = s.jwtManager.GenerateTokens(user.ID, user.Email, user.Username)
	if err != nil {
		return "", "", err
	}

	return newAccessToken, newRefreshToken, nil
}

func (s *authService) GetCurrentUser(ctx context.Context, userID uint) (*domain.User, error) {
	return s.userRepo.GetByID(ctx, userID)
}

func (s *authService) ValidateToken(ctx context.Context, token string) (userID uint, err error) {
	claims, err := s.jwtManager.ValidateAccessToken(token)
	if err != nil {
		return 0, err
	}
	return claims.UserID, nil
}

func (s *authService) Logout(ctx context.Context, userID uint) error {
	// В простой реализации JWT logout не требует действий на сервере
	// В более сложной системе можно добавить blacklist токенов
	return nil
}

type userService struct {
	userRepo     repo.UserRepo
	rewardTxRepo repo.RewardTxRepo
	attemptRepo  repo.AttemptRepo
}

func NewUserService(userRepo repo.UserRepo, rewardTxRepo repo.RewardTxRepo, attemptRepo repo.AttemptRepo) UserService {
	return &userService{userRepo: userRepo, rewardTxRepo: rewardTxRepo, attemptRepo: attemptRepo}
}

func (s *userService) GetProfile(ctx context.Context, userID uint) (*domain.Profile, error) {
	return s.userRepo.GetProfile(ctx, userID)
}

func (s *userService) UpdateProfile(ctx context.Context, userID uint, updates map[string]interface{}) error {
	profile, err := s.userRepo.GetProfile(ctx, userID)
	if err != nil {
		return err
	}

	// Обновляем поля профиля
	if streak, ok := updates["streak"].(int); ok {
		profile.Streak = streak
	}
	if stats, ok := updates["stats"].(map[string]interface{}); ok {
		statsJSON, _ := json.Marshal(stats)
		profile.Stats = datatypes.JSON(statsJSON)
	}
	if meta, ok := updates["meta"].(map[string]interface{}); ok {
		metaJSON, _ := json.Marshal(meta)
		profile.Meta = datatypes.JSON(metaJSON)
	}

	return s.userRepo.UpdateProfile(ctx, profile)
}

func (s *userService) GetDiamondsBalance(ctx context.Context, userID uint) (int64, error) {
	return s.rewardTxRepo.GetBalance(ctx, userID)
}

func (s *userService) GetUserStats(ctx context.Context, userID uint) (*UserStats, error) {
	// Получаем профиль
	profile, err := s.userRepo.GetProfile(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Получаем баланс алмазов
	balance, err := s.rewardTxRepo.GetBalance(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Получаем все попытки пользователя
	attempts, err := s.attemptRepo.GetByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Подсчитываем статистику
	totalAttempts := len(attempts)
	completedLevels := 0
	totalScore := 0.0
	completedLevelIDs := make(map[uint]bool)
	completedAttempts := 0

	// Проходим по всем попыткам
	for _, attempt := range attempts {
		if attempt.Status == "completed" && attempt.ResultScore >= 70 {
			// Считаем уникальные завершенные уровни
			if !completedLevelIDs[attempt.LevelID] {
				completedLevels++
				completedLevelIDs[attempt.LevelID] = true
			}
			totalScore += float64(attempt.ResultScore)
			completedAttempts++
		}
	}

	// Вычисляем средний балл
	averageScore := 0.0
	if completedAttempts > 0 {
		averageScore = totalScore / float64(completedAttempts)
	}

	return &UserStats{
		TotalAttempts:     totalAttempts,
		CompletedLevels:   completedLevels,
		TotalDiamonds:     balance,
		CurrentStreak:     profile.Streak,
		AverageScore:      averageScore,
		AchievementsCount: 0,
	}, nil
}

func (s *userService) UpdateStreak(ctx context.Context, userID uint) error {
	profile, err := s.userRepo.GetProfile(ctx, userID)
	if err != nil {
		return err
	}

	var meta map[string]interface{}
	if profile.Meta != nil && len(profile.Meta) > 0 {
		_ = json.Unmarshal(profile.Meta, &meta)
	}
	if meta == nil {
		meta = make(map[string]interface{})
	}

	// Определяем таймзону пользователя. Ожидаем IANA name в meta["timezone"].
	// Если не задано или некорректно — используем UTC.
	tzName, _ := meta["timezone"].(string)
	loc := time.UTC
	if tzName != "" {
		if l, err := time.LoadLocation(tzName); err == nil {
			loc = l
		}
	}

	now := time.Now().In(loc)
	today := now.Format("2006-01-02")
	last, _ := meta["streak_last_date"].(string)

	if last == today {
		return nil
	}

	// Если последняя дата — вчера в выбранной таймзоне, инкрементируем,
	// иначе считаем пропуск и начинаем с 1.
	newStreak := 1
	if last != "" {
		// Вычисляем "вчера" в пользовательской таймзоне
		yesterday := now.Add(-24 * time.Hour).Format("2006-01-02")
		if last == yesterday {
			newStreak = profile.Streak + 1
		} else {
			newStreak = 1
		}
	}

	meta["streak_last_date"] = today
	metaJSON, _ := json.Marshal(meta)
	profile.Meta = datatypes.JSON(metaJSON)
	profile.Streak = newStreak
	return s.userRepo.UpdateProfile(ctx, profile)
}

type levelService struct {
	levelRepo    repo.LevelRepo
	questionRepo repo.QuestionRepo
	attemptRepo  repo.AttemptRepo
}

func NewLevelService(levelRepo repo.LevelRepo, questionRepo repo.QuestionRepo, attemptRepo repo.AttemptRepo) LevelService {
	return &levelService{levelRepo: levelRepo, questionRepo: questionRepo, attemptRepo: attemptRepo}
}

func (s *levelService) GetLevels(ctx context.Context) ([]*domain.Level, error) {
	levels, err := s.levelRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}
	return levels, nil
}

func (s *levelService) GetLevel(ctx context.Context, id uint) (*domain.Level, error) {
	// С деталями шагов, если доступны
	level, err := s.levelRepo.GetWithSteps(ctx, id)
	if err != nil {
		return nil, err
	}
	return level, nil
}

func (s *levelService) GetLevelsByDifficulty(ctx context.Context, difficulty string) ([]*domain.Level, error) {
	levels, err := s.levelRepo.GetByDifficulty(ctx, difficulty)
	if err != nil {
		return nil, err
	}
	return levels, nil
}

func (s *levelService) GetLevelsByTopic(ctx context.Context, topic string) ([]*domain.Level, error) {
	levels, err := s.levelRepo.GetByTopic(ctx, topic)
	if err != nil {
		return nil, err
	}
	return levels, nil
}

func (s *levelService) IsLevelAvailable(ctx context.Context, levelID, userID uint) (bool, error) {
	level, err := s.levelRepo.GetByID(ctx, levelID)
	if err != nil {
		return false, err
	}
	if !level.IsActive {
		return false, nil
	}

	// Получаем активные уровни по порядку
	levels, err := s.levelRepo.GetAll(ctx)
	if err != nil {
		return false, err
	}

	// Оставляем только активные
	var activeLevels []*domain.Level
	for _, l := range levels {
		if l.IsActive {
			activeLevels = append(activeLevels, l)
		}
	}

	// Найдем позицию текущего уровня
	idx := -1
	for i, l := range activeLevels {
		if l.ID == levelID {
			idx = i
			break
		}
	}
	if idx == -1 {
		return false, errors.New("level not found")
	}

	// Первый уровень всегда доступен
	if idx == 0 {
		return true, nil
	}

	// Требуется завершение предыдущего активного уровня
	prev := activeLevels[idx-1]
	attempts, err := s.attemptRepo.GetByUserID(ctx, userID)
	if err != nil {
		return false, err
	}

	for _, a := range attempts {
		if a.LevelID == prev.ID && a.Status == domain.AttemptStatus("completed") && a.ResultScore >= 70 {
			return true, nil
		}
	}

	return false, nil
}

type attemptService struct {
	attemptRepo  repo.AttemptRepo
	levelRepo    repo.LevelRepo
	questionRepo repo.QuestionRepo
	rewardTxRepo repo.RewardTxRepo
	userService  UserService
}

func NewAttemptService(attemptRepo repo.AttemptRepo, levelRepo repo.LevelRepo, questionRepo repo.QuestionRepo, rewardTxRepo repo.RewardTxRepo, userService UserService) AttemptService {
	return &attemptService{
		attemptRepo:  attemptRepo,
		levelRepo:    levelRepo,
		questionRepo: questionRepo,
		rewardTxRepo: rewardTxRepo,
		userService:  userService,
	}
}

func (s *attemptService) StartAttempt(ctx context.Context, userID, levelID uint) (*domain.Attempt, error) {
	// Проверяем, что уровень существует и активен
	level, err := s.levelRepo.GetByID(ctx, levelID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("level not found")
		}
		return nil, err
	}
	if !level.IsActive {
		return nil, errors.New("level is not active")
	}

	// Доп. проверка: заблокирован ли уровень (нельзя начать, пока не завершен предыдущий)
	// Определяем предыдущий активный уровень
	levels, err := s.levelRepo.GetAll(ctx)
	if err == nil {
		var activeLevels []*domain.Level
		for _, l := range levels {
			if l.IsActive {
				activeLevels = append(activeLevels, l)
			}
		}
		// Найдем позицию текущего уровня среди активных
		idx := -1
		for i, l := range activeLevels {
			if l.ID == levelID {
				idx = i
				break
			}
		}
		if idx > 0 {
			prev := activeLevels[idx-1]
			// Проверяем завершение предыдущего уровня
			userAttempts, err2 := s.attemptRepo.GetByUserID(ctx, userID)
			if err2 == nil {
				prevCompleted := false
				for _, a := range userAttempts {
					if a.LevelID == prev.ID && a.Status == domain.AttemptStatus("completed") && a.ResultScore >= 70 {
						prevCompleted = true
						break
					}
				}
				if !prevCompleted {
					return nil, errors.New("previous level not completed")
				}
			}
		}
	}

	// Проверяем, нет ли уже активной попытки для этого уровня
	existingAttempt, err := s.attemptRepo.GetActiveByUserAndLevel(ctx, userID, levelID)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	if existingAttempt != nil {
		// Санитарная проверка на "застрявшие" попытки: если нет больше вопросов, но статус in_progress — отменяем и создаем новую
		if existingAttempt.Status == domain.AttemptInProgress {
			if _, err := s.GetNextQuestion(ctx, existingAttempt.ID); err != nil {
				if err.Error() == "no more questions" {
					// отменяем попытку и продолжаем создание новой
					_ = s.CancelAttempt(ctx, existingAttempt.ID, userID)
				} else {
					// при других ошибках возвращаем существующую, чтобы не терять прогресс
					return existingAttempt, nil
				}
			} else {
				// есть следующий вопрос — возвращаем текущую активную попытку
				return existingAttempt, nil
			}
		} else {
			return existingAttempt, nil // уже завершена/failed — вернем
		}
	}

	// Создаем новую попытку
	attempt := &domain.Attempt{
		UserID:      userID,
		LevelID:     levelID,
		Status:      "in_progress",
		ResultScore: 0,
		StartedAt:   time.Now(),
	}

	err = s.attemptRepo.Create(ctx, attempt)
	if err != nil {
		return nil, err
	}

	return attempt, nil
}

func (s *attemptService) GetNextQuestion(ctx context.Context, attemptID uint) (*domain.Question, error) {
	// Получаем попытку
	attempt, err := s.attemptRepo.GetByID(ctx, attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("attempt not found")
		}
		return nil, err
	}

	if attempt.Status != "in_progress" {
		return nil, errors.New("attempt is not in progress")
	}

	// Получаем уровень с шагами
	level, err := s.levelRepo.GetWithSteps(ctx, attempt.LevelID)
	if err != nil {
		return nil, err
	}

	// Получаем уже отвеченные шаги
	answeredSteps, err := s.attemptRepo.GetSteps(ctx, attemptID)
	if err != nil {
		return nil, err
	}

	// Создаем карту отвеченных шагов
	answeredMap := make(map[uint]bool)
	for _, step := range answeredSteps {
		if step.LevelStepID != 0 {
			answeredMap[step.LevelStepID] = true
		}
	}

	// Находим первый неотвеченный вопрос
	for _, step := range level.Steps {
		if step.Type == "question" && !answeredMap[step.ID] {
			if step.QuestionID != nil {
				// Получаем вопрос с вариантами ответов
				question, err := s.questionRepo.GetWithChoices(ctx, *step.QuestionID)
				if err != nil {
					return nil, err
				}
				return question, nil
			}
		}
	}

	return nil, errors.New("no more questions")
}

func (s *attemptService) AnswerQuestion(ctx context.Context, attemptID, questionID uint, choiceIDs []uint) (bool, string, error) {
	// Получаем попытку
	attempt, err := s.attemptRepo.GetByID(ctx, attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, "", errors.New("attempt not found")
		}
		return false, "", err
	}

	if attempt.Status != "in_progress" {
		return false, "", errors.New("attempt is not in progress")
	}

	// Получаем вопрос с правильными ответами
	question, err := s.questionRepo.GetWithChoices(ctx, questionID)
	if err != nil {
		return false, "", err
	}

	// Получаем правильные варианты ответов
	var correctChoiceIDs []uint
	for _, choice := range question.Choices {
		if choice.IsCorrect {
			correctChoiceIDs = append(correctChoiceIDs, choice.ID)
		}
	}

	// Проверяем правильность ответа
	isCorrect := compareChoiceIDs(choiceIDs, correctChoiceIDs)

	// Находим LevelStepID для этого вопроса
	level, err := s.levelRepo.GetWithSteps(ctx, attempt.LevelID)
	if err != nil {
		return false, "", err
	}

	var levelStepID uint
	for _, step := range level.Steps {
		if step.Type == "question" && step.QuestionID != nil && *step.QuestionID == questionID {
			levelStepID = step.ID
			break
		}
	}

	// Создаем или обновляем шаг попытки
	responseData := map[string]interface{}{
		"question_id": questionID,
		"choice_ids":  choiceIDs,
		"answered_at": time.Now(),
	}
	responseJSON, _ := json.Marshal(responseData)

	attemptStep := &domain.AttemptStep{
		AttemptID:   attemptID,
		LevelStepID: levelStepID,
		QuestionID:  &questionID,
		StepOrder:   len(attempt.Steps) + 1,
		Response:    datatypes.JSON(responseJSON),
		Correct:     isCorrect,
		DurationMs:  0, // Можно добавить подсчет времени
	}

	err = s.attemptRepo.AddStep(ctx, attemptStep)
	if err != nil {
		return false, "", err
	}

	return isCorrect, question.Explanation, nil
}

func (s *attemptService) CompleteAttempt(ctx context.Context, attemptID uint) (*AttemptResult, error) {
	// Получаем попытку
	attempt, err := s.attemptRepo.GetByID(ctx, attemptID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("attempt not found")
		}
		return nil, err
	}

	if attempt.Status != "in_progress" {
		return nil, errors.New("attempt is already completed")
	}

	// Получаем все шаги попытки
	steps, err := s.attemptRepo.GetSteps(ctx, attemptID)
	if err != nil {
		return nil, err
	}

	// Подсчитываем результаты по уникальным вопросам, учитывая последний ответ пользователя
	// Собираем последний ответ по каждому вопросу
	type lastAnswer struct {
		order   int
		correct bool
		step    *domain.AttemptStep
	}
	lastByQuestion := make(map[uint]lastAnswer)
	for _, step := range steps {
		if step.QuestionID == nil {
			continue
		}
		qid := *step.QuestionID
		la, ok := lastByQuestion[qid]
		if !ok || step.StepOrder > la.order {
			lastByQuestion[qid] = lastAnswer{order: step.StepOrder, correct: step.Correct, step: step}
		}
	}

	// Общее число вопросов берем из структуры уровня
	totalQuestions := 0
	lvl, _ := s.levelRepo.GetWithSteps(ctx, attempt.LevelID)
	if lvl != nil {
		for _, st := range lvl.Steps {
			if st.Type == "question" && st.QuestionID != nil {
				totalQuestions++
			}
		}
	} else {
		// fallback: количество уникальных вопросов из шагов попытки
		totalQuestions = len(lastByQuestion)
	}

	correctAnswers := 0
	var wrongQuestions []*WrongQuestion

	// Для подсчета количества правильно решенных вопросов (как X из N)
	// используем ПОСЛЕДНИЙ ответ по каждому вопросу
	for _, la := range lastByQuestion {
		if la.correct {
			correctAnswers++
		}
	}

	// Для расчета точности в стиле Duolingo: каждый вопрос дает вклад от 0 до 1
	// в зависимости от количества ошибок до первого правильного ответа.
	// Фактор: 1.0 без ошибок; 0.7 при 1 ошибке; 0.4 при 2 ошибках; 0.1 при 3; 0 при >=4.
	// Можно настроить формулой: max(0, 1 - 0.3*m), и затем ограничить минимумом 0.1 для m=3.
	contributionSum := 0.0

	// Собираем все шаги по вопросу для подсчета количества ошибок до первого правильного
	stepsByQuestion := make(map[uint][]*domain.AttemptStep)
	for _, st := range steps {
		if st.QuestionID == nil {
			continue
		}
		qid := *st.QuestionID
		stepsByQuestion[qid] = append(stepsByQuestion[qid], st)
	}

	for qid, qSteps := range stepsByQuestion {
		// Сортировка уже по step_order ASC у нас в выборке, но на всякий случай
		// порядок сохранен, так как GetSteps делает Order("step_order ASC").
		mistakes := 0
		firstCorrectFound := false
		var lastStep *domain.AttemptStep
		for _, st := range qSteps {
			lastStep = st
			if st.Correct {
				firstCorrectFound = true
				break
			}
			mistakes++
		}

		if !firstCorrectFound {
			// Нет правильного ответа — добавляем в список ошибок
			question, err := s.questionRepo.GetWithChoices(ctx, qid)
			if err == nil && lastStep != nil {
				var responseData map[string]interface{}
				json.Unmarshal(lastStep.Response, &responseData)

				var yourChoiceIDs []uint
				if raw, ok := responseData["choice_ids"]; ok {
					switch v := raw.(type) {
					case []interface{}:
						for _, id := range v {
							if idFloat, ok := id.(float64); ok {
								yourChoiceIDs = append(yourChoiceIDs, uint(idFloat))
							}
						}
					case []uint:
						yourChoiceIDs = v
					}
				}

				var correctChoiceIDs []uint
				for _, choice := range question.Choices {
					if choice.IsCorrect {
						correctChoiceIDs = append(correctChoiceIDs, choice.ID)
					}
				}

				wrongQuestions = append(wrongQuestions, &WrongQuestion{
					QuestionID:       qid,
					Prompt:           question.Prompt,
					YourChoiceIDs:    yourChoiceIDs,
					CorrectChoiceIDs: correctChoiceIDs,
					Explanation:      question.Explanation,
				})
			}
		}

		// Рассчитываем вклад вопроса в точность
		factor := 1.0 - 0.3*float64(mistakes)
		if mistakes == 3 {
			factor = 0.1
		}
		if factor < 0 {
			factor = 0
		}
		contributionSum += factor
	}

	// Вычисляем итоговый балл (точность) с учетом числа ошибок
	score := 0
	if totalQuestions > 0 {
		// Нормируем суммарный вклад по количеству вопросов
		normalized := (contributionSum / float64(totalQuestions)) * 100.0
		score = int(normalized + 0.5) // округление
	}

	// Обновляем попытку
	now := time.Now()
	attempt.Status = "completed"
	attempt.ResultScore = score
	attempt.CompletedAt = &now

	err = s.attemptRepo.Update(ctx, attempt)
	if err != nil {
		return nil, err
	}

	// Начисляем награду
	level, err := s.levelRepo.GetByID(ctx, attempt.LevelID)
	if err == nil && score >= 70 { // Минимум 70% для получения награды
		rewardAmount := int64(level.RewardPoints)
		err = s.rewardTxRepo.Create(ctx, &domain.RewardTx{
			UserID:    attempt.UserID,
			Amount:    rewardAmount,
			Type:      "earn",
			Reason:    "Level completion reward",
			AttemptID: &attempt.ID,
		})
		if err != nil {
			// Логируем ошибку, но не прерываем выполнение
		}
	}

	// Обновляем streak (огоньки) — не более одного раза в сутки
	if s.userService != nil {
		_ = s.userService.UpdateStreak(ctx, attempt.UserID)
	}

	result := &AttemptResult{
		Attempt:        attempt,
		Score:          score,
		TotalQuestions: totalQuestions,
		CorrectAnswers: correctAnswers,
		WrongQuestions: wrongQuestions,
		Reward: &RewardInfo{
			Diamonds: int64(level.RewardPoints),
			TxID:     0, // Можно добавить ID транзакции
			Reason:   "Level completion reward",
		},
	}

	return result, nil
}

func (s *attemptService) GetActiveAttempt(ctx context.Context, userID, levelID uint) (*domain.Attempt, error) {
	return s.attemptRepo.GetActiveByUserAndLevel(ctx, userID, levelID)
}

func (s *attemptService) GetUserAttempts(ctx context.Context, userID uint) ([]*domain.Attempt, error) {
	return s.attemptRepo.GetByUserID(ctx, userID)
}

// Вспомогательная функция для сравнения массивов ID
func compareChoiceIDs(userChoices, correctChoices []uint) bool {
	if len(userChoices) != len(correctChoices) {
		return false
	}

	// Создаем карты для быстрого поиска
	userMap := make(map[uint]bool)
	for _, id := range userChoices {
		userMap[id] = true
	}

	correctMap := make(map[uint]bool)
	for _, id := range correctChoices {
		correctMap[id] = true
	}

	// Проверяем, что все элементы совпадают
	for id := range userMap {
		if !correctMap[id] {
			return false
		}
	}

	for id := range correctMap {
		if !userMap[id] {
			return false
		}
	}

	return true
}

type rewardService struct {
	rewardTxRepo repo.RewardTxRepo
}

func NewRewardService(rewardTxRepo repo.RewardTxRepo) RewardService {
	return &rewardService{rewardTxRepo: rewardTxRepo}
}

func (s *rewardService) AwardDiamonds(ctx context.Context, userID uint, amount int64, reason string, attemptID *uint) error {
	if amount <= 0 {
		return errors.New("amount must be positive")
	}

	tx := &domain.RewardTx{
		UserID:    userID,
		Amount:    amount,
		Type:      "earn",
		Reason:    reason,
		AttemptID: attemptID,
	}

	return s.rewardTxRepo.Create(ctx, tx)
}

func (s *rewardService) SpendDiamonds(ctx context.Context, userID uint, amount int64, reason string) error {
	if amount <= 0 {
		return errors.New("amount must be positive")
	}

	// Проверяем достаточность средств
	hasEnough, err := s.HasEnoughDiamonds(ctx, userID, amount)
	if err != nil {
		return err
	}
	if !hasEnough {
		return errors.New("insufficient funds")
	}

	tx := &domain.RewardTx{
		UserID:    userID,
		Amount:    -amount, // Отрицательное значение для списания
		Type:      "spend",
		Reason:    reason,
		AttemptID: nil,
	}

	return s.rewardTxRepo.Create(ctx, tx)
}

func (s *rewardService) GetTransactionHistory(ctx context.Context, userID uint) ([]*domain.RewardTx, error) {
	return s.rewardTxRepo.GetByUserID(ctx, userID)
}

func (s *rewardService) HasEnoughDiamonds(ctx context.Context, userID uint, amount int64) (bool, error) {
	balance, err := s.rewardTxRepo.GetBalance(ctx, userID)
	if err != nil {
		return false, err
	}
	return balance >= amount, nil
}

// CancelAttempt устанавливает статус попытки как failed и проставляет CompletedAt
func (s *attemptService) CancelAttempt(ctx context.Context, attemptID uint, userID uint) error {
	attempt, err := s.attemptRepo.GetByID(ctx, attemptID)
	if err != nil {
		return err
	}
	if attempt.UserID != userID {
		return errors.New("forbidden")
	}
	if attempt.Status != domain.AttemptInProgress {
		return nil
	}
	now := time.Now()
	attempt.Status = domain.AttemptFailed
	attempt.CompletedAt = &now
	return s.attemptRepo.Update(ctx, attempt)
}

type achievementService struct {
	achievementRepo repo.AchievementRepo
	userRepo        repo.UserRepo
}

func NewAchievementService(achievementRepo repo.AchievementRepo, userRepo repo.UserRepo) AchievementService {
	return &achievementService{achievementRepo: achievementRepo, userRepo: userRepo}
}

func (s *achievementService) GetAllAchievements(ctx context.Context) ([]*domain.Achievement, error) {
	return s.achievementRepo.GetAll(ctx)
}

func (s *achievementService) GetUserAchievements(ctx context.Context, userID uint) ([]*domain.Achievement, error) {
	return s.achievementRepo.GetByUserID(ctx, userID)
}

func (s *achievementService) CheckAndAwardAchievements(ctx context.Context, userID uint, eventType string, data map[string]interface{}) error {
	// Получаем все достижения
	achievements, err := s.achievementRepo.GetAll(ctx)
	if err != nil {
		return err
	}

	// Простая логика проверки достижений
	for _, achievement := range achievements {
		// Проверяем, есть ли уже у пользователя это достижение
		hasAchievement, err := s.achievementRepo.HasAchievement(ctx, userID, achievement.ID)
		if err != nil {
			continue
		}
		if hasAchievement {
			continue
		}

		// Простые условия для достижений
		shouldAward := false
		switch achievement.Code {
		case "first_steps":
			// Первое прохождение уровня
			if eventType == "level_completed" {
				shouldAward = true
			}
		case "streak_3":
			// 3 дня подряд
			if eventType == "streak_updated" {
				if streak, ok := data["streak"].(int); ok && streak >= 3 {
					shouldAward = true
				}
			}
		case "perfect_score":
			// 100% правильных ответов
			if eventType == "level_completed" {
				if score, ok := data["score"].(int); ok && score == 100 {
					shouldAward = true
				}
			}
		}

		if shouldAward {
			err = s.achievementRepo.AwardToUser(ctx, userID, achievement.ID)
			if err != nil {
				// Логируем ошибку, но продолжаем
				continue
			}
		}
	}

	return nil
}

func (s *achievementService) GetAchievementProgress(ctx context.Context, userID, achievementID uint) (*AchievementProgress, error) {
	// Получаем достижение
	achievement, err := s.achievementRepo.GetByCode(ctx, "first_steps") // Упрощенная логика
	if err != nil {
		return nil, err
	}

	// Проверяем, есть ли у пользователя это достижение
	hasAchievement, err := s.achievementRepo.HasAchievement(ctx, userID, achievementID)
	if err != nil {
		return nil, err
	}

	progress := 0
	maxProgress := 1
	if hasAchievement {
		progress = 1
	}

	return &AchievementProgress{
		Achievement: achievement,
		Progress:    progress,
		MaxProgress: maxProgress,
		IsCompleted: hasAchievement,
	}, nil
}
