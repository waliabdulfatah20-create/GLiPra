-- supabase/migrations/016_daily_guidance.sql
-- One AI-generated nutrition tip per user per day.
-- Rule 7: RLS enabled with user-scoped policy.

CREATE TABLE daily_guidance (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  injection_phase TEXT,
  language        TEXT NOT NULL DEFAULT 'en',
  guidance_text   TEXT NOT NULL,
  reasoning_text  TEXT,
  prompt_version  TEXT DEFAULT 'v1',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_guidance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_guidance"
  ON daily_guidance FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_daily_guidance_user_date
  ON daily_guidance (user_id, date DESC);
