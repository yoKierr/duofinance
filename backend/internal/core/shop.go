package core

import (
	"context"
	"errors"
	"fmt"

	"github.com/ImCtyz/duofinance/backend/internal/domain"
)

var (
	ErrShopItemNotFound       = errors.New("shop item not found")
	ErrAchievementOwned       = errors.New("achievement already owned")
	ErrInsufficientDiamonds   = errors.New("insufficient diamonds")
)

// ShopItem — товар в магазине.
type ShopItem struct {
	ID          uint   `json:"id"`
	Code        string `json:"code"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Price       int    `json:"price"`
	Owned       bool   `json:"owned"`
}

// ShopPurchaseResult — результат покупки.
type ShopPurchaseResult struct {
	AchievementID uint  `json:"achievement_id"`
	Balance       int64 `json:"balance"`
}

func (s *achievementService) GetShopItemsForUser(ctx context.Context, userID uint) ([]*ShopItem, error) {
	items, err := s.achievementRepo.GetShopItems(ctx)
	if err != nil {
		return nil, err
	}

	out := make([]*ShopItem, 0, len(items))
	for _, a := range items {
		owned, err := s.achievementRepo.HasAchievement(ctx, userID, a.ID)
		if err != nil {
			return nil, err
		}
		out = append(out, &ShopItem{
			ID:          a.ID,
			Code:        a.Code,
			Name:        a.Name,
			Description: a.Description,
			Icon:        a.Icon,
			Price:       a.ShopPrice,
			Owned:       owned,
		})
	}
	return out, nil
}

func (s *achievementService) PurchaseShopItem(ctx context.Context, userID, achievementID uint) (*ShopPurchaseResult, error) {
	achievement, err := s.achievementRepo.GetByID(ctx, achievementID)
	if err != nil || achievement.ShopPrice <= 0 {
		return nil, ErrShopItemNotFound
	}

	owned, err := s.achievementRepo.HasAchievement(ctx, userID, achievement.ID)
	if err != nil {
		return nil, err
	}
	if owned {
		return nil, ErrAchievementOwned
	}

	price := int64(achievement.ShopPrice)
	balance, err := s.rewardTxRepo.GetBalance(ctx, userID)
	if err != nil {
		return nil, err
	}
	if balance < price {
		return nil, ErrInsufficientDiamonds
	}

	spend := &domain.RewardTx{
		UserID: userID,
		Amount: -price,
		Type:   "spend",
		Reason: fmt.Sprintf("Магазин: %s", achievement.Name),
	}
	if err := s.rewardTxRepo.Create(ctx, spend); err != nil {
		return nil, err
	}
	if err := s.achievementRepo.AwardToUser(ctx, userID, achievement.ID); err != nil {
		return nil, err
	}

	newBalance, err := s.rewardTxRepo.GetBalance(ctx, userID)
	if err != nil {
		return nil, err
	}

	return &ShopPurchaseResult{
		AchievementID: achievement.ID,
		Balance:       newBalance,
	}, nil
}
