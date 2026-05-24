import { create } from 'zustand';

import { createSelectors } from '@/lib/utils';
import type { GLP1MedicationId } from '@/types';

export type OnboardingFormData = {
  // Captured at sign-up — used by reveal.tsx so it never needs to re-fetch the session
  userId?: string;
  // Step 1 — medication
  medicationId?: GLP1MedicationId;
  isCompounded?: boolean;
  doseMg?: number;
  // Step 2 — injection day
  injectionFrequency?: 'daily' | 'weekly' | 'biweekly';
  injectionDayOfWeek?: number; // 0=Sun … 6=Sat
  lastInjectionDate?: string; // ISO date
  // Step 3 — body
  weightKg?: number;
  heightCm?: number;
  // Step 4 — safety
  hasKidneyDisease?: boolean;
  isPregnant?: boolean;
  // Step 5 — dietary
  dietaryPattern?: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'other';
  // Step 6 — goals
  goal?: 'muscle_preservation' | 'weight_management' | 'both';
  // Step 7 — status
  medicationStatus?: 'starting' | 'active' | 'tapering' | 'maintenance' | 'discontinued';
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

const _useOnboardingStore = create<OnboardingState>((set) => ({
  formData: {},

  setFormData: (patch) =>
    set((state) => ({ formData: { ...state.formData, ...patch } })),

  reset: () => set({ formData: {} }),
}));

export const useOnboardingStore = createSelectors(_useOnboardingStore);

// Module-level action for use outside components
export const setOnboardingData = (patch: Partial<OnboardingFormData>) =>
  _useOnboardingStore.getState().setFormData(patch);
