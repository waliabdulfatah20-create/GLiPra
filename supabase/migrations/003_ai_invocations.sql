-- Migration 003: ai_invocations table
-- Tracks every OpenAI API call for rate limiting and cost auditing.
-- Rate limit logic: count rows per user per function per rolling 24-hour window.

CREATE TABLE IF NOT EXISTS ai_invocations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,          -- e.g. 'recognize-food', 'ai-coach'
  model         TEXT NOT NULL,          -- e.g. 'gpt-4o', 'gpt-4o-mini'
  tokens_used   INTEGER,                -- null if provider does not return usage
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the rolling-window rate-limit query:
-- WHERE user_id = $1 AND function_name = $2 AND created_at > NOW() - INTERVAL '1 day'
CREATE INDEX IF NOT EXISTS ai_invocations_user_fn_created
  ON ai_invocations (user_id, function_name, created_at DESC);

-- Row Level Security: users can only see their own rows.
ALTER TABLE ai_invocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_invocations"
  ON ai_invocations FOR SELECT
  USING (auth.uid() = user_id);

-- Edge functions insert via the service-role key (bypasses RLS),
-- so no INSERT policy is needed for the anon/authenticated roles.
