import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { PressableProps } from 'react-native';
import type { SvgProps } from 'react-native-svg';
import {
  BottomSheetFlatList,

} from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import * as React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';
import { useTheme } from '@/lib/ThemeContext';

import { CaretDown } from '@/components/ui/icons';
import { Modal, useModal } from './modal';
import { Text } from './text';

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    marginTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.neutral[300],
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.neutral[100],
  },
  inputFocused: {
    borderColor: colors.neutral[600],
  },
  inputError: {
    borderColor: colors.danger[600],
  },
  inputDisabled: {
    backgroundColor: colors.neutral[200],
  },
  inputValue: {
    flex: 1,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger[600],
  },
});

const List = Platform.OS === 'web' ? FlashList : BottomSheetFlatList;

export type OptionType = {
  label: string;
  value: string | number;
  /** When true, renders as a non-pressable section header inside the dropdown. */
  disabled?: boolean;
};

type OptionsProps = {
  options: OptionType[];
  onSelect: (option: OptionType) => void;
  value?: string | number;
  testID?: string;
};

function keyExtractor(item: OptionType) {
  return `select-item-${item.value}`;
}

export function Options({ ref, options, onSelect, value, testID }: OptionsProps & { ref?: React.RefObject<BottomSheetModal | null> }) {
  // Headers count as shorter rows (~36px); selectable rows are ~70px each.
  const height = options.reduce((sum, o) => sum + (o.disabled ? 36 : 70), 0) + 100;
  const snapPoints = React.useMemo(() => [height], [height]);
  const { colors: themeColors } = useTheme();

  const renderSelectItem = React.useCallback(
    ({ item }: { item: OptionType }) => {
      if (item.disabled) {
        // Non-selectable section header
        return (
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 8,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: themeColors.border,
          }}>
            <Text style={{
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              color: themeColors.primary,
              textTransform: 'uppercase',
            }}>{item.label}</Text>
          </View>
        );
      }
      return (
        <Option
          key={`select-item-${item.value}`}
          label={item.label}
          selected={value === item.value}
          onPress={() => onSelect(item)}
          testID={testID ? `${testID}-item-${item.value}` : undefined}
        />
      );
    },
    [onSelect, value, testID, themeColors],
  );

  return (
    <Modal
      ref={ref}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{
        backgroundColor: colors.white,
      }}
    >
      <List
        data={options}
        keyExtractor={keyExtractor}
        renderItem={renderSelectItem}
        testID={testID ? `${testID}-modal` : undefined}
        estimatedItemSize={52}
      />
    </Modal>
  );
}

const Option = React.memo(
  ({
    label,
    selected = false,
    ...props
  }: PressableProps & {
    selected?: boolean;
    label: string;
  }) => {
    const { colors: themeColors } = useTheme();
    return (
      <Pressable
        style={({ pressed }) => [
          {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            justifyContent: 'space-between' as const,
            paddingHorizontal: 20,
            paddingVertical: 18,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: themeColors.border,
          },
          pressed && { backgroundColor: themeColors.primaryLight },
        ]}
        {...props}
      >
        <Text style={[
          { fontSize: 16, color: themeColors.textPrimary },
          selected && { fontWeight: '600', color: themeColors.primary },
        ]}>
          {label}
        </Text>
        {selected && <Check stroke={themeColors.primary} />}
      </Pressable>
    );
  },
);

export type SelectProps = {
  value?: string | number;
  label?: string;
  disabled?: boolean;
  error?: string;
  options?: OptionType[];
  onSelect?: (value: string | number) => void;
  placeholder?: string;
  testID?: string;
};

export function Select(props: SelectProps) {
  const {
    label,
    value,
    error,
    options = [],
    placeholder = 'select...',
    disabled = false,
    onSelect,
    testID,
  } = props;
  const modal = useModal();

  const onSelectOption = React.useCallback(
    (option: OptionType) => {
      onSelect?.(option.value);
      modal.dismiss();
    },
    [modal, onSelect],
  );

  const textValue = React.useMemo(
    () =>
      value !== undefined
        // Exclude disabled/header items from label resolution so they never
        // show as the selected value in the trigger button.
        ? (options?.filter(t => !t.disabled && t.value === value)?.[0]?.label ?? placeholder)
        : placeholder,
    [value, options, placeholder],
  );

  const inputStyle = [
    styles.input,
    error && styles.inputError,
    disabled && styles.inputDisabled,
  ];

  return (
    <>
      <View style={styles.container}>
        {label && (
          <Text
            testID={testID ? `${testID}-label` : undefined}
            style={styles.label}
          >
            {label}
          </Text>
        )}
        <Pressable
          disabled={disabled}
          onPress={modal.present}
          testID={testID ? `${testID}-trigger` : undefined}
          style={inputStyle}
        >
          <View style={styles.inputValue}>
            <Text>{textValue}</Text>
          </View>
          <CaretDown />
        </Pressable>
        {error && (
          <Text
            testID={`${testID}-error`}
            style={styles.errorText}
          >
            {error}
          </Text>
        )}
      </View>
      <Options
        testID={testID}
        ref={modal.ref}
        options={options}
        onSelect={onSelectOption}
      />
    </>
  );
}

function Check({ ...props }: SvgProps) {
  return (
    <Svg
      width={25}
      height={24}
      fill="none"
      viewBox="0 0 25 24"
      {...props}
    >
      <Path
        d="m20.256 6.75-10.5 10.5L4.506 12"
        strokeWidth={2.438}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
