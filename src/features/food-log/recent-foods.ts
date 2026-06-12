// Recent Foods — pure derivation logic for the one-tap "log again" quick-add row.
//
// Takes a window of the user's food_logs history and collapses it into a short,
// ranked list of distinct foods the user can re-log in a single tap. No AI, no
// network. The whole point of this feature is to eliminate repeat expensive
// recognition calls for the foods a user eats over and over.
//
// Ranking is a "smart blend": most-frequently-logged first, with the most
// recently logged breaking ties. That surfaces true staples (the daily protein
// shake) above one-off meals while still letting a brand-new food appear.

import type { FoodLogEntry } from './types';

// ---------------------------------------------------------------------------
// normalizeFoodName
// Shared normalization for grouping foods by name. Mirrors the inline
// `.toLowerCase().trim()` used by upsertFoodDefault / getFoodDefault in api.ts.
// ---------------------------------------------------------------------------
export function normalizeFoodName(name: string): string {
  return name.toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// RecentFood — a distinct, re-loggable food plus ranking metadata.
// Carries every macro/micro field so relogFoodEntry can reconstruct a full row
// without another lookup.
// ---------------------------------------------------------------------------
export type RecentFood = {
  /** Normalized name — stable list key. */
  key: string;
  name: string;
  servingDescription: string;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  caloriesKcal: number | null;
  b12Mcg: number | null;
  vitaminDIu: number | null;
  magnesiumMg: number | null;
  zincMg: number | null;
  ironMg: number | null;
  barcodeEan: string | null;
  source: FoodLogEntry['source'];
  /** How many times this food appears in the window (frequency). */
  count: number;
  /** ISO 8601 timestamp of the most recent log of this food. */
  lastLoggedAt: string;
};

const DEFAULT_LIMIT = 8;

// ---------------------------------------------------------------------------
// deriveRecentFoods
// Dedupe a history window by normalized name, keeping the MOST RECENT entry's
// macro values per food (so a re-log reflects how the user last logged it),
// then rank by frequency desc with recency as the tiebreak, capped at `limit`.
// ---------------------------------------------------------------------------
export function deriveRecentFoods(
  logs: FoodLogEntry[],
  opts?: { limit?: number },
): RecentFood[] {
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const byName = new Map<string, RecentFood>();

  for (const log of logs) {
    // Supplements are not foods — they have their own per-nutrient quick-add and
    // should not appear in the "log again" food bar.
    if (log.source === 'supplement')
      continue;
    const key = normalizeFoodName(log.name);
    if (key.length === 0)
      continue;

    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, {
        key,
        name: log.name,
        servingDescription: log.servingDescription,
        proteinG: log.proteinG,
        carbsG: log.carbsG,
        fatG: log.fatG,
        fiberG: log.fiberG,
        caloriesKcal: log.caloriesKcal,
        b12Mcg: log.b12Mcg,
        vitaminDIu: log.vitaminDIu,
        magnesiumMg: log.magnesiumMg,
        zincMg: log.zincMg,
        ironMg: log.ironMg,
        barcodeEan: log.barcodeEan,
        source: log.source,
        count: 1,
        lastLoggedAt: log.loggedAt,
      });
      continue;
    }

    existing.count += 1;
    // Keep the most recent log's display name + macro values.
    if (log.loggedAt > existing.lastLoggedAt) {
      existing.name = log.name;
      existing.servingDescription = log.servingDescription;
      existing.proteinG = log.proteinG;
      existing.carbsG = log.carbsG;
      existing.fatG = log.fatG;
      existing.fiberG = log.fiberG;
      existing.caloriesKcal = log.caloriesKcal;
      existing.b12Mcg = log.b12Mcg;
      existing.vitaminDIu = log.vitaminDIu;
      existing.magnesiumMg = log.magnesiumMg;
      existing.zincMg = log.zincMg;
      existing.ironMg = log.ironMg;
      existing.barcodeEan = log.barcodeEan;
      existing.source = log.source;
      existing.lastLoggedAt = log.loggedAt;
    }
  }

  return Array.from(byName.values())
    .sort((a, b) => {
      // Frequency first (most-eaten staples on top)...
      if (b.count !== a.count)
        return b.count - a.count;
      // ...then most recent breaks ties (newest of equally-frequent foods wins).
      if (b.lastLoggedAt > a.lastLoggedAt)
        return 1;
      if (b.lastLoggedAt < a.lastLoggedAt)
        return -1;
      return 0;
    })
    .slice(0, limit);
}
