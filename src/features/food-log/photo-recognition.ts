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

export type RecognitionResult = {
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
};

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
  const confidence: RecognitionResult['confidence']
    = mock.confidence >= 0.8 ? 'high' : mock.confidence >= 0.5 ? 'medium' : 'low';

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
// Abort race helper
// ---------------------------------------------------------------------------

/**
 * Resolve with the network result if it lands first, or `null` if the
 * AbortSignal fires first. The orphan network call continues in the
 * background but its result is discarded.
 */
function raceAgainstAbort<T>(p: Promise<T>, signal: AbortSignal): Promise<T | null> {
  if (signal.aborted)
    return Promise.resolve(null);
  return new Promise<T | null>((resolve, reject) => {
    let settled = false;
    const onAbort = () => {
      if (settled)
        return;
      settled = true;
      resolve(null);
    };
    signal.addEventListener('abort', onAbort, { once: true });
    p.then(
      (v) => {
        if (settled)
          return;
        settled = true;
        signal.removeEventListener('abort', onAbort);
        resolve(v);
      },
      (e) => {
        if (settled)
          return;
        settled = true;
        signal.removeEventListener('abort', onAbort);
        reject(e);
      },
    );
  });
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
      signal?: AbortSignal,
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
        const invokePromise = supabase.functions.invoke(
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

        // Race the call against an abort signal. The underlying fetch doesn't
        // get cancelled (supabase-js v2 doesn't propagate signals), but the UI
        // unblocks immediately and the discarded response wastes only one quota
        // slot in `ai_invocations`. Acceptable trade vs. a forked fetch path.
        const result = signal
          ? await raceAgainstAbort(invokePromise, signal)
          : await invokePromise;

        if (result == null)
          return null; // Aborted

        const { data, error: fnError } = result;
        if (fnError) {
          throw fnError;
        }

        return data as RecognitionResult;
      }
      catch (e) {
        // If we aborted, swallow — the caller knows.
        if (signal?.aborted)
          return null;
        const message
          = e instanceof Error ? e.message : 'Recognition failed';
        setError(message);
        return null;
      }
      finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { recognize, isLoading, error };
}
