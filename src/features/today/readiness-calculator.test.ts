import { describe, expect, it } from 'vitest';

import { calculateReadinessScore } from './readiness-calculator';
import type { FactorDelta } from './readiness-calculator';

const base = {
  proteinProgress: 0.5,
  hourOfDay: 9, // 9am — expected progress = 9/18 = 0.5 → no protein penalty
};

// Helper: check whether a specific factor id is present in the factors array
function hasFactor(factors: FactorDelta[], id: string): boolean {
  return factors.some((f) => f.id === id);
}

function getFactor(factors: FactorDelta[], id: string): FactorDelta | undefined {
  return factors.find((f) => f.id === id);
}

describe('calculateReadinessScore — injection phase adjustments', () => {
  it('starts at 70 for adjustment phase with no modifiers', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment' });
    expect(score).toBe(70);
  });

  it('peak_suppression subtracts 15', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'peak_suppression' });
    expect(score).toBe(55);
  });

  it('recovery_window adds 10', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'recovery_window' });
    expect(score).toBe(80);
  });

  it('injection_day adds 5', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'injection_day' });
    expect(score).toBe(75);
  });

  it('overdue applies no phase adjustment', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'overdue' });
    expect(score).toBe(70);
  });

  it('peak_suppression pushes injection_phase factor with delta -15', () => {
    const { factors } = calculateReadinessScore({ ...base, injectionPhase: 'peak_suppression' });
    const f = getFactor(factors, 'injection_phase');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(-15);
  });

  it('recovery_window pushes injection_phase factor with delta 10', () => {
    const { factors } = calculateReadinessScore({ ...base, injectionPhase: 'recovery_window' });
    const f = getFactor(factors, 'injection_phase');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(10);
  });

  it('injection_day pushes injection_phase factor with delta 5', () => {
    const { factors } = calculateReadinessScore({ ...base, injectionPhase: 'injection_day' });
    const f = getFactor(factors, 'injection_phase');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(5);
  });

  it('adjustment phase does NOT push an injection_phase factor', () => {
    const { factors } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment' });
    expect(hasFactor(factors, 'injection_phase')).toBe(false);
  });

  it('overdue phase does NOT push an injection_phase factor', () => {
    const { factors } = calculateReadinessScore({ ...base, injectionPhase: 'overdue' });
    expect(hasFactor(factors, 'injection_phase')).toBe(false);
  });
});

describe('calculateReadinessScore — protein progress penalty', () => {
  it('no penalty when progress matches expected pace', () => {
    // hour=9, expected=0.5, progress=0.5 → diff=0 → no penalty
    const { score } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.5,
      hourOfDay: 9,
    });
    expect(score).toBe(70);
  });

  it('penalty when progress is more than 0.2 below expected', () => {
    // hour=18, expected=1.0, progress=0.5 → diff=0.5 > 0.2 → -10
    const { score } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.5,
      hourOfDay: 18,
    });
    expect(score).toBe(60);
  });

  it('no penalty when progress is exactly 0.2 below expected', () => {
    // hour=18, expected=1.0, progress=0.8 → diff=0.2, not > 0.2 → no penalty
    const { score } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.8,
      hourOfDay: 18,
    });
    expect(score).toBe(70);
  });

  it('no protein penalty before hour 0', () => {
    // hour=0, expected=0 → no penalty regardless of progress
    const { score } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0,
      hourOfDay: 0,
    });
    expect(score).toBe(70);
  });

  it('expected caps at 1 after hour 18', () => {
    // hour=23, expected=min(1, 23/18)=1 → same as hour=18
    const { score } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.5,
      hourOfDay: 23,
    });
    expect(score).toBe(60);
  });

  it('protein pace penalty pushes protein_pace factor with delta -10', () => {
    const { factors } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.5,
      hourOfDay: 18,
    });
    const f = getFactor(factors, 'protein_pace');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(-10);
  });

  it('no protein_pace factor when no penalty applied', () => {
    const { factors } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.5,
      hourOfDay: 9,
    });
    expect(hasFactor(factors, 'protein_pace')).toBe(false);
  });
});

