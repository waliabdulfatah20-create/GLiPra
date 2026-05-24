// Pharmacist-authored guidance cards for users who have discontinued GLP-1 therapy.
// These are static, pre-written by a licensed pharmacist.
// Never auto-generated or modified by AI.

import type { MaintenanceGuide } from '@/features/medication-status/maintenance-guidance';

export const DISCONTINUATION_GUIDES: MaintenanceGuide[] = [
  {
    id: 'disco_appetite_return',
    title: 'Understanding Appetite Changes After Stopping',
    body:
      'GLP-1 medications slow gastric emptying and reduce hunger signals, so when you stop, those hunger signals gradually return, often within 1–4 weeks depending on the specific medication and dose. This is a normal physiological process, not a sign that something went wrong. Pharmacist note: Expect appetite to feel stronger than it did on medication, especially in the first month. Planning protein-first meals ahead of time helps manage this transition without relying on willpower alone.',
  },
  {
    id: 'disco_protein_importance',
    title: 'Why Protein Matters More Now',
    body:
      'Muscle preservation is your highest nutritional priority after discontinuing. Without the appetite-suppressing effect of the medication, calorie intake often increases before food choices fully adjust, and muscle tissue is the first to be broken down when energy balance tips the wrong way. Meeting your full protein floor every day is the most evidence-based action you can take to protect the lean mass you worked to preserve during treatment.',
  },
  {
    id: 'disco_weight_monitoring',
    title: 'Tracking Your Weight After Stopping',
    body:
      'Research shows that about half the weight lost during GLP-1 therapy is regained within a year of stopping, mostly as fat rather than muscle, but this is not inevitable. Regular weigh-ins (daily or several times per week) combined with protein tracking give you the earliest possible signal if your weight is trending upward. Catching a 3–5 lb gain early is far easier to address than catching a 15 lb gain later.',
  },
  {
    id: 'disco_muscle_loss_risk',
    title: 'When Muscle Loss Risk Is Highest',
    body:
      'The 8–16 weeks immediately after stopping GLP-1 therapy represent the highest-risk window for muscle loss. Appetite returns while new eating habits are still forming, and some people also reduce exercise as medication-driven energy improvements fade. Staying consistent with protein targets and at least 2 resistance training sessions per week during this window has the greatest protective effect on your body composition.',
  },
  {
    id: 'disco_long_term_habits',
    title: 'Building Habits That Outlast the Medication',
    body:
      'GLP-1 therapy creates a window of opportunity for building sustainable habits. It is not a permanent fix on its own. The routines you established around protein intake, movement, and mindful eating are real skills you still have. Give yourself credit for what changed during treatment: those behaviors belong to you now. If you find yourself struggling, this app is still here to support your protein goals and weight monitoring, no medication required.',
  },
];
