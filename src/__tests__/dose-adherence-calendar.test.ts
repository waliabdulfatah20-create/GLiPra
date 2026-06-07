import { describe, expect, it } from 'vitest';

import { buildAdherenceCalendar } from '@/features/dose/adherence-calendar-data';

const TODAY = '2026-06-07'; // a Sunday

describe('buildAdherenceCalendar — grid shape', () => {
  it('returns weeks*7 cells', () => {
    const cells = buildAdherenceCalendar({ route: 'oral', doses: [], today: TODAY, weeks: 4 });
    expect(cells).toHaveLength(28);
    const inj = buildAdherenceCalendar({
      route: 'injection',
      injectedDates: [],
      intervalDays: 7,
      today: TODAY,
      weeks: 8,
    });
    expect(inj).toHaveLength(56);
  });

  it('starts on a Monday (weeks-1) back and is oldest-first', () => {
    const cells = buildAdherenceCalendar({ route: 'oral', doses: [], today: TODAY, weeks: 4 });
    // Monday of this week (06-07 is Sunday) is 06-01; 3 weeks earlier is 05-11.
    expect(cells[0]!.date).toBe('2026-05-11');
    expect(cells[27]!.date).toBe('2026-06-07');
  });

  it('flags today and marks current-week future days', () => {
    // Use a mid-week "today" so the current week has trailing future cells.
    const wed = '2026-06-03'; // Wednesday
    const cells = buildAdherenceCalendar({ route: 'oral', doses: [], today: wed, weeks: 4 });
    const todayCell = cells.find(c => c.date === wed)!;
    expect(todayCell.isToday).toBe(true);
    expect(todayCell.isFuture).toBe(false);
    const thursday = cells.find(c => c.date === '2026-06-04')!;
    expect(thursday.isFuture).toBe(true);
    expect(thursday.status).toBe('none');
  });
});

describe('buildAdherenceCalendar — oral statuses', () => {
  it('marks all none with no doses', () => {
    const cells = buildAdherenceCalendar({ route: 'oral', doses: [], today: TODAY, weeks: 4 });
    expect(cells.every(c => c.status === 'none')).toBe(true);
  });

  it('marks taken, broken, missed and pending-today correctly', () => {
    const cells = buildAdherenceCalendar({
      route: 'oral',
      doses: [
        { takenAt: '2026-06-01T08:00:00.000Z', windowRespected: true },
        { takenAt: '2026-06-03T08:00:00.000Z', windowRespected: false },
        { takenAt: '2026-06-06T08:00:00.000Z', windowRespected: null },
      ],
      today: TODAY,
      weeks: 4,
    });
    const byDate = Object.fromEntries(cells.map(c => [c.date, c.status]));
    expect(byDate['2026-06-01']).toBe('taken');
    expect(byDate['2026-06-02']).toBe('missed'); // gap between first dose and today
    expect(byDate['2026-06-03']).toBe('broken'); // window broken wins
    expect(byDate['2026-06-06']).toBe('taken'); // null counts as taken
    expect(byDate['2026-06-07']).toBe('none'); // today, no dose yet -> pending
  });

  it('does not mark days before the first dose as missed', () => {
    const cells = buildAdherenceCalendar({
      route: 'oral',
      doses: [{ takenAt: '2026-06-05T08:00:00.000Z', windowRespected: true }],
      today: TODAY,
      weeks: 4,
    });
    const byDate = Object.fromEntries(cells.map(c => [c.date, c.status]));
    expect(byDate['2026-06-04']).toBe('none'); // before first dose
    expect(byDate['2026-06-05']).toBe('taken');
    expect(byDate['2026-06-06']).toBe('missed');
  });
});

describe('buildAdherenceCalendar — injection statuses', () => {
  it('marks all none with no logs', () => {
    const cells = buildAdherenceCalendar({
      route: 'injection',
      injectedDates: [],
      intervalDays: 7,
      today: TODAY,
      weeks: 8,
    });
    expect(cells.every(c => c.status === 'none')).toBe(true);
  });

  it('marks logged days taken and a fully-missed expected week missed', () => {
    // Weekly, first dose 05-10, missing 05-24, the rest present.
    const cells = buildAdherenceCalendar({
      route: 'injection',
      injectedDates: ['2026-05-10', '2026-05-17', '2026-05-31', '2026-06-07'],
      intervalDays: 7,
      today: TODAY,
      weeks: 8,
    });
    const byDate = Object.fromEntries(cells.map(c => [c.date, c.status]));
    expect(byDate['2026-05-10']).toBe('taken');
    expect(byDate['2026-05-17']).toBe('taken');
    expect(byDate['2026-05-24']).toBe('missed'); // expected slot, no log
    expect(byDate['2026-05-31']).toBe('taken');
    expect(byDate['2026-06-07']).toBe('taken');
  });

  it('does not mark non-dose days between weekly shots as missed', () => {
    const cells = buildAdherenceCalendar({
      route: 'injection',
      injectedDates: ['2026-05-31', '2026-06-07'],
      intervalDays: 7,
      today: TODAY,
      weeks: 8,
    });
    const byDate = Object.fromEntries(cells.map(c => [c.date, c.status]));
    expect(byDate['2026-06-01']).toBe('none');
    expect(byDate['2026-06-03']).toBe('none');
  });

  it('never marks an injection cell broken', () => {
    const cells = buildAdherenceCalendar({
      route: 'injection',
      injectedDates: ['2026-05-31', '2026-06-07'],
      intervalDays: 7,
      today: TODAY,
      weeks: 8,
    });
    expect(cells.some(c => c.status === 'broken')).toBe(false);
  });
});
