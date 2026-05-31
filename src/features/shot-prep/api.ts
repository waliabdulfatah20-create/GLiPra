import { formatISO } from 'date-fns';

import { supabase } from '@/lib/supabase';
import { getChecklistStatus } from './checklist-data';

export type ShotPrepLog = {
  completedItems: string[];
  fullyCompleted: boolean;
};

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

  if (error)
    throw new Error(error.message); // real failure — propagate
  if (!data)
    return null; // no row yet — valid first-use

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
): Promise<void> {
  const { isDone: fullyCompleted } = getChecklistStatus(completedItems);

  const { error } = await supabase.from('shot_prep_logs').upsert(
    {
      user_id: userId,
      injection_date: injectionDate,
      completed_items: completedItems,
      fully_completed: fullyCompleted,
      logged_at: formatISO(new Date()),
    },
    { onConflict: 'user_id,injection_date' },
  );

  if (error)
    throw new Error(error.message);
}
