-- ============================================================================
-- Notes App — PostgreSQL Schema
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive email

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE user_status AS ENUM ('active', 'deactivated');
CREATE TYPE verification_token_type AS ENUM ('email_verification', 'password_reset');

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name               VARCHAR(255) NOT NULL,
    email              CITEXT NOT NULL UNIQUE,
    password_hash      TEXT NOT NULL,
    is_email_verified  BOOLEAN NOT NULL DEFAULT false,
    status             user_status NOT NULL DEFAULT 'active',
    deactivated_at     TIMESTAMPTZ,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_users_name_not_blank CHECK (btrim(name) <> '')
);

-- ---------------------------------------------------------------------------
-- notes
-- ---------------------------------------------------------------------------
CREATE TABLE notes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(255) NOT NULL DEFAULT '',
    content        JSONB NOT NULL DEFAULT '{}'::jsonb,   -- raw rich-text editor state
    content_text   TEXT NOT NULL DEFAULT '',              -- plain-text extraction, maintained by app layer
    search_vector  TSVECTOR GENERATED ALWAYS AS (
                       setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                       setweight(to_tsvector('english', coalesce(content_text, '')), 'B')
                   ) STORED,
    deleted_at     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- refresh_tokens  (makes "log out" a real, revocable server-side action)
-- ---------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT NOT NULL UNIQUE,     -- store a hash, never the raw token
    user_agent  TEXT,
    ip_address  INET,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- verification_tokens  (email verification + password reset, gap-driven — see doc §10)
-- ---------------------------------------------------------------------------
CREATE TABLE verification_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL UNIQUE,
    type         verification_token_type NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    consumed_at  TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger (guaranteed correct regardless of what updates the row)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Dashboard's core query: "this user's active notes, newest first"
CREATE INDEX idx_notes_user_created
    ON notes (user_id, created_at DESC, id)
    WHERE deleted_at IS NULL;

-- Full-text search / filter
CREATE INDEX idx_notes_search
    ON notes USING GIN (search_vector);

-- Cheap scan target for the soft-delete retention/purge job
CREATE INDEX idx_notes_deleted_at
    ON notes (deleted_at)
    WHERE deleted_at IS NOT NULL;

-- Active-session lookups (logout / "log out everywhere")
CREATE INDEX idx_refresh_tokens_user_active
    ON refresh_tokens (user_id)
    WHERE revoked_at IS NULL;

-- Pending verification/reset link lookups
CREATE INDEX idx_verification_tokens_user_type
    ON verification_tokens (user_id, type)
    WHERE consumed_at IS NULL;