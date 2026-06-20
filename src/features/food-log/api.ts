// Supabase queries for the food_logs table.
// Column names follow the snake_case convention of the database schema.

import type { DietaryContext } from './dietary-context';
import type { SeededFood } from './food-search';
import type { RecentFood } from './recent-foods';
import type { BarcodeFoodEntry, DatabaseFoodEntry, FoodCorrection, FoodLogEntry, ManualFoodEntry, PhotoFoodEntry, SupplementEntry } from './types';
import { endOfDay as getEndOfDay, startOfDay as getStartOfDay } from 'date-fns';

import { z } from 'zod';

import { supabase } from '@/lib/supabase';
import { buildDietaryContext } from './dietary-context';
import { rowToSeededFood, sanitizeFoodQuery, seededFoodRowSchema } from './food-search';

// ---------------------------------------------------------------------------
// Zod schema — validates rows coming out of the database
// ---------------------------------------------------------------------------
const foodLogRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  logged_at: z.string(),
  name: z.string(),
  serving_description: z.string(),
  protein_g: z.number(),
  carbs_g: z.number().nullable(),
  fat_g: z.number().nullable(),
  fiber_g: z.number().nullable(),
  calories_kcal: z.number().nullable(),
  b12_mcg: z.number().nullable(),
  vitamin_d_iu: z.number().nullable(),
  magnesium_mg: z.number().nullable(),
  zinc_mg: z.number().nullable(),
  iron_mg: z.number().nullable(),
  calcium_mg: z.number().nullable(),
  barcode_ean: z.string().nullable(),
  source: z.enum(['manual', 'barcode', 'photo', 'voice', 'database', 'supplement']),
  created_at: z.string(),
});

