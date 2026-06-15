import type { CurrentMedication, MedicationSelection } from '@/features/medication-change/switch';
import { describe, expect, it } from 'vitest';
import { buildMedicationSwitch } from '@/features/medication-change/switch';
import { getMedicationRoute, MEDICATIONS } from '@/features/medication/medications';

const oralCurrent: CurrentMedication = { medicationId: 'semaglutide_rybelsus', route: 'oral' };
const injCurrent: CurrentMedication = { medicationId: 'semaglutide_ozempic', route: 'injection' };

function injSelection(over: Partial<MedicationSelection> = {}): MedicationSelection {
  return {
    medicationId: 'semaglutide_ozempic',
    status: 'starting',
    schedule: { route: 'injection', frequency: 'weekly', dayOfWeek: 1, lastInjectionDate: '2026-06-10' },
    ...over,
  };
}
function oralSelection(over: Partial<MedicationSelection> = {}): MedicationSelection {
  return {
    medicationId: 'semaglutide_rybelsus',
    status: 'starting',
    schedule: { route: 'oral', doseTimeLocal: '08:00', medicationStartDate: '2026-06-12' },
    ...over,
  };
}

describe('medications route map', () => {
  it('marks only Rybelsus + Orforglipron as oral; everything else injection', () => {
    const oral = MEDICATIONS.filter(m => m.route === 'oral').map(m => m.id).sort();
    expect(oral).toEqual(['orforglipron', 'semaglutide_rybelsus']);
    expect(getMedicationRoute('tirzepatide_mounjaro')).toBe('injection');
    expect(getMedicationRoute('orforglipron')).toBe('oral');
    expect(getMedicationRoute('unknown')).toBe('injection'); // safe fallback
  });
});

describe('buildMedicationSwitch', () => {
  it('oral -> injection sets injection fields, clears oral fields, cancels injection-only', () => {
    const { profilePatch, historyRow, cancelNotifications }
      = buildMedicationSwitch(oralCurrent, injSelection());
    expect(profilePatch.administration_route).toBe('injection');
    expect(profilePatch.dose_frequency).toBe('weekly');
    expect(profilePatch.injection_day_of_week).toBe(1);
    expect(profilePatch.last_injection_date).toBe('2026-06-10');
    expect(profilePatch.dose_time_local).toBeNull();
    expect(profilePatch.medication_start_date).toBeNull();
    expect(profilePatch.medication_status).toBe('starting');
    expect(profilePatch.phase).toBe('weight_loss');
    expect(historyRow).toEqual({
      from_medication_id: 'semaglutide_rybelsus',
      from_route: 'oral',
      to_medication_id: 'semaglutide_ozempic',
      to_route: 'injection',
    });
    expect(cancelNotifications).toEqual(['injection-reminder', 'oral-dose-reminder', 'oral-absorption-clear']);
  });

  it('injection -> oral sets oral fields, clears injection fields, cancels the injection reminder', () => {
    const { profilePatch, historyRow, cancelNotifications }
      = buildMedicationSwitch(injCurrent, oralSelection({ status: 'active' }));
    expect(profilePatch.administration_route).toBe('oral');
    expect(profilePatch.dose_time_local).toBe('08:00');
    expect(profilePatch.medication_start_date).toBe('2026-06-12');
    expect(profilePatch.dose_frequency).toBe('daily');
    expect(profilePatch.injection_day_of_week).toBeNull();
    expect(profilePatch.last_injection_date).toBeNull();
    expect(profilePatch.medication_status).toBe('active');
    expect(historyRow.from_route).toBe('injection');
    expect(historyRow.to_route).toBe('oral');
    expect(cancelNotifications).toEqual(['injection-reminder', 'oral-dose-reminder', 'oral-absorption-clear']);
  });

  it('daily injection clears the day-of-week even if one was passed', () => {
    const { profilePatch } = buildMedicationSwitch(
      oralCurrent,
      injSelection({ schedule: { route: 'injection', frequency: 'daily', dayOfWeek: 3, lastInjectionDate: '2026-06-10' } }),
    );
    expect(profilePatch.dose_frequency).toBe('daily');
    expect(profilePatch.injection_day_of_week).toBeNull();
  });

  it('same-route injection -> injection (Ozempic -> Mounjaro) keeps route, updates med', () => {
    const { profilePatch, historyRow } = buildMedicationSwitch(
      injCurrent,
      injSelection({ medicationId: 'tirzepatide_mounjaro' }),
    );
    expect(profilePatch.administration_route).toBe('injection');
    expect(profilePatch.medication_id).toBe('tirzepatide_mounjaro');
    expect(historyRow.from_medication_id).toBe('semaglutide_ozempic');
    expect(historyRow.to_medication_id).toBe('tirzepatide_mounjaro');
  });

  it('same-route oral -> oral (Rybelsus -> Orforglipron) keeps oral', () => {
    const { profilePatch, cancelNotifications } = buildMedicationSwitch(
      oralCurrent,
      oralSelection({ medicationId: 'orforglipron' }),
    );
    expect(profilePatch.administration_route).toBe('oral');
    expect(profilePatch.medication_id).toBe('orforglipron');
    expect(cancelNotifications).toEqual(['injection-reminder', 'oral-dose-reminder', 'oral-absorption-clear']);
  });

  it('derives the route from the chosen medication, not the passed schedule label', () => {
    // medication is injection; schedule says injection -> route injection
    const { profilePatch } = buildMedicationSwitch(oralCurrent, injSelection());
    expect(profilePatch.administration_route).toBe('injection');
  });

  it('tolerates a null current medication (defensive history row)', () => {
    const { historyRow } = buildMedicationSwitch({ medicationId: null, route: null }, injSelection());
    expect(historyRow.from_medication_id).toBeNull();
    expect(historyRow.from_route).toBeNull();
  });
});
