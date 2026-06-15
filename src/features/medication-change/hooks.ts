// React Query hooks for the in-app medication / route switch.

import type { MedicationChangeRecord } from './api';
import type { MedicationSelection } from './switch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { format } from 'date-fns';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { calculateInjectionPhase } from '@/features/injection-cycle/calculator';
import { useTodayProfile } from '@/features/today/hooks';
import { analytics, EVENTS } from '@/lib/analytics';
import { notifications } from '@/lib/notifications';
import { changeMedication, fetchMedicationChanges } from './api';
import { buildMedicationSwitch } from './switch';

const INTERVAL_DAYS: Record<'weekly' | 'biweekly' | 'daily', number> = {
  weekly: 7,
  biweekly: 14,
  daily: 1,
};

/** After a switch: reschedule the NEW route's reminder when its pref is enabled. */
async function rescheduleForNewRoute(selection: MedicationSelection): Promise<void> {
  try {
    if (selection.schedule.route === 'oral') {
      const enabled = await AsyncStorage.getItem('NOTIF_ORAL_DOSE_ENABLED');
      if (enabled === 'true')
        await notifications.scheduleOralDoseReminder(selection.schedule.doseTimeLocal);
      return;
    }
    const enabled = await AsyncStorage.getItem('NOTIF_INJECTION_ENABLED');
    if (enabled !== 'true')
      return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const cycle = calculateInjectionPhase({
      lastInjectionDate: selection.schedule.lastInjectionDate,
      today,
      injectionIntervalDays: INTERVAL_DAYS[selection.schedule.frequency],
    });
    if (cycle.nextInjectionDate)
      await notifications.scheduleInjectionReminder(cycle.nextInjectionDate);
  }
  catch {
    // Notifications are non-critical.
  }
}

export function useChangeMedication(): {
  mutate: (selection: MedicationSelection) => void;
  isLoading: boolean;
  isSuccess: boolean;
} {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;
  const { data: profile } = useTodayProfile();

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (selection: MedicationSelection) => {
      if (!userId)
        throw new Error('Not authenticated');
      const { profilePatch, historyRow, cancelNotifications } = buildMedicationSwitch(
        {
          medicationId: profile?.medicationId ?? null,
          route: profile?.administrationRoute ?? null,
        },
        selection,
      );
      await changeMedication(userId, profilePatch, historyRow);
      await Promise.all(cancelNotifications.map(id => notifications.cancel(id)));
      await rescheduleForNewRoute(selection);
    },
    onSuccess: (_data, selection) => {
      analytics.capture(EVENTS.MEDICATION_CHANGED, {
        to_medication_id: selection.medicationId,
        to_route: selection.schedule.route,
      });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['today-profile'] });
        queryClient.invalidateQueries({ queryKey: ['oral-dose-logs', userId] });
        queryClient.invalidateQueries({ queryKey: ['injection-logs', userId] });
        queryClient.invalidateQueries({ queryKey: ['medication-changes', userId] });
        queryClient.invalidateQueries({ queryKey: ['visit-prep'] });
      }
    },
  });

  return { mutate, isLoading: isPending, isSuccess };
}

export function useMedicationHistory(): {
  history: MedicationChangeRecord[];
  isLoading: boolean;
} {
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  const { data, isLoading } = useQuery({
    queryKey: ['medication-changes', userId],
    queryFn: () => fetchMedicationChanges(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return { history: data ?? [], isLoading };
}
