import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { ThemeProvider } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useEffect } from 'react';
import { AppState, StyleSheet, useColorScheme } from 'react-native';
import FlashMessage, { showMessage } from 'react-native-flash-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useThemeConfig } from '@/components/ui/use-theme-config';

import { parseAuthRedirect } from '@/features/auth/deep-link';
import { hydrateAuth, setSession } from '@/features/auth/use-auth-store';
import { analytics } from '@/lib/analytics';
import { APIProvider } from '@/lib/api';
import { errorTracking } from '@/lib/error-tracking';
import { loadSelectedTheme } from '@/lib/hooks/use-selected-theme';
import { AnalyticsProvider } from '@/lib/posthog-provider';
import { initializeRevenueCat } from '@/lib/revenue-cat';
import { supabase } from '@/lib/supabase';
import { GlipraThemeProvider } from '@/lib/ThemeContext';
import { darkTokens, lightTokens } from '@/theme/tokens';
import '@/lib/i18n';

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

    // Supabase auto-refresh MUST be tied to AppState in React Native. Without
    // this, the refresh timer can run concurrently with sign-in / a stale
    // persisted session and reuse a rotated refresh token ("Invalid Refresh
    // Token: Already Used"), which churns the session signIn<->signOut and
    // loops the auth router. Start while foregrounded, stop when backgrounded.
    supabase.auth.startAutoRefresh();
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      }
      else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  // Auth deep links (password recovery + email confirmation). Supabase implicit
  // links carry tokens in the URL fragment; parseAuthRedirect extracts them, we
  // set the session (which drives onAuthStateChange above), and route recovery
  // links to the reset-password screen. Expired/invalid links flash and bounce
  // to sign-in.
  useEffect(() => {
    let mounted = true;

    async function handleAuthUrl(url: string | null) {
      const result = parseAuthRedirect(url);
      if (!mounted || !result)
        return;

      if (result.kind === 'error') {
        showMessage({
          message: 'That link has expired or is invalid. Please request a new one.',
          type: 'warning',
        });
        router.replace('/(auth)/sign-in');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
      });
      if (!mounted)
        return;
      if (error) {
        showMessage({
          message: 'That link has expired or is invalid. Please request a new one.',
          type: 'warning',
        });
        router.replace('/(auth)/sign-in');
        return;
      }

      if (result.type === 'recovery')
        router.replace('/reset-password');
    }

    Linking.getInitialURL().then((url) => {
      if (mounted)
        void handleAuthUrl(url);
    });
    const linkSub = Linking.addEventListener('url', ({ url }) => {
      void handleAuthUrl(url);
    });

    return () => {
      mounted = false;
      linkSub.remove();
    };
  }, []);

  return (
    <Providers>
      <Stack>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      </Stack>
    </Providers>
  );
}

// GlipraThemeProvider must be the outermost wrapper so ConnectedProviders
// can call useTheme() via useThemeConfig() without a context violation.
function Providers({ children }: { children: React.ReactNode }) {
  // GestureHandlerRootView sits OUTSIDE GlipraThemeProvider, so it cannot use
  // useTheme(). Read the device scheme directly so the root frame matches the
  // app (dark on dark devices) instead of flashing light during transitions.
  const scheme = useColorScheme();
  const backgroundColor
    = scheme === 'dark' ? darkTokens.colors.background : lightTokens.colors.background;
  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor }]}>
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
    // backgroundColor is applied in Providers based on the device color scheme
    // (dark on dark devices) so the root frame never flashes light on dark.
  },
});
