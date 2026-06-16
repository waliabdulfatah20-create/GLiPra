// Edge function: apple-link
// Stores the caller's Apple OAuth refresh token so account deletion can later
// revoke the Sign in with Apple grant (App Store guideline 5.1.1(v)).
//
// Called fire-and-forget by the client right after a successful Apple sign-in,
// with the one-time authorizationCode. We exchange it for a long-lived refresh
// token and upsert it into apple_oauth_tokens (service-role only; RLS denies all
// client access).
//
//   Rule 1 — No OpenAI call.
//   Gated: if Apple is not configured (no APPLE_* secrets), this returns
//   { skipped: true } and touches nothing — a clean no-op until enrollment (#87).
//
// IMPORTANT: Apple returns a refresh_token only on the user's FIRST authorization
// for this app. On later sign-ins it is absent — we must NOT overwrite the stored
// token with null, so we only upsert when a refresh_token is actually present.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

import { exchangeAuthCode, getAppleConfig } from '../_shared/apple.ts';
import { corsHeaders } from '../_shared/cors.ts';

const InputSchema = z.object({
  authorizationCode: z.string().min(1),
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Auth — user-scoped client resolves the caller.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') ?? '' },
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user)
      return json({ error: 'Unauthorized' }, 401);

    // 3. Gate — if Apple is not configured, no-op cleanly (pre-enrollment).
    const config = getAppleConfig();
    if (!config)
      return json({ skipped: true }, 200);

    // 4. Validate input.
    const parsed = InputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success)
      return json({ error: 'Invalid request' }, 400);

    // 5. Exchange the one-time code for a refresh token. Absent on non-first
    //    sign-ins — in that case keep any existing token, write nothing.
    const refreshToken = await exchangeAuthCode(config, parsed.data.authorizationCode);
    if (!refreshToken)
      return json({ linked: false }, 200);

    // 6. Store it (service role; RLS denies all client access to this table).
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: upsertError } = await serviceSupabase
      .from('apple_oauth_tokens')
      .upsert(
        { user_id: user.id, refresh_token: refreshToken, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      );

    if (upsertError) {
      console.error('apple-link upsert failed:', upsertError.message);
      return json({ error: 'Failed to store token' }, 500);
    }

    return json({ linked: true }, 200);
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('apple-link unhandled error:', message);
    return json({ error: message }, 400);
  }
});
