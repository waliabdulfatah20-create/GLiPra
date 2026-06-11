// Seeded GLP-1 foods search (Cascade D) — pure helpers.
//
// The `foods` table (migration 022) holds ~200 pharmacist-curated foods that
// power the zero-AI-cost "Search database" lookup on the Log screen and the
// "Wrong food?" correction flow in the AI review sheet. This module is pure
// (no Supabase imports) so it stays vitest-safe; the query itself lives in
// api.ts and the React Query hook in hooks.ts.

import type { DatabaseFoodEntry } from './types';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schema — validates rows coming out of the `foods` table (mirrors the
// foodLogRowSchema convention in api.ts; malformed rows are dropped).
// ---------------------------------------------------------------------------

export const seededFoodRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  name_es: z.string().nullable(),
  brand: z.string().nullable(),
  barcode: z.string().nullable(),
  serving_description: z.string(),
  serving_size_g: z.number().nullable(),
  calories: z.number().nullable(),
  protein_g: z.number(),
  carbs_g: z.number().nullable(),
  fat_g: z.number().nullable(),
  fiber_g: z.number().nullable(),
  b12_mcg: z.number().nullable(),
  iron_mg: z.number().nullable(),
  magnesium_mg: z.number().nullable(),
  vitamin_d_iu: z.number().nullable(),
  zinc_mg: z.number().nullable(),
});

export type SeededFoodRow = z.infer<typeof seededFoodRowSchema>;

export type SeededFood = {
  id: string;
  name: string;
  nameEs: string | null;
  brand: string | null;
  barcode: string | null;
  servingDescription: string;
  servingSizeG: number | null;
  caloriesKcal: number | null;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  b12Mcg: number | null;
  ironMg: number | null;
  magnesiumMg: number | null;
  vitaminDIu: number | null;
  zincMg: number | null;
};

export function rowToSeededFood(row: SeededFoodRow): SeededFood {
  return {
    id: row.id,
    name: row.name,
    nameEs: row.name_es,
    brand: row.brand,
    barcode: row.barcode,
    servingDescription: row.serving_description,
    servingSizeG: row.serving_size_g,
    caloriesKcal: row.calories,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    b12Mcg: row.b12_mcg,
    ironMg: row.iron_mg,
    magnesiumMg: row.magnesium_mg,
    vitaminDIu: row.vitamin_d_iu,
    zincMg: row.zinc_mg,
  };
}

// ---------------------------------------------------------------------------
// Query sanitizing — `%`, `_`, `,`, `(`, `)` break the supabase-js `.or()`
// filter parser / ILIKE pattern, so strip them before interpolation.
// ---------------------------------------------------------------------------

export function sanitizeFoodQuery(raw: string): string {
  return raw
    .replace(/[%_,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Locale display name — Spanish users see name_es when the seed has one.
// ---------------------------------------------------------------------------

export function seededFoodDisplayName(food: SeededFood, locale: string | undefined): string {
  if (locale?.toLowerCase().startsWith('es') && food.nameEs)
    return food.nameEs;
  return food.name;
}

// ---------------------------------------------------------------------------
// Mappers into the two consumption paths.
// ---------------------------------------------------------------------------

/** Build the food_logs insert entry (source 'database') for the Log it path. */
export function seededFoodToLogEntry(food: SeededFood, locale: string | undefined): DatabaseFoodEntry {
  return {
    name: seededFoodDisplayName(food, locale),
    servingDescription: food.servingDescription,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
    fiberG: food.fiberG,
    caloriesKcal: food.caloriesKcal,
    b12Mcg: food.b12Mcg,
    vitaminDIu: food.vitaminDIu,
    magnesiumMg: food.magnesiumMg,
    zincMg: food.zincMg,
    ironMg: food.ironMg,
    barcodeEan: food.barcode,
  };
}

/**
 * Build the string-typed patch for the AI review sheet's form ("Wrong food?"
 * flow). Formatting matches resultToForm in ai-review-sheet.tsx exactly:
 * grams/mcg use toFixed(1), kcal/IU/magnesium use Math.round, null becomes ''.
 */
export function seededFoodToFormPatch(food: SeededFood, locale: string | undefined): {
  name: string;
  servingDescription: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  fiberG: string;
  caloriesKcal: string;
  b12Mcg: string;
  vitaminDIu: string;
  magnesiumMg: string;
  zincMg: string;
  ironMg: string;
} {
  return {
    name: seededFoodDisplayName(food, locale),
    servingDescription: food.servingDescription,
    proteinG: food.proteinG.toFixed(1),
    carbsG: food.carbsG != null ? food.carbsG.toFixed(1) : '',
    fatG: food.fatG != null ? food.fatG.toFixed(1) : '',
    fiberG: food.fiberG != null ? food.fiberG.toFixed(1) : '',
    caloriesKcal: food.caloriesKcal != null ? Math.round(food.caloriesKcal).toString() : '',
    b12Mcg: food.b12Mcg != null ? food.b12Mcg.toFixed(1) : '',
    vitaminDIu: food.vitaminDIu != null ? Math.round(food.vitaminDIu).toString() : '',
    magnesiumMg: food.magnesiumMg != null ? Math.round(food.magnesiumMg).toString() : '',
    zincMg: food.zincMg != null ? food.zincMg.toFixed(1) : '',
    ironMg: food.ironMg != null ? food.ironMg.toFixed(1) : '',
  };
}
