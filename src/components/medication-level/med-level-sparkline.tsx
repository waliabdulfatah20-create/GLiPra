// MedLevelSparkline — a compact, axis-less preview of the medication-level curve for
// the Dose hub's MedLevelBanner. A downsized LevelChart: gradient fill + curve polyline
// + an amber "today" dot, with no axes/labels/injection-dots. Renders null when there are
// fewer than 2 points. Self-measures its width via onLayout so it fills the card.

import * as React from 'react';
import { View } from 'react-native';
import {
  Circle,
  Defs,
  Path,
  Polyline,
  Stop,
  Svg,
  LinearGradient as SvgLinearGradient,
} from 'react-native-svg';

import { useTheme } from '@/lib/ThemeContext';

export type MedLevelSparklineProps = {
  curve: { dayOffset: number; levelMg: number }[];
  /** dayOffset that maps to today (usually 0) */
  todayOffset: number;
  height?: number;
};

const PADDING = { top: 6, right: 4, bottom: 6, left: 4 };

export function MedLevelSparkline({ curve, todayOffset, height = 52 }: MedLevelSparklineProps) {
  const { colors } = useTheme();
  const [width, setWidth] = React.useState(0);

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  const computed = React.useMemo(() => {
    if (curve.length < 2 || plotW <= 0)
      return null;

    const minOffset = curve[0].dayOffset;
    const maxOffset = curve[curve.length - 1].dayOffset;
    const maxLevel = Math.max(...curve.map(p => p.levelMg));
    const levelRange = maxLevel || 1;
    const offsetRange = maxOffset - minOffset || 1;

    const toX = (offset: number) => PADDING.left + ((offset - minOffset) / offsetRange) * plotW;
    const toY = (level: number) => PADDING.top + ((maxLevel - level) / levelRange) * plotH;

    const baselineY = (PADDING.top + plotH).toFixed(1);
    const firstX = toX(curve[0].dayOffset).toFixed(1);
    const lastX = toX(curve[curve.length - 1].dayOffset).toFixed(1);

    const curvePoints = curve
      .map(p => `${toX(p.dayOffset).toFixed(1)},${toY(p.levelMg).toFixed(1)}`)
      .join(' ');
    const fillPath = `M ${firstX},${baselineY} ${
      curve.map(p => `L ${toX(p.dayOffset).toFixed(1)},${toY(p.levelMg).toFixed(1)}`).join(' ')
    } L ${lastX},${baselineY} Z`;

    const todayPoint = curve.find(p => p.dayOffset === todayOffset);
    const todayDot = todayPoint != null
      ? { x: toX(todayPoint.dayOffset), y: toY(todayPoint.levelMg) }
      : null;

    return { curvePoints, fillPath, todayDot };
  }, [curve, todayOffset, plotW, plotH]);

  // Fewer than 2 points — nothing to draw.
  if (curve.length < 2)
    return null;

  return (
    <View
      style={{ height }}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {computed && width > 0
        ? (
            <Svg width={width} height={height}>
              <Defs>
                <SvgLinearGradient id="pkSparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.22" />
                  <Stop offset="100%" stopColor={colors.primary} stopOpacity="0.02" />
                </SvgLinearGradient>
              </Defs>
              <Path d={computed.fillPath} fill="url(#pkSparkGrad)" />
              <Polyline
                points={computed.curvePoints}
                fill="none"
                stroke={colors.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {computed.todayDot != null && (
                <Circle cx={computed.todayDot.x} cy={computed.todayDot.y} r={3.5} fill={colors.warning} />
              )}
            </Svg>
          )
        : null}
    </View>
  );
}
