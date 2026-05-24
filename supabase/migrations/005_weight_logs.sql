-- Migration 005: weight_logs table
-- Stores user weight entries with EWMA smoothed value.
-- EWMA_ALPHA = 0.1 (computed client-side before insert).

CREATE TABLE IF NOT EXISTS weight_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg       NUMERIC NOT NULL,
  ewma_weight_kg  NUMERIC,               -- Exponentially weighted moving average
  notes           TEXT,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for chronological weight history queries
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_logged_at
  ON weight_logs (user_id, logged_at ASC);

-- Row Level Security
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weight logs"
  ON weight_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight logs"
  ON weight_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight logs"
  ON weight_logs FOR DELETE
  USING (auth.uid() = user_id);
