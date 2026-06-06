import type { GlipraTokens } from '@/theme/tokens';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DisclaimerBanner } from '@/components/ui/disclaimer-banner';
import { computeDoseWindow } from '@/features/oral-dose/dose-window';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/lib/ThemeContext';

export type DoseWindowCardProps = {
  /** ISO timestamp of the most recent logged oral dose, or null. */
  lastDoseTakenAt: string | null;
  /** Current daily-dosing adherence streak (0 hides the pill). */
  currentStreak: number;
  /** Fired when the user taps "Took it". Caller logs the dose. */
  onTake: () => void;
  /** True while the log mutation is in flight. */
  isLogging: boolean;
  /** Id of the most recent dose row (target of the technique confirm). */
  lastDoseId: string | null;
  /** Whether the empty-stomach window was respected; null = unanswered. */
  lastDoseWindowRespected: boolean | null;
  /** Fired when the user answers the post-window confirm. */
  onConfirmWindow: (respected: boolean) => void;
  /** True while the confirm mutation is in flight. */
  isConfirming: boolean;
};

/** Format whole seconds as M:SS (e.g. 1799 → "29:59"). */
function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Return the later of two ISO timestamps (either may be null). */
function pickLatest(a: string | null, b: string | null): string | null {
  if (a === null)
    return b;
  if (b === null)
    return a;
  return a >= b ? a : b;
}

export function DoseWindowCard({
  lastDoseTakenAt,
  currentStreak,
  onTake,
  isLogging,
  lastDoseId,
  lastDoseWindowRespected,
  onConfirmWindow,
  isConfirming,
}: DoseWindowCardProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows } = useTheme();
  const styles = React.useMemo(
    () => makeStyles({ colors, spacing, radius, shadows }),
    [colors, spacing, radius, shadows],
  );

  // Optimistic timestamp so the countdown starts the instant the user taps,
  // before the dose-log refetch round-trips and updates lastDoseTakenAt.
  const [localTakenAt, setLocalTakenAt] = React.useState<string | null>(null);
  const effectiveTakenAt = pickLatest(lastDoseTakenAt, localTakenAt);

  // Optimistic technique answer so the confirm UI resolves instantly on tap,
  // before the update mutation round-trips and sets lastDoseWindowRespected.
  const [localAnswered, setLocalAnswered] = React.useState<boolean | null>(null);

  // Reset the optimistic answer + timestamp whenever a NEW dose arrives, so the
  // technique confirm reappears for every dose, not just the first. The card is
  // mounted persistently on Today; without this reset, day-2+ doses would keep
  // day-1's answer forever (confirm silently suppressed, streak never captured).
  // During-render reset is the React-recommended "adjust state on prop change".
  const prevDoseIdRef = React.useRef(lastDoseId);
  if (lastDoseId !== prevDoseIdRef.current) {
    prevDoseIdRef.current = lastDoseId;
    setLocalAnswered(null);
    setLocalTakenAt(null);
  }

  const handleConfirm = React.useCallback(
    (respected: boolean) => {
      haptics.selection();
      setLocalAnswered(respected);
      onConfirmWindow(respected);
    },
    [onConfirmWindow],
  );

  // Live clock. Tick every second while absorbing (countdown needs it); poll
  // slowly otherwise to catch the day rollover and the just-took transition.
  const [now, setNow] = React.useState(() => new Date().toISOString());
  const window = computeDoseWindow({ lastDoseTakenAt: effectiveTakenAt, now });
  const tickMs = window.state === 'absorbing' ? 1000 : 30000;

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date().toISOString()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  const handleTake = React.useCallback(() => {
    haptics.success();
    setLocalTakenAt(new Date().toISOString());
    onTake();
  }, [onTake]);

  const accent
    = window.state === 'absorbing'
      ? colors.warning
      : window.state === 'clear'
        ? colors.success
        : colors.primary;

  const body
    = window.state === 'absorbing'
      ? t('oral_dose.absorbing_body')
      : window.state === 'clear'
        ? t('oral_dose.clear_body')
        : t('oral_dose.not_taken_body');

  // After the window clears, ask once whether the empty-stomach window was kept.
  // Shows only while unanswered (server null + no optimistic local answer).
  const answered = localAnswered !== null || lastDoseWindowRespected !== null;
  const showConfirm
    = window.state === 'clear' && lastDoseId !== null && !answered;

  const title
    = showConfirm
      ? t('oral_dose.confirm_title')
      : window.state === 'absorbing'
        ? t('oral_dose.absorbing_title')
        : window.state === 'clear'
          ? t('oral_dose.clear_title')
          : t('oral_dose.not_taken_title');

  return (
    <View style={[styles.card, { borderTopColor: accent }]}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={[styles.dot, { backgroundColor: accent }]} />
          <Text style={styles.title}>{title}</Text>
          {currentStreak > 0 && (
            <View style={styles.streakPill}>
              <Text style={styles.streakPillText}>
                🔥
                {' '}
                {t('oral_dose.streak_pill', { count: currentStreak })}
              </Text>
            </View>
          )}
        </View>

        {window.state === 'absorbing' && (
          <Text style={[styles.countdown, { color: accent }]}>
            {formatCountdown(window.secondsRemaining)}
          </Text>
        )}

        <Text style={styles.bodyText}>
          {showConfirm
            ? t('oral_dose.confirm_body')
            : window.state === 'clear' && answered
              ? t('oral_dose.confirm_done')
              : body}
        </Text>

        {showConfirm && (
          <View style={styles.confirmRow}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.confirmButtonYes]}
              onPress={() => handleConfirm(true)}
              disabled={isConfirming}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('oral_dose.confirm_yes')}
            >
              <Text style={[styles.confirmButtonText, { color: colors.success }]}>
                {t('oral_dose.confirm_yes')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.confirmButtonNo]}
              onPress={() => handleConfirm(false)}
              disabled={isConfirming}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('oral_dose.confirm_no')}
            >
              <Text style={[styles.confirmButtonText, { color: colors.warning }]}>
                {t('oral_dose.confirm_no')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {window.state === 'not_taken' && (
          <TouchableOpacity
            style={[styles.takeButton, { backgroundColor: accent }]}
            onPress={handleTake}
            disabled={isLogging}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('oral_dose.a11y_take')}
          >
            {isLogging
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.takeButtonText}>{t('oral_dose.took_it')}</Text>}
          </TouchableOpacity>
        )}
      </View>

      <DisclaimerBanner tier={2}>
        <Text style={styles.disclaimerText}>{t('oral_dose.disclaimer')}</Text>
      </DisclaimerBanner>
    </View>
  );
}

