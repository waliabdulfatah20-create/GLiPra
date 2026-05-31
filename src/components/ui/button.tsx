import type { PressableProps, View } from 'react-native';
import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/lib/ThemeContext';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'destructive' | 'ghost' | 'link';
type ButtonSize = 'default' | 'lg' | 'sm' | 'icon';

type Props = {
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
} & Omit<PressableProps, 'disabled'>;

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  baseLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Sizes
  sizeDefault: {
    height: 48,
    paddingHorizontal: 16,
  },
  sizeLg: {
    height: 52,
    paddingHorizontal: 32,
  },
  sizeSm: {
    height: 36,
    paddingHorizontal: 12,
  },
  sizeIcon: {
    width: 40,
    height: 40,
  },
});

type VariantStyle = {
  bg: string;
  label: string;
  indicator: string;
  borderWidth: number;
  border: string;
  underline: boolean;
};

function variantStyle(
  colors: GlipraTokens['colors'],
  variant: ButtonVariant,
): VariantStyle {
  const base = { borderWidth: 0, border: 'transparent', underline: false };
  switch (variant) {
    case 'destructive':
      return { ...base, bg: colors.error, label: colors.white, indicator: colors.white };
    case 'secondary':
      return { ...base, bg: colors.surfaceElevated, label: colors.textPrimary, indicator: colors.textPrimary, borderWidth: 1, border: colors.border };
    case 'outline':
      return { ...base, bg: 'transparent', label: colors.primary, indicator: colors.primary, borderWidth: 1, border: colors.primary };
    case 'ghost':
      return { ...base, bg: 'transparent', label: colors.primary, indicator: colors.primary };
    case 'link':
      return { ...base, bg: 'transparent', label: colors.primary, indicator: colors.primary, underline: true };
    case 'default':
    default:
      return { ...base, bg: colors.primary, label: colors.white, indicator: colors.white };
  }
}

export function Button({
  ref,
  label: text,
  loading = false,
  variant = 'default',
  disabled = false,
  size = 'default',
  className: _className = '',
  testID,
  textClassName: _textClassName = '',
  ...props
}: Props & { ref?: React.RefObject<View | null> }) {
  const { colors } = useTheme();
  const v = variantStyle(colors, variant);

  return (
    <Pressable
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        size === 'default' && styles.sizeDefault,
        size === 'lg' && styles.sizeLg,
        size === 'sm' && styles.sizeSm,
        size === 'icon' && styles.sizeIcon,
        { backgroundColor: v.bg, borderWidth: v.borderWidth, borderColor: v.border },
        (disabled || loading) && { opacity: 0.5 },
      ]}
      {...props}
      ref={ref}
      testID={testID}
    >
      {props.children
        ? (
            props.children
          )
        : (
            <>
              {loading
                ? (
                    <ActivityIndicator
                      size="small"
                      color={v.indicator}
                      testID={testID ? `${testID}-activity-indicator` : undefined}
                    />
                  )
                : (
                    <Text
                      testID={testID ? `${testID}-label` : undefined}
                      style={[styles.baseLabel, { color: v.label }, v.underline && { textDecorationLine: 'underline' }]}
                    >
                      {text}
                    </Text>
                  )}
            </>
          )}
    </Pressable>
  );
}
