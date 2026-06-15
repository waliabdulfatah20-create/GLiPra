import * as React from 'react';
import { Text } from 'react-native';

import { cleanup, render, screen } from '@/lib/test-utils';

import { ProGate } from './pro-gate';

const mockIsPro = jest.fn(() => false);
jest.mock('./use-subscription', () => ({
  useSubscription: () => ({ isPro: mockIsPro(), isLoading: false }),
}));
jest.mock('./present-paywall', () => ({ presentPaywall: jest.fn() }));

describe('pro gate', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    mockIsPro.mockReturnValue(false);
  });

  it('shows the upgrade card (not the children) for a free user', () => {
    render(<ProGate featureName="AI Nutrition Coach"><Text>gated content</Text></ProGate>);
    expect(screen.getByLabelText('Upgrade to Pro')).toBeTruthy();
    expect(screen.getByText('Unlock Pro')).toBeTruthy();
    expect(screen.queryByText('gated content')).toBeNull();
  });

  it('renders the children for a Pro user', () => {
    mockIsPro.mockReturnValue(true);
    render(<ProGate featureName="AI Nutrition Coach"><Text>gated content</Text></ProGate>);
    expect(screen.getByText('gated content')).toBeTruthy();
  });
});
