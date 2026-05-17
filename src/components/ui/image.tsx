/* eslint-disable react-refresh/only-export-components */
import type { ImageProps } from 'expo-image';
import { Image as NImage } from 'expo-image';
import * as React from 'react';

export type ImgProps = ImageProps;

const StyledImage = NImage;

export function Image({
  style,
  placeholder = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  ...props
}: ImgProps) {
  return (
    <StyledImage
      placeholder={placeholder}
      style={style}
      {...props}
    />
  );
}

export function preloadImages(sources: string[]) {
  NImage.prefetch(sources);
}
