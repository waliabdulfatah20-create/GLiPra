// voice-recognition.ts — client wrapper for transcribe-food edge function.
// Rule 1: audio sent to edge function, never directly to OpenAI.
// Cost: returns MOCK_VOICE_PARSE when EXPO_PUBLIC_USE_MOCK_AI=true.

import type { RecognitionResult } from './photo-recognition';
import { isMockAIEnabled, MOCK_VOICE_PARSE } from '@/lib/mockAI';
import { supabase } from '@/lib/supabase';

export type VoiceInput = {
  audioBase64: string;
  mimeType: string;
};

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

export async function transcribeVoice(
  input: VoiceInput,
  signal?: AbortSignal,
): Promise<RecognitionResult | null> {
  if (isMockAIEnabled())
    return MOCK_VOICE_PARSE;

  try {
    const invokePromise = supabase.functions.invoke('transcribe-food', {
      body: { audioBase64: input.audioBase64, mimeType: input.mimeType },
    });

    // Race against abort signal — see photo-recognition.ts for rationale.
    const result = signal
      ? await new Promise<Awaited<typeof invokePromise> | null>((resolve, reject) => {
          if (signal.aborted) {
            resolve(null);
            return;
          }
          const onAbort = () => resolve(null);
          signal.addEventListener('abort', onAbort, { once: true });
          invokePromise.then(
            (v) => {
              signal.removeEventListener('abort', onAbort);
              resolve(v);
            },
            (e) => {
              signal.removeEventListener('abort', onAbort);
              reject(e);
            },
          );
        })
      : await invokePromise;

    if (result == null)
      return null; // Aborted

    const { data, error } = result;
    if (error || !data) {
      console.error('[transcribeVoice] edge function error:', error?.message);
      return VOICE_FALLBACK;
    }
    return data as RecognitionResult;
  }
  catch (err) {
    if (signal?.aborted)
      return null;
    console.error('[transcribeVoice] unexpected error:', err);
    return VOICE_FALLBACK;
  }
}
