/**
 * ChangeMedicationScreen — jest-expo RTL. The 3-step switch flow is driven end to
 * end on the oral path (fewest inputs); useTodayProfile + the change hook are mocked.
 * i18n returns keys in the test env, so copy is asserted via key strings; the
 * dose-time chips use real 12-hour labels (not i18n).
 */
import * as React from 'react';

import { useChangeMedication } from '@/features/medication-change/hooks';
import { useTodayProfile } from '@/features/today/hooks';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { ChangeMedicationScreen } from './change-medication-screen';

jest.mock('@/features/today/hooks');
jest.mock('@/features/medication-change/hooks');
jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn() } }));

const mutate = jest.fn();

function setup(profileOver: Record<string, unknown> = {}) {
  (useTodayProfile as jest.Mock).mockReturnValue({
    data: { medicationId: 'semaglutide_rybelsus', administrationRoute: 'oral', ...profileOver },
  });
  (useChangeMedication as jest.Mock).mockReturnValue({ mutate, isLoading: false, isSuccess: false });
}

describe('change medication flow', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the medication picker on step 1', () => {
    setup();
    render(<ChangeMedicationScreen />);
    expect(screen.getByText('change_med.pick_subtitle')).toBeTruthy();
    expect(screen.getByTestId('med-option-semaglutide_ozempic')).toBeTruthy();
    expect(screen.getByTestId('med-option-semaglutide_rybelsus')).toBeTruthy();
  });

  it('walks oral pick -> schedule -> confirm and saves the built selection', () => {
    setup();
    render(<ChangeMedicationScreen />);

    // Step 1: rybelsus is prefilled from the profile -> Next is enabled.
    fireEvent.press(screen.getByText('change_med.next'));

    // Step 2 (oral fork): dose-time chips + start date.
    expect(screen.getByText('change_med.dose_time')).toBeTruthy();
    fireEvent.press(screen.getByText('8:00 AM'));
    fireEvent.changeText(screen.getByLabelText('change_med.start_date'), '06/12/2026');
    fireEvent.press(screen.getByText('change_med.next'));

    // Step 3: status + save.
    expect(screen.getByText('change_med.status_q')).toBeTruthy();
    fireEvent.press(screen.getByTestId('status-option-starting'));
    fireEvent.press(screen.getByTestId('change-med-save'));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        medicationId: 'semaglutide_rybelsus',
        status: 'starting',
        schedule: expect.objectContaining({
          route: 'oral',
          doseTimeLocal: '08:00',
          medicationStartDate: '2026-06-12',
        }),
      }),
    );
  });

  it('shows the injection fork when an injection medication is chosen', () => {
    setup();
    render(<ChangeMedicationScreen />);
    fireEvent.press(screen.getByTestId('med-option-tirzepatide_mounjaro'));
    fireEvent.press(screen.getByText('change_med.next'));
    expect(screen.getByText('change_med.frequency')).toBeTruthy();
    expect(screen.getByText('change_med.last_injection')).toBeTruthy();
  });
});
