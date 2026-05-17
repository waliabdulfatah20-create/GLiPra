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
    .min(1, 'Password is required'),
});

export type SignInFormProps = {
  onSubmit: (data: { email: string; password: string }) => Promise<void>;
  apiError?: string | null;
};

export function SignInForm({ onSubmit, apiError }: SignInFormProps) {
  const router = useRouter();
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
      <Text style={styles.heading}>Welcome back</Text>
      <Text style={styles.subheading}>Sign in to your DosePath account</Text>

      {apiError ? (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.apiErrorBox}>
          <Text style={styles.apiErrorText}>{apiError}</Text>
        </Animated.View>
      ) : null}

      {/* Email field */}
      <form.Field
        name="email"
        children={(field) => {
          const error = getFieldError(field);
          return (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                testID="sign-in-email"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={() => {
                  field.handleBlur();
                  setFocusedField(null);
                }}
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

      {/* Password field */}
      <form.Field
        name="password"
        children={(field) => {
          const error = getFieldError(field);
          return (
            <View style={styles.fieldContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </Pressable>
              </View>
              <TextInput
                testID="sign-in-password"
                value={field.state.value}
                onChangeText={field.handleChange}
                onBlur={() => {
                  field.handleBlur();
                  setFocusedField(null);
                }}
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
              {error ? (
                <Animated.View entering={FadeInDown.duration(200)}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}
            </View>
          );
        }}
      />

      {/* Submit */}
      <form.Subscribe
        selector={(state) => [state.isSubmitting]}
        children={([isSubmitting]) => (
          <Button
            testID="sign-in-submit"
            label="Sign In"
            onPress={form.handleSubmit}
            loading={isSubmitting}
          />
        )}
      />

      {/* Apple Sign In — hidden in Expo Go (isAvailable returns false) */}
      {appleAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={14}
          style={styles.appleButton}
          onPress={() => {}}
        />
      )}

      {/* Cross-link */}
      <View style={styles.crossLink}>
        <Text style={styles.crossLinkText}>Don't have an account? </Text>
        <Pressable onPress={() => router.push('/(auth)/sign-up')}>
          <Text style={styles.crossLinkAction}>Sign up</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
    marginTop: 12,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  apiErrorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  apiErrorText: {
    color: colors.error,
    fontSize: 14,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
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
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    marginTop: 4,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginTop: 8,
  },
  crossLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  crossLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  crossLinkAction: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
