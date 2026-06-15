// Supabase writes/reads for the in-app medication / route switch.
// The active medication lives on `profiles`; `medication_changes` (migration 024)
// is the append-only switch audit trail that feeds prescriber-visit prep.

import type { MedicationHistoryRow, ProfilePatch } from './switch';
import { supabase } from '@/lib/supabase';

export type MedicationChangeRecord = {
  id: string;
  changedAt: string;
  fromMedicationId: string | null;
  fromRoute: string | null;
  toMedicationId: string;
  toRoute: string;
};

type MedChangeInsert = {
  user_id: string;
  from_medication_id: string | null;
  from_route: string | null;
  to_medication_id: string;
  to_route: string;
};
type MedChangeRow = MedChangeInsert & { id: string; changed_at: string };

// `medication_changes` is absent from the generated Database type until
// `supabase gen types` is re-run after migration 024's db-push, so we narrow the
// client to a minimal typed surface at this single boundary (no `any`).
type MedChangesClient = {
  from: (table: 'medication_changes') => {
    insert: (row: MedChangeInsert) => PromiseLike<{ error: { message: string } | null }>;
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        order: (
          col: string,
          opts: { ascending: boolean },
        ) => PromiseLike<{ data: MedChangeRow[] | null; error: { message: string } | null }>;
      };
    };
  };
};
const medClient = supabase as unknown as MedChangesClient;

async function updateMedicationProfile(userId: string, patch: ProfilePatch): Promise<void> {
  const { error } = await supabase.from('profiles').update(patch).eq('user_id', userId);
  if (error)
    throw new Error(`updateMedicationProfile failed: ${error.message}`);
}

async function insertMedicationChange(userId: string, row: MedicationHistoryRow): Promise<void> {
  const { error } = await medClient.from('medication_changes').insert({
    user_id: userId,
    from_medication_id: row.from_medication_id,
    from_route: row.from_route,
    to_medication_id: row.to_medication_id,
    to_route: row.to_route,
  });
  if (error)
    throw new Error(`insertMedicationChange failed: ${error.message}`);
}

/** Switch the active medication on the profile AND record the change. */
export async function changeMedication(
  userId: string,
  patch: ProfilePatch,
  historyRow: MedicationHistoryRow,
): Promise<void> {
  await updateMedicationProfile(userId, patch);
  await insertMedicationChange(userId, historyRow);
}

/** Most-recent-first list of the user's medication switches (for visit-prep). */
export async function fetchMedicationChanges(userId: string): Promise<MedicationChangeRecord[]> {
  const { data, error } = await medClient
    .from('medication_changes')
    .select('id, changed_at, from_medication_id, from_route, to_medication_id, to_route')
    .eq('user_id', userId)
    .order('changed_at', { ascending: false });

  if (error || !data)
    return [];

  return data.map(r => ({
    id: r.id,
    changedAt: r.changed_at,
    fromMedicationId: r.from_medication_id,
    fromRoute: r.from_route,
    toMedicationId: r.to_medication_id,
    toRoute: r.to_route,
  }));
}
