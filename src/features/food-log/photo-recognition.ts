// Client-side hook for AI photo food recognition.
//
// Non-negotiable rules enforced here:
//   Rule 1 — OpenAI is NEVER called from client code. All AI work happens in
//             the 'recognize-food' Supabase edge function.
//   Cost rule — When EXPO_PUBLIC_USE_MOCK_AI=true, mock data is returned
//               immediately without any network call (zero OpenAI spend).
//   Rule 2 — recentCorrections passed to edge function contain food names only,
//             never user email or PII.
//
// Pro gate (subscription):
//   This hook itself does NOT enforce the Pro gate — that is the caller's
//   responsibility. Callers must wrap photo capture UI in:
//     <ProGate featureName="AI Photo Recognition">
//       <PhotoCaptureButton ... />
//     </ProGate>
//   See src/components/log/photo-capture-button.tsx for the UI entry point
//   and src/features/subscription/pro-gate.tsx for the gate implementation.
//   The edge function also enforces a 50/day cap via ai_invocations (server-side).

import { useCallback, useState } from 'react';

import { isMockAIEnabled, MOCK_MEAL_RECOGNITION } from '@/lib/mockAI';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface RecognitionResult {
  transcript?: string;
  name: string;
  servingDescription: string;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  caloriesKcal: number | null;
  // GLP-1 relevant micronutrients — AI estimates, accuracy varies
  b12Mcg: number | null;
  vitaminDIu: number | null;
  magnesiumMg: number | null;
  zincMg: number | null;
  confidence: 'high' | 'medium' | 'low';
}

// ---------------------------------------------------------------------------
// Mock adapter
// ---------------------------------------------------------------------------
// MOCK_MEAL_RECOGNITION is a multi-food array with a different shape.
// This adapter collapses it into a single RecognitionResult so the mock
// response matches exactly what the real edge function returns.

function adaptMockToResult(): RecognitionResult {
  const mock = MOCK_MEAL_RECOGNITION;
  const firstFood = mock.foods[0];

  // Derive a human-readable confidence from the numeric confidence value.
  const confidence: RecognitionResult['confidence'] =
    mock.confidence >= 0.8 ? 'high' : mock.confidence >= 0.5 ? 'medium' : 'low';

  return {
    name: firstFood.name,
    servingDescription: `${firstFood.serving_g}g serving`,
    proteinG: mock.total_protein_g,
    carbsG: mock.total_carbs_g,
    fatG: mock.total_fat_g,
    fiberG: mock.total_fiber_g,
    caloriesKcal: mock.total_calories,
    b12Mcg: mock.b12_mcg,
    vitaminDIu: mock.vitamin_d_iu,
    magnesiumMg: mock.magnesium_mg,
    zincMg: mock.zinc_mg,
    confidence,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePhotoFoodRecognition() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognize = useCallback(
    async (
      imageBase64: string,
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp',
      recentCorrections?: Array<{ originalName: string; correctedName: string }>,
      userComment?: string,
    ): Promise<RecognitionResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Cost rule — return mock without any network call when mock flag is on.
        if (isMockAIEnabled()) {
          return adaptMockToResult();
        }

        // Rule 1 — client never calls OpenAI directly.
        // All OpenAI work happens inside the 'recognize-food' edge function.
        const { data, error: fnError } = await supabase.functions.invoke(
          'recognize-food',
          {
            body: {
              imageBase64,
              mimeType,
              // Rule 2: only food names + food-context comment — never user ID or email
              ...(recentCorrections && recentCorrections.length > 0
                ? { recentCorrections }
                : {}),
              ...(userComment ? { userComment } : {}),
            },
          },
        );

        if (fnError) {
          throw fnError;
        }

        return data as RecognitionResult;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Recognition failed';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { recognize, isLoading, error };
}
