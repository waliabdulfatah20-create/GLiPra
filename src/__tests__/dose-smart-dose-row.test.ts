import type { InjectionCycleResult } from '@/features/injection-cycle/calculator';
import { describe, expect, it } from 'vitest';

import { selectInjectionDoseRow } from '@/features/dose/smart-dose-row';

function cycle(overrides: Partial<InjectionCycleResult> = {}): InjectionCycleResult {
  return {
    phase: 'recovery_window',
    daysSinceInjection: 5,
    daysUntilNextInjection: 2,
    isOverdue: false,
    nextInjectionDate: '2026-06-09',
    ...overrides,
  };
}

describe('selectInjectionDoseRow', () => {
  it('prompts to log the first shot when there is no cycle yet', () => {
    const row = selectInjectionDoseRow(null);
    expect(row).toEqual({
      pillKey: 'today.dose_row_log_shot',
      days: null,
      target: '/add-shot',
      isLogShot: true,
    });
  });

  it('prompts to log the shot on injection day', () => {
    const row = selectInjectionDoseRow(cycle({ phase: 'injection_day', daysSinceInjection: 0, daysUntilNextInjection: 7 }));
    expect(row.isLogShot).toBe(true);
    expect(row.target).toBe('/add-shot');
    expect(row.pillKey).toBe('today.dose_row_log_shot');
  });

  it('prompts to log the shot when the scheduled dose day has arrived (0 days until next)', () => {
    const row = selectInjectionDoseRow(cycle({ phase: 'recovery_window', daysSinceInjection: 7, daysUntilNextInjection: 0 }));
    expect(row).toEqual({
      pillKey: 'today.dose_row_log_shot',
      days: null,
      target: '/add-shot',
      isLogShot: true,
    });
  });

  it('shows the overdue pill and routes to the hub when overdue', () => {
    const row = selectInjectionDoseRow(cycle({ phase: 'overdue', daysSinceInjection: 9, daysUntilNextInjection: null, isOverdue: true, nextInjectionDate: null }));
    expect(row).toEqual({
      pillKey: 'today.dose_row_overdue',
      days: null,
      target: '/dose',
      isLogShot: false,
    });
  });

  it('shows the next-dose countdown otherwise, routing to the hub', () => {
    const row = selectInjectionDoseRow(cycle({ phase: 'recovery_window', daysUntilNextInjection: 3 }));
    expect(row).toEqual({
      pillKey: 'today.dose_row_next',
      days: 3,
      target: '/dose',
      isLogShot: false,
    });
  });
});
