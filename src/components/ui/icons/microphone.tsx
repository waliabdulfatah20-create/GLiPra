import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Line, Path } from 'react-native-svg';

export function Microphone({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Capsule */}
      <Path
        d="M12 3C10.34 3 9 4.34 9 6V11C9 12.66 10.34 14 12 14C13.66 14 15 12.66 15 11V6C15 4.34 13.66 3 12 3Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cradle arc */}
      <Path
        d="M5 11C5 14.87 8.13 18 12 18C15.87 18 19 14.87 19 11"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Stem */}
      <Line x1={12} y1={18} x2={12} y2={21} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      {/* Base */}
      <Line x1={8} y1={21} x2={16} y2={21} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
