BEGIN;

UPDATE level_steps SET question_id = 9111, title = 'Вопрос 1' WHERE id = 88030;
UPDATE level_steps SET question_id = 9112, title = 'Вопрос 2' WHERE id = 88031;
UPDATE level_steps SET question_id = 9113, title = 'Вопрос 3' WHERE id = 88032;

UPDATE level_steps SET question_id = 9121, title = 'Вопрос 1' WHERE id = 88040;
UPDATE level_steps SET question_id = 9122, title = 'Вопрос 2' WHERE id = 88041;
UPDATE level_steps SET question_id = 9123, title = 'Вопрос 3' WHERE id = 88042;

DELETE FROM choices WHERE id BETWEEN 92101 AND 92118;
DELETE FROM questions WHERE id BETWEEN 9151 AND 9156;

COMMIT;
