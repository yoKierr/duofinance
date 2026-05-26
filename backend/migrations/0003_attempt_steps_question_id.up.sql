-- Add question_id to attempt_steps to match domain model
BEGIN;

ALTER TABLE attempt_steps
  ADD COLUMN IF NOT EXISTS question_id BIGINT;

-- Add FK to questions (nullable, set null on delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_attempt_steps_question' 
      AND table_name = 'attempt_steps'
  ) THEN
    ALTER TABLE attempt_steps
      ADD CONSTRAINT fk_attempt_steps_question
      FOREIGN KEY (question_id) REFERENCES questions(id)
      ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attempt_steps_question ON attempt_steps(question_id);

COMMIT;


