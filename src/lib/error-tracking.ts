// Sentry error tracking wrapper.
//
// Graceful stub pattern: if @sentry/react-native (or sentry-expo) is not
// installed, all methods silently no-op. No crash, no import error.
//
// Privacy rules (CLAUDE.md Rule 2):
//   - setUser() accepts an anonymousId only — NEVER email, NEVER real name
//   - captureException() context must not include PII
//   - beforeSend strips email patterns and user.email fields automatically

// ---------------------------------------------------------------------------
// Detect which Sentry package is installed
// ---------------------------------------------------------------------------

type SentryModule = {
  init: (options: Record<string, unknown>) => void;
  captureException: (error: Error, captureContext?: Record<string, unknown>) => string;
  captureMessage: (message: string, level?: string) => string;
  setUser: (user: { id: string } | null) => void;
};

let Sentry: SentryModule | null = null;

try {
  // Prefer @sentry/react-native (the canonical package)

  Sentry = require('@sentry/react-native') as SentryModule;
}
catch {
  try {
    // Fall back to sentry-expo if present

    Sentry = require('sentry-expo') as SentryModule;
  }
  catch {
    // Neither installed — all methods will no-op
    Sentry = null;
  }
}

// ---------------------------------------------------------------------------
// Email-pattern stripper — applied in beforeSend
// ---------------------------------------------------------------------------

const EMAIL_RE = /[\w.%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi;

function stripEmail(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(EMAIL_RE, '[email]');
  }
  if (Array.isArray(value)) {
    return value.map(stripEmail);
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // Always strip the user.email field regardless of value
      if (k === 'email') {
        out[k] = '[stripped]';
      }
      else {
        out[k] = stripEmail(v);
      }
    }
    return out;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const errorTracking = {
  /**
   * Initialize Sentry. Call once on app mount.
   * Reads DSN from EXPO_PUBLIC_SENTRY_DSN.
   * tracesSampleRate is capped at 0.1 to stay within the free tier.
   */
  init: (): void => {
    if (!Sentry)
      return;
    try {
      const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
      if (!dsn)
        return; // No DSN configured — skip silently

      Sentry.init({
        dsn,
        tracesSampleRate: 0.1, // 10% — keeps within Sentry free tier
        environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
        beforeSend: (event: unknown) => stripEmail(event),
      });
    }
    catch {
      // Init failure must never crash the app
    }
  },

  /**
   * Capture an exception.
   * context must NOT contain PII (no email, name, or identifying data).
   */
  captureException: (error: Error, context?: Record<string, unknown>): void => {
    if (!Sentry)
      return;
    try {
      Sentry.captureException(error, context ? { extra: context } : undefined);
    }
    catch {
      // Silently ignore
    }
  },

  /**
   * Capture a plain message.
   */
  captureMessage: (
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
  ): void => {
    if (!Sentry)
      return;
    try {
      Sentry.captureMessage(message, level);
    }
    catch {
      // Silently ignore
    }
  },

  /**
   * Associate subsequent events with an anonymous user ID.
   * NEVER pass email, name, or any real identifier.
   */
  setUser: (anonymousId: string): void => {
    if (!Sentry)
      return;
    try {
      Sentry.setUser({ id: anonymousId });
    }
    catch {
      // Silently ignore
    }
  },

  /**
   * Clear user context on sign-out.
   */
  clearUser: (): void => {
    if (!Sentry)
      return;
    try {
      Sentry.setUser(null);
    }
    catch {
      // Silently ignore
    }
  },
};
