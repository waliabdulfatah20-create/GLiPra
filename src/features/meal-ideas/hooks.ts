// Meal-ideas feature hook.
//
// Rules enforced:
//   Rule 1  — Client calls supabase.functions.invoke('generate-meal-ideas'), never OpenAI.
//   Rule 2  — Only anonymized context is sent (built by buildMealIdeasContext). No PII, no allergens.
//   Cost    — When EXPO_PUBLIC_USE_MOCK_AI=true, return MOCK_MEAL_IDEAS without a network call.
//
// Results live in local state for the lifetime of the screen (not persisted).

import type { MealIdeasResult, MealType } from './context';

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTodayCheckIn } from '@/features/check-in/hooks';
import { useTodayData } from '@/features/today/hooks';
import { analytics, EVENTS } from '@/lib/analytics';
import { isMockAIEnabled, MOCK_MEAL_IDEAS } from '@/lib/mockAI';
import { supabase } from '@/lib/supabase';
import { buildMealIdeasContext } from './context';

export function useMealIdeas() {
  const { i18n } = useTranslation();
  const { profile, proteinFloorG, proteinConsumedG, injectionCycle, oralCycle } = useTodayData();
  const { checkIn } = useTodayCheckIn();

  const [result, setResult] = useState<MealIdeasResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (mealType: MealType) => {
      setError(null);
      setIsLoading(true);
      analytics.capture(EVENTS.MEAL_IDEAS_REQUESTED, { mealType });

      try {
        if (isMockAIEnabled()) {
          await new Promise<void>(resolve => setTimeout(resolve, 800));
          setResult({ ...MOCK_MEAL_IDEAS, ideas: [...MOCK_MEAL_IDEAS.ideas] });
          return;
        }

        const body = buildMealIdeasContext({
          mealType,
          proteinFloorG,
          proteinConsumedG,
          phaseLabel: injectionCycle?.phase ?? oralCycle?.phase ?? null,
          nauseaScore: checkIn?.nausea ?? null,
          dietaryPattern: profile?.dietaryPattern ?? null,
          hasKidneyDisease: profile?.hasKidneyDisease ?? null,
          language: i18n.language === 'es' ? 'es' : 'en',
        });

        const { data, error: fnError } = await supabase.functions.invoke('generate-meal-ideas', { body });
        if (fnError)
          throw new Error(fnError.message ?? 'Meal ideas unavailable');
        if (!data?.ideas || !Array.isArray(data.ideas) || data.ideas.length === 0)
          throw new TypeError('Unexpected response from meal-ideas function');

        setResult(data as MealIdeasResult);
      }
      catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
      finally {
        setIsLoading(false);
      }
    },
    [proteinFloorG, proteinConsumedG, injectionCycle, oralCycle, checkIn, profile, i18n.language],
  );

  return { result, request, isLoading, error };
}
