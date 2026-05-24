import { supabase } from '@/lib/supabase';
import type { OnboardingFormData } from '@/features/onboarding/use-onboarding-store';

export async function saveOnboardingProfile(
  userId: string,
  data: OnboardingFormData,
): Promise<{ error: string | null }> {
  const bmi =
    data.weightKg && data.heightCm
      ? parseFloat(
          (data.weightKg / ((data.heightCm / 100) * (data.heightCm / 100))).toFixed(1),
        )
      : null;

  const { error } = await supabase.from('profiles').upsert({
    user_id: userId,
    medication_id: data.medicationId ?? 'other',
    dose_mg: data.doseMg ?? null,
    injection_day_of_week: data.injectionDayOfWeek ?? null,
    last_injection_date: data.lastInjectionDate ?? null,
    weight_kg: data.weightKg ?? null,
    height_cm: data.heightCm ?? null,
    bmi,
    has_kidney_disease: data.hasKidneyDisease ?? false,
    is_pregnant: data.isPregnant ?? false,
    activity_level: data.activityLevel ?? 'moderate',
    phase:
      data.medicationStatus === 'maintenance' || data.medicationStatus === 'tapering'
        ? 'maintenance'
        : 'weight_loss',
    protein_floor_g: data.proteinFloorG ?? null,
    onboarding_completed: true,
  }, { onConflict: 'user_id' });

  if (error) return { error: error.message };
  return { error: null };
}
