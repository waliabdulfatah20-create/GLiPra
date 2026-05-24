-- Migration 006: content_cards table
-- Pharmacist-authored educational content cards.
-- Cards are global (not per-user); seeded via SQL, not user-generated.

CREATE TABLE IF NOT EXISTS content_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_key        TEXT NOT NULL UNIQUE,   -- stable identifier, e.g. 'protein-basics'
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  card_type       TEXT NOT NULL DEFAULT 'tip'
                    CHECK (card_type IN ('tip','warning','fact','recipe')),
  -- Which medications this card applies to (empty array = all)
  medication_ids  TEXT[] NOT NULL DEFAULT '{}',
  -- Tier 1 = AI output / protein / medication content (modal disclaimer)
  -- Tier 2 = Educational / side effects (footer disclaimer)
  disclaimer_tier INTEGER NOT NULL DEFAULT 2 CHECK (disclaimer_tier IN (1, 2)),
  -- Display order within the carousel
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_cards_sort_order ON content_cards (sort_order ASC);

-- Row Level Security: everyone can read; only service role can write
ALTER TABLE content_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content cards"
  ON content_cards FOR SELECT
  USING (TRUE);
