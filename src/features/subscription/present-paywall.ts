// Shared paywall trigger. Every Pro entry point calls this so a free user always
// sees the in-app Upgrade-to-Pro screen (`/(app)/paywall` -> PaywallScreen) on
// engagement. We navigate to our own screen rather than RevenueCatUI's
// presentPaywallIfNeeded, which silently no-ops until a RevenueCat dashboard
// Offering + Paywall is configured (not set up yet).

import { router } from 'expo-router';

/** Open the Upgrade-to-Pro paywall, optionally naming the feature that triggered it. */
export function presentPaywall(feature?: string): void {
  router.push({
    pathname: '/paywall',
    params: feature ? { feature } : {},
  });
}
