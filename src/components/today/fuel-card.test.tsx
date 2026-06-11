/**
 * FuelCard — jest-expo RTL tests.
 *
 * i18n returns keys in the test environment, so assertions for translated copy use
 * key strings (e.g. 'today.fuel_micros_on_track'). The readiness headline/tip/factor
 * labels are literal strings supplied via the mocked useTodayData.
 */
import * as React from 'react';

import { useDailyMacros } from '@/features/food-log/hooks';
import { useTodayData } from '@/features/today/hooks';
import { cleanup, fireEvent, render, screen } from '@/lib/test-utils';

import { FuelCard } from './fuel-card';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/features/today/hooks');
jest.mock('@/features/food-log/hooks');
jest.mock('@/lib/haptics', () => ({ haptics: { tap: jest.fn() } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

type Overrides = {
  today?: Record<string, unknown>;
  macros?: Record<string, unknown>;
};

function setup(overrides: Overrides = {}) {
  (useTodayData as jest.Mock).mockReturnValue({
    readinessCard: {
      headline: 'Building to steady state',
      score: 55,
      tip: 'Yesterday was short, today matters most.',
      factors: [
        { label: 'Yesterdays protein', delta: -10, sentiment: 'negative' },
        { label: 'Oral dose status', delta: -5, sentiment: 'negative' },
      ],
    },
    proteinConsumedG: 82,
    proteinFloorG: 120,
    isLoading: false,
    ...overrides.today,
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

  it('renders the readiness score, headline, and trust pill', () => {
    setup();
    render(<FuelCard />);
    expect(screen.getByText('55')).toBeTruthy();
    expect(screen.getByText('Building to steady state')).toBeTruthy();
    expect(screen.getByText('today.readiness_trust')).toBeTruthy();
    expect(screen.getByText('today.fuel_label')).toBeTruthy();
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

  it('hides the readiness factor rows until "Why?" is tapped', () => {
    setup();
    render(<FuelCard />);
    // collapsed: factor labels not rendered
    expect(screen.queryByText('Yesterdays protein')).toBeNull();
    fireEvent.press(screen.getByLabelText('today.fuel_why_toggle'));
    // expanded: the breakdown label + factor rows appear
    expect(screen.getByText('today.fuel_why_label')).toBeTruthy();
    expect(screen.getByText('Yesterdays protein')).toBeTruthy();
    expect(screen.getByText('-10')).toBeTruthy();
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

  it('renders the tip and the Tier-2 disclaimer', () => {
    setup();
    render(<FuelCard />);
    expect(screen.getByText('Yesterday was short, today matters most.')).toBeTruthy();
    expect(screen.getByText('today.fuel_disclaimer')).toBeTruthy();
  });

  it('renders nothing while today data is loading', () => {
    setup({ today: { isLoading: true } });
    render(<FuelCard />);
    expect(screen.queryByText('today.fuel_label')).toBeNull();
  });
});
