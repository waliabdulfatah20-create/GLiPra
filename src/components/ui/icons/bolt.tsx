import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Bolt({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
