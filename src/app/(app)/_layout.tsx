import { Redirect, SplashScreen, Tabs } from 'expo-router';
import * as React from 'react';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ChatBubble as CoachIcon,
  Home as HomeIcon,
  PlusCircle as LogIcon,
  Settings as SettingsIcon,
  Syringe as SyringeIcon,
} from '@/components/ui/icons';
import { useAuthStore as useAuth } from '@/features/auth/use-auth-store';
import { useIsFirstTime } from '@/lib/hooks/use-is-first-time';
import { colors } from '@/theme/colors';

export default function TabLayout() {
  const { t } = useTranslation();
  const status = useAuth.use.status();
  const [isFirstTime] = useIsFirstTime();
  const hideSplash = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);
  useEffect(() => {
    if (status !== 'idle') {
      const timer = setTimeout(() => {
        hideSplash();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hideSplash, status]);

  // undefined = still reading from AsyncStorage — hold until resolved so we
  // don't redirect to onboarding on the frame before the value loads.
  if (isFirstTime === undefined) {
    return null;
  }
  if (isFirstTime) {
    return <Redirect href="/onboarding/language" />;
  }
  if (status === 'signOut') {
    return <Redirect href="/login" />;
  }
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.today'),
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
          headerShown: false,
          tabBarButtonTestID: 'today-tab',
        }}
      />

      <Tabs.Screen
        name="log"
        options={{
          title: t('tabs.nutrition'),
          headerShown: false,
          tabBarIcon: ({ color }) => <LogIcon color={color} />,
          tabBarButtonTestID: 'log-tab',
        }}
      />

      <Tabs.Screen
        name="injection-sites"
        options={{
          title: t('tabs.sites'),
          headerShown: false,
          tabBarIcon: ({ color }) => <SyringeIcon color={color} />,
          tabBarButtonTestID: 'sites-tab',
        }}
      />

      <Tabs.Screen
        name="coach"
        options={{
          title: t('tabs.coach'),
          headerShown: false,
          tabBarIcon: ({ color }) => <CoachIcon color={color} />,
          tabBarButtonTestID: 'coach-tab',
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          headerShown: false,
          tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          tabBarButtonTestID: 'settings-tab',
        }}
      />

      {/* Style tab removed — was an Obytes template placeholder, not a real screen */}
      <Tabs.Screen
        name="style"
        options={{ headerShown: false, tabBarButton: () => null }}
      />
      {/* Hidden modal screen — not visible in tab bar */}
      <Tabs.Screen
        name="check-in"
        options={{ href: null, headerShown: false }}
      />
      {/* Weight tracking screen — accessible from Settings, not a visible tab */}
      <Tabs.Screen
        name="weight"
        options={{ href: null, headerShown: false }}
      />
      {/* Medication Level — accessible from Settings, not a visible tab */}
      <Tabs.Screen
        name="medication-level"
        options={{ href: null, headerShown: false }}
      />
      {/* Visit Prep — accessible from Settings, not a visible tab. Pro feature. */}
      <Tabs.Screen
        name="visit-prep"
        options={{ href: null, headerShown: false }}
      />
      {/* Shot Day Prep — accessible from Today screen on injection day, not a visible tab */}
      <Tabs.Screen
        name="shot-prep"
        options={{ href: null, headerShown: false }}
      />
      {/* Journey Cards — accessible from Today screen, not a visible tab */}
      <Tabs.Screen
        name="journey"
        options={{ href: null, headerShown: false }}
      />
      {/* Health Import — accessible from Settings, not a visible tab */}
      <Tabs.Screen
        name="health-import"
        options={{ href: null, headerShown: false }}
      />
      {/* Maintenance Mode — accessible from Settings, not a visible tab */}
      <Tabs.Screen
        name="maintenance-mode"
        options={{ href: null, headerShown: false }}
      />
      {/* Life After GLP-1 (discontinuation) — accessible from Settings and Today screen banner */}
      <Tabs.Screen
        name="discontinuation-mode"
        options={{ href: null, headerShown: false }}
      />
      {/* Add Shot form — opens as modal from Injection Sites tab */}
      <Tabs.Screen
        name="add-shot"
        options={{ href: null, headerShown: false }}
      />
      {/* Edit Shot form — opens when tapping a row in Recent Shots list */}
      <Tabs.Screen
        name="edit-shot"
        options={{ href: null, headerShown: false }}
      />
      {/* Paywall — full-screen, opened programmatically; never shown in tab bar */}
      <Tabs.Screen
        name="paywall"
        options={{ href: null, headerShown: false }}
      />
    </Tabs>
  );
}
