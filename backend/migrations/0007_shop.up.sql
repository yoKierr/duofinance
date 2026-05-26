-- Товары магазина: достижения, покупаемые за алмазы

ALTER TABLE achievements ADD COLUMN IF NOT EXISTS shop_price INTEGER NOT NULL DEFAULT 0;

INSERT INTO achievements (id, code, name, description, icon, points, shop_price, created_at, updated_at)
VALUES (
  5030,
  'shop_patron',
  'Покровитель Finstart',
  'Эксклюзивное достижение из магазина. Поддержите проект и украсьте профиль.',
  '👑',
  0,
  500,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  shop_price = EXCLUDED.shop_price,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;
