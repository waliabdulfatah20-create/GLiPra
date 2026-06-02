import type { GlipraTokens } from '@/theme/tokens';
import * as React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

type PainLevelSliderProps = {
  /** Integer 0–10 */
  value: number;
  onChange: (value: number) => void;
};

const MAX = 10;
const TICKS = Array.from({ length: MAX + 1 }, (_, i) => i); // 0..10
const THUMB = 24;

function clamp(n: number, lo: number, hi: number) {
  'worklet';
  return Math.min(hi, Math.max(lo, n));
}

/**
 * Horizontal pain-level scale, 0–10, drag-to-slide.
 *
 * Renders a thin track + filled bar + draggable thumb. The thumb snaps to
 * integer values 0..10 with haptic feedback at each crossing. Tapping
 * anywhere on the track jumps the thumb to that position. Accessibility
 * actions support TalkBack increment/decrement.
 *
 * Built on react-native-gesture-handler v2 (`Gesture.Pan`/`Gesture.Tap`)
 * + react-native-reanimated v4 shared values — both already native-compiled
 * into the current dev build, so this change is OTA-shippable.
 */
export function PainLevelSlider({ value, onChange }: PainLevelSliderProps) {
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // Measured track width in px. 1 = safe default so first-frame math doesn't divide by zero.
  const [trackW, setTrackW] = React.useState(1);

  // Shared value tracks the thumb's position in px along the track (0..trackW).
  const positionPx = useSharedValue<number>((value / MAX) * trackW);
  // Where the pan began in px (set on onBegin).
  const startPx = useSharedValue<number>(0);
  // Last integer value reported to JS — used to fire haptic only on change.
  const lastReported = useSharedValue<number>(value);

  // Keep the shared value in sync when `value` changes externally (e.g. form reset)
  // or when the track width is measured after first render.
  React.useEffect(() => {
    positionPx.value = withTiming((value / MAX) * trackW, { duration: 120 });
    lastReported.value = value;
  }, [value, trackW, positionPx, lastReported]);

  const reportIfChanged = React.useCallback(
    (next: number) => {
      if (next !== value) {
        haptics.selection();
        onChange(next);
      }
    },
    [value, onChange],
  );

  const commitFromPosition = (px: number) => {
    'worklet';
    const snapped = Math.round((px / trackW) * MAX);
    if (snapped !== lastReported.value) {
      lastReported.value = snapped;
      runOnJS(reportIfChanged)(snapped);
    }
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      startPx.value = positionPx.value;
    })
    .onUpdate((e) => {
      const next = clamp(startPx.value + e.translationX, 0, trackW);
      positionPx.value = next;
      commitFromPosition(next);
    })
    .onEnd(() => {
      // Snap thumb visually to the integer it just committed.
      const snapped = Math.round((positionPx.value / trackW) * MAX);
      positionPx.value = withTiming((snapped / MAX) * trackW, { duration: 90 });
    });

  const tap = Gesture.Tap().onEnd((e) => {
    const next = clamp(e.x, 0, trackW);
    const snapped = Math.round((next / trackW) * MAX);
    positionPx.value = withTiming((snapped / MAX) * trackW, { duration: 120 });
    if (snapped !== lastReported.value) {
      lastReported.value = snapped;
      runOnJS(reportIfChanged)(snapped);
    }
  });

  const composed = Gesture.Race(pan, tap);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: positionPx.value - THUMB / 2 }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: positionPx.value,
  }));

  const bump = (delta: number) => {
    const next = Math.max(0, Math.min(MAX, value + delta));
    if (next !== value) {
      haptics.selection();
      onChange(next);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pain Level</Text>
      <View style={styles.sliderColumn}>
        <GestureDetector gesture={composed}>
          <View
            style={styles.trackHit}
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
            accessibilityRole="adjustable"
            accessibilityLabel="Pain level"
            accessibilityValue={{ min: 0, max: MAX, now: value }}
            accessibilityActions={[
              { name: 'increment', label: 'Increase pain level' },
              { name: 'decrement', label: 'Decrease pain level' },
            ]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'increment') bump(1);
              if (event.nativeEvent.actionName === 'decrement') bump(-1);
            }}
          >
            <View style={styles.track}>
              <Animated.View style={[styles.fill, fillStyle]} />
            </View>
            <View style={styles.ticksRow} pointerEvents="none">
              {TICKS.map((t) => (
                <View key={t} style={styles.tick} />
              ))}
            </View>
            <Animated.View style={[styles.thumb, thumbStyle]} pointerEvents="none" />
          </View>
        </GestureDetector>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.textPrimary,
      minWidth: 84,
    },
    sliderColumn: {
      flex: 1,
      justifyContent: 'center',
    },
    trackHit: {
      height: THUMB + 12, // generous vertical hit area
      justifyContent: 'center',
    },
    track: {
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    fill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: colors.primary,
      borderRadius: radius.full,
    },
    ticksRow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '50%',
      marginTop: 8,
      height: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    tick: {
      width: 1,
      height: 6,
      backgroundColor: colors.textPrimary,
      opacity: 0.25,
    },
    thumb: {
      position: 'absolute',
      top: '50%',
      marginTop: -THUMB / 2,
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: colors.primary,
      ...shadows.sm,
    },
    value: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      minWidth: 24,
      textAlign: 'right',
    },
  });
}
