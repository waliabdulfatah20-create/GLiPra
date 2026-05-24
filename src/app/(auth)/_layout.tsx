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

  if (status === 'signIn') {
    // Still loading consent state from AsyncStorage — hold until resolved
    if (hasAgreed === undefined) return null;
    if (!hasAgreed) return <Redirect href="/(auth)/consent" />;
    return <Redirect href="/(app)/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
