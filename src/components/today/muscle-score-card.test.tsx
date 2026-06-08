/**
 * MuscleScoreCard — jest-expo RTL tests.
 *
 * i18n returns keys in the test environment; the card's own copy (label, unit,
 * disclaimer) asserts on keys, while the score/headline/factors come from the
 * mocked useMuscleScore card object.
 */
import * as React from 'react';

import { useMuscleScore } from '@/features/muscle-score/hooks';
import { cleanup, render, screen } from '@/lib/test-utils';

import { MuscleScoreCard } from './muscle-score-card';

jest.mock('@/features/muscle-score/hooks');

const mockUse = useMuscleScore as jest.Mock;

function setCard(card: object, isLoading = false) {
  mockUse.mockReturnValue({ card, isLoading, result: {} });
}

const FULL_CARD = {
  score: 72,
  headline: 'Strong protection',
  hasEnoughData: true,
  tip: 'do more protein',
  factors: [
    { id: 'protein', label: 'Protein consistency', value: '85%', points: 60, possible: 70, tracked: true, sentiment: 'positive' },
    { id: 'resistance', label: 'Resistance training', value: 'Not tracked yet', points: 0, possible: 0, tracked: false, sentiment: 'neutral' },
  ],
};

describe('muscle score card', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the score, headline, and factor rows when there is data', () => {
    setCard(FULL_CARD);
    render(<MuscleScoreCard />);
    expect(screen.getByText('72')).toBeTruthy();
    expect(screen.getByText('Strong protection')).toBeTruthy();
    expect(screen.getByText('Protein consistency')).toBeTruthy();
    expect(screen.getByText('Resistance training')).toBeTruthy();
    expect(screen.getByText('85%')).toBeTruthy();
  });

  it('renders a placeholder score in the empty state', () => {
    setCard({
      score: 0,
      headline: 'Start protecting your muscle',
      hasEnoughData: false,
      tip: 'log something',
      factors: [
        { id: 'protein', label: 'Protein consistency', value: 'Not tracked yet', points: 0, possible: 0, tracked: false, sentiment: 'neutral' },
        { id: 'resistance', label: 'Resistance training', value: 'Not tracked yet', points: 0, possible: 0, tracked: false, sentiment: 'neutral' },
      ],
    });
    render(<MuscleScoreCard />);
    expect(screen.getByText('--')).toBeTruthy();
    expect(screen.getByText('Start protecting your muscle')).toBeTruthy();
  });

  it('renders nothing while loading', () => {
    setCard(FULL_CARD, true);
    render(<MuscleScoreCard />);
    expect(screen.queryByText('72')).toBeNull();
  });
});
