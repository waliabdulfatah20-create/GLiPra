// Barcode lookup using the Open Food Facts API v2.
// @openfoodfacts/openfoodfacts-nodejs is NOT installed; we use the public REST API directly.
// All nutriments are reported per 100g by the OFF API.

import { z } from 'zod';

export interface BarcodeProduct {
  name: string;
  servingDescription: string;
  proteinG: number;
  fiberG: number | null;
  caloriesKcal: number | null;
  ean: string;
}

// ---------------------------------------------------------------------------
// Zod schema — validates the OFF API v2 response
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// lookupBarcode
// Returns null if the product is not found or a network/parse error occurs.
// Never throws — callers should treat null as "not found".
// ---------------------------------------------------------------------------
export async function lookupBarcode(ean: string): Promise<BarcodeProduct | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json`;

    const response = await fetch(url, {
      headers: {
        // OFF recommends identifying the app in User-Agent
        'User-Agent': 'Glipra/1.0 (contact@glipra.com)',
      },
    });

    if (!response.ok) return null;

    const json: unknown = await response.json();
    const parsed = offResponseSchema.safeParse(json);

    if (!parsed.success || parsed.data.status !== 1 || !parsed.data.product) {
      return null;
    }

    const product = parsed.data.product;
    const nutriments = product.nutriments ?? {};

    const name = product.product_name?.trim() || 'Unknown Product';
    const servingDescription = product.serving_size?.trim() || '100g';
    const proteinG = nutriments.proteins_100g ?? 0;
    const fiberG = nutriments.fiber_100g != null ? nutriments.fiber_100g : null;
    const caloriesKcal =
      nutriments['energy-kcal_100g'] != null ? nutriments['energy-kcal_100g'] : null;

    return {
      name,
      servingDescription,
      proteinG,
      fiberG,
      caloriesKcal,
      ean,
    };
  } catch {
    // Network error or JSON parse failure — return null, never crash
    return null;
  }
}
