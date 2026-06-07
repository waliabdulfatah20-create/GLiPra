import { addDays, format, parseISO, subDays } from 'date-fns';

// A day in the recent-dose strip on the Dose hub.
//   taken  — a dose was logged that day (window respected or unanswered)
//   broken — a dose was logged but the empty-stomach window was reported broken
//   missed — no dose that day, and it falls between the first dose and yesterday
//   none   — no dose, and the day is before dosing started or is today (pending)
export type RecentDoseStatus = 'taken' | 'broken' | 'missed' | 'none';

export type RecentDoseDay = {
  date: string; // YYYY-MM-DD
  status: RecentDoseStatus;
};

export type RecentDoseInput = {
  takenAt: string; // ISO 8601
  windowRespected: boolean | null;
};

/**
 * Build a fixed-length strip (oldest → newest, ending today) summarizing recent
 * oral-dose adherence. Pure: all date math via date-fns (Rule 6). "missed" is only
 * assigned strictly between the first recorded dose and today, so a brand-new user
 * never sees a wall of false misses, and an unfinished today reads as pending.
 */
export function buildRecentDoseStrip(
  doses: RecentDoseInput[],
  today: string,
  days = 7,
): RecentDoseDay[] {
  // Per-calendar-day status from the dose history. A broken window wins over a
  // plain taken on the same day (mirrors the streak rule: false breaks).
  const byDay = new Map<string, 'taken' | 'broken'>();
  let firstDoseDate: string | null = null;

  for (const dose of doses) {
    const d = format(parseISO(dose.takenAt), 'yyyy-MM-dd');
    if (firstDoseDate === null || d < firstDoseDate)
      firstDoseDate = d;
    const existing = byDay.get(d);
    if (dose.windowRespected === false)
      byDay.set(d, 'broken');
    else if (existing !== 'broken')
      byDay.set(d, 'taken');
  }

  const start = subDays(parseISO(today), days - 1);
  const strip: RecentDoseDay[] = [];
  for (let i = 0; i < days; i++) {
    const date = format(addDays(start, i), 'yyyy-MM-dd');
    const logged = byDay.get(date);
    let status: RecentDoseStatus;
    if (logged) {
      status = logged;
    }
    else if (firstDoseDate !== null && date > firstDoseDate && date < today) {
      status = 'missed';
    }
    else {
      status = 'none';
    }
    strip.push({ date, status });
  }

  return strip;
}