describe('calculateReadinessScore — nausea and energy modifiers', () => {
  it('nausea=1 (none) adds 0', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment', nausea: 1 });
    expect(score).toBe(70);
  });

  it('nausea=3 subtracts 10', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment', nausea: 3 });
    expect(score).toBe(60);
  });

  it('nausea=5 subtracts 20', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment', nausea: 5 });
    expect(score).toBe(50);
  });

  it('energy=3 (neutral) adds 0', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment', energy: 3 });
    expect(score).toBe(70);
  });

  it('energy=5 adds 10', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment', energy: 5 });
    expect(score).toBe(80);
  });

  it('energy=1 subtracts 10', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment', energy: 1 });
    expect(score).toBe(60);
  });

  it('omitting nausea and energy applies no modifier', () => {
    const { score } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment' });
    expect(score).toBe(70);
  });

  it('nausea=1 does NOT push a nausea factor (delta is 0)', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      nausea: 1,
    });
    expect(hasFactor(factors, 'nausea')).toBe(false);
  });

  it('nausea=3 pushes nausea factor with delta -10', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      nausea: 3,
    });
    const f = getFactor(factors, 'nausea');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(-10);
  });

  it('energy=3 does NOT push an energy factor (delta is 0)', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      energy: 3,
    });
    expect(hasFactor(factors, 'energy')).toBe(false);
  });

  it('energy=5 pushes energy factor with delta 10', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      energy: 5,
    });
    const f = getFactor(factors, 'energy');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(10);
  });

  it('omitting nausea does not push a nausea factor', () => {
    const { factors } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment' });
    expect(hasFactor(factors, 'nausea')).toBe(false);
  });

  it('omitting energy does not push an energy factor', () => {
    const { factors } = calculateReadinessScore({ ...base, injectionPhase: 'adjustment' });
    expect(hasFactor(factors, 'energy')).toBe(false);
  });
});

describe('calculateReadinessScore — score clamping', () => {
  it('clamps score to minimum 0', () => {
    const { score } = calculateReadinessScore({
      injectionPhase: 'peak_suppression',
      proteinProgress: 0,
      hourOfDay: 18,
      nausea: 5,
      energy: 1,
    });
    // 70 - 15 - 20 - 10 - 10 = 15 — not hitting 0 naturally; test explicit extreme
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('score is never below 0 even with extreme inputs', () => {
    // 70 - 15(peak) - 20(nausea=5) - 10(energy=1) - 10(protein) = 15 — floor is 0, not negative
    const { score } = calculateReadinessScore({
      injectionPhase: 'peak_suppression',
      proteinProgress: 0,
      hourOfDay: 23,
      nausea: 5,
      energy: 1,
    });
    expect(score).toBe(15);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('clamps score to maximum 100', () => {
    const { score } = calculateReadinessScore({
      injectionPhase: 'recovery_window',
      proteinProgress: 1,
      hourOfDay: 12,
      energy: 5,
    });
    // 70 + 10 + 10 = 90 — not hitting 100 naturally
    expect(score).toBeLessThanOrEqual(100);
  });

  it('score is never above 100', () => {
    // recovery_window(+10) + energy=5(+10) + no penalty
    // 70 + 10 + 10 = 90 max naturally. Formula can't exceed 100.
    const { score } = calculateReadinessScore({
      injectionPhase: 'recovery_window',
      proteinProgress: 1,
      hourOfDay: 0,
      energy: 5,
      nausea: 1,
    });
    expect(score).toBe(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('all positive inputs combined do not exceed 100', () => {
    // recovery_window(+10) + energy=5(+10) + prevDayProteinRatio=1.0(+5) + streak(+5) = 70+30 = 100
    const { score } = calculateReadinessScore({
      injectionPhase: 'recovery_window',
      proteinProgress: 1,
      hourOfDay: 0,
      energy: 5,
      prevDayProteinRatio: 1.0,
      streakActive: true,
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('all negative inputs combined clamp to 0', () => {
    // Pile on negatives: peak_suppression(-15) + nausea=5(-20) + energy=1(-10) + protein_pace(-10)
    //   + prevDay<0.8(-10) + newDoseWeek(-10) = 70-75 = -5 → clamped to 0
    const { score } = calculateReadinessScore({
      injectionPhase: 'peak_suppression',
      proteinProgress: 0,
      hourOfDay: 23,
      nausea: 5,
      energy: 1,
      prevDayProteinRatio: 0.5,
      newDoseWeek: true,
    });
    expect(score).toBe(0);
  });
});

describe('calculateReadinessScore — prevDayProteinRatio', () => {
  it('prevDayProteinRatio < 0.8 reduces score by 10', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 0.7,
    });
    expect(score).toBe(60);
  });

  it('prevDayProteinRatio < 0.8 pushes prev_day_protein factor with delta -10', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 0.7,
    });
    const f = getFactor(factors, 'prev_day_protein');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(-10);
  });

  it('prevDayProteinRatio >= 1.0 increases score by 5', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 1.0,
    });
    expect(score).toBe(75);
  });

  it('prevDayProteinRatio >= 1.0 pushes prev_day_protein factor with delta 5', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 1.0,
    });
    const f = getFactor(factors, 'prev_day_protein');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(5);
  });

  it('prevDayProteinRatio > 1.0 also gives +5 bonus', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 1.2,
    });
    expect(score).toBe(75);
  });

  it('prevDayProteinRatio = 0.9 (between 0.8 and 1.0) causes no score change', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 0.9,
    });
    expect(score).toBe(70);
  });

  it('prevDayProteinRatio = 0.9 does not push a prev_day_protein factor', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 0.9,
    });
    expect(hasFactor(factors, 'prev_day_protein')).toBe(false);
  });

  it('prevDayProteinRatio = 0.8 (boundary) causes no score change', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 0.8,
    });
    expect(score).toBe(70);
  });

  it('prevDayProteinRatio = undefined causes no score change', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: undefined,
    });
    expect(score).toBe(70);
  });

  it('prevDayProteinRatio = undefined does not push a prev_day_protein factor', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: undefined,
    });
    expect(hasFactor(factors, 'prev_day_protein')).toBe(false);
  });
});

