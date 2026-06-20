import { supabase } from '@/lib/supabase';

/**
 * Cardio logging — Supabase queries for the cardio_logs table (migration 029).
 *
 * Cardio is a SECONDARY tracker (muscle stays #1). One row per logged session;
 * `sessionType` and `durationMin` are optional so logging stays one tap. Mirrors
 * the resistance api, but cardio never feeds the Muscle Preservation Score.
 */

export type CardioSessionType = 'walk' | 'run' | 'cycle' | 'other';

export type CardioLog = {
  id: string;
  userId: string;
  performedAt: string; // ISO 8601
  sessionType: CardioSessionType | null;
  durationMin: number | null;
  notes: string | null;
  createdAt: string;
};

export type CardioInput = {
  performedAt: string; // ISO 8601 — defaults to now at call site
  sessionType?: CardioSessionType | null;
  durationMin?: number | null;
  notes?: string;
};

export async function fetchRecentCardioLogs(
  userId: string,
  limit = 90,
): Promise<CardioLog[]> {
  const { data, error } = await supabase
    .from('cardio_logs')
    .select('id, user_id, performed_at, session_type, duration_min, notes, created_at')
    .eq('user_id', userId)
    .order('performed_at', { ascending: false })
    .limit(limit);

  if (error || !data)
    return [];

  return data.map(row => ({
    id: row.id,
    userId: row.user_id,
    performedAt: row.performed_at,
    sessionType: (row.session_type as CardioSessionType | null) ?? null,
    durationMin: row.duration_min ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
  }));
}

export async function logCardioSession(
  userId: string,
  input: CardioInput,
): Promise<CardioLog | null> {
  const { data, error } = await supabase
    .from('cardio_logs')
    .insert({
      user_id: userId,
      performed_at: input.performedAt,
      session_type: input.sessionType ?? null,
      duration_min: input.durationMin ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error || !data)
    return null;

  return {
    id: data.id,
    userId: data.user_id,
    performedAt: data.performed_at,
    sessionType: (data.session_type as CardioSessionType | null) ?? null,
    durationMin: data.duration_min ?? null,
    notes: data.notes ?? null,
    createdAt: data.created_at,
  };
}

/** Hard-delete a single cardio log row. User-scoped by id + user_id (RLS). */
export async function deleteCardioLog(
  userId: string,
  logId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('cardio_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId);
  return !error;
}
