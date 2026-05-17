import type { TextInputProps } from 'react-native';
import * as React from 'react';
import { I18nManager, TextInput as NTextInput, StyleSheet, View } from 'react-native';

import colors from './colors';
import { Text } from './text';

export type NInputProps = {
  label?: string;
  disabled?: boolean;
  error?: string;
} & TextInputProps;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    marginTop: 0,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.neutral[300],
    backgroundColor: colors.neutral[100],
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  inputFocused: {
    borderColor: colors.neutral[400],
  },
  inputError: {
    borderColor: colors.danger[600],
  },
  inputDisabled: {
    backgroundColor: colors.neutral[200],
  },
  errorText: {
    fontSize: 14,
    color: colors.danger[400],
  },
});

export function Input({ ref, ...props }: NInputProps & { ref?: React.Ref<NTextInput | null> }) {
  const { label, error, testID, onBlur: onBlurProp, onFocus: onFocusProp, ...inputProps } = props;
  const [isFocussed, setIsFocussed] = React.useState(false);

  const onBlur = React.useCallback(
    (e: any) => {
      setIsFocussed(false);
      onBlurProp?.(e);
    },
    [onBlurProp],
  );

  const onFocus = React.useCallback(
    (e: any) => {
      setIsFocussed(true);
      onFocusProp?.(e);
    },
    [onFocusProp],
  );

  const inputStyle = [
    styles.input,
    isFocussed && styles.inputFocused,
    error && styles.inputError,
    props.disabled && styles.inputDisabled,
  ];

  return (
    <View style={styles.container}>
      {label && (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          style={styles.label}
        >
          {label}
        </Text>
      )}
      <NTextInput
        testID={testID}
        ref={ref}
        placeholderTextColor={colors.neutral[400]}
        onBlur={onBlur}
        onFocus={onFocus}
        {...inputProps}
        style={StyleSheet.flatten([
          inputStyle,
          { writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr' },
          { textAlign: I18nManager.isRTL ? 'right' : 'left' },
          inputProps.style,
        ])}
      />
      {error && (
        <Text
          testID={testID ? `${testID}-error` : undefined}
          style={styles.errorText}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
