// PostHog provider wrapper.
//
// If posthog-react-native is installed: wraps children in PostHogProvider
// so hooks like useFeatureFlag() work anywhere in the tree.
//
// If the package is NOT installed (Expo Go, CI without native deps):
// returns children directly — zero runtime cost, zero crash.

import * as React from 'react';

// ---------------------------------------------------------------------------
// Detect whether posthog-react-native is available
// ---------------------------------------------------------------------------

let PostHogProvider: React.ComponentType<{
  apiKey: string;
  options?: Record<string, unknown>;
  children: React.ReactNode;
}> | null = null;

try {
  // eslint-disable-next-line ts/no-require-imports
  const pkg = require('posthog-react-native') as {
    PostHogProvider: React.ComponentType<{
      apiKey: string;
      options?: Record<string, unknown>;
      children: React.ReactNode;
    }>;
  };
  PostHogProvider = pkg.PostHogProvider;
}
catch {
  // Package not installed — stub mode
  PostHogProvider = null;
}

// ---------------------------------------------------------------------------
// Exported provider
// ---------------------------------------------------------------------------

type AnalyticsProviderProps = {
  children: React.ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;

  if (!PostHogProvider || !apiKey) {
    // Stub: no PostHog available or no API key configured
    return <>{children}</>;
  }

  return (
    <PostHogProvider
      apiKey={apiKey}
      options={{ host: 'https://app.posthog.com' }}
    >
      {children}
    </PostHogProvider>
  );
}
