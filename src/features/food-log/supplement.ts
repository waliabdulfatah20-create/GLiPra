// src/features/food-log/supplement.ts
// Pure helpers for the per-nutrient supplement quick-add. No React, no network —
// safe to Vitest. The app never suggests doses: the amount comes from the user's
// supplement label. A supplement is logged as a food_logs row (source 'supplement')
// carrying exactly one micronutrient, so useDailyMacros sums it like any other log.

import type { NutrientKey } from './micronutrient-constants';
import type { SupplementEntry } from './types';
import { MICRONUTRIENT_RDAS } from './micronutrient-constants';

export type SupplementUnit = 'mg' | 'mcg' | 'IU';

export type SupplementNutrient = {
  key: NutrientKey;
  /** i18n key for the short label (shared with the watch card). */
  labelKey: string;
  /** English display name used as the log entry name (e.g. "Vitamin D"). */
  name: string;
  unit: SupplementUnit;
  rda: number;
};

// Order mirrors the Micronutrient Watch card grid.
export const SUPPLEMENT_NUTRIENTS: SupplementNutrient[] = [
  { key: 'magnesiumMg', labelKey: 'log.nutrient_magnesium', name: 'Magnesium', unit: 'mg', rda: MICRONUTRIENT_RDAS.magnesiumMg },
  { key: 'zincMg', labelKey: 'log.nutrient_zinc', name: 'Zinc', unit: 'mg', rda: MICRONUTRIENT_RDAS.zincMg },
  { key: 'ironMg', labelKey: 'log.nutrient_iron', name: 'Iron', unit: 'mg', rda: MICRONUTRIENT_RDAS.ironMg },
  { key: 'b12Mcg', labelKey: 'log.nutrient_b12', name: 'Vitamin B12', unit: 'mcg', rda: MICRONUTRIENT_RDAS.b12Mcg },
  { key: 'vitaminDIu', labelKey: 'log.nutrient_vitd', name: 'Vitamin D', unit: 'IU', rda: MICRONUTRIENT_RDAS.vitaminDIu },
];

export function getSupplementNutrient(key: NutrientKey): SupplementNutrient {
  // SUPPLEMENT_NUTRIENTS covers every NutrientKey, so this never returns undefined.
  return SUPPLEMENT_NUTRIENTS.find(n => n.key === key) ?? SUPPLEMENT_NUTRIENTS[0];
}

const EMPTY_MICROS: Record<NutrientKey, number | null> = {
  magnesiumMg: null,
  zincMg: null,
  b12Mcg: null,
  vitaminDIu: null,
  ironMg: null,
};

/** mcg keeps one decimal (B12 doses are tiny); mg/IU round to a whole number. */
function roundAmount(amount: number, unit: SupplementUnit): number {
  return unit === 'mcg' ? Math.round(amount * 10) / 10 : Math.round(amount);
}

/**
 * Build a SupplementEntry with ONLY the target nutrient set.
 * Returns null when the amount is not a positive finite number.
 */
export function buildSupplementEntry(key: NutrientKey, amount: number): SupplementEntry | null {
  if (!Number.isFinite(amount) || amount <= 0)
    return null;
  const nutrient = getSupplementNutrient(key);
  const value = roundAmount(amount, nutrient.unit);
  return {
    name: nutrient.name,
    servingDescription: `${value} ${nutrient.unit}`,
    ...EMPTY_MICROS,
    [key]: value,
  };
}

/**
 * The single logged micronutrient on a supplement row, for display in the food
 * log (e.g. the right-hand amount). Returns null if no micro is present.
 */
export function getSupplementAmount(
  entry: Pick<SupplementEntry, NutrientKey>,
): { value: number; unit: SupplementUnit } | null {
  for (const n of SUPPLEMENT_NUTRIENTS) {
    const v = entry[n.key];
    if (v != null && v > 0)
      return { value: v, unit: n.unit };
  }
  return null;
}
