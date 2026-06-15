import { router } from 'expo-router';
import { describe, expect, it, vi } from 'vitest';
import { presentPaywall } from '@/features/subscription/present-paywall';

// vitest hoists vi.mock above the imports, so `router` resolves to the mock.
vi.mock('expo-router', () => ({ router: { push: vi.fn() } }));

describe('presentPaywall', () => {
  it('navigates to the paywall route with the feature param', () => {
    presentPaywall('Voice logging');
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/paywall',
      params: { feature: 'Voice logging' },
    });
  });

  it('navigates with empty params when no feature is given', () => {
    presentPaywall();
    expect(router.push).toHaveBeenCalledWith({ pathname: '/paywall', params: {} });
  });
});
