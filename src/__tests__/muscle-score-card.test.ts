import type { MuscleScoreResult } from '@/features/muscle-score/score';
import { describe, expect, it } from 'vitest';

import { buildMuscleScoreCard } from '@/features/muscle-score/card';

// i18n returns keys in the test environment.
const t = (key: string) => key;

function makeResult(opts: {
  score: number;
  proteinTracked: boolean;
  resistanceTracked: boolean;
  pAdh?: number;
  pPoints?: number;
  pPossible?: number;
  rAdh?: number;
  rPoints?: number;
  rPossible?: number;
}): MuscleScoreResult {
  return {
    score: opts.score,
    proteinTracked: opts.proteinTracked,
    resistanceTracked: opts.resistanceTracked,
    hasEnoughData: opts.proteinTracked || opts.resistanceTracked,
    factors: [
      {
        id: 'protein',
        adherence: opts.pAdh ?? 0,
        weight: 0,
        points: opts.pPoints ?? 0,
        possible: opts.pPossible ?? 0,
        tracked: opts.proteinTracked,
      },
      {
        id: 'resistance',
        adherence: opts.rAdh ?? 0,
        weight: 0,
        points: opts.rPoints ?? 0,
        possible: opts.rPossible ?? 0,
        tracked: opts.resistanceTracked,
      },
    ],
  };
}

describe('buildMuscleScoreCard', () => {
  it('shows the empty-state headline and invite tip when there is no data', () => {
    const card = buildMuscleScoreCard(
      makeResult({ score: 0, proteinTracked: false, resistanceTracked: false }),
      t,
    );
    expect(card.headline).toBe('muscle_score.headline_empty');
    expect(card.tip).toBe('muscle_score.tip_empty');
    expect(card.hasEnoughData).toBe(false);
  });

  it('picks the headline by score band', () => {
    const strong = buildMuscleScoreCard(
      makeResult({ score: 85, proteinTracked: true, resistanceTracked: true }),
      t,
    );
    expect(strong.headline).toBe('muscle_score.headline_strong');

    const solid = buildMuscleScoreCard(
      makeResult({ score: 60, proteinTracked: true, resistanceTracked: true }),
      t,
    );
    expect(solid.headline).toBe('muscle_score.headline_solid');

    const low = buildMuscleScoreCard(
      makeResult({ score: 30, proteinTracked: true, resistanceTracked: true }),
      t,
    );
    expect(low.headline).toBe('muscle_score.headline_low');
  });

  it('invites the missing lever via the tip', () => {
    const noResistance = buildMuscleScoreCard(
      makeResult({ score: 90, proteinTracked: true, resistanceTracked: false }),
      t,
    );
    expect(noResistance.tip).toBe('muscle_score.tip_add_resistance');

    const noProtein = buildMuscleScoreCard(
      makeResult({ score: 75, proteinTracked: false, resistanceTracked: true }),
      t,
    );
    expect(noProtein.tip).toBe('muscle_score.tip_add_protein');
  });

  it('coaches the lever with the bigger point gap when both are tracked', () => {
    const proteinGapBigger = buildMuscleScoreCard(
      makeResult({
        score: 60,
        proteinTracked: true,
        resistanceTracked: true,
        pPoints: 42,
        pPossible: 70, // gap 28
        rPoints: 24,
        rPossible: 30, // gap 6
      }),
      t,
    );
    expect(proteinGapBigger.tip).toBe('muscle_score.tip_protein');

    const resistanceGapBigger = buildMuscleScoreCard(
      makeResult({
        score: 70,
        proteinTracked: true,
        resistanceTracked: true,
        pPoints: 66,
        pPossible: 70, // gap 4
        rPoints: 9,
        rPossible: 30, // gap 21
      }),
      t,
    );
    expect(resistanceGapBigger.tip).toBe('muscle_score.tip_resistance');
  });

  it('formats factor values: percent when tracked, untracked label otherwise', () => {
    const card = buildMuscleScoreCard(
      makeResult({
        score: 70,
        proteinTracked: true,
        resistanceTracked: false,
        pAdh: 0.85,
      }),
      t,
    );
    const protein = card.factors.find(f => f.id === 'protein')!;
    const resistance = card.factors.find(f => f.id === 'resistance')!;
    expect(protein.value).toBe('muscle_score.pct');
    expect(resistance.value).toBe('muscle_score.untracked');
    // protein first, resistance second
    expect(card.factors.map(f => f.id)).toEqual(['protein', 'resistance']);
  });

  it('assigns sentiment from adherence bands', () => {
    const card = buildMuscleScoreCard(
      makeResult({
        score: 50,
        proteinTracked: true,
        resistanceTracked: true,
        pAdh: 0.9, // positive
        rAdh: 0.3, // negative
      }),
      t,
    );
    expect(card.factors.find(f => f.id === 'protein')!.sentiment).toBe('positive');
    expect(card.factors.find(f => f.id === 'resistance')!.sentiment).toBe('negative');

    const neutral = buildMuscleScoreCard(
      makeResult({
        score: 60,
        proteinTracked: true,
        resistanceTracked: false,
        pAdh: 0.6, // neutral band
      }),
      t,
    );
    expect(neutral.factors.find(f => f.id === 'protein')!.sentiment).toBe('neutral');
    // untracked lever is always neutral
    expect(neutral.factors.find(f => f.id === 'resistance')!.sentiment).toBe('neutral');
  });
});
