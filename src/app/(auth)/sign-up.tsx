import * as React from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signUpWithEmail } from '@/features/auth/api';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { setOnboardingData } from '@/features/onboarding/use-onboarding-store';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

export default function SignUpScreen() {
  const [apiError, setApiError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors }),
    [colors]
  );

  const handleSubmit = async (data: { email: string; password: string }) => {
    setApiError(null);
    const { error, needsEmailConfirmation, userId } = await signUpWithEmail(data.email, data.password);
    if (error) {
      setApiError(error);
      return;
    }
    if (needsEmailConfirmation) {
      setApiError('Check your email and click the confirmation link, then sign in.');
      return;
    }
    // Store userId in onboarding store so reveal.tsx never needs to re-fetch the session.
    // This survives Fast Refresh resets and AsyncStorage race conditions.
    if (userId) {
      setOnboardingData({ userId });
    }
    // onAuthStateChange fires → setSession → (auth) layout redirects to (app)/
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SignUpForm onSubmit={handleSubmit} apiError={apiError} />
      </ScrollView>
    </SafeAreaView>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
}

function makeStyles({ colors }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1 },
  });
}
