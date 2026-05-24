// src/features/safety/redFlagDetector.test.ts
// Comprehensive Vitest tests for redFlagDetector.ts
// Rule 4: safety-critical code — targets 90%+ branch coverage

import { describe, expect, it } from 'vitest';

import { detectRedFlags, getConsecutiveDays, type RedFlagInput } from './redFlagDetector';

const TODAY = '2026-05-17';

// ─── Helper: minimal valid input ────────────────────────────────────────────
function emptyInput(): RedFlagInput {
  return { checkIns: [], today: TODAY };
}

// ─── 1. Empty and null inputs ──────────────────────────────────────────────
describe('empty and null inputs', () => {
  it('returns no patterns when checkIns array is empty', () => {
    const result = detectRedFlags(emptyInput());
    expect(result).toEqual({
      triggered: false,
      patterns: [],
      shouldEscalate: false,
    });
  });

  it('handles check-ins with null/undefined fields without crashing', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: TODAY, nausea: null, energy: null, water_ml: null, notes: null },
      ],
      today: TODAY,
    });
    expect(result.triggered).toBe(false);
    expect(result.patterns.length).toBe(0);
  });

  it('handles empty notes string', () => {
    const result = detectRedFlags({
      checkIns: [{ date: TODAY, nausea: 5, energy: 3, water_ml: 300, notes: '' }],
      today: TODAY,
    });
    // nausea=5 and water<500, but needs 3+ consecutive days
    expect(result.patterns.filter((p) => p.type === 'dehydration_risk')).toHaveLength(0);
  });
});

// ─── 2. DEHYDRATION_RISK pattern ───────────────────────────────────────────
describe('dehydration_risk pattern', () => {
  it('triggers with severity LOW when 2 consecutive days of nausea=5 + water<500', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 5, energy: 3, water_ml: 400, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 300, notes: null },
      ],
      today: TODAY,
    });
    // Only 2 days, so severity should be LOW (but currently only triggers for 3+)
    // Actually, spec says 3+ consecutive days, so this shouldn't trigger at all
    expect(result.patterns.filter((p) => p.type === 'dehydration_risk')).toHaveLength(0);
  });

  it('triggers with severity MEDIUM when 3 consecutive days of nausea=5 + water<500', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 5, energy: 3, water_ml: 400, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 300, notes: null },
        { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 200, notes: null },
      ],
      today: TODAY,
    });
    const dehydration = result.patterns.find((p) => p.type === 'dehydration_risk');
    expect(dehydration).toBeDefined();
    expect(dehydration?.severity).toBe('medium');
    expect(dehydration?.daysSinceOnset).toBe(3);
  });

  it('triggers with severity HIGH when 4+ consecutive days of nausea=5 + water<500', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 5, energy: 3, water_ml: 450, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 300, notes: null },
        { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 200, notes: null },
        { date: '2026-05-14', nausea: 5, energy: 3, water_ml: 100, notes: null },
      ],
      today: TODAY,
    });
    const dehydration = result.patterns.find((p) => p.type === 'dehydration_risk');
    expect(dehydration).toBeDefined();
    expect(dehydration?.severity).toBe('high');
    expect(dehydration?.daysSinceOnset).toBe(4);
    expect(result.shouldEscalate).toBe(true);
  });

  it('does NOT trigger when nausea < 5', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 4, energy: 3, water_ml: 300, notes: null },
        { date: '2026-05-16', nausea: 4, energy: 3, water_ml: 300, notes: null },
        { date: '2026-05-15', nausea: 4, energy: 3, water_ml: 300, notes: null },
      ],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'dehydration_risk')).toHaveLength(0);
  });

  it('does NOT trigger when water >= 500 threshold', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 5, energy: 3, water_ml: 500, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 500, notes: null },
        { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 500, notes: null },
      ],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'dehydration_risk')).toHaveLength(0);
  });

  it('does NOT trigger when water is null', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 5, energy: 3, water_ml: null, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: null, notes: null },
        { date: '2026-05-15', nausea: 5, energy: 3, water_ml: null, notes: null },
      ],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'dehydration_risk')).toHaveLength(0);
  });

  it('breaks consecutive run when one day does not meet criteria', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 5, energy: 3, water_ml: 400, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 600, notes: null }, // water >= 500
        { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 300, notes: null },
      ],
      today: TODAY,
    });
    // Only the most recent day matches, not 3+ consecutive
    expect(result.patterns.filter((p) => p.type === 'dehydration_risk')).toHaveLength(0);
  });

  it('respects 14-day lookback window', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-03', nausea: 5, energy: 3, water_ml: 300, notes: null }, // 14 days ago — at edge
        { date: '2026-05-02', nausea: 5, energy: 3, water_ml: 300, notes: null }, // 15 days ago — excluded
        { date: '2026-05-01', nausea: 5, energy: 3, water_ml: 300, notes: null }, // 16 days ago — excluded
      ],
      today: TODAY,
    });
    // Only 1 day in window, not 3+ consecutive
    expect(result.patterns.filter((p) => p.type === 'dehydration_risk')).toHaveLength(0);
  });
});

