import { Redirect, Stack } from 'expo-router';
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

  // Still loading consent state from AsyncStorage — hold until resolved.
  if (status === 'signIn' && hasAgreed === undefined)
    return null;

  // Signed in AND consented -> enter the app.
  if (status === 'signIn' && hasAgreed)
    return <Redirect href="/(app)/" />;

  // Otherwise render the auth Stack so its screens can actually mount:
  //  - signed out -> welcome / sign-in / sign-up / forgot-password
  //  - signed in but NOT consented -> force the consent screen. (Previously this
  //    case returned <Redirect href="/(auth)/consent" /> WITHOUT ever rendering
  //    <Stack>, so the consent screen could never mount -> stable blank screen.)
  const needsConsent = status === 'signIn' && !hasAgreed;
  return (
    <Stack
      key={needsConsent ? 'auth-consent' : 'auth'}
      initialRouteName={needsConsent ? 'consent' : undefined}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
