import { useTranslation } from 'react-i18next';

import { useProteinHistoryPerDay } from '@/features/progress/hooks';
import { useResistanceWeekly } from '@/features/resistance/hooks';
import { buildMuscleScoreCard } from './card';
import { calculateMuscleScore } from './score';

/** Trailing window for protein consistency (matches the protein streak calendar). */
const PROTEIN_WINDOW_DAYS = 28;

/**
 * Composes the Muscle Preservation Score for the Today hero card.
 *
 * Protein adherence = hits / days-with-data over the trailing 28 days (so a user
 * is scored on the days they actually logged, not penalized for untracked days);
 * it counts only when a protein floor is set. Resistance adherence = the weekly
 * hit-rate from `computeResistanceFrequency` (only once a week has resolved).
 */
export function useMuscleScore() {
  const { t } = useTranslation();
  const { history, proteinFloorG, isLoading: proteinLoading }
    = useProteinHistoryPerDay(PROTEIN_WINDOW_DAYS);
  const { frequency, isLoading: resistanceLoading } = useResistanceWeekly();

  const hasFloor = proteinFloorG > 0;
  const daysWithData = history.filter(d => d.hasData).length;
  const hits = history.filter(d => d.hitFloor).length;
  const proteinAdherence
    = hasFloor && daysWithData > 0 ? hits / daysWithData : null;

  const result = calculateMuscleScore({
    proteinAdherence,
    proteinDaysTracked: hasFloor ? daysWithData : 0,
    resistanceAdherence: frequency.weeksTracked > 0 ? frequency.hitRate : null,
    resistanceWeeksTracked: frequency.weeksTracked,
  });

  const card = buildMuscleScoreCard(result, t);

  return { card, result, isLoading: proteinLoading || resistanceLoading };
}
