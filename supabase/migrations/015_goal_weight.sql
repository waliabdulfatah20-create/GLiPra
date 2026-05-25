-- Migration 015: Add goal_weight_kg to profiles
-- Allows users to set a target weight for the "To Goal" metric in Progress.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS goal_weight_kg NUMERIC;
