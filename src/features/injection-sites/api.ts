import { supabase } from '@/lib/supabase';

import type { SiteCode } from './constants';
import type { InjectionLog } from './types';

export interface InjectionLogInput {
  siteCode: SiteCode;
  medicationName: string;
  dosageStrength?: string;      // optional — compounded patients may have custom doses
  painLevel: number;            // 0–10 (DB also enforces via CHECK constraint)
  notes?: string;
  injectedAt: string;           // ISO 8601 — combined date+time picked by user
}

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

  if (error || !data) return [];
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

  if (error || !data) return null;
  return data as unknown as InjectionLog;
}
