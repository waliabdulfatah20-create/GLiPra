import { describe, expect, it } from 'vitest';
import {
  LOW_CONFIDENCE_THRESHOLD,
  shouldShowLowConfidenceNudge,
} from '@/features/food-log/low-confidence-nudge';

describe('shouldShowLowConfidenceNudge', () => {
  it('shows the nudge just below the threshold', () => {
    expect(shouldShowLowConfidenceNudge(54)).toBe(true);
  });

  it('does not show the nudge exactly at the threshold (exclusive)', () => {
    expect(shouldShowLowConfidenceNudge(LOW_CONFIDENCE_THRESHOLD)).toBe(false);
    expect(shouldShowLowConfidenceNudge(55)).toBe(false);
  });

  it('shows the nudge at the bottom of the range', () => {
    expect(shouldShowLowConfidenceNudge(0)).toBe(true);
  });

  it('does not show the nudge at full confidence', () => {
    expect(shouldShowLowConfidenceNudge(100)).toBe(false);
  });

  it('does not show the nudge when confidence is unknown', () => {
    expect(shouldShowLowConfidenceNudge(null)).toBe(false);
    expect(shouldShowLowConfidenceNudge(undefined)).toBe(false);
  });

  it('treats a defensive negative as low confidence (guard order)', () => {
    expect(shouldShowLowConfidenceNudge(-1)).toBe(true);
  });

  it('pins the threshold constant', () => {
    expect(LOW_CONFIDENCE_THRESHOLD).toBe(55);
  });
});
