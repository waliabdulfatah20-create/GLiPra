// OnboardingScaffold — shared screen skeleton for every onboarding step.
//
// Fixes the bug where each screen painted the WHOLE SafeAreaView with
// gradients.hero[0] (purple bleed). Here the body sits on colors.background
// (light or neutral-dark), and the gradient is a FIXED header band only —
// pinned under the status bar so the light status-bar text always sits on the
// gradient, never on the scrolling light body. Theme-aware via useTheme.

import type { GlipraTokens } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/ThemeContext';
import { StepProgress } from './step-progress';

type OnboardingScaffoldProps = {
  title: string;
  subtitle?: string;
  /** Renders a StepProgress bar in the hero when provided. */
  step?: { current: number; total: number };
  /** Body content (scrolls). */
  children: React.ReactNode;
  /** Fixed footer (typically <StepFooter />). */
  footer: React.ReactNode;
};

export function OnboardingScaffold({ title, subtitle, step, children, footer }: OnboardingScaffoldProps) {
  const { colors, spacing, gradients } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => makeStyles({ colors, spacing }), [colors, spacing]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Fixed gradient hero header — bleeds under the status bar */}
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
      >
        {step && (
          <View style={styles.progressWrap}>
            <StepProgress current={step.current} total={step.total} onDark />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </LinearGradient>

      {/* Scrolling body on the real background */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* Fixed footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        {footer}
      </View>
    </View>
  );
}

type StyleTokens = { colors: GlipraTokens['colors']; spacing: GlipraTokens['spacing'] };

function makeStyles({ colors, spacing }: StyleTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    progressWrap: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: '#ffffff',
      letterSpacing: -0.5,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: '400',
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 22,
    },
    body: {
      flex: 1,
    },
    bodyContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
}
