import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

export type InjectionPhase =
  | 'injection_day'
  | 'peak_suppression'
  | 'adjustment'
  | 'recovery_window'
  | 'overdue';

export interface InjectionCycleInput {
  /** ISO date string e.g. '2026-05-10' */
  lastInjectionDate: string;
  /** ISO date string */
  today: string;
  /** Default 7 (weekly). Pass 14 for biweekly, etc. */
  injectionIntervalDays?: number;
}

export interface InjectionCycleResult {
  phase: InjectionPhase;
  daysSinceInjection: number;
  /** null if overdue */
  daysUntilNextInjection: number | null;
  isOverdue: boolean;
  /** ISO date string, null if overdue */
  nextInjectionDate: string | null;
}

function mapDaysToPhase(daysSince: number): InjectionPhase {
  if (daysSince === 0) return 'injection_day';
  if (daysSince <= 2) return 'peak_suppression';
  if (daysSince <= 4) return 'adjustment';
  if (daysSince <= 7) return 'recovery_window';
  return 'overdue';
}

export function calculateInjectionPhase(
  input: InjectionCycleInput,
): InjectionCycleResult {
  const { lastInjectionDate, today, injectionIntervalDays = 7 } = input;

  const lastDate = parseISO(lastInjectionDate);
  const todayDate = parseISO(today);

  const daysSinceInjection = differenceInCalendarDays(todayDate, lastDate);
  const phase = mapDaysToPhase(daysSinceInjection);
  const isOverdue = phase === 'overdue';

  if (isOverdue) {
    return {
      phase,
      daysSinceInjection,
      daysUntilNextInjection: null,
      isOverdue: true,
      nextInjectionDate: null,
    };
  }

  const nextDate = addDays(lastDate, injectionIntervalDays);
  const nextInjectionDate = format(nextDate, 'yyyy-MM-dd');
  const daysUntilNextInjection = differenceInCalendarDays(nextDate, todayDate);

  return {
    phase,
    daysSinceInjection,
    daysUntilNextInjection,
    isOverdue: false,
    nextInjectionDate,
  };
}
