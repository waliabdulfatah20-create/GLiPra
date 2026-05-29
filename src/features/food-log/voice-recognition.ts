// voice-recognition.ts — client wrapper for transcribe-food edge function.
// Rule 1: audio sent to edge function, never directly to OpenAI.
// Cost: returns MOCK_VOICE_PARSE when EXPO_PUBLIC_USE_MOCK_AI=true.

import { supabase } from '@/lib/supabase';
import { isMockAIEnabled, MOCK_VOICE_PARSE } from '@/lib/mockAI';
import type { RecognitionResult } from './photo-recognition';

export interface VoiceInput {
  audioBase64: string;
  mimeType: string;
}

const VOICE_FALLBACK: RecognitionResult = {
  transcript: '',
  name: 'Unknown food',
  servingDescription: '1 serving',
  proteinG: 0,
  carbsG: null,
  fatG: null,
  fiberG: null,
  caloriesKcal: null,
  b12Mcg: null,
  vitaminDIu: null,
  magnesiumMg: null,
  zincMg: null,
  confidence: 'low',
};

export async function transcribeVoice(input: VoiceInput): Promise<RecognitionResult> {
  if (isMockAIEnabled()) return MOCK_VOICE_PARSE;

  try {
    const { data, error } = await supabase.functions.invoke('transcribe-food', {
      body: { audioBase64: input.audioBase64, mimeType: input.mimeType },
    });
    if (error || !data) {
      console.error('[transcribeVoice] edge function error:', error?.message);
      return VOICE_FALLBACK;
    }
    return data as RecognitionResult;
  } catch (err) {
    console.error('[transcribeVoice] unexpected error:', err);
    return VOICE_FALLBACK;
  }
}
