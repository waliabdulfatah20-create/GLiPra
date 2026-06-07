import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { supabase } from '@/lib/supabase';

/**
 * Write a new `dose_time_local` value to the user's profile.
 * Format: 'HH:mm:ss' (Postgres TIME column).
 */
export async function updateDoseTime(userId: string, doseTimeLocal: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ dose_time_local: doseTimeLocal })
    .eq('user_id', userId);
  if (error) {
    throw new Error(error.message);
  }
}

/**
 * React Query mutation hook that writes `dose_time_local` and invalidates
 * the today-profile cache so the Dose hub re-reads the updated time.
 */
export function useUpdateDoseTime() {
  const queryClient = useQueryClient();
  const session = useAuthStore.use.session();
  const userId = session?.user.id;

  return useMutation({
    mutationFn: (doseTimeLocal: string) => {
      if (!userId) {
        throw new Error('Not authenticated');
      }
      return updateDoseTime(userId, doseTimeLocal);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['today-profile', userId] });
    },
  });
}
