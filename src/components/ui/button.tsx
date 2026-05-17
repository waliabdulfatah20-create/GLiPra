import type { PressableProps, View } from 'react-native';
import * as React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

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
    borderRadius: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  baseLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  indicator: {
    height: 24,
  },
  // Sizes
  sizeDefault: {
    height: 40,
    paddingHorizontal: 16,
  },
  sizeLg: {
    height: 48,
    paddingHorizontal: 32,
  },
  sizeSm: {
    height: 32,
    paddingHorizontal: 12,
  },
  sizeIcon: {
    width: 36,
    height: 36,
  },
});

export function Button({
  ref,
  label: text,
  loading = false,
  variant = 'default',
  disabled = false,
  size = 'default',
  className = '',
  testID,
  textClassName = '',
  ...props
}: Props & { ref?: React.RefObject<View | null> }) {
  return (
    <Pressable
      disabled={disabled || loading}
      style={[styles.baseContainer, size === 'default' && styles.sizeDefault, size === 'lg' && styles.sizeLg, size === 'sm' && styles.sizeSm, size === 'icon' && styles.sizeIcon]}
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
                      testID={testID ? `${testID}-activity-indicator` : undefined}
                    />
                  )
                : (
                    <Text
                      testID={testID ? `${testID}-label` : undefined}
                      style={styles.baseLabel}
                    >
                      {text}
                    </Text>
                  )}
            </>
          )}
    </Pressable>
  );
}
