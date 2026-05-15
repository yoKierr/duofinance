package core

import (
	"context"
	"time"

	"github.com/ImCtyz/duofinance/backend/internal/domain"
)

const finLitLevelMin uint = 1851
const finLitLevelMax uint = 1860

// AchievementCatalogItem — достижение с прогрессом для каталога.
type AchievementCatalogItem struct {
	ID          uint       `json:"id"`
	Code        string     `json:"code"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Icon        string     `json:"icon"`
	Points      int        `json:"points"`
	Unlocked    bool       `json:"unlocked"`
	AwardedAt   *time.Time `json:"awarded_at,omitempty"`
	Progress    int        `json:"progress"`
	MaxProgress int        `json:"max_progress"`
}

type userAchievementStats struct {
	CompletedLevels int
	FinLitCompleted int
	PerfectLevels   int
	Streak          int
	Diamonds        int64
}

func (s *achievementService) collectUserStats(ctx context.Context, userID uint) (*userAchievementStats, error) {
	stats := &userAchievementStats{}

	profile, err := s.userRepo.GetProfile(ctx, userID)
	if err == nil && profile != nil {
		stats.Streak = profile.Streak
	}

	balance, err := s.rewardTxRepo.GetBalance(ctx, userID)
	if err == nil {
		stats.Diamonds = balance
	}

	attempts, err := s.attemptRepo.GetByUserID(ctx, userID)
	if err != nil {
		return stats, err
	}

	completed := make(map[uint]bool)
	perfect := make(map[uint]bool)
	finLit := 0

	for _, a := range attempts {
		if a.Status != domain.AttemptCompleted || a.ResultScore < 70 {
			continue
		}
		if !completed[a.LevelID] {
			completed[a.LevelID] = true
			if a.LevelID >= finLitLevelMin && a.LevelID <= finLitLevelMax {
				finLit++
			}
		}
		if a.ResultScore == 100 {
			perfect[a.LevelID] = true
		}
	}

	stats.CompletedLevels = len(completed)
	stats.FinLitCompleted = finLit
	stats.PerfectLevels = len(perfect)
	return stats, nil
}

func achievementMaxProgress(code string) int {
	switch code {
	case "first_steps", "perfect_score", "quick_learner", "basics_intro", "lesson_antifraud", "first_perfect":
		return 1
	case "lessons_3", "streak_3":
		return 3
	case "lessons_5", "perfect_3":
		return 5
	case "streak_7":
		return 7
	case "lessons_10", "basics_master":
		return 10
	case "streak_14":
		return 14
	case "perfect_5":
		return 5
	case "diamonds_100":
		return 100
	case "diamonds_500":
		return 500
	case "security_expert":
		return 10
	case "dedication":
		return 5
	case "smart_goals", "anti_phishing":
		return 1
	default:
		return 1
	}
}

func achievementProgress(code string, st *userAchievementStats) int {
	if st == nil {
		return 0
	}
	switch code {
	case "first_steps":
		return min(st.CompletedLevels, 1)
	case "lessons_3":
		return min(st.CompletedLevels, 3)
	case "lessons_5":
		return min(st.CompletedLevels, 5)
	case "lessons_10":
		return min(st.CompletedLevels, 10)
	case "streak_3":
		return min(st.Streak, 3)
	case "streak_7":
		return min(st.Streak, 7)
	case "streak_14":
		return min(st.Streak, 14)
	case "perfect_score", "first_perfect":
		if st.PerfectLevels > 0 {
			return 1
		}
		return 0
	case "perfect_3":
		return min(st.PerfectLevels, 3)
	case "perfect_5":
		return min(st.PerfectLevels, 5)
	case "diamonds_100":
		return min(int(st.Diamonds), 100)
	case "diamonds_500":
		return min(int(st.Diamonds), 500)
	case "basics_intro":
		if st.FinLitCompleted > 0 {
			return 1
		}
		return 0
	case "basics_master":
		return min(st.FinLitCompleted, 10)
	case "lesson_antifraud", "anti_phishing":
		return 0
	case "security_expert":
		return min(st.FinLitCompleted, 10)
	case "dedication":
		return min(st.CompletedLevels, 5)
	case "smart_goals":
		return 0
	default:
		return 0
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func (s *achievementService) shouldAward(code string, st *userAchievementStats, eventType string, data map[string]interface{}) bool {
	if st == nil {
		return false
	}
	max := achievementMaxProgress(code)
	progress := achievementProgress(code, st)

	switch code {
	case "quick_learner":
		if eventType != "level_completed" {
			return false
		}
		durationMs, _ := data["duration_ms"].(int64)
		if durationMs == 0 {
			if v, ok := data["duration_ms"].(int); ok {
				durationMs = int64(v)
			}
		}
		return durationMs > 0 && durationMs < 120_000
	case "perfect_score":
		if eventType != "level_completed" {
			return false
		}
		score, _ := data["score"].(int)
		return score == 100
	case "first_perfect":
		return eventType == "level_completed" && progress >= 1
	case "basics_intro", "smart_goals":
		if eventType == "level_completed" {
			levelID, _ := data["level_id"].(uint)
			if levelID == 0 {
				if v, ok := data["level_id"].(int); ok {
					levelID = uint(v)
				}
			}
			return levelID == 1851
		}
		return progress >= 1
	case "lesson_antifraud", "anti_phishing":
		if eventType == "level_completed" {
			levelID, _ := data["level_id"].(uint)
			if levelID == 0 {
				if v, ok := data["level_id"].(int); ok {
					levelID = uint(v)
				}
			}
			return levelID == 1860
		}
		return false
	case "security_expert", "basics_master":
		return progress >= max
	case "dedication", "lessons_5":
		return progress >= max
	case "streak_3", "streak_7", "streak_14":
		if eventType == "streak_updated" {
			streak, _ := data["streak"].(int)
			return streak >= max
		}
		return progress >= max
	default:
		return progress >= max
	}
}

func (s *achievementService) GetCatalogForUser(ctx context.Context, userID uint) ([]*AchievementCatalogItem, error) {
	_ = s.CheckAndAwardAchievements(ctx, userID, "sync", nil)

	achievements, err := s.achievementRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	awardedAt, err := s.achievementRepo.ListAwardedAtByUser(ctx, userID)
	if err != nil {
		return nil, err
	}

	st, err := s.collectUserStats(ctx, userID)
	if err != nil {
		return nil, err
	}

	has1851, has1860 := false, false
	attempts, _ := s.attemptRepo.GetByUserID(ctx, userID)
	for _, a := range attempts {
		if a.Status != domain.AttemptCompleted || a.ResultScore < 70 {
			continue
		}
		if a.LevelID == 1851 {
			has1851 = true
		}
		if a.LevelID == 1860 {
			has1860 = true
		}
	}

	out := make([]*AchievementCatalogItem, 0, len(achievements))
	for _, a := range achievements {
		if a.ShopPrice > 0 {
			if _, ok := awardedAt[a.ID]; !ok {
				continue
			}
		}

		max := achievementMaxProgress(a.Code)
		progress := achievementProgress(a.Code, st)
		if (a.Code == "lesson_antifraud" || a.Code == "anti_phishing") && has1860 {
			progress = 1
		}
		if (a.Code == "basics_intro" || a.Code == "smart_goals") && has1851 {
			progress = 1
		}

		item := &AchievementCatalogItem{
			ID:          a.ID,
			Code:        a.Code,
			Name:        a.Name,
			Description: a.Description,
			Icon:        a.Icon,
			Points:      a.Points,
			MaxProgress: max,
			Progress:    progress,
		}
		if t, ok := awardedAt[a.ID]; ok {
			item.Unlocked = true
			ts := t
			item.AwardedAt = &ts
			item.Progress = max
		}
		out = append(out, item)
	}
	return out, nil
}
