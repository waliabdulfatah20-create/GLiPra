// Barcode lookup using Open Food Facts (primary) + USDA FoodData Central (fallback).
// @openfoodfacts/openfoodfacts-nodejs is NOT installed; we use the public REST API directly.
// All nutriments are reported per 100g by both APIs.

import { z } from 'zod';

export type BarcodeDataSource = 'open_food_facts' | 'usda' | 'user_corrected';

export interface BarcodeProduct {
  name: string;
  servingDescription: string;
  proteinG: number;
  fiberG: number | null;
  caloriesKcal: number | null;
  ean: string;
  dataSource: BarcodeDataSource;
}

// ─── Open Food Facts ────────────────────────────────────────────────────────

const offNutrimentsSchema = z
  .object({
    proteins_100g: z.number().optional(),
    fiber_100g: z.number().optional(),
    'energy-kcal_100g': z.number().optional(),
  })
  .passthrough();

const offProductSchema = z
  .object({
    product_name: z.string().optional(),
    serving_size: z.string().optional(),
    nutriments: offNutrimentsSchema.optional(),
  })
  .passthrough();

const offResponseSchema = z.object({
  status: z.number(), // 1 = found, 0 = not found
  product: offProductSchema.optional(),
});

async function lookupBarcodeOFF(ean: string): Promise<BarcodeProduct | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Glipra/1.0 (contact@glipra.com)' },
    });
    if (!response.ok) return null;

    const json: unknown = await response.json();
    const parsed = offResponseSchema.safeParse(json);
    if (!parsed.success || parsed.data.status !== 1 || !parsed.data.product) return null;

    const product = parsed.data.product;
    const nutriments = product.nutriments ?? {};

    return {
      name: product.product_name?.trim() || 'Unknown Product',
      servingDescription: product.serving_size?.trim() || '100g',
      proteinG: nutriments.proteins_100g ?? 0,
      fiberG: nutriments.fiber_100g != null ? nutriments.fiber_100g : null,
      caloriesKcal:
        nutriments['energy-kcal_100g'] != null ? nutriments['energy-kcal_100g'] : null,
      ean,
      dataSource: 'open_food_facts',
    };
  } catch {
    return null;
  }
}

// ─── USDA FoodData Central ───────────────────────────────────────────────────
// Only queried for US products (EAN starts with '0', i.e. UPC-A / GTIN-12).
// USDA FDC nutrient IDs: protein=1003, fiber=1079, energy/kcal=1008

const usdaNutrientSchema = z.object({
  nutrientId: z.number(),
  value: z.number(),
});

const usdaFoodSchema = z.object({
  gtinUpc: z.string().optional(),
  description: z.string(),
  foodNutrients: z.array(usdaNutrientSchema),
});

const usdaResponseSchema = z.object({
  foods: z.array(usdaFoodSchema).optional(),
});

async function lookupBarcodeUSDA(ean: string): Promise<BarcodeProduct | null> {
  // Only attempt for EAN-13 codes that begin with 0 (US products)
  if (!ean.startsWith('0')) return null;

  try {
    const apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY ?? 'DEMO_KEY';
    const url =
      `https://api.nal.usda.gov/fdc/v1/foods/search` +
      `?query=${encodeURIComponent(ean)}&dataType=Branded&pageSize=1&api_key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const json: unknown = await response.json();
    const parsed = usdaResponseSchema.safeParse(json);
    if (!parsed.success) return null;

    const food = parsed.data.foods?.[0];
    if (!food) return null;

    const nutrientMap = new Map(food.foodNutrients.map((n) => [n.nutrientId, n.value]));
    const proteinG = nutrientMap.get(1003) ?? 0;
    const fiberG = nutrientMap.has(1079) ? (nutrientMap.get(1079) ?? null) : null;
    const caloriesKcal = nutrientMap.has(1008) ? (nutrientMap.get(1008) ?? null) : null;

    return {
      name: food.description,
      servingDescription: '100g',
      proteinG,
      fiberG,
      caloriesKcal,
      ean,
      dataSource: 'usda',
    };
  } catch {
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Look up a barcode using OFF as primary source, USDA as fallback.
 * USDA fallback is triggered when OFF returns protein=0 AND calories=null
 * (indicating likely missing/incomplete nutritional data).
 *
 * Returns null if the product is not found in either database.
 * Never throws — callers should treat null as "not found".
 */
export async function lookupBarcode(ean: string): Promise<BarcodeProduct | null> {
  const off = await lookupBarcodeOFF(ean);

  // OFF found complete data — return it directly
  if (off && (off.proteinG > 0 || off.caloriesKcal != null)) {
    return off;
  }

  // OFF returned incomplete data or not found — try USDA for US products
  const usda = await lookupBarcodeUSDA(ean);
  if (usda) return usda;

  // Return whatever OFF found (possibly incomplete), or null if completely not found
  return off;
}
