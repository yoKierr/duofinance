BEGIN;

DROP INDEX IF EXISTS idx_levels_difficulty;

ALTER TABLE levels DROP COLUMN IF EXISTS difficulty;

COMMIT;
