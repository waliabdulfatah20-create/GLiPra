import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export function ProgressPath({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 17l4-8 4 4 4-6 4 10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={19} cy={17} r={2} fill={color} />
      <Circle cx={3} cy={17} r={1.5} fill={color} />
    </Svg>
  );
}
