import { format } from 'date-fns';

import { useProteinHistoryPerDay } from '@/features/progress/hooks';
import { useResistanceLogs } from '@/features/resistance/hooks';
import { buildMuscleScoreTrend } from './trend';

const TREND_WEEKS = 10;
const PROTEIN_WINDOW_DAYS = 28;

/**
 * Weekly Muscle Preservation Score trend for the Progress tab.
 *
 * Fetches a wide protein window (`weeks*7 + 28` days) + recent resistance logs,
 * then builds one score snapshot per week via the pure `buildMuscleScoreTrend`.
 */
export function useMuscleScoreTrend(weeks: number = TREND_WEEKS) {
  const { history, proteinFloorG, isLoading: proteinLoading }
    = useProteinHistoryPerDay(weeks * 7 + PROTEIN_WINDOW_DAYS);
  const { logs, isLoading: resistanceLoading } = useResistanceLogs();
  const today = format(new Date(), 'yyyy-MM-dd');

  const points = buildMuscleScoreTrend({
    history,
    resistanceDates: logs.map(l => l.performedAt),
    proteinFloorG,
    today,
    weeks,
    proteinWindowDays: PROTEIN_WINDOW_DAYS,
  });

  const tracked = points.filter(p => p.hasEnoughData);
  const currentScore = tracked.length > 0 ? tracked.at(-1)!.score : null;

  return {
    points,
    currentScore,
    trackedCount: tracked.length,
    isLoading: proteinLoading || resistanceLoading,
  };
}
