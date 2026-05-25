/**
 * Type-safe registry of pharmacist-authored tip keys used by the Progress cards.
 *
 * The actual copy lives in src/translations/{en,es}.json under `progress.tips.*`.
 * This module only exposes the key names so each card requests the right tip
 * with full TypeScript safety and so we can audit which tips are in use.
 *
 * Rule 9: no condition names. Rule 8: tone is educational, not prescriptive —
 * the screen carries a Tier-2 disclaimer for the medical context.
 */

export type PharmacistTipKey =
  | 'weight'
  | 'protein'
  | 'streak'
  | 'injection'
  | 'symptoms';

/** Returns the i18n key for a tip. Use with useTranslation(). */
export function tipI18nKey(key: PharmacistTipKey): string {
  return `progress.tips.${key}`;
}
