import type { ReadinessResult } from './readiness-calculator';
import { describe, expect, it } from 'vitest';
import { buildReadinessCard } from './readiness-display';

// Returns the key as-is — makes assertions easy
const mockT = (key: string) => key;

// Helper to build a minimal ReadinessResult
function makeResult(score: number, factors: ReadinessResult['factors'] = []): ReadinessResult {
  return { score, factors };
}

describe('buildReadinessCard', () => {
  // --- Headline tests ---

  it('uses injection_day headline for injection_day phase', () => {
    const card = buildReadinessCard(makeResult(70), 'injection_day', mockT);
    expect(card.headline).toBe('readiness.headlines.injection_day');
  });

  it('uses peak_suppression headline for peak_suppression phase', () => {
    const card = buildReadinessCard(makeResult(70), 'peak_suppression', mockT);
    expect(card.headline).toBe('readiness.headlines.peak_suppression');
  });

  it('uses adjustment headline for adjustment phase', () => {
    const card = buildReadinessCard(makeResult(70), 'adjustment', mockT);
    expect(card.headline).toBe('readiness.headlines.adjustment');
  });

  it('uses recovery_window headline for recovery_window phase', () => {
    const card = buildReadinessCard(makeResult(70), 'recovery_window', mockT);
    expect(card.headline).toBe('readiness.headlines.recovery_window');
  });

  it('uses overdue headline for overdue phase', () => {
    const card = buildReadinessCard(makeResult(70), 'overdue', mockT);
    expect(card.headline).toBe('readiness.headlines.overdue');
  });

  // --- Score passthrough ---

  it('passes score through unchanged', () => {
    const card = buildReadinessCard(makeResult(83), 'adjustment', mockT);
    expect(card.score).toBe(83);
  });

  it('passes score of 0 through unchanged', () => {
    const card = buildReadinessCard(makeResult(0), 'overdue', mockT);
    expect(card.score).toBe(0);
  });

  // --- Factor mapping ---

  it('gives sentiment "negative" to a factor with negative delta', () => {
    const result = makeResult(55, [{ id: 'nausea', delta: -10 }]);
    const card = buildReadinessCard(result, 'adjustment', mockT);
    expect(card.factors[0].sentiment).toBe('negative');
  });

  it('gives sentiment "positive" to a factor with positive delta', () => {
    const result = makeResult(80, [{ id: 'energy', delta: 10 }]);
    const card = buildReadinessCard(result, 'adjustment', mockT);
    expect(card.factors[0].sentiment).toBe('positive');
  });

  it('sets label to the t() key string for a factor', () => {
    const result = makeResult(70, [{ id: 'protein_pace', delta: -10 }]);
    const card = buildReadinessCard(result, 'adjustment', mockT);
    expect(card.factors[0].label).toBe('readiness.factor_labels.protein_pace');
  });

  // --- Sort order ---

  it('sorts negatives first (most negative first), then positives', () => {
    const result = makeResult(60, [
      { id: 'energy', delta: 5 },
      { id: 'injection_phase', delta: -15 },
      { id: 'protein_pace', delta: -10 },
    ]);
    const card = buildReadinessCard(result, 'peak_suppression', mockT);
    expect(card.factors[0].delta).toBe(-15); // injection_phase
    expect(card.factors[1].delta).toBe(-10); // protein_pace
    expect(card.factors[2].delta).toBe(5); // energy
  });

  // --- Tip selection ---

  it('picks the factor with the worst (most negative) delta for the tip', () => {
    const result = makeResult(45, [
      { id: 'injection_phase', delta: -15 },
      { id: 'protein_pace', delta: -10 },
    ]);
    const card = buildReadinessCard(result, 'peak_suppression', mockT);
    // injection_phase wins (delta -15) and uses phase suffix
    expect(card.tip).toBe('readiness.tips.injection_phase_peak_suppression');
  });

  it('tie-break: injection_phase beats protein_pace when both at same delta', () => {
    const result = makeResult(50, [
      { id: 'injection_phase', delta: -10 },
      { id: 'protein_pace', delta: -10 },
    ]);
    const card = buildReadinessCard(result, 'adjustment', mockT);
    expect(card.tip).toBe('readiness.tips.injection_phase_adjustment');
  });

  it('tie-break: protein_pace beats other factors when injection_phase absent', () => {
    const result = makeResult(50, [
      { id: 'protein_pace', delta: -10 },
      { id: 'nausea', delta: -10 },
    ]);
    const card = buildReadinessCard(result, 'recovery_window', mockT);
    expect(card.tip).toBe('readiness.tips.protein_pace');
  });

  it('falls back to injection_phase tip when no negative factors exist', () => {
    const result = makeResult(90, [
      { id: 'energy', delta: 5 },
      { id: 'streak', delta: 5 },
    ]);
    const card = buildReadinessCard(result, 'recovery_window', mockT);
    expect(card.tip).toBe('readiness.tips.injection_phase_recovery_window');
  });

  it('injection_phase tip key includes the current phase, not just id', () => {
    const result = makeResult(55, [{ id: 'injection_phase', delta: -15 }]);
    const card = buildReadinessCard(result, 'peak_suppression', mockT);
    expect(card.tip).toBe('readiness.tips.injection_phase_peak_suppression');
  });

  it('non-injection_phase factor tip uses id without phase suffix', () => {
    const result = makeResult(60, [{ id: 'nausea', delta: -10 }]);
    const card = buildReadinessCard(result, 'adjustment', mockT);
    expect(card.tip).toBe('readiness.tips.nausea');
  });
});
