import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { sendPasswordResetEmail } from '@/features/auth/api';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';
import { useTheme } from '@/lib/ThemeContext';

export default function ForgotPasswordScreen() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { colors } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors }),
    [colors],
  );

  const handleSubmit = async (data: { email: string }) => {
    setApiError(null);
    const { error } = await sendPasswordResetEmail(data.email);
    if (error) {
      setApiError(error);
    }
    else {
      setShowSuccess(true);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ForgotPasswordForm
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
