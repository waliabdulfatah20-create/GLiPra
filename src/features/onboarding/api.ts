import type { OnboardingFormData } from '@/features/onboarding/use-onboarding-store';
import { supabase } from '@/lib/supabase';

export async function saveOnboardingProfile(
  userId: string,
  data: OnboardingFormData,
): Promise<{ error: string | null }> {
  const bmi
    = data.weightKg && data.heightCm
      ? Number.parseFloat(
          (data.weightKg / ((data.heightCm / 100) * (data.heightCm / 100))).toFixed(1),
        )
      : null;

  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    medication_id: data.medicationId ?? 'other',
    dose_mg: data.doseMg ?? null,
    administration_route: data.administrationRoute ?? 'injection',
    dose_frequency: data.injectionFrequency ?? null,
    injection_day_of_week: data.injectionDayOfWeek ?? null,
    last_injection_date: data.lastInjectionDate ?? null,
    dose_time_local: data.doseTimeLocal ?? null,
    medication_start_date: data.medicationStartDate ?? null,
    weight_kg: data.weightKg ?? null,
    height_cm: data.heightCm ?? null,
    goal_weight_kg: data.goalWeightKg ?? null,
    bmi,
    has_kidney_disease: data.hasKidneyDisease ?? false,
    is_pregnant: false,
    activity_level: data.activityLevel ?? 'moderate',
    dietary_pattern: null,
    phase: 'weight_loss',
    protein_floor_g: data.proteinFloorG ?? null,
    onboarding_completed: true,
  }, { onConflict: 'user_id' });

  if (error)
    return { error: error.message };
  return { error: null };
}
