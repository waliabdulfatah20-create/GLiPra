// NutritionHeaderRing
// Compact 44×44px donut ring for the Nutrition Log screen header.
// Shows today's protein consumed vs. the user's protein floor.
// Reuses the same Circle-based arc technique from ProteinRing (Today screen).

import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

import { colors } from '@/theme/colors';

interface Props {
  consumed: number;
  floor: number;
}

const SIZE = 44;
const STROKE = 4;

export function NutritionHeaderRing({ consumed, floor }: Props) {
  const r = (SIZE - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = floor > 0 ? Math.min(1, consumed / floor) : 0;
  const strokeDashoffset = circumference * (1 - progress);
  const center = SIZE / 2;

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={colors.border}
          strokeWidth={STROKE}
          fill="none"
        />
        {/* Progress arc — starts at top (-90° rotation) */}
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={colors.primary}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.label}>{Math.round(consumed)}g</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
});
