// Barcode lookup using Open Food Facts (primary) + USDA FoodData Central (fallback).
// @openfoodfacts/openfoodfacts-nodejs is NOT installed; we use the public REST API directly.
// All nutriments are reported per 100g by both APIs.

import { z } from 'zod';

export type BarcodeDataSource = 'open_food_facts' | 'usda' | 'user_corrected';

export type BarcodeProduct = {
  name: string;
  servingDescription: string;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  caloriesKcal: number | null;
  // GLP-1 Watch micronutrients — best-effort from API, user should verify against label
  magnesiumMg: number | null;
  zincMg: number | null;
  b12Mcg: number | null;
  vitaminDIu: number | null;
  ironMg: number | null;
  calciumMg: number | null;
  servingWeightG: number | null; // grams per serving from OFF serving_quantity; null for USDA
  ean: string;
  dataSource: BarcodeDataSource;
};

// ─── Open Food Facts ────────────────────────────────────────────────────────

// OFF stores macros in g/100g; minerals in g/100g (×1000 for mg);
// vitamins in g/100g (×1e6 for mcg; vit-D additionally ×40 for IU).
const offNutrimentsSchema = z
  .object({
    'proteins_100g': z.number().optional(),
    'carbohydrates_100g': z.number().optional(),
    'fat_100g': z.number().optional(),
    'fiber_100g': z.number().optional(),
    'energy-kcal_100g': z.number().optional(),
    'magnesium_100g': z.number().optional(),
    'zinc_100g': z.number().optional(),
    'iron_100g': z.number().optional(),
    'calcium_100g': z.number().optional(),
    'vitamin-b12_100g': z.number().optional(),
    'vitamin-d_100g': z.number().optional(),
  })
  .passthrough();

const offProductSchema = z
  .object({
    product_name: z.string().optional(),
    serving_size: z.string().optional(),
    serving_quantity: z.number().optional(),
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
    if (!response.ok)
      return null;

    const json: unknown = await response.json();
    const parsed = offResponseSchema.safeParse(json);
    if (!parsed.success || parsed.data.status !== 1 || !parsed.data.product)
      return null;

    const product = parsed.data.product;
    const nutriments = product.nutriments ?? {};
    const servingWeightG
      = product.serving_quantity != null && product.serving_quantity > 0
        ? product.serving_quantity
        : null;

    const n = nutriments;
    return {
      name: product.product_name?.trim() || 'Unknown Product',
      servingDescription: product.serving_size?.trim() || '100g',
      proteinG: n.proteins_100g ?? 0,
      carbsG: n.carbohydrates_100g ?? null,
      fatG: n.fat_100g ?? null,
      fiberG: n.fiber_100g ?? null,
      caloriesKcal: n['energy-kcal_100g'] ?? null,
      // Minerals: OFF stores in g/100g → convert to mg
      magnesiumMg: n.magnesium_100g != null ? Math.round(n.magnesium_100g * 1000 * 10) / 10 : null,
      zincMg: n.zinc_100g != null ? Math.round(n.zinc_100g * 1000 * 100) / 100 : null,
      // Vitamins: OFF stores in g/100g → B12: ×1e6 for mcg; D: ×1e6×40 for IU
      b12Mcg: n['vitamin-b12_100g'] != null ? Math.round(n['vitamin-b12_100g'] * 1_000_000 * 100) / 100 : null,
      vitaminDIu: n['vitamin-d_100g'] != null ? Math.round(n['vitamin-d_100g'] * 1_000_000 * 40) : null,
      // Iron: OFF stores in g/100g → ×1000 for mg
      ironMg: n.iron_100g != null ? Math.round(n.iron_100g * 1000 * 100) / 100 : null,
      // Calcium: OFF stores in g/100g → ×1000 for mg
      calciumMg: n.calcium_100g != null ? Math.round(n.calcium_100g * 1000 * 10) / 10 : null,
      servingWeightG,
      ean,
      dataSource: 'open_food_facts',
    };
  }
  catch {
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
  if (!ean.startsWith('0'))
    return null;

  try {
    const apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY ?? 'DEMO_KEY';
    const url
      = `https://api.nal.usda.gov/fdc/v1/foods/search`
        + `?query=${encodeURIComponent(ean)}&dataType=Branded&pageSize=1&api_key=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok)
      return null;

    const json: unknown = await response.json();
    const parsed = usdaResponseSchema.safeParse(json);
    if (!parsed.success)
      return null;

    const food = parsed.data.foods?.[0];
    if (!food)
      return null;

    const nutrientMap = new Map(food.foodNutrients.map(n => [n.nutrientId, n.value]));
    // USDA nutrient IDs: protein=1003, fat=1004, carbs=1005, calories=1008, fiber=1079
    // Minerals (mg): iron=1089, magnesium=1090, zinc=1095 (1087 is calcium, NOT iron)
    // Vitamins (µg): B12=1178, D(D2+D3)=1114 — multiply by 40 to get IU
    const get = (id: number): number | null => nutrientMap.has(id) ? (nutrientMap.get(id) ?? null) : null;
    const proteinG = nutrientMap.get(1003) ?? 0;
    const carbsG = get(1005);
    const fatG = get(1004);
    const fiberG = get(1079);
    const caloriesKcal = get(1008);
    const magnesiumMg = get(1090);
    const zincMg = get(1095);
    const ironMg = get(1089);
    const calciumMg = get(1087);
    const b12Mcg = get(1178);
    const vitaminDRaw = get(1114);
    const vitaminDIu = vitaminDRaw != null ? Math.round(vitaminDRaw * 40) : null;

    return {
      name: food.description,
      servingDescription: '100g',
      proteinG,
      carbsG,
      fatG,
      fiberG,
      caloriesKcal,
      magnesiumMg,
      zincMg,
      b12Mcg,
      vitaminDIu,
      ironMg,
      calciumMg,
      servingWeightG: null,
      ean,
      dataSource: 'usda',
    };
  }
  catch {
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
  if (usda)
    return usda;

  // Return whatever OFF found (possibly incomplete), or null if completely not found
  return off;
}
