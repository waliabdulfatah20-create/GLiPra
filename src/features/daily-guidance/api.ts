// src/features/daily-guidance/api.ts
// Invokes the generate-daily-guidance edge function.
// MOCK gate: returns MOCK_DAILY_GUIDANCE when EXPO_PUBLIC_USE_MOCK_AI=true.

import { isMockAIEnabled, MOCK_DAILY_GUIDANCE } from '@/lib/mockAI';
import { supabase } from '@/lib/supabase';

export type GuidanceContext = {
  injectionPhase: string | null;
  nauseaScore: number | null;
  energyScore: number | null;
  proteinProgressPct: number | null;
  medicationStatus: string | null;
  language: 'en' | 'es';
};

export type DailyGuidanceResult = {
  guidance_text: string;
  reasoning_text: string;
};

export async function generateDailyGuidance(
  context: GuidanceContext,
): Promise<DailyGuidanceResult> {
  if (isMockAIEnabled()) {
    await new Promise(r => setTimeout(r, 400));
    return MOCK_DAILY_GUIDANCE;
  }

  const { data, error } = await supabase.functions.invoke('generate-daily-guidance', {
    body: context,
  });

  if (error) {
    throw new Error(`generate-daily-guidance failed: ${error.message}`);
  }

  if (!data || typeof data.guidance_text !== 'string' || typeof data.reasoning_text !== 'string') {
    throw new Error('generate-daily-guidance returned unexpected shape');
  }

  return data as DailyGuidanceResult;
}
