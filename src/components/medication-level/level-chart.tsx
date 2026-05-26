import { format, parseISO } from 'date-fns';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Line, Polyline, Svg, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/lib/ThemeContext';
import type { GlipraTokens } from '@/theme/tokens';

interface LevelChartProps {
  curve: Array<{ date: string; dayOffset: number; levelMg: number }>;
  todayOffset: number; // dayOffset value that represents "today"
  /** Actual logged injection dates (YYYY-MM-DD). Dots are placed on these dates. */
  injectionDates?: string[];
  labelIntervalDays?: number; // x-axis label frequency — default 7
  width: number;
  height: number;
}

const PADDING_TOP = 16;
const PADDING_BOTTOM = 28; // room for x-axis labels
const PADDING_LEFT = 32;   // room for y-axis label
const PADDING_RIGHT = 8;
const GRID_LINES = 3;

/**
 * Map a dayOffset value to an x-pixel coordinate within the chart.
 */
function toX(
  dayOffset: number,
  minOffset: number,
  maxOffset: number,
  chartInnerWidth: number,
): number {
  if (maxOffset === minOffset) return PADDING_LEFT;
  const fraction = (dayOffset - minOffset) / (maxOffset - minOffset);
  return PADDING_LEFT + fraction * chartInnerWidth;
}

/**
 * Map a levelMg value to a y-pixel coordinate.
 * SVG y-axis increases downward, so higher levels = smaller y.
 */
function toY(
  levelMg: number,
  maxLevel: number,
  chartInnerHeight: number,
): number {
  const fraction = maxLevel > 0 ? levelMg / maxLevel : 0;
  return PADDING_TOP + (1 - fraction) * chartInnerHeight;
}

export function LevelChart({
  curve,
  todayOffset,
  injectionDates,
  labelIntervalDays = 7,
  width,
  height,
}: LevelChartProps) {
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );

  if (curve.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Not enough data</Text>
      </View>
    );
  }

  const chartInnerWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const chartInnerHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const minOffset = curve[0].dayOffset;
  const maxOffset = curve[curve.length - 1].dayOffset;

  // Auto-scale Y: max level + 10% padding, min = 0
  const maxLevelRaw = Math.max(...curve.map((p) => p.levelMg));
  const maxLevel = maxLevelRaw > 0 ? maxLevelRaw * 1.1 : 1;

  // Build polyline points string
  const polylinePoints = curve
    .map(
      (p) =>
        `${toX(p.dayOffset, minOffset, maxOffset, chartInnerWidth)},${toY(p.levelMg, maxLevel, chartInnerHeight)}`,
    )
    .join(' ');

  // Horizontal grid lines
  const gridLines = Array.from({ length: GRID_LINES }, (_, i) => {
    const fraction = (i + 1) / (GRID_LINES + 1);
    const y = PADDING_TOP + fraction * chartInnerHeight;
    const labelMg = maxLevel * (1 - fraction);
    return { y, labelMg };
  });

  // X-axis label positions — interval controlled by labelIntervalDays prop
  const xLabels: Array<{ x: number; label: string }> = [];
  for (const point of curve) {
    if (point.dayOffset % labelIntervalDays === 0) {
      xLabels.push({
        x: toX(point.dayOffset, minOffset, maxOffset, chartInnerWidth),
        label: format(parseISO(point.date), 'MMM d'),
      });
    }
  }

  // Today vertical marker
  const todayPoint = curve.find((p) => p.dayOffset === todayOffset);
  const todayX = todayPoint
    ? toX(todayPoint.dayOffset, minOffset, maxOffset, chartInnerWidth)
    : null;

  // Injection dots — placed at actual logged dates when available,
  // otherwise no dots (removes the misleading synthetic-interval fallback)
  const injectionDateSet = new Set(injectionDates ?? []);
  const injectionDots = injectionDates && injectionDates.length > 0
    ? curve.filter((p) => injectionDateSet.has(p.date))
    : [];

  const axisY = PADDING_TOP + chartInnerHeight;

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Horizontal grid lines */}
        {gridLines.map(({ y }, i) => (
          <Line
            key={`grid-${i}`}
            x1={PADDING_LEFT}
            y1={y}
            x2={width - PADDING_RIGHT}
            y2={y}
            stroke={colors.gray200}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        ))}

        {/* X-axis baseline */}
        <Line
          x1={PADDING_LEFT}
          y1={axisY}
          x2={width - PADDING_RIGHT}
          y2={axisY}
          stroke={colors.gray300}
          strokeWidth={1}
        />

        {/* Y-axis line */}
        <Line
          x1={PADDING_LEFT}
          y1={PADDING_TOP}
          x2={PADDING_LEFT}
          y2={axisY}
          stroke={colors.gray300}
          strokeWidth={1}
        />

        {/* Concentration curve */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={colors.primary}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Today vertical dashed marker */}
        {todayX !== null && (
          <Line
            x1={todayX}
            y1={PADDING_TOP}
            x2={todayX}
            y2={axisY}
            stroke={colors.warning}
            strokeWidth={1.5}
            strokeDasharray="5 3"
          />
        )}

        {/* Injection dots */}
        {injectionDots.map((p, i) => {
          const cx = toX(p.dayOffset, minOffset, maxOffset, chartInnerWidth);
          const cy = toY(p.levelMg, maxLevel, chartInnerHeight);
          return (
            <Circle
              key={`inj-${i}`}
              cx={cx}
              cy={cy}
              r={4}
              fill={colors.primary}
            />
          );
        })}

        {/* X-axis date labels */}
        {xLabels.map(({ x, label }, i) => (
          <SvgText
            key={`xlabel-${i}`}
            x={x}
            y={height - 4}
            fontSize={9}
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        ))}

        {/* Y-axis "mg" rotated label */}
        <SvgText
          x={10}
          y={PADDING_TOP + chartInnerHeight / 2}
          fontSize={9}
          fill={colors.textSecondary}
          textAnchor="middle"
          rotation="-90"
          originX={10}
          originY={PADDING_TOP + chartInnerHeight / 2}
        >
          mg
        </SvgText>
      </Svg>

      {/* Today label below chart */}
      {todayX !== null && (
        <View
          style={[
            styles.todayLabel,
            { left: todayX - 16, top: height - PADDING_BOTTOM + 2 },
          ]}
        >
          <Text style={styles.todayLabelText}>Now</Text>
        </View>
      )}
    </View>
  );
}

interface StyleTokens {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
}

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    todayLabel: {
      position: 'absolute',
      width: 32,
      alignItems: 'center',
    },
    todayLabelText: {
      fontSize: 9,
      color: colors.warning,
      fontWeight: '600',
      marginTop: spacing.xs,
    },
  });
}
