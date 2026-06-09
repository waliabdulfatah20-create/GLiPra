-- 021_add_iron_to_food_logs.sql
-- Add iron as the 5th tracked GLP-1 micronutrient (Muscle-First MVP, Phase D).
--
-- Iron deficiency + hair thinning is a top unmet need for the GLP-1 audience,
-- so the micronutrient watch gains an iron tile. Iron is added everywhere the
-- other four micros (b12_mcg, vitamin_d_iu, magnesium_mg, zinc_mg) already live:
--   - food_logs:          one row per logged food (AI / barcode estimate)
--   - user_food_defaults: confirmed per-food defaults that pre-fill repeat scans
--
-- Nullable NUMERIC, mirroring the existing micro columns. No RLS change: both
-- tables already carry owner-only RLS (Rule 7). Idempotent.

ALTER TABLE food_logs
  ADD COLUMN IF NOT EXISTS iron_mg NUMERIC; -- iron in milligrams (estimated by AI / barcode)

ALTER TABLE user_food_defaults
  ADD COLUMN IF NOT EXISTS iron_mg NUMERIC; -- saved iron default so repeat scans keep it
