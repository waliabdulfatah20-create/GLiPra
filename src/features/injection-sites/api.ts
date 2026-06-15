import type { SiteCode } from './constants';

import type { InjectionLog } from './types';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

export type InjectionLogInput = {
  siteCode: SiteCode;
  medicationName: string;
  dosageStrength?: string; // optional — compounded patients may have custom doses
  painLevel: number; // 0–10 (DB also enforces via CHECK constraint)
  notes?: string;
  injectedAt: string; // ISO 8601 — combined date+time picked by user
};

export async function fetchRecentInjectionLogs(
  userId: string,
  limit = 30,
): Promise<InjectionLog[]> {
  const { data, error } = await supabase
    .from('injection_logs')
    .select('id, user_id, injected_at, site_code, medication_name, dosage_strength, pain_level, notes, created_at')
    .eq('user_id', userId)
    .order('injected_at', { ascending: false })
    .limit(limit);

  if (error || !data)
    return [];
  return data as unknown as InjectionLog[];
}

export async function insertInjectionLog(
  userId: string,
  input: InjectionLogInput,
): Promise<InjectionLog | null> {
  const { data, error } = await supabase
    .from('injection_logs')
    .insert({
      user_id: userId,
      injected_at: input.injectedAt,
      site_code: input.siteCode,
      medication_name: input.medicationName,
      dosage_strength: input.dosageStrength ?? null,
      pain_level: input.painLevel,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error || !data)
    return null;

  // Keep profiles.last_injection_date in sync so the injection-phase banner
  // on the Today screen reflects real shots. Update when this shot is more recent
  // than the stored value (so back-filling an older shot can't clobber it) OR when
  // the stored value is in the FUTURE — a future date is never a real injection and
  // poisons the cycle phase math ("Day -1"), so a real shot must heal it.
  const injectedDate = input.injectedAt.slice(0, 10); // YYYY-MM-DD
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  await supabase
    .from('profiles')
    .update({ last_injection_date: injectedDate })
    .eq('user_id', userId)
    .or(`last_injection_date.is.null,last_injection_date.lt.${injectedDate},last_injection_date.gt.${todayIso}`);

  return data as unknown as InjectionLog;
}

/**
 * Update an existing injection log in-place.
 * Re-syncs profiles.last_injection_date using the same "only if newer" guard
 * as insertInjectionLog so the phase banner stays accurate.
 */
export async function updateInjectionLog(
  userId: string,
  logId: string,
  input: InjectionLogInput,
): Promise<InjectionLog | null> {
  const { data, error } = await supabase
    .from('injection_logs')
    .update({
      injected_at: input.injectedAt,
      site_code: input.siteCode,
      medication_name: input.medicationName,
      dosage_strength: input.dosageStrength ?? null,
      pain_level: input.painLevel,
      notes: input.notes ?? null,
    })
    .eq('id', logId)
    .eq('user_id', userId) // belt-and-suspenders RLS guard
    .select()
    .single();

  if (error || !data)
    return null;

  const injectedDate = input.injectedAt.slice(0, 10);
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  await supabase
    .from('profiles')
    .update({ last_injection_date: injectedDate })
    .eq('user_id', userId)
    .or(`last_injection_date.is.null,last_injection_date.lt.${injectedDate},last_injection_date.gt.${todayIso}`);

  return data as unknown as InjectionLog;
}

/** Hard-delete a single injection log row. Returns true on success. */
export async function deleteInjectionLog(
  userId: string,
  logId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from('injection_logs')
    .delete()
    .eq('id', logId)
    .eq('user_id', userId);
  return !error;
}
