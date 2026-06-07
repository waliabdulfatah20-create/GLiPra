import type { ActivityLevel } from '@/utils/protein';
import { supabase } from '@/lib/supabase';

export type MedicationStatus
  = | 'starting'
    | 'active'
    | 'tapering'
    | 'maintenance'
    | 'discontinued';

export type TodayProfile = {
  medicationId: string;
  administrationRoute: 'injection' | 'oral';
  proteinFloorG: number | null;
  lastInjectionDate: string | null;
  injectionDayOfWeek: number | null;
  medicationStartDate: string | null;
  doseTimeLocal: string | null;
  weightKg: number | null;
  heightCm: number | null;
  goalWeightKg: number | null;
  phase: 'weight_loss' | 'maintenance';
  medicationStatus: MedicationStatus;
  hasKidneyDisease: boolean;
  isPregnant: boolean;
  activityLevel: ActivityLevel;
  createdAt: string | null;
};

export async function fetchTodayProfile(userId: string): Promise<TodayProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'medication_id, administration_route, protein_floor_g, last_injection_date, injection_day_of_week, medication_start_date, dose_time_local, weight_kg, height_cm, goal_weight_kg, phase, medication_status, has_kidney_disease, is_pregnant, activity_level, created_at',
    )
    .eq('user_id', userId)
    .single();

  if (error || !data)
    return null;

  return {
    medicationId: data.medication_id,
    administrationRoute: ((data.administration_route as string) === 'oral' ? 'oral' : 'injection'),
    proteinFloorG: data.protein_floor_g ?? null,
    lastInjectionDate: data.last_injection_date ?? null,
    injectionDayOfWeek: data.injection_day_of_week ?? null,
    medicationStartDate: (data as { medication_start_date?: string | null }).medication_start_date ?? null,
    doseTimeLocal: (data as { dose_time_local?: string | null }).dose_time_local ?? null,
    weightKg: data.weight_kg ?? null,
    heightCm: data.height_cm ?? null,
    goalWeightKg: data.goal_weight_kg ?? null,
    phase: (data.phase as 'weight_loss' | 'maintenance') ?? 'weight_loss',
    medicationStatus: (data.medication_status as MedicationStatus) ?? 'active',
    hasKidneyDisease: data.has_kidney_disease ?? false,
    isPregnant: data.is_pregnant ?? false,
    activityLevel: ((data.activity_level as ActivityLevel | null) ?? 'moderate'),
    createdAt: data.created_at ?? null,
  };
}
