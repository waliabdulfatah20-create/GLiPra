import type { TextProps, TextStyle } from 'react-native';
import type { TxKeyPath } from '@/lib/i18n';
import * as React from 'react';
import { I18nManager, Text as NNText, StyleSheet } from 'react-native';

import { translate } from '@/lib/i18n';

type Props = {
  style?: TextStyle | TextStyle[];
  tx?: TxKeyPath;
} & TextProps;

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
    fontWeight: '400',
  },
});

export function Text({
  style,
  tx,
  children,
  ...props
}: Props) {
  const nStyle = React.useMemo(
    () =>
      StyleSheet.flatten([
        styles.base,
        {
          writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        style,
      ]) as TextStyle,
    [style],
  );
  return (
    <NNText style={nStyle} {...props}>
      {tx ? translate(tx) : children}
    </NNText>
  );
}
