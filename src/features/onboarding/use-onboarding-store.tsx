import type { AdministrationRoute, GLP1MedicationId } from '@/types';

import { create } from 'zustand';
import { createSelectors } from '@/lib/utils';

export type OnboardingFormData = {
  // Captured at sign-up — used by reveal.tsx so it never needs to re-fetch the session
  userId?: string;
  // Step 1 — medication
  medicationId?: GLP1MedicationId;
  administrationRoute?: AdministrationRoute; // injection vs oral; drives Step 2 fork
  isCompounded?: boolean;
  doseMg?: number;
  // Step 2 — injection day (injectable) / dose schedule (oral)
  injectionFrequency?: 'daily' | 'weekly' | 'biweekly';
  injectionDayOfWeek?: number; // 0=Sun … 6=Sat
  lastInjectionDate?: string; // ISO date
  doseTimeLocal?: string; // oral: preferred daily dose time "HH:mm" 24h local
  medicationStartDate?: string; // oral: ISO date the user started this medication
  // Step 3 — body
  weightKg?: number;
  heightCm?: number;
  goalWeightKg?: number;
  // Step 4 — safety
  hasKidneyDisease?: boolean;
  // Status
  medicationStatus?: 'starting' | 'active';
  activityLevel?: 'sedentary' | 'moderate' | 'active';
  // Step 8 — protein floor (calculated, not user-entered)
  proteinFloorG?: number;
  proteinFloorAcknowledged?: boolean;
};

type OnboardingState = {
  formData: OnboardingFormData;
  setFormData: (patch: Partial<OnboardingFormData>) => void;
  reset: () => void;
};

const _useOnboardingStore = create<OnboardingState>(set => ({
  formData: {},

  setFormData: patch =>
    set(state => ({ formData: { ...state.formData, ...patch } })),

  reset: () => set({ formData: {} }),
}));

export const useOnboardingStore = createSelectors(_useOnboardingStore);

// Module-level action for use outside components
export function setOnboardingData(patch: Partial<OnboardingFormData>) {
  return _useOnboardingStore.getState().setFormData(patch);
}
