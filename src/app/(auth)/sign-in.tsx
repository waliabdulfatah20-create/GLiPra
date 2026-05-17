import * as React from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signInWithEmail } from '@/features/auth/api';
import { SignInForm } from '@/features/auth/components/sign-in-form';
import { colors } from '@/theme/colors';

export default function SignInScreen() {
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (data: { email: string; password: string }) => {
    setApiError(null);
    const { error } = await signInWithEmail(data.email, data.password);
    if (error) {
      setApiError(error);
    }
    // On success, onAuthStateChange fires → setSession → (auth) layout redirects to (app)/
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SignInForm onSubmit={handleSubmit} apiError={apiError} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
});
