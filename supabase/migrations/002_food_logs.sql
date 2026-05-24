-- Migration 002: food_logs table
-- Stores every food entry a user logs (manual, barcode, photo, or voice).

CREATE TABLE IF NOT EXISTS food_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- When the food was consumed (not when the row was created)
  logged_at           TIMESTAMPTZ NOT NULL,
  -- Food data
  name                TEXT NOT NULL,
  serving_description TEXT NOT NULL,
  protein_g           NUMERIC NOT NULL,
  fiber_g             NUMERIC,
  calories_kcal       NUMERIC,
  barcode_ean         TEXT,               -- NULL for manual/photo entries
  source              TEXT NOT NULL DEFAULT 'manual'
                        CHECK (source IN ('manual','barcode','photo','voice')),
  -- Meta
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for the common query: fetch today's logs for a user
CREATE INDEX IF NOT EXISTS idx_food_logs_user_logged_at
  ON food_logs (user_id, logged_at DESC);

-- Row Level Security
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food logs"
  ON food_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food logs"
  ON food_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own food logs"
  ON food_logs FOR DELETE
  USING (auth.uid() = user_id);
