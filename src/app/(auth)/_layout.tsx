import { Redirect, router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useConsentStore } from '@/features/consent/use-consent-store';

export default function AuthLayout() {
  const status = useAuthStore.use.status();
  const [hasAgreed] = useConsentStore();

  // Hide splash screen for signed-out users (who never visit (app)/_layout.tsx)
  useEffect(() => {
    if (status !== 'idle') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  // Signed in but consent not yet recorded -> send them to the consent screen.
  // Navigate imperatively (NOT a layout-level <Redirect>) so the <Stack> below
  // still renders and the consent screen can actually mount. Deps are
  // [status, hasAgreed] so this fires on the transition, not every render.
  useEffect(() => {
    if (status === 'signIn' && hasAgreed === false) {
      router.replace('/(auth)/consent');
    }
  }, [status, hasAgreed]);

  // Still loading consent state from AsyncStorage — hold until resolved.
  if (status === 'signIn' && hasAgreed === undefined)
    return null;

  // Signed in AND consented -> enter the app.
  if (status === 'signIn' && hasAgreed)
    return <Redirect href="/(app)/" />;

  // Render the auth Stack so its screens can mount:
  //  - signed out -> welcome / sign-in / sign-up / forgot-password
  //  - signed in but NOT consented -> the effect above navigates to the consent
  //    screen, which lives in this Stack (so it can actually render).
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
