// revenue-cat.ts — RevenueCat initialization and shared helpers.
//
// react-native-purchases is a native-only module.
// It is NOT available in Expo Go — all calls are wrapped in try/catch.
//
// API keys must be set via environment variables before going live:
//   EXPO_PUBLIC_REVENUECAT_IOS_KEY
//   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
//
// The module is loaded lazily so this file can be safely imported in
// Expo Go (where the native module is absent).

import type { SubscriptionTier } from '@/types';

import { Platform } from 'react-native';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

export const ENTITLEMENT_ID = 'GLiPra Pro';

// ---------------------------------------------------------------------------
// Module guard — same pattern as use-subscription.ts
// ---------------------------------------------------------------------------

function getPurchasesModule(): typeof import('react-native-purchases').default | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-purchases');
    if (mod && mod.default && typeof mod.default.configure === 'function') {
      return mod.default;
    }
    return null;
  }
  catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// initializeRevenueCat
//
// Call once from the root layout after the user is confirmed signed in.
// Passing the Supabase user ID links the RevenueCat customer record to the
// authenticated user, which is required for correct entitlement tracking.
//
// Safe to call from Expo Go — falls through silently when native module is
// absent or when no API key is configured.
// ---------------------------------------------------------------------------

export function initializeRevenueCat(userId?: string): void {
  try {
    const Purchases = getPurchasesModule();
    if (!Purchases) {
      // Native module not available — Expo Go or pre-native build. Silent.
      return;
    }

    const apiKey
      = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

    if (!apiKey) {
      console.warn(
        '[RevenueCat] No API key configured — subscription features disabled.\n'
        + 'Set EXPO_PUBLIC_REVENUECAT_IOS_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_KEY '
        + 'in your .env file before going live.',
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LOG_LEVEL } = require('react-native-purchases');
    Purchases.setLogLevel(LOG_LEVEL.WARN);
    Purchases.configure({ apiKey, appUserID: userId ?? null });
  }
  catch (e) {
    // Catches native module errors gracefully (Expo Go, simulator quirks, etc.)
    console.warn('[RevenueCat] Native module not available:', e);
  }
}

// ---------------------------------------------------------------------------
// getSubscriptionTier
//
// One-shot entitlement check — used outside of React (e.g. background refresh).
// The React hook (useSubscription) is the preferred way to read tier in UI code.
// ---------------------------------------------------------------------------

export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  try {
    const Purchases = getPurchasesModule();
    if (!Purchases)
      return 'free';

    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (!entitlement)
      return 'free';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = entitlement as any;
    const productId: string
      = raw.latestPurchasedProductIdentifier
        ?? raw.productIdentifier
        ?? '';

    if (productId.includes('lifetime') || productId.includes('founder')) {
      return 'founder_lifetime';
    }
    return 'pro';
  }
  catch {
    // Never crash on billing errors — return safe free fallback
    return 'free';
  }
}

// ---------------------------------------------------------------------------
// restorePurchases
//
// Triggers RevenueCat restore flow and returns the resolved tier.
// Used by UI components — the hook (useSubscription) exposes this via
// the `restore` callback, so prefer that in components.
// ---------------------------------------------------------------------------

export async function restorePurchases(): Promise<SubscriptionTier> {
  try {
    const Purchases = getPurchasesModule();
    if (!Purchases)
      return 'free';

    const customerInfo = await Purchases.restorePurchases();
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

    if (!entitlement)
      return 'free';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = entitlement as any;
    const productId: string
      = raw.latestPurchasedProductIdentifier
        ?? raw.productIdentifier
        ?? '';

    if (productId.includes('lifetime') || productId.includes('founder')) {
      return 'founder_lifetime';
    }
    return 'pro';
  }
  catch {
    return 'free';
  }
}
