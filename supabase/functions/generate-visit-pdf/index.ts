// Edge function: generate-visit-pdf
// Generates a single-page A4 PDF summarising the user's last 4 weeks of data
// for a prescriber visit. Returns the PDF as a base64-encoded string.
//
// Non-negotiable rules enforced here:
//   Rule 1 — No OpenAI call: this function is pure data formatting + pdf-lib.
//   Rule 2 — No PII in input: the Zod schema accepts no name, email, or location.
//   Rate limit — 5 PDFs per user per rolling 24-hour window.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { PDFDocument, rgb, StandardFonts } from 'npm:pdf-lib@1.17.1';
import { z } from 'npm:zod@3';

import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const PatientDataSchema = z.object({
  currentWeightKg: z.number().optional(),
  ewmaWeightKg: z.number().optional(),
  avgProteinG: z.number().optional(),
  injectionPhase: z.string().optional(),
  daysSinceInjection: z.number().optional(),
  medicationName: z.string().optional(),
  avgNausea: z.number().optional(),
  avgEnergy: z.number().optional(),
  hasRedFlags: z.boolean(),
});

const InputSchema = z.object({
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'visitDate must be YYYY-MM-DD'),
  patientData: PatientDataSchema,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAILY_LIMIT = 5;
const FUNCTION_NAME = 'generate-visit-pdf';

const PRESCRIBER_QUESTIONS = [
  'Is my current dose appropriate for my weight?',
  'Should I adjust my injection day based on my schedule?',
  'Are my protein goals still appropriate?',
  'What symptoms should prompt me to call between visits?',
];

// ---------------------------------------------------------------------------
// PDF helpers
// ---------------------------------------------------------------------------

/** Draw a labelled section divider line with a title. */
function drawSectionHeading(
  page: ReturnType<PDFDocument['addPage']>,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  text: string,
  y: number,
  pageWidth: number,
  margin: number,
): number {
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  const headY = y - 14;
  page.drawText(text, {
    x: margin,
    y: headY,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });
  return headY - 8;
}

/** Draw a key/value data row. Returns next Y position. */
function drawDataRow(
  page: ReturnType<PDFDocument['addPage']>,
  regularFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
  boldFont: Awaited<ReturnType<PDFDocument['embedFont']>>,
  label: string,
  value: string,
  y: number,
  margin: number,
): number {
  page.drawText(label, {
    x: margin,
    y,
    size: 9,
    font: regularFont,
    color: rgb(0.42, 0.42, 0.42),
  });
  page.drawText(value, {
    x: margin + 160,
    y,
    size: 9,
    font: boldFont,
    color: rgb(0.07, 0.07, 0.07),
  });
  return y - 14;
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

    // 3. Rate limit — rolling 24-hour window, 5 PDFs per user.
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
    } else if ((count ?? 0) >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: 'Daily PDF limit reached (5/day)' }),
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
    } catch {
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

    const { visitDate, patientData } = inputParse.data;

    // 5. Generate the PDF with pdf-lib.
    const doc = await PDFDocument.create();

    // A4 dimensions in points: 595 × 842
    const page = doc.addPage([595, 842]);
    const { width, height } = page.getSize();
    const margin = 48;
    const contentWidth = width - margin * 2;

    const regularFont = await doc.embedFont(StandardFonts.Helvetica);
    const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

    let curY = height - margin;

    // --- Header block ---
    page.drawText('Glipra Visit Prep Summary', {
      x: margin,
      y: curY,
      size: 18,
      font: boldFont,
      color: rgb(0.18, 0.42, 0.89), // primary brand blue — matches #2D6BE4
    });
    curY -= 20;

    page.drawText(`Visit Date: ${visitDate}`, {
      x: margin,
      y: curY,
      size: 10,
      font: regularFont,
      color: rgb(0.42, 0.42, 0.42),
    });
    curY -= 14;

    page.drawText('Designed by a licensed pharmacist', {
      x: margin,
      y: curY,
      size: 9,
      font: regularFont,
      color: rgb(0.55, 0.55, 0.55),
    });
    curY -= 22;

    // --- Weight Trend ---
    curY = drawSectionHeading(page, boldFont, 'WEIGHT TREND', curY, width, margin);
    curY -= 4;

    const currentWeightStr = patientData.currentWeightKg !== undefined
      ? `${patientData.currentWeightKg.toFixed(1)} kg`
      : 'Not recorded';
    const ewmaStr = patientData.ewmaWeightKg !== undefined
      ? `${patientData.ewmaWeightKg.toFixed(1)} kg`
      : 'Not recorded';

    curY = drawDataRow(page, regularFont, boldFont, 'Current weight:', currentWeightStr, curY, margin);
    curY = drawDataRow(page, regularFont, boldFont, 'Smoothed trend (EWMA):', ewmaStr, curY, margin);
    curY -= 10;

    // --- Nutrition Summary ---
    curY = drawSectionHeading(page, boldFont, 'NUTRITION SUMMARY', curY, width, margin);
    curY -= 4;

    const avgProteinStr = patientData.avgProteinG !== undefined
      ? `${Math.round(patientData.avgProteinG)} g/day (4-week average)`
      : 'No food logs yet';

    curY = drawDataRow(page, regularFont, boldFont, 'Avg protein intake:', avgProteinStr, curY, margin);
    curY -= 10;

    // --- Injection Cycle ---
    curY = drawSectionHeading(page, boldFont, 'INJECTION CYCLE', curY, width, margin);
    curY -= 4;

    const medicationStr = patientData.medicationName ?? 'Not specified';
    const phaseStr = patientData.injectionPhase ?? 'Unknown';
    const daysStr = patientData.daysSinceInjection !== undefined
      ? `${patientData.daysSinceInjection} days`
      : 'Unknown';

    curY = drawDataRow(page, regularFont, boldFont, 'Medication:', medicationStr, curY, margin);
    curY = drawDataRow(page, regularFont, boldFont, 'Current phase:', phaseStr, curY, margin);
    curY = drawDataRow(page, regularFont, boldFont, 'Days since injection:', daysStr, curY, margin);
    curY -= 10;

    // --- Recent Symptoms ---
    curY = drawSectionHeading(page, boldFont, 'RECENT SYMPTOMS (last 7 check-ins)', curY, width, margin);
    curY -= 4;

    const nauseaStr = patientData.avgNausea !== undefined
      ? `${patientData.avgNausea.toFixed(1)} / 5`
      : 'No check-ins recorded';
    const energyStr = patientData.avgEnergy !== undefined
      ? `${patientData.avgEnergy.toFixed(1)} / 5`
      : 'No check-ins recorded';
    const redFlagStr = patientData.hasRedFlags ? 'Yes — discuss with prescriber' : 'No';

    curY = drawDataRow(page, regularFont, boldFont, 'Avg nausea (1–5):', nauseaStr, curY, margin);
    curY = drawDataRow(page, regularFont, boldFont, 'Avg energy (1–5):', energyStr, curY, margin);
    curY = drawDataRow(page, regularFont, boldFont, 'Red flags triggered:', redFlagStr, curY, margin);
    curY -= 10;

    // --- Questions for Prescriber ---
    curY = drawSectionHeading(page, boldFont, 'QUESTIONS FOR YOUR PRESCRIBER', curY, width, margin);
    curY -= 4;

    for (const question of PRESCRIBER_QUESTIONS) {
      page.drawText('•', {
        x: margin,
        y: curY,
        size: 9,
        font: boldFont,
        color: rgb(0.18, 0.42, 0.89),
      });

      // Wrap long question text manually at ~65 chars
      const maxChars = 70;
      if (question.length <= maxChars) {
        page.drawText(question, {
          x: margin + 12,
          y: curY,
          size: 9,
          font: regularFont,
          color: rgb(0.07, 0.07, 0.07),
        });
        curY -= 14;
      } else {
        // Simple two-line split at word boundary near maxChars
        const breakIdx = question.lastIndexOf(' ', maxChars);
        const line1 = question.slice(0, breakIdx);
        const line2 = question.slice(breakIdx + 1);
        page.drawText(line1, {
          x: margin + 12,
          y: curY,
          size: 9,
          font: regularFont,
          color: rgb(0.07, 0.07, 0.07),
        });
        curY -= 12;
        page.drawText(line2, {
          x: margin + 12,
          y: curY,
          size: 9,
          font: regularFont,
          color: rgb(0.07, 0.07, 0.07),
        });
        curY -= 14;
      }
    }

    // --- Footer ---
    const footerY = margin + 8;
    page.drawLine({
      start: { x: margin, y: footerY + 14 },
      end: { x: width - margin, y: footerY + 14 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    page.drawText(
      'This summary is informational only. It does not constitute medical advice.',
      {
        x: margin,
        y: footerY,
        size: 8,
        font: regularFont,
        color: rgb(0.55, 0.55, 0.55),
        maxWidth: contentWidth,
      },
    );

    // --- Serialize ---
    const pdfBytes = await doc.save();
    // Convert Uint8Array to base64
    const base64 = btoa(String.fromCharCode(...pdfBytes));

    // 6. Log to ai_invocations (no OpenAI tokens — set model to 'none').
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

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

    // 7. Return base64 PDF.
    return new Response(JSON.stringify({ pdfBase64: base64 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('generate-visit-pdf unhandled error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