type StyleTokens = {
  colors: GlipraTokens['colors'];
  spacing: GlipraTokens['spacing'];
  radius: GlipraTokens['radius'];
  shadows: GlipraTokens['shadows'];
};

function makeStyles({ colors, spacing, radius, shadows }: StyleTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
      borderTopWidth: 2,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadows.sm,
    },
    body: {
      padding: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      flexShrink: 0,
    },
    title: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      letterSpacing: -0.2,
    },
    streakPill: {
      backgroundColor: colors.warningLight,
      borderRadius: radius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      flexShrink: 0,
    },
    streakPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.warning,
    },
    countdown: {
      fontSize: 40,
      fontWeight: '800',
      letterSpacing: -1,
      marginTop: spacing.sm,
      fontVariant: ['tabular-nums'],
    },
    bodyText: {
      fontSize: 13,
      lineHeight: 19,
      color: colors.textSecondary,
      marginTop: spacing.sm,
    },
    takeButton: {
      marginTop: spacing.md,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    takeButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    confirmRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    confirmButton: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: 1,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
    },
    confirmButtonYes: {
      backgroundColor: colors.successLight,
      borderColor: colors.success,
    },
    confirmButtonNo: {
      backgroundColor: colors.warningLight,
      borderColor: colors.warning,
    },
    confirmButtonText: {
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.1,
      textAlign: 'center',
    },
    disclaimerText: {
      fontSize: 11,
      lineHeight: 15,
      color: colors.textSecondary,
    },
  });
}
