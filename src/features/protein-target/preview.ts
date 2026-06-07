/**
 * Protein-target preview — pure assembly around the Rule-4 calculator.
 *
 * Turns the editable Settings inputs into a ProteinInput and runs the existing
 * `calculateProteinFloor` (src/utils/protein.ts, unchanged). Returns null until
 * the required body inputs are present, so the editor can show a live preview as
 * the user fills the form. Pure: no Supabase, no side effects.
 */

import type { ActivityLevel, Phase, ProteinResult } from '@/utils/protein';
import { calculateProteinFloor } from '@/utils/protein';

export type ProteinPreviewInputs = {
  weightKg: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
  hasKidneyDisease: boolean;
  isPregnant: boolean;
  phase: Phase;
};

/**
 * Compute the protein floor result for the given inputs, or null when weight,
 * height, or activity level is missing or non-positive. BMI is derived the same
 * way onboarding persists it (weight / height-in-metres squared).
 */
export function previewProteinFloor(i: ProteinPreviewInputs): ProteinResult | null {
  if (
    i.weightKg == null
    || i.weightKg <= 0
    || i.heightCm == null
    || i.heightCm <= 0
    || i.activityLevel == null
  ) {
    return null;
  }

  const heightM = i.heightCm / 100;
  const bmi = i.weightKg / (heightM * heightM);

  return calculateProteinFloor({
    weightKg: i.weightKg,
    heightCm: i.heightCm,
    bmi,
    hasKidneyDisease: i.hasKidneyDisease,
    isPregnant: i.isPregnant,
    phase: i.phase,
    activityLevel: i.activityLevel,
  });
}
