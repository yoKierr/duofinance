-- Сид миграции НЕ ДОБАВЛЯТЬ В ПРОД / MASTER

BEGIN;

-- Demo user
INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
VALUES (1001, 'demo@duo.local', 'demo', '$2a$10$demo_hash', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, user_id, streak, stats, meta, created_at, updated_at)
VALUES (1001, 1001, 3, '{}'::jsonb, '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Level 1: Финансовая безопасность (легкий)
INSERT INTO levels (id, title, topic, difficulty, reward_points, is_active, created_at, updated_at)
VALUES (2001, 'Финансовая безопасность', 'Безопасность', 'easy', 50, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Question for Level 1
INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3001, 'Что из нижеперечисленного относится к финансовой подушке?', 'Резерв на 3-6 месяцев расходов — стандартная рекомендация.', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  (4001, 3001, 'Деньги на отпуск в следующем году', FALSE, 1, NOW(), NOW()),
  (4002, 3001, 'Резерв на 3-6 месяцев расходов', TRUE, 2, NOW(), NOW()),
  (4003, 3001, 'Средства на покупку нового телефона', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Steps for Level 1
INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2101, 2001, 1, 'text', 'Введение', '{"body":"Держите резерв на непредвиденные расходы"}'::jsonb, NULL, NOW(), NOW()),
  (2102, 2001, 2, 'question', 'Проверка знаний', '{}'::jsonb, 3001, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Дополнительные вопросы для Level 1
INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3004, 'Какого размера рекомендуется финансовая подушка?', 'Обычно 3-6 месяцев обязательных расходов.', FALSE, NOW(), NOW()),
  (3005, 'Что НЕ стоит использовать как финансовую подушку?', 'Волатильные активы не подходят для резерва.', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  (4010, 3004, '1-2 недели расходов', FALSE, 1, NOW(), NOW()),
  (4011, 3004, '3-6 месяцев расходов', TRUE, 2, NOW(), NOW()),
  (4012, 3004, '12-18 месяцев расходов', FALSE, 3, NOW(), NOW()),
  (4013, 3005, 'Кэш/депозит', FALSE, 1, NOW(), NOW()),
  (4014, 3005, 'Волатильные криптоактивы', TRUE, 2, NOW(), NOW()),
  (4015, 3005, 'Гособлигации короткой дюрации', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2107, 2001, 3, 'question', 'Размер подушки', '{}'::jsonb, 3004, NOW(), NOW()),
  (2108, 2001, 4, 'question', 'Что не подходит для подушки', '{}'::jsonb, 3005, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Level 2: Противодействие мошенничеству (средний)
INSERT INTO levels (id, title, topic, difficulty, reward_points, is_active, created_at, updated_at)
VALUES (2002, 'Противодействие мошенничеству', 'Безопасность', 'medium', 75, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3002, 'Какой признак характерен для фишингового письма?', 'Обращайте внимание на отправителя и ошибки в тексте.', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  (4004, 3002, 'Подозрительный адрес отправителя', TRUE, 1, NOW(), NOW()),
  (4005, 3002, 'Требование срочно сообщить пароль', TRUE, 2, NOW(), NOW()),
  (4006, 3002, 'Грамотный язык и корректная разметка', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2103, 2002, 1, 'text', 'Советы', '{"body":"Не переходите по подозрительным ссылкам"}'::jsonb, NULL, NOW(), NOW()),
  (2104, 2002, 2, 'question', 'Определите фишинг', '{}'::jsonb, 3002, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Дополнительные вопросы для Level 2
INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3006, 'Какие действия стоит выполнить при подозрении на фишинг?', 'Не отвечайте, проверьте адрес и сообщите в поддержку.', TRUE, NOW(), NOW()),
  (3007, 'Что из ниже перечисленного указывает на мошенничество?', 'Часто используют срочность и угрозы.', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  (4016, 3006, 'Проверить домен отправителя', TRUE, 1, NOW(), NOW()),
  (4017, 3006, 'Перейти по ссылке и ввести данные', FALSE, 2, NOW(), NOW()),
  (4018, 3006, 'Сообщить в поддержку', TRUE, 3, NOW(), NOW()),
  (4019, 3007, 'Наличие контактов и реквизитов', FALSE, 1, NOW(), NOW()),
  (4020, 3007, 'Требование срочно оплатить иначе штраф', TRUE, 2, NOW(), NOW()),
  (4021, 3007, 'Грамотный текст без ошибок', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2109, 2002, 3, 'question', 'Действия при подозрении', '{}'::jsonb, 3006, NOW(), NOW()),
  (2110, 2002, 4, 'question', 'Признаки мошенничества', '{}'::jsonb, 3007, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Level 3: Финансовые цели (легкий)
INSERT INTO levels (id, title, topic, difficulty, reward_points, is_active, created_at, updated_at)
VALUES (2003, 'Финансовые цели', 'Планирование', 'easy', 60, TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3003, 'Какой принцип SMART нарушен в цели "стать богаче"?', 'Цель должна быть конкретной, измеримой, достижимой, релевантной и ограниченной по времени.', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  (4007, 3003, 'Конкретность', TRUE, 1, NOW(), NOW()),
  (4008, 3003, 'Ограниченность во времени', FALSE, 2, NOW(), NOW()),
  (4009, 3003, 'Достижимость', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2105, 2003, 1, 'text', 'Постановка целей', '{"body":"Формулируйте цели по SMART"}'::jsonb, NULL, NOW(), NOW()),
  (2106, 2003, 2, 'question', 'Проверка SMART', '{}'::jsonb, 3003, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Дополнительные вопросы для Level 3
INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3008, 'Какая формулировка цели корректна по SMART?', 'Цель должна быть измеримой и со сроком.', FALSE, NOW(), NOW()),
  (3009, 'Какие элементы входят в SMART?', 'Specific, Measurable, Achievable, Relevant, Time-bound.', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  (4022, 3008, 'Накопить как можно больше денег', FALSE, 1, NOW(), NOW()),
  (4023, 3008, 'Накопить 200 000 ₽ за 12 месяцев', TRUE, 2, NOW(), NOW()),
  (4024, 3008, 'Стать богатым', FALSE, 3, NOW(), NOW()),
  (4025, 3009, 'Specific, Massive, Active, Realistic, Time-bound', FALSE, 1, NOW(), NOW()),
  (4026, 3009, 'Specific, Measurable, Achievable, Relevant, Time-bound', TRUE, 2, NOW(), NOW()),
  (4027, 3009, 'Super, Mega, Accurate, Rapid, Timely', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2111, 2003, 3, 'question', 'Формулировка цели', '{}'::jsonb, 3008, NOW(), NOW()),
  (2112, 2003, 4, 'question', 'Элементы SMART', '{}'::jsonb, 3009, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Дополнительные вопросы для Level 1 (Финансовая безопасность) - еще 3 вопроса
INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3010, 'Что такое кредитная история?', 'Кредитная история - это информация о ваших кредитных обязательствах и их исполнении.', FALSE, NOW(), NOW()),
  (3011, 'Какие документы НЕ стоит передавать незнакомцам?', 'Паспорт, банковские карты и PIN-коды - конфиденциальная информация.', TRUE, NOW(), NOW()),
  (3012, 'Что делать при утере банковской карты?', 'Немедленно заблокировать карту через банк или мобильное приложение.', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  -- Вопрос 3010
  (4028, 3010, 'Список всех ваших покупок', FALSE, 1, NOW(), NOW()),
  (4029, 3010, 'Информация о ваших кредитах и платежах', TRUE, 2, NOW(), NOW()),
  (4030, 3010, 'История банковских переводов', FALSE, 3, NOW(), NOW()),
  -- Вопрос 3011
  (4031, 3011, 'Паспортные данные', TRUE, 1, NOW(), NOW()),
  (4032, 3011, 'Номер банковской карты', TRUE, 2, NOW(), NOW()),
  (4033, 3011, 'Номер телефона', FALSE, 3, NOW(), NOW()),
  -- Вопрос 3012
  (4034, 3012, 'Подождать и поискать дома', FALSE, 1, NOW(), NOW()),
  (4035, 3012, 'Немедленно заблокировать карту', TRUE, 2, NOW(), NOW()),
  (4036, 3012, 'Сообщить только на следующий день', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2113, 2001, 5, 'question', 'Кредитная история', '{}'::jsonb, 3010, NOW(), NOW()),
  (2114, 2001, 6, 'question', 'Защита документов', '{}'::jsonb, 3011, NOW(), NOW()),
  (2115, 2001, 7, 'question', 'Утеря карты', '{}'::jsonb, 3012, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Дополнительные вопросы для Level 2 (Противодействие мошенничеству) - еще 4 вопроса
INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3013, 'Какой признак указывает на мошенничество в интернете?', 'Слишком выгодные предложения и требование предоплаты - красные флаги.', TRUE, NOW(), NOW()),
  (3014, 'Что делать при получении подозрительного SMS?', 'Не переходить по ссылкам и не вводить данные в подозрительных формах.', FALSE, NOW(), NOW()),
  (3015, 'Как проверить подлинность сайта банка?', 'Проверить SSL-сертификат и адресную строку на наличие замка.', TRUE, NOW(), NOW()),
  (3016, 'Что такое социальная инженерия?', 'Метод получения информации через манипуляции с людьми.', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  -- Вопрос 3013
  (4037, 3013, 'Требование предоплаты', TRUE, 1, NOW(), NOW()),
  (4038, 3013, 'Слишком выгодные условия', TRUE, 2, NOW(), NOW()),
  (4039, 3013, 'Официальный сайт компании', FALSE, 3, NOW(), NOW()),
  -- Вопрос 3014
  (4040, 3014, 'Перейти по ссылке и проверить', FALSE, 1, NOW(), NOW()),
  (4041, 3014, 'Игнорировать и удалить SMS', TRUE, 2, NOW(), NOW()),
  (4042, 3014, 'Позвонить по указанному номеру', FALSE, 3, NOW(), NOW()),
  -- Вопрос 3015
  (4043, 3015, 'Проверить SSL-сертификат', TRUE, 1, NOW(), NOW()),
  (4044, 3015, 'Посмотреть на дизайн сайта', FALSE, 2, NOW(), NOW()),
  (4045, 3015, 'Проверить адресную строку', TRUE, 3, NOW(), NOW()),
  -- Вопрос 3016
  (4046, 3016, 'Взлом компьютерных систем', FALSE, 1, NOW(), NOW()),
  (4047, 3016, 'Манипуляции с людьми для получения информации', TRUE, 2, NOW(), NOW()),
  (4048, 3016, 'Создание фальшивых документов', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2116, 2002, 5, 'question', 'Признаки мошенничества', '{}'::jsonb, 3013, NOW(), NOW()),
  (2117, 2002, 6, 'question', 'Подозрительные SMS', '{}'::jsonb, 3014, NOW(), NOW()),
  (2118, 2002, 7, 'question', 'Проверка сайта банка', '{}'::jsonb, 3015, NOW(), NOW()),
  (2119, 2002, 8, 'question', 'Социальная инженерия', '{}'::jsonb, 3016, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Дополнительные вопросы для Level 3 (Финансовые цели) - еще 3 вопроса
INSERT INTO questions (id, prompt, explanation, multi_select, created_at, updated_at)
VALUES
  (3017, 'Что такое инвестиционный портфель?', 'Набор различных инвестиций для диверсификации рисков.', FALSE, NOW(), NOW()),
  (3018, 'Какие факторы влияют на выбор инвестиций?', 'Риск, доходность, временной горизонт и личные цели.', TRUE, NOW(), NOW()),
  (3019, 'Что такое диверсификация?', 'Распределение инвестиций по разным активам для снижения рисков.', FALSE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO choices (id, question_id, text, is_correct, "order", created_at, updated_at)
VALUES
  -- Вопрос 3017
  (4049, 3017, 'Один вид инвестиций', FALSE, 1, NOW(), NOW()),
  (4050, 3017, 'Набор различных инвестиций', TRUE, 2, NOW(), NOW()),
  (4051, 3017, 'Только акции', FALSE, 3, NOW(), NOW()),
  -- Вопрос 3018
  (4052, 3018, 'Уровень риска', TRUE, 1, NOW(), NOW()),
  (4053, 3018, 'Ожидаемая доходность', TRUE, 2, NOW(), NOW()),
  (4054, 3018, 'Временной горизонт', TRUE, 3, NOW(), NOW()),
  -- Вопрос 3019
  (4055, 3019, 'Покупка только одного актива', FALSE, 1, NOW(), NOW()),
  (4056, 3019, 'Распределение по разным активам', TRUE, 2, NOW(), NOW()),
  (4057, 3019, 'Инвестирование в криптовалюты', FALSE, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO level_steps (id, level_id, "order", type, title, payload, question_id, created_at, updated_at)
VALUES
  (2120, 2003, 5, 'question', 'Инвестиционный портфель', '{}'::jsonb, 3017, NOW(), NOW()),
  (2121, 2003, 6, 'question', 'Факторы инвестиций', '{}'::jsonb, 3018, NOW(), NOW()),
  (2122, 2003, 7, 'question', 'Диверсификация', '{}'::jsonb, 3019, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test achievements
INSERT INTO achievements (id, code, name, description, icon, points, created_at, updated_at)
VALUES
  (5001, 'first_steps', 'Первые шаги', 'Пройдите свой первый уровень', '🎯', 25, NOW(), NOW()),
  (5002, 'streak_3', 'Стабильность', 'Играйте 3 дня подряд', '🔥', 50, NOW(), NOW()),
  (5003, 'security_expert', 'Эксперт безопасности', 'Пройдите все уровни по финансовой безопасности', '🛡️', 100, NOW(), NOW()),
  (5004, 'perfect_score', 'Идеальный результат', 'Получите 100% правильных ответов в уровне', '💯', 75, NOW(), NOW()),
  (5005, 'quick_learner', 'Быстрый ученик', 'Пройдите уровень менее чем за 2 минуты', '⚡', 60, NOW(), NOW()),
  (5006, 'dedication', 'Преданность', 'Пройдите 5 уровней подряд', '🏆', 150, NOW(), NOW()),
  (5007, 'smart_goals', 'Умные цели', 'Пройдите уровень по постановке целей', '🎯', 40, NOW(), NOW()),
  (5008, 'anti_phishing', 'Против фишинга', 'Пройдите уровень по противодействию мошенничеству', '🚫', 65, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Assign some achievements to demo user
INSERT INTO user_achievements (id, user_id, achievement_id, awarded_at, created_at, updated_at)
VALUES
  (6001, 1001, 5001, NOW() - INTERVAL '2 days', NOW(), NOW()),
  (6002, 1001, 5007, NOW() - INTERVAL '1 day', NOW(), NOW()),
  (6003, 1001, 5004, NOW() - INTERVAL '6 hours', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Test reward transactions for demo user
INSERT INTO reward_txs (id, user_id, amount, type, reason, attempt_id, created_at, updated_at)
VALUES
  -- Начисления за прохождение уровней
  (7001, 1001, 50, 'earn', 'Прохождение уровня "Финансовая безопасность"', NULL, NOW() - INTERVAL '3 days', NOW()),
  (7002, 1001, 75, 'earn', 'Прохождение уровня "Противодействие мошенничеству"', NULL, NOW() - INTERVAL '2 days', NOW()),
  (7003, 1001, 60, 'earn', 'Прохождение уровня "Финансовые цели"', NULL, NOW() - INTERVAL '1 day', NOW()),
  
  -- Бонусы за достижения
  (7004, 1001, 25, 'bonus', 'Достижение "Первые шаги"', NULL, NOW() - INTERVAL '2 days', NOW()),
  (7005, 1001, 40, 'bonus', 'Достижение "Умные цели"', NULL, NOW() - INTERVAL '1 day', NOW()),
  (7006, 1001, 75, 'bonus', 'Достижение "Идеальный результат"', NULL, NOW() - INTERVAL '6 hours', NOW()),
  
  -- Бонусы за streak
  (7007, 1001, 10, 'streak_bonus', 'Бонус за ежедневную игру', NULL, NOW() - INTERVAL '2 days', NOW()),
  (7008, 1001, 15, 'streak_bonus', 'Бонус за ежедневную игру', NULL, NOW() - INTERVAL '1 day', NOW()),
  
  -- Траты на подсказки и бонусы
  (7009, 1001, -20, 'spend', 'Покупка подсказки', NULL, NOW() - INTERVAL '1 day', NOW()),
  (7010, 1001, -30, 'spend', 'Покупка дополнительной попытки', NULL, NOW() - INTERVAL '12 hours', NOW()),
  (7011, 1001, -15, 'spend', 'Покупка подсказки', NULL, NOW() - INTERVAL '4 hours', NOW()),
  
  -- Стартовый бонус (приветственный)
  (7012, 1001, 100, 'welcome_bonus', 'Добро пожаловать в DuoFinance!', NULL, NOW() - INTERVAL '4 days', NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;