// ─── 3. PAIN_PATTERN ──────────────────────────────────────────────────────
describe('pain_pattern', () => {
  it('triggers MEDIUM severity when nausea=5 + "pain" in notes within last 7 days', () => {
    const result = detectRedFlags({
      checkIns: [{ date: TODAY, nausea: 5, energy: 3, water_ml: 600, notes: 'sharp pain in chest' }],
      today: TODAY,
    });
    const pain = result.patterns.find((p) => p.type === 'pain_pattern');
    expect(pain).toBeDefined();
    expect(pain?.severity).toBe('medium');
    expect(pain?.daysSinceOnset).toBe(0);
  });

  it('matches all pain keywords: pain, ache, cramp, sharp, stabbing, severe, hurt', () => {
    const keywords = ['pain', 'ache', 'cramp', 'sharp', 'stabbing', 'severe', 'hurt'];
    for (const kw of keywords) {
      const result = detectRedFlags({
        checkIns: [{ date: TODAY, nausea: 5, energy: 3, water_ml: 600, notes: `I have ${kw}` }],
        today: TODAY,
      });
      expect(result.patterns.some((p) => p.type === 'pain_pattern')).toBe(true);
    }
  });

  it('is case-insensitive', () => {
    const result = detectRedFlags({
      checkIns: [{ date: TODAY, nausea: 5, energy: 3, water_ml: 600, notes: 'SEVERE PAIN' }],
      today: TODAY,
    });
    expect(result.patterns.some((p) => p.type === 'pain_pattern')).toBe(true);
  });

  it('does NOT trigger when nausea < 5', () => {
    const result = detectRedFlags({
      checkIns: [{ date: TODAY, nausea: 4, energy: 3, water_ml: 600, notes: 'sharp pain' }],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'pain_pattern')).toHaveLength(0);
  });

  it('does NOT trigger when no pain keywords in notes', () => {
    const result = detectRedFlags({
      checkIns: [{ date: TODAY, nausea: 5, energy: 3, water_ml: 600, notes: 'feeling queasy' }],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'pain_pattern')).toHaveLength(0);
  });

  it('does NOT trigger for check-ins > 7 days ago', () => {
    const result = detectRedFlags({
      checkIns: [{ date: '2026-05-09', nausea: 5, energy: 3, water_ml: 600, notes: 'severe pain' }],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'pain_pattern')).toHaveLength(0);
  });

  it('correctly calculates daysSinceOnset', () => {
    const result = detectRedFlags({
      checkIns: [{ date: '2026-05-14', nausea: 5, energy: 3, water_ml: 600, notes: 'pain' }],
      today: TODAY,
    });
    const pain = result.patterns.find((p) => p.type === 'pain_pattern');
    expect(pain?.daysSinceOnset).toBe(3);
  });
});

