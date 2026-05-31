import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Syringe({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Barrel left edge */}
      <Path d="M6 16L16 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Barrel right edge */}
      <Path d="M8 18L18 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Barrel bottom cap */}
      <Path d="M6 16L8 18" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Barrel top cap (needle junction) */}
      <Path d="M16 6L18 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Needle */}
      <Path d="M17 7L21 3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Plunger rod */}
      <Path d="M7 17L5 19" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Plunger T-bar */}
      <Path d="M4 18L6 20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Measurement ticks */}
      <Path d="M9 13L11 15" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M13 9L15 11" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
