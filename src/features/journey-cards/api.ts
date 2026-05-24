/**
 * Supabase queries for the journey_cards / user_milestones feature.
 *
 * Table: user_milestones
 * Columns: id (uuid), user_id (uuid), milestone_id (text), unlocked_at (timestamptz)
 * Unique constraint: (user_id, milestone_id)
 */

import { supabase } from '@/lib/supabase';
import type { MilestoneId } from '@/features/journey-cards/milestones';

/**
 * Fetch all milestone IDs that have been unlocked for the given user.
 * Returns an empty array if none have been unlocked yet.
 */
export async function fetchUnlockedMilestones(userId: string): Promise<MilestoneId[]> {
  const { data, error } = await supabase
    .from('user_milestones')
    .select('milestone_id, unlocked_at')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: true });

  if (error) {
    throw new Error(`fetchUnlockedMilestones: ${error.message}`);
  }

  return (data ?? []).map((row) => row.milestone_id as MilestoneId);
}

export interface UnlockedMilestone {
  milestoneId: MilestoneId;
  unlockedAt: string; // ISO string
}

/**
 * Fetch all unlocked milestones with their unlock timestamps.
 * Useful for rendering cards with the "Unlocked on {date}" footer.
 */
export async function fetchUnlockedMilestonesWithDates(
  userId: string,
): Promise<UnlockedMilestone[]> {
  const { data, error } = await supabase
    .from('user_milestones')
    .select('milestone_id, unlocked_at')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: true });

  if (error) {
    throw new Error(`fetchUnlockedMilestonesWithDates: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    milestoneId: row.milestone_id as MilestoneId,
    unlockedAt: row.unlocked_at,
  }));
}

/**
 * Mark a milestone as unlocked for the given user.
 * Safe to call multiple times — uses INSERT ... ON CONFLICT DO NOTHING.
 */
export async function unlockMilestone(
  userId: string,
  milestoneId: MilestoneId,
): Promise<void> {
  const { error } = await supabase.from('user_milestones').insert({
    user_id: userId,
    milestone_id: milestoneId,
    unlocked_at: new Date().toISOString(),
  });

  // Ignore duplicate-key errors (milestone already unlocked)
  if (error && error.code !== '23505') {
    throw new Error(`unlockMilestone: ${error.message}`);
  }
}
