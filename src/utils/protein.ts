/**
 * Protein floor calculator for DosePath.
 *
 * Safety-critical file — Rule 4 from CLAUDE.md requires 90%+ test coverage.
 * Pure functions only: no Supabase, no OpenAI, no side effects.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const ABSOLUTE_CEILING_G = 200;
export const ABSOLUTE_FLOOR_G = 50;
export const KIDNEY_DISEASE_MAX_G_PER_KG = 0.8;
export const HIGH_BMI_THRESHOLD = 35;
export const MAINTENANCE_MULTIPLIER = 0.9;

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityLevel = 'sedentary' | 'moderate' | 'active';
export type Phase = 'weight_loss' | 'maintenance';

export interface ProteinInput {
  weightKg: number;
  heightCm: number;
  bmi: number;
  hasKidneyDisease: boolean;
  isPregnant: boolean;
  phase: Phase;
  activityLevel: ActivityLevel;
}

export interface ProteinResult {
  /** Final recommended grams, rounded to 1 decimal place. */
  proteinFloorG: number;
  /** The weight (kg) that was used as the base for the calculation. */
  baseWeightUsedKg: number;
  /** True when the Devine-formula ideal body weight was used instead of actual weight. */
  usedIdealBodyWeight: boolean;
  /** True when the kidney-disease cap reduced the calculated value. */
  cappedByKidneyDisease: boolean;
  /** True when the pregnancy minimum raised the final value to at least 80 g. */
  flooredByPregnancy: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  moderate: 1.4,
  active: 1.6,
};

/**
 * Devine formula averaged across sexes (no sex collected in onboarding).
 * Returns ideal body weight in kg.
 *
 * Male:   50    + 2.3 × (inches_over_5_feet)
 * Female: 45.5  + 2.3 × (inches_over_5_feet)
 * Average: 47.75 + 2.3 × (inches_over_5_feet)
 */
function devineIdealBodyWeightKg(heightCm: number): number {
  const heightInches = heightCm / 2.54;
  const inchesOver60 = heightInches - 60;
  return 47.75 + 2.3 * inchesOver60;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Calculates the protein floor (minimum daily protein in grams) for a user
 * on a GLP-1 medication.
 *
 * Logic order:
 *  1. Select base weight (ideal body weight when BMI > 35, else actual weight).
 *  2. Apply activity-level multiplier (g/kg).
 *  3. Cap at kidney-disease limit if applicable.
 *  4. Apply maintenance-phase multiplier if applicable.
 *  5. Apply pregnancy floor if applicable (80 g minimum).
 *  6. Clamp to [ABSOLUTE_FLOOR_G, ABSOLUTE_CEILING_G].
 *  7. Round to 1 decimal place.
 */
export function calculateProteinFloor(input: ProteinInput): ProteinResult {
  const {
    weightKg,
    heightCm,
    bmi,
    hasKidneyDisease,
    isPregnant,
    phase,
    activityLevel,
  } = input;

  // Step 1 — base weight
  const usedIdealBodyWeight = bmi > HIGH_BMI_THRESHOLD;
  const baseWeightUsedKg = usedIdealBodyWeight
    ? devineIdealBodyWeightKg(heightCm)
    : weightKg;

  // Step 2 — raw protein from activity multiplier
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  let proteinG = baseWeightUsedKg * multiplier;

  // Step 3 — kidney-disease cap
  const kidneyCapG = baseWeightUsedKg * KIDNEY_DISEASE_MAX_G_PER_KG;
  const cappedByKidneyDisease = hasKidneyDisease && proteinG > kidneyCapG;
  if (cappedByKidneyDisease) {
    proteinG = kidneyCapG;
  }

  // Step 4 — maintenance multiplier
  if (phase === 'maintenance') {
    proteinG = proteinG * MAINTENANCE_MULTIPLIER;
  }

  // Step 5 — pregnancy floor (80 g minimum, applied after phase multiplier)
  const PREGNANCY_FLOOR_G = 80;
  const flooredByPregnancy = isPregnant && proteinG < PREGNANCY_FLOOR_G;
  if (flooredByPregnancy) {
    proteinG = PREGNANCY_FLOOR_G;
  }

  // Step 6 — absolute clamp
  proteinG = Math.max(ABSOLUTE_FLOOR_G, Math.min(ABSOLUTE_CEILING_G, proteinG));

  // Step 7 — round to 1 decimal
  const proteinFloorG = Math.round(proteinG * 10) / 10;

  return {
    proteinFloorG,
    baseWeightUsedKg,
    usedIdealBodyWeight,
    cappedByKidneyDisease,
    flooredByPregnancy,
  };
}
