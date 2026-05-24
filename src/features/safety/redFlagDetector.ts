// src/features/safety/redFlagDetector.ts
// Safety-critical — Rule 4: requires 90%+ Vitest branch coverage
// Rule 9: internal type codes only — condition names never rendered to users

import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * Single check-in entry from user's daily symptom log
 */
interface CheckIn {
  date: string; // 'YYYY-MM-DD'
  nausea: number | null; // 1-5 or null
  energy: number | null; // 1-5 or null
  water_ml: number | null;
  notes: string | null;
}

export interface RedFlagInput {
  checkIns: Array<{
    date: string; // 'YYYY-MM-DD'
    nausea: number | null; // 1-5 or null
    energy: number | null; // 1-5 or null
    water_ml: number | null;
    notes: string | null;
  }>;
  today: string; // 'YYYY-MM-DD'
}

export interface RedFlagPattern {
  type: 'dehydration_risk' | 'pain_pattern' | 'vomiting_pattern' | 'energy_pattern';
  severity: 'low' | 'medium' | 'high';
  description: string; // for internal logging, never shown to user
  daysSinceOnset: number;
}

export interface RedFlagDetection {
  triggered: boolean;
  patterns: RedFlagPattern[];
  shouldEscalate: boolean; // true if any severity = 'high'
}

// Keywords for pattern detection
const PAIN_KEYWORDS = ['pain', 'ache', 'cramp', 'sharp', 'stabbing', 'severe', 'hurt'];
const VOMIT_KEYWORDS = ['vomit', 'throwing up', 'threw up', 'nausea is overwhelming'];
const DEHYDRATION_WATER_THRESHOLD = 500; // ml
const LOOKBACK_WINDOW = 30; // days

/**
 * Helper: filter check-ins to valid date range (on or before today)
 */
function filterToValidDates(checkIns: CheckIn[], today: string): CheckIn[] {
  return checkIns.filter((c) => c.date <= today);
}

/**
 * Helper: calculate days between two ISO date strings
 * Returns 0 if dates are the same, positive if date is in the past
 */
function daysSince(date: string, today: string): number {
  return differenceInCalendarDays(parseISO(today), parseISO(date));
}

/**
 * Helper: check if text contains any of the keywords (case-insensitive)
 */
function containsKeywords(text: string | null, keywords: string[]): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Pattern 1: Dehydration Risk
 * Trigger: Nausea = 5 AND water_ml < 500 for 3+ consecutive days
 * Severity: LOW if 2 days, MEDIUM if 3 days, HIGH if 4+ days
 */
function detectDehydrationRisk(
  checkIns: CheckIn[],
  today: string,
): RedFlagPattern | null {
  const consecutive = getConsecutiveDays(
    checkIns,
    (c) => c.nausea === 5 && c.water_ml !== null && c.water_ml < DEHYDRATION_WATER_THRESHOLD,
    3,
    14,
    today,
  );

  if (consecutive === 0) return null;

  const severity: 'low' | 'medium' | 'high' =
    consecutive === 2 ? 'low' : consecutive === 3 ? 'medium' : 'high';

  return {
    type: 'dehydration_risk',
    severity,
    description: `Nausea level 5 with inadequate fluid intake for ${consecutive} consecutive days`,
    daysSinceOnset: consecutive,
  };
}

/**
 * Pattern 2: Pain Pattern
 * Trigger: Nausea = 5 + notes contain pain-related keywords
 * Severity: MEDIUM (any occurrence in last 7 days)
 */
function detectPainPattern(checkIns: CheckIn[], today: string): RedFlagPattern | null {
  const last7Days = checkIns.filter((c) => {
    const days = daysSince(c.date, today);
    return c.date <= today && days >= 0 && days <= 7;
  });

  const match = last7Days.find(
    (c) => c.nausea === 5 && containsKeywords(c.notes, PAIN_KEYWORDS),
  );

  if (!match) return null;

  const daysSinceOnset = daysSince(match.date, today);

  return {
    type: 'pain_pattern',
    severity: 'medium',
    description: `Severe nausea (level 5) with reported pain symptoms`,
    daysSinceOnset,
  };
}

