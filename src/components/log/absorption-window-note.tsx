// AbsorptionWindowNote
//
// Slim amber banner shown on the Nutrition Log screen whenever an oral GLP-1
// user is inside the 30-minute empty-stomach absorption window after taking
// their dose. Never blocks logging — it is a gentle, non-blocking note.
//
// Self-contained: reads its own hooks so it can be dropped in any screen.
// React Query deduplicates the queries — no extra network requests.
//
// Rule 8: the Nutrition Log screen already carries a screen-level Tier 2
// DisclaimerBanner, so no additional disclaimer is needed here.

import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { computeDoseWindow } from '@/features/oral-dose/dose-window';
import { useOralDoseLogs } from '@/features/oral-dose/hooks';
import { useTodayProfile } from '@/features/today/hooks';
import { useTheme } from '@/lib/ThemeContext';

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
};

function makeStyles({ colors, spacing, radius }: StyleTokens) {
  return StyleSheet.create({
    banner: {
      borderRadius: radius.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      backgroundColor: colors.warningLight,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      paddingLeft: spacing.md,
      paddingRight: spacing.sm,
      marginBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: 'transparent', // overridden inline
      flexShrink: 0,
    },
    title: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: colors.warning,
      letterSpacing: -0.1,
    },
    dismiss: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      marginLeft: spacing.xs,
      flexShrink: 0,
    },
    dismissText: {
      fontSize: 16,
      lineHeight: 18,
      color: colors.warning,
      fontWeight: '600',
    },
    body: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
      marginTop: 3,
    },
  });
}

/**
 * Render a slim amber note on the food-log screen while the oral GLP-1
 * absorption window is active. Returns null for injection users or when
 * the window is not absorbing. Dismissible for the current app session.
 */
export function AbsorptionWindowNote() {
  const { t } = useTranslation();
  const { data: profile } = useTodayProfile();
  const { logs } = useOralDoseLogs();
  const { colors, spacing, radius } = useTheme();

  const [dismissed, setDismissed] = React.useState(false);
  // 30 s ticker — per-minute resolution is plenty for the log screen.
  const [now, setNow] = React.useState(() => new Date().toISOString());

  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius }),
    [colors, spacing, radius],
  );

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date().toISOString()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Early-exit conditions (after all hooks have been called).
  if (profile?.administrationRoute !== 'oral')
    return null;
  if (dismissed)
    return null;

  const lastDoseTakenAt = logs.length > 0 ? (logs[0]?.takenAt ?? null) : null;
  const doseWindow = computeDoseWindow({ lastDoseTakenAt, now });

  if (doseWindow.state !== 'absorbing')
    return null;

  return (
    <View
      style={styles.banner}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
        <Text style={styles.title}>{t('absorption_note.title')}</Text>
        <Pressable
          style={styles.dismiss}
          onPress={() => setDismissed(true)}
          accessibilityRole="button"
          accessibilityLabel={t('absorption_note.dismiss_a11y')}
          hitSlop={8}
        >
          <Text style={styles.dismissText}>{'×'}</Text>
        </Pressable>
      </View>
      <Text style={styles.body}>
        {t('absorption_note.body', { minutes: doseWindow.minutesRemaining })}
      </Text>
    </View>
  );
}
