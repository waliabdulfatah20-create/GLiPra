/**
 * SeverityHeatStrip — calendar-style severity grid for a 1..max metric.
 *
 * Each value renders as a small rounded square coloured from the matching
 * 5-step token ramp (warningScale for nausea, successScale for energy, etc).
 * Null values render in the warm neutral border colour to mean "no data".
 *
 * Designed for the Progress screen's symptom card (replaces a sparse polyline
 * that was unreadable when users skipped check-ins) but reusable for water,
 * protein, or any 1..N-scored daily metric.
 *
 * v1 has no per-cell tooltip; that's a v2 enhancement.
 */

import type { GlipraSeverityScales, GlipraTokens } from '@/theme/tokens';
import * as React from 'react';

import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

export type SeverityHeatStripPalette = 'warningScale' | 'successScale';

export type SeverityHeatStripProps = {
  /** Daily values. null = no data (rendered as the neutral "no check-in" cell). */
  values: (number | null)[];
  /** Top of the scale (e.g. 5 for nausea/energy 1..5). */
  max: number;
  /** Which token ramp to colour cells with. */
  palette: SeverityHeatStripPalette;
  /** Number of cells per row. Default 15 → 2 rows for a 30-day window. */
  cellsPerRow?: number;
  /** Accessibility label for the whole strip. */
  accessibilityLabel?: string;
};

const DEFAULT_CELLS_PER_ROW = 15;
const CELL_GAP = 4;
const CELL_RADIUS = 3;

function pickShade(
  value: number | null,
  max: number,
  ramp: GlipraSeverityScales[SeverityHeatStripPalette],
  emptyColor: string,
): string {
  if (value == null)
    return emptyColor;
  // Map 1..max to ramp indices 0..(ramp.length - 1). Clamp out-of-range.
  const ramped = Math.round(((value - 1) / (max - 1)) * (ramp.length - 1));
  return ramp[Math.min(ramp.length - 1, Math.max(0, ramped))];
}

function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size)
    rows.push(items.slice(i, i + size));
  return rows;
}

export function SeverityHeatStrip({
  values,
  max,
  palette,
  cellsPerRow = DEFAULT_CELLS_PER_ROW,
  accessibilityLabel,
}: SeverityHeatStripProps) {
  const { colors, scales } = useTheme();
  const ramp = scales[palette];
  const emptyColor = colors.border;

  const styles = React.useMemo(() => makeStyles(), []);

  // Split into fixed-width rows. Each row uses flex:1 cells so widths align
  // even when the final row is short (the trailing cells just leave their
  // flex space empty rather than stretching).
  const rows = React.useMemo(
    () => chunk(values, cellsPerRow),
    [values, cellsPerRow],
  );

  return (
    <View
      style={styles.grid}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {rows.map((row, rowIdx) => (
        // eslint-disable-next-line react/no-array-index-key
        <View key={rowIdx} style={styles.row}>
          {row.map((v, i) => (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              style={[
                styles.cell,
                { backgroundColor: pickShade(v, max, ramp, emptyColor) },
              ]}
            />
          ))}
          {/* Pad short final row with invisible placeholders so cells in the
              last row don't stretch wider than rows above. */}
          {row.length < cellsPerRow
          && Array.from({ length: cellsPerRow - row.length }).map((_, i) => (
            <View
              // eslint-disable-next-line react/no-array-index-key
              key={`pad-${i}`}
              style={styles.cellPad}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function makeStyles() {
  return StyleSheet.create({
    grid: {
      flexDirection: 'column',
      gap: CELL_GAP,
    },
    row: {
      flexDirection: 'row',
      gap: CELL_GAP,
    },
    cell: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: CELL_RADIUS,
    },
    cellPad: {
      flex: 1,
      aspectRatio: 1,
    },
  });
}
