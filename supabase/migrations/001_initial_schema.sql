-- Migration 001: Initial schema — profiles table
-- Core user profile storing onboarding data, medication info, and safety flags.

CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Medication
  medication_id         TEXT NOT NULL DEFAULT 'other',
  dose_mg               NUMERIC,
  injection_day_of_week INTEGER,           -- 0 = Sunday … 6 = Saturday
  last_injection_date   DATE,
  -- Body measurements
  weight_kg             NUMERIC,
  height_cm             NUMERIC,
  bmi                   NUMERIC,
  -- Safety flags
  has_kidney_disease    BOOLEAN NOT NULL DEFAULT FALSE,
  is_pregnant           BOOLEAN NOT NULL DEFAULT FALSE,
  -- Goals / phase
  activity_level        TEXT NOT NULL DEFAULT 'moderate'
                          CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')),
  phase                 TEXT NOT NULL DEFAULT 'weight_loss'
                          CHECK (phase IN ('weight_loss','maintenance')),
  -- Meta
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
