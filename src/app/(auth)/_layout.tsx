import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { useEffect } from 'react';

import { useAuthStore } from '@/features/auth/use-auth-store';

export default function AuthLayout() {
  const status = useAuthStore.use.status();

  // Hide splash screen for signed-out users (who never visit (app)/_layout.tsx)
  useEffect(() => {
    if (status !== 'idle') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'signIn') {
    // Already authenticated — go straight to main app
    // TODO: route new users to consent flow (Month 1 Item 2)
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
