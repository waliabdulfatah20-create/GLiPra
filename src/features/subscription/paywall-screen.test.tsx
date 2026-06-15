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
    expect(screen.getByText('Annual')).toBeTruthy();
    expect(screen.getByText('Monthly')).toBeTruthy();
    expect(screen.getByText('Lifetime')).toBeTruthy();
  });

  it('shows the auto-renew disclosure and Terms / Privacy links', () => {
    render(<PaywallScreen featureName="AI photo recognition" onDismiss={noop} />);
    expect(screen.getByText(/auto-renewing subscriptions/)).toBeTruthy();
    expect(screen.getByLabelText('Terms of Use')).toBeTruthy();
    expect(screen.getByLabelText('Privacy Policy')).toBeTruthy();
  });
});
