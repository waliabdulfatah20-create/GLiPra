// Shared MM/DD/YYYY date-input helpers for medication schedule screens
// (onboarding injection-day + the in-app Change-medication editor). Extracted so
// both screens share ONE parser and the same future-date guard — a future
// `last_injection_date` poisons the injection-cycle phase math (a future date
// yields a negative "days since injection" -> "Day -1" and a wrong next-dose).
//
// Pure: no React, no Supabase. date-fns only (Rule 6).

import { isAfter, parseISO } from 'date-fns';

/** Mask raw digits into a partial `MM/DD/YYYY` string as the user types. */
export function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2)
    return digits;
  if (digits.length <= 4)
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/** Parse a complete `MM/DD/YYYY` string to ISO `yyyy-MM-dd`, or null if invalid. */
export function parseMdyToIso(mdy: string): string | null {
  const parts = mdy.split('/');
  if (parts.length !== 3)
    return null;
  const [mm, dd, yyyy] = parts;
  if (!mm || !dd || !yyyy || yyyy.length < 4)
    return null;
  const iso = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime()))
    return null;
  return iso;
}

/**
 * True when `iso` is today or earlier (i.e. NOT a future date). Both args are
 * ISO `yyyy-MM-dd`. Used to reject a future last-injection / start date before
 * it ever reaches the profile.
 */
export function isNotFuture(iso: string, todayIso: string): boolean {
  return !isAfter(parseISO(iso), parseISO(todayIso));
}
