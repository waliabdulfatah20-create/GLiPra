import { describe, expect, it, vi } from 'vitest';

// Mock supabase so no React Native or network imports are pulled in.
vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

// Mock mockAI so isMockAIEnabled() returns true and MOCK_VOICE_PARSE is stable.
vi.mock('@/lib/mockAI', () => ({
  isMockAIEnabled: () => true,
  MOCK_VOICE_PARSE: {
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
  },
}));

const { transcribeVoice } = await import('@/features/food-log/voice-recognition');
const { MOCK_VOICE_PARSE } = await import('@/lib/mockAI');

describe('transcribeVoice — mock path', () => {
  it('returns MOCK_VOICE_PARSE when mock AI is enabled', async () => {
    const result = await transcribeVoice({ audioBase64: 'dGVzdA==', mimeType: 'audio/m4a' });
    expect(result).toEqual(MOCK_VOICE_PARSE);
  });

  it('result has transcript string', async () => {
    const result = await transcribeVoice({ audioBase64: 'dGVzdA==', mimeType: 'audio/m4a' });
    expect(typeof result.transcript).toBe('string');
    expect(result.transcript!.length).toBeGreaterThan(0);
  });

  it('result has valid confidence value', async () => {
    const result = await transcribeVoice({ audioBase64: 'dGVzdA==', mimeType: 'audio/m4a' });
    expect(['high', 'medium', 'low']).toContain(result.confidence);
  });

  it('result has non-negative proteinG', async () => {
    const result = await transcribeVoice({ audioBase64: 'dGVzdA==', mimeType: 'audio/m4a' });
    expect(result.proteinG).toBeGreaterThanOrEqual(0);
  });
});
