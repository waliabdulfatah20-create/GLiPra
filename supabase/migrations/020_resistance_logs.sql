-- 020_resistance_logs.sql
-- Resistance-training sessions, the new signal for the Muscle Preservation Score
-- (Muscle-First MVP, Phase A).
--
-- Resistance training for muscle preservation is a WEEKLY-FREQUENCY behavior
-- (2 to 3 sessions/week), not a daily log. One row per logged session;
-- session_type and duration_min are optional so logging stays one tap.
--
-- Rule 7: RLS on every table.
-- Idempotent (IF NOT EXISTS) so re-applying is safe.

-- ── resistance_logs: one row per logged resistance-training session ────────────
CREATE TABLE IF NOT EXISTS public.resistance_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  performed_at  TIMESTAMPTZ  NOT NULL,
  session_type  TEXT         CHECK (session_type IN ('full_body', 'upper', 'lower', 'other')),
  duration_min  INTEGER      CHECK (duration_min IS NULL OR (duration_min > 0 AND duration_min <= 600)),
  notes         TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resistance_logs_user_performed_at
  ON public.resistance_logs (user_id, performed_at DESC);

ALTER TABLE public.resistance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resistance_logs select own"
  ON public.resistance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "resistance_logs insert own"
  ON public.resistance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resistance_logs update own"
  ON public.resistance_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resistance_logs delete own"
  ON public.resistance_logs FOR DELETE
  USING (auth.uid() = user_id);
