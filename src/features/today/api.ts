import { supabase } from '@/lib/supabase';

export type MedicationStatus =
  | 'starting'
  | 'active'
  | 'tapering'
  | 'maintenance'
  | 'discontinued';

export type TodayProfile = {
  medicationId: string;
  proteinFloorG: number | null;
  lastInjectionDate: string | null;
  injectionDayOfWeek: number | null;
  weightKg: number | null;
  heightCm: number | null;
  phase: 'weight_loss' | 'maintenance';
  medicationStatus: MedicationStatus;
  hasKidneyDisease: boolean;
  isPregnant: boolean;
};

export async function fetchTodayProfile(userId: string): Promise<TodayProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'medication_id, protein_floor_g, last_injection_date, injection_day_of_week, weight_kg, height_cm, phase, medication_status, has_kidney_disease, is_pregnant',
    )
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    medicationId: data.medication_id,
    proteinFloorG: data.protein_floor_g ?? null,
    lastInjectionDate: data.last_injection_date ?? null,
    injectionDayOfWeek: data.injection_day_of_week ?? null,
    weightKg: data.weight_kg ?? null,
    heightCm: data.height_cm ?? null,
    phase: (data.phase as 'weight_loss' | 'maintenance') ?? 'weight_loss',
    medicationStatus: (data.medication_status as MedicationStatus) ?? 'active',
    hasKidneyDisease: data.has_kidney_disease ?? false,
    isPregnant: data.is_pregnant ?? false,
  };
}
