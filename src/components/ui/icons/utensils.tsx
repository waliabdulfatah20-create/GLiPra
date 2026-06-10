import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Fork + knife icon for the dietary / eating-style preference.
 * 24x24 viewBox, 1.8px stroke, rounded caps, currentColor-friendly via `color`.
 * Matches the nav-icon line-icon convention (never emoji).
 */
export function Utensils({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Fork — left tine */}
      <Path d="M6 3L6 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Fork — right tine */}
      <Path d="M9 3L9 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Fork — collar joining the tines */}
      <Path d="M6 8L9 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Fork — stem */}
      <Path d="M7.5 8L7.5 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Knife — spine */}
      <Path d="M16.5 3L16.5 21" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Knife — blade */}
      <Path
        d="M16.5 3C18.7 4.5 18.7 9.5 16.5 11"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
