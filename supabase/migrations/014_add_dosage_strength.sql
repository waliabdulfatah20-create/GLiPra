-- 014_add_dosage_strength.sql
-- Add optional dosage_strength column to injection_logs.
-- Nullable so existing rows are unaffected.
-- No CHECK constraint — compounded medications have custom doses.
ALTER TABLE injection_logs ADD COLUMN IF NOT EXISTS dosage_strength TEXT;
