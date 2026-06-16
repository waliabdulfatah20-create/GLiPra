import type { MedicationChangeRecord } from '@/features/medication-change/api';
import { describe, expect, it } from 'vitest';
import {
  daysSinceLastDose,
  injectionPhaseLabel,
  medicationChangeToPdfRow,
  medicationIdToName,
  oralPhaseLabel,
} from '@/features/visit-prep/summary';

function makeChange(over: Partial<MedicationChangeRecord>): MedicationChangeRecord {
  return {
    id: 'c1',
    changedAt: '2026-06-01T10:00:00',
    fromMedicationId: 'semaglutide_ozempic',
    fromRoute: 'injection',
    toMedicationId: 'tirzepatide_mounjaro',
    toRoute: 'injection',
    ...over,
  };
}

describe('medicationIdToName', () => {
  it('maps injection medication ids', () => {
    expect(medicationIdToName('semaglutide_ozempic')).toBe('Semaglutide (Ozempic)');
    expect(medicationIdToName('tirzepatide_mounjaro')).toBe('Tirzepatide (Mounjaro)');
  });

  it('maps oral medication ids', () => {
    expect(medicationIdToName('semaglutide_rybelsus')).toBe('Semaglutide (Rybelsus)');
    expect(medicationIdToName('orforglipron')).toBe('Orforglipron');
  });

  it('falls through to the raw id for unknown meds', () => {
    expect(medicationIdToName('some_new_med')).toBe('some_new_med');
  });

  it('returns null for null/undefined', () => {
    expect(medicationIdToName(null)).toBeNull();
    expect(medicationIdToName(undefined)).toBeNull();
  });
});

describe('injectionPhaseLabel', () => {
  it('maps known phases', () => {
    expect(injectionPhaseLabel('injection_day')).toBe('Injection Day');
    expect(injectionPhaseLabel('overdue')).toBe('Overdue');
  });

  it('falls through and handles null', () => {
    expect(injectionPhaseLabel('mystery')).toBe('mystery');
    expect(injectionPhaseLabel(null)).toBeNull();
  });
});

describe('oralPhaseLabel', () => {
  it('maps all oral phases', () => {
    expect(oralPhaseLabel('building')).toBe('Building to steady state');
    expect(oralPhaseLabel('steady_state')).toBe('At steady state');
    expect(oralPhaseLabel('dose_due')).toBe('Today\'s dose due');
    expect(oralPhaseLabel('dose_missed')).toBe('Dose missed');
  });

  it('falls through and handles null', () => {
    expect(oralPhaseLabel('mystery')).toBe('mystery');
    expect(oralPhaseLabel(null)).toBeNull();
    expect(oralPhaseLabel(undefined)).toBeNull();
  });
});

describe('daysSinceLastDose', () => {
  it('returns 0 for a dose taken the same calendar day', () => {
    expect(daysSinceLastDose('2026-06-06T07:30:00', '2026-06-06')).toBe(0);
  });

  it('counts whole calendar days for prior doses', () => {
    expect(daysSinceLastDose('2026-06-04T07:30:00', '2026-06-06')).toBe(2);
    expect(daysSinceLastDose('2026-06-05T23:59:00', '2026-06-06')).toBe(1);
  });

  it('returns null when there is no dose on record', () => {
    expect(daysSinceLastDose(null, '2026-06-06')).toBeNull();
    expect(daysSinceLastDose(undefined, '2026-06-06')).toBeNull();
  });
});

describe('medicationChangeToPdfRow', () => {
  it('formats the date and an injection-to-injection brand transition', () => {
    expect(medicationChangeToPdfRow(makeChange({}))).toEqual({
      date: 'Jun 1, 2026',
      transition: 'Ozempic -> Mounjaro',
    });
  });

  it('renders an injection-to-oral switch', () => {
    expect(
      medicationChangeToPdfRow(
        makeChange({ toMedicationId: 'semaglutide_rybelsus', toRoute: 'oral' }),
      ).transition,
    ).toBe('Ozempic -> Rybelsus / Oral Wegovy');
  });

  it('shows Unknown when there is no prior medication (first switch)', () => {
    expect(
      medicationChangeToPdfRow(makeChange({ fromMedicationId: null, fromRoute: null })).transition,
    ).toBe('Unknown -> Mounjaro');
  });

  it('falls back to the raw id for an unknown target medication', () => {
    expect(
      medicationChangeToPdfRow(makeChange({ toMedicationId: 'some_new_med' })).transition,
    ).toBe('Ozempic -> some_new_med');
  });
});
