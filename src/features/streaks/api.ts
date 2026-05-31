/**
 * Supabase queries for the streaks table.
 *
 * Table: streaks
 * Columns: id, user_id (UNIQUE), current_streak, longest_streak,
 *          last_streak_date (date), updated_at
 */

import { supabase } from '@/lib/supabase';

export type StreakRow = {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
};

/**
 * Fetch the current user's streak row.
 * Returns null if the row does not exist yet (new user, no logs).
 */
export async function fetchStreak(userId: string): Promise<StreakRow | null> {
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_streak_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`fetchStreak: ${error.message}`);
  }

  if (!data)
    return null;

  return {
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    lastStreakDate: data.last_streak_date ?? null,
  };
}

/**
 * Upsert the streak row for the given user.
 * Inserts if no row exists; updates in place if one does (conflict on user_id).
 */
export async function upsertStreak(
  userId: string,
  streak: StreakRow,
): Promise<void> {
  const { error } = await supabase.from('streaks').upsert(
    {
      user_id: userId,
      current_streak: streak.currentStreak,
      longest_streak: streak.longestStreak,
      last_streak_date: streak.lastStreakDate,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    throw new Error(`upsertStreak: ${error.message}`);
  }
}
