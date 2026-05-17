// Mock responses for all AI features.
// Used when EXPO_PUBLIC_USE_MOCK_AI=true (the development default).
// Pattern: every AI feature checks `isMockAIEnabled()` before calling any edge function.
//
// Usage in any AI-powered feature:
//   if (isMockAIEnabled()) {
//     return MOCK_MEAL_RECOGNITION;
//   }
//   // real supabase.functions.invoke() call here

import Env from 'env';

/**
 * Returns true when the EXPO_PUBLIC_USE_MOCK_AI env var is set to 'true'.
 * This is the gate that prevents real OpenAI API calls during development.
 */
export const isMockAIEnabled = (): boolean =>
  Env.EXPO_PUBLIC_USE_MOCK_AI === 'true';

export const MOCK_MEAL_RECOGNITION = {
  foods: [
    { name: 'Grilled chicken breast', protein_g: 31, calories: 165, serving_g: 100 },
    { name: 'Brown rice', protein_g: 2.6, calories: 112, serving_g: 100 },
    { name: 'Steamed broccoli', protein_g: 2.8, calories: 34, serving_g: 100 },
  ],
  total_protein_g: 36.4,
  total_calories: 311,
  confidence: 0.87,
} as const;

export const MOCK_DAILY_GUIDANCE = {
  message:
    'Today is your adjustment phase — appetite suppression is at its strongest. ' +
    'Focus on hitting your protein floor with high-density sources like eggs, ' +
    'cottage cheese, or Greek yogurt. Aim for 25–30g per meal to preserve muscle.',
  protein_tip: 'Greek yogurt (17g per 150g serving) is easy on nausea days.',
  hydration_reminder: true,
  phase_aware: true,
} as const;

export const MOCK_MEAL_TEXT_PARSE = {
  foods: [
    { name: 'Scrambled eggs', protein_g: 18, calories: 210, serving_description: '3 large eggs' },
    { name: 'Whole milk', protein_g: 8, calories: 150, serving_description: '1 cup' },
  ],
  total_protein_g: 26,
  total_calories: 360,
} as const;

export const MOCK_VOICE_PARSE = {
  transcript: 'I had two eggs and a protein shake for breakfast',
  foods: [
    { name: 'Scrambled eggs', protein_g: 12, calories: 140, serving_description: '2 large eggs' },
    { name: 'Protein shake', protein_g: 25, calories: 130, serving_description: '1 scoop' },
  ],
  total_protein_g: 37,
  total_calories: 270,
} as const;
