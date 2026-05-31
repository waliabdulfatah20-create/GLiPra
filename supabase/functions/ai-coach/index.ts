// Edge function: ai-coach
// Provides nutrition coaching via GPT-4o mini.
//
// Non-negotiable rules enforced here:
//   Rule 1  — OpenAI is called server-side only (this file runs in Deno/Supabase).
//   Rule 2  — No PII is sent to OpenAI (user ID is never included in prompts).
//   Rule 3  — All OpenAI output is parsed through a Zod schema; failure returns a
//             safe deterministic fallback, never a crash.
//   Rule 10 — AI coach answers FOOD QUESTIONS ONLY. A keyword blocklist runs BEFORE
//             hitting OpenAI. Medication, dosing, and symptom questions are hard-blocked
//             and return a canned response without spending any tokens.
//   Rate limit — 10 messages per user per rolling 24-hour window.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';
import { z } from 'npm:zod@3';

import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Keyword blocklist — Rule 10
// This check runs BEFORE OpenAI is called. Any message containing a blocked
// keyword returns the canned response immediately, spending zero tokens.
// ---------------------------------------------------------------------------

const BLOCKED_KEYWORDS = [
  'dose',
  'dosing',
  'dosage',
  'how much to inject',
  'injection amount',
  'drug interaction',
  'interaction',
  'side effect',
  'side effects',
  'ozempic dose',
  'wegovy dose',
  'mounjaro dose',
  'pancreatitis',
  'gastroparesis',
  'gallbladder',
  'thyroid cancer',
  'nausea medication',
  'anti-nausea medication',
  'zofran',
  'ondansetron',
  'prescription',
  'prescribe',
  'stop taking',
  'discontinue medication',
  'switch medication',
  'change medication',
  'symptom',
  'diagnosis',
  'diagnose',
  'treatment',
];

function containsBlockedKeyword(message: string): boolean {
  const lower = message.toLowerCase();
  return BLOCKED_KEYWORDS.some(kw => lower.includes(kw));
}

const BLOCKED_RESPONSE
  = 'For medication questions, contact your prescriber or pharmacist directly. '
    + 'I can help with protein goals, meal ideas, hydration, and food strategies.';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const InputSchema = z.object({
  message: z.string().min(1).max(500),
  context: z
    .object({
      proteinFloorG: z.number().optional(),
      proteinConsumedG: z.number().optional(),
      injectionPhase: z.string().optional(),
      // Rule 2: No PII — no name, email, weight, or identifying fields.
    })
    .optional(),
});

const OutputSchema = z.object({
  reply: z.string(),
});

type CoachOutput = z.infer<typeof OutputSchema>;

// ---------------------------------------------------------------------------
// Safe fallback — returned whenever OpenAI output fails Zod validation.
// This guarantees the client never receives an unstructured error payload.
// ---------------------------------------------------------------------------

const FALLBACK_RESULT: CoachOutput = {
  reply: 'I\'m having trouble right now. Please try again shortly.',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_LIMIT = 10;
const FUNCTION_NAME = 'ai-coach';
const MODEL = 'gpt-4o-mini';

// ---------------------------------------------------------------------------
// System prompt
//
// ATTORNEY REVIEW REQUIRED before enabling real AI in production.
// This prompt defines the scope boundary for the nutrition coach. Any changes
// to the allowed topics or the medication-question redirect must be reviewed
// by legal counsel before deployment.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a nutrition assistant for people using GLP-1 medications. You only answer questions about:
- Protein intake and muscle preservation
- Meal ideas, food choices, and meal timing
- Hydration and water intake
- Fiber intake and digestive health
- General healthy eating strategies

You do NOT answer questions about:
- Medication dosing, interactions, or side effects
- Medical symptoms or conditions
- Whether to start, stop, or change medications
- Any medical advice

If asked about medications or medical topics, respond only with: "For medication questions, contact your prescriber or pharmacist directly."

Keep responses concise — 2-4 sentences max. Be supportive and practical.

Return your response as a JSON object with this exact shape: { "reply": "<your response here>" }`;

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Auth — create a user-scoped Supabase client and verify the session.
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

    // 3. Validate input with Zod before doing anything else.
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

    const { message, context } = inputParse.data;

    // 4. Keyword blocklist — Rule 10.
    //    This runs BEFORE the rate-limit check so blocked messages don't
    //    consume the user's daily quota.
    if (containsBlockedKeyword(message)) {
      return new Response(JSON.stringify({ reply: BLOCKED_RESPONSE }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Rate limit — rolling 24-hour window, 10 messages max per user.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { count, error: countError } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', FUNCTION_NAME)
      .gte('created_at', oneDayAgo);

    if (countError) {
      console.error('Rate-limit query failed:', countError.message);
      // Fail open only in this case — do not block the user on a DB error.
    }
    else if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'Daily limit reached',
          reply: 'You\'ve reached your daily limit of 10 coaching messages. Try again tomorrow!',
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 6. Build user message content.
    //    Rule 2: Only nutrition context is included — no PII.
    let userContent = message;

    if (context) {
      const contextParts: string[] = [];
      if (context.proteinFloorG !== undefined) {
        contextParts.push(`Protein goal: ${context.proteinFloorG}g/day`);
      }
      if (context.proteinConsumedG !== undefined) {
        contextParts.push(`Protein logged today: ${context.proteinConsumedG}g`);
      }
      if (context.injectionPhase !== undefined) {
        contextParts.push(`Current injection phase: ${context.injectionPhase}`);
      }
      if (contextParts.length > 0) {
        userContent = `[Context: ${contextParts.join(', ')}]\n\n${message}`;
      }
    }

    // 7. Call OpenAI GPT-4o mini.
    //    Rule 2: The prompt contains NO user-identifying information.
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      max_tokens: 300, // Keep responses concise and cost-controlled.
    });

    // 8. Zod validate OpenAI output.
    //    On failure: return the safe deterministic fallback (Rule 3).
    let result: CoachOutput = FALLBACK_RESULT;

    const rawContent = completion.choices[0]?.message?.content ?? '';
    try {
      const parsed = JSON.parse(rawContent);
      const outputParse = OutputSchema.safeParse(parsed);
      if (outputParse.success) {
        result = outputParse.data;
      }
      else {
        console.error('OutputSchema validation failed:', outputParse.error.flatten());
        // result stays as FALLBACK_RESULT
      }
    }
    catch (parseError) {
      console.error('JSON.parse of OpenAI content failed:', parseError);
      // result stays as FALLBACK_RESULT
    }

    // 9. Log to ai_invocations.
    //    Use the service-role key for the insert so it bypasses RLS.
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: logError } = await serviceSupabase
      .from('ai_invocations')
      .insert({
        user_id: user.id,
        function_name: FUNCTION_NAME,
        model: MODEL,
        tokens_used: completion.usage?.total_tokens ?? null,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      // Log the failure but do not surface it to the user.
      console.error('Failed to log ai_invocation:', logError.message);
    }

    // 10. Return the validated result.
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('ai-coach unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
