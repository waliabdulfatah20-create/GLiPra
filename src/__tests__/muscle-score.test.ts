import { describe, expect, it } from 'vitest';

import {
  calculateMuscleScore,
  MUSCLE_PROTEIN_WEIGHT,
  MUSCLE_RESISTANCE_WEIGHT,
} from '@/features/muscle-score/score';

describe('calculateMuscleScore', () => {
  it('returns an empty, zero-score result when neither lever has data', () => {
    const r = calculateMuscleScore({
      proteinAdherence: null,
      proteinDaysTracked: 0,
      resistanceAdherence: null,
      resistanceWeeksTracked: 0,
    });
    expect(r.score).toBe(0);
    expect(r.hasEnoughData).toBe(false);
    expect(r.proteinTracked).toBe(false);
    expect(r.resistanceTracked).toBe(false);
  });

  it('scores protein alone at full weight when resistance is untracked (new user)', () => {
    const r = calculateMuscleScore({
      proteinAdherence: 0.9,
      proteinDaysTracked: 10,
      resistanceAdherence: null,
      resistanceWeeksTracked: 0,
    });
    expect(r.proteinTracked).toBe(true);
    expect(r.resistanceTracked).toBe(false);
    expect(r.score).toBe(90); // wP re-normalized to 1.0
    const protein = r.factors.find(f => f.id === 'protein')!;
    expect(protein.possible).toBe(100);
    expect(protein.points).toBe(90);
  });

  it('blends 70 / 30 when both levers are tracked (perfect = 100)', () => {
    const r = calculateMuscleScore({
      proteinAdherence: 1,
      proteinDaysTracked: 28,
      resistanceAdherence: 1,
      resistanceWeeksTracked: 4,
    });
    expect(r.score).toBe(100);
    expect(r.factors.find(f => f.id === 'protein')!.points).toBe(70);
    expect(r.factors.find(f => f.id === 'resistance')!.points).toBe(30);
  });

  it('caps a protein-perfect, never-training user at 70 once resistance is tracked', () => {
    const r = calculateMuscleScore({
      proteinAdherence: 1,
      proteinDaysTracked: 28,
      resistanceAdherence: 0,
      resistanceWeeksTracked: 2, // resolved weeks exist -> resistance counts
    });
    expect(r.resistanceTracked).toBe(true);
    expect(r.score).toBe(70);
  });

  it('sums partial contributions from both levers', () => {
    const r = calculateMuscleScore({
      proteinAdherence: 0.8, // 70 * 0.8 = 56
      proteinDaysTracked: 20,
      resistanceAdherence: 0.5, // 30 * 0.5 = 15
      resistanceWeeksTracked: 6,
    });
    expect(r.score).toBe(71);
  });

  it('treats protein as untracked below the minimum logged days', () => {
    const r = calculateMuscleScore({
      proteinAdherence: 1,
      proteinDaysTracked: 2, // < MIN_PROTEIN_DAYS
      resistanceAdherence: null,
      resistanceWeeksTracked: 0,
    });
    expect(r.proteinTracked).toBe(false);
    expect(r.hasEnoughData).toBe(false);
    expect(r.score).toBe(0);
  });

  it('treats resistance as untracked when no week has resolved yet', () => {
    const r = calculateMuscleScore({
      proteinAdherence: 0.6,
      proteinDaysTracked: 7,
      resistanceAdherence: 1, // provided, but...
      resistanceWeeksTracked: 0, // ...no resolved week -> untracked
    });
    expect(r.resistanceTracked).toBe(false);
    expect(r.score).toBe(60); // protein alone at full weight
  });

  it('scores resistance alone at full weight when protein is untracked', () => {
    const r = calculateMuscleScore({
      proteinAdherence: null,
      proteinDaysTracked: 0,
      resistanceAdherence: 0.75,
      resistanceWeeksTracked: 4,
    });
    expect(r.proteinTracked).toBe(false);
    expect(r.resistanceTracked).toBe(true);
    expect(r.score).toBe(75);
  });

  it('clamps out-of-range adherence into [0, 1]', () => {
    const high = calculateMuscleScore({
      proteinAdherence: 1.5,
      proteinDaysTracked: 28,
      resistanceAdherence: -0.2,
      resistanceWeeksTracked: 4,
    });
    expect(high.score).toBe(70); // protein clamps to 1 (70), resistance clamps to 0
  });

  it('rounds each lever contribution before summing', () => {
    const r = calculateMuscleScore({
      proteinAdherence: 0.855, // round(70 * 0.855) = round(59.85) = 60
      proteinDaysTracked: 28,
      resistanceAdherence: 0,
      resistanceWeeksTracked: 3,
    });
    expect(r.score).toBe(60);
  });

  it('exposes the configured weights (70 / 30)', () => {
    expect(MUSCLE_PROTEIN_WEIGHT).toBe(0.7);
    expect(MUSCLE_RESISTANCE_WEIGHT).toBe(0.3);
  });
});
