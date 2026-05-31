import type { DayProteinEntry, SymptomEntry } from '../calculator';
import { parseISO } from 'date-fns';

import { describe, expect, it } from 'vitest';
import {
  buildHitHistory,
  calculateAdherence,
  calculateAverageSymptom,
  calculateHitRate,

} from '../calculator';

const ASOF = parseISO('2026-05-24'); // fixed reference date for determinism

// ─── buildHitHistory ──────────────────────────────────────────────────────────

describe('buildHitHistory', () => {
  it('returns N entries oldest → newest', () => {
    const out = buildHitHistory([], 100, 7, ASOF);
    expect(out).toHaveLength(7);
    expect(out[0].date).toBe('2026-05-18');
    expect(out[6].date).toBe('2026-05-24');
  });

  it('fills missing days with zero protein, hasData=false', () => {
    const out = buildHitHistory([], 3, 100, ASOF);
    expect(out.every(d => d.proteinG === 0)).toBe(true);
    expect(out.every(d => d.hasData === false)).toBe(true);
    expect(out.every(d => d.hitFloor === false)).toBe(true);
  });

  it('marks hitFloor when proteinG >= 80% of floor', () => {
    const entries: DayProteinEntry[] = [
      { date: '2026-05-24', proteinG: 80 }, // 80% of 100 → hit
      { date: '2026-05-23', proteinG: 79 }, // 79% → miss
      { date: '2026-05-22', proteinG: 120 }, // >100% → hit
    ];
    const out = buildHitHistory(entries, 100, 3, ASOF);
    const byDate = Object.fromEntries(out.map(d => [d.date, d]));
    expect(byDate['2026-05-24'].hitFloor).toBe(true);
    expect(byDate['2026-05-23'].hitFloor).toBe(false);
    expect(byDate['2026-05-22'].hitFloor).toBe(true);
  });

  it('sums multiple entries for the same date', () => {
    const entries: DayProteinEntry[] = [
      { date: '2026-05-24', proteinG: 30 },
      { date: '2026-05-24', proteinG: 30 },
      { date: '2026-05-24', proteinG: 25 }, // total = 85 → hit at floor 100
    ];
    const out = buildHitHistory(entries, 100, 1, ASOF);
    expect(out[0].proteinG).toBe(85);
    expect(out[0].hitFloor).toBe(true);
    expect(out[0].hasData).toBe(true);
  });

  it('excludes entries outside the window (past and future)', () => {
    const entries: DayProteinEntry[] = [
      { date: '2026-05-10', proteinG: 100 }, // before window
      { date: '2026-05-25', proteinG: 100 }, // future
      { date: '2026-05-24', proteinG: 100 }, // inside
    ];
    const out = buildHitHistory(entries, 100, 7, ASOF);
    const totals = out.reduce((acc, d) => acc + d.proteinG, 0);
    expect(totals).toBe(100); // only the in-window entry counted
  });

  it('returns hitFloor=false for every day when proteinFloorG <= 0', () => {
    const entries: DayProteinEntry[] = [
      { date: '2026-05-24', proteinG: 500 },
    ];
    const zero = buildHitHistory(entries, 0, 1, ASOF);
    expect(zero[0].hitFloor).toBe(false);
    const negative = buildHitHistory(entries, -50, 1, ASOF);
    expect(negative[0].hitFloor).toBe(false);
  });
});

// ─── calculateHitRate ─────────────────────────────────────────────────────────

describe('calculateHitRate', () => {
  it('returns 0 for empty history', () => {
    expect(calculateHitRate([])).toBe(0);
  });

  it('returns 1.0 when all days hit', () => {
    const hist = buildHitHistory(
      [
        { date: '2026-05-22', proteinG: 100 },
        { date: '2026-05-23', proteinG: 100 },
        { date: '2026-05-24', proteinG: 100 },
      ],
      100,
      3,
      ASOF,
    );
    expect(calculateHitRate(hist)).toBe(1);
  });

  it('returns 0 when no days hit', () => {
    const hist = buildHitHistory([], 100, 3, ASOF);
    expect(calculateHitRate(hist)).toBe(0);
  });

  it('returns fractional rate for mixed history', () => {
    const hist = buildHitHistory(
      [
        { date: '2026-05-22', proteinG: 100 }, // hit
        { date: '2026-05-23', proteinG: 30 }, // miss
        { date: '2026-05-24', proteinG: 100 }, // hit
      ],
      100,
      3,
      ASOF,
    );
    expect(calculateHitRate(hist)).toBeCloseTo(2 / 3);
  });
});

