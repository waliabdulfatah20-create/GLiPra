// Domain shape for injection_logs rows.
//
// We declare this locally instead of importing from `@/types/database` because:
//   1. The injection_logs table only got its first migration in 013, so the
//      generated `database.ts` won't contain it until `supabase gen types`
//      is re-run after applying migration 013.
//   2. Co-locating the feature's data shape with the feature code keeps the
//      module self-contained and easier to read.
//
// Once the migration is applied and types regenerated, this file can be
// replaced with:
//   export type InjectionLog = Tables<'injection_logs'>;
// (from `@/types/database`) — the shape will match.

import type { SiteCode } from '@/types';

export type InjectionLog = {
  id: string;
  user_id: string;
  injected_at: string; // ISO 8601 timestamp (UTC)
  site_code: SiteCode;
  medication_name: string;
  dosage_strength: string | null;
  pain_level: number; // 0–10
  notes: string | null;
  created_at: string;
};
