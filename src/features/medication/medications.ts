// Single source of truth for the supported GLP-1 medications + their administration
// route. Used by onboarding (medication selection) AND the in-app "Change medication"
// switch flow, so the list never drifts between the two. Route is derived from the
// medication id (Rybelsus / Orforglipron = oral tablet; everything else = injection).

import type { AdministrationRoute, GLP1MedicationId } from '@/types';

export type MedicationOption = {
  id: GLP1MedicationId;
  brand: string;
  molecule: string;
  route: AdministrationRoute;
};

export const MEDICATIONS: MedicationOption[] = [
  { id: 'semaglutide_wegovy', brand: 'Wegovy', molecule: 'Semaglutide', route: 'injection' },
  { id: 'semaglutide_ozempic', brand: 'Ozempic', molecule: 'Semaglutide', route: 'injection' },
  { id: 'tirzepatide_zepbound', brand: 'Zepbound', molecule: 'Tirzepatide', route: 'injection' },
  { id: 'tirzepatide_mounjaro', brand: 'Mounjaro', molecule: 'Tirzepatide', route: 'injection' },
  { id: 'liraglutide_saxenda', brand: 'Saxenda', molecule: 'Liraglutide', route: 'injection' },
  { id: 'liraglutide_victoza', brand: 'Victoza', molecule: 'Liraglutide', route: 'injection' },
  { id: 'dulaglutide_trulicity', brand: 'Trulicity', molecule: 'Dulaglutide', route: 'injection' },
  { id: 'semaglutide_rybelsus', brand: 'Rybelsus / Oral Wegovy', molecule: 'Oral Semaglutide · daily tablet', route: 'oral' },
  { id: 'orforglipron', brand: 'Orforglipron', molecule: 'Oral GLP-1 · daily tablet', route: 'oral' },
  { id: 'compounded_semaglutide', brand: 'Compounded Semaglutide', molecule: 'Semaglutide', route: 'injection' },
  { id: 'compounded_tirzepatide', brand: 'Compounded Tirzepatide', molecule: 'Tirzepatide', route: 'injection' },
  { id: 'compounded_glp1_gip', brand: 'Compounded GLP-1/GIP', molecule: 'GLP-1 / GIP', route: 'injection' },
];

export function getMedication(id: string | null | undefined): MedicationOption | undefined {
  return id ? MEDICATIONS.find(m => m.id === id) : undefined;
}

/** Route for a medication id; falls back to 'injection' for unknown ids (matches onboarding). */
export function getMedicationRoute(id: string | null | undefined): AdministrationRoute {
  return getMedication(id)?.route ?? 'injection';
}

/** Brand label for a medication id; falls back to the raw id when unknown. */
export function getMedicationBrand(id: string | null | undefined): string {
  return getMedication(id)?.brand ?? (id ?? '');
}
