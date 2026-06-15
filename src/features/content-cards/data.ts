// Pharmacist-authored educational content cards for the Today screen.
// All cards apply to all GLP-1 medications (medicationIds: []).
// Tier 1 = clinical warning (orange); Tier 2 = educational (neutral).
//
// keyTakeaway  — 1-sentence bold headline shown in the spotlight card
// phases       — injection phases this card is most relevant to; omit for universal
// route        — administration route this card is exclusive to; omit for universal
//                (a card with route: 'oral' is hidden from injection users and vice versa)

import type { AdministrationRoute, GLP1MedicationId, InjectionPhase } from '@/types';

export type CardType = 'tip' | 'warning' | 'milestone' | 'education';

export type ContentCard = {
  id: string;
  title: string;
  body: string;
  keyTakeaway: string;
  phases?: InjectionPhase[];
  /** Restrict this card to one administration route. Omit for universal cards. */
  route?: AdministrationRoute;
  cardType: CardType;
  medicationIds: GLP1MedicationId[];
  tier: 1 | 2;
  sortOrder: number;
};

export const CONTENT_CARDS: ContentCard[] = [
  {
    id: 'protein-timing-101',
    title: 'Why Protein Matters More on GLP-1s',
    keyTakeaway: 'Protein is the only thing standing between GLP-1 and your muscle.',
    body:
      'GLP-1 medications reduce appetite significantly, which means the weight you lose can come from both fat and muscle, and muscle loss is the outcome we work hardest to prevent. Research shows that meeting your daily protein target, combined with resistance training, preserves lean mass during caloric restriction. Pharmacist note: The protein floor GLiPra calculates for you is built specifically around this evidence, not a generic RDA.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 1,
  },
  {
    id: 'protein-meal-timing',
    title: 'Timing Your Protein',
    keyTakeaway: 'Spread protein across 3-4 meals, 25-40g each, for best muscle synthesis.',
    body:
      'Spreading your protein across three to four meals throughout the day is more effective for muscle protein synthesis than eating the same total amount in one or two sittings. Aim for 25-40 g of protein per meal whenever appetite allows. Breakfast protein is especially important. After an overnight fast, your muscles are in a depleted state and benefit most from an early amino acid supply.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 2,
  },
  {
    id: 'injection-day-hydration',
    title: 'Staying Hydrated on Injection Day',
    keyTakeaway: 'Sip water slowly all day: large amounts at once make nausea worse.',
    phases: ['injection_day'],
    body:
      'GLP-1 medications slow gastric emptying, which can blunt your normal thirst signals, making it easy to fall behind on fluids without realising it. On injection day, target 2-2.5 L of water and sip slowly throughout the day rather than drinking large amounts at once. Pharmacist note: Large rapid fluid intake on an already-slowed stomach is a common trigger for nausea; steady sipping is the practical fix.',
    cardType: 'tip',
    medicationIds: [],
    tier: 1,
    sortOrder: 3,
  },
  {
    id: 'nausea-management',
    title: 'Nausea Management: What Actually Works',
    keyTakeaway: 'Cold foods, ginger tea, and small protein snacks beat nausea better than skipping meals.',
    phases: ['injection_day', 'peak_suppression'],
    body:
      'Nausea is most intense during the first 4-8 weeks of treatment as your body adjusts, and it typically improves on its own. Cold or room-temperature foods are easier on a slowed stomach than hot meals; ginger tea and peppermint both have clinical evidence for reducing nausea. Small, frequent protein-rich snacks (rather than skipping meals entirely) help stabilize blood sugar and reduce the risk of muscle loss on difficult days.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 4,
  },
  {
    id: 'peak-suppression-protein',
    title: 'Protein on Peak Suppression Days',
    keyTakeaway: 'These are the days muscle loss risk is highest: protein is non-negotiable.',
    phases: ['peak_suppression'],
    body:
      'Days 1-2 after your injection are when appetite suppression is strongest, and when the risk of skipping protein is highest. Missing protein on these days is the single most common driver of muscle loss during GLP-1 treatment. Protein shakes, Greek yogurt, cottage cheese, and eggs are all low-volume, high-protein options that are easy to get down even when appetite is near zero.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 5,
  },
  {
    id: 'fiber-partner',
    title: 'Fiber: The Underrated Partner',
    keyTakeaway: 'Add fiber gradually: a sudden jump on a slowed gut causes bloating.',
    body:
      'Because GLP-1 medications already slow digestion, constipation is one of the most commonly reported complaints, and adequate fiber intake is the primary dietary tool for managing it. Aim for 25-35 g of fiber per day from whole food sources such as vegetables, legumes, berries, and oats. Introduce fiber gradually over one to two weeks; a sudden large increase in fiber on an already-slowed gut can cause bloating and cramping.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 6,
  },
  {
    id: 'beyond-the-scale',
    title: 'Muscle Preservation: Beyond the Scale',
    keyTakeaway: 'The scale cannot tell you if you are losing fat or muscle. Body composition can.',
    body:
      'The number on the scale does not tell you whether you are losing fat or muscle. Body composition is what matters. Research consistently shows that losing weight at a pace of around 0.5-1 lb per week, paired with sufficient protein and resistance training, preserves significantly more lean mass than rapid loss. Pharmacist note: GLiPra\'s protein floor is calibrated to support this pace of muscle-protective weight loss, not simply to hit a generic macro target.',
    cardType: 'milestone',
    medicationIds: [],
    tier: 2,
    sortOrder: 7,
  },
  {
    id: 'low-protein-signs',
    title: 'Signs You May Need More Protein',
    keyTakeaway: 'Fatigue, hair thinning, and slow wound healing are signs of protein shortfall.',
    body:
      'Persistent fatigue that is not explained by poor sleep, noticeable hair thinning starting around the three-month mark, slow wound healing, and feeling cold more than usual can all be signs that protein intake is inadequate. These symptoms are frequently mistaken for medication side effects, but they are also classic markers of insufficient dietary protein. Logging your protein consistently in GLiPra is the most reliable way to rule out a shortfall.',
    cardType: 'warning',
    medicationIds: [],
    tier: 2,
    sortOrder: 8,
  },
  {
    id: 'electrolyte-hydration',
    title: 'Hydration Beyond Water',
    keyTakeaway: 'Electrolytes prevent cramps and fatigue that water alone cannot fix.',
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
    keyTakeaway: 'Days 5-7 are your window to work out harder and catch up on protein.',
    phases: ['recovery_window'],
    body:
      'Days 5-7 before your next injection, the recovery window, are when appetite returns, energy is higher, and your body is best positioned to use the nutrients you give it. This is the ideal time for higher-intensity workouts and for intentionally catching up on any protein you fell short on earlier in the week. Using this window with purpose (rather than simply overeating) is one of the most effective habits for protecting muscle during GLP-1 treatment.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 10,
  },

  // ── Batch 2 (cards 11-25) ─────────────────────────────────────────────────

  {
    id: 'resistance-training',
    title: 'Resistance Training: The Muscle Protector',
    keyTakeaway: 'Two sessions a week keeps muscle on your frame while GLP-1 burns fat.',
    body:
      'Even two resistance training sessions per week (body-weight squats, resistance bands, or light dumbbells) can significantly reduce the amount of muscle lost during caloric restriction. GLP-1 medications accelerate fat loss; resistance training is the lever that keeps muscle in place while that fat loss happens. You do not need to become an athlete. Consistency at moderate intensity matters far more than intensity alone, and even short sessions count.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 11,
  },
  {
    id: 'protein-shake-strategy',
    title: 'Protein Shakes: Your Low-Appetite Lifeline',
    keyTakeaway: 'A 30-40g shake is the fastest way to hit your protein floor when appetite is gone.',
    body:
      'On days when appetite is near zero, a protein shake can be the difference between hitting your protein floor and falling well short. A 30-40 g shake takes under two minutes, produces almost no gastric volume, and is easy on a slowed stomach. Look for options with at least 25 g of protein per serving and under 5 g of sugar. Whey, casein, and pea protein all have strong evidence for muscle protein synthesis; choose whichever you tolerate best.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 12,
  },
  {
    id: 'eating-out',
    title: 'Eating Out on GLP-1',
    keyTakeaway: 'Order protein first and box half the plate: restaurant portions are 2-3x too large.',
    body:
      'A few simple strategies make restaurant meals work: order protein first (grilled fish, chicken, lean steak), ask for sauces and dressings on the side, and choose a side salad or vegetables over refined carbs. Restaurant portions are almost always two to three times a correct portion size - boxing half before eating is a practical move, not a restriction. Pharmacist note: You will likely feel satisfied much sooner than your dining companions; that is the medication working, not a reason to keep eating.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 13,
  },
  {
    id: 'alcohol-glp1',
    title: 'Alcohol and GLP-1: What to Know',
    keyTakeaway: 'Alcohol hits unpredictably on injection day: eat protein first and pace slowly.',
    phases: ['injection_day'],
    body:
      'GLP-1 medications slow how quickly your stomach empties, which means alcohol enters your bloodstream more slowly and then more abruptly than usual. The effect can feel unpredictable. Alcohol also displaces protein and key nutrients from the meal, which is especially costly on days when appetite is already reduced. If you do drink, eat a protein-containing meal first, pace drinks slowly, and match each drink with a glass of water. Pharmacist note: Contact your prescriber if you have questions about how alcohol interacts with your specific medication.',
    cardType: 'warning',
    medicationIds: [],
    tier: 1,
    sortOrder: 14,
  },
  {
    id: 'b-vitamins',
    title: 'B Vitamins: The Hidden Shortfall',
    keyTakeaway: 'Reduced food intake silently depletes B12 and thiamine. A B-complex prevents this.',
    body:
      'Significant reductions in food intake (common on GLP-1 medications) can cause B12, B6, and thiamine levels to drop below optimal without obvious symptoms in the early months. Fatigue, tingling in the hands or feet, and difficulty concentrating can all be early signs. A daily B-complex or a high-quality multivitamin is a simple insurance policy. Pharmacist note: Talk to your prescriber about testing if you notice any of these symptoms.',
    cardType: 'warning',
    medicationIds: [],
    tier: 1,
    sortOrder: 15,
  },
  {
    id: 'iron-zinc',
    title: 'Iron and Zinc: Easy to Miss',
    keyTakeaway: 'Iron and zinc fall short first when food volume drops: watch for fatigue and slow healing.',
    body:
      'Red meat, shellfish, poultry, and legumes are the primary food sources of both iron and zinc, nutrients directly involved in immune function, wound healing, and energy metabolism. When food volume drops significantly, these are among the first minerals to fall short. If you notice more frequent infections, slower wound healing, or unusual hair shedding, it is worth asking your prescriber about a simple blood panel.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 16,
  },
  {
    id: 'calcium-bone',
    title: 'Calcium and Bone Health',
    keyTakeaway: 'Muscle and bone both need calcium, vitamin D, and resistance training to stay strong.',
    body:
      'Muscle and bone health are closely linked: both depend on resistance exercise, adequate protein, and sufficient calcium and vitamin D. Adults need 1,000-1,200 mg of calcium daily, which typically requires deliberate food choices (dairy, fortified plant milks, leafy greens, sardines) or a supplement when food intake is low. Vitamin D enhances calcium absorption and is frequently insufficient even in people with normal diets. Both are worth keeping in view during any period of significant caloric reduction.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 17,
  },
  {
    id: 'plateau-perspective',
    title: 'Weight Plateau: What It Really Means',
    keyTakeaway: 'Plateaus are normal: eating less in response risks losing the muscle you worked to keep.',
    body:
      'A weight plateau (weeks without a scale change despite consistent effort) is a normal feature of physiology, not a sign of failure. The body adapts to caloric deficits by reducing its metabolic rate over time, and short-term water retention (especially after strength training) can mask fat loss entirely. The most productive response is to focus on inputs you can control: protein consistency, resistance training, and hydration. Pharmacist note: Plateaus on GLP-1 often precede renewed progress; the worst response is reducing food intake further and risking more muscle loss.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 18,
  },
  {
    id: 'pre-injection-prep',
    title: 'The Day Before Your Injection',
    keyTakeaway: 'Front-load protein and hydrate today: tomorrow your appetite will drop sharply.',
    phases: ['recovery_window'],
    body:
      'The day before your injection is an ideal time to intentionally front-load protein and top up your electrolytes, because the next 24-48 hours will bring the strongest appetite suppression of your cycle. Think of it as preparation: get a full day of protein in, hydrate well, and avoid alcohol. A high-protein dinner the night before your injection means you are starting the peak suppression phase with your muscles already fueled, not in deficit.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 19,
  },
  {
    id: 'soft-foods-list',
    title: 'Soft Foods for Low-Appetite Days',
    keyTakeaway: 'Greek yogurt, cottage cheese, and eggs get protein in when appetite is nearly gone.',
    body:
      'On days when eating feels like an effort, food texture matters enormously. Soft, easy-to-manage options that are high in protein: Greek yogurt, cottage cheese, scrambled eggs, soft tofu, smooth nut butters, ricotta, hummus, well-cooked fish, and blended soups with added protein powder. These foods require almost no gastric volume and are easy to manage even when nausea is mild. Aim to build at least two of these into every high-suppression day as a baseline.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 20,
  },
  {
    id: 'adjustment-phase',
    title: 'Navigating the Adjustment Phase',
    keyTakeaway: 'Days 3-4 are easiest with low-fiber foods and a short walk after meals.',
    phases: ['adjustment'],
    body:
      'Days 3-4 after your injection are when GI adjustment symptoms are most noticeable: bloating, irregular digestion, and general discomfort are most common during this window as your body adapts to a slower-moving digestive system. Lower-fiber, easier-to-digest foods (white rice, banana, well-cooked vegetables, eggs) tend to cause fewer symptoms during this window. Hydration and gentle movement, such as a 20-minute walk after meals, are the two best non-dietary tools for managing this phase.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 21,
  },
  {
    id: 'sleep-recovery',
    title: 'Sleep: The Overlooked Muscle Builder',
    keyTakeaway: '7+ hours of sleep and a bedtime protein snack protect muscle while you rest.',
    body:
      'The majority of muscle repair and growth happens during deep sleep, when growth hormone is released in its highest concentrations. Consistently getting fewer than 7 hours of sleep raises cortisol, accelerates muscle breakdown, and blunts the protein synthesis your body needs to protect lean mass during caloric restriction. A high-protein snack 30-60 minutes before bed (cottage cheese or a casein shake) provides a slow-release amino acid supply that your muscles can use through the night.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 22,
  },
  {
    id: 'social-eating',
    title: 'Social Eating Without the Stress',
    keyTakeaway: 'Stopping early is the medication working correctly, not being difficult.',
    body:
      'Social meals can feel complicated on a GLP-1 medication, but a few mental reframes help: your satiety signals are now calibrated correctly, not broken. You are not being difficult by eating less. You are eating the right amount for your body right now. Protein-forward ordering, eating slowly, and stopping when satisfied (not when the plate is empty) are the three habits that make social eating manageable over time. Most people around you will not notice what or how much you are eating.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 23,
  },
  {
    id: 'logging-accuracy',
    title: 'Why Logging Accuracy Matters',
    keyTakeaway: 'A 15-20g daily undercount means 100g of missing muscle-protecting protein each week.',
    body:
      'Protein is the one macro where consistency of tracking directly predicts muscle preservation outcomes. Even a systematic underestimate of 15-20 g per day adds up to over 100 g per week of missing protein your muscles needed. Common undercount sources: cooking oils added to protein foods, sauces with hidden protein, underestimating portion size on high-protein items. Weighing food occasionally (not obsessively, just for a week) recalibrates your eye and makes subsequent visual estimates far more accurate.',
    cardType: 'tip',
    medicationIds: [],
    tier: 2,
    sortOrder: 24,
  },
  {
    id: 'goal-weight-nutrition',
    title: 'Nutrition When You Reach Your Goal',
    keyTakeaway: 'At your goal weight, protein stays non-negotiable: it protects the muscle you built.',
    body:
      'Reaching your goal weight means shifting focus from losing to protecting. Protein stays just as important, because muscle still needs regular stimulus and a steady supply of amino acids to hold on to what you worked for. Keep protein forward at every meal and keep up resistance training a couple of times a week. As your goals change, talk with your prescriber about the right calorie and overall nutrition plan for staying where you are. This transition is a success worth maintaining.',
    cardType: 'education',
    medicationIds: [],
    tier: 2,
    sortOrder: 25,
  },
  {
    id: 'oral-empty-stomach',
    title: 'Oral GLP-1: The Empty-Stomach Rule',
    keyTakeaway: 'Take it on an empty stomach with a small sip of water, then wait 30 minutes before anything else.',
    route: 'oral',
    body:
      'Oral GLP-1 tablets are absorbed very differently from the injectable versions, and the empty-stomach rule is what makes them work. Take your tablet first thing after waking, on a completely empty stomach, with no more than a small sip of plain water. Then wait at least 30 minutes before any food, coffee, other drinks, or other medicines. Food and liquids in the stomach during that window sharply reduce how much medication your body absorbs, which can quietly make your dose less effective without you noticing. The 30-minute timer in GLiPra is here to make that wait easy to follow. Pharmacist note: the exact directions printed for your specific product, and the instructions from your prescriber and pharmacist, always take priority over general guidance.',
    cardType: 'warning',
    medicationIds: [],
    tier: 1,
    sortOrder: 26,
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
 * Returns active cards visible to a given administration route. Cards with no
 * `route` are universal (shown to everyone); a card tagged with a route is only
 * shown to users on that route. Keeps oral-only cards away from injection users
 * and vice versa.
 */
export function getActiveCardsForRoute(route: AdministrationRoute): ContentCard[] {
  return getActiveCards().filter(c => !c.route || c.route === route);
}

/**
 * Returns a single card by its slug ID, or undefined if not found.
 */
export function getCardById(id: string): ContentCard | undefined {
  return CONTENT_CARDS.find(c => c.id === id);
}
