import { describe, expect, it } from 'vitest';

import {
  calculateOralPhase,
  ORAL_STEADY_STATE_DAYS,
} from '@/features/oral-cycle/calculator';

const TODAY = '2026-06-05';

describe('calculateOralPhase — adherence overlay', () => {
  it('returns dose_due when no dose has ever been logged', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-01', // 35 days → steady
      lastDoseDate: null,
      today: TODAY,
    });
    expect(result.phase).toBe('dose_due');
    // Adherence is unknown but the user is genuinely at steady state on the ramp.
    expect(result.isSteadyState).toBe(true);
    expect(result.daysOnMed).toBe(35);
  });

  it('returns dose_due when today\'s dose is still pending (took it yesterday)', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-20',
      lastDoseDate: '2026-06-04', // yesterday
      today: TODAY,
    });
    expect(result.phase).toBe('dose_due');
  });

  it('returns dose_missed when the last dose was 2 days ago', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-20',
      lastDoseDate: '2026-06-03',
      today: TODAY,
    });
    expect(result.phase).toBe('dose_missed');
  });

  it('returns dose_missed when the last dose was many days ago', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-01',
      lastDoseDate: '2026-05-31', // 5 days ago
      today: TODAY,
    });
    expect(result.phase).toBe('dose_missed');
  });
});

describe('calculateOralPhase — titration position when today is handled', () => {
  it('returns building when today\'s dose is logged and still within the ramp', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-20', // 16 days < 28
      lastDoseDate: TODAY,
      today: TODAY,
    });
    expect(result.phase).toBe('building');
    expect(result.isSteadyState).toBe(false);
    expect(result.daysOnMed).toBe(16);
  });

  it('returns steady_state when today\'s dose is logged and past the ramp', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-01', // 35 days
      lastDoseDate: TODAY,
      today: TODAY,
    });
    expect(result.phase).toBe('steady_state');
    expect(result.isSteadyState).toBe(true);
  });

  it('treats the steady-state threshold as inclusive (exactly 28 days = steady)', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-08', // exactly 28 days
      lastDoseDate: TODAY,
      today: TODAY,
    });
    expect(result.daysOnMed).toBe(ORAL_STEADY_STATE_DAYS);
    expect(result.isSteadyState).toBe(true);
    expect(result.phase).toBe('steady_state');
  });

  it('returns building one day before the threshold (27 days)', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-09', // 27 days
      lastDoseDate: TODAY,
      today: TODAY,
    });
    expect(result.daysOnMed).toBe(27);
    expect(result.isSteadyState).toBe(false);
    expect(result.phase).toBe('building');
  });

  it('treats a dose dated in the future as taken today', () => {
    const result = calculateOralPhase({
      startDate: '2026-05-20',
      lastDoseDate: '2026-06-06', // future → daysSince <= 0
      today: TODAY,
    });
    expect(result.phase).toBe('building');
  });
});

describe('calculateOralPhase — missing or invalid startDate', () => {
  it('defaults daysOnMed to 0 and building when startDate is null', () => {
    const result = calculateOralPhase({
      startDate: null,
      lastDoseDate: TODAY,
      today: TODAY,
    });
    expect(result.daysOnMed).toBe(0);
    expect(result.isSteadyState).toBe(false);
    expect(result.phase).toBe('building');
  });

  it('clamps daysOnMed to 0 when startDate is in the future', () => {
    const result = calculateOralPhase({
      startDate: '2026-07-01',
      lastDoseDate: TODAY,
      today: TODAY,
    });
    expect(result.daysOnMed).toBe(0);
    expect(result.phase).toBe('building');
  });
});
