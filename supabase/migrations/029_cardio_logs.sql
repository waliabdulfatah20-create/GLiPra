-- 029_cardio_logs.sql
-- Cardio sessions: a SECONDARY tracker. Muscle preservation (protein + resistance)
-- stays the #1 focus and the only input to the Muscle Preservation Score. Cardio is
-- tracked separately so it never pollutes the resistance count or the muscle lever.
--
-- The clinical point: too much cardio relative to resistance can work against muscle
-- retention on GLP-1 (concurrent-training interference effect). The app surfaces an
-- educational warning when weekly cardio outpaces weekly resistance; this table is the
-- data behind that. One row per logged session; type + duration optional (one-tap log).
--
-- Mirrors resistance_logs (migration 020). Rule 7: RLS on every table. Idempotent.

CREATE TABLE IF NOT EXISTS public.cardio_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  performed_at  TIMESTAMPTZ  NOT NULL,
  session_type  TEXT         CHECK (session_type IN ('walk', 'run', 'cycle', 'other')),
  duration_min  INTEGER      CHECK (duration_min IS NULL OR (duration_min > 0 AND duration_min <= 600)),
  notes         TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cardio_logs_user_performed_at
  ON public.cardio_logs (user_id, performed_at DESC);

ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cardio_logs select own"
  ON public.cardio_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "cardio_logs insert own"
  ON public.cardio_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cardio_logs update own"
  ON public.cardio_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cardio_logs delete own"
  ON public.cardio_logs FOR DELETE
  USING (auth.uid() = user_id);

-- After db push: regenerate types
--   npx supabase gen types typescript --project-id cuxndkreewlcmijxlgyg > src/types/database.ts
