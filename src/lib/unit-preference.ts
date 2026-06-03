// Unit preference utilities for Glipra.
// All clinical data is stored internally in metric (kg, cm).
// These helpers handle display/input conversion only.
// Preferences are persisted in AsyncStorage — no DB migration needed.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

export type WeightUnit = 'kg' | 'lbs';
export type HeightUnit = 'metric' | 'imperial'; // metric = cm, imperial = ft + in

// ── AsyncStorage keys ──────────────────────────────────────────────────────

const WEIGHT_UNIT_KEY = 'WEIGHT_UNIT';
const HEIGHT_UNIT_KEY = 'HEIGHT_UNIT';

// ── Conversion helpers ─────────────────────────────────────────────────────

/** Convert kg → lbs, 1 decimal place */
export const kgToLbs = (kg: number): number => +(kg * 2.20462).toFixed(1);

/** Convert lbs → kg, 2 decimal places */
export const lbsToKg = (lbs: number): number => +(lbs / 2.20462).toFixed(2);

/** Convert cm → { ft, inches } */
export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalIn = cm / 2.54;
  return { ft: Math.floor(totalIn / 12), inches: Math.round(totalIn % 12) };
}

/** Convert ft + inches → cm, 1 decimal place */
export function ftInToCm(ft: number, inches: number): number {
  return +((ft * 12 + inches) * 2.54).toFixed(1);
}

/** Format a weight value stored in kg for display in the user's preferred unit */
export function formatWeight(kg: number, unit: WeightUnit): string {
  return unit === 'lbs' ? `${kgToLbs(kg)} lbs` : `${kg.toFixed(1)} kg`;
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Read/write the user's weight unit preference. Persists across app launches.
 *  Default is imperial (lbs) since the primary launch market is US-based GLP-1 users;
 *  metric users can flip the toggle once and the choice persists. */
export function useWeightUnit(): { unit: WeightUnit; toggle: () => void } {
  const [unit, setUnit] = React.useState<WeightUnit>('lbs');

  React.useEffect(() => {
    AsyncStorage.getItem(WEIGHT_UNIT_KEY).then((v) => {
      if (v === 'kg' || v === 'lbs')
        setUnit(v);
    });
  }, []);

  const toggle = React.useCallback(() => {
    setUnit((prev) => {
      const next: WeightUnit = prev === 'kg' ? 'lbs' : 'kg';
      AsyncStorage.setItem(WEIGHT_UNIT_KEY, next);
      return next;
    });
  }, []);

  return { unit, toggle };
}

/** Read/write the user's height unit preference. Persists across app launches.
 *  Default is imperial (ft + in) for the same reason as weight. */
export function useHeightUnit(): { unit: HeightUnit; toggle: () => void } {
  const [unit, setUnit] = React.useState<HeightUnit>('imperial');

  React.useEffect(() => {
    AsyncStorage.getItem(HEIGHT_UNIT_KEY).then((v) => {
      if (v === 'metric' || v === 'imperial')
        setUnit(v);
    });
  }, []);

  const toggle = React.useCallback(() => {
    setUnit((prev) => {
      const next: HeightUnit = prev === 'metric' ? 'imperial' : 'metric';
      AsyncStorage.setItem(HEIGHT_UNIT_KEY, next);
      return next;
    });
  }, []);

  return { unit, toggle };
}
