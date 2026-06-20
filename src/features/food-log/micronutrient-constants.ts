// src/features/food-log/micronutrient-constants.ts
// US RDA targets and pure helper functions for MicronutrientWatchCard.
// No React, no side effects — safe to Vitest.

export const MICRONUTRIENT_RDAS = {
  magnesiumMg: 420,
  zincMg: 11,
  b12Mcg: 2.4,
  vitaminDIu: 600,
  // Iron: 18 mg = the protective target for adult women 19-50 (the GLP-1 audience
  // skews female; iron + hair thinning is a top concern). 8 mg is the men /
  // post-menopausal value. Single RDA for v1 (no sex field). Pharmacist to confirm.
  ironMg: 18,
  // Calcium: 1200 mg = the protective IOM RDA (women 51+ / men 71+). Rapid GLP-1
  // weight loss carries a documented bone-density risk, so we use the higher
  // at-risk value rather than the 1000 mg adult-19-50 baseline. Pharmacist to confirm.
  calciumMg: 1200,
} as const;

export type NutrientKey = keyof typeof MICRONUTRIENT_RDAS;
export type NutrientStatus = 'green' | 'amber' | 'red';

/** % of RDA achieved, capped at 100, rounded to nearest integer */
export function getNutrientPct(actual: number, rda: number): number {
  if (rda <= 0 || !Number.isFinite(rda))
    return 0;
  return Math.min(100, Math.round((Math.max(0, actual) / rda) * 100));
}

/** green >= 80% | amber 50-79% | red < 50% */
export function getNutrientStatus(actual: number, rda: number): NutrientStatus {
  if (rda <= 0 || !Number.isFinite(rda))
    return 'red';
  const pct = (actual / rda) * 100;
  if (pct >= 80)
    return 'green';
  if (pct >= 50)
    return 'amber';
  return 'red';
}

export type MicronutrientData = { [K in NutrientKey]: number };

/** Count of nutrients strictly below 50% of their RDA */
export function getGapCount(data: MicronutrientData): number {
  return (Object.keys(MICRONUTRIENT_RDAS) as NutrientKey[]).filter(
    key => data[key] / MICRONUTRIENT_RDAS[key] < 0.5,
  ).length;
}

// Rule 9: no condition names. Rule 10: food strategy only.
const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  b12Mcg: 'B12',
  vitaminDIu: 'Vitamin D',
  magnesiumMg: 'Magnesium',
  zincMg: 'Zinc',
  ironMg: 'Iron',
  calciumMg: 'Calcium',
};

const NUTRIENT_FOOD_TIPS: Record<NutrientKey, string> = {
  b12Mcg: 'eggs, Greek yogurt, or fortified cereals',
  vitaminDIu: 'fatty fish, egg yolks, or fortified milk',
  magnesiumMg: 'nuts, seeds, or leafy greens',
  zincMg: 'beef, pumpkin seeds, or lentils',
  ironMg: 'lean red meat, lentils, spinach, or fortified cereals',
  calciumMg: 'dairy, fortified plant milk, tofu, leafy greens, or canned fish with bones',
};

/**
 * Returns a food-strategy tip naming up to 2 gap nutrients.
 * Returns null when no gaps exist.
 */
export function getGapBannerText(data: MicronutrientData): string | null {
  const gaps = (Object.keys(MICRONUTRIENT_RDAS) as NutrientKey[]).filter(
    key => data[key] / MICRONUTRIENT_RDAS[key] < 0.5,
  );
  if (gaps.length === 0)
    return null;
  const named = gaps.slice(0, 2).map(k => NUTRIENT_LABELS[k]).join(' and ');
  const tips = gaps.slice(0, 2).map(k => NUTRIENT_FOOD_TIPS[k]).join(', or ');
  return `Low ${named} today. Try ${tips}.`;
}
