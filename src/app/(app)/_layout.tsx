import { Redirect, SplashScreen, Tabs, router } from 'expo-router';
import * as React from 'react';
import { BackHandler } from 'react-native';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { GlipraTabBar } from '@/components/navigation/glipra-tab-bar';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';

export default function TabLayout() {
  const { t } = useTranslation();
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);
  useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => {
        hideSplash();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hideSplash, status]);

  // Exit the app cleanly when the hardware back button is pressed at the tab
  // root. Without this, React Navigation falls back to (auth), which
  // immediately redirects to (app), producing a blank flicker frame.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!router.canGoBack()) {
        BackHandler.exitApp();
        return true; // consume the event — do not propagate to React Navigation
      }
      return false; // let React Navigation handle back normally (sub-screens, modals)
    });
    return () => subscription.remove();
  }, []);

  if (isFirstTime === undefined) {
    return null;
  }
  if (isFirstTime) {
    return <Redirect href="/onboarding/language" />;
  }
  if (status === 'signOut') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      tabBar={(props) => <GlipraTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* ── Visible tabs ─────────────────────────────────────────
          Note: GlipraTabBar reads labels from its own TAB_CONFIG (not these titles).
          Titles kept for documentation and potential header fallback only. ── */}
      <Tabs.Screen name="index"            options={{ title: t('tabs.today'),     headerShown: false }} />
      <Tabs.Screen name="progress"         options={{ title: t('tabs.progress'),  headerShown: false }} />
      <Tabs.Screen name="log"              options={{ title: t('tabs.nutrition'), headerShown: false }} />
      <Tabs.Screen name="injection-sites"  options={{ title: t('tabs.sites'),     headerShown: false }} />
      <Tabs.Screen name="coach"            options={{ title: t('tabs.coach'),     headerShown: false }} />

      {/* ── Settings — hidden from tab bar; accessible via gear icon on Today ── */}
      <Tabs.Screen name="settings"         options={{ href: null, headerShown: false }} />

      {/* ── Hidden screens — accessible by programmatic navigation ────────── */}
      <Tabs.Screen name="style"                options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="check-in"             options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="weight"               options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="medication-level"     options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="visit-prep"           options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="shot-prep"            options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="journey"              options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="health-import"        options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="maintenance-mode"     options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="discontinuation-mode" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="add-shot"             options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="edit-shot"            options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="goal-weight"          options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="update-status"        options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="paywall"              options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
