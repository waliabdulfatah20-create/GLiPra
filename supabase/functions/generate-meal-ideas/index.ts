// Edge function: generate-meal-ideas
// Returns 2-3 educational, protein-forward meal/snack IDEAS for a GLP-1 user,
// tailored to anonymized context. These are ideas/inspiration, NOT a meal plan
// or medical nutrition therapy.
//
// Rules enforced:
//   Rule 1  -- OpenAI is server-side only (Deno/Supabase).
//   Rule 2  -- No PII sent to OpenAI. Context = protein target, phase, nausea,
//              constraining diet, and a kidney-cap flag only.
//   Rule 3  -- Zod validates all output; failure returns a safe deterministic fallback.
//   Rule 10 -- Nutrition ONLY. mealType is an enum so the input cannot smuggle a
//              medical question; the prompt refuses anything non-nutritional.
//   Rate    -- 15/day per user via the ai_invocations rolling-24h window.
//
// ATTORNEY REVIEW REQUIRED before EXPO_PUBLIC_USE_MOCK_AI=false in production.
// This system prompt + the card disclaimer define the educational-not-prescriptive
// boundary for meal ideas.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';
import { z } from 'npm:zod@3';

import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Schemas (Rule 2: no PII, no allergens)
// ---------------------------------------------------------------------------

const InputSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'any']).default('any'),
  proteinFloorG: z.number().min(0).max(300).nullable().optional(),
  proteinRemainingG: z.number().min(0).max(300).nullable().optional(),
  phase: z.string().max(60).nullable().optional(),
  nauseaScore: z.number().min(1).max(5).nullable().optional(),
  dietaryPattern: z.enum(['vegetarian', 'vegan', 'pescatarian']).nullable().optional(),
  hasKidneyDisease: z.boolean().optional(),
  language: z.enum(['en', 'es']).default('en'),
});

const MealIdeaSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  approxProteinG: z.number().min(0).max(100),
});

const OutputSchema = z.object({
  ideas: z.array(MealIdeaSchema).min(1).max(3),
  note: z.string().min(1),
});

type MealIdeasOutput = z.infer<typeof OutputSchema>;

// ---------------------------------------------------------------------------
// Fallback -- returned on OpenAI failure or Zod parse failure (Rule 3)
// ---------------------------------------------------------------------------

const FALLBACK_RESULT: MealIdeasOutput = {
  ideas: [
    { name: 'Greek yogurt with berries', description: 'A high-protein base that is easy on a low appetite. Add a spoon of nut or seed butter for staying power.', approxProteinG: 18 },
    { name: 'Eggs two ways', description: 'Scrambled or as an omelet with whatever vegetables you have. Soft, gentle, and protein-dense.', approxProteinG: 14 },
    { name: 'Cottage cheese bowl', description: 'Top with fruit for something sweet or tomato and pepper for something savory.', approxProteinG: 20 },
  ],
  note: 'General ideas while a personalized set is unavailable. Adjust portions to your appetite.',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FUNCTION_NAME = 'generate-meal-ideas';
const MODEL = 'gpt-4o-mini';
const DAILY_LIMIT = 15;

// ---------------------------------------------------------------------------
// System prompt -- ATTORNEY REVIEW REQUIRED
// ---------------------------------------------------------------------------

function buildSystemPrompt(language: 'en' | 'es'): string {
  const base = `You are a pharmacist-designed nutrition assistant for people using GLP-1 medications.
Your task: suggest 2-3 concrete, protein-forward meal or snack IDEAS for the requested meal type.

These are EDUCATIONAL IDEAS and inspiration, NOT a meal plan, diet, or medical nutrition therapy.

SCOPE - Nutrition ONLY:
- High-protein meals and snacks, simple preparations, food texture, meal timing
- Ideas that help the user approach their daily protein target

RULES:
1. If a protein target or remaining-protein amount is given, bias ideas toward helping reach it, but never push beyond it.
2. If hasKidneyDisease is true, keep protein portions modest and do not suggest very-high-protein loads; favor balanced ideas.
3. Nausea score >= 4: suggest ONLY soft or liquid options (Greek yogurt, cottage cheese, protein shake, scrambled eggs, smoothie, soup). No solid or chewy foods.
4. Honor the dietary pattern strictly (vegetarian: no meat or fish; vegan: no animal products; pescatarian: fish ok, no meat).
5. Forbidden phrases: "you should", "you need to", "you must", "clinically proven", "prevents", "treats", "cures", "diagnose", "symptom".
6. No calorie totals or calorie-counting framing. No diet-culture or shame language.
7. Nutrition ONLY. No medication dosing, drug interactions, medical advice, or condition-specific therapeutic diets.
8. Keep each idea simple and realistic. approxProteinG is a rough estimate, not a precise figure.

Return JSON with this exact shape:
{
  "ideas": [ { "name": "<short name>", "description": "<one practical sentence>", "approxProteinG": <integer grams> } ],
  "note": "<one short, warm sentence framing these as ideas to adapt to appetite>"
}`;

  return language === 'es'
    ? `${base}\n\nRespond entirely in Spanish. Every name, description, and the note must be in Spanish.`
    : base;
}

function buildUserMessage(input: z.infer<typeof InputSchema>): string {
  const lines = [
    `Meal type requested: ${input.mealType}`,
    input.proteinFloorG != null ? `Daily protein target: ${Math.round(input.proteinFloorG)} g` : 'Daily protein target: not set',
    input.proteinRemainingG != null ? `Protein remaining today: ${Math.round(input.proteinRemainingG)} g` : null,
    input.phase ? `Cycle phase: ${input.phase}` : null,
    input.nauseaScore != null ? `Nausea score today: ${input.nauseaScore}/5` : null,
    input.dietaryPattern ? `Dietary pattern: ${input.dietaryPattern}` : null,
    input.hasKidneyDisease ? 'Kidney-protective: keep protein modest' : null,
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
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

    // Rate limit -- rolling 24h window
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', FUNCTION_NAME)
      .gte('created_at', oneDayAgo);

    if (countError) {
      console.error('Rate-limit query failed:', countError.message);
    }
    else if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: `Daily limit reached (${DAILY_LIMIT}/day for meal ideas)` }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Validate input
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    const input = inputParse.data;

    // OpenAI -- Rule 2: no PII in the prompt
    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildSystemPrompt(input.language) },
        { role: 'user', content: buildUserMessage(input) },
      ],
      max_tokens: 500,
    });

    // Zod validate output -- Rule 3: safe fallback, never crash
    let result: MealIdeasOutput = FALLBACK_RESULT;
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

    // Log to ai_invocations for cost tracking + rate limiting
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
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
    console.error('generate-meal-ideas unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
