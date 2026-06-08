import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Dumbbell icon for resistance training (muscle preservation).
 * 24x24 viewBox, 1.8px stroke, rounded caps, currentColor-friendly via `color`.
 * Matches the nav-icon line-icon convention (never emoji).
 */
export function Dumbbell({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Left outer plate */}
      <Path d="M3 8L3 16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Left inner plate */}
      <Path d="M6 9.5L6 14.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Bar */}
      <Path d="M6 12L18 12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Right inner plate */}
      <Path d="M18 9.5L18 14.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Right outer plate */}
      <Path d="M21 8L21 16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
