/**
 * SupplementQuickAddSheet — jest-expo RTL tests. i18n returns keys in the test
 * env; the built entry (name/amount) comes from the real buildSupplementEntry.
 */
import * as React from 'react';

import { getSupplementNutrient } from '@/features/food-log/supplement';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { SupplementQuickAddSheet } from './supplement-quick-add-sheet';

const VITD = getSupplementNutrient('vitaminDIu');

describe('supplement quick-add sheet', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the title + label hint for the nutrient', () => {
    render(<SupplementQuickAddSheet nutrient={VITD} onAdd={jest.fn()} onClose={jest.fn()} />);
    expect(screen.getByText('log.supplement_sheet_title')).toBeTruthy();
    expect(screen.getByText('log.supplement_label_hint')).toBeTruthy();
  });

  it('adds the built entry when an amount is entered', () => {
    const onAdd = jest.fn();
    render(<SupplementQuickAddSheet nutrient={VITD} onAdd={onAdd} onClose={jest.fn()} />);
    fireEvent.changeText(screen.getByLabelText('log.supplement_amount'), '2000');
    fireEvent.press(screen.getByLabelText('log.supplement_add'));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ vitaminDIu: 2000, name: 'Vitamin D', servingDescription: '2000 IU' }),
    );
  });

  it('does not add when the amount is blank', () => {
    const onAdd = jest.fn();
    render(<SupplementQuickAddSheet nutrient={VITD} onAdd={onAdd} onClose={jest.fn()} />);
    fireEvent.press(screen.getByLabelText('log.supplement_add'));
    expect(onAdd).not.toHaveBeenCalled();
  });
});
