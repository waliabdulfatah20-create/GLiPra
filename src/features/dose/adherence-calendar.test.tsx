/**
 * AdherenceCalendar — jest-expo RTL tests.
 *
 * i18n returns keys in the test environment, so assertions use key strings
 * (e.g. 'dose.calendar_legend_taken') not translated text.
 */
import * as React from 'react';

import { useInjectionLogs } from '@/features/injection-sites/hooks';
import { useOralDoseLogs } from '@/features/oral-dose/hooks';
import { useTodayData } from '@/features/today/hooks';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { AdherenceCalendar } from './adherence-calendar';

jest.mock('@/features/today/hooks');
jest.mock('@/features/oral-dose/hooks');
jest.mock('@/features/injection-sites/hooks');

const mockUseTodayData = useTodayData as jest.Mock;
const mockUseOralDoseLogs = useOralDoseLogs as jest.Mock;
const mockUseInjectionLogs = useInjectionLogs as jest.Mock;

// A recent date relative to whatever "today" the test clock reports. Using a
// fixed-but-recent ISO keeps the logged day inside the trailing-week grid.
function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(8, 0, 0, 0);
  return d.toISOString();
}

function setupOral(logs: { takenAt: string; windowRespected: boolean | null }[]) {
  mockUseTodayData.mockReturnValue({ administrationRoute: 'oral', isLoading: false });
  mockUseOralDoseLogs.mockReturnValue({ logs, isLoading: false });
  mockUseInjectionLogs.mockReturnValue({ logs: [], isLoading: false });
}

function setupInjection(dates: string[]) {
  mockUseTodayData.mockReturnValue({ administrationRoute: 'injection', isLoading: false });
  mockUseOralDoseLogs.mockReturnValue({ logs: [], isLoading: false });
  mockUseInjectionLogs.mockReturnValue({
    logs: dates.map((injected_at, i) => ({
      id: `s${i}`,
      user_id: 'u',
      injected_at,
      site_code: 'abdomen_left',
      medication_name: 'Ozempic',
      dosage_strength: null,
      pain_level: 2,
      notes: null,
      created_at: injected_at,
    })),
    isLoading: false,
  });
}

describe('adherence calendar', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('shows a skeleton while loading', () => {
    mockUseTodayData.mockReturnValue({ administrationRoute: 'oral', isLoading: true });
    mockUseOralDoseLogs.mockReturnValue({ logs: [], isLoading: true });
    mockUseInjectionLogs.mockReturnValue({ logs: [], isLoading: false });
    render(<AdherenceCalendar />);
    expect(screen.queryByTestId('adherence-calendar')).toBeNull();
  });

  it('shows the empty state for an oral user with no doses', () => {
    setupOral([]);
    render(<AdherenceCalendar />);
    expect(screen.getByText('dose.calendar_empty_title')).toBeTruthy();
    expect(screen.queryByTestId('adherence-calendar')).toBeNull();
  });

  it('renders the oral grid, legend and streak header with data', () => {
    setupOral([
      { takenAt: daysAgoIso(2), windowRespected: true },
      { takenAt: daysAgoIso(1), windowRespected: true },
      { takenAt: daysAgoIso(0), windowRespected: true },
    ]);
    render(<AdherenceCalendar />);
    expect(screen.getByTestId('adherence-calendar')).toBeTruthy();
    expect(screen.getByText('dose.calendar_streak_current')).toBeTruthy();
    expect(screen.getByText('dose.calendar_legend_taken')).toBeTruthy();
    expect(screen.getByText('dose.calendar_legend_broken')).toBeTruthy();
  });

  it('shows the not-enough state for an injection user with a single shot', () => {
    setupInjection([daysAgoIso(0)]);
    render(<AdherenceCalendar />);
    expect(screen.getByTestId('adherence-calendar')).toBeTruthy();
    expect(screen.getByText('dose.calendar_not_enough')).toBeTruthy();
    // The broken legend is oral-only — should not appear for injection.
    expect(screen.queryByText('dose.calendar_legend_broken')).toBeNull();
  });

  it('renders the on-time stat for an injection user with enough shots', () => {
    setupInjection([daysAgoIso(14), daysAgoIso(7), daysAgoIso(0)]);
    render(<AdherenceCalendar />);
    expect(screen.getByText('dose.calendar_on_time')).toBeTruthy();
    expect(screen.queryByText('dose.calendar_not_enough')).toBeNull();
  });

  it('reveals an inline day-detail row when a cell is tapped', () => {
    setupOral([{ takenAt: daysAgoIso(0), windowRespected: true }]);
    render(<AdherenceCalendar />);
    expect(screen.queryByTestId('adherence-day-detail')).toBeNull();
    // Tap the today cell (label is "<date>: <status>").
    const cells = screen.getAllByRole('button');
    fireEvent.press(cells[cells.length - 1]!);
    expect(screen.getByTestId('adherence-day-detail')).toBeTruthy();
  });
});