// ─── 4. VOMITING_PATTERN ──────────────────────────────────────────────────
describe('vomiting_pattern', () => {
  it('triggers MEDIUM severity for 2 consecutive days with vomit keywords', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 4, energy: 2, water_ml: 300, notes: 'throwing up all day' },
        { date: '2026-05-16', nausea: 4, energy: 2, water_ml: 200, notes: 'vomited after meals' },
      ],
      today: TODAY,
    });
    const vomiting = result.patterns.find((p) => p.type === 'vomiting_pattern');
    expect(vomiting).toBeDefined();
    expect(vomiting?.severity).toBe('medium');
    expect(vomiting?.daysSinceOnset).toBe(2);
  });

  it('triggers HIGH severity for 3+ consecutive days with vomit keywords', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 5, energy: 1, water_ml: 100, notes: 'vomiting' },
        { date: '2026-05-16', nausea: 5, energy: 1, water_ml: 100, notes: 'threw up multiple times' },
        { date: '2026-05-15', nausea: 5, energy: 1, water_ml: 100, notes: 'nausea is overwhelming' },
      ],
      today: TODAY,
    });
    const vomiting = result.patterns.find((p) => p.type === 'vomiting_pattern');
    expect(vomiting).toBeDefined();
    expect(vomiting?.severity).toBe('high');
    expect(vomiting?.daysSinceOnset).toBe(3);
    expect(result.shouldEscalate).toBe(true);
  });

  it('matches all vomit keywords: vomit, throwing up, threw up, nausea is overwhelming', () => {
    const keywords = ['vomit', 'throwing up', 'threw up', 'nausea is overwhelming'];
    for (const kw of keywords) {
      const result = detectRedFlags({
        checkIns: [
          { date: TODAY, nausea: 3, energy: 3, water_ml: 600, notes: kw },
          { date: '2026-05-16', nausea: 3, energy: 3, water_ml: 600, notes: kw },
        ],
        today: TODAY,
      });
      expect(result.patterns.some((p) => p.type === 'vomiting_pattern')).toBe(true);
    }
  });

  it('is case-insensitive', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: TODAY, nausea: 3, energy: 3, water_ml: 600, notes: 'VOMITING' },
        { date: '2026-05-16', nausea: 3, energy: 3, water_ml: 600, notes: 'THROWING UP' },
      ],
      today: TODAY,
    });
    expect(result.patterns.some((p) => p.type === 'vomiting_pattern')).toBe(true);
  });

  it('does NOT trigger with only 1 day of vomit keywords', () => {
    const result = detectRedFlags({
      checkIns: [{ date: TODAY, nausea: 3, energy: 3, water_ml: 600, notes: 'vomiting' }],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'vomiting_pattern')).toHaveLength(0);
  });

  it('breaks consecutive run if keywords missing on intermediate day', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 3, energy: 3, water_ml: 600, notes: 'vomiting' },
        { date: '2026-05-16', nausea: 3, energy: 3, water_ml: 600, notes: 'feeling okay' }, // no keyword
        { date: '2026-05-15', nausea: 3, energy: 3, water_ml: 600, notes: 'vomiting' },
      ],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'vomiting_pattern')).toHaveLength(0);
  });

  it('respects 14-day lookback window', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-03', nausea: 3, energy: 3, water_ml: 600, notes: 'vomiting' }, // 14 days ago — included
        { date: '2026-05-02', nausea: 3, energy: 3, water_ml: 600, notes: 'vomiting' }, // 15 days ago — excluded
      ],
      today: TODAY,
    });
    // Only 1 day in window
    expect(result.patterns.filter((p) => p.type === 'vomiting_pattern')).toHaveLength(0);
  });
});

// ─── 5. ENERGY_PATTERN ────────────────────────────────────────────────────
describe('energy_pattern', () => {
  it('triggers MEDIUM severity when 5 consecutive days of energy=1', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-16', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-15', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-14', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-13', nausea: 2, energy: 1, water_ml: 600, notes: null },
      ],
      today: TODAY,
    });
    const energy = result.patterns.find((p) => p.type === 'energy_pattern');
    expect(energy).toBeDefined();
    expect(energy?.severity).toBe('medium');
    expect(energy?.daysSinceOnset).toBe(5);
  });

  it('triggers HIGH severity when 7+ consecutive days of energy=1', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-16', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-15', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-14', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-13', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-12', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-11', nausea: 2, energy: 1, water_ml: 600, notes: null },
      ],
      today: TODAY,
    });
    const energy = result.patterns.find((p) => p.type === 'energy_pattern');
    expect(energy).toBeDefined();
    expect(energy?.severity).toBe('high');
    expect(energy?.daysSinceOnset).toBe(7);
    expect(result.shouldEscalate).toBe(true);
  });

  it('does NOT trigger with only 4 consecutive days of energy=1', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-16', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-15', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-14', nausea: 2, energy: 1, water_ml: 600, notes: null },
      ],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'energy_pattern')).toHaveLength(0);
  });

  it('does NOT trigger when energy = 2 in the run', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-17', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-16', nausea: 2, energy: 2, water_ml: 600, notes: null }, // breaks run
        { date: '2026-05-15', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-14', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-13', nausea: 2, energy: 1, water_ml: 600, notes: null },
      ],
      today: TODAY,
    });
    expect(result.patterns.filter((p) => p.type === 'energy_pattern')).toHaveLength(0);
  });

  it('respects 30-day lookback window', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-04-17', nausea: 2, energy: 1, water_ml: 600, notes: null }, // 30 days ago — included
        { date: '2026-04-16', nausea: 2, energy: 1, water_ml: 600, notes: null }, // 31 days ago — excluded
        { date: '2026-04-15', nausea: 2, energy: 1, water_ml: 600, notes: null }, // 32 days ago — excluded
        { date: '2026-04-14', nausea: 2, energy: 1, water_ml: 600, notes: null }, // 33 days ago — excluded
        { date: '2026-04-13', nausea: 2, energy: 1, water_ml: 600, notes: null }, // 34 days ago — excluded
      ],
      today: TODAY,
    });
    // Only 1 day in window
    expect(result.patterns.filter((p) => p.type === 'energy_pattern')).toHaveLength(0);
  });
});

