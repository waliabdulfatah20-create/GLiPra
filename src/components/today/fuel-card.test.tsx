/**
 * FuelCard — jest-expo RTL tests. The hero now shows the Muscle Preservation score;
 * Readiness is a small pill. i18n returns keys in the test env, so translated copy is
 * asserted via key strings (e.g. 'today.fuel_micros_on_track'); the muscle headline /
 * tip / factor labels + values are literals supplied via the mocked useMuscleScore.
 */
import { router } from 'expo-router';
import * as React from 'react';

import { useDailyMacros } from '@/features/food-log/hooks';
import { useMuscleScore } from '@/features/muscle-score/hooks';
import { useTodayData } from '@/features/today/hooks';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { FuelCard } from './fuel-card';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/features/today/hooks');
jest.mock('@/features/food-log/hooks');
jest.mock('@/features/muscle-score/hooks');
jest.mock('@/lib/haptics', () => ({ haptics: { tap: jest.fn() } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

type Overrides = {
  today?: Record<string, unknown>;
  macros?: Record<string, unknown>;
  muscle?: Record<string, unknown>;
};

function setup(overrides: Overrides = {}) {
  (useTodayData as jest.Mock).mockReturnValue({
    readinessCard: { score: 55, headline: '', tip: '', factors: [] },
    proteinConsumedG: 82,
    proteinFloorG: 120,
    isLoading: false,
    ...overrides.today,
  });
  (useMuscleScore as jest.Mock).mockReturnValue({
    card: {
      score: 67,
      headline: 'Solid keep building',
      tip: 'Log a resistance session this week.',
      hasEnoughData: true,
      factors: [
        { id: 'protein', label: 'Protein consistency', value: '67%', sentiment: 'neutral', tracked: true, points: 47, possible: 70 },
        { id: 'resistance', label: 'Resistance training', value: 'Not tracked yet', sentiment: 'neutral', tracked: false, points: 0, possible: 30 },
      ],
      ...overrides.muscle,
    },
    result: {},
    isLoading: false,
  });
  (useDailyMacros as jest.Mock).mockReturnValue({
    fiber: 14,
    magnesiumMg: 420,
    zincMg: 5,
    b12Mcg: 2.4,
    vitaminDIu: 600,
    ironMg: 9,
    hasMicronutrients: true,
    ...overrides.macros,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('fuel card', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders the muscle score, headline, label, and trust + readiness pills', () => {
    setup();
    render(<FuelCard />);
    expect(screen.getByText('67')).toBeTruthy(); // muscle dial
    expect(screen.getByText('Solid keep building')).toBeTruthy(); // muscle headline
    expect(screen.getByText('muscle_score.label')).toBeTruthy();
    expect(screen.getByText('today.readiness_trust')).toBeTruthy();
    expect(screen.getByText('today.fuel_readiness_pill')).toBeTruthy(); // readiness pill
  });

  it('deep-links to the Micronutrient Watch when the micros tile is tapped', () => {
    setup();
    render(<FuelCard />);
    fireEvent.press(screen.getByLabelText('today.fuel_micros_label'));
    expect(router.push).toHaveBeenCalledWith('/log?scrollTo=micros');
  });

  it('renders the protein ring values and the to-floor copy', () => {
    setup();
    render(<FuelCard />);
    expect(screen.getByText('82g')).toBeTruthy(); // ProteinRing center
    expect(screen.getByText('of 120g')).toBeTruthy();
    expect(screen.getByText('today.fuel_protein_to_floor')).toBeTruthy();
    expect(screen.getByText('today.fuel_protein_to_go')).toBeTruthy();
  });

  it('renders the fiber and micronutrient spots when micros are logged', () => {
    setup();
    render(<FuelCard />);
    expect(screen.getByText('today.fuel_fiber_label')).toBeTruthy();
    expect(screen.getByText('today.fuel_fiber_of')).toBeTruthy();
    expect(screen.getByText('today.fuel_micros_label')).toBeTruthy();
    expect(screen.getByText('today.fuel_micros_on_track')).toBeTruthy();
    expect(screen.queryByText('today.fuel_micros_empty')).toBeNull();
  });

  it('hides the muscle factor rows until "Why?" is tapped', () => {
    setup();
    render(<FuelCard />);
    expect(screen.queryByText('Protein consistency')).toBeNull();
    fireEvent.press(screen.getByLabelText('today.fuel_why_toggle'));
    expect(screen.getByText('today.fuel_why_label')).toBeTruthy();
    expect(screen.getByText('Protein consistency')).toBeTruthy();
    expect(screen.getByText('67%')).toBeTruthy();
    expect(screen.getByText('Resistance training')).toBeTruthy();
    expect(screen.getByText('Not tracked yet')).toBeTruthy();
  });

  it('shows "--" in the dial when the muscle score has no data', () => {
    setup({ muscle: { hasEnoughData: false, score: 0, headline: 'Start protecting your muscle' } });
    render(<FuelCard />);
    expect(screen.getByText('--')).toBeTruthy();
    expect(screen.getByText('Start protecting your muscle')).toBeTruthy();
  });

  it('shows the set-target empty state and no to-floor copy when no protein floor', () => {
    setup({ today: { proteinFloorG: 0 } });
    render(<FuelCard />);
    expect(screen.getAllByText('today.protein_no_target').length).toBeGreaterThan(0);
    expect(screen.queryByText('today.fuel_protein_to_floor')).toBeNull();
  });

  it('shows the micros empty state when nothing is logged', () => {
    setup({ macros: { hasMicronutrients: false } });
    render(<FuelCard />);
    expect(screen.getByText('today.fuel_micros_empty')).toBeTruthy();
    expect(screen.queryByText('today.fuel_micros_on_track')).toBeNull();
  });

  it('renders the muscle tip and the Tier-2 disclaimer', () => {
    setup();
    render(<FuelCard />);
    expect(screen.getByText('Log a resistance session this week.')).toBeTruthy();
    expect(screen.getByText('today.fuel_disclaimer')).toBeTruthy();
  });

  it('renders nothing while today data is loading', () => {
    setup({ today: { isLoading: true } });
    render(<FuelCard />);
    expect(screen.queryByText('muscle_score.label')).toBeNull();
  });
});
