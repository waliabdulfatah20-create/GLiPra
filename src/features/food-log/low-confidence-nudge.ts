// Low-confidence confirmation nudge — Scan Accuracy Cascade, item B.
//
// The AI photo/voice recognition returns one self-reported confidence score
// (0-100). When it is genuinely low, the AIReviewSheet should actively nudge
// the user to double-check the fields that most affect their protein-floor
// tracking (protein + serving size) before logging, rather than relying on the
// passive `~XX%` chip alone.
//
// This is microcopy only, not clinical content — no attorney gate, no
// DisclaimerBanner. Pure decision logic lives here so it is unit-testable,
// mirroring recent-foods.ts / pro-insight-helpers.ts.

/** Percent below which the AI is considered unsure enough to nudge the user. */
export const LOW_CONFIDENCE_THRESHOLD = 55;

/**
 * True when the AI confidence is known AND below the threshold.
 *
 * Unknown confidence (null / undefined) returns false: the absence of a score
 * must never imply low confidence, or every legacy response would alarm the
 * user. The threshold is exclusive — exactly 55 does NOT nudge.
 */
export function shouldShowLowConfidenceNudge(
  confidencePercent: number | null | undefined,
): boolean {
  if (confidencePercent == null)
    return false;
  return confidencePercent < LOW_CONFIDENCE_THRESHOLD;
}
