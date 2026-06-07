import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

// Capsule / tablet line icon — used for the route-aware Dose tab (oral users).
// Matches the nav-icon convention: 24 viewBox, 1.8px stroke, currentColor, round caps.
export function Pill({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Capsule body — fully rounded ends, on the diagonal */}
      <Rect
        x={3.5}
        y={8.5}
        width={17}
        height={7}
        rx={3.5}
        stroke={color}
        strokeWidth={1.8}
        transform="rotate(-45 12 12)"
      />
      {/* Seam between the two halves */}
      <Path
        d="M9.5 9.5L14.5 14.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