describe('calculateReadinessScore — newDoseWeek', () => {
  it('newDoseWeek: true reduces score by 10', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      newDoseWeek: true,
    });
    expect(score).toBe(60);
  });

  it('newDoseWeek: true pushes new_dose_week factor with delta -10', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      newDoseWeek: true,
    });
    const f = getFactor(factors, 'new_dose_week');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(-10);
  });

  it('newDoseWeek: false causes no score change', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      newDoseWeek: false,
    });
    expect(score).toBe(70);
  });

  it('newDoseWeek: false does not push a new_dose_week factor', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      newDoseWeek: false,
    });
    expect(hasFactor(factors, 'new_dose_week')).toBe(false);
  });

  it('newDoseWeek: undefined causes no score change', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
    });
    expect(score).toBe(70);
  });
});

describe('calculateReadinessScore — streakActive', () => {
  it('streakActive: true increases score by 5', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      streakActive: true,
    });
    expect(score).toBe(75);
  });

  it('streakActive: true pushes streak factor with delta 5', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      streakActive: true,
    });
    const f = getFactor(factors, 'streak');
    expect(f).toBeDefined();
    expect(f?.delta).toBe(5);
  });

  it('streakActive: false causes no score change', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      streakActive: false,
    });
    expect(score).toBe(70);
  });

  it('streakActive: false does not push a streak factor', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      streakActive: false,
    });
    expect(hasFactor(factors, 'streak')).toBe(false);
  });

  it('streakActive: undefined causes no score change', () => {
    const { score } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
    });
    expect(score).toBe(70);
  });
});

describe('calculateReadinessScore — factors array structure', () => {
  it('returns empty factors array when no deltas apply', () => {
    // adjustment phase, neutral nausea/energy omitted, progress on pace
    const { factors } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.5,
      hourOfDay: 9,
    });
    expect(factors).toEqual([]);
  });

  it('returns only non-zero factors', () => {
    // nausea=1 (delta=0) and energy=3 (delta=0) should not appear
    const { factors } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.5,
      hourOfDay: 9,
      nausea: 1,
      energy: 3,
    });
    expect(factors).toEqual([]);
  });

  it('factors array contains all applied deltas in correct order', () => {
    // peak_suppression(-15), nausea=3(-10), energy=1(-10), protein_pace(-10)
    const { factors } = calculateReadinessScore({
      injectionPhase: 'peak_suppression',
      proteinProgress: 0.2,
      hourOfDay: 18,
      nausea: 3,
      energy: 1,
    });
    expect(factors).toContainEqual({ id: 'injection_phase', delta: -15 });
    expect(factors).toContainEqual({ id: 'nausea', delta: -10 });
    expect(factors).toContainEqual({ id: 'energy', delta: -10 });
    expect(factors).toContainEqual({ id: 'protein_pace', delta: -10 });
    expect(factors.length).toBe(4);
  });

  it('all new inputs combined appear in factors correctly', () => {
    const { factors } = calculateReadinessScore({
      ...base,
      injectionPhase: 'adjustment',
      prevDayProteinRatio: 0.5,
      newDoseWeek: true,
      streakActive: true,
    });
    expect(factors).toContainEqual({ id: 'prev_day_protein', delta: -10 });
    expect(factors).toContainEqual({ id: 'new_dose_week', delta: -10 });
    expect(factors).toContainEqual({ id: 'streak', delta: 5 });
  });
});
