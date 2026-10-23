-- OmniAI PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    model_id VARCHAR(64) NOT NULL,
    pinned BOOLEAN DEFAULT FALSE,
    system_prompt TEXT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL,
    content TEXT NOT NULL,
    model_id VARCHAR(64),
    provider VARCHAR(32),
    timestamp BIGINT NOT NULL,
    metrics JSONB,
    attachments JSONB,
    thinking TEXT
);

CREATE TABLE IF NOT EXISTS prompt_templates (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(64) NOT NULL,
    prompt TEXT NOT NULL,
    model_recommendation VARCHAR(64),
    tags JSONB DEFAULT '[]'::jsonb,
    is_custom BOOLEAN DEFAULT FALSE,
    created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS usage_logs (
    id VARCHAR(64) PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    model_id VARCHAR(64) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cost_usd NUMERIC(10, 6) NOT NULL,
    latency_ms INTEGER NOT NULL,
    success BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS provider_keys (
    provider VARCHAR(32) PRIMARY KEY,
    api_key_masked VARCHAR(64) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_verified BIGINT,
    updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_logs(timestamp DESC);
