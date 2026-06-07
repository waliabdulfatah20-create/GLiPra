/**
 * RemindersPanel — jest-expo RTL tests.
 *
 * i18n returns keys in the test environment, so all assertions use key strings
 * (e.g. 'settings.notif_oral_dose') not translated text.
 */
import * as React from 'react';

import { useUpdateDoseTime } from '@/features/dose/api';
import { useTodayData } from '@/features/today/hooks';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';
import { useNotificationSettings } from '@/lib/use-notification-settings';

import { RemindersPanel } from './reminders-panel';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/lib/use-notification-settings');
jest.mock('@/features/today/hooks');
jest.mock('@/features/dose/api');
jest.mock('@/lib/notifications', () => ({
  notifications: { scheduleOralDoseReminder: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('@react-native-community/datetimepicker', () => ({
  __esModule: true,
  default: () => null,
}));

// ─── Default return values ────────────────────────────────────────────────────

const mockToggle = jest.fn().mockResolvedValue(undefined);
const mockMutate = jest.fn();

function setupOral(overrides: Partial<ReturnType<typeof useNotificationSettings>> = {}) {
  (useNotificationSettings as jest.Mock).mockReturnValue({
    injectionEnabled: false,
    proteinEnabled: true,
    oralDoseEnabled: true,
    isOral: true,
    toggle: mockToggle,
    ...overrides,
  });
  (useTodayData as jest.Mock).mockReturnValue({
    profile: { doseTimeLocal: '08:30:00' },
    isLoading: false,
  });
  (useUpdateDoseTime as jest.Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  });
}

function setupInjection() {
  (useNotificationSettings as jest.Mock).mockReturnValue({
    injectionEnabled: true,
    proteinEnabled: true,
    oralDoseEnabled: false,
    isOral: false,
    toggle: mockToggle,
  });
  (useTodayData as jest.Mock).mockReturnValue({
    profile: { doseTimeLocal: null },
    isLoading: false,
  });
  (useUpdateDoseTime as jest.Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('reminders panel', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  // ── Section label ──────────────────────────────────────────────────────────
  it('renders the section label', () => {
    setupOral();
    render(<RemindersPanel />);
    expect(screen.getByText('dose.reminders_title')).toBeTruthy();
  });

  // ── Oral route ─────────────────────────────────────────────────────────────
  describe('oral route', () => {
    it('renders oral-dose toggle and protein-nudge toggle', () => {
      setupOral();
      render(<RemindersPanel />);
      expect(screen.getByText('settings.notif_oral_dose')).toBeTruthy();
      expect(screen.getByText('settings.notif_protein')).toBeTruthy();
    });

    it('does NOT render injection reminder label', () => {
      setupOral();
      render(<RemindersPanel />);
      expect(screen.queryByText('settings.notif_injection')).toBeNull();
    });

    it('shows time-picker row when oralDoseEnabled is true', () => {
      setupOral({ oralDoseEnabled: true });
      render(<RemindersPanel />);
      expect(screen.getByTestId('time-picker-row')).toBeTruthy();
    });

    it('hides time-picker row when oralDoseEnabled is false', () => {
      setupOral({ oralDoseEnabled: false });
      render(<RemindersPanel />);
      expect(screen.queryByTestId('time-picker-row')).toBeNull();
    });

    it('renders absorption info', () => {
      setupOral();
      render(<RemindersPanel />);
      expect(screen.getByText('dose.reminders_absorption_info')).toBeTruthy();
    });

    it('calls toggle with oral-dose-reminder when oral Switch fires', () => {
      setupOral();
      render(<RemindersPanel />);
      const oralSwitch = screen.getByLabelText('settings.notif_oral_dose');
      fireEvent(oralSwitch, 'valueChange', true);
      expect(mockToggle).toHaveBeenCalledWith('oral-dose-reminder');
    });

    it('calls toggle with daily-protein-nudge when protein Switch fires', () => {
      setupOral();
      render(<RemindersPanel />);
      const proteinSwitch = screen.getByLabelText('settings.notif_protein');
      fireEvent(proteinSwitch, 'valueChange', true);
      expect(mockToggle).toHaveBeenCalledWith('daily-protein-nudge');
    });

    it('opens time picker when time row is pressed', () => {
      setupOral({ oralDoseEnabled: true });
      render(<RemindersPanel />);
      const timeRow = screen.getByTestId('time-picker-row');
      fireEvent.press(timeRow);
      // DateTimePicker mock returns null, but mutate should not be called yet
      expect(mockMutate).not.toHaveBeenCalled();
    });
  });

  // ── Injection route ────────────────────────────────────────────────────────
  describe('injection route', () => {
    it('renders injection-reminder toggle and protein-nudge toggle', () => {
      setupInjection();
      render(<RemindersPanel />);
      expect(screen.getByText('settings.notif_injection')).toBeTruthy();
      expect(screen.getByText('settings.notif_protein')).toBeTruthy();
    });

    it('does NOT render oral dose label', () => {
      setupInjection();
      render(<RemindersPanel />);
      expect(screen.queryByText('settings.notif_oral_dose')).toBeNull();
    });

    it('does NOT render time-picker row', () => {
      setupInjection();
      render(<RemindersPanel />);
      expect(screen.queryByTestId('time-picker-row')).toBeNull();
    });

    it('does NOT render absorption info', () => {
      setupInjection();
      render(<RemindersPanel />);
      expect(screen.queryByText('dose.reminders_absorption_info')).toBeNull();
    });

    it('calls toggle with injection-reminder when injection Switch fires', () => {
      setupInjection();
      render(<RemindersPanel />);
      const injSwitch = screen.getByLabelText('settings.notif_injection');
      fireEvent(injSwitch, 'valueChange', true);
      expect(mockToggle).toHaveBeenCalledWith('injection-reminder');
    });
  });
});
