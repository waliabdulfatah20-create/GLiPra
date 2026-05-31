import type { SiteCode } from '@/types';

export type { SiteCode };

export const SITE_LABELS: Record<SiteCode, string> = {
  stomach_upper_left: 'Stomach - Upper Left',
  stomach_upper_mid: 'Stomach - Upper Mid',
  stomach_upper_right: 'Stomach - Upper Right',
  stomach_lower_left: 'Stomach - Lower Left',
  stomach_lower_mid: 'Stomach - Lower Mid',
  stomach_lower_right: 'Stomach - Lower Right',
};

// Serpentine rotation order — left-to-right top row, right-to-left bottom row.
// This pattern spaces consecutive injections maximally apart to avoid local
// tissue stress and lipohypertrophy.
export const SITE_ROTATION_ORDER: SiteCode[] = [
  'stomach_upper_left',
  'stomach_upper_mid',
  'stomach_upper_right',
  'stomach_lower_right',
  'stomach_lower_mid',
  'stomach_lower_left',
];

// Days before a site can be reused (clinical standard for GLP-1 rotation).
export const REST_DAYS = 7;

// Display options for the Select dropdown — order matches rotation order.
export const SITE_OPTIONS: { label: string; value: SiteCode }[]
  = SITE_ROTATION_ORDER.map(code => ({
    label: SITE_LABELS[code],
    value: code,
  }));
