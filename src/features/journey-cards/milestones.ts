/**
 * Journey Cards milestone definitions.
 * Each milestone is a shareable artifact that unlocks as the user progresses.
 */

export type MilestoneId
  = | 'week_1_complete'
    | 'protein_streak_7'
    | 'protein_streak_30'
    | 'first_checkin'
    | 'weight_logged_10x'
    | 'injection_day_warrior'
    | '3_months_strong'
    | 'coach_conversation';

export type Milestone = {
  id: MilestoneId;
  title: string;
  subtitle: string;
  emoji: string;
  accentColor: string;
  shareText: string;
};

export const MILESTONES: Record<MilestoneId, Milestone> = {
  'week_1_complete': {
    id: 'week_1_complete',
    title: 'Week 1 Complete',
    subtitle: 'First 7 days on your GLP-1 journey',
    emoji: '🎯',
    accentColor: '#6d28d9',
    shareText:
      'Week 1 on my GLP-1 journey complete! Tracking with GLiPra to protect my muscle. 💪',
  },

  'protein_streak_7': {
    id: 'protein_streak_7',
    title: 'Protein Streak: 7 Days',
    subtitle: 'Hit your protein goal 7 days in a row',
    emoji: '🔥',
    accentColor: '#22C55E',
    shareText:
      '7-day protein streak on GLiPra! Staying consistent so GLP-1 works without stealing my muscle. 💪🥩',
  },

  'protein_streak_30': {
    id: 'protein_streak_30',
    title: 'Protein Streak: 30 Days',
    subtitle: 'Hit your protein goal 30 days in a row',
    emoji: '⚡',
    accentColor: '#22C55E',
    shareText:
      '30-day protein streak: a full month of protecting my muscle while on GLP-1! GLiPra keeps me honest. 💪⚡',
  },

  'first_checkin': {
    id: 'first_checkin',
    title: 'First Check-in',
    subtitle: 'Logged your first daily check-in',
    emoji: '✅',
    accentColor: '#6d28d9',
    shareText:
      'Logged my first daily check-in on GLiPra. Designed by a licensed pharmacist to keep GLP-1 journeys safe. ✅',
  },

  'weight_logged_10x': {
    id: 'weight_logged_10x',
    title: 'Tracking Champion',
    subtitle: 'Logged your weight 10 times',
    emoji: '📊',
    accentColor: '#3B82F6',
    shareText:
      '10 weight logs in: watching the trend, not the number. GLiPra helps me track what matters on GLP-1. 📊',
  },

  'injection_day_warrior': {
    id: 'injection_day_warrior',
    title: 'Injection Day Warrior',
    subtitle: 'Logged on your injection day',
    emoji: '💉',
    accentColor: '#8B5CF6',
    shareText:
      'Injection day and still showing up. GLiPra helps me navigate every phase of my GLP-1 cycle. 💉💪',
  },

  '3_months_strong': {
    id: '3_months_strong',
    title: '3 Months Strong',
    subtitle: '90 days on your GLP-1 journey',
    emoji: '🏆',
    accentColor: '#6d28d9',
    shareText:
      '3 months on my GLP-1 journey! Still going strong with GLiPra keeping my nutrition dialed in. 🏆',
  },

  'coach_conversation': {
    id: 'coach_conversation',
    title: 'First Coaching Session',
    subtitle: 'Had your first AI Nutrition Coach conversation',
    emoji: '💬',
    accentColor: '#6d28d9',
    shareText:
      'Just got personalized nutrition guidance from the GLiPra AI Coach, pharmacist-designed for GLP-1 users. 💬',
  },
};
