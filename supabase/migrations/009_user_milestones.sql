-- Migration: 009_user_milestones
-- Journey Cards — tracks which milestone badges each user has earned.

CREATE TABLE IF NOT EXISTS user_milestones (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_id text        NOT NULL,
  unlocked_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, milestone_id)
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_user_milestones_user_id
  ON user_milestones (user_id);

ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own milestone rows
CREATE POLICY "users_own_milestones" ON user_milestones
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
