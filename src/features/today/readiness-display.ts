import type { InjectionPhase } from '@/types';
import type { ReadinessResult, FactorDelta } from './readiness-calculator';

export type DisplayFactor = {
  label: string;
  delta: number;
  sentiment: 'positive' | 'negative';
};

export type ReadinessCard = {
  headline: string;
  factors: DisplayFactor[];
  tip: string;
  score: number;
};

// t is the i18next translate function — typed as (key: string) => string
export function buildReadinessCard(
  result: ReadinessResult,
  injectionPhase: InjectionPhase,
  t: (key: string) => string,
): ReadinessCard {
  // 1. Headline — one per phase
  const headline = t(`readiness.headlines.${injectionPhase}`);

  // 2. Map FactorDelta to DisplayFactor
  const mapped: DisplayFactor[] = result.factors.map((factor) => ({
    label: t(`readiness.factor_labels.${factor.id}`),
    delta: factor.delta,
    sentiment: factor.delta > 0 ? 'positive' : 'negative',
  }));

  // Sort: negatives first (most negative at top), then positives (most positive at top)
  const negatives = mapped
    .filter((f) => f.delta < 0)
    .sort((a, b) => a.delta - b.delta); // ascending — most negative first

  const positives = mapped
    .filter((f) => f.delta > 0)
    .sort((a, b) => b.delta - a.delta); // descending — most positive first

  const factors = [...negatives, ...positives];

  // 3. Tip selection — factor with most negative delta
  // Tie-break: injection_phase > protein_pace > any other id
  const negativeFactors = result.factors.filter((f) => f.delta < 0);

  let tipFactor: FactorDelta | null = null;

  if (negativeFactors.length > 0) {
    // Find the minimum delta value
    const minDelta = Math.min(...negativeFactors.map((f) => f.delta));
    const worstFactors = negativeFactors.filter((f) => f.delta === minDelta);

    if (worstFactors.length === 1) {
      tipFactor = worstFactors[0];
    } else {
      // Tie-break: injection_phase > protein_pace > any other
      const injPhase = worstFactors.find((f) => f.id === 'injection_phase');
      if (injPhase) {
        tipFactor = injPhase;
      } else {
        const proteinPace = worstFactors.find((f) => f.id === 'protein_pace');
        if (proteinPace) {
          tipFactor = proteinPace;
        } else {
          tipFactor = worstFactors[0];
        }
      }
    }
  }

  let tip: string;
  if (tipFactor === null) {
    // No negative factors — fallback to injection_phase tip using current phase
    tip = t(`readiness.tips.injection_phase_${injectionPhase}`);
  } else if (tipFactor.id === 'injection_phase') {
    // injection_phase tip key includes the current phase
    tip = t(`readiness.tips.injection_phase_${injectionPhase}`);
  } else {
    // All other factors use their id directly
    tip = t(`readiness.tips.${tipFactor.id}`);
  }

  // 4. Score — pass through unchanged
  return { headline, factors, tip, score: result.score };
}
