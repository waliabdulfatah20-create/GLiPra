// PostHog analytics wrapper.
//
// Graceful stub pattern: if posthog-react-native is not installed (e.g. Expo Go),
// all methods silently no-op. No crash, no import error.
//
// Privacy rules (CLAUDE.md Rule 2):
//   - identify() takes an anonymousId only — NO email, NO name, NO real user ID
//   - capture() properties must never include weight values, protein values,
//     health metrics, or any identifying strings
//   - RED_FLAG_DETECTED: only { severity, flag_count } — no flag codes
//   - FOOD_LOGGED_*: only { source } — no food names or amounts

// ---------------------------------------------------------------------------
// Event name constants
// ---------------------------------------------------------------------------

export const EVENTS = {
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',

  // Food logging
  FOOD_LOGGED_MANUAL: 'food_logged_manual',
  FOOD_LOGGED_BARCODE: 'food_logged_barcode',
  FOOD_LOGGED_PHOTO: 'food_logged_photo',

  // Check-in
  CHECKIN_COMPLETED: 'checkin_completed',

  // Weight
  WEIGHT_LOGGED: 'weight_logged',

  // Injection logging
  INJECTION_LOGGED: 'injection_logged',

  // AI Coach
  COACH_MESSAGE_SENT: 'coach_message_sent',
  COACH_MESSAGE_BLOCKED: 'coach_message_blocked', // keyword blocklist triggered

  // Subscription
  PAYWALL_VIEWED: 'paywall_viewed',
  PURCHASE_STARTED: 'purchase_started',
  PURCHASE_COMPLETED: 'purchase_completed',

  // Red flags — properties: { severity: 'urgent'|'warning', flag_count: number } ONLY
  RED_FLAG_DETECTED: 'red_flag_detected',
  RED_FLAG_DISMISSED: 'red_flag_dismissed',

  // Milestones
  MILESTONE_UNLOCKED: 'milestone_unlocked',

  // Daily guidance
  DAILY_GUIDANCE_VIEWED: 'daily_guidance_viewed',
  DAILY_GUIDANCE_WHY_TAPPED: 'daily_guidance_why_tapped',

  // Account (GDPR)
  ACCOUNT_DATA_EXPORTED: 'account_data_exported',
  ACCOUNT_DELETED: 'account_deleted',
} as const;

// ---------------------------------------------------------------------------
// PostHog client — lazy-loaded with graceful fallback
// ---------------------------------------------------------------------------

type PostHogInstance = {
  identify: (id: string, properties?: Record<string, unknown>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  isFeatureEnabled: (flag: string) => boolean | undefined;
};

let _client: PostHogInstance | null = null;
let _initialized = false;

function getClient(): PostHogInstance | null {
  if (_initialized)
    return _client;
  _initialized = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PostHog } = require('posthog-react-native') as {
      PostHog: new (apiKey: string, options?: Record<string, unknown>) => PostHogInstance;
    };
    const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
    if (!apiKey) {
      // No key configured — stay in stub mode silently
      return null;
    }
    _client = new PostHog(apiKey, {
      host: 'https://app.posthog.com',
    });
    return _client;
  }
  catch {
    // posthog-react-native not installed — all methods will no-op
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const analytics = {
  /**
   * Identify a user by anonymous ID only.
   * NEVER pass email, name, or any PII as the ID or in properties.
   */
  identify: (anonymousId: string, properties?: Record<string, unknown>): void => {
    try {
      getClient()?.identify(anonymousId, properties);
    }
    catch {
      // Silently ignore — analytics must never crash the app
    }
  },

  /**
   * Track an event. Keep properties free of PII and health metrics.
   */
  capture: (event: string, properties?: Record<string, unknown>): void => {
    try {
      getClient()?.capture(event, properties);
    }
    catch {
      // Silently ignore
    }
  },

  /**
   * Reset the PostHog session. Call on sign-out.
   */
  reset: (): void => {
    try {
      getClient()?.reset();
    }
    catch {
      // Silently ignore
    }
  },

  /**
   * Check whether a feature flag is enabled.
   * Returns false when PostHog is unavailable (safe default).
   */
  isFeatureEnabled: (flag: string): boolean => {
    try {
      return getClient()?.isFeatureEnabled(flag) ?? false;
    }
    catch {
      return false;
    }
  },
};
