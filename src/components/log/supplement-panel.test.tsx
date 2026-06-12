/**
 * SupplementPanel — jest-expo RTL tests. useDailyMacros is mocked; i18n returns
 * keys in the test env, so nutrient labels are asserted via key strings and rows
 * are selected by testID (the a11y label interpolates the same key for all rows).
 */
import * as React from 'react';

import { useDailyMacros } from '@/features/food-log/hooks';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { SupplementPanel } from './supplement-panel';

jest.mock('@/features/food-log/hooks');

function setup() {
  (useDailyMacros as jest.Mock).mockReturnValue({
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    calories: 0,
    magnesiumMg: 0,
    zincMg: 0,
    b12Mcg: 0,
    vitaminDIu: 0,
    ironMg: 0,
    hasMicronutrients: false,
    isLoading: false,
  });
}

describe('supplement panel', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the hint and a row per tracked nutrient', () => {
    setup();
    render(<SupplementPanel onAdd={jest.fn()} />);
    expect(screen.getByText('log.supplement_panel_hint')).toBeTruthy();
    expect(screen.getByTestId('supplement-row-magnesiumMg')).toBeTruthy();
    expect(screen.getByTestId('supplement-row-zincMg')).toBeTruthy();
    expect(screen.getByTestId('supplement-row-ironMg')).toBeTruthy();
    expect(screen.getByTestId('supplement-row-b12Mcg')).toBeTruthy();
    expect(screen.getByTestId('supplement-row-vitaminDIu')).toBeTruthy();
  });

  it('calls onAdd with the nutrient key when a row is tapped', () => {
    setup();
    const onAdd = jest.fn();
    render(<SupplementPanel onAdd={onAdd} />);
    fireEvent.press(screen.getByTestId('supplement-row-vitaminDIu'));
    expect(onAdd).toHaveBeenCalledWith('vitaminDIu');
  });
});
