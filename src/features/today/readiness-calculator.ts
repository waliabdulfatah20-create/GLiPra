import type { InjectionPhase } from '@/types';

export type ReadinessInput = {
  injectionPhase: InjectionPhase;
  proteinProgress: number; // 0–1 (consumed / floor)
  hourOfDay: number; // 0–23
  nausea?: number; // 1–5
  energy?: number; // 1–5
};

export type ReadinessResult = {
  score: number; // 0–100
  guidance: string;
};

export function calculateReadinessScore(input: ReadinessInput): ReadinessResult {
  let score = 70;

  // Injection phase adjustments
  if (input.injectionPhase === 'peak_suppression') score -= 15;
  if (input.injectionPhase === 'recovery_window') score += 10;
  if (input.injectionPhase === 'injection_day') score += 5;
  // adjustment and overdue: no adjustment

  // Check-in modifiers (optional)
  if (input.nausea !== undefined) {
    score -= (input.nausea - 1) * 5;
  }
  if (input.energy !== undefined) {
    score += (input.energy - 3) * 5;
  }

  // Protein progress — penalize if behind expected pace
  const expected = Math.min(1, input.hourOfDay / 18);
  if (expected - input.proteinProgress > 0.2) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  return { score, guidance: guidanceFor(score) };
}

function guidanceFor(score: number): string {
  if (score >= 80) return 'Great day to hit your protein goal';
  if (score >= 60) return 'Moderate day, pace yourself';
  if (score >= 40) return 'Take it easy and focus on hydration';
  return 'Rest and recover today';
}
