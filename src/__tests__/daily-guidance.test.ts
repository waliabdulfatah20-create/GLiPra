// src/__tests__/daily-guidance.test.ts
// Tests for the daily-guidance feature.
// Covers: mock path return shape, null context guard, GuidanceContext field types.

import type { GuidanceContext } from '../features/daily-guidance/api';
import { describe, expect, it, vi } from 'vitest';
import { generateDailyGuidance } from '../features/daily-guidance/api';
import { MOCK_DAILY_GUIDANCE } from '../lib/mockAI';

// Mock the env module so isMockAIEnabled() returns true in all tests
vi.mock('env', () => ({ default: { EXPO_PUBLIC_USE_MOCK_AI: 'true' } }));

// Mock supabase — not needed when mock is on, but import must not crash
vi.mock('../lib/supabase', () => ({ supabase: { functions: { invoke: vi.fn() } } }));

describe('generateDailyGuidance (mock path)', () => {
  const baseContext: GuidanceContext = {
    injectionPhase: 'adjustment',
    nauseaScore: 3,
    energyScore: 3,
    proteinProgressPct: 45,
    medicationStatus: 'active',
    language: 'en',
  };

  it('returns MOCK_DAILY_GUIDANCE shape when mock AI is enabled', async () => {
    const result = await generateDailyGuidance(baseContext);
    expect(result).toHaveProperty('guidance_text');
    expect(result).toHaveProperty('reasoning_text');
    expect(typeof result.guidance_text).toBe('string');
    expect(typeof result.reasoning_text).toBe('string');
    expect(result.guidance_text.length).toBeGreaterThan(0);
    expect(result.reasoning_text.length).toBeGreaterThan(0);
  });

  it('mOCK_DAILY_GUIDANCE matches required schema shape', () => {
    expect(MOCK_DAILY_GUIDANCE).toHaveProperty('guidance_text');
    expect(MOCK_DAILY_GUIDANCE).toHaveProperty('reasoning_text');
    expect(typeof MOCK_DAILY_GUIDANCE.guidance_text).toBe('string');
    expect(typeof MOCK_DAILY_GUIDANCE.reasoning_text).toBe('string');
  });

  it('works with null optional fields in context', async () => {
    const minimalContext: GuidanceContext = {
      injectionPhase: null,
      nauseaScore: null,
      energyScore: null,
      proteinProgressPct: null,
      medicationStatus: null,
      language: 'en',
    };
    const result = await generateDailyGuidance(minimalContext);
    expect(result.guidance_text).toBeTruthy();
  });

  it('works with Spanish language context', async () => {
    const result = await generateDailyGuidance({ ...baseContext, language: 'es' });
    expect(result.guidance_text).toBeTruthy();
    expect(result.reasoning_text).toBeTruthy();
  });

  it('returns guidance for all valid injection phases', async () => {
    const phases = [
      'injection_day',
      'peak_suppression',
      'adjustment',
      'recovery_window',
      'overdue',
    ] as const;
    for (const phase of phases) {
      const result = await generateDailyGuidance({ ...baseContext, injectionPhase: phase });
      expect(result.guidance_text.length).toBeGreaterThan(0);
    }
  });
});
