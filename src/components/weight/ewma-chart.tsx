import { parseISO } from 'date-fns';
import * as React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Circle, Line, Polyline, Svg, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/lib/ThemeContext';
import { kgToLbs } from '@/lib/unit-preference';
import type { GlipraTokens } from '@/theme/tokens';

export interface EwmaChartProps {
  logs: Array<{
    weightKg: number;
    ewmaWeightKg: number | null;
    loggedAt: string;
  }>;
  width: number;
  height: number;
  /** ISO date strings for each injection. Rendered as faint dashed vertical lines. */
  injectionDates?: string[];
  /** Display unit for y-axis labels. Defaults to 'kg'. */
  unit?: 'kg' | 'lbs';
}

const PADDING = { top: 16, right: 8, bottom: 28, left: 40 };

/**
 * Simple SVG line chart showing raw weight dots and the EWMA trend line.
 * Built with react-native-svg primitives — no third-party charting library.
 */
export function EwmaChart({ logs, width, height, injectionDates, unit = 'kg' }: EwmaChartProps) {
  const { colors, spacing } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing }),
    [colors, spacing],
  );

  if (logs.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>Log more weights to see your trend</Text>
      </View>
    );
  }

  // ── Compute value range ───────────────────────────────────────────────────
  const allValues: number[] = logs.flatMap((l) =>
    l.ewmaWeightKg != null ? [l.weightKg, l.ewmaWeightKg] : [l.weightKg],
  );
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const pad = (rawMax - rawMin) * 0.05 || 1; // 5% padding; fallback 1 kg if flat
  const minVal = rawMin - pad;
  const maxVal = rawMax + pad;

  // ── Compute time range ────────────────────────────────────────────────────
  const timestamps = logs.map((l) => parseISO(l.loggedAt).getTime());
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const timeRange = maxTime - minTime || 1;

  // ── Plot area dimensions ──────────────────────────────────────────────────
  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  function toX(ts: number): number {
    return PADDING.left + ((ts - minTime) / timeRange) * plotW;
  }
  function toY(val: number): number {
    // SVG y=0 is at the top; higher value → lower y coordinate
    return PADDING.top + ((maxVal - val) / (maxVal - minVal)) * plotH;
  }

  // ── Build EWMA polyline points ────────────────────────────────────────────
  // Keep the array so we can count actual data points for the ≥3 guard.
  const ewmaPointsArr = logs
    .filter((l) => l.ewmaWeightKg != null)
    .map((l) => {
      const ts = parseISO(l.loggedAt).getTime();
      return `${toX(ts)},${toY(l.ewmaWeightKg as number)}`;
    });
  const ewmaPoints = ewmaPointsArr.join(' ');

  // ── Y-axis label values (3 ticks) ─────────────────────────────────────────
  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];

  // ── Y-axis tick formatter — respects unit preference ─────────────────────
  const formatTick = (kg: number): string =>
    unit === 'lbs' ? `${Math.round(kgToLbs(kg))}` : kg.toFixed(1);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* X-axis baseline */}
        <Line
          x1={PADDING.left}
          y1={PADDING.top + plotH}
          x2={PADDING.left + plotW}
          y2={PADDING.top + plotH}
          stroke={colors.border}
          strokeWidth={1}
        />

        {/* Y-axis ticks and labels */}
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <React.Fragment key={i}>
              <Line
                x1={PADDING.left - 4}
                y1={y}
                x2={PADDING.left}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={PADDING.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={9}
                fill={colors.textSecondary}
              >
                {formatTick(tick)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Y-axis unit label */}
        <SvgText
          x={PADDING.left - 6}
          y={PADDING.top - 4}
          textAnchor="end"
          fontSize={8}
          fill={colors.textSecondary}
        >
          {unit === 'lbs' ? 'lbs' : 'kg'}
        </SvgText>

        {/* EWMA trend line — only drawn when ≥3 data points exist.
            With fewer points EWMA_ALPHA=0.1 barely moves from its seed value,
            making the trend line diverge wildly from the raw dots. */}
        {ewmaPointsArr.length >= 3 && (
          <Polyline
            points={ewmaPoints}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Dose marker lines — faint dashed verticals at each injection date */}
        {injectionDates?.map((isoDate) => {
          const ts = parseISO(isoDate).getTime();
          if (ts < minTime || ts > maxTime) return null;
          const x = toX(ts);
          return (
            <Line
              key={isoDate}
              x1={x}
              y1={PADDING.top}
              x2={x}
              y2={PADDING.top + plotH}
              stroke={colors.primary}
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.35}
            />
          );
        })}

        {/* Raw weight dots */}
        {logs.map((log, i) => {
          const ts = parseISO(log.loggedAt).getTime();
          return (
            <Circle
              key={i}
              cx={toX(ts)}
              cy={toY(log.weightKg)}
              r={3}
              fill={colors.textSecondary}
            />
          );
        })}
      </Svg>
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
      backgroundColor: colors.surface,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
  });
}
