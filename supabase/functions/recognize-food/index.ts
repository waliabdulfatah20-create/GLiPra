// Edge function: recognize-food
// Accepts a base64-encoded food photo and returns nutritional estimates via GPT-4o.
//
// Non-negotiable rules enforced here:
//   Rule 1 — OpenAI is called server-side only (this file runs in Deno/Supabase).
//   Rule 2 — No PII is sent to OpenAI (user ID is never included in prompts).
//             recentCorrections only contains food names — never user identity.
//   Rule 3 — All OpenAI output is parsed through a Zod schema; failure returns a
//             safe deterministic fallback, never a crash.
//   Rate limit — 50 calls per user per rolling 24-hour window.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';
import { z } from 'npm:zod@3';

import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const InputSchema = z.object({
  imageBase64: z.string().min(100), // base64-encoded image data
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  // Rule 2: only food names — never user email or identifying info
  recentCorrections: z
    .array(
      z.object({
        originalName: z.string(),
        correctedName: z.string(),
      }),
    )
    .max(10)
    .optional(),
  // Optional free-text context typed by the user before analysis (portion size,
  // preparation method, additions). Max 300 chars to guard against prompt injection.
  // Rule 2: must describe food only — never user identity or health conditions.
  userComment: z.string().max(300).optional(),
  // Optional dietary context to bias identification toward how the user eats.
  // Rule 2: categorical preferences only — never identifying. Only constraining
  // diets are ever sent by the client (omnivore/other add no signal).
  dietaryPattern: z.enum(['vegetarian', 'vegan', 'pescatarian']).optional(),
  allergens: z.array(z.string().max(40)).max(20).optional(),
});

const OutputSchema = z.object({
  name: z.string(),
  servingDescription: z.string(),
  proteinG: z.number().nonnegative(),
  carbsG: z.number().nonnegative().nullable().optional(),
  fatG: z.number().nonnegative().nullable().optional(),
  fiberG: z.number().nonnegative().nullable().optional(),
  caloriesKcal: z.number().nonnegative().nullable().optional(),
  // GLP-1 relevant micronutrients — AI estimates, accuracy varies by food
  b12Mcg: z.number().nonnegative().nullable().optional(),
  vitaminDIu: z.number().nonnegative().nullable().optional(),
  magnesiumMg: z.number().nonnegative().nullable().optional(),
  zincMg: z.number().nonnegative().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  // Numeric self-reported confidence (0–100). Optional during rollout; the
  // client falls back to deriving from the enum if absent.
  confidencePercent: z.number().min(0).max(100).optional(),
});

type RecognitionOutput = z.infer<typeof OutputSchema>;

// ---------------------------------------------------------------------------
// Safe fallback — returned whenever OpenAI output fails Zod validation.
// This guarantees the client never receives an unstructured error payload.
// ---------------------------------------------------------------------------

const FALLBACK_RESULT: RecognitionOutput = {
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

const DAILY_LIMIT = 50;
const FUNCTION_NAME = 'recognize-food';
const MODEL = 'gpt-4o';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  recentCorrections?: Array<{ originalName: string; correctedName: string }>,
  dietaryPattern?: 'vegetarian' | 'vegan' | 'pescatarian',
  allergens?: string[],
): string {
  let prompt
    = 'You are a nutrition analysis assistant for a GLP-1 medication companion app. '
      + 'Analyze the food in the image and return a JSON object with nutritional information '
      + 'per typical serving. Be concise and accurate. '
      + 'Return exactly this JSON shape (all nullable fields may be null if unknown): '
      + '{ '
      + '"name": string, '
      + '"servingDescription": string, '
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
      + 'For GLP-1 patients, micronutrient estimates (B12, vitamin D, magnesium, zinc) are '
      + 'especially important — provide your best estimate based on the food type, or null if '
      + 'truly uncertain. '
      + 'For confidencePercent, return an integer 0–100 reflecting how sure you are of the food '
      + 'identification AND macro estimate. Guide: 85+ if the food is clearly visible and a '
      + 'common dish with predictable macros; 60–84 if uncertain about portion size or '
      + 'ingredients; 40–59 if the dish is unusual or partially obscured; under 40 if you are '
      + 'guessing. The confidence enum should match: high = 80+, medium = 50–79, low = <50. '
      + 'Do not include any user-identifying information.';

  if (recentCorrections && recentCorrections.length > 0) {
    const correctionList = recentCorrections
      .map(c => `"${c.originalName}" → "${c.correctedName}"`)
      .join(', ');
    prompt
      += ` This user has previously corrected these AI identifications: ${correctionList}. `
        + 'Use this context to improve accuracy for similar foods.';
  }

  if (dietaryPattern) {
    prompt
      += ` The user follows a ${dietaryPattern} diet — when a food is ambiguous, prefer the `
        + 'identification consistent with that diet (for example, a burger is more likely a '
        + 'plant-based patty, and "milk" is more likely a plant milk). Do not override clear '
        + 'visual evidence; only use this to break ties.';
  }

  if (allergens && allergens.length > 0) {
    prompt
      += ` The user avoids these allergens: ${allergens.join(', ')}. Factor this in when an `
        + 'identification is ambiguous, but still report what the food actually appears to be.';
  }

  return prompt;
}

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

    // 3. Rate limit — rolling 24-hour window, 50 calls max per user.
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
        JSON.stringify({ error: 'Daily limit reached' }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // 4. Validate input with Zod.
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

    const { imageBase64, mimeType, recentCorrections, userComment, dietaryPattern, allergens } = inputParse.data;

    // 5. Call OpenAI GPT-4o with the image.
    //    Rule 2: The prompt contains NO user-identifying information.
    //    recentCorrections only contain food names — never user identity.
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    });

    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(recentCorrections, dietaryPattern, allergens),
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'low', // Use low detail to minimise token cost.
              },
            },
            {
              type: 'text',
              // If the user added context before scanning, prepend it so the model
              // uses it when estimating portion size, preparation, and additions.
              // Rule 2: userComment contains food context only, never user identity.
              text: userComment
                ? `The user noted: "${userComment}". Using this context, identify the food and estimate protein, carbs, fat, fiber, calories, and GLP-1 relevant micronutrients (B12, vitamin D, magnesium, zinc) per the described serving.`
                : 'Identify this food and estimate protein, carbs, fat, fiber, calories, '
                  + 'and GLP-1 relevant micronutrients (B12, vitamin D, magnesium, zinc) per typical serving.',
            },
          ],
        },
      ],
    });

    // 6. Zod validate OpenAI output.
    //    On failure: return the safe deterministic fallback (Rule 3).
    let result: RecognitionOutput = FALLBACK_RESULT;

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

    // 7. Log to ai_invocations.
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

    // 8. Return the validated result.
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('recognize-food unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
