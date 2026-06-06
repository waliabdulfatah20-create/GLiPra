// Edge function: generate-visit-prep
// Accepts anonymised GLP-1 metrics and returns 3-5 AI-generated discussion
// questions for the user's next prescriber appointment.
//
// Non-negotiable rules enforced here:
//   Rule 1 — OpenAI is called server-side only (this file runs in Deno/Supabase).
//   Rule 2 — No PII is sent to OpenAI. The schema intentionally excludes name,
//             email, and any identifying fields.
//   Rule 3 — All OpenAI output is parsed through a Zod schema; failure returns a
//             safe deterministic fallback, never a crash.
//   Rate limit — 5 calls per user per rolling 24-hour window.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai@4';
import { z } from 'npm:zod@3';

import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

// Rule 2: Input contains NO user-identifying information.
// No name, email, or exact location is accepted.
const InputSchema = z.object({
  medicationId: z.string(),
  doseMg: z.number(),
  // Route discriminator. Defaults to injection for backward compatibility with
  // older clients that send injectionPhase/daysSinceInjection without a route.
  administrationRoute: z.enum(['injection', 'oral']).optional().default('injection'),
  // Injection-route fields (present for injection users)
  injectionPhase: z.string().optional(),
  daysSinceInjection: z.number().optional(),
  // Oral-route fields (present for oral users)
  oralPhase: z.string().optional(),
  doseAdherenceStreakDays: z.number().optional(),
  daysSinceLastDose: z.number().optional(),
  avgNausea14d: z.number().nullable(),
  avgEnergy14d: z.number().nullable(),
  proteinFloorG: z.number(),
  avgProtein14d: z.number().nullable(),
  recentWeightTrendKg: z.number().nullable(), // positive = gaining, negative = losing
});

// Rule 3: Every OpenAI response is validated through this schema.
const OutputSchema = z.object({
  questions: z.array(z.string()).min(1).max(8),
});

type VisitPrepOutput = z.infer<typeof OutputSchema>;

// ---------------------------------------------------------------------------
// Safe fallback — returned when OpenAI output fails Zod validation.
// Guarantees the client never receives an unstructured error payload.
// ---------------------------------------------------------------------------

const FALLBACK_RESULT: VisitPrepOutput = {
  questions: [
    'How is my current dose working for me?',
    'Are there any adjustments we should consider at this stage?',
    'What symptoms should prompt me to call between visits?',
  ],
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_LIMIT = 5;
const FUNCTION_NAME = 'generate-visit-prep';
const MODEL = 'gpt-4o-mini';

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

    // 3. Rate limit — rolling 24-hour window, 5 calls max per user.
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
        JSON.stringify({ error: 'Daily limit reached (5/day for visit prep)' }),
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
        JSON.stringify({
          error: 'Invalid input',
          details: inputParse.error.flatten(),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const input = inputParse.data;

    // 5. Call OpenAI GPT-4o-mini with anonymised context.
    //
    //    ATTORNEY REVIEW REQUIRED — system prompt defines AI scope.
    //    Any change to this prompt requires attorney sign-off before shipping.
    //    The prompt is intentionally scoped to medication management questions
    //    only (efficacy, dosing, management) and explicitly excludes nutrition
    //    advice (that is the ai-coach function's domain).
    //
    //    Rule 2: The prompt contains NO user-identifying information.
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    });

    // Build a concise data context string from the anonymised metrics.
    // Route-aware: oral users get adherence framing, injection users get cycle framing.
    const contextLines: string[] = [
      `Medication ID: ${input.medicationId}`,
      `Dose: ${input.doseMg} mg`,
    ];

    if (input.administrationRoute === 'oral') {
      contextLines.push(
        'Administration: oral GLP-1 (daily tablet)',
        `Treatment status: ${input.oralPhase ?? 'unknown'}`,
        `Dose adherence: ${input.doseAdherenceStreakDays ?? 0}-day streak`,
        `Days since last dose: ${input.daysSinceLastDose ?? 0}`,
      );
    }
    else {
      contextLines.push(
        `Current injection phase: ${input.injectionPhase ?? 'unknown'}`,
        `Days since last injection: ${input.daysSinceInjection ?? 0}`,
      );
    }

    if (input.avgNausea14d !== null) {
      contextLines.push(
        `Average nausea score (last 14 days): ${input.avgNausea14d.toFixed(1)} / 5`,
      );
    }
    if (input.avgEnergy14d !== null) {
      contextLines.push(
        `Average energy score (last 14 days): ${input.avgEnergy14d.toFixed(1)} / 5`,
      );
    }
    if (input.avgProtein14d !== null) {
      contextLines.push(
        `Average protein intake (last 14 days): ${Math.round(input.avgProtein14d)} g/day`,
      );
      contextLines.push(
        `Protein floor target: ${Math.round(input.proteinFloorG)} g/day`,
      );
    }
    if (input.recentWeightTrendKg !== null) {
      const direction = input.recentWeightTrendKg < 0 ? 'losing' : 'gaining';
      contextLines.push(
        `Recent weight trend: ${direction} ${Math.abs(input.recentWeightTrendKg).toFixed(1)} kg`,
      );
    }

    const patientContext = contextLines.join('\n');

    const completion = await openai.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          // ATTORNEY REVIEW REQUIRED — see comment above.
          content:
            'You are a clinical assistant helping a patient prepare questions for their prescriber appointment. '
            + 'Generate 3-5 specific, relevant questions based on the patient\'s recent GLP-1 medication data. '
            + 'Questions should be about medication efficacy, dosing, and management — never about nutrition. '
            + 'Be specific and data-driven. Use the provided metrics directly in the questions. '
            + 'Do not include any identifying information in the questions. '
            + 'Format: return a JSON object with a "questions" key containing an array of question strings. '
            + 'Example: { "questions": ["My nausea has been high. Should we adjust my dose?"] }',
        },
        {
          role: 'user',
          content: `Here is my recent GLP-1 data:\n\n${patientContext}\n\nGenerate 3-5 questions I should ask my prescriber at my next visit.`,
        },
      ],
    });

    // 6. Zod validate OpenAI output.
    //    On failure: return the safe deterministic fallback (Rule 3).
    let result: VisitPrepOutput = FALLBACK_RESULT;

    const rawContent = completion.choices[0]?.message?.content ?? '';
    try {
      const parsed = JSON.parse(rawContent);
      const outputParse = OutputSchema.safeParse(parsed);
      if (outputParse.success) {
        result = outputParse.data;
      }
      else {
        console.error(
          'OutputSchema validation failed:',
          outputParse.error.flatten(),
        );
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
    const message
      = error instanceof Error ? error.message : 'Internal server error';
    console.error('generate-visit-prep unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
