/**
 * Pure stage definitions + adaptive pacing math for the AnalyzingModal.
 *
 * The modal shows a 5-stage checklist that ticks down while a single async
 * OpenAI call is in flight. Without adaptive pacing, a fast response (~2s)
 * would slam stages 1–4 from "pending" to "done" all at once — feels fake.
 *
 * `planNextStageDelay` returns the milliseconds to wait before ticking the
 * NEXT stage, given how long the call has been running and how many stages
 * remain. Three rules:
 *
 *   1. Each completed stage gets at least MIN_STAGE_DONE_MS (~250ms) of
 *      visibility before the next ticks.
 *   2. If the response is still pending, prefer NATURAL_DURATIONS (the
 *      "feels right" pacing) unless those durations would push beyond the
 *      remaining-time-budget.
 *   3. The LAST stage holds until the real response lands — never auto-ticks.
 *
 * The "natural durations" are calibrated so a typical warm OpenAI call
 * (~3–6s) finishes a moment after the checklist completes — the user sees
 * stages flow, response arrives just as stage 5 lights up.
 */

export type AnalyzingSource = 'photo' | 'voice';

export type StageKey =
  // photo stages
  | 'image_received'
  | 'identifying_food'
  | 'calculating_macros'
  | 'checking_glp_nutrients'
  | 'building_pro_insight'
  // voice-only stages (replaces image_received + adds transcribing)
  | 'audio_received'
  | 'transcribing_voice';

/** The ordered stage list per source. */
export const PHOTO_STAGES: readonly StageKey[] = [
  'image_received',
  'identifying_food',
  'calculating_macros',
  'checking_glp_nutrients',
  'building_pro_insight',
] as const;

export const VOICE_STAGES: readonly StageKey[] = [
  'audio_received',
  'transcribing_voice',
  'identifying_food',
  'calculating_macros',
  'building_pro_insight',
] as const;

export function stagesFor(source: AnalyzingSource): readonly StageKey[] {
  return source === 'photo' ? PHOTO_STAGES : VOICE_STAGES;
}

/** Minimum time a stage stays "done" before the next ticks. */
export const MIN_STAGE_DONE_MS = 250;

/** When the slow-connection hint appears (only after this many ms in the last stage). */
export const SLOW_HINT_AFTER_MS = 8000;

/**
 * "Natural" duration before ticking each stage. The last stage's duration is
 * `Infinity` because it holds until the real response.
 */
const NATURAL_DURATIONS_MS = [0, 800, 1200, 1500, Infinity] as const;
//                            ↑ stage 1 (index 0) renders done immediately

/**
 * Plan the delay before advancing to `nextStageIndex` (0-based).
 * `elapsedMs` = time since stage 1 ticked done.
 * Returns Infinity for the last stage (which holds until response).
 */
export function planNextStageDelay(
  nextStageIndex: number,
  totalStages: number,
): number {
  if (nextStageIndex >= totalStages)
    return Infinity;
  // The last stage holds — never auto-tick.
  if (nextStageIndex === totalStages - 1)
    return Infinity;
  // Defensive: bound the index into the natural-duration table.
  const i = Math.max(1, Math.min(NATURAL_DURATIONS_MS.length - 1, nextStageIndex));
  return Math.max(MIN_STAGE_DONE_MS, NATURAL_DURATIONS_MS[i]);
}

/**
 * Accelerated drain delay used AFTER the response has landed but some early
 * stages are still pending. We tick the remaining stages quickly but still
 * leave MIN_STAGE_DONE_MS between them so the user sees each one.
 */
export function planDrainDelay(
  remainingStages: number,
  visibilityBudgetMs = MIN_STAGE_DONE_MS,
): number {
  // Always at least the minimum — never instant.
  if (remainingStages <= 0)
    return 0;
  return Math.max(MIN_STAGE_DONE_MS, visibilityBudgetMs);
}

/**
 * Should we show the slow-connection hint yet?
 * Shown only when we're stuck on the LAST stage and ≥ SLOW_HINT_AFTER_MS
 * have passed since that last stage became active.
 */
export function shouldShowSlowHint(
  activeStageIndex: number,
  totalStages: number,
  msSinceActiveStageBegan: number,
): boolean {
  return (
    activeStageIndex === totalStages - 1
    && msSinceActiveStageBegan >= SLOW_HINT_AFTER_MS
  );
}
