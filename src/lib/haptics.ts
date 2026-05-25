/**
 * Haptic feedback utility — wraps expo-haptics with named, semantically
 * meaningful functions. Import this wherever a press, toggle, or action
 * should produce physical feedback.
 *
 * Usage:
 *   import { haptics } from '@/lib/haptics';
 *   onPress={() => { haptics.tap(); doSomething(); }}
 */

import * as Haptics from 'expo-haptics';

export const haptics = {
  /**
   * Light tap — use for most presses: nav rows, cards, chips, tab bar.
   * Feels like a soft click.
   */
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /**
   * Medium tap — use for primary action buttons (Save, Next, Analyze).
   * Slightly more pronounced than a light tap.
   */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /**
   * Selection change — use for toggles, segmented controls, sliders.
   * Crisp tick-like feedback as the user moves through discrete values.
   */
  selection: () => Haptics.selectionAsync(),

  /**
   * Success — use after a confirmed save / positive outcome.
   * A gentle double-pulse signalling completion.
   */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /**
   * Warning — use for validation errors or destructive confirmation prompts.
   */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};