function rowToEntry(row: z.infer<typeof foodLogRowSchema>): FoodLogEntry {
  return {
    id: row.id,
    userId: row.user_id,
    loggedAt: row.logged_at,
    name: row.name,
    servingDescription: row.serving_description,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    caloriesKcal: row.calories_kcal,
    b12Mcg: row.b12_mcg,
    vitaminDIu: row.vitamin_d_iu,
    magnesiumMg: row.magnesium_mg,
    zincMg: row.zinc_mg,
    ironMg: row.iron_mg,
    calciumMg: row.calcium_mg,
    barcodeEan: row.barcode_ean,
    source: row.source,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// insertFoodLog
// Insert a food log entry for the current user (manual or barcode source).
// ---------------------------------------------------------------------------
export async function insertFoodLog(
  userId: string,
  entry: ManualFoodEntry,
  source: 'manual' | 'barcode' = 'manual',
  barcodeEan: string | null = null,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    logged_at: now,
    name: entry.name,
    serving_description: entry.servingDescription,
    protein_g: entry.proteinG,
    fiber_g: entry.fiberG ?? null,
    calories_kcal: entry.caloriesKcal ?? null,
    barcode_ean: barcodeEan,
    source,
    created_at: now,
  });

  if (error) {
    throw new Error(`insertFoodLog failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// insertBarcodeFoodLog
// Insert a barcode-sourced food log entry with full macro + micronutrient data.
// Always free — no paywall per subscription rules.
// ---------------------------------------------------------------------------
export async function insertBarcodeFoodLog(
  userId: string,
  entry: BarcodeFoodEntry,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    logged_at: now,
    name: entry.name,
    serving_description: entry.servingDescription,
    protein_g: entry.proteinG,
    carbs_g: entry.carbsG,
    fat_g: entry.fatG,
    fiber_g: entry.fiberG,
    calories_kcal: entry.caloriesKcal,
    magnesium_mg: entry.magnesiumMg,
    zinc_mg: entry.zincMg,
    b12_mcg: entry.b12Mcg,
    vitamin_d_iu: entry.vitaminDIu,
    iron_mg: entry.ironMg,
    calcium_mg: entry.calciumMg,
    barcode_ean: entry.barcodeEan,
    source: 'barcode',
    created_at: now,
  });

  if (error) {
    throw new Error(`insertBarcodeFoodLog failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// insertSupplementLog
// Insert a per-nutrient supplement (source 'supplement'). No macros — protein_g
// is 0 and the other macro columns stay null; exactly one micronutrient column
// is set. Always free (manual micronutrient logging).
// ---------------------------------------------------------------------------
export async function insertSupplementLog(
  userId: string,
  entry: SupplementEntry,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    logged_at: now,
    name: entry.name,
    serving_description: entry.servingDescription,
    protein_g: 0,
    carbs_g: null,
    fat_g: null,
    fiber_g: null,
    calories_kcal: null,
    magnesium_mg: entry.magnesiumMg,
    zinc_mg: entry.zincMg,
    b12_mcg: entry.b12Mcg,
    vitamin_d_iu: entry.vitaminDIu,
    iron_mg: entry.ironMg,
    calcium_mg: entry.calciumMg,
    barcode_ean: null,
    source: 'supplement',
    created_at: now,
  });

  if (error) {
    throw new Error(`insertSupplementLog failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// searchFoods (Cascade D)
// Name search over the seeded pharmacist-curated `foods` table. Local data,
// zero AI cost. Protein-dense results first. Matches name OR name_es so the
// Spanish locale finds "yogur".
// ---------------------------------------------------------------------------
export async function searchFoods(query: string): Promise<SeededFood[]> {
  const q = sanitizeFoodQuery(query);
  if (q.length < 2)
    return [];

  const { data, error } = await supabase
    .from('foods')
    .select(
      'id, name, name_es, brand, barcode, serving_description, serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g, b12_mcg, iron_mg, calcium_mg, magnesium_mg, vitamin_d_iu, zinc_mg',
    )
    .or(`name.ilike.%${q}%,name_es.ilike.%${q}%`)
    .order('protein_density', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`searchFoods failed: ${error.message}`);
  }

  return (data ?? [])
    .map(row => seededFoodRowSchema.safeParse(row))
    .filter(result => result.success)
    .map(result => rowToSeededFood(result.data));
}

// ---------------------------------------------------------------------------
// insertDatabaseFoodLog (Cascade D)
// Insert a log entry sourced from the seeded foods table. Always free.
// ---------------------------------------------------------------------------
export async function insertDatabaseFoodLog(
  userId: string,
  entry: DatabaseFoodEntry,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    logged_at: now,
    name: entry.name,
    serving_description: entry.servingDescription,
    protein_g: entry.proteinG,
    carbs_g: entry.carbsG,
    fat_g: entry.fatG,
    fiber_g: entry.fiberG,
    calories_kcal: entry.caloriesKcal,
    magnesium_mg: entry.magnesiumMg,
    zinc_mg: entry.zincMg,
    b12_mcg: entry.b12Mcg,
    vitamin_d_iu: entry.vitaminDIu,
    iron_mg: entry.ironMg,
    calcium_mg: entry.calciumMg,
    barcode_ean: entry.barcodeEan,
    source: 'database',
    created_at: now,
  });

  if (error) {
    throw new Error(`insertDatabaseFoodLog failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// insertPhotoFoodLog
// Insert a photo-sourced food log entry with full macro + micronutrient data.
// ---------------------------------------------------------------------------
export async function insertPhotoFoodLog(
  userId: string,
  entry: PhotoFoodEntry,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    logged_at: now,
    name: entry.name,
    serving_description: entry.servingDescription,
    protein_g: entry.proteinG,
    carbs_g: entry.carbsG,
    fat_g: entry.fatG,
    fiber_g: entry.fiberG,
    calories_kcal: entry.caloriesKcal,
    b12_mcg: entry.b12Mcg,
    vitamin_d_iu: entry.vitaminDIu,
    magnesium_mg: entry.magnesiumMg,
    zinc_mg: entry.zincMg,
    iron_mg: entry.ironMg,
    calcium_mg: entry.calciumMg,
    barcode_ean: null,
    source: 'photo',
    created_at: now,
  });

  if (error) {
    throw new Error(`insertPhotoFoodLog failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// relogFoodEntry
// One-tap "log again" from the Recent Foods quick-add row. Inserts a fresh
// food_logs row copying the food's last-confirmed macros/micros, stamped at
// `now` (the user is eating it again now). Source provenance is preserved so
// analytics + the today list reflect where the food originally came from.
// Free, no AI — this is the cost/accuracy win of the cascade.
// ---------------------------------------------------------------------------
export async function relogFoodEntry(
  userId: string,
  item: RecentFood,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase.from('food_logs').insert({
    user_id: userId,
    logged_at: now,
    name: item.name,
    serving_description: item.servingDescription,
    protein_g: item.proteinG,
    carbs_g: item.carbsG,
    fat_g: item.fatG,
    fiber_g: item.fiberG,
    calories_kcal: item.caloriesKcal,
    b12_mcg: item.b12Mcg,
    vitamin_d_iu: item.vitaminDIu,
    magnesium_mg: item.magnesiumMg,
    zinc_mg: item.zincMg,
    iron_mg: item.ironMg,
    calcium_mg: item.calciumMg,
    barcode_ean: item.barcodeEan,
    source: item.source,
    created_at: now,
  });

  if (error) {
    throw new Error(`relogFoodEntry failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// saveFoodCorrection
// Store when the user corrects an AI-identified food name.
// Rule 2: food names only — never user email or PII in the correction.
// ---------------------------------------------------------------------------
export async function saveFoodCorrection(
  userId: string,
  correction: FoodCorrection,
): Promise<void> {
  const { error } = await supabase.from('food_corrections').insert({
    user_id: userId,
    original_ai_name: correction.originalAiName,
    corrected_name: correction.correctedName,
    serving_description: correction.servingDescription,
    protein_g: correction.proteinG,
    carbs_g: correction.carbsG,
    fat_g: correction.fatG,
    calories_kcal: correction.caloriesKcal,
    fiber_g: correction.fiberG,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Non-fatal — learning failure should not block the user from logging food.
    console.warn(`saveFoodCorrection failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// getRecentCorrections
// Fetch the user's last N correction pairs to pass as context to the edge fn.
// Rule 2: only returns originalName + correctedName — no user identity.
// ---------------------------------------------------------------------------
export async function getRecentCorrections(
  userId: string,
  limit = 10,
): Promise<Array<{ originalName: string; correctedName: string }>> {
  const { data, error } = await supabase
    .from('food_corrections')
    .select('original_ai_name, corrected_name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data)
    return [];

  return data.map(row => ({
    originalName: row.original_ai_name,
    correctedName: row.corrected_name,
  }));
}

// ---------------------------------------------------------------------------
// getUserDietaryContext
// Fetch the user's dietary pattern to bias photo recognition.
// Rule 2: categorical preference only — never user identity. Returns null
// when there is nothing useful to send (see buildDietaryContext).
// ---------------------------------------------------------------------------
export async function getUserDietaryContext(
  userId: string,
): Promise<DietaryContext | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('dietary_pattern')
    .eq('user_id', userId)
    .single();

  if (error || !data)
    return null;

  return buildDietaryContext(
    (data as { dietary_pattern?: string | null }).dietary_pattern ?? null,
  );
}

// ---------------------------------------------------------------------------
// upsertFoodDefault
// Save confirmed portion values as personal defaults for a food name.
// On conflict (same user + food name), update with latest confirmed values.
// ---------------------------------------------------------------------------
export async function upsertFoodDefault(
  userId: string,
  foodNameKey: string,
  entry: PhotoFoodEntry,
): Promise<void> {
  const { error } = await supabase.from('user_food_defaults').upsert(
    {
      user_id: userId,
      food_name_key: foodNameKey.toLowerCase().trim(),
      serving_description: entry.servingDescription,
      protein_g: entry.proteinG,
      carbs_g: entry.carbsG,
      fat_g: entry.fatG,
      calories_kcal: entry.caloriesKcal,
      fiber_g: entry.fiberG,
      b12_mcg: entry.b12Mcg,
      vitamin_d_iu: entry.vitaminDIu,
      magnesium_mg: entry.magnesiumMg,
      zinc_mg: entry.zincMg,
      iron_mg: entry.ironMg,
      calcium_mg: entry.calciumMg,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,food_name_key' },
  );

  if (error) {
    // Non-fatal — default saving should not block the user from logging food.
    console.warn(`upsertFoodDefault failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// getFoodDefault
// Look up personal saved defaults for a given food name.
// Returns null if no saved default exists.
// ---------------------------------------------------------------------------
export async function getFoodDefault(
  userId: string,
  foodNameKey: string,
): Promise<PhotoFoodEntry | null> {
  const { data, error } = await supabase
    .from('user_food_defaults')
    .select(
      'serving_description, protein_g, carbs_g, fat_g, calories_kcal, fiber_g, b12_mcg, vitamin_d_iu, magnesium_mg, zinc_mg, iron_mg, calcium_mg',
    )
    .eq('user_id', userId)
    .eq('food_name_key', foodNameKey.toLowerCase().trim())
    .maybeSingle();

  if (error || !data)
    return null;

  return {
    name: foodNameKey,
    servingDescription: data.serving_description,
    proteinG: data.protein_g,
    carbsG: data.carbs_g,
    fatG: data.fat_g,
    caloriesKcal: data.calories_kcal,
    fiberG: data.fiber_g,
    b12Mcg: data.b12_mcg,
    vitaminDIu: data.vitamin_d_iu,
    magnesiumMg: data.magnesium_mg,
    zincMg: data.zinc_mg,
    ironMg: data.iron_mg,
    calciumMg: data.calcium_mg,
  };
}

// ---------------------------------------------------------------------------
// fetchTodayFoodLogs
// Fetch today's food log entries for a user.
// `today` is an ISO date string 'YYYY-MM-DD'.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// fetchFoodLogsInRange
// Fetch food log entries within an inclusive local-date range.
// Both `startDate` and `endDate` are 'YYYY-MM-DD' local-date strings.
// Used by the Progress tab to compute per-day protein totals over a window.
// Reuses the same local-midnight-vs-UTC fix as fetchTodayFoodLogs.
// ---------------------------------------------------------------------------
export async function fetchFoodLogsInRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<FoodLogEntry[]> {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const localStart = new Date(sy, sm - 1, sd);
  const localEnd = new Date(ey, em - 1, ed);
  const rangeStart = getStartOfDay(localStart).toISOString();
  const rangeEnd = getEndOfDay(localEnd).toISOString();

  const { data, error } = await supabase
    .from('food_logs')
    .select(
      'id, user_id, logged_at, name, serving_description, '
      + 'protein_g, carbs_g, fat_g, fiber_g, calories_kcal, '
      + 'b12_mcg, vitamin_d_iu, magnesium_mg, zinc_mg, iron_mg, calcium_mg, '
      + 'barcode_ean, source, created_at',
    )
    .eq('user_id', userId)
    .gte('logged_at', rangeStart)
    .lte('logged_at', rangeEnd)
    .order('logged_at', { ascending: true });

  if (error) {
    throw new Error(`fetchFoodLogsInRange failed: ${error.message}`);
  }
  if (!data)
    return [];

  const entries: FoodLogEntry[] = [];
  for (const row of data) {
    const parsed = foodLogRowSchema.safeParse(row);
    if (parsed.success)
      entries.push(rowToEntry(parsed.data));
  }
  return entries;
}

export async function fetchTodayFoodLogs(
  userId: string,
  today: string,
): Promise<FoodLogEntry[]> {
  // Build local-time-aware day boundaries.
  // `today` is a local date string ('YYYY-MM-DD'). Using new Date(y, m, d) avoids
  // UTC-vs-local ambiguity — entries logged in the evening are included for all timezones.
  const [year, month, day] = today.split('-').map(Number);
  const localDate = new Date(year, month - 1, day); // local midnight, no UTC ambiguity
  const rangeStart = getStartOfDay(localDate).toISOString();
  const rangeEnd = getEndOfDay(localDate).toISOString();

  const { data, error } = await supabase
    .from('food_logs')
    .select(
      'id, user_id, logged_at, name, serving_description, '
      + 'protein_g, carbs_g, fat_g, fiber_g, calories_kcal, '
      + 'b12_mcg, vitamin_d_iu, magnesium_mg, zinc_mg, iron_mg, calcium_mg, '
      + 'barcode_ean, source, created_at',
    )
    .eq('user_id', userId)
    .gte('logged_at', rangeStart)
    .lte('logged_at', rangeEnd)
    .order('logged_at', { ascending: true });

  if (error) {
    throw new Error(`fetchTodayFoodLogs failed: ${error.message}`);
  }

  if (!data)
    return [];

  // Validate each row through Zod; drop malformed rows rather than crashing.
  const entries: FoodLogEntry[] = [];
  for (const row of data) {
    const parsed = foodLogRowSchema.safeParse(row);
    if (parsed.success) {
      entries.push(rowToEntry(parsed.data));
    }
  }

  return entries;
}
