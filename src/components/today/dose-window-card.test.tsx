import * as React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';
import { DoseWindowCard } from './dose-window-card';

// The card derives its window state from the real clock, so freeze time and
// place the last dose ~40 min earlier the same day to land in the "clear" state.
const FROZEN_NOW = '2026-06-06T12:00:00.000Z';
const DOSE_40_MIN_AGO = '2026-06-06T11:20:00.000Z';

function clearStateProps(overrides: Record<string, unknown> = {}) {
  return {
    lastDoseTakenAt: DOSE_40_MIN_AGO,
    currentStreak: 0,
    onTake: jest.fn(),
    isLogging: false,
    lastDoseId: 'dose-A',
    lastDoseWindowRespected: null as boolean | null,
    onConfirmWindow: jest.fn(),
    isConfirming: false,
    ...overrides,
  };
}

describe('doseWindowCard — window-respected confirm', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(FROZEN_NOW));
  });

  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  // The jest env returns i18n KEYS rather than translated values, so assert on
  // the keys (confirm_yes / confirm_no) which only render in the confirm state.
  const YES = 'oral_dose.confirm_yes';
  const NO = 'oral_dose.confirm_no';

  it('shows the confirm prompt in the clear state when window_respected is unanswered', () => {
    render(<DoseWindowCard {...clearStateProps()} />);
    expect(screen.getByText(YES)).toBeOnTheScreen();
    expect(screen.getByText(NO)).toBeOnTheScreen();
  });

  it('hides the confirm once already answered (server value present)', () => {
    render(<DoseWindowCard {...clearStateProps({ lastDoseWindowRespected: true })} />);
    expect(screen.queryByText(YES)).toBeNull();
  });

  it('reappears for a NEW dose after the previous one was answered (day-2 regression)', () => {
    const onConfirmWindow = jest.fn();
    const { rerender } = render(
      <DoseWindowCard {...clearStateProps({ onConfirmWindow })} />,
    );

    // Answer day-1's dose optimistically.
    fireEvent.press(screen.getByText(YES));
    expect(onConfirmWindow).toHaveBeenCalledWith(true);
    // Confirm buttons are replaced by the acknowledgement.
    expect(screen.queryByText(YES)).toBeNull();

    // Day-2: a new dose row arrives (new id, still unanswered). The optimistic
    // answer must reset so the confirm prompt comes back — the core regression.
    rerender(
      <DoseWindowCard {...clearStateProps({ lastDoseId: 'dose-B', onConfirmWindow })} />,
    );
    expect(screen.getByText(YES)).toBeOnTheScreen();
    expect(screen.getByText(NO)).toBeOnTheScreen();
  });
});
