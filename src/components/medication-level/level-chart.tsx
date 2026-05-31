import { format, parseISO } from 'date-fns';
import * as React from 'react';
import { View } from 'react-native';
import {
  Circle,
  Defs,
  Line,
  Path,
  Polyline,
  Stop,
  Svg,
  LinearGradient as SvgLinearGradient,
  Text as SvgText,
} from 'react-native-svg';

import { useTheme } from '@/lib/ThemeContext';

export type LevelChartProps = {
  curve: Array<{ date: string; dayOffset: number; levelMg: number }>;
  /** dayOffset value that maps to today (usually 0) */
  todayOffset: number;
  /** YYYY-MM-DD strings — rendered as brand dots on the baseline */
  injectionDates: string[];
  /** Days between x-axis labels (2 for 7D view, 7 for 30D view) */
  labelIntervalDays: number;
  width: number;
  height: number;
};

const PADDING = { top: 16, right: 12, bottom: 28, left: 40 };

export function LevelChart({
  curve,
  todayOffset,
  injectionDates,
  labelIntervalDays,
  width,
  height,
}: LevelChartProps) {
  const { colors } = useTheme();

  // Fix 1: Derive BRAND and AMBER from theme colors (dark mode support)
  const BRAND = colors.primary;
  const AMBER = colors.warning;

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  // Fix 2: Memoize coordinate mapping computations — MUST be before any early return
  // (Rules of Hooks: hooks must be called unconditionally on every render)
  const computed = React.useMemo(() => {
    // Guard inside the memo so curve.length < 2 never causes an out-of-bounds access
    if (curve.length < 2)
      return null;

    const minOffset = curve[0].dayOffset;
    const maxOffset = curve[curve.length - 1].dayOffset;
    const maxLevel = Math.max(...curve.map(p => p.levelMg));
    const levelRange = maxLevel || 1;
    const offsetRange = maxOffset - minOffset || 1;

    function toX(offset: number): number {
      return PADDING.left + ((offset - minOffset) / offsetRange) * plotW;
    }
    function toY(level: number): number {
      return PADDING.top + ((maxLevel - level) / levelRange) * plotH;
    }

    const baselineY = toY(0);

    const curvePoints = curve
      .map(p => `${toX(p.dayOffset).toFixed(1)},${toY(p.levelMg).toFixed(1)}`)
      .join(' ');

    const firstX = toX(curve[0].dayOffset).toFixed(1);
    const lastX = toX(curve[curve.length - 1].dayOffset).toFixed(1);
    const fillPath
      = `M ${firstX},${baselineY.toFixed(1)} ${
        curve.map(p => `L ${toX(p.dayOffset).toFixed(1)},${toY(p.levelMg).toFixed(1)}`).join(' ')
      } L ${lastX},${baselineY.toFixed(1)} Z`;

    const todayX = toX(todayOffset);
    const todayPoint = curve.find(p => p.dayOffset === todayOffset);
    const todayY = todayPoint != null ? toY(todayPoint.levelMg) : null;

    // Build date to offset lookup for injection dot placement
    const dateToOffset: Record<string, number> = {};
    for (const p of curve) { dateToOffset[p.date] = p.dayOffset; }
    const injectionDotData = injectionDates
      .map((d) => {
        const offset = dateToOffset[d];
        if (offset === undefined || offset < minOffset || offset > maxOffset)
          return null;
        const point = curve.find(p => p.dayOffset === offset);
        return { offset, levelMg: point?.levelMg ?? 0 };
      })
      .filter((item): item is { offset: number; levelMg: number } => item !== null);

    // X-axis labels every labelIntervalDays, always include today
    // Fix 4: "Today" always wins slot collision
    const seenSlots = new Set<number>();
    const xLabels: Array<{ offset: number; label: string; isToday: boolean }> = [];
    for (const p of curve) {
      const isToday = p.dayOffset === todayOffset;
      const slot = Math.round((p.dayOffset - minOffset) / labelIntervalDays);
      if (isToday || (p.dayOffset - minOffset) % labelIntervalDays === 0) {
        if (isToday || !seenSlots.has(slot)) {
          seenSlots.add(slot);
          xLabels.push({
            offset: p.dayOffset,
            label: isToday ? 'Today' : format(parseISO(p.date), 'MMM d'),
            isToday,
          });
        }
      }
    }

    const yTicks = [
      { value: maxLevel, label: maxLevel.toFixed(1) },
      { value: maxLevel / 2, label: (maxLevel / 2).toFixed(1) },
      { value: 0, label: '0' },
    ];

    return { curvePoints, fillPath, baselineY, todayX, todayY, injectionDotData, xLabels, yTicks, toX, toY, minOffset, maxOffset };
  }, [curve, todayOffset, injectionDates, labelIntervalDays, width, height, plotW, plotH]);

  // Fix 3: Gate today line/dot rendering when todayOffset is out of curve range
  // computed is null when curve.length < 2 — early return AFTER all hooks
  const todayInRange = computed != null && todayOffset >= computed.minOffset && todayOffset <= computed.maxOffset;

  if (computed == null)
    return null;

  const { curvePoints, fillPath, baselineY, todayX, todayY, injectionDotData, xLabels, yTicks, toX, toY } = computed;

  return (
    <View style={{ width, height }}>
      {/* Fix 5: Add accessibilityLabel to Svg */}
      <Svg
        width={width}
        height={height}
        accessible={true}
        accessibilityLabel="Medication level chart"
      >
        <Defs>
          <SvgLinearGradient id="pkGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={BRAND} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={BRAND} stopOpacity="0.02" />
          </SvgLinearGradient>
        </Defs>

        {/* X-axis baseline */}
        <Line
          x1={PADDING.left}
          y1={baselineY}
          x2={PADDING.left + plotW}
          y2={baselineY}
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* Y-axis ticks + labels */}
        {yTicks.map(({ value, label }) => {
          const y = computed.toY(value);
          return (
            <React.Fragment key={value}>
              <Line
                x1={PADDING.left - 3}
                y1={y}
                x2={PADDING.left}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={PADDING.left - 5}
                y={y + 3}
                textAnchor="end"
                fontSize={8}
                fill={colors.textSecondary}
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Gradient fill under the concentration curve */}
        <Path d={fillPath} fill="url(#pkGrad)" />

        {/* Concentration curve line */}
        <Polyline
          points={curvePoints}
          fill="none"
          stroke={BRAND}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Today dashed vertical line — only when today is in chart range */}
        {todayInRange && (
          <Line
            x1={todayX}
            y1={PADDING.top}
            x2={todayX}
            y2={baselineY}
            stroke={AMBER}
            strokeWidth={1}
            strokeDasharray="3,3"
            opacity={0.8}
          />
        )}

        {/* Today dot on the curve — only when today is in chart range */}
        {todayInRange && todayY !== null && (
          <Circle cx={todayX} cy={todayY} r={4} fill={AMBER} />
        )}

        {/* Injection event dots on the concentration curve */}
        {injectionDotData.map(({ offset, levelMg }) => (
          <Circle
            key={offset}
            cx={toX(offset)}
            cy={toY(levelMg)}
            r={4}
            fill={BRAND}
          />
        ))}

        {/* X-axis date labels */}
        {xLabels.map(({ offset, label, isToday }) => (
          <SvgText
            key={offset}
            x={toX(offset)}
            y={baselineY + 12}
            textAnchor="middle"
            fontSize={9}
            fill={isToday ? AMBER : colors.textSecondary}
            fontWeight={isToday ? '700' : '400'}
          >
            {label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
