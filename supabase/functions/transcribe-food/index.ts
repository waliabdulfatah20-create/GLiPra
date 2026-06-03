// Edge function: transcribe-food
// Accepts base64-encoded audio, transcribes via Whisper, extracts food macros
// via GPT-4o mini, returns a RecognitionResult-shaped JSON object.
//
// Rules enforced:
//   Rule 1 — OpenAI is called server-side only (Deno/Supabase).
//   Rule 2 — No PII sent to OpenAI. Prompt contains audio transcript only.
//   Rule 3 — All OpenAI output parsed through Zod; failure returns safe fallback.
//   Pro gate — Client enforces Pro via RevenueCat before calling this function.
//              Server applies a generous circuit-breaker limit (100/day).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';
import { z } from 'npm:zod@3';

import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const InputSchema = z.object({
  audioBase64: z.string().min(10),
  mimeType: z.enum(['audio/m4a', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm']).default('audio/m4a'),
});

const OutputSchema = z.object({
  transcript: z.string(),
  name: z.string(),
  servingDescription: z.string(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative().nullable().optional(),
  fatG: z.number().nonnegative().nullable().optional(),
  fiberG: z.number().nonnegative().nullable().optional(),
  caloriesKcal: z.number().nonnegative().nullable().optional(),
  b12Mcg: z.number().nonnegative().nullable().optional(),
  vitaminDIu: z.number().nonnegative().nullable().optional(),
  magnesiumMg: z.number().nonnegative().nullable().optional(),
  zincMg: z.number().nonnegative().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  // Numeric self-reported confidence (0–100). Optional during rollout.
  confidencePercent: z.number().min(0).max(100).optional(),
});

type TranscribeOutput = z.infer<typeof OutputSchema>;

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

const FALLBACK_RESULT: TranscribeOutput = {
  transcript: '',
  name: 'Unknown food',
  servingDescription: '1 serving',
  proteinG: 0,
  carbsG: null,
  fatG: null,
  fiberG: null,
  caloriesKcal: null,
  b12Mcg: null,
  vitaminDIu: null,
  magnesiumMg: null,
  zincMg: null,
  confidence: 'low',
  confidencePercent: 0,
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Circuit-breaker limit. Pro users have "unlimited" but this prevents abuse. */
const DAILY_LIMIT = 100;
const FUNCTION_NAME = 'transcribe-food';
const WHISPER_MODEL = 'whisper-1';
const EXTRACTION_MODEL = 'gpt-4o-mini';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EXTRACTION_SYSTEM_PROMPT
  = 'You are a nutrition analysis assistant for a GLP-1 medication companion app. '
    + 'The user will provide a voice transcript describing their meal. '
    + 'Analyze the described food and return a single JSON object representing the '
    + 'complete meal as one consolidated entry. Use this exact shape: '
    + '{ '
    + '"name": string (concise meal name, e.g. "Scrambled eggs + protein shake"), '
    + '"servingDescription": string (e.g. "1 serving as described"), '
    + '"proteinG": number, '
    + '"carbsG": number | null, '
    + '"fatG": number | null, '
    + '"fiberG": number | null, '
    + '"caloriesKcal": number | null, '
    + '"b12Mcg": number | null, '
    + '"vitaminDIu": number | null, '
    + '"magnesiumMg": number | null, '
    + '"zincMg": number | null, '
    + '"confidence": "high" | "medium" | "low", '
    + '"confidencePercent": number '
    + '}. '
    + 'For GLP-1 patients, micronutrient estimates are especially important — provide '
    + 'best estimates for B12, vitamin D, magnesium, zinc, or null if unknown. '
    + 'For confidencePercent, return an integer 0–100 reflecting how sure you are of the food '
    + 'identification AND macro estimate. Guide: 85+ if the user clearly named a common dish '
    + 'with predictable macros; 60–84 if the description is partial or quantities are vague; '
    + '40–59 if the description is unusual or the user trailed off; under 40 if you are '
    + 'guessing. The confidence enum should match: high = 80+, medium = 50–79, low = <50. '
    + 'Do not include any user-identifying information.';

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
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Circuit-breaker rate limit (100/day — abuse prevention only)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('ai_invocations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('function_name', FUNCTION_NAME)
      .gte('created_at', oneDayAgo);

    if (countError) {
      console.error('Failed to query ai_invocations for rate limit:', countError.message);
    }
    else if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'Daily limit reached' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Validate input
    let body: unknown;
    try { body = await req.json(); }
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

    const { audioBase64, mimeType } = inputParse.data;

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

    // 4. Step 1 — Whisper transcription
    const audioBytes = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const audioFile = new File([audioBytes], 'audio.m4a', { type: mimeType });

    const transcriptionResponse = await openai.audio.transcriptions.create({
      model: WHISPER_MODEL,
      file: audioFile,
      response_format: 'text',
    });

    if (typeof transcriptionResponse !== 'string') {
      console.error('Whisper response was not a string:', typeof transcriptionResponse);
      return new Response(JSON.stringify(FALLBACK_RESULT), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const transcript = transcriptionResponse.trim();

    if (!transcript) {
      const serviceSupabaseEmpty = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { error: emptyLogError } = await serviceSupabaseEmpty.from('ai_invocations').insert({
        user_id: user.id,
        function_name: FUNCTION_NAME,
        model: WHISPER_MODEL,
        tokens_used: null,
        created_at: new Date().toISOString(),
      });
      if (emptyLogError)
        console.error('Failed to log empty-transcript invocation:', emptyLogError.message);

      return new Response(JSON.stringify({ ...FALLBACK_RESULT, transcript: '' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Step 2 — GPT-4o mini food extraction
    const completion = await openai.chat.completions.create({
      model: EXTRACTION_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
    });

    // 6. Zod validate output (Rule 3)
    let result: TranscribeOutput = { ...FALLBACK_RESULT, transcript };

    const rawContent = completion.choices[0]?.message?.content ?? '';
    try {
      const parsed = JSON.parse(rawContent);
      const outputParse = OutputSchema.omit({ transcript: true }).safeParse(parsed);
      if (outputParse.success) {
        result = { ...outputParse.data, transcript };
      }
      else {
        console.error('OutputSchema validation failed:', outputParse.error.flatten());
      }
    }
    catch (parseError) {
      console.error('JSON.parse of OpenAI content failed:', parseError);
    }

    // 7. Log to ai_invocations
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { error: logError } = await serviceSupabase.from('ai_invocations').insert({
      user_id: user.id,
      function_name: FUNCTION_NAME,
      model: EXTRACTION_MODEL,
      tokens_used: completion.usage?.total_tokens ?? null,
      created_at: new Date().toISOString(),
    });

    if (logError)
      console.error('Failed to log ai_invocation:', logError.message);

    // 8. Return result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('transcribe-food unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
