import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Svg } from 'react-native-svg';

import { colors } from '@/theme/colors';

interface ProteinRingProps {
  proteinConsumedG: number;
  proteinFloorG: number;
  size?: number;
}

function arcColor(progress: number): string {
  if (progress >= 0.9) return colors.proteinGood;
  if (progress >= 0.6) return colors.proteinMid;
  return colors.proteinLow;
}

export function ProteinRing({
  proteinConsumedG,
  proteinFloorG,
  size = 140,
}: ProteinRingProps) {
  const progress = proteinFloorG > 0 ? Math.min(1, proteinConsumedG / proteinFloorG) : 0;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;
  const fill = arcColor(progress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.gray200}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc — starts at top (rotate -90deg) */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={fill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.consumed, { color: fill }]}>
          {Math.round(proteinConsumedG)}g
        </Text>
        <Text style={styles.floor}>of {Math.round(proteinFloorG)}g</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
  },
  consumed: {
    fontSize: 22,
    fontWeight: '800',
  },
  floor: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
