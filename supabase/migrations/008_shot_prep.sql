-- Migration 008: shot_prep_logs table
-- Tracks when a user completes the Shot Day Prep Checklist.
-- Used for streak calculations and injection cycle tracking.

CREATE TABLE IF NOT EXISTS shot_prep_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The injection date this checklist was completed for
  injection_date  DATE NOT NULL,
  -- Checklist completion state (stored as JSON for flexibility)
  completed_items JSONB NOT NULL DEFAULT '[]',
  -- Whether all items were completed
  fully_completed BOOLEAN NOT NULL DEFAULT FALSE,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, injection_date)
);

CREATE INDEX IF NOT EXISTS idx_shot_prep_logs_user_date
  ON shot_prep_logs (user_id, injection_date DESC);

-- Row Level Security
ALTER TABLE shot_prep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shot prep logs"
  ON shot_prep_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shot prep logs"
  ON shot_prep_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shot prep logs"
  ON shot_prep_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
