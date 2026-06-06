-- Migration 019: Persist dietary pattern + allergens on profiles
-- dietary_pattern is collected in onboarding (dietary.tsx) but was never saved.
-- It is passed to the recognize-food AI prompt as anonymized context (Rule 2:
-- a categorical preference, not personally identifying) to bias food
-- identification toward how the user actually eats.
--
-- allergens is added ahead of its collection UI (no onboarding step yet); the
-- recognize-food edge function accepts it optionally so no redeploy is needed
-- when an allergen picker ships later.
--
-- No new table, so no new RLS policy: profiles already has owner-only RLS.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dietary_pattern TEXT
    CHECK (dietary_pattern IN ('omnivore', 'vegetarian', 'vegan', 'pescatarian', 'other')),
  ADD COLUMN IF NOT EXISTS allergens TEXT[];
