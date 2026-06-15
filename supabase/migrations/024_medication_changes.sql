-- 024_medication_changes.sql
-- Append-only audit trail of medication / route switches (e.g. Rybelsus tablet ->
-- Ozempic injection, Ozempic -> Mounjaro). The ACTIVE medication lives on `profiles`
-- (medication_id + administration_route + schedule fields); this table records each
-- switch so the in-app "Change medication" flow has history and the prescriber-visit
-- prep can show "switched X -> Y on <date>". A doctor changing a patient's script
-- should never be a reason to delete the app, so switching is a first-class action.
--
-- Rule 7: RLS on every table. Insert + select own only (history is never edited).

CREATE TABLE IF NOT EXISTS public.medication_changes (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  changed_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  from_medication_id  TEXT,
  from_route          TEXT,
  to_medication_id    TEXT         NOT NULL,
  to_route            TEXT         NOT NULL CHECK (to_route IN ('injection', 'oral')),
  notes               TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medication_changes_user_changed_at
  ON public.medication_changes (user_id, changed_at DESC);

ALTER TABLE public.medication_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "medication_changes select own"
  ON public.medication_changes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "medication_changes insert own"
  ON public.medication_changes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
