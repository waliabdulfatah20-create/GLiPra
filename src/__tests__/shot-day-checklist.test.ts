import { describe, expect, it } from 'vitest';
import {
  CHECKLIST_ITEMS,
  CHECKLIST_ITEM_IDS,
  getChecklistStatus,
} from '@/features/shot-prep/checklist-data';

describe('CHECKLIST_ITEMS', () => {
  it('has exactly 5 items', () => {
    expect(CHECKLIST_ITEMS).toHaveLength(5);
  });
  it('every item has non-empty title and detail', () => {
    for (const item of CHECKLIST_ITEMS) {
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.detail.length).toBeGreaterThan(0);
    }
  });
  it('item IDs match CHECKLIST_ITEM_IDS order', () => {
    expect(CHECKLIST_ITEMS.map((i) => i.id)).toEqual(CHECKLIST_ITEM_IDS);
  });
});

describe('getChecklistStatus', () => {
  it('returns 0 completed when empty', () => {
    const s = getChecklistStatus([]);
    expect(s.completedCount).toBe(0);
    expect(s.totalCount).toBe(CHECKLIST_ITEMS.length);
    expect(s.isDone).toBe(false);
  });
  it('counts only valid item IDs — ignores unknown IDs', () => {
    const s = getChecklistStatus(['hydrated', 'unknown_stale_id', 'breakfast']);
    expect(s.completedCount).toBe(2);
    expect(s.isDone).toBe(false);
  });
  it('isDone true when all 5 valid items present', () => {
    const s = getChecklistStatus([...CHECKLIST_ITEM_IDS]);
    expect(s.completedCount).toBe(5);
    expect(s.isDone).toBe(true);
  });
  it('isDone false when only 4 items', () => {
    const s = getChecklistStatus(CHECKLIST_ITEM_IDS.slice(0, 4));
    expect(s.isDone).toBe(false);
  });
  it('totalCount is always CHECKLIST_ITEMS.length regardless of input', () => {
    expect(getChecklistStatus([]).totalCount).toBe(CHECKLIST_ITEMS.length);
    expect(getChecklistStatus(['hydrated']).totalCount).toBe(CHECKLIST_ITEMS.length);
  });
  it('deduplicates repeated IDs — does not overcount', () => {
    const s = getChecklistStatus(['hydrated', 'hydrated', 'breakfast', 'breakfast']);
    expect(s.completedCount).toBe(2); // only 2 unique valid IDs
    expect(s.isDone).toBe(false);
  });
});
