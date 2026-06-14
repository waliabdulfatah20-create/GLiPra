/**
 * Muscle Preservation Score — pure scoring logic (Muscle-First MVP, Phase B).
 *
 * A 0-100 trailing-window estimate of how well the user is honoring the two
 * behavioral levers they control to protect lean mass on a GLP-1: PROTEIN
 * consistency (the primary lever) and RESISTANCE training (the amplifier),
 * weighted 70 / 30 (owner decision 2026-06-08).
 *
 * It estimates ADHERENCE TO HABITS, not a measurement of actual muscle mass.
 * A user is never penalized for a lever they have not had the chance to track:
 * if a lever has no data yet, its weight re-normalizes onto the tracked lever,
 * so a brand-new protein-logger is not capped at 70 for never having logged a
 * workout. Once a lever HAS data it counts; resistance is fed via
 * `deriveResistanceInput`, which counts the current in-progress week's sessions
 * (not only resolved past weeks), so logging this week marks resistance tracked.
 *
 * Pure functions only: no Supabase, no React, no Date. Safety-adjacent, so it
 * carries thorough branch tests (named `score.ts`, not `calculator.ts`, to stay
 * out of the Rule-4 vitest coverage-threshold globs while being fully tested,
 * matching the Phase A `frequency.ts` precedent).
 */

/** Protein is the primary muscle-preservation lever (owner decision: 70 / 30). */
export const MUSCLE_PROTEIN_WEIGHT = 0.7;
export const MUSCLE_RESISTANCE_WEIGHT = 0.3;
/** Minimum logged days in the protein window for protein to count as tracked. */
export const MIN_PROTEIN_DAYS = 3;
/** Minimum resolved weeks for resistance to count as tracked. */
export const MIN_RESISTANCE_WEEKS = 1;

export type MuscleScoreInput = {
  /** Hits / days-with-data over the protein window, 0..1; null if no protein data / no floor. */
  proteinAdherence: number | null;
  /** Distinct days with a food log in the window (0 when no floor is set). */
  proteinDaysTracked: number;
  /** Hit-weeks / resolved-weeks, 0..1; null if no resistance data. */
  resistanceAdherence: number | null;
  /** Resolved weeks from computeResistanceFrequency. */
  resistanceWeeksTracked: number;
};

export type MuscleFactorId = 'protein' | 'resistance';

export type MuscleFactor = {
  id: MuscleFactorId;
  /** 0..1 adherence for this lever (0 when untracked). */
  adherence: number;
  /** Effective weight after re-normalization, 0..1. */
  weight: number;
  /** Points contributed to the 0-100 score. */
  points: number;
  /** Max points this lever could contribute (round(weight * 100)). */
  possible: number;
  /** Whether the lever has enough data to count toward the score. */
  tracked: boolean;
};

export type MuscleScoreResult = {
  /** 0-100. */
  score: number;
  /** Always [protein, resistance] in that order. */
  factors: MuscleFactor[];
  proteinTracked: boolean;
  resistanceTracked: boolean;
  /** True when at least one lever is tracked (else the card shows an invite state). */
  hasEnoughData: boolean;
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function calculateMuscleScore(input: MuscleScoreInput): MuscleScoreResult {
  const proteinTracked
    = input.proteinAdherence != null && input.proteinDaysTracked >= MIN_PROTEIN_DAYS;
  const resistanceTracked
    = input.resistanceAdherence != null
      && input.resistanceWeeksTracked >= MIN_RESISTANCE_WEEKS;

  const pAdh = proteinTracked ? clamp01(input.proteinAdherence!) : 0;
  const rAdh = resistanceTracked ? clamp01(input.resistanceAdherence!) : 0;

  // Re-normalize the weights onto whichever levers are tracked, so a user is
  // never penalized for a lever they have not had the chance to log.
  let wP = 0;
  let wR = 0;
  if (proteinTracked && resistanceTracked) {
    wP = MUSCLE_PROTEIN_WEIGHT;
    wR = MUSCLE_RESISTANCE_WEIGHT;
  }
  else if (proteinTracked) {
    wP = 1;
  }
  else if (resistanceTracked) {
    wR = 1;
  }

  const pPoints = Math.round(100 * wP * pAdh);
  const rPoints = Math.round(100 * wR * rAdh);
  const score = clamp(pPoints + rPoints, 0, 100);

  const factors: MuscleFactor[] = [
    {
      id: 'protein',
      adherence: pAdh,
      weight: wP,
      points: pPoints,
      possible: Math.round(100 * wP),
      tracked: proteinTracked,
    },
    {
      id: 'resistance',
      adherence: rAdh,
      weight: wR,
      points: rPoints,
      possible: Math.round(100 * wR),
      tracked: resistanceTracked,
    },
  ];

  return {
    score,
    factors,
    proteinTracked,
    resistanceTracked,
    hasEnoughData: proteinTracked || resistanceTracked,
  };
}
