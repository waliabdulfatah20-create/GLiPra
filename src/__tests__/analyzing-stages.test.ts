import { describe, expect, it } from 'vitest';
import {
  MIN_STAGE_DONE_MS,
  PHOTO_STAGES,
  planDrainDelay,
  planNextStageDelay,
  shouldShowSlowHint,
  SLOW_HINT_AFTER_MS,
  stagesFor,
  VOICE_STAGES,
} from '@/features/food-log/analyzing-stages';

describe('stagesFor', () => {
  it('returns the photo stage list for source=photo', () => {
    expect(stagesFor('photo')).toEqual(PHOTO_STAGES);
    expect(stagesFor('photo')).toHaveLength(5);
    expect(stagesFor('photo')[0]).toBe('image_received');
    expect(stagesFor('photo').at(-1)).toBe('building_pro_insight');
  });

  it('returns the voice stage list for source=voice', () => {
    expect(stagesFor('voice')).toEqual(VOICE_STAGES);
    expect(stagesFor('voice')).toHaveLength(5);
    expect(stagesFor('voice')[0]).toBe('audio_received');
    expect(stagesFor('voice')[1]).toBe('transcribing_voice');
    expect(stagesFor('voice').at(-1)).toBe('building_pro_insight');
  });
});

describe('planNextStageDelay', () => {
  it('returns Infinity when next index is beyond the last stage', () => {
    expect(planNextStageDelay(5, 5)).toBe(Infinity);
    expect(planNextStageDelay(99, 5)).toBe(Infinity);
  });

  it('returns Infinity when next index IS the last stage (last stage holds)', () => {
    expect(planNextStageDelay(4, 5)).toBe(Infinity);
  });

  it('returns a finite delay for mid-list stages', () => {
    const d2 = planNextStageDelay(1, 5);
    const d3 = planNextStageDelay(2, 5);
    const d4 = planNextStageDelay(3, 5);
    expect(d2).toBeGreaterThanOrEqual(MIN_STAGE_DONE_MS);
    expect(d3).toBeGreaterThanOrEqual(MIN_STAGE_DONE_MS);
    expect(d4).toBeGreaterThanOrEqual(MIN_STAGE_DONE_MS);
    expect(d2).toBeLessThan(Infinity);
  });

  it('never returns less than MIN_STAGE_DONE_MS', () => {
    // Even with defensive bounds violations.
    expect(planNextStageDelay(0, 5)).toBeGreaterThanOrEqual(MIN_STAGE_DONE_MS);
    expect(planNextStageDelay(-1, 5)).toBeGreaterThanOrEqual(MIN_STAGE_DONE_MS);
  });
});

describe('planDrainDelay', () => {
  it('returns 0 when no stages remain', () => {
    expect(planDrainDelay(0)).toBe(0);
    expect(planDrainDelay(-1)).toBe(0);
  });

  it('returns at least MIN_STAGE_DONE_MS when stages remain', () => {
    expect(planDrainDelay(1)).toBeGreaterThanOrEqual(MIN_STAGE_DONE_MS);
    expect(planDrainDelay(3)).toBeGreaterThanOrEqual(MIN_STAGE_DONE_MS);
  });

  it('respects an explicit larger visibility budget', () => {
    expect(planDrainDelay(3, 500)).toBe(500);
    // Smaller budget is floored to MIN_STAGE_DONE_MS.
    expect(planDrainDelay(3, 100)).toBe(MIN_STAGE_DONE_MS);
  });
});

describe('shouldShowSlowHint', () => {
  it('returns false when not on the last stage yet', () => {
    expect(shouldShowSlowHint(2, 5, 10000)).toBe(false);
    expect(shouldShowSlowHint(3, 5, 99999)).toBe(false);
  });

  it('returns false on the last stage before threshold', () => {
    expect(shouldShowSlowHint(4, 5, 0)).toBe(false);
    expect(shouldShowSlowHint(4, 5, SLOW_HINT_AFTER_MS - 1)).toBe(false);
  });

  it('returns true on the last stage after threshold', () => {
    expect(shouldShowSlowHint(4, 5, SLOW_HINT_AFTER_MS)).toBe(true);
    expect(shouldShowSlowHint(4, 5, SLOW_HINT_AFTER_MS + 5000)).toBe(true);
  });

  it('handles different stage counts correctly', () => {
    // 3-stage list: last stage is index 2.
    expect(shouldShowSlowHint(1, 3, SLOW_HINT_AFTER_MS)).toBe(false);
    expect(shouldShowSlowHint(2, 3, SLOW_HINT_AFTER_MS)).toBe(true);
  });
});
