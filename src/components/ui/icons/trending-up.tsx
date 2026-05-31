import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Path, Polyline } from 'react-native-svg';

/**
 * Line-chart icon trending up. Tab icon for the Progress dashboard.
 * Matches the syringe icon style: 1.8px stroke, rounded caps, currentColor-friendly.
 */
export function TrendingUp({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Trending-up line */}
      <Polyline
        points="3,17 9,11 13,15 21,7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrowhead */}
      <Path
        d="M15 7H21V13"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
