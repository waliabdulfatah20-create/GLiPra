-- Migration 012: Expand food_logs with full macro + GLP-1 micronutrient columns.
-- Also adds two new tables for AI personalization:
--   food_corrections  — stores user edits to AI-identified food names
--   user_food_defaults — stores confirmed portion values per food name per user

-- ---------------------------------------------------------------------------
-- 1. Expand food_logs with missing macros + GLP-1 relevant micronutrients
-- ---------------------------------------------------------------------------

ALTER TABLE food_logs
  ADD COLUMN carbs_g      NUMERIC,   -- carbohydrates in grams
  ADD COLUMN fat_g        NUMERIC,   -- fat in grams
  ADD COLUMN b12_mcg      NUMERIC,   -- vitamin B-12 in micrograms (estimated by AI)
  ADD COLUMN vitamin_d_iu NUMERIC,   -- vitamin D in IU (estimated by AI)
  ADD COLUMN magnesium_mg NUMERIC,   -- magnesium in milligrams (estimated by AI)
  ADD COLUMN zinc_mg      NUMERIC;   -- zinc in milligrams (estimated by AI)

-- ---------------------------------------------------------------------------
-- 2. food_corrections — AI correction history for personalized identification
-- ---------------------------------------------------------------------------
-- When the user changes the AI-identified food name in the review sheet,
-- the original + corrected names are stored here. The edge function fetches
-- the last 10 corrections and includes them as anonymous context in future
-- GPT-4o prompts to improve identification accuracy.
-- Rule 2 compliant: only food names are stored, never user email or PII.

CREATE TABLE food_corrections (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_ai_name TEXT        NOT NULL,
  corrected_name   TEXT        NOT NULL,
  serving_description TEXT     NOT NULL,
  protein_g        NUMERIC     NOT NULL,
  carbs_g          NUMERIC,
  fat_g            NUMERIC,
  calories_kcal    NUMERIC,
  fiber_g          NUMERIC,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE food_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own corrections"
  ON food_corrections
  FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_food_corrections_user_created
  ON food_corrections (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 3. user_food_defaults — personal portion defaults per food name
-- ---------------------------------------------------------------------------
-- After confirming a photo scan, the confirmed values are upserted here.
-- On future scans that identify the same food (by normalized name), the
-- client pre-fills the review sheet with the saved values instead of the
-- raw AI estimate. This gives users consistent, personalized portions.

CREATE TABLE user_food_defaults (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name_key       TEXT        NOT NULL,  -- lowercase trimmed food name
  serving_description TEXT        NOT NULL,
  protein_g           NUMERIC     NOT NULL,
  carbs_g             NUMERIC,
  fat_g               NUMERIC,
  calories_kcal       NUMERIC,
  fiber_g             NUMERIC,
  b12_mcg             NUMERIC,
  vitamin_d_iu        NUMERIC,
  magnesium_mg        NUMERIC,
  zinc_mg             NUMERIC,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, food_name_key)
);

ALTER TABLE user_food_defaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own food defaults"
  ON user_food_defaults
  FOR ALL
  USING (auth.uid() = user_id);
