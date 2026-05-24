// Food log domain types for DosePath.
// Source: 'manual' | 'barcode' — both free per subscription rules.
// Photo and voice are Pro-only but typed here for completeness.

export interface FoodLogEntry {
  id: string;
  userId: string;
  loggedAt: string; // ISO 8601
  name: string;
  servingDescription: string; // e.g. "1 cup", "100g"
  proteinG: number;
  carbsG: number | null;     // added in migration 012
  fatG: number | null;       // added in migration 012
  fiberG: number | null;
  caloriesKcal: number | null;
  b12Mcg: number | null;     // added in migration 012 (GLP-1 watch)
  vitaminDIu: number | null; // added in migration 012 (GLP-1 watch)
  magnesiumMg: number | null;// added in migration 012 (GLP-1 watch)
  zincMg: number | null;     // added in migration 012 (GLP-1 watch)
  barcodeEan: string | null;
  source: 'manual' | 'barcode' | 'photo' | 'voice';
  createdAt: string; // ISO 8601
}

export interface ManualFoodEntry {
  name: string;
  servingDescription: string;
  proteinG: number;
  fiberG?: number;
  caloriesKcal?: number;
}

// ---------------------------------------------------------------------------
// PhotoFoodEntry — full macro + micronutrient entry for photo-sourced logs.
// All nullable fields are truly optional (AI may not estimate all values).
// ---------------------------------------------------------------------------
export interface PhotoFoodEntry {
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
}

// ---------------------------------------------------------------------------
// FoodCorrection — stored when the user edits an AI-identified food name.
// Only food metadata — never user email or PII (Rule 2).
// ---------------------------------------------------------------------------
export interface FoodCorrection {
  originalAiName: string;
  correctedName: string;
  servingDescription: string;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  caloriesKcal: number | null;
  fiberG: number | null;
}