// ─── calculateAdherence ───────────────────────────────────────────────────────

describe('calculateAdherence', () => {
  it('returns 1.0 for perfect weekly adherence over 28 days', () => {
    // 28 days / 7 = 4 expected shots
    const dates = [
      '2026-05-03', // 21d ago
      '2026-05-10', // 14d ago
      '2026-05-17', // 7d ago
      '2026-05-24', // today
    ];
    expect(calculateAdherence(dates, 7, 28, ASOF)).toBe(1);
  });

  it('returns 0.5 when half the expected shots were logged', () => {
    // 28d / 7 = 4 expected, only 2 actual
    const dates = ['2026-05-17', '2026-05-24'];
    expect(calculateAdherence(dates, 7, 28, ASOF)).toBe(0.5);
  });

  it('caps at 1.0 when actual exceeds expected (over-injecting not penalized)', () => {
    // 7d / 7 = 1 expected, 5 actual
    const dates = [
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
      '2026-05-23',
      '2026-05-24',
    ];
    expect(calculateAdherence(dates, 7, 7, ASOF)).toBe(1);
  });

  it('returns 0 when expected = 0 (interval larger than window)', () => {
    // biweekly (14) with 7d window → expected = 0
    expect(calculateAdherence(['2026-05-24'], 14, 7, ASOF)).toBe(0);
  });

  it('returns 0 when interval or days are non-positive', () => {
    expect(calculateAdherence(['2026-05-24'], 0, 30, ASOF)).toBe(0);
    expect(calculateAdherence(['2026-05-24'], 7, 0, ASOF)).toBe(0);
    expect(calculateAdherence(['2026-05-24'], -1, 30, ASOF)).toBe(0);
  });

  it('ignores future-dated and out-of-window entries', () => {
    // 28d window, 7d interval, expected = 4
    const dates = [
      '2026-04-01', // way before window
      '2026-06-01', // future
      '2026-05-17', // in window (7d ago)
      '2026-05-24', // today
    ];
    expect(calculateAdherence(dates, 7, 28, ASOF)).toBe(0.5); // 2/4
  });

  it('deduplicates same-day duplicate injections', () => {
    // 7d window, 7d interval, expected = 1; both entries on same day count once
    const dates = ['2026-05-24', '2026-05-24'];
    expect(calculateAdherence(dates, 7, 7, ASOF)).toBe(1);
  });
});

// ─── calculateAverageSymptom ──────────────────────────────────────────────────

describe('calculateAverageSymptom', () => {
  it('returns null when no entries exist', () => {
    expect(calculateAverageSymptom([], 30, ASOF)).toBeNull();
  });

  it('returns null when all entries are null-scored', () => {
    const entries: SymptomEntry[] = [
      { date: '2026-05-24', score: null },
      { date: '2026-05-23', score: null },
    ];
    expect(calculateAverageSymptom(entries, 7, ASOF)).toBeNull();
  });

  it('computes mean of non-null scores in window', () => {
    const entries: SymptomEntry[] = [
      { date: '2026-05-22', score: 2 },
      { date: '2026-05-23', score: 4 },
      { date: '2026-05-24', score: 3 },
    ];
    expect(calculateAverageSymptom(entries, 7, ASOF)).toBeCloseTo(3);
  });

  it('skips null scores but uses non-null', () => {
    const entries: SymptomEntry[] = [
      { date: '2026-05-22', score: null },
      { date: '2026-05-23', score: 5 },
      { date: '2026-05-24', score: 5 },
    ];
    expect(calculateAverageSymptom(entries, 7, ASOF)).toBe(5);
  });

  it('excludes out-of-window entries from the average', () => {
    const entries: SymptomEntry[] = [
      { date: '2026-04-01', score: 1 }, // outside
      { date: '2026-05-24', score: 5 }, // inside
    ];
    expect(calculateAverageSymptom(entries, 7, ASOF)).toBe(5);
  });
});
