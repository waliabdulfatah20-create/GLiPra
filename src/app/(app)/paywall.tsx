// Route: /(app)/paywall
// Full-screen paywall — opened programmatically when a user taps Upgrade.
// Not visible in the tab bar (href: null in _layout.tsx).
//
// Usage from any screen:
//   router.push('/paywall');

import { useRouter } from 'expo-router';
import * as React from 'react';

import { PaywallScreen } from '@/features/subscription/paywall-screen';

export default function PaywallRoute() {
  const router = useRouter();

  function handleDismiss() {
    if (router.canGoBack()) {
      router.back();
    }
  }

  return (
    <PaywallScreen
      featureName="GLiPra Pro"
      onDismiss={handleDismiss}
    />
  );
}
