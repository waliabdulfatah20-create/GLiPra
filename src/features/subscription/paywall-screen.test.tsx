import * as React from 'react';

import { cleanup, render, screen } from '@/lib/test-utils';

import { PaywallScreen } from './paywall-screen';

jest.mock('@/lib/analytics', () => ({
  analytics: { capture: jest.fn() },
  EVENTS: {
    PAYWALL_VIEWED: 'paywall_viewed',
    PURCHASE_STARTED: 'purchase_started',
    PURCHASE_COMPLETED: 'purchase_completed',
  },
}));

function noop() {}

describe('paywall screen', () => {
  afterEach(cleanup);

  it('renders the hero headline and all three price tiers', () => {
    render(<PaywallScreen featureName="AI photo recognition" onDismiss={noop} />);
    expect(screen.getByText(/Unlock/)).toBeTruthy();
    expect(screen.getByText('$79.99', { exact: false })).toBeTruthy();
    expect(screen.getByText('$9.99', { exact: false })).toBeTruthy();
    expect(screen.getByText('$149', { exact: false })).toBeTruthy();
  });
});
