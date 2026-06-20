// Food log domain types for DosePath.
// Source: 'manual' | 'barcode' — both free per subscription rules.
// Photo and voice are Pro-only but typed here for completeness.

export type FoodLogEntry = {
  id: string;
  userId: string;
  loggedAt: string; // ISO 8601
  name: string;
  servingDescription: string; // e.g. "1 cup", "100g"
  proteinG: number;
  carbsG: number | null; // added in migration 012
  fatG: number | null; // added in migration 012
  fiberG: number | null;
  caloriesKcal: number | null;
  b12Mcg: number | null; // added in migration 012 (GLP-1 watch)
  vitaminDIu: number | null; // added in migration 012 (GLP-1 watch)
  magnesiumMg: number | null;// added in migration 012 (GLP-1 watch)
  zincMg: number | null; // added in migration 012 (GLP-1 watch)
  ironMg: number | null; // added in migration 021 (GLP-1 watch)
  calciumMg: number | null; // added in migration 028 (GLP-1 watch)
  barcodeEan: string | null;
  source: 'manual' | 'barcode' | 'photo' | 'voice' | 'database' | 'supplement';
  createdAt: string; // ISO 8601
};

export type ManualFoodEntry = {
  name: string;
  servingDescription: string;
  proteinG: number;
  fiberG?: number;
  caloriesKcal?: number;
};

// ---------------------------------------------------------------------------
// BarcodeFoodEntry — full macro + micronutrient entry for barcode-sourced logs.
// Mirrors PhotoFoodEntry but includes barcodeEan.
// ---------------------------------------------------------------------------
export type BarcodeFoodEntry = {
  name: string;
  servingDescription: string;
  barcodeEan: string;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  caloriesKcal: number | null;
  magnesiumMg: number | null;
  zincMg: number | null;
  b12Mcg: number | null;
  vitaminDIu: number | null;
  ironMg: number | null;
  calciumMg: number | null;
};

// ---------------------------------------------------------------------------
// PhotoFoodEntry — full macro + micronutrient entry for photo-sourced logs.
// All nullable fields are truly optional (AI may not estimate all values).
// ---------------------------------------------------------------------------
export type PhotoFoodEntry = {
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
  calciumMg: number | null;
};

// ---------------------------------------------------------------------------
// DatabaseFoodEntry — entry built from a seeded `foods` row (Cascade D).
// Same shape as PhotoFoodEntry plus the seed's barcode when present.
// ---------------------------------------------------------------------------
export type DatabaseFoodEntry = PhotoFoodEntry & {
  barcodeEan: string | null;
};

// ---------------------------------------------------------------------------
// SupplementEntry — a per-nutrient supplement quick-add (source 'supplement').
// Carries the 5 micronutrient fields (only one set per entry) and NO macros —
// a supplement is not food. protein_g is written as 0 by insertSupplementLog.
// ---------------------------------------------------------------------------
export type SupplementEntry = {
  name: string;
  servingDescription: string;
  magnesiumMg: number | null;
  zincMg: number | null;
  b12Mcg: number | null;
  vitaminDIu: number | null;
  ironMg: number | null;
  calciumMg: number | null;
};

// ---------------------------------------------------------------------------
// FoodCorrection — stored when the user edits an AI-identified food name.
// Only food metadata — never user email or PII (Rule 2).
// ---------------------------------------------------------------------------
export type FoodCorrection = {
  originalAiName: string;
  correctedName: string;
  servingDescription: string;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
  caloriesKcal: number | null;
  fiberG: number | null;
};
