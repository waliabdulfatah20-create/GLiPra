// Edge function: export-user-data
// GDPR data portability — gathers every row this user owns across all user-scoped
// tables and returns them as a single machine-readable JSON bundle.
//
// Non-negotiable rules enforced here:
//   Rule 1 — No OpenAI call: pure data gathering.
//   Rule 2 — No PII added: returns only the user's own stored rows.
//   Rate limit — 1 export per user per rolling 24-hour window.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_LIMIT = 1;
const FUNCTION_NAME = 'export-user-data';

// All user-scoped tables. content_cards is intentionally excluded (global, no user data).
// Every table here has a user_id column with ON DELETE CASCADE to auth.users.
const USER_TABLES = [
  'profiles',
  'food_logs',
  'ai_invocations',
  'daily_checkins',
  'weight_logs',
  'streaks',
  'shot_prep_logs',
  'user_milestones',
  'food_corrections',
  'user_food_defaults',
  'injection_logs',
  'daily_guidance',
] as const;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Auth — user-scoped client verifies the session.
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

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Rate limit — rolling 24-hour window, 1 export per user.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', FUNCTION_NAME)
      .gte('created_at', oneDayAgo);

    if (countError) {
      console.error('Rate-limit query failed:', countError.message);
      // Fail open on DB error — do not block the user.
    }
    else if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'Daily export limit reached (1/day)' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 4. Service-role client to read every table reliably (bypasses RLS;
    //    each query is still scoped to user_id so only this user's rows return).
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const tables: Record<string, unknown[]> = {};
    for (const table of USER_TABLES) {
      const { data, error } = await serviceSupabase
        .from(table)
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error(`Export query failed for ${table}:`, error.message);
        return new Response(
          JSON.stringify({ error: `Failed to export ${table}` }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }
      tables[table] = data ?? [];
    }

    const bundle = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      format_version: 1,
      tables,
    };

    // 5. Log to ai_invocations (no OpenAI tokens — model 'none').
    const { error: logError } = await serviceSupabase
      .from('ai_invocations')
      .insert({
        user_id: user.id,
        function_name: FUNCTION_NAME,
        model: 'none',
        tokens_used: null,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Failed to log ai_invocation:', logError.message);
    }

    // 6. Return the bundle as a stringified JSON payload.
    return new Response(JSON.stringify({ json: JSON.stringify(bundle, null, 2) }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('export-user-data unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
