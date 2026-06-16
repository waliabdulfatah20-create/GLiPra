-- Migration 025: drop the unused profiles.allergens column.
--
-- allergens (added in migration 019 "ahead of its collection UI") never shipped a
-- collector and is being removed deliberately: the app makes no allergen-avoidance
-- safety promise (an AI photo estimate cannot be relied on for allergy safety), so
-- we do not store this sensitive field. The recognize-food prompt path that read it
-- has also been removed. Data minimization for the App Privacy / Data safety filings.

ALTER TABLE profiles
  DROP COLUMN IF EXISTS allergens;

-- After db push: regenerate types
--   npx supabase gen types typescript --project-id cuxndkreewlcmijxlgyg > src/types/database.ts
