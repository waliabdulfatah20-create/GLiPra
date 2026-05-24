import { subDays } from 'date-fns';

import { supabase } from '@/lib/supabase';

export interface WeightLogEntry {
  id: string;
  weightKg: number;
  ewmaWeightKg: number | null;
  loggedAt: string;
  notes: string | null;
}

/**
 * Insert a new weight log entry for the given user.
 * EWMA must be computed by the caller before inserting.
 */
export async function insertWeightLog(
  userId: string,
  entry: {
    weightKg: number;
    ewmaWeightKg: number;
    notes?: string;
  },
): Promise<void> {
  const { error } = await supabase.from('weight_logs').insert({
    user_id: userId,
    weight_kg: entry.weightKg,
    ewma_weight_kg: entry.ewmaWeightKg,
    notes: entry.notes ?? null,
    logged_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to insert weight log: ${error.message}`);
  }
}

/**
 * Fetch weight logs for a user, ordered chronologically.
 * Defaults to the last 90 days.
 */
export async function fetchWeightLogs(
  userId: string,
  days = 90,
): Promise<WeightLogEntry[]> {
  const since = subDays(new Date(), days).toISOString();

  const { data, error } = await supabase
    .from('weight_logs')
    .select('id, weight_kg, ewma_weight_kg, logged_at, notes')
    .eq('user_id', userId)
    .gte('logged_at', since)
    .order('logged_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch weight logs: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    weightKg: row.weight_kg as number,
    ewmaWeightKg: row.ewma_weight_kg as number | null,
    loggedAt: row.logged_at as string,
    notes: row.notes as string | null,
  }));
}
