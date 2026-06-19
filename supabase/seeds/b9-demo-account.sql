-- B9 Demo / Reviewer Account Seed
-- ============================================================
-- BEFORE RUNNING:
--   1. In the Supabase dashboard (Authentication > Users > Add user),
--      create: reviewer@glipra.com / password: GlipraReview2025!
--      Then tick "Auto-confirm user" so no email step is needed.
--   2. Copy the UUID Supabase assigns to that user.
--   3. Replace every occurrence of the placeholder below with the real UUID.
--      (Find & replace: 00000000-0000-0000-0000-000000000099)
--   4. Run this file in the Supabase SQL editor.
--
-- AFTER RUNNING:
--   Grant the demo user a RevenueCat promotional entitlement (glipra_pro)
--   so the reviewer can access Pro features without a real IAP purchase.
--   RevenueCat dashboard > Customers > find by user_id > Grant entitlement.
-- ============================================================

-- Placeholder UUID — replace before running
-- 00000000-0000-0000-0000-000000000099

-- ── Profile ──────────────────────────────────────────────────
INSERT INTO public.profiles (
  user_id,
  medication_id,
  medication_status,
  administration_route,
  dose_mg,
  dose_frequency,
  injection_day_of_week,
  last_injection_date,
  medication_start_date,
  weight_kg,
  height_cm,
  bmi,
  activity_level,
  phase,
  protein_floor_g,
  goal_weight_kg,
  dietary_pattern,
  has_kidney_disease,
  onboarding_completed
)
VALUES (
  '00000000-0000-0000-0000-000000000099',
  'semaglutide_wegovy',
  'active',
  'injection',
  1.0,
  'weekly',
  4,                                               -- Thursday
  (CURRENT_DATE - INTERVAL '3 days')::date,        -- adjustment phase
  (CURRENT_DATE - INTERVAL '56 days')::date,       -- 8 weeks on medication
  83.9,                                            -- ~185 lbs
  172.7,                                           -- 5'8"
  28.1,
  'moderate',
  'weight_loss',
  120,
  75.0,                                            -- ~165 lbs goal
  'high_protein',
  false,
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  medication_id        = EXCLUDED.medication_id,
  medication_status    = EXCLUDED.medication_status,
  last_injection_date  = EXCLUDED.last_injection_date,
  onboarding_completed = EXCLUDED.onboarding_completed;

-- ── Weight logs (8 weeks, gentle downward trend) ─────────────
INSERT INTO public.weight_logs (user_id, weight_kg, ewma_weight_kg, logged_at) VALUES
  ('00000000-0000-0000-0000-000000000099', 87.1, 87.1, NOW() - INTERVAL '56 days'),
  ('00000000-0000-0000-0000-000000000099', 86.5, 86.9, NOW() - INTERVAL '49 days'),
  ('00000000-0000-0000-0000-000000000099', 86.0, 86.7, NOW() - INTERVAL '42 days'),
  ('00000000-0000-0000-0000-000000000099', 85.4, 86.4, NOW() - INTERVAL '35 days'),
  ('00000000-0000-0000-0000-000000000099', 85.1, 86.1, NOW() - INTERVAL '28 days'),
  ('00000000-0000-0000-0000-000000000099', 84.6, 85.8, NOW() - INTERVAL '21 days'),
  ('00000000-0000-0000-0000-000000000099', 84.2, 85.5, NOW() - INTERVAL '14 days'),
  ('00000000-0000-0000-0000-000000000099', 83.9, 85.2, NOW() - INTERVAL '7 days');

-- ── Injection logs (4 weekly shots, rotating sites) ──────────
INSERT INTO public.injection_logs (user_id, injected_at, site_code, medication_name, pain_level, notes) VALUES
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '24 days', 'stomach_upper_left',  'Wegovy', 2, NULL),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '17 days', 'stomach_upper_mid',   'Wegovy', 1, NULL),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '10 days', 'stomach_upper_right', 'Wegovy', 2, NULL),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '3 days',  'stomach_lower_right', 'Wegovy', 1, NULL);

-- ── Food logs (10 days of realistic high-protein entries) ────
INSERT INTO public.food_logs
  (user_id, logged_at, name, serving_description, protein_g, fiber_g, calories_kcal, iron_mg, source)
VALUES
  -- Day -10
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '10 days' + INTERVAL '8 hours',
   'Greek yogurt, plain 2%', '1 cup (227g)', 17, 0, 150, 0.2, 'manual'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '10 days' + INTERVAL '13 hours',
   'Grilled chicken breast', '4 oz', 35, 0, 185, 1.1, 'barcode'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '10 days' + INTERVAL '19 hours',
   'Salmon fillet', '5 oz', 36, 0, 230, 0.8, 'manual'),
  -- Day -8
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '8 days' + INTERVAL '8 hours',
   'Scrambled eggs', '3 large eggs', 18, 0, 210, 1.8, 'manual'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '8 days' + INTERVAL '12 hours',
   'Cottage cheese', '1 cup (226g)', 25, 0, 180, 0.3, 'manual'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '8 days' + INTERVAL '18 hours',
   'Ground turkey, lean', '5 oz cooked', 38, 0, 215, 1.7, 'photo'),
  -- Day -6
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '6 days' + INTERVAL '8 hours',
   'Protein shake, vanilla', '1 scoop in water', 25, 2, 130, 3.6, 'barcode'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '6 days' + INTERVAL '13 hours',
   'Tuna salad', '1 can (5 oz) with light mayo', 33, 0, 190, 1.3, 'manual'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '6 days' + INTERVAL '19 hours',
   'Baked cod', '6 oz', 32, 0, 175, 0.5, 'manual'),
  -- Day -4
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '4 days' + INTERVAL '9 hours',
   'Egg white omelette', '4 egg whites + veggies', 15, 2, 110, 0.6, 'manual'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '4 days' + INTERVAL '13 hours',
   'Grilled shrimp', '4 oz', 24, 0, 120, 2.6, 'manual'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '4 days' + INTERVAL '18 hours',
   'Chicken thigh, baked', '5 oz', 33, 0, 240, 1.2, 'photo'),
  -- Day -2
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '2 days' + INTERVAL '8 hours',
   'Greek yogurt, plain 2%', '1 cup (227g)', 17, 0, 150, 0.2, 'manual'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '2 days' + INTERVAL '12 hours',
   'Grilled chicken breast', '6 oz', 52, 0, 278, 1.6, 'barcode'),
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '2 days' + INTERVAL '18 hours',
   'Lentil soup', '1.5 cups', 18, 11, 230, 4.2, 'manual'),
  -- Today (partial day)
  ('00000000-0000-0000-0000-000000000099', NOW() - INTERVAL '2 hours',
   'Protein shake, chocolate', '1 scoop in water', 25, 2, 130, 3.6, 'barcode');

-- ── Daily check-ins (last 5 days) ────────────────────────────
INSERT INTO public.daily_checkins (user_id, nausea, energy, water_ml, checked_in_at) VALUES
  ('00000000-0000-0000-0000-000000000099', 2, 4, 2200, NOW() - INTERVAL '4 days'),
  ('00000000-0000-0000-0000-000000000099', 1, 4, 2400, NOW() - INTERVAL '3 days'),
  ('00000000-0000-0000-0000-000000000099', 2, 3, 1800, NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000099', 1, 4, 2600, NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000099', 1, 5, 2000, NOW() - INTERVAL '4 hours');