/**
 * Pattern 3: Vomiting Pattern
 * Trigger: notes contain vomit-related keywords for 2+ consecutive days
 * Severity: MEDIUM if 2 days, HIGH if 3+ days
 */
function detectVomitingPattern(
  checkIns: CheckIn[],
  today: string,
): RedFlagPattern | null {
  const consecutive = getConsecutiveDays(
    checkIns,
    (c) => containsKeywords(c.notes, VOMIT_KEYWORDS),
    2,
    14,
    today,
  );

  if (consecutive === 0) return null;

  const severity: 'medium' | 'high' = consecutive === 2 ? 'medium' : 'high';

  return {
    type: 'vomiting_pattern',
    severity,
    description: `Reports of vomiting or overwhelming nausea for ${consecutive} consecutive days`,
    daysSinceOnset: consecutive,
  };
}

/**
 * Pattern 4: Energy Pattern
 * Trigger: Energy = 1 (most exhausted) for 5+ consecutive days
 * Severity: MEDIUM if 5 days, HIGH if 7+ days
 */
function detectEnergyPattern(checkIns: CheckIn[], today: string): RedFlagPattern | null {
  const consecutive = getConsecutiveDays(
    checkIns,
    (c) => c.energy === 1,
    5,
    30,
    today,
  );

  if (consecutive === 0) return null;

  const severity: 'medium' | 'high' = consecutive < 7 ? 'medium' : 'high';

  return {
    type: 'energy_pattern',
    severity,
    description: `Critically low energy level (1/5) for ${consecutive} consecutive days`,
    daysSinceOnset: consecutive,
  };
}

/**
 * Helper: count consecutive days matching a predicate
 * Returns the number of consecutive days (from most recent backwards) that match,
 * or 0 if the threshold is not met.
 *
 * @param checkIns - array of check-ins (already filtered to valid dates)
 * @param predicate - function to test each check-in
 * @param minDays - minimum consecutive days needed to trigger
 * @param lookbackDays - search at most this many days back from today
 * @param today - reference date in 'YYYY-MM-DD' format
 * @returns number of consecutive days, or 0 if threshold not met
 */
export function getConsecutiveDays(
  checkIns: CheckIn[],
  predicate: (c: CheckIn) => boolean,
  minDays: number,
  lookbackDays: number,
  today: string,
): number {
  // Sort by date descending (most recent first)
  const sorted = checkIns
    .filter((c) => c.date <= today && daysSince(c.date, today) <= lookbackDays)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) return 0;

  // Count consecutive matches from the most recent date backwards
  let count = 0;
  for (const checkIn of sorted) {
    if (predicate(checkIn)) {
      count++;
    } else {
      // Break on first non-match
      break;
    }
  }

  return count >= minDays ? count : 0;
}

/**
 * Main detection function
 * Runs all 4 pattern detectors and aggregates results
 */
export function detectRedFlags(input: RedFlagInput): RedFlagDetection {
  const { checkIns, today } = input;

  // Filter to valid dates
  const validCheckIns = filterToValidDates(checkIns, today);

  // Run all pattern detectors
  const patterns: RedFlagPattern[] = [];

  const dehydration = detectDehydrationRisk(validCheckIns, today);
  if (dehydration) patterns.push(dehydration);

  const pain = detectPainPattern(validCheckIns, today);
  if (pain) patterns.push(pain);

  const vomiting = detectVomitingPattern(validCheckIns, today);
  if (vomiting) patterns.push(vomiting);

  const energy = detectEnergyPattern(validCheckIns, today);
  if (energy) patterns.push(energy);

  // Determine escalation threshold
  const shouldEscalate = patterns.some((p) => p.severity === 'high');

  return {
    triggered: patterns.length > 0,
    patterns,
    shouldEscalate,
  };
}
