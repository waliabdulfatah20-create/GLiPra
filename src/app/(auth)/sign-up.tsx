import * as React from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signUpWithEmail } from '@/features/auth/api';
import { SignUpForm } from '@/features/auth/components/sign-up-form';
import { colors } from '@/theme/colors';

export default function SignUpScreen() {
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (data: { email: string; password: string }) => {
    setApiError(null);
    const { error } = await signUpWithEmail(data.email, data.password);
    if (error) {
      setApiError(error);
    }
    // On success, onAuthStateChange fires → setSession → (auth) layout redirects to (app)/
    // TODO: route new users to consent flow (Month 1 Item 2)
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
});
