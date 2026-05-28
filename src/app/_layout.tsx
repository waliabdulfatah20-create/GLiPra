import '@/lib/i18n';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import FlashMessage from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { useThemeConfig } from '@/components/ui/use-theme-config';
import { GlipraThemeProvider } from '@/lib/ThemeContext';
import { hydrateAuth, setSession } from '@/features/auth/use-auth-store';
import { APIProvider } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { errorTracking } from '@/lib/error-tracking';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { AnalyticsProvider } from '@/lib/posthog-provider';
import { initializeRevenueCat } from '@/lib/revenue-cat';
import { supabase } from '@/lib/supabase';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // (auth) is the initial route so unauthenticated users land on welcome screen.
  // (auth)/_layout.tsx redirects signIn users to (app)/ immediately.
  initialRouteName: '(auth)',
};

loadSelectedTheme();
SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize Sentry error tracking (single call, free tier, no PII).
    errorTracking.init();

    // Hydrate from persisted session (AsyncStorage)
    hydrateAuth();

    // Single source of truth for auth state. Never unsubscribed (app lifetime).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      // Initialize RevenueCat as soon as the user is authenticated.
      // Passing the Supabase user ID links the RevenueCat customer record.
      // Safe to call multiple times — RevenueCat de-dupes configure() calls.
      if (event === 'SIGNED_IN' && session?.user?.id) {
        initializeRevenueCat(session.user.id);
        // Identify user anonymously — user.id only, NEVER email (CLAUDE.md Rule 2)
        analytics.identify(session.user.id);
        errorTracking.setUser(session.user.id);
      }
      if (event === 'SIGNED_OUT') {
        analytics.reset();
        errorTracking.clearUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

// GlipraThemeProvider must be the outermost wrapper so ConnectedProviders
// can call useTheme() via useThemeConfig() without a context violation.
function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GestureHandlerRootView style={styles.container}>
      <GlipraThemeProvider>
        <ConnectedProviders>{children}</ConnectedProviders>
      </GlipraThemeProvider>
    </GestureHandlerRootView>
  );
}

// Inner providers — may safely consume useTheme() via useThemeConfig().
function ConnectedProviders({ children }: { children: React.ReactNode }) {
  const navTheme = useThemeConfig();
  return (
    <AnalyticsProvider>
      <KeyboardProvider>
        <ThemeProvider value={navTheme}>
          <APIProvider>
            <BottomSheetModalProvider>
              {children}
              <FlashMessage position="top" />
            </BottomSheetModalProvider>
          </APIProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </AnalyticsProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // GestureHandlerRootView sits outside GlipraThemeProvider — cannot use
    // useTheme(). Hardcode the light-mode background token (#f7f9fc) so
    // Android never flashes a bare white frame on back-press transitions.
    backgroundColor: '#f7f9fc',
  },
});
