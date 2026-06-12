/**
 * AIReviewSheet — Rescan flow RTL tests.
 *
 * i18n returns keys in the test env, so links/labels are asserted via key
 * strings. The heavy children (FoodSearchSheet, ProInsightCard) are stubbed;
 * PhotoCommentSheet is real so the pre-filled hint can be asserted.
 */
import type { RecognitionResult } from './photo-recognition';
import * as React from 'react';

import { useConfirmPhotoLog, useUserFoodDefault } from '@/features/food-log/hooks';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { AIReviewSheet } from './ai-review-sheet';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/features/food-log/hooks');
jest.mock('@/lib/haptics', () => ({
  haptics: { medium: jest.fn(), selection: jest.fn(), success: jest.fn(), tap: jest.fn() },
}));
jest.mock('./pro-insight-card', () => ({ ProInsightCard: () => null }));
jest.mock('@/components/log/food-search-sheet', () => ({ FoodSearchSheet: () => null }));

const RESULT: RecognitionResult = {
  name: 'Grilled chicken breast',
  servingDescription: '1 breast (170 g)',
  proteinG: 52,
  carbsG: 0,
  fatG: 6,
  fiberG: 0,
  caloriesKcal: 280,
  b12Mcg: null,
  vitaminDIu: null,
  magnesiumMg: null,
  zincMg: null,
  ironMg: null,
  confidence: 'high',
  confidencePercent: 85,
};

function setup() {
  (useUserFoodDefault as jest.Mock).mockReturnValue({ defaults: null });
  (useConfirmPhotoLog as jest.Mock).mockReturnValue({ confirm: jest.fn(), isLoading: false });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ai review sheet rescan', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('shows the rescan link on photo results (onRescan provided)', () => {
    setup();
    render(<AIReviewSheet result={RESULT} onClose={jest.fn()} onRescan={jest.fn()} />);
    expect(screen.getByText('log.rescan_link')).toBeTruthy();
    expect(screen.getByText('log.wrong_food_link')).toBeTruthy();
  });

  it('hides the rescan link on voice results (no onRescan)', () => {
    setup();
    render(<AIReviewSheet result={RESULT} onClose={jest.fn()} transcript="chicken and rice" />);
    expect(screen.queryByText('log.rescan_link')).toBeNull();
  });

  it('opens the hint sheet pre-filled with the original comment on rescan tap', () => {
    setup();
    const onRescan = jest.fn();
    render(
      <AIReviewSheet
        result={RESULT}
        onClose={jest.fn()}
        onRescan={onRescan}
        rescanInitialComment="half plate of rice"
      />,
    );
    fireEvent.press(screen.getByLabelText('log.rescan_link'));
    expect(screen.getByDisplayValue('half plate of rice')).toBeTruthy();
    expect(onRescan).not.toHaveBeenCalled(); // opening the sheet does not rescan yet
  });

  it('hands the edited hint to onRescan on Analyze and closes the overlay', () => {
    setup();
    const onRescan = jest.fn();
    render(
      <AIReviewSheet
        result={RESULT}
        onClose={jest.fn()}
        onRescan={onRescan}
        rescanInitialComment="half plate of rice"
      />,
    );
    fireEvent.press(screen.getByLabelText('log.rescan_link'));
    fireEvent.changeText(
      screen.getByLabelText('log.photo_comment_title'),
      'it is grilled salmon, not chicken',
    );
    fireEvent.press(screen.getByLabelText('log.photo_comment_analyze'));
    expect(onRescan).toHaveBeenCalledWith('it is grilled salmon, not chicken');
    expect(screen.queryByLabelText('log.photo_comment_title')).toBeNull(); // overlay closed
  });

  it('rescans with no hint when the user skips', () => {
    setup();
    const onRescan = jest.fn();
    render(<AIReviewSheet result={RESULT} onClose={jest.fn()} onRescan={onRescan} />);
    fireEvent.press(screen.getByLabelText('log.rescan_link'));
    fireEvent.press(screen.getByLabelText('log.photo_comment_skip'));
    expect(onRescan).toHaveBeenCalledWith(undefined);
  });
});
