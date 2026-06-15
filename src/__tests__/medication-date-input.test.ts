import { describe, expect, it } from 'vitest';
import { formatDateInput, isNotFuture, parseMdyToIso } from '@/features/medication/date-input';

describe('isNotFuture', () => {
  const today = '2026-06-14';

  it('accepts today', () => {
    expect(isNotFuture('2026-06-14', today)).toBe(true);
  });

  it('accepts a past date', () => {
    expect(isNotFuture('2026-06-10', today)).toBe(true);
    expect(isNotFuture('2020-01-01', today)).toBe(true);
  });

  it('rejects a future date (the bug that produced "Day -1")', () => {
    expect(isNotFuture('2026-06-15', today)).toBe(false);
    expect(isNotFuture('2099-12-31', today)).toBe(false);
  });
});

describe('parseMdyToIso', () => {
  it('parses a complete MM/DD/YYYY string to ISO', () => {
    expect(parseMdyToIso('06/14/2026')).toBe('2026-06-14');
  });

  it('returns null for incomplete or invalid input', () => {
    expect(parseMdyToIso('06/14')).toBeNull();
    expect(parseMdyToIso('13/40/2026')).toBeNull();
    expect(parseMdyToIso('')).toBeNull();
  });
});

describe('formatDateInput', () => {
  it('masks digits into MM/DD/YYYY as the user types', () => {
    expect(formatDateInput('06')).toBe('06');
    expect(formatDateInput('0614')).toBe('06/14');
    expect(formatDateInput('06142026')).toBe('06/14/2026');
    expect(formatDateInput('06/14/2026')).toBe('06/14/2026');
  });
});
