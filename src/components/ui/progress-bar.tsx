import * as React from 'react';
import { useImperativeHandle } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  initialProgress?: number;
  style?: object;
};

export type ProgressBarRef = {
  setProgress: (value: number) => void;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EAEAEA',
    height: 2,
    overflow: 'hidden',
  },
  bar: {
    height: 2,
    backgroundColor: '#000',
  },
});

export function ProgressBar({ ref, initialProgress = 0, style: customStyle }: Props & { ref?: React.RefObject<ProgressBarRef | null> }) {
  const progress = useSharedValue<number>(initialProgress ?? 0);
  useImperativeHandle(ref, () => {
    return {
      setProgress: (value: number) => {
        progress.value = withTiming(value, {
          duration: 250,
          easing: Easing.inOut(Easing.quad),
        });
      },
    };
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  });

  return (
    <View style={[styles.container, customStyle]}>
      <Animated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
}
