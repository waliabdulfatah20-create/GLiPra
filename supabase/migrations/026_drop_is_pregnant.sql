-- Migration 026: drop the unused profiles.is_pregnant column.
--
-- is_pregnant (added in migration 001) is dormant: there is no pregnancy feature,
-- the protein calculator no longer reads it, and the onboarding insert only ever
-- wrote a hardcoded `false`. GLP-1 medications are not used in pregnancy, so the
-- app makes no pregnancy-related promise and has no reason to store this sensitive
-- field. Removed as data minimization for the App Privacy / Data safety filings.

ALTER TABLE profiles
  DROP COLUMN IF EXISTS is_pregnant;

-- After db push: regenerate types
--   npx supabase gen types typescript --project-id cuxndkreewlcmijxlgyg > src/types/database.ts
