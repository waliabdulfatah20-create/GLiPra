-- Migration 011: Add protein_floor_g to profiles
-- Stores the calculated protein floor so the Today screen can read it
-- without recalculating every time.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS protein_floor_g NUMERIC;
