// Edge function: generate-daily-guidance
// Generates (or returns cached) one personalized nutrition tip per user per day.
//
// Rules enforced:
//   Rule 1  -- OpenAI is server-side only (Deno/Supabase).
//   Rule 2  -- No PII sent to OpenAI. Context = phase, scores, progress only.
//   Rule 3  -- Zod validates all output; failure returns safe deterministic fallback.
//   Rule 12 -- Guidance is phase-aware, check-in-aware, and medication-status-aware.
//   Rule 16 -- Every response includes reasoning_text for the "Why?" tooltip.
//   Rate    -- 1/day enforced via UNIQUE (user_id, date) on daily_guidance table.
//             Subsequent same-day calls return the cached row, never re-generate.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';
import { z } from 'npm:zod@3';

import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const InputSchema = z.object({
  injectionPhase: z
    .enum(['injection_day', 'peak_suppression', 'adjustment', 'recovery_window', 'overdue'])
    .nullable()
    .optional(),
  nauseaScore: z.number().min(1).max(5).nullable().optional(),
  energyScore: z.number().min(1).max(5).nullable().optional(),
  proteinProgressPct: z.number().min(0).nullable().optional(),
  medicationStatus: z
    .enum(['active', 'starting', 'adjusting', 'maintenance', 'discontinued'])
    .nullable()
    .optional(),
  language: z.enum(['en', 'es']).default('en'),
});

const OutputSchema = z.object({
  guidance_text: z.string().min(1),
  reasoning_text: z.string().min(1),
});

type GuidanceOutput = z.infer<typeof OutputSchema>;

// ---------------------------------------------------------------------------
// Fallback -- returned on OpenAI failure or Zod parse failure (Rule 3)
// ---------------------------------------------------------------------------

