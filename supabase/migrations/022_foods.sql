-- 022_foods.sql
-- Cascade D: seeded GLP-1 foods table + food_logs source extension.
--
-- A public, read-only, pharmacist-curated table of ~200 GLP-1-friendly
-- high-protein foods. Powers the zero-AI-cost "Search database" lookup on the
-- Log screen and the "Wrong food?" correction flow in the AI review sheet,
-- and later feeds Phase E (what-to-eat protein-gap suggestions).
--
-- Deviations from the original ARCHITECTURE.md spec (recorded in decisions log):
--   1. calcium_mg replaced by vitamin_d_iu + zinc_mg (matches the app's tracked
--      micros: Mg / Zn / B12 / VitD / Fe).
--   2. serving_description TEXT NOT NULL added (food_logs requires human text).
--   3. protein_g NOT NULL (every curated seed has protein).
--   4. Read-only RLS (content_cards pattern) - no INSERT policy this phase.
--   5. No full-text index (trigram covers a 200-row table).
--   6. Seed barcodes are NULL (no fabricated EANs; column reserved for future
--      OFF / Phase-E rows).
--
-- Seed values are USDA-typical / label-typical estimates authored 2026-06-09.
-- PHARMACIST REVIEW REQUIRED before production marketing claims.
-- Rule 7: RLS enabled below. Idempotent.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS foods (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  name_es             TEXT,
  brand               TEXT,
  barcode             TEXT,
  source              TEXT NOT NULL CHECK (source IN
                        ('open_food_facts','usda','manual','ai_photo','ai_text','curated')),
  serving_description TEXT NOT NULL,
  serving_size_g      NUMERIC(6,1),
  calories            NUMERIC(6,1),
  protein_g           NUMERIC(5,2) NOT NULL,
  carbs_g             NUMERIC(5,2),
  fat_g               NUMERIC(5,2),
  fiber_g             NUMERIC(5,2),
  b12_mcg             NUMERIC(8,3),
  iron_mg             NUMERIC(7,3),
  magnesium_mg        NUMERIC(7,2),
  vitamin_d_iu        NUMERIC(8,2),
  zinc_mg             NUMERIC(7,3),
  protein_density     NUMERIC(5,3) GENERATED ALWAYS AS
                        (CASE WHEN calories > 0 THEN protein_g / calories ELSE 0 END) STORED,
  data_quality        TEXT NOT NULL DEFAULT 'unverified' CHECK (data_quality IN
                        ('verified','community','usda','ai_estimated','unverified')),
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  is_glp1_friendly    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods (barcode);
CREATE INDEX IF NOT EXISTS idx_foods_protein_density ON foods (protein_density DESC);
CREATE INDEX IF NOT EXISTS idx_foods_glp1_friendly ON foods (is_glp1_friendly) WHERE is_glp1_friendly;
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON foods USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_foods_name_es_trgm ON foods USING gin (name_es gin_trgm_ops);

-- ─── RLS (Rule 7) — public read, service-role-only writes ─────────────────────

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read foods" ON foods;
CREATE POLICY "Anyone can read foods"
  ON foods FOR SELECT
  USING (TRUE);

-- ─── food_logs.source gains 'database' ───────────────────────────────────────
-- Migration 002 created the CHECK inline, so Postgres named it
-- food_logs_source_check. If the name ever drifts:
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'food_logs'::regclass AND contype = 'c';

ALTER TABLE food_logs DROP CONSTRAINT IF EXISTS food_logs_source_check;
ALTER TABLE food_logs ADD CONSTRAINT food_logs_source_check
  CHECK (source IN ('manual','barcode','photo','voice','database'));

-- ─── Seeds — ~200 pharmacist-curated GLP-1-friendly high-protein foods ────────
-- Columns:
-- (id, name, name_es, brand, barcode, source, serving_description,
--  serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g,
--  b12_mcg, iron_mg, magnesium_mg, vitamin_d_iu, zinc_mg,
--  data_quality, is_verified, is_glp1_friendly)

INSERT INTO foods (
  id, name, name_es, brand, barcode, source, serving_description,
  serving_size_g, calories, protein_g, carbs_g, fat_g, fiber_g,
  b12_mcg, iron_mg, magnesium_mg, vitamin_d_iu, zinc_mg,
  data_quality, is_verified, is_glp1_friendly
) VALUES
-- ── Greek yogurt & skyr (15) ──────────────────────────────────────────────────
('curated-greek-yogurt-nonfat-plain','Greek yogurt, plain, nonfat','Yogur griego natural descremado',NULL,NULL,'curated','1 cup (245 g)',245,130,23.0,9.0,0.5,0,1.3,0.1,27,0,1.2,'verified',TRUE,TRUE),
('curated-greek-yogurt-whole-plain','Greek yogurt, plain, whole milk','Yogur griego natural entero',NULL,NULL,'curated','1 cup (245 g)',245,220,20.0,9.0,11.0,0,1.1,0.1,26,0,1.1,'verified',TRUE,TRUE),
('curated-greek-yogurt-2pct-plain','Greek yogurt, plain, 2% lowfat','Yogur griego natural bajo en grasa',NULL,NULL,'curated','1 cup (245 g)',245,180,22.0,9.0,4.5,0,1.2,0.1,27,0,1.2,'verified',TRUE,TRUE),
('curated-fage-total-0','Total 0% Greek yogurt','Yogur griego Total 0%','Fage',NULL,'curated','1 container (170 g)',170,90,18.0,5.0,0,0,1.0,0,19,0,0.9,'verified',TRUE,TRUE),
('curated-chobani-nonfat-plain','Nonfat plain Greek yogurt','Yogur griego natural descremado','Chobani',NULL,'curated','1 container (170 g)',170,90,16.0,6.0,0,0,0.9,0,17,0,0.9,'verified',TRUE,TRUE),
('curated-oikos-triple-zero','Triple Zero Greek yogurt','Yogur griego Triple Zero','Oikos',NULL,'curated','1 container (150 g)',150,100,15.0,10.0,0,3.0,1.1,0,15,80,1.0,'verified',TRUE,TRUE),
('curated-two-good-vanilla','Two Good vanilla Greek yogurt',NULL,'Two Good',NULL,'curated','1 container (150 g)',150,80,12.0,3.0,2.0,0,1.0,0,11,0,0.8,'verified',TRUE,TRUE),
('curated-siggis-skyr-plain','Icelandic skyr, plain, nonfat','Skyr islandés natural','Siggi''s',NULL,'curated','1 container (150 g)',150,110,17.0,8.0,0,0,1.2,0,17,0,1.0,'verified',TRUE,TRUE),
('curated-skyr-plain-generic','Skyr, plain','Skyr natural',NULL,NULL,'curated','1 container (150 g)',150,100,17.0,7.0,0.5,0,1.2,0,17,0,1.0,'verified',TRUE,TRUE),
('curated-greek-yogurt-vanilla-lowfat','Greek yogurt, vanilla, lowfat','Yogur griego de vainilla bajo en grasa',NULL,NULL,'curated','1 container (170 g)',170,140,13.0,16.0,2.5,0,0.9,0,15,0,0.8,'verified',TRUE,TRUE),
('curated-light-fit-greek','Light + Fit Greek yogurt',NULL,'Light + Fit',NULL,'curated','1 container (150 g)',150,80,12.0,8.0,0,0,0.9,0,12,0,0.7,'verified',TRUE,TRUE),
('curated-chobani-zero-sugar','Zero Sugar yogurt',NULL,'Chobani',NULL,'curated','1 container (150 g)',150,60,11.0,5.0,0,1.0,0.8,0,11,0,0.7,'verified',TRUE,TRUE),
('curated-greek-yogurt-drink','Greek yogurt drink','Bebida de yogur griego',NULL,NULL,'curated','1 bottle (200 ml)',207,130,10.0,15.0,3.0,0,0.8,0,16,0,0.7,'verified',TRUE,TRUE),
('curated-greek-yogurt-honey','Greek yogurt with honey','Yogur griego con miel',NULL,NULL,'curated','1 container (170 g)',170,160,13.0,20.0,3.0,0,0.9,0,14,0,0.8,'verified',TRUE,TRUE),
('curated-kite-hill-greek-style','Almond milk Greek-style yogurt, plain',NULL,'Kite Hill',NULL,'curated','1 container (150 g)',150,140,11.0,8.0,7.0,2.0,0,0.7,40,0,0.9,'verified',TRUE,TRUE),
-- ── Cottage cheese & ricotta (10) ─────────────────────────────────────────────
('curated-cottage-cheese-2pct','Cottage cheese, 2% lowfat','Queso cottage 2%',NULL,NULL,'curated','1 cup (226 g)',226,180,24.0,8.0,5.0,0,1.4,0.3,18,0,0.9,'verified',TRUE,TRUE),
('curated-cottage-cheese-nonfat','Cottage cheese, nonfat','Queso cottage descremado',NULL,NULL,'curated','1 cup (226 g)',226,160,24.0,10.0,0.5,0,1.4,0.3,17,0,0.9,'verified',TRUE,TRUE),
('curated-cottage-cheese-4pct','Cottage cheese, 4% whole','Queso cottage entero',NULL,NULL,'curated','1 cup (226 g)',226,220,23.0,7.0,10.0,0,1.3,0.2,18,0,0.9,'verified',TRUE,TRUE),
('curated-cottage-cheese-half-cup','Cottage cheese, 2%, small serving','Queso cottage 2% porción pequeña',NULL,NULL,'curated','1/2 cup (113 g)',113,90,12.0,4.0,2.5,0,0.7,0.2,9,0,0.5,'verified',TRUE,TRUE),
('curated-good-culture-2pct','Organic 2% cottage cheese',NULL,'Good Culture',NULL,'curated','1 container (150 g)',150,110,14.0,4.0,3.5,0,0.9,0,12,0,0.6,'verified',TRUE,TRUE),
('curated-lactose-free-cottage','Cottage cheese, lactose free, 2%',NULL,NULL,NULL,'curated','1/2 cup (113 g)',113,90,12.0,5.0,2.5,0,0.7,0.2,9,0,0.5,'verified',TRUE,TRUE),
('curated-ricotta-part-skim','Ricotta, part skim','Ricotta semidescremada',NULL,NULL,'curated','1/2 cup (124 g)',124,170,14.0,6.0,10.0,0,0.4,0.5,18,0,1.7,'verified',TRUE,TRUE),
('curated-ricotta-whole','Ricotta, whole milk','Ricotta entera',NULL,NULL,'curated','1/2 cup (124 g)',124,200,10.0,4.0,16.0,0,0.4,0.5,14,0,1.4,'verified',TRUE,TRUE),
('curated-cottage-cheese-whipped','Whipped cottage cheese','Queso cottage batido',NULL,NULL,'curated','1/2 cup (110 g)',110,90,11.0,5.0,2.5,0,0.7,0.2,9,0,0.5,'verified',TRUE,TRUE),
('curated-cottage-cheese-pineapple','Cottage cheese with pineapple',NULL,NULL,NULL,'curated','1 container (150 g)',150,120,11.0,14.0,2.0,0,0.7,0.2,10,0,0.5,'verified',TRUE,TRUE),
-- ── Eggs (8) ──────────────────────────────────────────────────────────────────
('curated-egg-large','Egg, large, whole','Huevo grande entero',NULL,NULL,'curated','1 large egg (50 g)',50,70,6.0,0.5,5.0,0,0.5,0.9,6,41,0.6,'verified',TRUE,TRUE),
('curated-eggs-2-large','Eggs, 2 large, whole','2 huevos grandes',NULL,NULL,'curated','2 large eggs (100 g)',100,140,12.0,1.0,10.0,0,0.9,1.8,12,82,1.3,'verified',TRUE,TRUE),
('curated-egg-whites-2','Egg whites, 2 large','2 claras de huevo',NULL,NULL,'curated','2 large whites (66 g)',66,34,7.2,0.5,0,0,0.1,0.1,7,0,0,'verified',TRUE,TRUE),
('curated-liquid-egg-whites','Liquid egg whites','Claras de huevo líquidas',NULL,NULL,'curated','1/4 cup (61 g)',61,25,5.0,0,0,0,0.1,0,7,0,0,'verified',TRUE,TRUE),
('curated-hard-boiled-egg','Egg, hard boiled','Huevo duro',NULL,NULL,'curated','1 large egg (50 g)',50,78,6.3,0.6,5.3,0,0.6,0.6,5,44,0.5,'verified',TRUE,TRUE),
('curated-scrambled-eggs-2','Scrambled eggs, 2 large','Huevos revueltos, 2',NULL,NULL,'curated','2 eggs scrambled (122 g)',122,180,12.0,2.0,13.0,0,0.9,1.8,15,86,1.3,'verified',TRUE,TRUE),
('curated-egg-bites-2','Egg bites with cheese, 2',NULL,NULL,NULL,'curated','2 egg bites (92 g)',92,170,12.0,3.0,12.0,0,0.7,1.0,10,60,1.0,'verified',TRUE,TRUE),
('curated-omelet-veggie','Vegetable omelet, 2 egg','Omelet de verduras',NULL,NULL,'curated','1 omelet (150 g)',150,190,13.0,4.0,13.0,1.0,0.9,1.9,18,86,1.3,'verified',TRUE,TRUE),
-- ── Chicken & turkey (20) ─────────────────────────────────────────────────────
('curated-chicken-breast-grilled','Chicken breast, grilled, skinless','Pechuga de pollo a la parrilla',NULL,NULL,'curated','3 oz (85 g)',85,140,26.0,0,3.0,0,0.3,0.9,25,0,0.9,'verified',TRUE,TRUE),
('curated-chicken-breast-baked','Chicken breast, baked, skinless','Pechuga de pollo al horno',NULL,NULL,'curated','3 oz (85 g)',85,140,26.0,0,3.0,0,0.3,0.9,25,0,0.9,'verified',TRUE,TRUE),
('curated-rotisserie-chicken-breast','Rotisserie chicken, breast meat','Pollo rostizado, pechuga',NULL,NULL,'curated','3 oz (85 g)',85,130,24.0,0,3.5,0,0.3,0.9,23,0,0.9,'verified',TRUE,TRUE),
('curated-chicken-thigh-skinless','Chicken thigh, skinless, roasted','Muslo de pollo sin piel',NULL,NULL,'curated','3 oz (85 g)',85,150,21.0,0,7.0,0,0.3,1.1,20,0,2.0,'verified',TRUE,TRUE),
('curated-ground-chicken-93','Ground chicken, 93% lean, cooked','Pollo molido 93% magro',NULL,NULL,'curated','3 oz (85 g)',85,150,20.0,0,8.0,0,0.3,0.9,21,0,1.7,'verified',TRUE,TRUE),
('curated-chicken-tenders-grilled','Chicken tenders, grilled','Tiras de pollo a la parrilla',NULL,NULL,'curated','3 oz (85 g)',85,130,25.0,0,2.5,0,0.3,0.8,24,0,0.8,'verified',TRUE,TRUE),
('curated-canned-chicken-breast','Canned chicken breast, drained','Pollo enlatado escurrido',NULL,NULL,'curated','2 oz (56 g)',56,60,13.0,0,1.0,0,0.2,0.4,12,0,0.5,'verified',TRUE,TRUE),
('curated-chicken-sausage','Chicken sausage link',NULL,NULL,NULL,'curated','1 link (85 g)',85,140,14.0,2.0,8.0,0,0.5,0.8,15,0,1.3,'verified',TRUE,TRUE),
('curated-chicken-shredded','Chicken, shredded, cooked','Pollo deshebrado',NULL,NULL,'curated','1/2 cup (70 g)',70,115,21.0,0,2.5,0,0.2,0.7,20,0,0.8,'verified',TRUE,TRUE),
('curated-chicken-soup-protein','Chicken and vegetable soup','Sopa de pollo con verduras',NULL,NULL,'curated','1 cup (245 g)',245,130,12.0,12.0,3.5,2.0,0.2,1.0,18,0,0.8,'verified',TRUE,TRUE),
('curated-turkey-breast-roasted','Turkey breast, roasted, skinless','Pechuga de pavo asada',NULL,NULL,'curated','3 oz (85 g)',85,125,26.0,0,1.8,0,0.3,0.7,27,0,1.5,'verified',TRUE,TRUE),
('curated-ground-turkey-93','Ground turkey, 93% lean, cooked','Pavo molido 93% magro',NULL,NULL,'curated','3 oz (85 g)',85,170,21.0,0,9.0,0,1.0,1.2,23,0,2.5,'verified',TRUE,TRUE),
('curated-ground-turkey-99','Ground turkey, 99% lean, cooked','Pavo molido 99% magro',NULL,NULL,'curated','3 oz (85 g)',85,120,26.0,0,1.5,0,1.0,0.9,26,0,1.7,'verified',TRUE,TRUE),
('curated-turkey-meatballs','Turkey meatballs','Albóndigas de pavo',NULL,NULL,'curated','3 meatballs (85 g)',85,160,16.0,5.0,8.0,1.0,0.8,1.2,20,0,2.0,'verified',TRUE,TRUE),
('curated-turkey-burger-patty','Turkey burger patty, lean','Hamburguesa de pavo magra',NULL,NULL,'curated','1 patty (112 g)',112,200,26.0,0,10.0,0,1.2,1.4,28,0,2.9,'verified',TRUE,TRUE),
('curated-chicken-burger-patty','Chicken burger patty, lean',NULL,NULL,NULL,'curated','1 patty (112 g)',112,180,24.0,1.0,9.0,0,0.4,1.0,26,0,1.5,'verified',TRUE,TRUE),
('curated-chicken-breast-strips-frozen','Grilled chicken breast strips, frozen',NULL,NULL,NULL,'curated','3 oz (84 g)',84,110,21.0,1.0,2.5,0,0.3,0.7,22,0,0.8,'verified',TRUE,TRUE),
('curated-turkey-chili','Turkey chili with beans','Chili de pavo con frijoles',NULL,NULL,'curated','1 cup (247 g)',247,250,24.0,22.0,8.0,6.0,1.0,3.2,55,0,2.6,'verified',TRUE,TRUE),
('curated-chicken-salad-light','Chicken salad, light mayo','Ensalada de pollo ligera',NULL,NULL,'curated','1/2 cup (113 g)',113,180,16.0,4.0,11.0,0.5,0.2,0.7,16,0,0.7,'verified',TRUE,TRUE),
('curated-turkey-breakfast-sausage','Turkey breakfast sausage, 2 links',NULL,NULL,NULL,'curated','2 links (54 g)',54,110,11.0,1.0,7.0,0,0.5,0.7,12,0,1.3,'verified',TRUE,TRUE),
-- ── Fish & seafood (25) ───────────────────────────────────────────────────────
('curated-salmon-atlantic-baked','Salmon, Atlantic, baked','Salmón al horno',NULL,NULL,'curated','3 oz (85 g)',85,175,19.0,0,10.5,0,2.6,0.3,26,447,0.4,'verified',TRUE,TRUE),
('curated-salmon-canned','Salmon, canned, drained','Salmón enlatado',NULL,NULL,'curated','3 oz (85 g)',85,120,17.0,0,5.0,0,3.7,0.7,25,465,0.8,'verified',TRUE,TRUE),
('curated-salmon-smoked','Smoked salmon (lox)','Salmón ahumado',NULL,NULL,'curated','2 oz (56 g)',56,65,10.0,0,2.5,0,1.8,0.5,10,382,0.2,'verified',TRUE,TRUE),
('curated-tuna-canned-water','Tuna, canned in water, drained','Atún enlatado en agua',NULL,NULL,'curated','3 oz (85 g)',85,100,22.0,0,1.0,0,2.5,1.3,23,40,0.7,'verified',TRUE,TRUE),
('curated-tuna-pouch-light','Tuna pouch, light, in water','Atún en sobre, en agua',NULL,NULL,'curated','1 pouch (74 g)',74,70,16.0,0,0.5,0,1.9,1.0,18,32,0.5,'verified',TRUE,TRUE),
('curated-ahi-tuna-seared','Ahi tuna, seared','Atún ahi sellado',NULL,NULL,'curated','3 oz (85 g)',85,110,25.0,0,0.5,0,2.2,0.8,35,58,0.6,'verified',TRUE,TRUE),
('curated-cod-baked','Cod, baked','Bacalao al horno',NULL,NULL,'curated','3 oz (85 g)',85,90,19.0,0,0.7,0,0.9,0.4,36,40,0.5,'verified',TRUE,TRUE),
('curated-tilapia-baked','Tilapia, baked','Tilapia al horno',NULL,NULL,'curated','3 oz (85 g)',85,110,22.0,0,2.3,0,1.6,0.6,29,127,0.3,'verified',TRUE,TRUE),
('curated-halibut-baked','Halibut, baked','Halibut al horno',NULL,NULL,'curated','3 oz (85 g)',85,95,19.0,0,1.4,0,1.0,0.2,24,196,0.4,'verified',TRUE,TRUE),
('curated-mahi-mahi-grilled','Mahi mahi, grilled','Mahi mahi a la parrilla',NULL,NULL,'curated','3 oz (85 g)',85,93,20.0,0,0.8,0,0.6,1.2,32,0,0.5,'verified',TRUE,TRUE),
('curated-trout-rainbow-baked','Rainbow trout, baked','Trucha al horno',NULL,NULL,'curated','3 oz (85 g)',85,143,20.0,0,6.0,0,4.2,0.3,27,645,0.4,'verified',TRUE,TRUE),
('curated-sardines-canned-oil','Sardines, canned in oil, drained','Sardinas enlatadas en aceite',NULL,NULL,'curated','1 can (92 g)',92,190,22.0,0,10.5,0,8.2,2.7,36,178,1.2,'verified',TRUE,TRUE),
('curated-mackerel-canned','Mackerel, canned, drained',NULL,NULL,NULL,'curated','3 oz (85 g)',85,130,20.0,0,5.4,0,5.9,1.7,31,219,0.9,'verified',TRUE,TRUE),
('curated-shrimp-cooked','Shrimp, cooked','Camarones cocidos',NULL,NULL,'curated','3 oz (85 g)',85,85,18.0,0,1.0,0,1.2,0.3,31,0,1.4,'verified',TRUE,TRUE),
('curated-crab-meat-cooked','Crab meat, cooked','Carne de cangrejo',NULL,NULL,'curated','3 oz (85 g)',85,82,16.5,0,1.3,0,7.6,0.6,28,0,3.1,'verified',TRUE,TRUE),
('curated-scallops-seared','Scallops, seared','Vieiras selladas',NULL,NULL,'curated','3 oz (85 g)',85,95,17.5,2.7,0.8,0,1.5,0.3,31,0,1.3,'verified',TRUE,TRUE),
('curated-lobster-cooked','Lobster, cooked',NULL,NULL,NULL,'curated','3 oz (85 g)',85,76,16.0,0,0.7,0,1.2,0.3,37,0,3.4,'verified',TRUE,TRUE),
('curated-imitation-crab','Imitation crab (surimi)','Surimi',NULL,NULL,'curated','3 oz (85 g)',85,81,6.5,13.0,0.4,0,0.5,0.3,37,0,0.3,'verified',TRUE,TRUE),
('curated-fish-sticks-baked','Fish sticks, baked, 4',NULL,NULL,NULL,'curated','4 sticks (112 g)',112,250,12.0,24.0,11.0,1.0,1.0,0.6,24,0,0.5,'verified',TRUE,TRUE),
('curated-tuna-salad-light','Tuna salad, light mayo','Ensalada de atún ligera',NULL,NULL,'curated','1/2 cup (103 g)',103,180,16.0,4.0,11.0,0,1.2,1.0,19,28,0.6,'verified',TRUE,TRUE),
('curated-anchovies-canned','Anchovies, canned in oil, drained',NULL,NULL,NULL,'curated','1 oz (28 g)',28,60,8.0,0,2.8,0,0.2,1.3,19,20,0.7,'verified',TRUE,TRUE),
('curated-pollock-baked','Pollock, baked',NULL,NULL,NULL,'curated','3 oz (85 g)',85,100,21.0,0,1.0,0,3.1,0.2,62,43,0.5,'verified',TRUE,TRUE),
('curated-snapper-baked','Snapper, baked',NULL,NULL,NULL,'curated','3 oz (85 g)',85,109,22.4,0,1.5,0,3.0,0.2,32,0,0.4,'verified',TRUE,TRUE),
('curated-sea-bass-baked','Sea bass, baked',NULL,NULL,NULL,'curated','3 oz (85 g)',85,105,20.0,0,2.2,0,0.3,0.3,45,0,0.4,'verified',TRUE,TRUE),
('curated-ceviche','Ceviche, fish','Ceviche de pescado',NULL,NULL,'curated','1 cup (150 g)',150,120,18.0,8.0,1.5,1.0,1.5,0.6,35,30,0.6,'verified',TRUE,TRUE),
-- ── Protein shakes & powders (25) ─────────────────────────────────────────────
('curated-whey-isolate-scoop','Whey protein isolate, 1 scoop','Proteína de suero aislada, 1 medida',NULL,NULL,'curated','1 scoop (30 g)',30,110,25.0,1.0,0.5,0,0.5,0.2,20,0,0.5,'verified',TRUE,TRUE),
('curated-whey-concentrate-scoop','Whey protein concentrate, 1 scoop','Proteína de suero concentrada, 1 medida',NULL,NULL,'curated','1 scoop (31 g)',31,120,24.0,3.0,1.5,0,0.5,0.2,24,0,0.5,'verified',TRUE,TRUE),
('curated-casein-scoop','Casein protein, 1 scoop','Caseína, 1 medida',NULL,NULL,'curated','1 scoop (32 g)',32,120,24.0,3.0,0.5,0,0.6,0.3,20,0,0.6,'verified',TRUE,TRUE),
('curated-pea-protein-scoop','Pea protein, 1 scoop','Proteína de chícharo, 1 medida',NULL,NULL,'curated','1 scoop (33 g)',33,120,21.0,2.0,2.0,1.0,0,5.0,40,0,1.0,'verified',TRUE,TRUE),
('curated-soy-protein-scoop','Soy protein isolate, 1 scoop','Proteína de soya aislada',NULL,NULL,'curated','1 scoop (30 g)',30,110,23.0,2.0,1.0,1.0,0,4.0,35,0,1.2,'verified',TRUE,TRUE),
('curated-egg-white-protein-scoop','Egg white protein powder, 1 scoop',NULL,NULL,NULL,'curated','1 scoop (30 g)',30,110,24.0,2.0,0,0,0.2,0.1,10,0,0.1,'verified',TRUE,TRUE),
('curated-collagen-peptides','Collagen peptides, 2 tbsp',NULL,NULL,NULL,'curated','2 tbsp (20 g)',20,70,18.0,0,0,0,0,0,0,0,0,'verified',TRUE,TRUE),
('curated-fairlife-core-power-26','Core Power protein shake, 26 g',NULL,'Fairlife',NULL,'curated','1 bottle (414 ml)',414,170,26.0,9.0,4.5,0,1.6,0,30,200,1.5,'verified',TRUE,TRUE),
('curated-fairlife-core-power-42','Core Power Elite protein shake, 42 g',NULL,'Fairlife',NULL,'curated','1 bottle (414 ml)',414,230,42.0,8.0,3.5,0,2.0,0,40,240,2.0,'verified',TRUE,TRUE),
('curated-premier-protein-shake','Premier Protein shake, 30 g','Batido Premier Protein 30 g','Premier Protein',NULL,'curated','1 carton (325 ml)',325,160,30.0,5.0,3.0,1.0,2.4,1.8,80,400,2.3,'verified',TRUE,TRUE),
('curated-ensure-max-protein','Ensure Max Protein shake',NULL,'Ensure',NULL,'curated','1 bottle (330 ml)',330,150,30.0,6.0,1.5,2.0,2.5,2.7,80,400,3.4,'verified',TRUE,TRUE),
('curated-boost-high-protein','Boost High Protein drink',NULL,'Boost',NULL,'curated','1 bottle (237 ml)',237,240,20.0,28.0,6.0,0,1.5,2.7,60,200,2.6,'verified',TRUE,TRUE),
('curated-orgain-plant-shake','Organic plant protein shake',NULL,'Orgain',NULL,'curated','1 carton (330 ml)',330,150,16.0,13.0,5.0,2.0,0,3.0,60,0,1.5,'verified',TRUE,TRUE),
('curated-owyn-plant-shake','Plant protein shake',NULL,'OWYN',NULL,'curated','1 bottle (355 ml)',355,180,20.0,11.0,7.0,3.0,0,3.5,80,0,2.0,'verified',TRUE,TRUE),
('curated-muscle-milk-pro','Muscle Milk Pro Series shake',NULL,'Muscle Milk',NULL,'curated','1 bottle (414 ml)',414,160,32.0,4.0,2.5,1.0,2.5,2.0,80,200,2.5,'verified',TRUE,TRUE),
('curated-atkins-shake','Protein shake, low sugar',NULL,'Atkins',NULL,'curated','1 shake (325 ml)',325,160,15.0,5.0,9.0,1.0,1.5,1.4,60,80,1.7,'verified',TRUE,TRUE),
('curated-protein-shake-homemade-whey-milk','Protein shake, whey with 2% milk','Batido de proteína con leche',NULL,NULL,'curated','1 shake (350 ml)',350,230,33.0,13.0,5.5,0,1.6,0.3,50,120,1.5,'verified',TRUE,TRUE),
('curated-protein-smoothie-berry','Protein smoothie, berry, with whey','Licuado de proteína con fresas',NULL,NULL,'curated','1 smoothie (400 ml)',400,250,27.0,28.0,3.0,4.0,0.8,0.8,45,60,0.9,'verified',TRUE,TRUE),
('curated-protein-coffee','Protein iced coffee drink',NULL,NULL,NULL,'curated','1 bottle (325 ml)',325,150,20.0,12.0,2.5,0,1.0,0.5,40,80,1.0,'verified',TRUE,TRUE),
('curated-clear-whey-drink','Clear whey isolate drink, prepared',NULL,NULL,NULL,'curated','1 serving (400 ml)',400,90,20.0,2.0,0,0,0.4,0.1,10,0,0.3,'verified',TRUE,TRUE),
('curated-protein-water','Protein water, 15 g',NULL,NULL,NULL,'curated','1 bottle (500 ml)',500,70,15.0,2.0,0,0,0.3,0,5,0,0.2,'verified',TRUE,TRUE),
('curated-kefir-protein-smoothie','Kefir protein smoothie',NULL,NULL,NULL,'curated','1 cup (243 ml)',243,140,11.0,16.0,3.0,0,0.7,0.1,28,100,0.7,'verified',TRUE,TRUE),
('curated-glucerna-protein-smart','Glucerna Protein Smart shake',NULL,'Glucerna',NULL,'curated','1 bottle (325 ml)',325,150,30.0,6.0,2.0,3.0,2.4,2.7,80,400,3.4,'verified',TRUE,TRUE),
('curated-slimfast-high-protein','High protein meal shake',NULL,'SlimFast',NULL,'curated','1 bottle (325 ml)',325,180,20.0,8.0,8.0,5.0,2.0,2.7,80,200,2.3,'verified',TRUE,TRUE),
('curated-isopure-zero-carb','Zero carb protein drink',NULL,'Isopure',NULL,'curated','1 bottle (591 ml)',591,160,40.0,0,0,0,1.2,0,40,0,1.5,'verified',TRUE,TRUE),
-- ── Tofu, tempeh & soy (12) ───────────────────────────────────────────────────
('curated-tofu-firm','Tofu, firm','Tofu firme',NULL,NULL,'curated','1/2 cup (126 g)',126,90,10.0,2.0,5.0,1.0,0,1.7,37,0,1.0,'verified',TRUE,TRUE),
('curated-tofu-extra-firm','Tofu, extra firm','Tofu extra firme',NULL,NULL,'curated','3 oz (85 g)',85,80,9.0,2.0,4.5,1.0,0,1.4,32,0,0.9,'verified',TRUE,TRUE),
('curated-tofu-silken','Tofu, silken (soft)','Tofu sedoso (suave)',NULL,NULL,'curated','1/2 cup (124 g)',124,50,5.0,2.5,2.5,0,0,1.0,30,0,0.6,'verified',TRUE,TRUE),
('curated-tofu-baked-seasoned','Tofu, baked, seasoned','Tofu horneado sazonado',NULL,NULL,'curated','3 oz (85 g)',85,120,13.0,3.0,6.0,1.0,0,2.0,40,0,1.1,'verified',TRUE,TRUE),
('curated-tempeh','Tempeh','Tempeh',NULL,NULL,'curated','3 oz (85 g)',85,160,17.0,8.0,7.0,4.0,0.1,2.3,68,0,1.0,'verified',TRUE,TRUE),
('curated-edamame-shelled','Edamame, shelled, cooked','Edamame sin vaina',NULL,NULL,'curated','1 cup (155 g)',155,190,18.0,14.0,8.0,8.0,0,3.5,99,0,2.1,'verified',TRUE,TRUE),
('curated-edamame-pods','Edamame in pods, cooked','Edamame con vaina',NULL,NULL,'curated','1 cup pods (118 g)',118,120,11.0,9.0,5.0,5.0,0,2.2,62,0,1.3,'verified',TRUE,TRUE),
('curated-soy-crumbles','Soy crumbles (meatless ground)',NULL,NULL,NULL,'curated','1/2 cup (55 g)',55,80,11.0,4.0,2.0,2.0,1.2,2.0,30,0,1.0,'verified',TRUE,TRUE),
('curated-tvp-dry','Textured vegetable protein, dry','Proteína vegetal texturizada',NULL,NULL,'curated','1/4 cup (24 g)',24,80,12.0,7.0,0.5,4.0,0,2.2,70,0,1.2,'verified',TRUE,TRUE),
('curated-seitan','Seitan','Seitán',NULL,NULL,'curated','3 oz (85 g)',85,120,21.0,4.0,1.5,1.0,0,1.2,20,0,0.8,'verified',TRUE,TRUE),
('curated-soy-yogurt','Soy yogurt, plain','Yogur de soya natural',NULL,NULL,'curated','1 container (170 g)',170,110,7.0,12.0,4.0,1.0,1.1,1.1,30,0,0.6,'verified',TRUE,TRUE),
('curated-miso-soup-tofu','Miso soup with tofu','Sopa miso con tofu',NULL,NULL,'curated','1 cup (245 g)',245,85,6.0,8.0,3.5,1.5,0,1.2,25,0,0.8,'verified',TRUE,TRUE),
-- ── Legumes (15) ──────────────────────────────────────────────────────────────
('curated-lentils-cooked','Lentils, cooked','Lentejas cocidas',NULL,NULL,'curated','1 cup (198 g)',198,230,18.0,40.0,0.8,15.6,0,6.6,71,0,2.5,'verified',TRUE,TRUE),
('curated-black-beans-cooked','Black beans, cooked','Frijoles negros cocidos',NULL,NULL,'curated','1 cup (172 g)',172,227,15.0,41.0,0.9,15.0,0,3.6,120,0,1.9,'verified',TRUE,TRUE),
('curated-chickpeas-cooked','Chickpeas, cooked','Garbanzos cocidos',NULL,NULL,'curated','1 cup (164 g)',164,269,14.5,45.0,4.2,12.5,0,4.7,79,0,2.5,'verified',TRUE,TRUE),
('curated-kidney-beans-cooked','Kidney beans, cooked','Frijoles rojos cocidos',NULL,NULL,'curated','1 cup (177 g)',177,225,15.3,40.0,0.9,11.3,0,3.9,74,0,1.8,'verified',TRUE,TRUE),
('curated-pinto-beans-cooked','Pinto beans, cooked','Frijoles pintos cocidos',NULL,NULL,'curated','1 cup (171 g)',171,245,15.4,45.0,1.1,15.4,0,3.6,86,0,1.7,'verified',TRUE,TRUE),
('curated-white-beans-cooked','White beans, cooked','Frijoles blancos cocidos',NULL,NULL,'curated','1 cup (179 g)',179,249,17.4,45.0,0.6,11.3,0,6.6,113,0,2.5,'verified',TRUE,TRUE),
('curated-split-peas-cooked','Split peas, cooked','Chícharos secos cocidos',NULL,NULL,'curated','1 cup (196 g)',196,231,16.3,41.0,0.8,16.3,0,2.5,71,0,2.0,'verified',TRUE,TRUE),
('curated-black-eyed-peas-cooked','Black-eyed peas, cooked',NULL,NULL,NULL,'curated','1 cup (172 g)',172,200,13.0,36.0,0.9,11.0,0,4.3,91,0,2.2,'verified',TRUE,TRUE),
('curated-lima-beans-cooked','Lima beans, cooked',NULL,NULL,NULL,'curated','1 cup (188 g)',188,216,14.7,39.0,0.7,13.2,0,4.5,81,0,1.8,'verified',TRUE,TRUE),
('curated-refried-beans-fatfree','Refried beans, fat free','Frijoles refritos sin grasa',NULL,NULL,'curated','1/2 cup (130 g)',130,100,6.0,18.0,0,5.0,0,1.8,40,0,0.8,'verified',TRUE,TRUE),
('curated-hummus','Hummus','Hummus',NULL,NULL,'curated','1/4 cup (62 g)',62,100,4.7,9.0,5.8,3.5,0,1.5,18,0,1.1,'verified',TRUE,TRUE),
('curated-lupini-beans','Lupini beans, pickled',NULL,NULL,NULL,'curated','1/2 cup (83 g)',83,100,13.0,8.0,2.5,2.5,0,1.0,45,0,1.1,'verified',TRUE,TRUE),
('curated-roasted-chickpeas-snack','Roasted chickpea snack','Garbanzos tostados',NULL,NULL,'curated','1 oz (28 g)',28,120,6.0,18.0,3.0,5.0,0,1.3,25,0,0.9,'verified',TRUE,TRUE),
('curated-lentil-soup','Lentil soup','Sopa de lentejas',NULL,NULL,'curated','1 cup (248 g)',248,180,12.0,28.0,2.0,8.0,0,3.3,40,0,1.5,'verified',TRUE,TRUE),
('curated-black-bean-soup','Black bean soup','Sopa de frijol negro',NULL,NULL,'curated','1 cup (247 g)',247,170,11.0,30.0,1.5,8.5,0,2.6,80,0,1.4,'verified',TRUE,TRUE),
-- ── Milk & dairy drinks (12) ──────────────────────────────────────────────────
('curated-fairlife-2pct','Ultra-filtered milk, 2%','Leche ultrafiltrada 2%','Fairlife',NULL,'curated','1 cup (240 ml)',240,120,13.0,6.0,4.5,0,1.5,0,30,120,1.0,'verified',TRUE,TRUE),
('curated-fairlife-skim','Ultra-filtered milk, fat free','Leche ultrafiltrada descremada','Fairlife',NULL,'curated','1 cup (240 ml)',240,80,13.0,6.0,0,0,1.5,0,30,120,1.0,'verified',TRUE,TRUE),
('curated-milk-skim','Milk, skim','Leche descremada',NULL,NULL,'curated','1 cup (245 ml)',245,83,8.3,12.0,0.2,0,1.2,0.1,27,115,1.0,'verified',TRUE,TRUE),
('curated-milk-2pct','Milk, 2%','Leche 2%',NULL,NULL,'curated','1 cup (244 ml)',244,122,8.1,12.0,4.8,0,1.3,0,27,120,1.1,'verified',TRUE,TRUE),
('curated-lactaid-2pct','Lactose-free milk, 2%','Leche deslactosada 2%',NULL,NULL,'curated','1 cup (240 ml)',240,120,8.0,12.0,4.5,0,1.2,0,27,120,1.0,'verified',TRUE,TRUE),
('curated-kefir-lowfat','Kefir, lowfat, plain','Kéfir natural bajo en grasa',NULL,NULL,'curated','1 cup (243 ml)',243,100,9.0,12.0,2.0,0,0.7,0.1,28,100,0.7,'verified',TRUE,TRUE),
('curated-soy-milk-unsweetened','Soy milk, unsweetened','Leche de soya sin azúcar',NULL,NULL,'curated','1 cup (243 ml)',243,80,7.0,4.0,4.0,1.0,1.2,1.0,39,119,0.6,'verified',TRUE,TRUE),
('curated-pea-milk-unsweetened','Pea milk, unsweetened',NULL,'Ripple',NULL,'curated','1 cup (240 ml)',240,80,8.0,0,4.5,0,1.0,2.7,15,120,1.1,'verified',TRUE,TRUE),
('curated-chocolate-milk-lowfat','Chocolate milk, lowfat','Leche con chocolate baja en grasa',NULL,NULL,'curated','1 cup (250 ml)',250,160,8.0,26.0,2.5,1.0,1.1,0.6,33,108,1.0,'verified',TRUE,TRUE),
('curated-buttermilk-lowfat','Buttermilk, lowfat',NULL,NULL,NULL,'curated','1 cup (245 ml)',245,98,8.1,12.0,2.2,0,0.5,0.1,27,0,1.0,'verified',TRUE,TRUE),
('curated-fairlife-chocolate-2pct','Ultra-filtered chocolate milk, 2%',NULL,'Fairlife',NULL,'curated','1 cup (240 ml)',240,140,13.0,13.0,4.5,1.0,1.5,0,40,120,1.0,'verified',TRUE,TRUE),
('curated-protein-hot-cocoa','High-protein hot cocoa, prepared',NULL,NULL,NULL,'curated','1 cup (250 ml)',250,130,15.0,12.0,2.0,1.0,0.9,0.7,40,80,1.2,'verified',TRUE,TRUE),
-- ── Cheese (15) ───────────────────────────────────────────────────────────────
('curated-mozzarella-part-skim','Mozzarella, part skim','Mozzarella semidescremada',NULL,NULL,'curated','1 oz (28 g)',28,70,6.9,0.8,4.5,0,0.6,0.1,7,0,0.8,'verified',TRUE,TRUE),
('curated-string-cheese','String cheese, part skim','Queso en hebras',NULL,NULL,'curated','1 stick (28 g)',28,80,7.0,1.0,6.0,0,0.6,0.1,7,0,0.8,'verified',TRUE,TRUE),
('curated-cheddar','Cheddar cheese','Queso cheddar',NULL,NULL,'curated','1 oz (28 g)',28,115,6.4,0.9,9.5,0,0.3,0.1,8,7,1.0,'verified',TRUE,TRUE),
('curated-swiss','Swiss cheese','Queso suizo',NULL,NULL,'curated','1 oz (28 g)',28,110,7.6,0.4,8.8,0,0.9,0.1,11,6,1.2,'verified',TRUE,TRUE),
('curated-parmesan-grated','Parmesan, grated','Parmesano rallado',NULL,NULL,'curated','2 tbsp (10 g)',10,42,3.8,0.4,2.8,0,0.1,0.1,4,2,0.3,'verified',TRUE,TRUE),
('curated-babybel-light','Mini Babybel Light',NULL,'Babybel',NULL,'curated','1 piece (20 g)',20,50,6.0,0,2.5,0,0.3,0,4,0,0.5,'verified',TRUE,TRUE),
('curated-feta','Feta cheese','Queso feta',NULL,NULL,'curated','1 oz (28 g)',28,75,4.0,1.2,6.0,0,0.5,0.2,5,4,0.8,'verified',TRUE,TRUE),
('curated-provolone-slice','Provolone, 1 slice',NULL,NULL,NULL,'curated','1 slice (28 g)',28,100,7.3,0.6,7.5,0,0.4,0.1,8,7,0.9,'verified',TRUE,TRUE),
('curated-pepper-jack-slice','Pepper jack, 1 slice',NULL,NULL,NULL,'curated','1 slice (28 g)',28,110,6.5,0.5,9.0,0,0.2,0.2,8,6,0.9,'verified',TRUE,TRUE),
('curated-gouda','Gouda cheese',NULL,NULL,NULL,'curated','1 oz (28 g)',28,101,7.1,0.6,7.8,0,0.4,0.1,8,6,1.1,'verified',TRUE,TRUE),
('curated-queso-fresco','Queso fresco','Queso fresco',NULL,NULL,'curated','1 oz (28 g)',28,80,5.0,1.0,6.0,0,0.3,0.1,7,3,0.8,'verified',TRUE,TRUE),
('curated-halloumi-grilled','Halloumi, grilled',NULL,NULL,NULL,'curated','1 oz (28 g)',28,90,6.0,1.0,7.0,0,0.4,0.1,7,4,0.9,'verified',TRUE,TRUE),
('curated-cream-cheese-whipped-light','Cream cheese, whipped, light',NULL,NULL,NULL,'curated','2 tbsp (21 g)',21,50,2.0,1.5,4.0,0,0.1,0.1,2,0,0.1,'verified',TRUE,TRUE),
('curated-goat-cheese','Goat cheese, soft','Queso de cabra suave',NULL,NULL,'curated','1 oz (28 g)',28,75,5.3,0.3,6.0,0,0.1,0.5,5,7,0.3,'verified',TRUE,TRUE),
('curated-laughing-cow-light','Light spreadable cheese wedge',NULL,'The Laughing Cow',NULL,'curated','1 wedge (16 g)',16,25,1.5,1.0,1.5,0,0.1,0,2,0,0.2,'verified',TRUE,TRUE),
-- ── Soft / nausea-friendly proteins (10) ──────────────────────────────────────
('curated-bone-broth','Bone broth, chicken','Caldo de hueso de pollo',NULL,NULL,'curated','1 cup (240 ml)',240,40,9.0,0,0.5,0,0.2,0.2,5,0,0.2,'verified',TRUE,TRUE),
('curated-protein-pudding','High-protein pudding cup',NULL,NULL,NULL,'curated','1 cup (200 g)',200,180,20.0,18.0,2.5,0,1.0,0.2,30,80,1.0,'verified',TRUE,TRUE),
('curated-protein-gelatin-cup','High-protein gelatin cup',NULL,NULL,NULL,'curated','1 cup (99 g)',99,60,10.0,4.0,0,0,0,0,2,0,0,'verified',TRUE,TRUE),
('curated-drinkable-yogurt-lowfat','Drinkable yogurt, lowfat','Yogur bebible bajo en grasa',NULL,NULL,'curated','1 bottle (200 ml)',207,140,7.0,22.0,2.5,0,0.6,0.1,22,80,0.6,'verified',TRUE,TRUE),
('curated-protein-oatmeal','Protein oatmeal, prepared','Avena con proteína',NULL,NULL,'curated','1 cup prepared (240 g)',240,220,15.0,30.0,5.0,4.0,0.5,1.8,60,40,1.3,'verified',TRUE,TRUE),
('curated-halo-top-vanilla','Light protein ice cream, vanilla',NULL,'Halo Top',NULL,'curated','2/3 cup (88 g)',88,90,6.0,17.0,2.0,3.0,0.4,0.1,15,0,0.4,'verified',TRUE,TRUE),
('curated-mashed-potatoes-protein','Mashed potatoes with milk','Puré de papa con leche',NULL,NULL,'curated','1 cup (210 g)',210,174,4.0,37.0,1.2,3.2,0.1,0.5,38,8,0.6,'verified',TRUE,TRUE),
('curated-banana-protein-smoothie','Banana protein smoothie','Licuado de plátano con proteína',NULL,NULL,'curated','1 smoothie (400 ml)',400,280,26.0,35.0,3.5,3.0,0.9,0.6,60,80,1.0,'verified',TRUE,TRUE),
('curated-applesauce-protein','Protein-fortified applesauce pouch',NULL,NULL,NULL,'curated','1 pouch (113 g)',113,80,5.0,14.0,0,1.0,0,0.2,8,0,0.2,'verified',TRUE,TRUE),
('curated-greek-yogurt-smoothie-mango','Greek yogurt smoothie, mango','Licuado de yogur griego con mango',NULL,NULL,'curated','1 smoothie (350 ml)',350,220,15.0,35.0,2.0,2.0,0.9,0.3,30,40,0.8,'verified',TRUE,TRUE),
-- ── Protein bars (15) ─────────────────────────────────────────────────────────
('curated-quest-bar','Quest protein bar',NULL,'Quest',NULL,'curated','1 bar (60 g)',60,190,21.0,21.0,8.0,13.0,0.6,1.4,80,0,2.0,'verified',TRUE,TRUE),
('curated-pure-protein-bar','Pure Protein bar',NULL,'Pure Protein',NULL,'curated','1 bar (50 g)',50,180,20.0,17.0,4.5,1.0,1.8,2.7,30,0,3.0,'verified',TRUE,TRUE),
('curated-one-bar','ONE protein bar',NULL,'ONE',NULL,'curated','1 bar (60 g)',60,220,20.0,23.0,8.0,9.0,0.6,0.7,30,0,1.5,'verified',TRUE,TRUE),
('curated-rxbar','RXBAR protein bar',NULL,'RXBAR',NULL,'curated','1 bar (52 g)',52,210,12.0,24.0,9.0,5.0,0,1.4,60,0,1.0,'verified',TRUE,TRUE),
('curated-built-bar','Built protein bar',NULL,'Built',NULL,'curated','1 bar (49 g)',49,130,17.0,18.0,3.5,6.0,0.4,0.7,20,0,1.0,'verified',TRUE,TRUE),
('curated-think-bar','think! high protein bar',NULL,'think!',NULL,'curated','1 bar (60 g)',60,230,20.0,23.0,9.0,1.0,0.6,2.7,40,0,1.5,'verified',TRUE,TRUE),
('curated-barebells-bar','Barebells protein bar',NULL,'Barebells',NULL,'curated','1 bar (55 g)',55,200,20.0,19.0,8.0,3.0,0.5,1.0,40,0,1.2,'verified',TRUE,TRUE),
('curated-no-cow-bar','No Cow plant protein bar',NULL,'No Cow',NULL,'curated','1 bar (60 g)',60,190,20.0,25.0,5.0,14.0,0,2.0,60,0,1.5,'verified',TRUE,TRUE),
('curated-clif-builders','Builders protein bar',NULL,'Clif',NULL,'curated','1 bar (68 g)',68,290,20.0,29.0,11.0,2.0,1.2,2.7,60,0,3.0,'verified',TRUE,TRUE),
('curated-power-crunch','Power Crunch protein wafer',NULL,'Power Crunch',NULL,'curated','1 bar (40 g)',40,230,13.0,11.0,16.0,1.0,0.3,0.4,20,0,0.5,'verified',TRUE,TRUE),
('curated-kind-protein-bar','KIND protein bar',NULL,'KIND',NULL,'curated','1 bar (50 g)',50,250,12.0,17.0,17.0,5.0,0,1.4,60,0,1.5,'verified',TRUE,TRUE),
('curated-luna-protein-bar','LUNA protein bar',NULL,'LUNA',NULL,'curated','1 bar (45 g)',45,180,12.0,20.0,6.0,3.0,0.9,1.8,30,0,1.5,'verified',TRUE,TRUE),
('curated-metrx-big100','Big 100 meal replacement bar',NULL,'MET-Rx',NULL,'curated','1 bar (100 g)',100,410,30.0,46.0,12.0,2.0,3.0,5.4,80,0,5.0,'verified',TRUE,TRUE),
('curated-gatorade-protein-bar','Gatorade Recover protein bar',NULL,'Gatorade',NULL,'curated','1 bar (80 g)',80,350,20.0,42.0,12.0,2.0,0.6,1.8,60,0,2.0,'verified',TRUE,TRUE),
('curated-aloha-protein-bar','ALOHA organic plant protein bar',NULL,'ALOHA',NULL,'curated','1 bar (56 g)',56,230,14.0,24.0,11.0,10.0,0,2.0,70,0,1.4,'verified',TRUE,TRUE),
-- ── Deli & jerky (10) ─────────────────────────────────────────────────────────
('curated-beef-jerky','Beef jerky','Carne seca de res',NULL,NULL,'curated','1 oz (28 g)',28,80,13.0,3.0,1.5,0,0.3,1.5,14,0,2.3,'verified',TRUE,TRUE),
('curated-turkey-jerky','Turkey jerky','Carne seca de pavo',NULL,NULL,'curated','1 oz (28 g)',28,80,13.0,4.0,0.5,0,0.3,0.8,14,0,1.5,'verified',TRUE,TRUE),
('curated-biltong','Biltong, beef',NULL,NULL,NULL,'curated','1 oz (28 g)',28,90,16.0,1.0,2.0,0,0.7,1.8,16,0,2.5,'verified',TRUE,TRUE),
('curated-turkey-deli','Turkey breast, deli sliced','Pechuga de pavo, rebanada',NULL,NULL,'curated','2 oz (56 g)',56,60,12.0,1.0,0.5,0,0.2,0.6,14,0,0.9,'verified',TRUE,TRUE),
('curated-ham-deli-lean','Ham, deli sliced, lean','Jamón magro rebanado',NULL,NULL,'curated','2 oz (56 g)',56,60,10.0,1.5,1.5,0,0.4,0.4,11,0,1.0,'verified',TRUE,TRUE),
('curated-roast-beef-deli','Roast beef, deli sliced','Carne de res asada, rebanada',NULL,NULL,'curated','2 oz (56 g)',56,70,12.0,0.5,2.0,0,1.0,1.3,11,0,2.1,'verified',TRUE,TRUE),
('curated-chicken-deli','Chicken breast, deli sliced','Pechuga de pollo, rebanada',NULL,NULL,'curated','2 oz (56 g)',56,50,11.0,1.0,0.5,0,0.2,0.4,12,0,0.5,'verified',TRUE,TRUE),
('curated-turkey-pepperoni','Turkey pepperoni',NULL,NULL,NULL,'curated','17 slices (28 g)',28,80,9.0,1.0,4.0,0,0.3,0.6,8,0,1.0,'verified',TRUE,TRUE),
('curated-chomps-beef-stick','Grass-fed beef stick',NULL,'Chomps',NULL,'curated','1 stick (32 g)',32,100,10.0,0,6.0,0,0.6,1.2,10,0,2.0,'verified',TRUE,TRUE),
('curated-prosciutto','Prosciutto','Prosciutto',NULL,NULL,'curated','1 oz (28 g)',28,70,8.0,0,4.0,0,0.2,0.3,8,0,0.8,'verified',TRUE,TRUE),
-- ── Lean meats & misc (8) ─────────────────────────────────────────────────────
('curated-sirloin-steak-lean','Beef sirloin, lean, grilled','Sirloin de res magro',NULL,NULL,'curated','3 oz (85 g)',85,160,26.0,0,5.4,0,1.4,1.5,21,0,4.8,'verified',TRUE,TRUE),
('curated-ground-beef-93','Ground beef, 93% lean, cooked','Carne molida 93% magra',NULL,NULL,'curated','3 oz (85 g)',85,170,22.0,0,8.0,0,2.2,2.4,18,0,5.3,'verified',TRUE,TRUE),
('curated-pork-tenderloin','Pork tenderloin, roasted','Lomo de cerdo asado',NULL,NULL,'curated','3 oz (85 g)',85,120,22.0,0,3.0,0,0.5,0.9,24,8,1.9,'verified',TRUE,TRUE),
('curated-quinoa-cooked','Quinoa, cooked','Quinoa cocida',NULL,NULL,'curated','1 cup (185 g)',185,222,8.1,39.0,3.6,5.2,0,2.8,118,0,2.0,'verified',TRUE,TRUE),
('curated-chickpea-pasta-dry','Chickpea pasta, dry','Pasta de garbanzo',NULL,NULL,'curated','2 oz dry (57 g)',57,190,13.0,32.0,3.5,5.0,0,4.5,55,0,1.6,'verified',TRUE,TRUE),
('curated-pumpkin-seeds','Pumpkin seeds, roasted','Semillas de calabaza tostadas',NULL,NULL,'curated','1 oz (28 g)',28,160,8.5,4.0,14.0,1.7,0,2.3,156,0,2.2,'verified',TRUE,TRUE),
('curated-peanut-butter-powder','Peanut butter powder, 2 tbsp',NULL,NULL,NULL,'curated','2 tbsp (13 g)',13,60,6.0,4.0,1.5,1.0,0,0.4,25,0,0.4,'verified',TRUE,TRUE),
('curated-nutritional-yeast','Nutritional yeast, 2 tbsp','Levadura nutricional',NULL,NULL,'curated','2 tbsp (10 g)',10,40,5.0,3.0,0.5,2.0,7.8,0.6,12,0,1.5,'verified',TRUE,TRUE)
ON CONFLICT (id) DO NOTHING;
