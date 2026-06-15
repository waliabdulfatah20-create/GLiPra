import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Crown({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Crown outline: three peaks over a base */}
      <Path
        d="M3 8L6.5 11L12 5L17.5 11L21 8L19.2 18H4.8L3 8Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Jeweled band */}
      <Path d="M5.4 15H18.6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
