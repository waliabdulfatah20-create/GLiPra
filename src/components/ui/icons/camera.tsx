import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function Camera({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Camera body */}
      <Path
        d="M2 9C2 7.9 2.9 7 4 7H7L8.5 5H15.5L17 7H20C21.1 7 22 7.9 22 9V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V9Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Lens */}
      <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}
