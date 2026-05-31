import type { InjectionPhase } from '@/types';

export type ReadinessInput = {
  injectionPhase: InjectionPhase;
  proteinProgress: number; // 0–1 (consumed / floor)
  hourOfDay: number; // 0–23
  nausea?: number; // 1–5
  energy?: number; // 1–5
  prevDayProteinRatio?: number; // yesterday consumed/floor (0–1+)
  newDoseWeek?: boolean; // true when medicationStatus === 'starting'
  streakActive?: boolean; // true when streak is alive
};

export type FactorId
  = | 'injection_phase'
    | 'protein_pace'
    | 'prev_day_protein'
    | 'nausea'
    | 'energy'
    | 'new_dose_week'
    | 'streak';

export type FactorDelta = { id: FactorId; delta: number };

export type ReadinessResult = {
  score: number; // 0–100
  factors: FactorDelta[]; // only non-zero deltas included
};

export function calculateReadinessScore(input: ReadinessInput): ReadinessResult {
  let score = 70;
  const factors: FactorDelta[] = [];

  // Injection phase adjustments
  if (input.injectionPhase === 'peak_suppression') {
    score -= 15;
    factors.push({ id: 'injection_phase', delta: -15 });
  }
  else if (input.injectionPhase === 'recovery_window') {
    score += 10;
    factors.push({ id: 'injection_phase', delta: 10 });
  }
  else if (input.injectionPhase === 'injection_day') {
    score += 5;
    factors.push({ id: 'injection_phase', delta: 5 });
  }
  // adjustment and overdue: delta = 0, no factor pushed

  // Nausea modifier
  if (input.nausea !== undefined) {
    const delta = -(input.nausea - 1) * 5;
    score += delta;
    if (delta !== 0) {
      factors.push({ id: 'nausea', delta });
    }
  }

  // Energy modifier
  if (input.energy !== undefined) {
    const delta = (input.energy - 3) * 5;
    score += delta;
    if (delta !== 0) {
      factors.push({ id: 'energy', delta });
    }
  }

  // Protein progress — penalize if behind expected pace
  const expected = Math.min(1, input.hourOfDay / 18);
  if (expected - input.proteinProgress > 0.2) {
    score -= 10;
    factors.push({ id: 'protein_pace', delta: -10 });
  }

  // Previous day protein
  if (input.prevDayProteinRatio !== undefined) {
    if (input.prevDayProteinRatio < 0.8) {
      score -= 10;
      factors.push({ id: 'prev_day_protein', delta: -10 });
    }
    else if (input.prevDayProteinRatio >= 1.0) {
      score += 5;
      factors.push({ id: 'prev_day_protein', delta: 5 });
    }
  }

  // New dose week
  if (input.newDoseWeek) {
    score -= 10;
    factors.push({ id: 'new_dose_week', delta: -10 });
  }

  // Streak momentum
  if (input.streakActive) {
    score += 5;
    factors.push({ id: 'streak', delta: 5 });
  }

  score = Math.max(0, Math.min(100, score));

  return { score, factors };
}
