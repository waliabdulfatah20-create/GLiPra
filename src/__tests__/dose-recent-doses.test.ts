import { describe, expect, it } from 'vitest';

import { buildRecentDoseStrip } from '@/features/dose/recent-doses';

const TODAY = '2026-06-07';

function statuses(doses: { takenAt: string; windowRespected: boolean | null }[], days = 7) {
  return buildRecentDoseStrip(doses, TODAY, days).map(d => d.status);
}

describe('buildRecentDoseStrip', () => {
  it('returns a strip of the requested length, oldest first, ending today', () => {
    const strip = buildRecentDoseStrip([], TODAY, 7);
    expect(strip).toHaveLength(7);
    expect(strip[0]!.date).toBe('2026-06-01');
    expect(strip[6]!.date).toBe(TODAY);
  });

  it('marks every day none when there are no doses', () => {
    expect(statuses([])).toEqual(['none', 'none', 'none', 'none', 'none', 'none', 'none']);
  });

  it('marks today taken and earlier days none for a first-ever dose today', () => {
    const strip = statuses([{ takenAt: '2026-06-07T08:00:00.000Z', windowRespected: null }]);
    expect(strip).toEqual(['none', 'none', 'none', 'none', 'none', 'none', 'taken']);
  });

  it('marks a broken window as broken, not taken', () => {
    const strip = statuses([{ takenAt: '2026-06-07T08:00:00.000Z', windowRespected: false }]);
    expect(strip[6]).toBe('broken');
  });

  it('fills gaps strictly between first dose and today with missed, leaving today pending', () => {
    const strip = statuses([
      { takenAt: '2026-06-01T08:00:00.000Z', windowRespected: true },
      { takenAt: '2026-06-06T08:00:00.000Z', windowRespected: true },
    ]);
    // 06-01 taken, 06-02..06-05 missed, 06-06 taken, 06-07 (today) none/pending
    expect(strip).toEqual(['taken', 'missed', 'missed', 'missed', 'missed', 'taken', 'none']);
  });

  it('treats days before the first recorded dose as none, not missed', () => {
    const strip = statuses([{ takenAt: '2026-06-05T08:00:00.000Z', windowRespected: true }]);
    // 06-01..06-04 none (before first dose), 06-05 taken, 06-06 missed, 06-07 none (today)
    expect(strip).toEqual(['none', 'none', 'none', 'none', 'taken', 'missed', 'none']);
  });

  it('lets a broken window win when a day has multiple doses', () => {
    const strip = statuses([
      { takenAt: '2026-06-07T08:00:00.000Z', windowRespected: true },
      { takenAt: '2026-06-07T20:00:00.000Z', windowRespected: false },
    ]);
    expect(strip[6]).toBe('broken');
  });

  it('honors a custom day count', () => {
    expect(statuses([], 3)).toHaveLength(3);
  });
});
