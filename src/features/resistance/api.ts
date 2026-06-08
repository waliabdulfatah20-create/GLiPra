import { supabase } from '@/lib/supabase';

/**
 * Resistance training logging — Supabase queries for the resistance_logs table
 * (migration 020).
 *
 * One row per logged resistance-training session. `sessionType` and `durationMin`
 * are optional so logging stays one tap; they are null when not provided.
 */

export type ResistanceSessionType = 'full_body' | 'upper' | 'lower' | 'other';

export type ResistanceLog = {
  id: string;
  userId: string;
  performedAt: string; // ISO 8601
  sessionType: ResistanceSessionType | null;
  durationMin: number | null;
  notes: string | null;
  createdAt: string;
};

export type ResistanceInput = {
  performedAt: string; // ISO 8601 — defaults to now at call site
  sessionType?: ResistanceSessionType | null;
  durationMin?: number | null;
  notes?: string;
};

export async function fetchRecentResistanceLogs(
  userId: string,
  limit = 90,
): Promise<ResistanceLog[]> {
  const { data, error } = await supabase
    .from('resistance_logs')
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
    sessionType: (row.session_type as ResistanceSessionType | null) ?? null,
    durationMin: row.duration_min ?? null,
    notes: row.notes ?? null,
    createdAt: row.created_at,
  }));
}

export async function logResistanceSession(
  userId: string,
  input: ResistanceInput,
): Promise<ResistanceLog | null> {
  const { data, error } = await supabase
    .from('resistance_logs')
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
    sessionType: (data.session_type as ResistanceSessionType | null) ?? null,
    durationMin: data.duration_min ?? null,
    notes: data.notes ?? null,
    createdAt: data.created_at,
  };
}

/** Hard-delete a single resistance log row. User-scoped by id + user_id (RLS). */
export async function deleteResistanceLog(
  userId: string,
  logId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('resistance_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId);
  return !error;
}
