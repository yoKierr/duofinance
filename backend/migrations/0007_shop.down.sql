DELETE FROM user_achievements WHERE achievement_id = 5030;
DELETE FROM achievements WHERE id = 5030;
ALTER TABLE achievements DROP COLUMN IF EXISTS shop_price;
