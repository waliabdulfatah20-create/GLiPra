// Pharmacist-authored shot day prep checklist.
// Content locked — do not rewrite without pharmacist review (CLAUDE.md liability rules).

export type ChecklistItemId =
  | 'hydrated'
  | 'breakfast'
  | 'rotate_site'
  | 'anti_nausea'
  | 'protein_plan';

export const CHECKLIST_ITEM_IDS: readonly ChecklistItemId[] = [
  'hydrated',
  'breakfast',
  'rotate_site',
  'anti_nausea',
  'protein_plan',
];

export interface ChecklistItem {
  id: ChecklistItemId;
  title: string;
  detail: string;
  isPharmacistNote?: boolean;
}

export const CHECKLIST_ITEMS: ReadonlyArray<ChecklistItem> = [
  {
    id: 'hydrated',
    title: 'Drink 8+ oz of water',
    detail: 'Hydrating before your injection reduces nausea. Do this before coffee.',
    isPharmacistNote: true,
  },
  {
    id: 'breakfast',
    title: 'Eat a light protein-rich breakfast',
    detail: 'Greek yogurt or eggs. An empty stomach worsens GLP-1 side effects.',
    isPharmacistNote: true,
  },
  {
    id: 'rotate_site',
    title: 'Rotate your injection site',
    detail: "Today's recommended site is shown in the Injection Sites tab.",
  },
  {
    id: 'anti_nausea',
    title: 'Have anti-nausea food nearby',
    detail: 'Crackers, ginger tea, or peppermint. Keep them accessible for 2-3 hours post-injection.',
    isPharmacistNote: true,
  },
  {
    id: 'protein_plan',
    title: 'Plan your protein meal 2 hours post-injection',
    detail: 'A protein-forward meal or shake ~2 hours after helps blunt the nausea window.',
  },
];

export interface ChecklistStatus {
  completedCount: number;
  totalCount: number;
  isDone: boolean;
}

/**
 * Derives completion status from an array of completed item IDs.
 * Unknown IDs are silently ignored (defensive against stale DB data).
 */
export function getChecklistStatus(completedItemIds: string[]): ChecklistStatus {
  const validIds = new Set<string>(CHECKLIST_ITEM_IDS);
  const completedCount = new Set(completedItemIds.filter((id) => validIds.has(id))).size;
  const totalCount = CHECKLIST_ITEMS.length;
  return { completedCount, totalCount, isDone: completedCount === totalCount };
}
