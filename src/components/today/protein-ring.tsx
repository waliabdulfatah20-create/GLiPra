import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Circle, Svg } from 'react-native-svg';
import { useTheme } from '@/lib/ThemeContext';

// Animated SVG circle — animates strokeDashoffset on the UI thread via Reanimated
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ProteinRingProps = {
  proteinConsumedG: number;
  proteinFloorG: number;
  size?: number;
};

export function ProteinRing({
  proteinConsumedG,
  proteinFloorG,
  size = 140,
}: ProteinRingProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors }),
    [colors],
  );

  function arcColor(p: number): string {
    if (p >= 0.9)
      return colors.proteinGood;
    if (p >= 0.6)
      return colors.proteinMid;
    return colors.proteinLow;
  }

  const progress = proteinFloorG > 0 ? Math.min(1, proteinConsumedG / proteinFloorG) : 0;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const fill = arcColor(progress);

  // Spring-fill animation: dashOffset starts at circumference (empty ring) and springs
  // to the target offset whenever progress changes (on mount or new data).
  const dashOffset = useSharedValue(circumference);

  React.useEffect(() => {
    dashOffset.value = withSpring(circumference * (1 - progress), {
      damping: 18,
      stiffness: 80,
    });
  }, [progress, circumference]);

  const animatedArcProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

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
        {/* Progress arc — springs from empty to target on mount / data change */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={fill}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
          animatedProps={animatedArcProps}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.consumed, { color: fill }]}>
          {Math.round(proteinConsumedG)}
          g
        </Text>
        <Text style={styles.floor}>
          of
          {Math.round(proteinFloorG)}
          g
        </Text>
      </View>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
};

function makeStyles({ colors }: StyleTokens) {
  return StyleSheet.create({
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
}
