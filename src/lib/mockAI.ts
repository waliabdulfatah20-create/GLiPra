// Mock responses for all AI features.
// Used when EXPO_PUBLIC_USE_MOCK_AI=true (the development default).
// Pattern: every AI feature checks `isMockAIEnabled()` before calling any edge function.
//
// Usage in any AI-powered feature:
//   if (isMockAIEnabled()) {
//     return MOCK_MEAL_RECOGNITION;
//   }
//   // real supabase.functions.invoke() call here

import type { RecognitionResult } from '@/features/food-log/photo-recognition';
import Env from 'env';

/**
 * Returns true when the EXPO_PUBLIC_USE_MOCK_AI env var is set to 'true'.
 * This is the gate that prevents real OpenAI API calls during development.
 */
export function isMockAIEnabled(): boolean {
  return Env.EXPO_PUBLIC_USE_MOCK_AI === 'true';
}

export const MOCK_MEAL_RECOGNITION = {
  foods: [
    { name: 'Grilled chicken breast', protein_g: 31, carbs_g: 0, fat_g: 3.6, calories: 165, serving_g: 100 },
    { name: 'Brown rice', protein_g: 2.6, carbs_g: 23, fat_g: 0.9, calories: 112, serving_g: 100 },
    { name: 'Steamed broccoli', protein_g: 2.8, carbs_g: 7, fat_g: 0.4, calories: 34, serving_g: 100 },
  ],
  total_protein_g: 36.4,
  total_carbs_g: 30,
  total_fat_g: 4.9,
  total_fiber_g: 5.2,
  total_calories: 311,
  // GLP-1 watch nutrients (estimated by AI)
  b12_mcg: 0.3,
  vitamin_d_iu: 4,
  magnesium_mg: 58,
  zinc_mg: 1.1,
  confidence: 0.87,
  /** Numeric percent equivalent — same value as `confidence * 100`, kept
   *  explicit so the adapter doesn't have to know the 0-1 → 0-100 conversion. */
  confidence_percent: 87,
} as const;

export const MOCK_DAILY_GUIDANCE = {
  guidance_text:
    'Today is your adjustment phase. Appetite suppression is near its peak right now. '
    + 'Focus on high-density protein you can eat in small amounts: Greek yogurt, cottage cheese, or eggs. '
    + 'Aim for 25-30g per sitting to protect muscle while appetite is low.',
  reasoning_text:
    'Adjustment phase suppresses appetite most strongly at days 3-4, making small high-density portions the best strategy.',
} as const;

export const MOCK_COACH_REPLY
  = 'Great question. To hit your protein goal on a small appetite, lean on high-density '
    + 'options: Greek yogurt, cottage cheese, eggs, or a whey shake. Aim for 25-30g per '
    + 'sitting across 3-4 small meals, and pair protein with fluids to stay hydrated.';

export const MOCK_MEAL_TEXT_PARSE = {
  foods: [
    { name: 'Scrambled eggs', protein_g: 18, calories: 210, serving_description: '3 large eggs' },
    { name: 'Whole milk', protein_g: 8, calories: 150, serving_description: '1 cup' },
  ],
  total_protein_g: 26,
  total_calories: 360,
} as const;

export const MOCK_VOICE_PARSE: RecognitionResult = {
  transcript: 'I had two scrambled eggs and a protein shake for breakfast',
  name: 'Two scrambled eggs + protein shake',
  servingDescription: '1 serving',
  proteinG: 38,
  carbsG: 6,
  fatG: 13,
  fiberG: 0,
  caloriesKcal: 295,
  b12Mcg: 1.2,
  vitaminDIu: null,
  magnesiumMg: null,
  zincMg: 1.5,
  confidence: 'medium',
  confidencePercent: 65,
};

// Mock visit prep questions — returned when EXPO_PUBLIC_USE_MOCK_AI=true.
// Represents realistic AI-generated questions based on sample GLP-1 metrics.
export const MOCK_VISIT_PREP_QUESTIONS: string[] = [
  'My nausea has been averaging 3.8/5 over the past 14 days. Should we consider adjusting my dose or timing?',
  'I\'ve been losing weight steadily. At what point should we discuss a maintenance dose?',
  'My energy scores have been low (2.1/5 on average). Could this be related to my current injection phase?',
  'It has been 9 days since my last injection. What is the best approach to get back on schedule?',
];
