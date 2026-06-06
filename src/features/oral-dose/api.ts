import { supabase } from '@/lib/supabase';

/**
 * Oral dose logging — Supabase queries for the oral_dose_logs table (migration 018).
 *
 * One row per logged oral GLP-1 dose. `window_respected` records whether the
 * user honored the empty-stomach absorption window; it is null when unknown
 * (Phase 2 logs it as null — the "Took it" tap is the adherence signal).
 */

export type OralDoseLog = {
  id: string;
  userId: string;
  takenAt: string; // ISO 8601
  windowRespected: boolean | null;
  notes: string | null;
  createdAt: string;
};

export type OralDoseInput = {
  takenAt: string; // ISO 8601 — defaults to now at call site
  windowRespected?: boolean | null;
  notes?: string;
};

export async function fetchRecentOralDoseLogs(
  userId: string,
  limit = 90,
): Promise<OralDoseLog[]> {
  const { data, error } = await supabase
    .from('oral_dose_logs')
    .select('id, user_id, taken_at, window_respected, notes, created_at')
    .eq('user_id', userId)
    .order('taken_at', { ascending: false })
    .limit(limit);

  if (error || !data)
    return [];

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    takenAt: row.taken_at,
    windowRespected: row.window_respected ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
  }));
}

export async function logOralDose(
  userId: string,
  input: OralDoseInput,
): Promise<OralDoseLog | null> {
  const { data, error } = await supabase
    .from('oral_dose_logs')
    .insert({
      user_id: userId,
      taken_at: input.takenAt,
      window_respected: input.windowRespected ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error || !data)
    return null;

  return {
    id: data.id,
    userId: data.user_id,
    takenAt: data.taken_at,
    windowRespected: data.window_respected ?? null,
    notes: data.notes ?? null,
    createdAt: data.created_at,
  };
}

/** Hard-delete a single oral dose log row. Returns true on success. */
export async function deleteOralDoseLog(
  userId: string,
  logId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('oral_dose_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId);
  return !error;
}

/**
 * Set whether the empty-stomach window was respected for an already-logged dose.
 * Captured after the absorption window clears (the technique signal). User-scoped
 * by id + user_id (RLS owner-update policy). Returns true on success.
 */
export async function updateOralDoseWindowRespected(
  userId: string,
  logId: string,
  windowRespected: boolean,
): Promise<boolean> {
  const { error } = await supabase
    .from('oral_dose_logs')
    .update({ window_respected: windowRespected })
    .eq('id', logId)
    .eq('user_id', userId);
  return !error;
}
