// Domain types for DosePath.
// These are app-level types — not generated from the database schema.
// Supabase-generated types live in ./database.ts.

// All supported GLP-1 medications
export type GLP1MedicationId =
  | 'semaglutide_ozempic'
  | 'semaglutide_wegovy'
  | 'tirzepatide_mounjaro'
  | 'tirzepatide_zepbound'
  | 'liraglutide_saxenda'
  | 'liraglutide_victoza'
  | 'dulaglutide_trulicity'
  | 'compounded_semaglutide'
  | 'compounded_tirzepatide'
  | 'compounded_glp1_gip';

// Injection cycle phases — derived from days since last injection in calculator.ts
export type InjectionPhase =
  | 'injection_day'       // 0 days since injection
  | 'peak_suppression'    // 1–2 days
  | 'adjustment'          // 3–4 days
  | 'recovery_window'     // 5–7 days
  | 'overdue';            // 8+ days

// Subscription tiers — gated via RevenueCat entitlement 'dosepath_pro'
export type SubscriptionTier = 'free' | 'pro' | 'founder_lifetime';

// Biological sex — used in protein floor calculation
export type BiologicalSex = 'male' | 'female';

// Activity level — used in protein floor calculation
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

// User goal — set during onboarding
export type UserGoal = 'preserve_muscle' | 'lose_fat' | 'maintain';

// Onboarding step identifiers (10-step flow)
export type OnboardingStep =
  | 'medication'
  | 'injection_day'
  | 'body'
  | 'safety'
  | 'dietary'
  | 'goals'
  | 'status'
  | 'protein_floor'
  | 'import'
  | 'reveal';

// Disclaimer tiers — Rule 8: every clinical screen needs one
// Tier 1: AI output, protein floor, medication content — modal on first view
// Tier 2: Educational content, side effects — footer disclaimer
export type DisclaimerTier = 1 | 2;

// Red flag severity — used internally in redFlagDetector.ts
// Internal type codes only — never rendered to user as condition names (Rule 9)
export type RedFlagSeverity = 'watch' | 'escalate' | 'emergency';
