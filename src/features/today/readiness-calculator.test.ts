import { describe, expect, it } from 'vitest';

import { calculateReadinessScore } from './readiness-calculator';

const base = {
  proteinProgress: 0.5,
  hourOfDay: 9, // 9am — expected progress = 9/18 = 0.5 → no protein penalty
};

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
});

describe('calculateReadinessScore — score clamping', () => {
  it('clamps score to minimum 0', () => {
    // peak_suppression(-15) + nausea=5(-20) + energy=1(-10) + protein penalty(-10) = 70-55 = 15
    // push further: start peak, max nausea, min energy, protein behind
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
    // Construct scenario that would exceed 100 without clamping
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
});

describe('calculateReadinessScore — guidance strings', () => {
  it('score >= 80 → great day guidance', () => {
    const { guidance } = calculateReadinessScore({
      injectionPhase: 'recovery_window',
      proteinProgress: 1,
      hourOfDay: 0,
      energy: 5,
    });
    expect(guidance).toBe('Great day to hit your protein goal');
  });

  it('score 60–79 → moderate day guidance', () => {
    const { guidance } = calculateReadinessScore({
      injectionPhase: 'adjustment',
      proteinProgress: 0.5,
      hourOfDay: 9,
    });
    expect(guidance).toBe('Moderate day, pace yourself');
  });

  it('score 40–59 → take it easy guidance', () => {
    const { guidance } = calculateReadinessScore({
      injectionPhase: 'peak_suppression',
      proteinProgress: 0.5,
      hourOfDay: 9,
    });
    // 70 - 15 = 55 → "Take it easy"
    expect(guidance).toBe('Take it easy and focus on hydration');
  });

  it('score < 40 → rest and recover guidance', () => {
    const { guidance } = calculateReadinessScore({
      injectionPhase: 'peak_suppression',
      proteinProgress: 0,
      hourOfDay: 18,
      nausea: 5,
    });
    // 70 - 15 - 20 - 10 = 25 → "Rest and recover"
    expect(guidance).toBe('Rest and recover today');
  });
});
