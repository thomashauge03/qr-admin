-- ============================================================
-- QR Admin — Supabase database setup
-- Kjør dette i Supabase SQL Editor
-- ============================================================

-- Opprett categories-tabellen
CREATE TABLE IF NOT EXISTS categories (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name          TEXT NOT NULL,
  shelf_number  TEXT NOT NULL,
  description   TEXT,
  color         TEXT,
  qr_type       TEXT DEFAULT 'shop',
  qr_data       JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Migrering for eksisterende tabeller (kjør om tabellen allerede finnes)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS qr_type TEXT DEFAULT 'shop';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS qr_data JSONB;

-- Indekser for rask søking
CREATE INDEX IF NOT EXISTS idx_categories_name         ON categories (name);
CREATE INDEX IF NOT EXISTS idx_categories_shelf_number ON categories (shelf_number);
CREATE INDEX IF NOT EXISTS idx_categories_created_at   ON categories (created_at DESC);

-- Row Level Security (RLS) — siden dette er en personlig app
-- kan du enten skru av RLS, eller bruke service role key
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Tillat alt (tilpass om du legger til auth)
CREATE POLICY "Allow all operations" ON categories
  FOR ALL USING (true) WITH CHECK (true);

-- Test-data (valgfritt — slett om du ikke vil ha det)
INSERT INTO categories (name, shelf_number, description, color) VALUES
  ('Sportsutstyr',   'A-01', 'Baller, racketer og treningsutstyr', '#2a7a4b'),
  ('Elektronikk',    'B-03', 'Kabler, adaptere og tilbehør',       '#2a4a7a'),
  ('Kontorrekvisita','C-12', 'Mapper, penner og papir',            '#7a6a2a'),
  ('Verktøy',        'D-07', 'Håndverktøy og festemateriell',      '#e84e2a')
ON CONFLICT DO NOTHING;

-- ============================================================
-- FERDIG! Kopier Supabase URL og anon key til .env.local:
--
-- NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
-- NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
-- ============================================================
