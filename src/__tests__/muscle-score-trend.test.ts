import type { DayHit } from '@/features/progress/calculator';
import { addDays, format, parseISO } from 'date-fns';
import { describe, expect, it } from 'vitest';

import { buildMuscleScoreTrend } from '@/features/muscle-score/trend';

// 2026-06-10 is a Wednesday; current Monday-aligned week starts 2026-06-08.
const TODAY = '2026-06-10';

function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  let d = parseISO(from);
  const end = parseISO(to);
  while (d <= end) {
    out.push(format(d, 'yyyy-MM-dd'));
    d = addDays(d, 1);
  }
  return out;
}

/** hit: true = hasData + hitFloor, false = hasData no hit, null = no data that day. */
function makeHistory(from: string, to: string, hit: (date: string) => boolean | null): DayHit[] {
  return eachDay(from, to).map((date) => {
    const h = hit(date);
    return { date, proteinG: h ? 30 : 0, hitFloor: h === true, hasData: h !== null };
  });
}

describe('buildMuscleScoreTrend', () => {
  it('returns `weeks` Monday-aligned points, oldest to newest', () => {
    const points = buildMuscleScoreTrend({
      history: [],
      resistanceDates: [],
      proteinFloorG: 100,
      today: TODAY,
      weeks: 4,
    });
    expect(points).toHaveLength(4);
    expect(points[0]!.weekStart).toBe('2026-05-18');
    expect(points[1]!.weekStart).toBe('2026-05-25');
    expect(points[2]!.weekStart).toBe('2026-06-01');
    expect(points[3]!.weekStart).toBe('2026-06-08'); // current week
  });

  it('marks every point as no-data when nothing is logged', () => {
    const points = buildMuscleScoreTrend({
      history: [],
      resistanceDates: [],
      proteinFloorG: 100,
      today: TODAY,
      weeks: 6,
    });
    expect(points.every(p => !p.hasEnoughData)).toBe(true);
    expect(points.every(p => p.score === 0)).toBe(true);
  });

  it('rises as protein consistency improves over the weeks', () => {
    // No hits before 2026-05-15, all hits on/after.
    const history = makeHistory('2026-03-01', TODAY, date => date >= '2026-05-15');
    const points = buildMuscleScoreTrend({
      history,
      resistanceDates: [],
      proteinFloorG: 100,
      today: TODAY,
      weeks: 10,
    });
    expect(points[0]!.score).toBe(0); // early window: all misses
    expect(points[0]!.hasEnoughData).toBe(true);
    expect(points.at(-1)!.score).toBeGreaterThanOrEqual(90); // recent: mostly hits
  });

  it('keeps protein untracked when no floor is set', () => {
    const history = makeHistory('2026-03-01', TODAY, () => true);
    const points = buildMuscleScoreTrend({
      history,
      resistanceDates: [],
      proteinFloorG: 0, // no floor
      today: TODAY,
      weeks: 6,
    });
    expect(points.every(p => !p.hasEnoughData)).toBe(true);
  });

  it('starts counting resistance only once a week has resolved (re-normalization transition)', () => {
    // Perfect protein the whole span; resistance logged 1 day/week (below the 2x target),
    // first session 2026-04-14. Early snapshots see no resistance (protein-only = 100);
    // later snapshots see resolved miss-weeks (protein 70 + resistance 0 = 70).
    const history = makeHistory('2026-03-01', TODAY, () => true);
    const resistanceDates = eachDay('2026-04-14', TODAY).filter((_, i) => i % 7 === 0); // ~weekly
    const points = buildMuscleScoreTrend({
      history,
      resistanceDates,
      proteinFloorG: 100,
      today: TODAY,
      weeks: 10,
    });
    expect(points[0]!.score).toBe(100); // refDate 2026-04-12, before any session
    expect(points.at(-1)!.score).toBe(70); // resistance now resolved + missing -> caps at 70
  });

  it('includes the current week up to today in the latest point', () => {
    // Data only on the three current-week days (Mon-Wed); nothing earlier.
    const current = new Set(['2026-06-08', '2026-06-09', '2026-06-10']);
    const history = makeHistory('2026-03-01', TODAY, date =>
      current.has(date) ? true : null);
    const points = buildMuscleScoreTrend({
      history,
      resistanceDates: [],
      proteinFloorG: 100,
      today: TODAY,
      weeks: 8,
    });
    expect(points[0]!.hasEnoughData).toBe(false); // older weeks: no data
    expect(points.at(-1)!.score).toBe(100); // 3 logged hit-days this week -> protein-only 100
    expect(points.at(-1)!.hasEnoughData).toBe(true);
  });

  it('defaults to 10 weeks', () => {
    const points = buildMuscleScoreTrend({
      history: [],
      resistanceDates: [],
      proteinFloorG: 100,
      today: TODAY,
    });
    expect(points).toHaveLength(10);
  });
});
