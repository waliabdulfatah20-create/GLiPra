import { describe, expect, it } from 'vitest';

import {
  ABSORPTION_WINDOW_MIN,
  computeDoseAdherenceStreak,
  computeDoseWindow,
  deriveLastDoseDate,
} from '@/features/oral-dose/dose-window';

// Timestamps below intentionally omit a timezone offset. parseISO treats them as
// LOCAL wall-clock time, and format/isSameDay also render in local time, so every
// assertion is self-consistent regardless of the runner's timezone (local vs CI).

// ─── computeDoseWindow ─────────────────────────────────────────────────────────

describe('computeDoseWindow', () => {
  it('returns not_taken when no dose has ever been logged', () => {
    const r = computeDoseWindow({ lastDoseTakenAt: null, now: '2026-06-05T08:00:00' });
    expect(r.state).toBe('not_taken');
    expect(r.secondsRemaining).toBe(0);
    expect(r.minutesRemaining).toBe(0);
  });

  it('returns absorbing with full window when the dose was just taken', () => {
    const r = computeDoseWindow({
      lastDoseTakenAt: '2026-06-05T08:00:00',
      now: '2026-06-05T08:00:00',
    });
    expect(r.state).toBe('absorbing');
    expect(r.secondsRemaining).toBe(ABSORPTION_WINDOW_MIN * 60);
    expect(r.minutesRemaining).toBe(ABSORPTION_WINDOW_MIN);
  });

  it('returns absorbing with the remaining seconds mid-window', () => {
    // 10 minutes elapsed → 20 minutes (1200s) left
    const r = computeDoseWindow({
      lastDoseTakenAt: '2026-06-05T08:00:00',
      now: '2026-06-05T08:10:00',
    });
    expect(r.state).toBe('absorbing');
    expect(r.secondsRemaining).toBe(1200);
    expect(r.minutesRemaining).toBe(20);
  });

  it('rounds partial minutes up while absorbing', () => {
    // 29 min 1 sec elapsed → 59 seconds left → ceil to 1 minute
    const r = computeDoseWindow({
      lastDoseTakenAt: '2026-06-05T08:00:00',
      now: '2026-06-05T08:29:01',
    });
    expect(r.state).toBe('absorbing');
    expect(r.secondsRemaining).toBe(59);
    expect(r.minutesRemaining).toBe(1);
  });

  it('flips to clear exactly at the window boundary (same day)', () => {
    // exactly 30 minutes elapsed → no longer absorbing
    const r = computeDoseWindow({
      lastDoseTakenAt: '2026-06-05T08:00:00',
      now: '2026-06-05T08:30:00',
    });
    expect(r.state).toBe('clear');
    expect(r.secondsRemaining).toBe(0);
  });

  it('returns clear later in the day after the window has passed', () => {
    const r = computeDoseWindow({
      lastDoseTakenAt: '2026-06-05T08:00:00',
      now: '2026-06-05T19:00:00',
    });
    expect(r.state).toBe('clear');
  });

  it('returns not_taken when the last dose was on a previous calendar day', () => {
    const r = computeDoseWindow({
      lastDoseTakenAt: '2026-06-04T08:00:00',
      now: '2026-06-05T08:00:00',
    });
    expect(r.state).toBe('not_taken');
  });

  it('stays absorbing across midnight to avoid implying a second dose', () => {
    // Taken 11:50pm, now 12:05am next day → 15 min elapsed, still absorbing
    const r = computeDoseWindow({
      lastDoseTakenAt: '2026-06-04T23:50:00',
      now: '2026-06-05T00:05:00',
    });
    expect(r.state).toBe('absorbing');
    expect(r.minutesRemaining).toBe(15);
  });

  it('clamps a future timestamp (clock skew) to a full absorbing window', () => {
    const r = computeDoseWindow({
      lastDoseTakenAt: '2026-06-05T08:05:00',
      now: '2026-06-05T08:00:00',
    });
    expect(r.state).toBe('absorbing');
    expect(r.secondsRemaining).toBe(ABSORPTION_WINDOW_MIN * 60);
  });
});

// ─── deriveLastDoseDate ────────────────────────────────────────────────────────

describe('deriveLastDoseDate', () => {
  it('returns null for an empty list', () => {
    expect(deriveLastDoseDate([])).toBeNull();
  });

  it('returns the calendar date of a single dose', () => {
    expect(deriveLastDoseDate(['2026-06-05T08:00:00'])).toBe('2026-06-05');
  });

  it('returns the most recent date regardless of input order', () => {
    expect(
      deriveLastDoseDate([
        '2026-06-01T08:00:00',
        '2026-06-05T07:00:00',
        '2026-06-03T08:00:00',
      ]),
    ).toBe('2026-06-05');
  });
});

// ─── computeDoseAdherenceStreak ────────────────────────────────────────────────

