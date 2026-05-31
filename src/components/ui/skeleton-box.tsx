/**
 * SkeletonBox — shimmer ghost placeholder for loading states.
 *
 * A gray rectangle with a left→right shimmer sweep that repeats indefinitely.
 * Drop-in replacement for ActivityIndicator in card-level loading states.
 *
 * Usage:
 *   <SkeletonBox style={{ height: 20, width: '60%', marginBottom: 8 }} />
 */

import type { StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/ThemeContext';

type SkeletonBoxProps = {
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBox({ style }: SkeletonBoxProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(-200);

  React.useEffect(() => {
    // Reset then sweep left→right infinitely (no reverse — each cycle re-sweeps)
    translateX.value = -200;
    translateX.value = withRepeat(
      withTiming(300, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.base, { backgroundColor: colors.gray200 }, style]}>
      {/* Shimmer overlay — clipped by parent overflow:hidden */}
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    overflow: 'hidden', // clips the shimmer sweep to the box bounds
  },
  shimmer: {
    width: 250,
    height: '100%',
  },
});
