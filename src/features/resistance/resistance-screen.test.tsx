/**
 * ResistanceScreen — jest-expo RTL tests.
 *
 * i18n returns keys in the test environment, so assertions use key strings
 * (e.g. 'resistance.log_button') not translated text. The screen lives in
 * features/ (not app/) so this test never enters Expo Router's require.context.
 */
import * as React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import {
  useDeleteResistanceLog,
  useLogResistanceSession,
  useResistanceLogs,
  useResistanceWeekly,
} from './hooks';
import { ResistanceScreen } from './resistance-screen';

jest.mock('./hooks');
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/lib/haptics', () => ({
  haptics: { medium: jest.fn(), selection: jest.fn(), tap: jest.fn() },
}));
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
}));

const mockLog = jest.fn();
const mockRemove = jest.fn();

function setup(
  freqOverrides: Partial<ReturnType<typeof useResistanceWeekly>['frequency']> = {},
  logs: { id: string; performedAt: string; sessionType: string | null; durationMin: number | null }[] = [],
) {
  (useResistanceWeekly as jest.Mock).mockReturnValue({
    frequency: {
      currentWeekSessions: 0,
      weeklyTarget: 2,
      currentStreak: 0,
      longestStreak: 0,
      weeksTracked: 0,
      hitRate: 0,
      loggedCount: 0,
      ...freqOverrides,
    },
    isLoading: false,
  });
  (useResistanceLogs as jest.Mock).mockReturnValue({ logs, isLoading: false });
  (useLogResistanceSession as jest.Mock).mockReturnValue({ mutate: mockLog, isPending: false });
  (useDeleteResistanceLog as jest.Mock).mockReturnValue({ mutate: mockRemove });
}

describe('resistance screen', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the weekly count and the aim copy when below target', () => {
    setup({ currentWeekSessions: 1, weeklyTarget: 2 });
    render(<ResistanceScreen />);
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('resistance.sessions_this_week')).toBeTruthy();
    expect(screen.getByText('resistance.aim')).toBeTruthy();
  });

  it('shows the met copy when the weekly target is reached', () => {
    setup({ currentWeekSessions: 2, weeklyTarget: 2 });
    render(<ResistanceScreen />);
    expect(screen.getByText('resistance.met')).toBeTruthy();
  });

  it('shows the week streak pill when a streak exists', () => {
    setup({ currentStreak: 3 });
    render(<ResistanceScreen />);
    expect(screen.getByText('resistance.week_streak')).toBeTruthy();
  });

  it('logs a session with default (null) type and duration', () => {
    setup();
    render(<ResistanceScreen />);
    fireEvent.press(screen.getByLabelText('resistance.log_button'));
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0][0]).toEqual(
      expect.objectContaining({ sessionType: null, durationMin: null }),
    );
    expect(typeof mockLog.mock.calls[0][0].performedAt).toBe('string');
  });

  it('logs the selected session type after tapping a chip', () => {
    setup();
    render(<ResistanceScreen />);
    fireEvent.press(screen.getByLabelText('resistance.type_upper'));
    fireEvent.press(screen.getByLabelText('resistance.log_button'));
    expect(mockLog.mock.calls[0][0]).toEqual(
      expect.objectContaining({ sessionType: 'upper' }),
    );
  });

  it('renders the empty state when there are no logged sessions', () => {
    setup();
    render(<ResistanceScreen />);
    expect(screen.getByText('resistance.empty_title')).toBeTruthy();
  });

  it('renders recent sessions when logs exist', () => {
    setup({}, [
      { id: 'r1', performedAt: '2026-06-09T15:00:00.000Z', sessionType: 'lower', durationMin: 45 },
    ]);
    render(<ResistanceScreen />);
    expect(screen.queryByText('resistance.empty_title')).toBeNull();
    // The recent row joins type + duration; the "45 min" segment is unique to it.
    expect(screen.getByText(/45 resistance\.minutes_short/)).toBeTruthy();
  });
});
