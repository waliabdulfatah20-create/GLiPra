// Pharmacist-authored guidance cards for users in maintenance phase.
// These are static, pre-written by a licensed pharmacist.
// Never auto-generated or modified by AI.

export type MaintenanceGuide = {
  id: string;
  title: string;
  body: string; // 2–4 sentences
};

export const MAINTENANCE_GUIDES: MaintenanceGuide[] = [
  {
    id: 'maintenance_protein_floor',
    title: 'Your Protein Floor in Maintenance',
    body:
      'During weight maintenance your calorie target decreases slightly, so your protein floor is adjusted to 90% of your active-phase goal. This 10% reduction still gives your muscles more than enough material to stay strong while reducing the risk of consuming excess protein at a lower overall calorie intake. Pharmacist note: Keep your daily protein within the adjusted range. Going significantly under increases the chance of losing lean mass even after your weight has stabilized.',
  },
  {
    id: 'maintenance_exercise_transition',
    title: 'Shifting Your Exercise Focus',
    body:
      'As your goal transitions from weight loss to weight preservation, resistance training becomes the most important tool in your routine. Two to three sessions of strength-based exercise per week are enough to signal your muscles to hold their mass. If you have only been doing cardio, adding even basic bodyweight work (squats, push-ups, resistance bands) makes a meaningful difference.',
  },
  {
    id: 'maintenance_weight_fluctuation',
    title: 'Weight Fluctuations Are Normal',
    body:
      'Daily weight can shift by 1–3 pounds based on fluid retention, salt intake, hormone cycles, and bowel activity, none of which reflect real fat change. Focus on your smoothed (EWMA) weight trend over two to four weeks rather than single-day readings. A stable or slowly declining EWMA is the goal; short spikes are expected and not a reason to change your plan.',
  },
  {
    id: 'maintenance_rebound_monitoring',
    title: 'Monitoring for Rebound',
    body:
      'Most weight regain after GLP-1 use happens gradually over 6–12 months, which is why consistent tracking matters more now than ever. If your smoothed weight rises by more than 5% above your maintenance target over a 4-week period, that is a signal worth discussing with your prescriber, not a reason to panic. Early action is always easier than late-stage correction.',
  },
  {
    id: 'maintenance_contact_prescriber',
    title: 'When to Check In With Your Prescriber',
    body:
      'Routine maintenance does not require frequent medical visits, but certain signals warrant a conversation: steady weight gain over 4+ weeks, a significant drop in appetite, new fatigue, or any side effects that started during your medication taper. Your prescriber may adjust your plan or consider re-initiation depending on your goals and circumstances. Never make changes to your medication without their guidance.',
  },
];
