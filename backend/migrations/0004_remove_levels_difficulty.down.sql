BEGIN;

ALTER TABLE levels ADD COLUMN IF NOT EXISTS difficulty VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_levels_difficulty ON levels(difficulty);

COMMIT;
