import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

export function Home({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Roof / gable line */}
      <Path
        d="M3 12L12 3L21 12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Walls + door */}
      <Path
        d="M5 10V20C5 20.552 5.448 21 6 21H9V16C9 15.448 9.448 15 10 15H14C14.552 15 15 15.448 15 16V21H18C18.552 21 19 20.552 19 20V10"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
