-- Migration 007: streaks table
-- One row per user. Upserted each time protein logs are processed.
-- STREAK_THRESHOLD = 0.80 (80% of protein floor = streak day, enforced client-side).

CREATE TABLE IF NOT EXISTS streaks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak    INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak    INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_streak_date  DATE,                 -- Most recent date that counted as a streak day
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks (user_id);

-- Row Level Security
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
