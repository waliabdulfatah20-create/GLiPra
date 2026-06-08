/**
 * Muscle Preservation Score — pure display builder (Phase B).
 *
 * Turns a MuscleScoreResult into a route-agnostic display card: a score-band
 * headline, two transparent factor rows (protein, resistance), and a single
 * improvement tip (or an invite when a lever is untracked / there is no data).
 * Mirrors `buildReadinessCard` — takes a `t` function, returns plain strings,
 * stays pure (Vitest-tested in src/__tests__).
 */

import type { MuscleFactorId, MuscleScoreResult } from './score';

/** Score bands for the headline. */
const STRONG_MIN = 80;
const SOLID_MIN = 55;
/** Adherence bands for a factor row's sentiment dot. */
const POSITIVE_MIN = 0.8;
const NEUTRAL_MIN = 0.5;

export type MuscleSentiment = 'positive' | 'neutral' | 'negative';

export type MuscleDisplayFactor = {
  id: MuscleFactorId;
  label: string;
  /** Already-localized value, e.g. "85%" or "Not tracked yet". */
  value: string;
  points: number;
  possible: number;
  tracked: boolean;
  sentiment: MuscleSentiment;
};

export type MuscleScoreCard = {
  score: number;
  headline: string;
  factors: MuscleDisplayFactor[];
  tip: string;
  hasEnoughData: boolean;
};

type TFn = (key: string, opts?: Record<string, unknown>) => string;

function factorSentiment(adherence: number, tracked: boolean): MuscleSentiment {
  if (!tracked)
    return 'neutral';
  if (adherence >= POSITIVE_MIN)
    return 'positive';
  if (adherence >= NEUTRAL_MIN)
    return 'neutral';
  return 'negative';
}

export function buildMuscleScoreCard(result: MuscleScoreResult, t: TFn): MuscleScoreCard {
  const factors: MuscleDisplayFactor[] = result.factors.map(f => ({
    id: f.id,
    label: t(`muscle_score.factor_${f.id}`),
    value: f.tracked
      ? t('muscle_score.pct', { pct: Math.round(f.adherence * 100) })
      : t('muscle_score.untracked'),
    points: f.points,
    possible: f.possible,
    tracked: f.tracked,
    sentiment: factorSentiment(f.adherence, f.tracked),
  }));

  // Headline by score band, or an empty-state invite.
  let headline: string;
  if (!result.hasEnoughData)
    headline = t('muscle_score.headline_empty');
  else if (result.score >= STRONG_MIN)
    headline = t('muscle_score.headline_strong');
  else if (result.score >= SOLID_MIN)
    headline = t('muscle_score.headline_solid');
  else
    headline = t('muscle_score.headline_low');

  // Tip: invite a missing lever, else coach the lever with the bigger point gap.
  const protein = result.factors.find(f => f.id === 'protein')!;
  const resistance = result.factors.find(f => f.id === 'resistance')!;
  let tip: string;
  if (!result.hasEnoughData) {
    tip = t('muscle_score.tip_empty');
  }
  else if (!result.proteinTracked) {
    tip = t('muscle_score.tip_add_protein');
  }
  else if (!result.resistanceTracked) {
    tip = t('muscle_score.tip_add_resistance');
  }
  else {
    const proteinGap = protein.possible - protein.points;
    const resistanceGap = resistance.possible - resistance.points;
    tip = proteinGap >= resistanceGap
      ? t('muscle_score.tip_protein')
      : t('muscle_score.tip_resistance');
  }

  return {
    score: result.score,
    headline,
    factors,
    tip,
    hasEnoughData: result.hasEnoughData,
  };
}
