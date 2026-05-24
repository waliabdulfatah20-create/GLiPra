-- Migration: 010_profiles_medication_status
-- Adds medication_status column to the profiles table to support
-- Maintenance Mode and Life After GLP-1 (discontinuation) screens.
-- Values mirror the OnboardingFormData.medicationStatus type.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS medication_status text
    NOT NULL DEFAULT 'active'
    CHECK (medication_status IN ('starting', 'active', 'tapering', 'maintenance', 'discontinued'));

-- Index for queries that filter by medication status (e.g. analytics, support tooling)
CREATE INDEX IF NOT EXISTS idx_profiles_medication_status
  ON profiles (medication_status);
