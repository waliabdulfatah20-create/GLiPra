/**
 * CardioScreen — jest-expo RTL tests.
 *
 * i18n returns keys in the test environment, so assertions use key strings
 * (e.g. 'cardio.log_button') not translated text. The screen lives in features/
 * (not app/) so this test never enters Expo Router's require.context.
 */
import * as React from 'react';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { CardioScreen } from './cardio-screen';
import {
  useCardioInterference,
  useCardioLogs,
  useCardioWeekly,
  useDeleteCardioLog,
  useLogCardioSession,
} from './hooks';

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
  opts: {
    currentWeekSessions?: number;
    interference?: boolean;
    logs?: { id: string; performedAt: string; sessionType: string | null; durationMin: number | null }[];
  } = {},
) {
  const { currentWeekSessions = 0, interference = false, logs = [] } = opts;
  (useCardioWeekly as jest.Mock).mockReturnValue({
    frequency: { currentWeekSessions, loggedCount: logs.length },
    isLoading: false,
  });
  (useCardioLogs as jest.Mock).mockReturnValue({ logs, isLoading: false });
  (useCardioInterference as jest.Mock).mockReturnValue(interference);
  (useLogCardioSession as jest.Mock).mockReturnValue({ mutate: mockLog, isPending: false });
  (useDeleteCardioLog as jest.Mock).mockReturnValue({ mutate: mockRemove });
}

describe('cardio screen', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the weekly count and the secondary (muscle-first) note', () => {
    setup({ currentWeekSessions: 2 });
    render(<CardioScreen />);
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('cardio.sessions_this_week')).toBeTruthy();
    expect(screen.getByText('cardio.secondary_note')).toBeTruthy();
  });

  it('shows the interference warning when cardio outpaces resistance', () => {
    setup({ currentWeekSessions: 4, interference: true });
    render(<CardioScreen />);
    expect(screen.getByText('cardio.interference_warning')).toBeTruthy();
  });

  it('hides the interference warning when cardio is not outpacing resistance', () => {
    setup({ currentWeekSessions: 1, interference: false });
    render(<CardioScreen />);
    expect(screen.queryByText('cardio.interference_warning')).toBeNull();
  });

  it('logs a session with default (null) type and duration', () => {
    setup();
    render(<CardioScreen />);
    fireEvent.press(screen.getByLabelText('cardio.log_button'));
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls[0][0]).toEqual(
      expect.objectContaining({ sessionType: null, durationMin: null }),
    );
    expect(typeof mockLog.mock.calls[0][0].performedAt).toBe('string');
  });

  it('logs the selected session type after tapping a chip', () => {
    setup();
    render(<CardioScreen />);
    fireEvent.press(screen.getByLabelText('cardio.type_run'));
    fireEvent.press(screen.getByLabelText('cardio.log_button'));
    expect(mockLog.mock.calls[0][0]).toEqual(
      expect.objectContaining({ sessionType: 'run' }),
    );
  });

  it('renders the empty state when there are no logged sessions', () => {
    setup();
    render(<CardioScreen />);
    expect(screen.getByText('cardio.empty_title')).toBeTruthy();
  });

  it('renders recent sessions when logs exist', () => {
    setup({
      logs: [
        { id: 'c1', performedAt: '2026-06-09T15:00:00.000Z', sessionType: 'run', durationMin: 30 },
      ],
    });
    render(<CardioScreen />);
    expect(screen.queryByText('cardio.empty_title')).toBeNull();
    expect(screen.getByText(/30 cardio\.minutes_short/)).toBeTruthy();
  });
});
