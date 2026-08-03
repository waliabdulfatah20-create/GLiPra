-- supabase/migrations/030_rls_with_check_hardening.sql
-- RLS hardening: add WITH CHECK to four FOR ALL policies that only had USING.
--
-- In Postgres RLS, USING gates SELECT/UPDATE/DELETE (existing-row visibility),
-- but INSERT (and the post-UPDATE row) is gated by WITH CHECK. These four
-- policies were created FOR ALL with USING only, so INSERTs were NOT constrained
-- to the caller's own row -- a user could insert a row carrying another user's
-- user_id. Adding WITH CHECK (auth.uid() = user_id) closes that gap and matches
-- the correct shape already used by user_milestones (migration 009).
--
-- Source policies: 012 (food_corrections, user_food_defaults),
-- 016 (daily_guidance), 017 (barcode_corrections).
-- Caught by RLS audit 2026-06-23 (docs/security/RLS-AUDIT-CHECKLIST.md).
-- Rule 7: tightens existing per-user policies; no table loses RLS.

ALTER POLICY "users manage own corrections"
  ON public.food_corrections
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "users manage own food defaults"
  ON public.user_food_defaults
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "users_own_guidance"
  ON public.daily_guidance
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "users_own_barcode_corrections"
  ON public.barcode_corrections
  WITH CHECK (auth.uid() = user_id);
