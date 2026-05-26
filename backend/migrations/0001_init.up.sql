-- Schema: initial structure matching GORM models
-- Users
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Profiles (1:1 users)
CREATE TABLE IF NOT EXISTS profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    streak INTEGER NOT NULL DEFAULT 0,
    stats JSONB,
    meta JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_profiles_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- Levels
CREATE TABLE IF NOT EXISTS levels (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255),
    difficulty VARCHAR(50),
    reward_points INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_levels_difficulty ON levels(difficulty);
CREATE INDEX IF NOT EXISTS idx_levels_is_active ON levels(is_active);

-- Questions
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    prompt TEXT NOT NULL,
    explanation TEXT,
    multi_select BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Level steps
CREATE TABLE IF NOT EXISTS level_steps (
    id BIGSERIAL PRIMARY KEY,
    level_id BIGINT NOT NULL,
    "order" INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    payload JSONB,
    question_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_level_steps_level
        FOREIGN KEY (level_id) REFERENCES levels(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_level_steps_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT uq_level_step_order UNIQUE (level_id, "order")
);
CREATE INDEX IF NOT EXISTS idx_level_steps_type ON level_steps(type);

-- Choices
CREATE TABLE IF NOT EXISTS choices (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_choices_question
        FOREIGN KEY (question_id) REFERENCES questions(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_choices_question ON choices(question_id);

-- Attempts
CREATE TABLE IF NOT EXISTS attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    level_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    result_score INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_attempts_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_attempts_level
        FOREIGN KEY (level_id) REFERENCES levels(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_level ON attempts(level_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON attempts(status);

-- Attempt steps
CREATE TABLE IF NOT EXISTS attempt_steps (
    id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL,
    level_step_id BIGINT NOT NULL,
    step_order INTEGER NOT NULL,
    response JSONB,
    correct BOOLEAN NOT NULL DEFAULT FALSE,
    duration_ms BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_attempt_steps_attempt
        FOREIGN KEY (attempt_id) REFERENCES attempts(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_attempt_steps_level_step
        FOREIGN KEY (level_step_id) REFERENCES level_steps(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_attempt_steps_attempt ON attempt_steps(attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_steps_step_order ON attempt_steps(step_order);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- UserAchievements bridge
CREATE TABLE IF NOT EXISTS user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    awarded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_user_achievements_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_user_achievements_achievement
        FOREIGN KEY (achievement_id) REFERENCES achievements(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

-- Reward transactions
CREATE TABLE IF NOT EXISTS reward_txs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    amount BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reason VARCHAR(255),
    attempt_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_reward_txs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_reward_txs_attempt
        FOREIGN KEY (attempt_id) REFERENCES attempts(id)
        ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_reward_txs_user ON reward_txs(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_txs_type ON reward_txs(type);

-- Hints
CREATE TABLE IF NOT EXISTS hints (
    id BIGSERIAL PRIMARY KEY,
    created_by_user_id BIGINT,
    level_id BIGINT,
    level_step_id BIGINT,
    text TEXT NOT NULL,
    cost INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_hints_user
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_hints_level
        FOREIGN KEY (level_id) REFERENCES levels(id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_hints_level_step
        FOREIGN KEY (level_step_id) REFERENCES level_steps(id)
        ON UPDATE CASCADE ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_hints_active ON hints(is_active);

-- Reminders
CREATE TABLE IF NOT EXISTS reminders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    send_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT fk_reminders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_type ON reminders(type);
CREATE INDEX IF NOT EXISTS idx_reminders_send_at ON reminders(send_at);


