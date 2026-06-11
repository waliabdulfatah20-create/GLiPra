// src/features/today/fuel-card-data.ts
// Pure display helpers for the Today "Fuel" hero card (no React, no side effects -> Vitest-safe).
// Derives the fiber and micronutrient "spots". Protein + readiness are already modeled
// (ProteinRing + readinessCard); this file only adds the new derivations.

import type {
  MicronutrientData,
  NutrientKey,
  NutrientStatus,
} from '@/features/food-log/micronutrient-constants';
import {
  getNutrientStatus,
  MICRONUTRIENT_RDAS,
} from '@/features/food-log/micronutrient-constants';

// General dietary-fiber guidance (~25 to 30 g/day). Single value for v1 (no per-sex
// personalization). Educational, not a personalized prescription -> pharmacist confirms,
// joins the attorney queue. Adjust here if the target changes.
export const FIBER_TARGET_G = 28;

// Calm status for fiber: it is NOT a safety floor like protein, so a shortfall is 'low'
// (rendered in a neutral gray), never 'red'.
export type FiberStatus = 'green' | 'amber' | 'low';

export type FiberSummary = {
  grams: number; // sanitized intake (>= 0)
  target: number;
  pct: number; // 0 to 100, integer, capped
  status: FiberStatus;
};

/** Fiber intake vs the soft target. green >= 80% | amber 50-79% | low < 50%. */
export function summarizeFiber(grams: number, target: number = FIBER_TARGET_G): FiberSummary {
  const safe = Number.isFinite(grams) && grams > 0 ? grams : 0;
  const safeTarget = target > 0 ? target : FIBER_TARGET_G;
  // Derive the band from the rounded pct we actually display, so the bar color and the
  // shown number never disagree (and we sidestep float boundary jitter like 22.4/28).
  const pct = Math.min(100, Math.round((safe / safeTarget) * 100));
  const status: FiberStatus = pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'low';
  return { grams: safe, target: safeTarget, pct, status };
}

// Fixed display order for the 5 micronutrient dots: B12, Vitamin D, Magnesium, Zinc, Iron.
export const MICRO_ORDER: readonly NutrientKey[] = [
  'b12Mcg',
  'vitaminDIu',
  'magnesiumMg',
  'zincMg',
  'ironMg',
] as const;

export type MicroDot = { key: NutrientKey; status: NutrientStatus };

export type MicroSummary = {
  statuses: MicroDot[]; // length 5, in MICRO_ORDER
  onTrack: number; // count of 'green' (>= 80% of RDA)
  total: number; // 5
  hasMicros: boolean; // false when nothing has been logged yet
};

/**
 * Summarize the 5 tracked micronutrients into per-nutrient status + an on-track count.
 * Reuses the watch card's status bands so the dots match the Nutrition screen.
 */
export function summarizeMicros(data: MicronutrientData, hasMicros: boolean): MicroSummary {
  const statuses: MicroDot[] = MICRO_ORDER.map(key => ({
    key,
    status: getNutrientStatus(data[key], MICRONUTRIENT_RDAS[key]),
  }));
  const onTrack = statuses.filter(s => s.status === 'green').length;
  return { statuses, onTrack, total: MICRO_ORDER.length, hasMicros };
}
