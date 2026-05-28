import { supabase } from '@/lib/supabase';
import { CHECKLIST_ITEMS } from './checklist-data';

export interface ShotPrepLog {
  completedItems: string[];
  fullyCompleted: boolean;
}

/** Returns null when no log exists yet for this injection date. */
export async function fetchShotPrepLog(
  userId: string,
  injectionDate: string,
): Promise<ShotPrepLog | null> {
  const { data, error } = await supabase
    .from('shot_prep_logs')
    .select('completed_items, fully_completed')
    .eq('user_id', userId)
    .eq('injection_date', injectionDate)
    .maybeSingle();

  if (error || !data) return null;

  return {
    completedItems: (data.completed_items as string[]) ?? [],
    fullyCompleted: data.fully_completed ?? false,
  };
}

/** Creates or overwrites the shot prep log for the given injection date. */
export async function upsertShotPrepLog(
  userId: string,
  injectionDate: string,
  completedItems: string[],
): Promise<{ error: string | null }> {
  const fullyCompleted = completedItems.length >= CHECKLIST_ITEMS.length;

  const { error } = await supabase.from('shot_prep_logs').upsert(
    {
      user_id: userId,
      injection_date: injectionDate,
      completed_items: completedItems,
      fully_completed: fullyCompleted,
      logged_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,injection_date' },
  );

  return { error: error ? error.message : null };
}
