/**
 * Adherence calendar — pure grid-cell builder.
 *
 * Produces a Monday-aligned trailing-week grid (weeks x 7 cells, oldest first)
 * with a per-cell adherence status, for either regimen. Mirrors the layout of the
 * protein StreakCalendarCard so the dose calendar reads as its sibling.
 *
 *   Oral:      per-day status from oral_dose_logs (taken / broken / missed / none).
 *   Injection: the actual logged days are 'taken'; expected dose-days that were
 *              missed (no log within grace, grace window passed) are 'missed';
 *              every other day is 'none'.
 *
 * Pure: all date math via date-fns (Rule 6). No side effects.
 */

import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';

/** Days of slack on either side of an expected injection day still counted on-time. */
const GRACE_DAYS = 1;

export type CalendarCellStatus = 'taken' | 'broken' | 'missed' | 'none';

export type CalendarCell = {
  date: string; // YYYY-MM-DD
  dayNum: string; // '1'..'31'
  status: CalendarCellStatus;
  isToday: boolean;
  isFuture: boolean;
};

export type OralDoseInput = { takenAt: string; windowRespected: boolean | null };

export type AdherenceCalendarInput
  = | { route: 'oral'; doses: OralDoseInput[]; today: string; weeks: number }
    | { route: 'injection'; injectedDates: string[]; intervalDays: number; today: string; weeks: number };

/** Normalize an ISO timestamp to its LOCAL calendar day, matching the grid. */
function toLocalDay(s: string): string {
  return format(parseISO(s), 'yyyy-MM-dd');
}

/** Build the Monday-aligned grid of dates (oldest first), length weeks*7. */
function buildGridDates(today: string, weeks: number): string[] {
  const mondayThisWeek = startOfWeek(parseISO(today), { weekStartsOn: 1 });
  const gridStart = subWeeks(mondayThisWeek, weeks - 1);
  const total = weeks * 7;
  const dates: string[] = [];
  for (let i = 0; i < total; i++)
    dates.push(format(addDays(gridStart, i), 'yyyy-MM-dd'));
  return dates;
}

/** Per-calendar-day oral status map + the first recorded dose day. */
function buildOralDayMap(doses: OralDoseInput[]): {
  byDay: Map<string, 'taken' | 'broken'>;
  firstDoseDate: string | null;
} {
  const byDay = new Map<string, 'taken' | 'broken'>();
  let firstDoseDate: string | null = null;
  for (const dose of doses) {
    const d = format(parseISO(dose.takenAt), 'yyyy-MM-dd');
    if (firstDoseDate === null || d < firstDoseDate)
      firstDoseDate = d;
    if (dose.windowRespected === false)
      byDay.set(d, 'broken');
    else if (byDay.get(d) !== 'broken')
      byDay.set(d, 'taken');
  }
  return { byDay, firstDoseDate };
}

/**
 * Injection sets: the distinct logged days, and the set of expected dose-days
 * that resolved to "missed" (no log within grace and the grace window has passed).
 */
function buildInjectionSets(
  injectedDates: string[],
  intervalDays: number,
  today: string,
): { loggedSet: Set<string>; missedSet: Set<string> } {
  const todayDate = parseISO(today);
  const loggedSet = new Set<string>();
  for (const raw of injectedDates) {
    const d = toLocalDay(raw);
    if (differenceInCalendarDays(todayDate, parseISO(d)) >= 0)
      loggedSet.add(d);
  }

  const missedSet = new Set<string>();
  if (loggedSet.size === 0 || intervalDays <= 0)
    return { loggedSet, missedSet };

  const loggedDays = Array.from(loggedSet)
    .map(d => parseISO(d))
    .sort((a, b) => a.getTime() - b.getTime());
  const firstDose = loggedDays[0]!;

  for (let k = 0; ; k++) {
    const expected = addDays(firstDose, k * intervalDays);
    const diffFromToday = differenceInCalendarDays(todayDate, expected);
    if (diffFromToday < 0)
      break;
    const hit = loggedDays.some(
      log => Math.abs(differenceInCalendarDays(log, expected)) <= GRACE_DAYS,
    );
    if (!hit && diffFromToday > GRACE_DAYS)
      missedSet.add(format(expected, 'yyyy-MM-dd'));
  }

  return { loggedSet, missedSet };
}

export function buildAdherenceCalendar(input: AdherenceCalendarInput): CalendarCell[] {
  const { today, weeks } = input;
  const dates = buildGridDates(today, weeks);

  if (input.route === 'oral') {
    const { byDay, firstDoseDate } = buildOralDayMap(input.doses);
    return dates.map((date) => {
      const isFuture = date > today;
      const logged = byDay.get(date);
      let status: CalendarCellStatus;
      if (logged)
        status = logged;
      else if (!isFuture && firstDoseDate !== null && date > firstDoseDate && date < today)
        status = 'missed';
      else
        status = 'none';
      return cell(date, status, today);
    });
  }

  const { loggedSet, missedSet } = buildInjectionSets(
    input.injectedDates,
    input.intervalDays,
    today,
  );
  return dates.map((date) => {
    let status: CalendarCellStatus;
    if (loggedSet.has(date))
      status = 'taken';
    else if (missedSet.has(date))
      status = 'missed';
    else
      status = 'none';
    return cell(date, status, today);
  });
}

function cell(date: string, status: CalendarCellStatus, today: string): CalendarCell {
  return {
    date,
    dayNum: format(parseISO(date), 'd'),
    status,
    isToday: date === today,
    isFuture: date > today,
  };
}
