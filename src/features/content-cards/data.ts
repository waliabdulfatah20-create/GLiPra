// Pharmacist-authored educational content cards for the Today screen.
// All cards apply to all GLP-1 medications (medicationIds: []).
// Tier 1 = clinical warning (orange); Tier 2 = educational (neutral).

import type { GLP1MedicationId } from '@/types';

export type CardType = 'tip' | 'warning' | 'milestone' | 'education';

export interface ContentCard {
  id: string;
  title: string;
  body: string;
  cardType: CardType;
  medicationIds: GLP1MedicationId[];
  tier: 1 | 2;
  sortOrder: number;
}

export const CONTENT_CARDS: ContentCard[] = [
  {
    id: 'protein-timing-101',
    title: 'Why Protein Matters More on GLP-1s',
    body:
      'GLP-1 medications reduce appetite significantly, which means the weight you lose can come from both fat and muscle, and muscle loss is the outcome we work hardest to prevent. Research shows that meeting your daily protein target, combined with resistance training, preserves lean mass during caloric restriction. Pharmacist note: The protein floor Glipra calculates for you is built specifically around this evidence, not a generic RDA.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 1,
  },
  {
    id: 'protein-meal-timing',
    title: 'Timing Your Protein',
    body:
      'Spreading your protein across three to four meals throughout the day is more effective for muscle protein synthesis than eating the same total amount in one or two sittings. Aim for 25–40 g of protein per meal whenever appetite allows. Breakfast protein is especially important. After an overnight fast, your muscles are in a depleted state and benefit most from an early amino acid supply.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 2,
  },
  {
    id: 'injection-day-hydration',
    title: 'Staying Hydrated on Injection Day',
    body:
      'GLP-1 medications slow gastric emptying, which can blunt your normal thirst signals, making it easy to fall behind on fluids without realising it. On injection day, target 2–2.5 L of water and sip slowly throughout the day rather than drinking large amounts at once. Pharmacist note: Large rapid fluid intake on an already-slowed stomach is a common trigger for nausea; steady sipping is the practical fix.',
    cardType: 'tip',
    medicationIds: [],
    tier: 1,
    sortOrder: 3,
  },
  {
    id: 'nausea-management',
    title: 'Nausea Management: What Actually Works',
    body:
      'Nausea is most intense during the first 4–8 weeks of treatment as your body adjusts, and it typically improves on its own. Cold or room-temperature foods are easier on a slowed stomach than hot meals; ginger tea and peppermint both have clinical evidence for reducing nausea. Small, frequent protein-rich snacks (rather than skipping meals entirely) help stabilize blood sugar and reduce the risk of muscle loss on difficult days.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 4,
  },
  {
    id: 'peak-suppression-protein',
    title: 'Protein on Peak Suppression Days',
    body:
      'Days 1–2 after your injection are when appetite suppression is strongest, and when the risk of skipping protein is highest. Missing protein on these days is the single most common driver of muscle loss during GLP-1 treatment. Protein shakes, Greek yogurt, cottage cheese, and eggs are all low-volume, high-protein options that are easy to get down even when appetite is near zero.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 5,
  },
  {
    id: 'fiber-partner',
    title: 'Fiber: The Underrated Partner',
    body:
      'Because GLP-1 medications already slow digestion, constipation is one of the most commonly reported complaints, and adequate fiber intake is the primary dietary tool for managing it. Aim for 25–35 g of fiber per day from whole food sources such as vegetables, legumes, berries, and oats. Introduce fiber gradually over one to two weeks; a sudden large increase in fiber on an already-slowed gut can cause bloating and cramping.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 6,
  },
  {
    id: 'beyond-the-scale',
    title: 'Muscle Preservation: Beyond the Scale',
    body:
      'The number on the scale does not tell you whether you are losing fat or muscle. Body composition is what matters. Research consistently shows that losing weight at a pace of around 0.5–1 lb per week, paired with sufficient protein and resistance training, preserves significantly more lean mass than rapid loss. Pharmacist note: Glipra\'s protein floor is calibrated to support this pace of muscle-protective weight loss, not simply to hit a generic macro target.',
    cardType: 'milestone',
    medicationIds: [],
    tier: 2,
    sortOrder: 7,
  },
  {
    id: 'low-protein-signs',
    title: 'Signs You May Need More Protein',
    body:
      'Persistent fatigue that is not explained by poor sleep, noticeable hair thinning starting around the three-month mark, slow wound healing, and feeling cold more than usual can all be signs that protein intake is inadequate. These symptoms are frequently mistaken for medication side effects, but they are also classic markers of insufficient dietary protein. Logging your protein consistently in Glipra is the most reliable way to rule out a shortfall.',
    cardType: 'warning',
    medicationIds: [],
    tier: 2,
    sortOrder: 8,
  },
  {
    id: 'electrolyte-hydration',
    title: 'Hydration Beyond Water',
    body:
      'Electrolytes matter as much as total fluid volume, and GLP-1 users who reduce food intake sharply often underestimate how much sodium, potassium, and magnesium they were getting from food. Low electrolyte intake can cause fatigue, muscle cramps, and headaches that are easy to mistake for medication side effects. On low-appetite days, an electrolyte packet or a low-sugar sports drink can meaningfully close that gap without requiring a full meal.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 9,
  },
  {
    id: 'recovery-window-strategy',
    title: 'What Recovery Window Means for You',
    body:
      'Days 5–7 before your next injection, the recovery window, are when appetite returns, energy is higher, and your body is best positioned to use the nutrients you give it. This is the ideal time for higher-intensity workouts and for intentionally catching up on any protein you fell short on earlier in the week. Using this window with purpose (rather than simply overeating) is one of the most effective habits for protecting muscle during GLP-1 treatment.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 10,
  },
];

/**
 * Returns all content cards sorted by sortOrder.
 * Extend this function in the future to filter by user medication, phase, or subscription tier.
 */
export function getActiveCards(): ContentCard[] {
  return [...CONTENT_CARDS].sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Returns a single card by its slug ID, or undefined if not found.
 */
export function getCardById(id: string): ContentCard | undefined {
  return CONTENT_CARDS.find((c) => c.id === id);
}
