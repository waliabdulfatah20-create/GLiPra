export interface ChecklistItem {
  id: string;
  title: string;
  detail: string;
  /** true for items authored as a direct pharmacist note */
  isPharmacistNote: boolean;
}

export const SHOT_DAY_CHECKLIST: ChecklistItem[] = [
  {
    id: 'site-rotation',
    title: 'Site rotation',
    detail:
      'Choose an abdomen site different from last week. Glipra will recommend the next site in your rotation.',
    isPharmacistNote: false,
  },
  {
    id: 'temperature-check',
    title: 'Temperature check',
    detail:
      'If refrigerated: remove pen/vial 30 minutes before injection to reach room temperature.',
    isPharmacistNote: false,
  },
  {
    id: 'hydration',
    title: 'Hydration',
    detail:
      'Drink at least 250 ml of water before your injection. Stay well hydrated today.',
    isPharmacistNote: false,
  },
  {
    id: 'meal-timing',
    title: 'Meal timing',
    detail:
      'You can inject with or without food. If nausea is a concern, try injecting before bed.',
    isPharmacistNote: false,
  },
  {
    id: 'dose-confirmation',
    title: 'Dose confirmation',
    detail:
      'Confirm your dose setting matches your prescriber’s instructions before dialing.',
    isPharmacistNote: false,
  },
  {
    id: 'injection-technique',
    title: 'Injection technique',
    detail:
      'Inject at 90° angle. Hold pen in place for 10 seconds after pressing the button.',
    isPharmacistNote: false,
  },
  {
    id: 'site-care',
    title: 'Site care',
    detail:
      'Do not rub the injection site after administering. This can affect absorption.',
    isPharmacistNote: false,
  },
  {
    id: 'storage',
    title: 'Storage',
    detail:
      'Return unused medication to the refrigerator. Do not freeze. Keep away from light.',
    isPharmacistNote: false,
  },
  {
    id: 'log-injection',
    title: 'Log your injection',
    detail:
      'Tap the Sites tab and use Add Shot to record today\'s injection site, dose, and any notes.',
    isPharmacistNote: false,
  },
  {
    id: 'post-injection-watch',
    title: 'Post-injection watch',
    detail:
      'Most people feel fine. Mild injection site reactions are normal and resolve quickly.',
    isPharmacistNote: true,
  },
];
