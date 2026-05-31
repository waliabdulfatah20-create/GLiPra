import type { SiteCode } from './constants';
import type { InjectionLog } from './types';

import { formatISO, subDays, subHours } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { computeNextSite } from './calculator';
import { REST_DAYS, SITE_ROTATION_ORDER } from './constants';

// Fixed "now" anchor so all relative timestamps are deterministic.
const NOW = '2026-05-20T12:00:00.000Z';

function makeLog(
  siteCode: SiteCode,
  daysAgo: number,
  idSuffix = '',
): InjectionLog {
  const injectedAt = formatISO(subDays(new Date(NOW), daysAgo));
  return {
    id: `log-${siteCode}-${daysAgo}-${idSuffix}`,
    user_id: 'user-1',
    injected_at: injectedAt,
    site_code: siteCode,
    medication_name: 'Ozempic',
    pain_level: 2,
    notes: null,
    dosage_strength: null,
    created_at: injectedAt,
  };
}

describe('computeNextSite', () => {
  it('returns first site in rotation order when no logs exist', () => {
    const { recommendation, allResting } = computeNextSite([], NOW);
    expect(recommendation).toBe(SITE_ROTATION_ORDER[0]);
    expect(recommendation).toBe('stomach_upper_left');
    expect(allResting).toBe(false);
  });

  it('skips a site used within the rest window and advances rotation', () => {
    const logs = [makeLog('stomach_upper_left', REST_DAYS - 1)];
    const { recommendation, allResting } = computeNextSite(logs, NOW);
    // Upper left is resting → next in rotation is Upper Mid.
    expect(recommendation).toBe('stomach_upper_mid');
    expect(allResting).toBe(false);
  });

  it('returns a site again once its rest window elapses', () => {
    // Use Upper Left exactly REST_DAYS ago — boundary case, should be eligible.
    const logs = [makeLog('stomach_upper_left', REST_DAYS)];
    const { recommendation, allResting } = computeNextSite(logs, NOW);
    expect(recommendation).toBe('stomach_upper_left');
    expect(allResting).toBe(false);
  });

  it('flags allResting when every site is within rest window', () => {
    const logs = SITE_ROTATION_ORDER.map((code, i) =>
      // Stagger by hours so each site has a distinct "last used" timestamp
      // but all remain within REST_DAYS.
      ({
        ...makeLog(code, 1),
        injected_at: formatISO(subHours(new Date(NOW), i + 1)),
      }),
    );
    const { recommendation, allResting } = computeNextSite(logs, NOW);
    expect(allResting).toBe(true);
    // Least recently used is the LAST one staggered (i = 5 → oldest).
    expect(recommendation).toBe(SITE_ROTATION_ORDER[5]);
  });

  it('returns the rested site, not the recently-used one, when only some are resting', () => {
    // All six sites have logs, but only Upper Mid was used > REST_DAYS ago.
    const logs: InjectionLog[] = [];
    for (let i = 0; i < SITE_ROTATION_ORDER.length; i++) {
      const code = SITE_ROTATION_ORDER[i];
      // Index 1 = stomach_upper_mid in our rotation order.
      const daysAgo = i === 1 ? REST_DAYS + 2 : 1;
      logs.push(makeLog(code, daysAgo));
    }
    const { recommendation, allResting } = computeNextSite(logs, NOW);
    expect(recommendation).toBe('stomach_upper_mid');
    expect(allResting).toBe(false);
  });

  it('uses most recent timestamp when duplicate logs exist for the same site', () => {
    const logs = [
      // An OLD log that, alone, would make the site eligible…
      makeLog('stomach_upper_left', REST_DAYS + 5, 'old'),
      // …but a RECENT log on the same site keeps it resting.
      makeLog('stomach_upper_left', 1, 'recent'),
    ];
    const { recommendation } = computeNextSite(logs, NOW);
    expect(recommendation).not.toBe('stomach_upper_left');
    expect(recommendation).toBe('stomach_upper_mid');
  });

  it('ignores an older duplicate when a newer log was seen first (no overwrite)', () => {
    // Same site, but the RECENT one is processed FIRST. The older log
    // that follows must NOT overwrite the recent timestamp.
    const logs = [
      makeLog('stomach_upper_left', 1, 'recent'),
      makeLog('stomach_upper_left', REST_DAYS + 5, 'old'),
    ];
    const { recommendation } = computeNextSite(logs, NOW);
    // If the older log overwrote the newer, upper_left would be eligible
    // (REST_DAYS+5 days ago). Since the newer log "wins", upper_left is
    // still resting and rotation advances to upper_mid.
    expect(recommendation).toBe('stomach_upper_mid');
  });

  it('keeps the FIRST-encountered site as oldest when later sites are newer (allResting Pass 2 skip)', () => {
    // Set up so SITE_ROTATION_ORDER[0] is the OLDEST and each subsequent site
    // is progressively NEWER. The Pass 2 loop must NOT replace `oldestCode`
    // when `at >= oldestAt` — exercises the false-branch of the comparison.
    const logs = SITE_ROTATION_ORDER.map((code, i) => ({
      ...makeLog(code, 1),
      injected_at: formatISO(subHours(new Date(NOW), SITE_ROTATION_ORDER.length - i)),
    }));
    const { recommendation, allResting } = computeNextSite(logs, NOW);
    expect(allResting).toBe(true);
    // The very first rotation order site was set as oldest and never replaced.
    expect(recommendation).toBe(SITE_ROTATION_ORDER[0]);
  });

  it('is order-independent — same logs in any order produce same result', () => {
    const logs = [
      makeLog('stomach_lower_right', 2),
      makeLog('stomach_upper_left', 4),
      makeLog('stomach_upper_mid', 10),
    ];
    const shuffled = [...logs].reverse();
    const a = computeNextSite(logs, NOW);
    const b = computeNextSite(shuffled, NOW);
    expect(a).toEqual(b);
  });

  it('respects an overridden `today` parameter', () => {
    // A log "1 day ago" relative to NOW is still resting.
    const logs = [makeLog('stomach_upper_left', 1)];

    // If we advance `today` by 10 days, that log is now 11 days old → rested.
    const futureToday = formatISO(subDays(new Date(NOW), -10));
    const { recommendation, allResting } = computeNextSite(logs, futureToday);

    expect(recommendation).toBe('stomach_upper_left');
    expect(allResting).toBe(false);
  });

  it('ignores logs with unknown site_code values (defensive)', () => {
    const logs: InjectionLog[] = [
      makeLog('stomach_upper_left', 1),
      // Simulate a row with legacy/corrupted data.
      { ...makeLog('stomach_upper_left', 1, 'bad'), site_code: 'arm_left' as SiteCode },
    ];
    const { recommendation } = computeNextSite(logs, NOW);
    // Only the valid stomach_upper_left log counts → Upper Mid is recommended.
    expect(recommendation).toBe('stomach_upper_mid');
  });
});
