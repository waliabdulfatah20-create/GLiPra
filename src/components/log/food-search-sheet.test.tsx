/**
 * FoodSearchSheet — jest-expo RTL tests.
 *
 * The dual-mode seeded-foods search (Cascade D): log mode inserts a
 * source='database' entry; select mode hands the food to onSelect and
 * inserts nothing.
 */
import type { SeededFood } from '@/features/food-log/food-search';
import * as React from 'react';
import { useInsertDatabaseFoodLog, useSearchFoods } from '@/features/food-log/hooks';
import { act, cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { FoodSearchSheet } from './food-search-sheet';

jest.mock('@/features/food-log/hooks');
jest.mock('@/lib/haptics', () => ({
  haptics: { medium: jest.fn(), selection: jest.fn(), success: jest.fn(), tap: jest.fn() },
}));

const FOOD: SeededFood = {
  id: 'curated-greek-yogurt-nonfat-plain',
  name: 'Greek yogurt, plain, nonfat',
  nameEs: 'Yogur griego natural descremado',
  brand: null,
  barcode: null,
  servingDescription: '1 cup (245 g)',
  servingSizeG: 245,
  caloriesKcal: 130,
  proteinG: 23,
  carbsG: 9,
  fatG: 0.5,
  fiberG: 0,
  b12Mcg: 1.3,
  ironMg: 0.1,
  magnesiumMg: 27,
  vitaminDIu: 0,
  zincMg: 1.2,
};

const mockUseSearchFoods = useSearchFoods as jest.Mock;
const mockUseInsertDatabaseFoodLog = useInsertDatabaseFoodLog as jest.Mock;

const mutateMock = jest.fn();

function setUp() {
  mockUseSearchFoods.mockReturnValue({ results: [FOOD], isLoading: false });
  mockUseInsertDatabaseFoodLog.mockReturnValue({ mutate: mutateMock, isLoading: false });
}

function typeQuery(text: string) {
  fireEvent.changeText(screen.getByLabelText('log.search_placeholder'), text);
  act(() => {
    jest.advanceTimersByTime(350);
  });
}

describe('food search sheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    setUp();
  });

  afterEach(() => {
    jest.useRealTimers();
    cleanup();
    jest.clearAllMocks();
  });

  it('shows the min-chars hint before a query is typed', () => {
    render(<FoodSearchSheet visible mode="log" onClose={jest.fn()} />);
    expect(screen.getByText('log.search_min_chars')).toBeTruthy();
  });

  it('renders results after typing a query', () => {
    render(<FoodSearchSheet visible mode="log" onClose={jest.fn()} />);
    typeQuery('yog');
    expect(screen.getByText('Greek yogurt, plain, nonfat')).toBeTruthy();
  });

  it('tapping a result shows the preview card', () => {
    render(<FoodSearchSheet visible mode="log" onClose={jest.fn()} />);
    typeQuery('yog');
    fireEvent.press(screen.getByLabelText('Greek yogurt, plain, nonfat'));
    expect(screen.getByText('log.search_curated_badge')).toBeTruthy();
    expect(screen.getByText('log.search_log_button')).toBeTruthy();
  });

  it('log mode: Log it inserts the mapped database entry and closes', () => {
    const onClose = jest.fn();
    render(<FoodSearchSheet visible mode="log" onClose={onClose} />);
    typeQuery('yog');
    fireEvent.press(screen.getByLabelText('Greek yogurt, plain, nonfat'));
    fireEvent.press(screen.getByLabelText('log.search_log_button'));
    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Greek yogurt, plain, nonfat',
        servingDescription: '1 cup (245 g)',
        proteinG: 23,
        barcodeEan: null,
      }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('select mode: Use this food calls onSelect and does NOT insert', () => {
    const onClose = jest.fn();
    const onSelect = jest.fn();
    render(<FoodSearchSheet visible mode="select" onClose={onClose} onSelect={onSelect} />);
    typeQuery('yog');
    fireEvent.press(screen.getByLabelText('Greek yogurt, plain, nonfat'));
    fireEvent.press(screen.getByLabelText('log.search_use_button'));
    expect(onSelect).toHaveBeenCalledWith(FOOD);
    expect(mutateMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
