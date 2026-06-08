/**
 * MuscleScoreTrendCard — jest-expo RTL tests.
 * i18n returns keys in tests; the trend data comes from a mocked hook.
 */
import * as React from 'react';

import { useMuscleScoreTrend } from '@/features/muscle-score/trend-hooks';
import { cleanup, render, screen } from '@/lib/test-utils';

import { MuscleScoreTrendCard } from './muscle-score-trend-card';

jest.mock('@/features/muscle-score/trend-hooks');

const mockUse = useMuscleScoreTrend as jest.Mock;

describe('muscle score trend card', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the current score + chart when there are at least two tracked weeks', () => {
    mockUse.mockReturnValue({
      points: [
        { weekStart: '2026-05-25', score: 60, hasEnoughData: true },
        { weekStart: '2026-06-01', score: 68, hasEnoughData: true },
        { weekStart: '2026-06-08', score: 72, hasEnoughData: true },
      ],
      currentScore: 72,
      trackedCount: 3,
      isLoading: false,
    });
    render(<MuscleScoreTrendCard width={320} />);
    expect(screen.getByText('72')).toBeTruthy();
    expect(screen.getByText('progress.muscle_card.label')).toBeTruthy();
  });

  it('renders the building state with fewer than two tracked weeks', () => {
    mockUse.mockReturnValue({
      points: [{ weekStart: '2026-06-08', score: 72, hasEnoughData: true }],
      currentScore: 72,
      trackedCount: 1,
      isLoading: false,
    });
    render(<MuscleScoreTrendCard width={320} />);
    expect(screen.getByText('progress.muscle_card.empty_title')).toBeTruthy();
  });

  it('renders the loading state', () => {
    mockUse.mockReturnValue({ points: [], currentScore: null, trackedCount: 0, isLoading: true });
    render(<MuscleScoreTrendCard width={320} />);
    expect(screen.getByText('progress.loading')).toBeTruthy();
  });
});
