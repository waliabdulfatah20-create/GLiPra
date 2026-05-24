import * as AppleAuthentication from 'expo-apple-authentication';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, LinearTransition } from 'react-native-reanimated';
import { useForm } from '@tanstack/react-form';
import * as z from 'zod';

import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';
import { getFieldError } from '@/components/ui/form-utils';
import { colors } from '@/theme/colors';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type SignUpFormProps = {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  apiError?: string | null;
};

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';
  const hasMixed = /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
  if (password.length >= 12 && hasMixed && /[^a-zA-Z0-9]/.test(password)) return 'strong';
  if (hasMixed) return 'medium';
  return 'weak';
}

const strengthColors: Record<PasswordStrength, string> = {
  weak: colors.error,
  medium: colors.warning,
  strong: colors.success,
};

const strengthSegments: Record<PasswordStrength, number> = {
  weak: 1,
  medium: 2,
  strong: 3,
};

function PasswordStrengthBar({ password }: { password: string }) {
  if (!password) {
    return <View testID="password-strength-bar" style={styles.strengthBarEmpty} />;
  }
  const strength = getPasswordStrength(password);
  const activeSegments = strengthSegments[strength];
  const segmentColor = strengthColors[strength];

  return (
    <View testID="password-strength-bar" style={styles.strengthBarContainer}>
      {[1, 2, 3].map((n) => (
        <Animated.View
          key={n}
          // @ts-expect-error layout prop
          layout={LinearTransition}
          style={[
            styles.strengthSegment,
            { backgroundColor: n <= activeSegments ? segmentColor : colors.gray200 },
          ]}
        />
      ))}
    </View>
  );
}

export function SignUpForm({ onSubmit, apiError }: SignUpFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordValue, setPasswordValue] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const form = useForm({
    defaultValues: { email: '', password: '' },
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
    },
  });

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      style={styles.container}
    >
      <Text style={styles.heading}>{t('auth.sign_up_heading')}</Text>
      <Text style={styles.subheading}>{t('auth.sign_up_subheading')}</Text>

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
                testID="sign-up-email"
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

      <form.Field
        name="password"
        children={(field) => {
          const error = getFieldError(field);
          return (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>{t('auth.password_label')}</Text>
              <TextInput
                testID="sign-up-password"
                value={field.state.value}
                onChangeText={(text) => {
                  field.handleChange(text);
                  setPasswordValue(text);
                }}
                onBlur={() => { field.handleBlur(); setFocusedField(null); }}
                onFocus={() => setFocusedField('password')}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.gray400}
                style={[
                  styles.input,
                  focusedField === 'password' && styles.inputFocused,
                  error ? styles.inputError : null,
                ]}
              />
              <PasswordStrengthBar password={passwordValue} />
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
            testID="sign-up-submit"
            label={t('auth.sign_up')}
            onPress={form.handleSubmit}
            loading={isSubmitting}
          />
        )}
      />

      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={14}
          style={styles.appleButton}
          onPress={() => {}}
        />
      )}

      <View style={styles.crossLink}>
        <Text style={styles.crossLinkText}>{t('auth.have_account')}</Text>
        <Pressable onPress={() => router.push('/(auth)/sign-in')}>
          <Text style={styles.crossLinkAction}>{t('auth.sign_in_link')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 4 },
  heading: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 4, marginTop: 12 },
  subheading: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
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
  strengthBarEmpty: { height: 4, marginTop: 6 },
  strengthBarContainer: { flexDirection: 'row', gap: 4, marginTop: 6 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  appleButton: { width: '100%', height: 50, marginTop: 8 },
  crossLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  crossLinkText: { color: colors.textSecondary, fontSize: 14 },
  crossLinkAction: { color: colors.primary, fontSize: 14, fontWeight: '500' },
});
