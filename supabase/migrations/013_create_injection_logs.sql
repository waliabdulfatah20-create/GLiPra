-- 013_create_injection_logs.sql
-- Rebuild the injection_logs table with the new "Add Shot" schema:
--   site_code (enum-checked), medication_name, pain_level (0-10), notes
-- Previous incarnation used site_zone + site_position; no migration was ever
-- committed for that version, so this is the canonical schema going forward.
--
-- Rule 7: RLS on every table.
-- Rule 4 adjacent: the rotation calculator depends on this exact column set.

DROP TABLE IF EXISTS public.injection_logs CASCADE;

CREATE TABLE public.injection_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  injected_at     TIMESTAMPTZ  NOT NULL,
  site_code       TEXT         NOT NULL
                                  CHECK (site_code IN (
                                    'stomach_upper_left',
                                    'stomach_upper_mid',
                                    'stomach_upper_right',
                                    'stomach_lower_left',
                                    'stomach_lower_mid',
                                    'stomach_lower_right'
                                  )),
  medication_name TEXT         NOT NULL,
  pain_level      INTEGER      NOT NULL CHECK (pain_level BETWEEN 0 AND 10),
  notes           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_injection_logs_user_injected_at
  ON public.injection_logs (user_id, injected_at DESC);

ALTER TABLE public.injection_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "injection_logs select own"
  ON public.injection_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "injection_logs insert own"
  ON public.injection_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "injection_logs update own"
  ON public.injection_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "injection_logs delete own"
  ON public.injection_logs FOR DELETE
  USING (auth.uid() = user_id);
