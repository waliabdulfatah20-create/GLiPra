// Root-level route (NOT under (auth)) reached from a password-recovery deep link.
// The recovery session already makes the user "signed in", and (auth)/_layout
// redirects signed-in users into (app) — so this screen lives at the root to stay
// reachable. On success the user is already authenticated, so we route into the app.

import type { GlipraTokens } from '@/theme/tokens';
import { router } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { updatePassword } from '@/features/auth/api';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { useTheme } from '@/lib/ThemeContext';

export default function ResetPasswordScreen() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors }), [colors]);

  const handleSubmit = async (data: { password: string }) => {
    setApiError(null);
    const { error } = await updatePassword(data.password);
    if (error) {
      setApiError(error);
      return;
    }
    setShowSuccess(true);
    // The recovery session is a live session, so the user is already authenticated.
    setTimeout(() => router.replace('/(app)/'), 1200);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ResetPasswordForm
          onSubmit={handleSubmit}
          showSuccess={showSuccess}
          apiError={apiError}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
};

function makeStyles({ colors }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1 },
  });
}
