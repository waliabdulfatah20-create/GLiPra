-- 018_oral_glp1.sql
-- Add oral GLP-1 support as a first-class administration route.
--
-- Extends profiles with an administration_route + daily-dosing fields, and adds
-- a dedicated oral_dose_logs table. Oral doses are kept in their own table
-- rather than generalizing injection_logs, which carries injection-only,
-- safety-relevant columns (site_code CHECK, pain_level).
--
-- Rule 7: RLS on every table.
-- Idempotent (IF NOT EXISTS) so re-applying is safe.

-- ── profiles: administration route + daily-dosing fields ──────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS administration_route TEXT NOT NULL DEFAULT 'injection'
    CHECK (administration_route IN ('injection', 'oral'));

-- dose_frequency was collected at onboarding but never persisted until now.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dose_frequency TEXT
    CHECK (dose_frequency IN ('daily', 'weekly', 'biweekly'));

-- Preferred local time-of-day for the daily oral dose reminder (oral route only).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dose_time_local TIME;

-- Anchor date for the oral titration ramp (used to derive building vs steady_state).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS medication_start_date DATE;

-- ── oral_dose_logs: one row per logged oral dose ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.oral_dose_logs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  taken_at         TIMESTAMPTZ  NOT NULL,
  window_respected BOOLEAN,
  notes            TEXT,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oral_dose_logs_user_taken_at
  ON public.oral_dose_logs (user_id, taken_at DESC);

ALTER TABLE public.oral_dose_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oral_dose_logs select own"
  ON public.oral_dose_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "oral_dose_logs insert own"
  ON public.oral_dose_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oral_dose_logs update own"
  ON public.oral_dose_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "oral_dose_logs delete own"
  ON public.oral_dose_logs FOR DELETE
  USING (auth.uid() = user_id);
