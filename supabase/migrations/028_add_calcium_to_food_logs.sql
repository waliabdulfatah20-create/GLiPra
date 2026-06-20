-- 028_add_calcium_to_food_logs.sql
-- Add calcium as the 6th tracked GLP-1 micronutrient.
--
-- Rapid GLP-1 weight loss carries a documented bone-density risk, so the
-- micronutrient watch gains a calcium tile (daily target 1200 mg, the
-- protective IOM RDA). Calcium is added everywhere the other five micros
-- (b12_mcg, vitamin_d_iu, magnesium_mg, zinc_mg, iron_mg) already live:
--   - food_logs:          one row per logged food (AI / barcode estimate)
--   - user_food_defaults: confirmed per-food defaults that pre-fill repeat scans
--   - foods:              seeded pharmacist-curated foods (searchable pre-AI)
--
-- Nullable NUMERIC, mirroring the existing micro columns. No RLS change: all
-- three tables already carry owner-only RLS (Rule 7). Idempotent. Existing
-- seeded foods keep calcium_mg = null until a later pharmacist backfill.

ALTER TABLE food_logs
  ADD COLUMN IF NOT EXISTS calcium_mg NUMERIC; -- calcium in milligrams (estimated by AI / barcode)

ALTER TABLE user_food_defaults
  ADD COLUMN IF NOT EXISTS calcium_mg NUMERIC; -- saved calcium default so repeat scans keep it

ALTER TABLE foods
  ADD COLUMN IF NOT EXISTS calcium_mg NUMERIC; -- seeded-food calcium (nullable until backfilled)

-- After db push: regenerate types
--   npx supabase gen types typescript --project-id cuxndkreewlcmijxlgyg > src/types/database.ts
