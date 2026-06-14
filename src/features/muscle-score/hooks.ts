import { useTranslation } from 'react-i18next';

import { useProteinHistoryPerDay } from '@/features/progress/hooks';
import { useResistanceWeekly } from '@/features/resistance/hooks';
import { buildMuscleScoreCard } from './card';
import { deriveResistanceInput } from './resistance-input';
import { calculateMuscleScore } from './score';

/** Trailing window for protein consistency (matches the protein streak calendar). */
const PROTEIN_WINDOW_DAYS = 28;

/**
 * Composes the Muscle Preservation Score for the Today hero card.
 *
 * Protein adherence = hits / days-with-data over the trailing 28 days (so a user
 * is scored on the days they actually logged, not penalized for untracked days);
 * it counts only when a protein floor is set. Resistance adherence comes from
 * `deriveResistanceInput`, which counts the CURRENT (in-progress) week's sessions
 * too — so logging resistance this week marks the lever tracked, rather than
 * waiting for the week to resolve next Monday.
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

  const resistance = deriveResistanceInput(frequency);

  const result = calculateMuscleScore({
    proteinAdherence,
    proteinDaysTracked: hasFloor ? daysWithData : 0,
    resistanceAdherence: resistance.adherence,
    resistanceWeeksTracked: resistance.weeksTracked,
  });

  const card = buildMuscleScoreCard(result, t);

  return { card, result, isLoading: proteinLoading || resistanceLoading };
}
