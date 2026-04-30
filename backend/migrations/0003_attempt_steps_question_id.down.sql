-- Revert question_id addition from attempt_steps
BEGIN;

ALTER TABLE attempt_steps DROP CONSTRAINT IF EXISTS fk_attempt_steps_question;
ALTER TABLE attempt_steps DROP COLUMN IF EXISTS question_id;

COMMIT;


