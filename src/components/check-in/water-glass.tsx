// WaterGlass — a small glass vessel that fills with water as the count rises.
// The fill height animates (reanimated withTiming) for a premium feel; a thin
// white-opacity line marks the water surface. Presentational only.

import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/ThemeContext';

const VESSEL_W = 62;
const VESSEL_H = 92;

export function WaterGlass({ filled, total }: { filled: number; total: number }) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => makeStyles({ colors }), [colors]);

  const fraction = total > 0 ? Math.max(0, Math.min(1, filled / total)) : 0;

  const fillHeight = useSharedValue(fraction * VESSEL_H);
  React.useEffect(() => {
    fillHeight.value = withTiming(fraction * VESSEL_H, { duration: 350 });
  }, [fraction]);
  const fillStyle = useAnimatedStyle(() => ({ height: fillHeight.value }));

  return (
    <View
      style={styles.vessel}
      accessibilityRole="image"
      accessibilityLabel={`${filled} of ${total} glasses of water`}
    >
      <Animated.View style={[styles.fill, fillStyle]} />
    </View>
  );
}

type StyleTokens = { colors: GlipraTokens['colors'] };

function makeStyles({ colors }: StyleTokens) {
  return StyleSheet.create({
    vessel: {
      width: VESSEL_W,
      height: VESSEL_H,
      borderWidth: 2,
      borderColor: colors.border,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
      borderBottomLeftRadius: 16,
      borderBottomRightRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.gray100,
      justifyContent: 'flex-end',
    },
    fill: {
      width: '100%',
      backgroundColor: colors.water,
      borderTopWidth: 2,
      borderTopColor: 'rgba(255,255,255,0.4)',
    },
  });
}
