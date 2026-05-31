-- supabase/migrations/017_barcode_corrections.sql
-- Per-EAN nutrition corrections: user-verified barcode data that overrides
-- Open Food Facts on future scans. Read/written by
-- src/features/food-log/barcode-corrections.ts (upsert on user_id,barcode_ean).
-- Rule 7: RLS enabled with user-scoped policy.

CREATE TABLE barcode_corrections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  barcode_ean   TEXT NOT NULL,
  product_name  TEXT NOT NULL,
  protein_g     NUMERIC NOT NULL,
  fiber_g       NUMERIC,
  calories_kcal NUMERIC,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, barcode_ean)
);

ALTER TABLE barcode_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_barcode_corrections"
  ON barcode_corrections FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_barcode_corrections_user_ean
  ON barcode_corrections (user_id, barcode_ean);