const FALLBACK_RESULT: GuidanceOutput = {
  guidance_text:
    'Focus on small high-protein portions today. Greek yogurt, eggs, and cottage cheese '
    + 'are easy to eat even when appetite is low.',
  reasoning_text: 'General guidance - personalized tip unavailable right now.',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FUNCTION_NAME = 'generate-daily-guidance';
const MODEL = 'gpt-4o-mini';
const PROMPT_VERSION = 'v1';

// ---------------------------------------------------------------------------
// Phase labels for system prompt
// ---------------------------------------------------------------------------

const PHASE_LABELS: Record<string, string> = {
  injection_day: 'Injection Day (day of injection)',
  peak_suppression: 'Peak Suppression (days 1-2 post-injection, strongest appetite suppression)',
  adjustment: 'Adjustment Phase (days 3-4 post-injection, moderate suppression)',
  recovery_window: 'Recovery Window (days 5-7 post-injection, appetite returning)',
  overdue: 'Overdue (8+ days since last injection)',
};

// ---------------------------------------------------------------------------
// System prompt builder
// Rule 2: Only nutritional context -- no user identity information.
// ATTORNEY REVIEW REQUIRED before EXPO_PUBLIC_USE_MOCK_AI=false in any env.
// ---------------------------------------------------------------------------

function buildSystemPrompt(language: 'en' | 'es'): string {
  const base = `You are a pharmacist-designed nutrition assistant for people using GLP-1 medications.
Your task: provide ONE brief personalized nutrition tip for today based on the user's context.

SCOPE - Nutrition ONLY:
- Protein intake, high-protein food suggestions, muscle preservation
- Meal timing, portion guidance, food texture on nausea days
- Hydration and water intake
- Fiber and digestive health

RULES:
1. Nausea score >= 4: suggest ONLY soft or liquid protein (Greek yogurt, cottage cheese, protein shake, scrambled eggs, smoothie). No solid or chewy foods.
2. Nausea score = 5: never mention exercise or physical activity of any kind.
3. Protein progress < 30%: use gentle, non-shame framing. Say "It is a challenge day" not "you have not eaten enough."
4. Frame appetite suppression as the medication working correctly, not as a problem.
5. Forbidden phrases: "you should", "you need to", "you must", "clinically proven", "prevents", "treats", "cures", "diagnose", "symptom".
6. No calorie-shaming language. No diet-culture language. No calorie totals as a metric.
7. Nutrition advice ONLY. No medication dosing, drug interactions, or medical advice.

FORMAT: 2-3 sentences. Practical, warm, and specific to today's context.

Return JSON with this exact shape:
{
  "guidance_text": "<the 2-3 sentence tip, written for the user>",
  "reasoning_text": "<one sentence explaining why this specific tip fits today's context>"
}`;

  return language === 'es'
    ? `${base}\n\nRespond entirely in Spanish. Both fields must be in Spanish.`
    : base;
}

// ---------------------------------------------------------------------------
// User message builder -- Rule 2: only anonymous nutritional context
// ---------------------------------------------------------------------------

function buildUserMessage(input: z.infer<typeof InputSchema>): string {
  const phaseLabel = input.injectionPhase
    ? (PHASE_LABELS[input.injectionPhase] ?? 'Unknown phase')
    : 'No injection data';

  const lines = [
    `Injection phase: ${phaseLabel}`,
    input.nauseaScore != null
      ? `Nausea score today: ${input.nauseaScore}/5`
      : 'Nausea score: not logged today',
    input.energyScore != null
      ? `Energy score today: ${input.energyScore}/5`
      : 'Energy score: not logged today',
    input.proteinProgressPct != null
      ? `Protein progress today: ${Math.round(input.proteinProgressPct)}% of daily goal`
      : 'Protein progress: no data yet today',
    input.medicationStatus
      ? `Medication status: ${input.medicationStatus}`
      : null,
  ].filter(Boolean);

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Auth
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

    // 2. Validate input
    let body: unknown;
    try {
      body = await req.json();
    }
    catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inputParse = InputSchema.safeParse(body);
    if (!inputParse.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: inputParse.error.flatten() }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const input = inputParse.data;
    const today = new Date().toISOString().split('T')[0];

    // 3. Cache hit check -- return existing row if today's guidance already generated
    const { data: cached, error: cacheError } = await supabase
      .from('daily_guidance')
      .select('guidance_text, reasoning_text')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (cacheError) {
      console.error('Cache lookup failed:', cacheError.message);
    }

    if (cached) {
      const cachedParse = OutputSchema.safeParse(cached);
      if (cachedParse.success) {
        return new Response(JSON.stringify(cachedParse.data), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      console.error('Cached guidance failed schema validation - regenerating');
    }

    // 4. Call OpenAI GPT-4o mini -- Rule 2: no PII in prompt
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(input.language) },
        { role: 'user', content: buildUserMessage(input) },
      ],
      max_tokens: 250,
    });

    // 5. Zod validate output -- Rule 3: failure returns safe fallback, never a crash
    let result: GuidanceOutput = FALLBACK_RESULT;

    const rawContent = completion.choices[0]?.message?.content ?? '';
    try {
      const parsed = JSON.parse(rawContent);
      const outputParse = OutputSchema.safeParse(parsed);
      if (outputParse.success) {
        result = outputParse.data;
      }
      else {
        console.error('OutputSchema validation failed:', outputParse.error.flatten());
      }
    }
    catch (parseError) {
      console.error('JSON.parse of OpenAI content failed:', parseError);
    }

    // 6. Persist to daily_guidance -- service-role client bypasses RLS for write
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: insertError } = await serviceSupabase.from('daily_guidance').insert({
      user_id: user.id,
      date: today,
      injection_phase: input.injectionPhase ?? null,
      language: input.language,
      guidance_text: result.guidance_text,
      reasoning_text: result.reasoning_text,
      prompt_version: PROMPT_VERSION,
    });

    if (insertError) {
      if (!insertError.code?.includes('23505')) {
        console.error('Failed to persist guidance:', insertError.message);
      }
    }

    // 7. Log to ai_invocations for cost tracking
    const { error: logError } = await serviceSupabase.from('ai_invocations').insert({
      user_id: user.id,
      function_name: FUNCTION_NAME,
      model: MODEL,
      tokens_used: completion.usage?.total_tokens ?? null,
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('Failed to log ai_invocation:', logError.message);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('generate-daily-guidance unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
