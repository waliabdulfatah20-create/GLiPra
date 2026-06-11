/**
 * MedicationCard — jest-expo RTL tests. Queried via testID + the literal Day chip so
 * the assertions don't depend on whether i18n resolves keys or English in the test env.
 */
import * as React from 'react';

import { router } from 'expo-router';

import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { MedicationCard } from './medication-card';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/lib/haptics', () => ({ haptics: { tap: jest.fn() } }));

describe('medication card', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the card with a day chip', () => {
    render(<MedicationCard phase="building" daysOnMed={6} />);
    expect(screen.getByTestId('medication-card')).toBeTruthy();
    expect(screen.getByText('Day 6')).toBeTruthy();
  });

  it('hides the day chip when daysOnMed is 0', () => {
    render(<MedicationCard phase="dose_due" daysOnMed={0} />);
    expect(screen.queryByText('Day 0')).toBeNull();
  });

  it('navigates to the medication level screen when pressed', () => {
    render(<MedicationCard phase="steady_state" daysOnMed={20} />);
    fireEvent.press(screen.getByTestId('medication-card'));
    expect(router.push).toHaveBeenCalledWith('/medication-level');
  });
});
