import type { GlipraTokens } from '@/theme/tokens';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import * as z from 'zod';
import { Button } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { useTheme } from '@/lib/ThemeContext';

const schema = z
  .object({
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(values => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormProps = {
  onSubmit: (data: { password: string }) => Promise<void>;
  showSuccess?: boolean;
  apiError?: string | null;
};

export function ResetPasswordForm({ onSubmit, showSuccess, apiError }: ResetPasswordFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors }), [colors]);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: '', confirmPassword: '' },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await onSubmit({ password: value.password });
    },
  });

  if (showSuccess) {
    return (
      <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
        <Text style={styles.heading}>{t('auth.reset_success_heading')}</Text>
        <Text style={styles.subheading}>{t('auth.reset_success_subheading')}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
      <Text style={styles.heading}>{t('auth.reset_heading')}</Text>
      <Text style={styles.subheading}>{t('auth.reset_subheading')}</Text>

      {apiError
        ? (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.apiErrorBox}>
              <Text style={styles.apiErrorText}>{apiError}</Text>
            </Animated.View>
          )
        : null}

      <form.Field
        name="password"
        children={(field) => {
          const error = getFieldError(field);
          return (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{t('auth.new_password_label')}</Text>
              <TextInput
                testID="reset-password"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={() => { field.handleBlur(); setFocusedField(null); }}
                onFocus={() => setFocusedField('password')}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.gray400}
                style={[
                  styles.input,
                  focusedField === 'password' && styles.inputFocused,
                  error ? styles.inputError : null,
                ]}
              />
              {error
                ? (
                    <Animated.View entering={FadeInDown.duration(200)}>
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                  )
                : null}
            </View>
          );
        }}
      />

      <form.Field
        name="confirmPassword"
        children={(field) => {
          const error = getFieldError(field);
          return (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{t('auth.confirm_password_label')}</Text>
              <TextInput
                testID="reset-confirm-password"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={() => { field.handleBlur(); setFocusedField(null); }}
                onFocus={() => setFocusedField('confirmPassword')}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.gray400}
                style={[
                  styles.input,
                  focusedField === 'confirmPassword' && styles.inputFocused,
                  error ? styles.inputError : null,
                ]}
              />
              {error
                ? (
                    <Animated.View entering={FadeInDown.duration(200)}>
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                  )
                : null}
            </View>
          );
        }}
      />

      <form.Subscribe
        selector={state => [state.isSubmitting]}
        children={([isSubmitting]) => (
          <Button
            testID="reset-submit"
            label={t('auth.reset_submit')}
            onPress={form.handleSubmit}
            loading={isSubmitting}
          />
        )}
      />

      <Pressable onPress={() => router.replace('/(auth)/sign-in')} style={styles.backLink}>
        <Text style={styles.backLinkText}>{t('auth.back_to_sign_in')}</Text>
      </Pressable>
    </Animated.View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
};

function makeStyles({ colors }: StyleTokens) {
  return StyleSheet.create({
    container: { flex: 1, padding: 24, gap: 4 },
    heading: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, marginTop: 12 },
    subheading: { fontSize: 14, color: colors.textSecondary, marginBottom: 24, lineHeight: 20 },
    apiErrorBox: { backgroundColor: colors.errorLight, borderRadius: 10, padding: 12, marginBottom: 8 },
    apiErrorText: { color: colors.error, fontSize: 14 },
    fieldContainer: { marginBottom: 16 },
    label: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      borderCurve: 'continuous',
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 15,
      color: colors.textPrimary,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    inputFocused: {
      borderColor: colors.borderFocus,
      boxShadow: '0 0 0 3px rgba(45,107,228,0.12)',
    },
    inputError: { borderColor: colors.error },
    errorText: { color: colors.error, fontSize: 13, marginTop: 4 },
    backLink: { marginTop: 16, alignItems: 'center' },
    backLinkText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  });
}
