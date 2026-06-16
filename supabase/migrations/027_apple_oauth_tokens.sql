-- 027_apple_oauth_tokens.sql
-- Stores the Apple OAuth refresh token per user so account deletion can revoke the
-- Sign in with Apple grant (App Store guideline 5.1.1(v)). The refresh token is a
-- server-only secret: it must NEVER be readable by the client.
--
-- Rule 7: RLS on every table. Here RLS is ENABLED with NO policies on purpose.
-- With RLS on and no policy, the anon/authenticated roles get ZERO row access
-- (default deny). Only the service_role key (used exclusively inside edge functions)
-- bypasses RLS. A leaked client token can never read any user's refresh token.
-- DO NOT add a SELECT/INSERT policy here - the absence of a policy IS the security
-- property. Only `apple-link` (write) and `delete-user-account` (read) touch this,
-- both with the service role.

CREATE TABLE IF NOT EXISTS public.apple_oauth_tokens (
  user_id       UUID         PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  refresh_token TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.apple_oauth_tokens ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: service_role (edge functions) only.
