// useSubscription — RevenueCat subscription state hook.
//
// react-native-purchases is a native module and requires an EAS dev build.
// It is NOT present in this project's package.json yet.
//
// Behaviour matrix:
//   - react-native-purchases NOT installed  → stub (see STUB path below)
//   - EXPO_PUBLIC_APP_ENV=development        → force Pro (dev override, so Pro-gated
//                                              features are testable without a purchase).
//                                              NOTE: keyed on APP_ENV, NOT the AI mock flag,
//                                              so real AI can be enabled in dev (mock=false)
//                                              while Pro stays unlocked for testing.
//   - APP_ENV ≠ development (preview/prod)   → live RevenueCat entitlement check
//
// When adding real RevenueCat support:
//   1. pnpm expo install react-native-purchases react-native-purchases-ui
//   2. Run an EAS dev build (Expo Go does NOT support native modules)
//   3. Set REVENUECAT_API_KEY_IOS / REVENUECAT_API_KEY_ANDROID in env
//   4. Remove the stub guard at the top of the hook and uncomment the live path

import type { SubscriptionTier } from '@/types';

import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export type SubscriptionState = {
  tier: SubscriptionTier;
  isLoading: boolean;
  /** true when tier is 'pro' or 'founder_lifetime' */
  isPro: boolean;
  isFounderLifetime: boolean;
  /** Restore previously purchased subscriptions */
  restore: () => Promise<void>;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** RevenueCat entitlement identifier — must match the dashboard setting */
const ENTITLEMENT_ID = 'GLiPra Pro';

/**
 * Force Pro in development builds so Pro-gated features (photo, voice, etc.) are
 * testable without a real purchase. Keyed on the app environment, NOT the AI mock
 * flag — this lets us enable real AI in dev (EXPO_PUBLIC_USE_MOCK_AI=false) while
 * Pro stays unlocked. Never true in preview/production (real entitlement check runs).
 */
const IS_DEV_FORCE_PRO = process.env.EXPO_PUBLIC_APP_ENV === 'development';

// ---------------------------------------------------------------------------
// react-native-purchases availability guard
// ---------------------------------------------------------------------------
// We try to require the module at runtime so this file can be imported in
// Expo Go (which does not have the native module compiled in). On failure we
// fall back to the stub state.

function getPurchasesModule(): typeof import('react-native-purchases').default | null {
  try {
    const mod = require('react-native-purchases');
    // Basic shape-check: Purchases object must exist
    if (mod && mod.default && typeof mod.default.getCustomerInfo === 'function') {
      return mod.default;
    }
    return null;
  }
  catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tierFromEntitlements(
  entitlements: Record<string, { isActive: boolean }>,
): SubscriptionTier {
  const proEntitlement = entitlements[ENTITLEMENT_ID];
  if (!proEntitlement?.isActive)
    return 'free';

  // Distinguish lifetime from recurring by checking the product identifier
  // in the entitlement's active subscription. The founder product id
  // contains 'lifetime' so we use that as a marker.
  // Note: entitlements[id].latestPurchaseDate alone is not enough —
  // we check the latestPurchasedProductIdentifier when available.

  const raw = proEntitlement as any;
  const productId: string
    = raw.latestPurchasedProductIdentifier
      ?? raw.productIdentifier
      ?? '';

  if (productId.includes('lifetime') || productId.includes('founder')) {
    return 'founder_lifetime';
  }
  return 'pro';
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSubscription(): SubscriptionState {
  const Purchases = getPurchasesModule();

  // -------------------------------------------------------------------------
  // STUB — react-native-purchases not installed
  // -------------------------------------------------------------------------
  // In this branch the module isn't available (Expo Go / no native build).
  // Dev override: in development builds we return isPro=true so developers can
  // test every Pro-gated UI without a real purchase.
  if (Purchases === null) {
    const stubTier: SubscriptionTier = IS_DEV_FORCE_PRO ? 'pro' : 'free';
    return {
      tier: stubTier,
      isLoading: false,
      isPro: IS_DEV_FORCE_PRO,
      isFounderLifetime: false,
      restore: async () => {},
    };
  }

  // -------------------------------------------------------------------------
  // LIVE PATH — react-native-purchases is available
  // The hook uses useState + useEffect so it is a valid hook even though the
  // early-return above may have short-circuited. This is safe here because the
  // early-return branch only fires when Purchases===null which is determined at
  // module load time and never changes at runtime for the same JS bundle.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    isLoading: true,
    isPro: false,
    isFounderLifetime: false,
    restore: async () => {},
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const restore = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const customerInfo = await Purchases.restorePurchases();
      const tier = tierFromEntitlements(customerInfo.entitlements.active);
      setState(prev => ({
        ...prev,
        tier,
        isPro: tier !== 'free',
        isFounderLifetime: tier === 'founder_lifetime',
        isLoading: false,
      }));
    }
    catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [Purchases]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    // Dev override — force Pro in development builds even with a real native build
    if (IS_DEV_FORCE_PRO) {
      setState({
        tier: 'pro',
        isLoading: false,
        isPro: true,
        isFounderLifetime: false,
        restore,
      });
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        if (cancelled)
          return;
        const tier = tierFromEntitlements(customerInfo.entitlements.active);
        setState({
          tier,
          isLoading: false,
          isPro: tier !== 'free',
          isFounderLifetime: tier === 'founder_lifetime',
          restore,
        });
      }
      catch {
        if (!cancelled) {
          setState({
            tier: 'free',
            isLoading: false,
            isPro: false,
            isFounderLifetime: false,
            restore,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [Purchases, restore]);

  return state;
}
