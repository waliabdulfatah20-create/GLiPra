/**
 * Portion multiplier helpers — pure functions that scale the AI's macro
 * estimates to the user's chosen portion size.
 *
 * The AI Review Sheet keeps an immutable `aiBase` snapshot of the recognized
 * macros (numbers). The user picks a multiplier (½× / 1× / 1½× / 2×) and the
 * form's string fields are recomputed as `Math.round(aiBase[field] * mult)`
 * with the same precision convention the existing `resultToForm()` uses:
 *
 *   protein, carbs, fat, fiber, b12, zinc → one decimal place
 *   calories, vitD, magnesium → integer
 *
 * If a field is null on the base (the AI didn't return a value), the form
 * field stays the empty string regardless of multiplier — we never invent
 * a number out of "unknown".
 *
 * If the user manually edits a field while the multiplier is N, the
 * `deriveFieldBase` helper recovers the new base by dividing the typed value
 * by N. Subsequent multiplier moves scale from the user's correction.
 */

export type PortionMultiplier = 0.5 | 1 | 1.5 | 2;

export const PORTION_MULTIPLIERS: readonly PortionMultiplier[] = [0.5, 1, 1.5, 2] as const;

/**
 * The numeric snapshot of the AI's macro estimates.
 * Mirrors `RecognitionResult` minus the non-macro fields. All numeric.
 * `null` = "AI didn't return a value for this field".
 */
export type MacroBase = {
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  caloriesKcal: number | null;
  b12Mcg: number | null;
  vitaminDIu: number | null;
  magnesiumMg: number | null;
  zincMg: number | null;
  ironMg: number | null;
};

/**
 * String-typed form fields the macro grid binds to (TextInput value/onChangeText).
 * Every key is a string, including empty string for "no value".
 */
export type MacroFormStrings = {
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  caloriesKcal: string;
  b12Mcg: string;
  vitaminDIu: string;
  magnesiumMg: string;
  zincMg: string;
  ironMg: string;
};

type MacroKey = keyof MacroBase;

/** Fields with one decimal of precision. */
const DECIMAL_FIELDS: ReadonlySet<MacroKey> = new Set([
  'proteinG',
  'carbsG',
  'fatG',
  'fiberG',
  'b12Mcg',
  'zincMg',
  'ironMg',
]);

/** Fields rounded to integer. */
const INTEGER_FIELDS: ReadonlySet<MacroKey> = new Set([
  'caloriesKcal',
  'vitaminDIu',
  'magnesiumMg',
]);

/**
 * Format a single scaled numeric value to a string with the right precision.
 * Negative values clamp to 0. NaN / non-finite → empty string.
 */
function formatField(key: MacroKey, scaled: number): string {
  if (!Number.isFinite(scaled))
    return '';
  const clamped = Math.max(0, scaled);
  if (INTEGER_FIELDS.has(key))
    return Math.round(clamped).toString();
  if (DECIMAL_FIELDS.has(key))
    return clamped.toFixed(1);
  // Defensive default — should never reach this branch.
  return clamped.toString();
}

/**
 * Apply a portion multiplier to a macro base.
 * Returns a fresh `MacroFormStrings` object suitable for setting on FormState.
 * Null base values produce empty strings.
 */
export function scaleMacros(base: MacroBase, multiplier: number): MacroFormStrings {
  const out: MacroFormStrings = {
    proteinG: '',
    carbsG: '',
    fatG: '',
    fiberG: '',
    caloriesKcal: '',
    b12Mcg: '',
    vitaminDIu: '',
    magnesiumMg: '',
    zincMg: '',
    ironMg: '',
  };

  for (const k of Object.keys(out) as MacroKey[]) {
    const baseValue = base[k];
    // proteinG is `number`, the rest are `number | null`. Required-vs-optional
    // distinction at the type level — at runtime we treat them the same.
    if (baseValue == null) {
      out[k] = '';
      continue;
    }
    out[k] = formatField(k, baseValue * multiplier);
  }

  return out;
}

/**
 * Given a string value the user just typed into a field while the
 * multiplier was `multiplier`, recover the "base" the value would have at 1×.
 *
 * Returns `null` for empty string / non-numeric input so the field stays
 * "unknown" in the base.
 */
export function deriveFieldBase(currentString: string, multiplier: number): number | null {
  if (currentString === '' || multiplier === 0)
    return null;
  const parsed = Number.parseFloat(currentString);
  if (!Number.isFinite(parsed))
    return null;
  return Math.max(0, parsed) / multiplier;
}

/**
 * Snap an arbitrary number to the nearest portion-multiplier tick.
 * Used by the slider variant; the pills variant doesn't need it.
 */
export function snapToMultiplier(raw: number): PortionMultiplier {
  let best: PortionMultiplier = 1;
  let bestDist = Infinity;
  for (const m of PORTION_MULTIPLIERS) {
    const d = Math.abs(raw - m);
    if (d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  return best;
}
