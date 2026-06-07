import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  ChatBubble as CoachIcon,
  Home as HomeIcon,
  Camera as LogIcon,
  Pill as PillIcon,
  TrendingUp as ProgressIcon,
  Syringe as SyringeIcon,
} from '@/components/ui/icons';
import { useTodayProfile } from '@/features/today/hooks';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

// ─── Tab configuration ────────────────────────────────────────────────────────

// Visible tab names. Slot 2 is the route-aware Dose tab, shown to both routes;
// only its icon switches by administration_route (Syringe injection / Pill oral).
const ALL_VISIBLE_TAB_NAMES = ['index', 'dose', 'log', 'progress', 'coach'] as const;
const ORAL_VISIBLE_TAB_NAMES = ['index', 'dose', 'log', 'progress', 'coach'] as const;

type VisibleTabName = typeof ALL_VISIBLE_TAB_NAMES[number];

type TabConfig = {
  labelKey: string;
  testID: string;
  Icon: React.ComponentType<{ color: string }>;
};

const TAB_CONFIG: Record<VisibleTabName, TabConfig> = {
  index: { labelKey: 'tabs.today', testID: 'today-tab', Icon: HomeIcon },
  progress: { labelKey: 'tabs.progress', testID: 'progress-tab', Icon: ProgressIcon },
  log: { labelKey: 'tabs.nutrition', testID: 'log-tab', Icon: LogIcon },
  // Icon is a fallback; the render overrides it per administration_route.
  dose: { labelKey: 'tabs.dose', testID: 'dose-tab', Icon: SyringeIcon },
  coach: { labelKey: 'tabs.coach', testID: 'coach-tab', Icon: CoachIcon },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function GlipraTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const { t } = useTranslation();
  const { colors, spacing, gradients } = useTheme();
  const { data: profile } = useTodayProfile();
  const isOral = profile?.administrationRoute === 'oral';

  // Oral users do not have injection-sites — hide that tab entirely.
  const visibleTabNames: readonly string[] = isOral ? ORAL_VISIBLE_TAB_NAMES : ALL_VISIBLE_TAB_NAMES;

  const visibleRoutes = state.routes.filter(
    r => visibleTabNames.includes(r.name),
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
        if (!config)
          return null;
        // Route-aware icon for the Dose tab only.
        const IconComp = name === 'dose' ? (isOral ? PillIcon : SyringeIcon) : config.Icon;
        const isFocused
          = state.routes.findIndex(r => r.key === route.key) === state.index;

        const onPress = () => {
          haptics.tap();
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.dispatch({
              ...CommonActions.navigate(route),
              target: state.key,
            });
          }
        };

        const iconColor = isFocused ? colors.textInverse : colors.textSecondary;
        const labelColor = isFocused ? colors.primary : colors.textSecondary;

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={() => {
              haptics.tap();
              navigation.emit({ type: 'tabLongPress', target: route.key });
            }}
            testID={config.testID}
            style={styles.tabItem}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={t(config.labelKey)}
          >
            {isFocused
              ? (
                  <LinearGradient
                    colors={gradients.hero}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.activePill}
                  >
                    <IconComp color={iconColor} />
                  </LinearGradient>
                )
              : (
                  <View style={styles.inactivePill}>
                    <IconComp color={iconColor} />
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
    minWidth: 44,
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
