-- Migration 004: daily_checkins table
-- Stores daily symptom + wellness check-ins.
-- nausea and energy feed directly into the readiness score calculator.

CREATE TABLE IF NOT EXISTS daily_checkins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Symptom scores (1 = best, 5 = worst for nausea; 1 = worst, 5 = best for energy)
  nausea              INTEGER NOT NULL CHECK (nausea BETWEEN 1 AND 5),
  energy              INTEGER NOT NULL CHECK (energy BETWEEN 1 AND 5),
  water_ml            INTEGER NOT NULL DEFAULT 0 CHECK (water_ml >= 0),
  notes               TEXT,
  -- Red-flag escalation tracking
  red_flag_triggered  BOOLEAN NOT NULL DEFAULT FALSE,
  -- When the check-in was submitted
  checked_in_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fetching today's check-in and history queries
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_checked_at
  ON daily_checkins (user_id, checked_in_at DESC);

-- Row Level Security
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own check-ins"
  ON daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own check-ins"
  ON daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);