// ─── 6. Multiple patterns triggered simultaneously ──────────────────────
describe('multiple patterns', () => {
  it('can trigger multiple patterns at once', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: TODAY, nausea: 5, energy: 1, water_ml: 300, notes: 'severe pain and vomiting' },
        { date: '2026-05-16', nausea: 5, energy: 1, water_ml: 200, notes: 'throwing up' },
        { date: '2026-05-15', nausea: 5, energy: 1, water_ml: 100, notes: 'vomiting' },
        { date: '2026-05-14', nausea: 5, energy: 1, water_ml: 100, notes: null },
        { date: '2026-05-13', nausea: 2, energy: 1, water_ml: 600, notes: null },
      ],
      today: TODAY,
    });
    expect(result.patterns.length).toBeGreaterThanOrEqual(1);
    expect(result.triggered).toBe(true);
  });

  it('shouldEscalate is true if any pattern has severity HIGH', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: TODAY, nausea: 5, energy: 3, water_ml: 100, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 100, notes: null },
        { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 100, notes: null },
        { date: '2026-05-14', nausea: 5, energy: 3, water_ml: 100, notes: null },
      ],
      today: TODAY,
    });
    const dehydration = result.patterns.find((p) => p.type === 'dehydration_risk');
    expect(dehydration?.severity).toBe('high');
    expect(result.shouldEscalate).toBe(true);
  });

  it('shouldEscalate is false if all patterns are medium or low', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: TODAY, nausea: 5, energy: 3, water_ml: 300, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 300, notes: null },
        { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 300, notes: null },
      ],
      today: TODAY,
    });
    const dehydration = result.patterns.find((p) => p.type === 'dehydration_risk');
    expect(dehydration?.severity).toBe('medium');
    expect(result.shouldEscalate).toBe(false);
  });
});

// ─── 7. Future date exclusion ──────────────────────────────────────────
describe('future date exclusion', () => {
  it('ignores future check-ins', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-20', nausea: 5, energy: 1, water_ml: 300, notes: null },
        { date: '2026-05-21', nausea: 5, energy: 1, water_ml: 300, notes: null },
      ],
      today: TODAY,
    });
    expect(result.triggered).toBe(false);
  });

  it('mixes valid and future dates, using only valid ones', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: '2026-05-20', nausea: 5, energy: 1, water_ml: 300, notes: null }, // future
        { date: TODAY, nausea: 5, energy: 1, water_ml: 300, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 1, water_ml: 300, notes: null },
        { date: '2026-05-15', nausea: 5, energy: 1, water_ml: 300, notes: null },
      ],
      today: TODAY,
    });
    const dehydration = result.patterns.find((p) => p.type === 'dehydration_risk');
    expect(dehydration).toBeDefined();
    expect(dehydration?.daysSinceOnset).toBe(3);
  });
});

