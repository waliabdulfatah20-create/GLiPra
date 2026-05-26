import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChatBubble as CoachIcon,
  Home as HomeIcon,
  Camera as LogIcon,
  Syringe as SyringeIcon,
  TrendingUp as ProgressIcon,
} from '@/components/ui/icons';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

// ─── Tab configuration ────────────────────────────────────────────────────────

const VISIBLE_TAB_NAMES = ['index', 'progress', 'log', 'injection-sites', 'coach'] as const;
type VisibleTabName = typeof VISIBLE_TAB_NAMES[number];

interface TabConfig {
  labelKey: string;
  testID: string;
  Icon: React.ComponentType<{ color: string }>;
}

const TAB_CONFIG: Record<VisibleTabName, TabConfig> = {
  index:             { labelKey: 'tabs.today',     testID: 'today-tab',    Icon: HomeIcon },
  progress:          { labelKey: 'tabs.progress',  testID: 'progress-tab', Icon: ProgressIcon },
  log:               { labelKey: 'tabs.nutrition', testID: 'log-tab',      Icon: LogIcon },
  'injection-sites': { labelKey: 'tabs.sites',     testID: 'sites-tab',    Icon: SyringeIcon },
  coach:             { labelKey: 'tabs.coach',     testID: 'coach-tab',    Icon: CoachIcon },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function GlipraTabBar({ state, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { colors, spacing, gradients } = useTheme();
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter(
    (r) => VISIBLE_TAB_NAMES.includes(r.name as VisibleTabName),
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      {visibleRoutes.map((route) => {
        const name = route.name as VisibleTabName;
        const config = TAB_CONFIG[name];
        const isFocused =
          state.routes.findIndex((r) => r.key === route.key) === state.index;

        const onPress = () => {
          haptics.tap();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconColor = isFocused ? colors.textInverse : colors.textSecondary;
        const labelColor = isFocused ? colors.primary : colors.textSecondary;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            testID={config.testID}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={t(config.labelKey)}
          >
            {isFocused ? (
              <LinearGradient
                colors={gradients.hero}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.activePill}
              >
                <config.Icon color={iconColor} />
              </LinearGradient>
            ) : (
              <View style={styles.inactivePill}>
                <config.Icon color={iconColor} />
              </View>
            )}
            <Text
              style={[
                styles.label,
                { color: labelColor, fontWeight: isFocused ? '700' : '500' },
              ]}
              numberOfLines={1}
            >
              {t(config.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Layout-only values live here; colors are applied inline from useTheme().

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  activePill: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactivePill: {
    height: 32,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
});
