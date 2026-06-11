import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/**
 * Magnifier icon for the food database search.
 * 24x24 viewBox, 1.8px stroke, rounded caps, currentColor-friendly via `color`.
 * Matches the nav-icon line-icon convention (never emoji).
 */
export function Search({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={1.8} />
      <Path
        d="M15.8 15.8L20.5 20.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