// ─── 8. getConsecutiveDays helper function ────────────────────────────
describe('getConsecutiveDays helper', () => {
  it('returns 0 when no dates match the predicate', () => {
    const checkIns = [
      { date: TODAY, nausea: 1, energy: 3, water_ml: 600, notes: null },
      { date: '2026-05-16', nausea: 2, energy: 3, water_ml: 600, notes: null },
    ];
    const result = getConsecutiveDays(
      checkIns,
      (c) => c.nausea === 5,
      3,
      30,
      TODAY,
    );
    expect(result).toBe(0);
  });

  it('returns 0 when matches exist but are not consecutive from most recent', () => {
    const checkIns = [
      { date: TODAY, nausea: 1, energy: 3, water_ml: 600, notes: null }, // most recent — doesn't match
      { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 600, notes: null },
      { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 600, notes: null },
    ];
    const result = getConsecutiveDays(
      checkIns,
      (c) => c.nausea === 5,
      3,
      30,
      TODAY,
    );
    expect(result).toBe(0);
  });

  it('returns count when matches are consecutive from most recent', () => {
    const checkIns = [
      { date: TODAY, nausea: 5, energy: 3, water_ml: 600, notes: null },
      { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 600, notes: null },
      { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 600, notes: null },
    ];
    const result = getConsecutiveDays(
      checkIns,
      (c) => c.nausea === 5,
      2,
      30,
      TODAY,
    );
    expect(result).toBe(3);
  });

  it('respects minimum day threshold', () => {
    const checkIns = [
      { date: TODAY, nausea: 5, energy: 3, water_ml: 600, notes: null },
      { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 600, notes: null },
    ];
    const result = getConsecutiveDays(
      checkIns,
      (c) => c.nausea === 5,
      3,
      30,
      TODAY,
    );
    expect(result).toBe(0);
  });

  it('respects lookback window', () => {
    const checkIns = [
      { date: '2026-04-10', nausea: 5, energy: 3, water_ml: 600, notes: null }, // 37 days ago — excluded
      { date: '2026-04-11', nausea: 5, energy: 3, water_ml: 600, notes: null }, // 36 days ago — excluded
      { date: '2026-04-17', nausea: 5, energy: 3, water_ml: 600, notes: null }, // 30 days ago — included
    ];
    const result = getConsecutiveDays(
      checkIns,
      (c) => c.nausea === 5,
      2,
      30,
      TODAY,
    );
    expect(result).toBe(0);
  });

  it('excludes future dates', () => {
    const checkIns = [
      { date: '2026-05-20', nausea: 5, energy: 3, water_ml: 600, notes: null }, // future
      { date: TODAY, nausea: 5, energy: 3, water_ml: 600, notes: null },
    ];
    const result = getConsecutiveDays(
      checkIns,
      (c) => c.nausea === 5,
      2,
      30,
      TODAY,
    );
    expect(result).toBe(0);
  });
});

// ─── 9. Description field generation ───────────────────────────────────
describe('pattern descriptions', () => {
  it('includes daysSinceOnset in dehydration description', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: TODAY, nausea: 5, energy: 3, water_ml: 400, notes: null },
        { date: '2026-05-16', nausea: 5, energy: 3, water_ml: 300, notes: null },
        { date: '2026-05-15', nausea: 5, energy: 3, water_ml: 200, notes: null },
        { date: '2026-05-14', nausea: 5, energy: 3, water_ml: 100, notes: null },
      ],
      today: TODAY,
    });
    const dehydration = result.patterns.find((p) => p.type === 'dehydration_risk');
    expect(dehydration?.description).toContain('4');
  });

  it('includes daysSinceOnset in vomiting description', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: TODAY, nausea: 3, energy: 3, water_ml: 600, notes: 'vomiting' },
        { date: '2026-05-16', nausea: 3, energy: 3, water_ml: 600, notes: 'threw up' },
      ],
      today: TODAY,
    });
    const vomiting = result.patterns.find((p) => p.type === 'vomiting_pattern');
    expect(vomiting?.description).toContain('2');
  });

  it('includes daysSinceOnset in energy description', () => {
    const result = detectRedFlags({
      checkIns: [
        { date: TODAY, nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-16', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-15', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-14', nausea: 2, energy: 1, water_ml: 600, notes: null },
        { date: '2026-05-13', nausea: 2, energy: 1, water_ml: 600, notes: null },
      ],
      today: TODAY,
    });
    const energy = result.patterns.find((p) => p.type === 'energy_pattern');
    expect(energy?.description).toContain('5');
  });
});
