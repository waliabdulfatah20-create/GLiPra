import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

export function ClipboardCheck({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x={8} y={2} width={8} height={4} rx={1} stroke={color} strokeWidth={1.8} />
      <Path
        d="M8 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M9 12.5l2 2 4-3.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