describe('computeDoseAdherenceStreak', () => {
  const TODAY = '2026-06-05';

  // Helper: build DoseDay[] from bare timestamps with windowRespected = null,
  // so the existing assertions prove the all-null path is unchanged.
  const mk = (...takenAt: string[]) =>
    takenAt.map(t => ({ takenAt: t, windowRespected: null as boolean | null }));

  it('returns zeros for an empty list', () => {
    expect(computeDoseAdherenceStreak([], TODAY)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastDoseDate: null,
    });
  });

  it('counts a single dose taken today', () => {
    const r = computeDoseAdherenceStreak(mk('2026-06-05T08:00:00'), TODAY);
    expect(r.currentStreak).toBe(1);
    expect(r.longestStreak).toBe(1);
    expect(r.lastDoseDate).toBe('2026-06-05');
  });

  it('counts an unbroken run ending today', () => {
    const r = computeDoseAdherenceStreak(
      mk('2026-06-03T08:00:00', '2026-06-04T08:00:00', '2026-06-05T08:00:00'),
      TODAY,
    );
    expect(r.currentStreak).toBe(3);
    expect(r.longestStreak).toBe(3);
  });

  it('keeps the streak live when the last dose was yesterday', () => {
    const r = computeDoseAdherenceStreak(
      mk('2026-06-03T08:00:00', '2026-06-04T08:00:00'),
      TODAY,
    );
    expect(r.currentStreak).toBe(2);
  });

  it('breaks the current streak when the last dose is 2+ days ago', () => {
    const r = computeDoseAdherenceStreak(
      mk('2026-06-01T08:00:00', '2026-06-02T08:00:00'),
      TODAY,
    );
    expect(r.currentStreak).toBe(0);
    expect(r.longestStreak).toBe(2);
    expect(r.lastDoseDate).toBe('2026-06-02');
  });

  it('dedupes multiple doses on the same calendar day', () => {
    const r = computeDoseAdherenceStreak(
      mk(
        '2026-06-05T08:00:00',
        '2026-06-05T08:30:00', // duplicate day (e.g. re-log)
        '2026-06-04T08:00:00',
      ),
      TODAY,
    );
    expect(r.currentStreak).toBe(2);
    expect(r.longestStreak).toBe(2);
  });

  it('reports the longest historical run even when the current streak is broken', () => {
    const r = computeDoseAdherenceStreak(
      mk(
        '2026-05-20T08:00:00',
        '2026-05-21T08:00:00',
        '2026-05-22T08:00:00',
        '2026-05-23T08:00:00', // 4-day run
        '2026-06-01T08:00:00', // gap, then isolated day
      ),
      TODAY,
    );
    expect(r.longestStreak).toBe(4);
    expect(r.currentStreak).toBe(0);
  });

  it('ignores future-dated dose logs', () => {
    const r = computeDoseAdherenceStreak(
      mk('2026-06-05T08:00:00', '2026-06-10T08:00:00'),
      TODAY,
    );
    expect(r.lastDoseDate).toBe('2026-06-05');
    expect(r.currentStreak).toBe(1);
  });

  // ── Technique weighting (window_respected) ──────────────────────────────────

  it('respected (true) days count exactly like null days', () => {
    const r = computeDoseAdherenceStreak(
      [
        { takenAt: '2026-06-03T08:00:00', windowRespected: true },
        { takenAt: '2026-06-04T08:00:00', windowRespected: true },
        { takenAt: '2026-06-05T08:00:00', windowRespected: true },
      ],
      TODAY,
    );
    expect(r.currentStreak).toBe(3);
    expect(r.longestStreak).toBe(3);
  });

  it('a broken-window day today breaks the current streak (acts like a missing day)', () => {
    const r = computeDoseAdherenceStreak(
      [
        { takenAt: '2026-06-03T08:00:00', windowRespected: true },
        { takenAt: '2026-06-04T08:00:00', windowRespected: true },
        { takenAt: '2026-06-05T08:00:00', windowRespected: false }, // ate early today
      ],
      TODAY,
    );
    // Today excluded; last counting day is yesterday, so the run through
    // yesterday is still live (one grace day, same as a missed dose).
    expect(r.currentStreak).toBe(2);
    expect(r.lastDoseDate).toBe('2026-06-04');
  });

  it('a broken-window day in the middle caps the longest run', () => {
    const r = computeDoseAdherenceStreak(
      [
        { takenAt: '2026-05-20T08:00:00', windowRespected: true },
        { takenAt: '2026-05-21T08:00:00', windowRespected: false }, // breaks the run
        { takenAt: '2026-05-22T08:00:00', windowRespected: true },
        { takenAt: '2026-05-23T08:00:00', windowRespected: true },
      ],
      TODAY,
    );
    expect(r.longestStreak).toBe(2); // 05-22 + 05-23, not the full 4
  });

  it('treats a day broken if any dose that day broke the window', () => {
    const r = computeDoseAdherenceStreak(
      [
        { takenAt: '2026-06-05T08:00:00', windowRespected: true },
        { takenAt: '2026-06-05T09:00:00', windowRespected: false }, // same day broke
      ],
      TODAY,
    );
    expect(r.currentStreak).toBe(0);
    expect(r.lastDoseDate).toBeNull();
  });
});
