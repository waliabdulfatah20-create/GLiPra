// Per-EAN correction memory — stores user-verified nutrition data keyed by barcode.
// When a user edits barcode nutrition values and confirms, we persist the correction.
// Future scans of the same EAN will load from here first, bypassing Open Food Facts.

import type { BarcodeProduct } from './barcode-lookup';
import { supabase } from '@/lib/supabase';

type CorrectionRow = {
  barcode_ean: string;
  product_name: string;
  protein_g: number;
  fiber_g: number | null;
  calories_kcal: number | null;
};

/**
 * Fetch the user's stored correction for a given EAN.
 * Returns a BarcodeProduct with dataSource='user_corrected', or null if none exists.
 */
export async function fetchBarcodeCorrection(
  userId: string,
  ean: string,
): Promise<BarcodeProduct | null> {
  const { data, error } = await supabase
    .from('barcode_corrections')
    .select('barcode_ean, product_name, protein_g, fiber_g, calories_kcal')
    .eq('user_id', userId)
    .eq('barcode_ean', ean)
    .maybeSingle();

  if (error || !data)
    return null;

  const row = data as CorrectionRow;
  return {
    ean: row.barcode_ean,
    name: row.product_name,
    servingDescription: '100g',
    proteinG: Number(row.protein_g),
    fiberG: row.fiber_g != null ? Number(row.fiber_g) : null,
    caloriesKcal: row.calories_kcal != null ? Number(row.calories_kcal) : null,
    // Corrections store only protein/fiber/calories; remaining macros and
    // micronutrients are not captured, so they are explicitly unknown.
    carbsG: null,
    fatG: null,
    magnesiumMg: null,
    zincMg: null,
    b12Mcg: null,
    vitaminDIu: null,
    servingWeightG: null,
    dataSource: 'user_corrected',
  };
}

/**
 * Upsert a user correction for a given EAN.
 * Called when the user confirms barcode data after editing any nutrition field.
 */
export async function saveBarcodeCorrection(
  userId: string,
  ean: string,
  product: Pick<BarcodeProduct, 'name' | 'proteinG' | 'fiberG' | 'caloriesKcal'>,
): Promise<void> {
  await supabase.from('barcode_corrections').upsert(
    {
      user_id: userId,
      barcode_ean: ean,
      product_name: product.name,
      protein_g: product.proteinG,
      fiber_g: product.fiberG ?? null,
      calories_kcal: product.caloriesKcal ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,barcode_ean' },
  );
}
