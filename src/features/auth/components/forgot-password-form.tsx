import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';

import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
});

export type ForgotPasswordFormProps = {
  onSubmit: (data: { email: string }) => Promise<void>;
  showSuccess?: boolean;
  apiError?: string | null;
};

export function ForgotPasswordForm({ onSubmit, showSuccess, apiError }: ForgotPasswordFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors }),
    [colors],
  );
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: '' },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  if (showSuccess) {
    return (
      <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
        <Text style={styles.heading}>{t('auth.forgot_success_heading')}</Text>
        <Text style={styles.subheading}>{t('auth.forgot_success_subheading')}</Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>{t('auth.back_to_sign_in')}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
      <Text style={styles.heading}>{t('auth.forgot_heading')}</Text>
      <Text style={styles.subheading}>{t('auth.forgot_subheading')}</Text>

      {apiError ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.apiErrorBox}>
          <Text style={styles.apiErrorText}>{apiError}</Text>
        </Animated.View>
      ) : null}

      <form.Field
        name="email"
        children={(field) => {
          const error = getFieldError(field);
          return (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{t('auth.email_label')}</Text>
              <TextInput
                testID="forgot-email"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={() => { field.handleBlur(); setFocusedField(null); }}
                onFocus={() => setFocusedField('email')}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="your@email.com"
                placeholderTextColor={colors.gray400}
                style={[
                  styles.input,
                  focusedField === 'email' && styles.inputFocused,
                  error ? styles.inputError : null,
                ]}
              />
              {error ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}
            </View>
          );
        }}
      />

      <form.Subscribe
        selector={(state) => [state.isSubmitting]}
        children={([isSubmitting]) => (
          <Button
            testID="forgot-submit"
            label={t('auth.send_reset_link')}
            onPress={form.handleSubmit}
            loading={isSubmitting}
          />
        )}
      />

      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backLinkText}>{t('auth.back_to_sign_in')}</Text>
      </Pressable>
    </Animated.View>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
}

function makeStyles({ colors }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1, padding: 24, gap: 4 },
    heading: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, marginTop: 12 },
    subheading: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },
    apiErrorBox: { backgroundColor: colors.errorLight, borderRadius: 10, padding: 12, marginBottom: 8 },
    apiErrorText: { color: colors.error, fontSize: 14 },
    fieldContainer: { marginBottom: 16 },
    label: {
      fontSize: 11, fontWeight: '600', color: colors.textSecondary,
      letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      // @ts-expect-error borderCurve
      borderCurve: 'continuous',
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.textPrimary,
      // @ts-expect-error boxShadow string form
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    inputFocused: {
      borderColor: colors.borderFocus,
      // @ts-expect-error boxShadow string form
      boxShadow: '0 0 0 3px rgba(45,107,228,0.12)',
    },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 13, marginTop: 4 },
    backLink: { marginTop: 16, alignItems: 'center' },
    backLinkText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  });
}
