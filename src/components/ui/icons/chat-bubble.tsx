import type { SvgProps } from 'react-native-svg';
import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export function ChatBubble({ color = '#000', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Speech bubble outline with bottom-left tail */}
      <Path
        d="M6.5 5H17.5A1.5 1.5 0 0 1 19 6.5V14.5A1.5 1.5 0 0 1 17.5 16H10L7 19V16H6.5A1.5 1.5 0 0 1 5 14.5V6.5A1.5 1.5 0 0 1 6.5 5Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Three dots — implies conversation / typing */}
      <Circle cx={9} cy={10.5} r={0.9} fill={color} />
      <Circle cx={12} cy={10.5} r={0.9} fill={color} />
      <Circle cx={15} cy={10.5} r={0.9} fill={color} />
    </Svg>
  );
}
