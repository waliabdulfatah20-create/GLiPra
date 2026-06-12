-- 023_supplement_source.sql
-- Allow food_logs.source = 'supplement' so the per-nutrient supplement quick-add
-- can write a dedicated row (macros null, one micronutrient set) that the daily
-- micronutrient totals + the Micronutrient Watch card aggregate like any other log.
--
-- The existing CHECK constraint is named food_logs_source_check (see migration 022,
-- which added 'database' the same way). Drop + re-add idempotently.

ALTER TABLE food_logs DROP CONSTRAINT IF EXISTS food_logs_source_check;
ALTER TABLE food_logs ADD CONSTRAINT food_logs_source_check
  CHECK (source IN ('manual','barcode','photo','voice','database','supplement'));
