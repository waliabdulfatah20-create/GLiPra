import { addDays, format, startOfDay } from 'date-fns';

import { supabase } from '@/lib/supabase';

export type CheckInEntry = {
  nausea: number; // 1-5
  energy: number; // 1-5
  waterMl: number; // 0-3000
  notes?: string;
};

export type CheckInRecord = {
  nausea: number;
  energy: number;
  waterMl: number;
  notes: string | null;
  checkedInAt: string;
};

/**
 * Insert (or re-insert) a check-in for the current user.
 * We do a plain insert — on fetch we take the most recent record for the day.
 */
export async function upsertCheckIn(
  userId: string,
  entry: CheckInEntry,
): Promise<void> {
  const { error } = await supabase.from('daily_checkins').insert({
    user_id: userId,
    nausea: entry.nausea,
    energy: entry.energy,
    water_ml: entry.waterMl,
    notes: entry.notes ?? null,
    red_flag_triggered: false,
    checked_in_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to save check-in: ${error.message}`);
  }
}

/**
 * Fetch today's most-recent check-in for a user.
 * Returns null if the user has not checked in today.
 */
export async function fetchTodayCheckIn(
  userId: string,
  today: string, // 'yyyy-MM-dd'
): Promise<CheckInRecord | null> {
  const dayStart = format(startOfDay(new Date(today)), 'yyyy-MM-dd\'T\'HH:mm:ss');
  const dayEnd = format(startOfDay(addDays(new Date(today), 1)), 'yyyy-MM-dd\'T\'HH:mm:ss');

  const { data, error } = await supabase
    .from('daily_checkins')
    .select('nausea, energy, water_ml, notes, checked_in_at')
    .eq('user_id', userId)
    .gte('checked_in_at', dayStart)
    .lt('checked_in_at', dayEnd)
    .order('checked_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch check-in: ${error.message}`);
  }

  if (!data)
    return null;

  return {
    nausea: data.nausea,
    energy: data.energy,
    waterMl: data.water_ml,
    notes: data.notes ?? null,
    checkedInAt: data.checked_in_at,
  };
}

/**
 * Fetch check-in history for the last N days (default 30).
 * Used by red-flag detection to analyze patterns over time.
 * Returns entries in YYYY-MM-DD format compatible with redFlagDetector.
 */
export type CheckInHistoryEntry = {
  date: string; // 'YYYY-MM-DD'
  nausea: number | null;
  energy: number | null;
  water_ml: number | null;
  notes: string | null;
};

export async function fetchCheckInHistory(
  userId: string,
  days: number = 30,
): Promise<CheckInHistoryEntry[]> {
  const today = new Date();
  const startDate = addDays(today, -days);

  const { data, error } = await supabase
    .from('daily_checkins')
    .select('checked_in_at, nausea, energy, water_ml, notes')
    .eq('user_id', userId)
    .gte('checked_in_at', format(startDate, 'yyyy-MM-dd\'T\'00:00:00'))
    .lte('checked_in_at', format(today, 'yyyy-MM-dd\'T\'23:59:59'))
    .order('checked_in_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch check-in history: ${error.message}`);
  }

  // Transform to red-flag detector format: one entry per day (most recent check-in per day)
  const entriesByDate = new Map<string, CheckInHistoryEntry>();

  for (const record of data || []) {
    const dateStr = format(new Date(record.checked_in_at), 'yyyy-MM-dd');
    if (!entriesByDate.has(dateStr)) {
      entriesByDate.set(dateStr, {
        date: dateStr,
        nausea: record.nausea,
        energy: record.energy,
        water_ml: record.water_ml,
        notes: record.notes,
      });
    }
  }

  return Array.from(entriesByDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Mark today's check-in rows as red_flag_triggered = true.
 * Non-fatal — failure is logged but never rethrows (audit log, not user-facing).
 */
export async function markRedFlagTriggered(
  userId: string,
  date: string, // 'YYYY-MM-DD'
): Promise<void> {
  const localDate = new Date(`${date}T00:00:00`);
  const dayStart = startOfDay(localDate).toISOString();
  const dayEnd = startOfDay(addDays(localDate, 1)).toISOString();

  const { error } = await supabase
    .from('daily_checkins')
    .update({ red_flag_triggered: true })
    .eq('user_id', userId)
    .gte('checked_in_at', dayStart)
    .lt('checked_in_at', dayEnd);

  if (error) {
    console.warn(`markRedFlagTriggered failed: ${error.message}`);
  }
}
