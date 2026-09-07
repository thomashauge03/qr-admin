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
  info_lines    JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Migrering for eksisterende tabeller (kjør om tabellen allerede finnes)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS qr_type TEXT DEFAULT 'shop';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS qr_data JSONB;

-- Infoliste ved siden av QR-koden (utleie: pris, depositum, kontakt ...)
-- Format: [{ "label": "Pris", "value": "250 kr/døgn" }, ...]
ALTER TABLE categories ADD COLUMN IF NOT EXISTS info_lines JSONB;

-- Mapper
CREATE TABLE IF NOT EXISTS folders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
-- Alle kan lese (QR-visning), bare innloggede kan endre
CREATE POLICY "folders_lese_offentleg" ON folders FOR SELECT USING (true);
CREATE POLICY "folders_skrive_innlogga" ON folders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "folders_endre_innlogga" ON folders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "folders_slette_innlogga" ON folders FOR DELETE TO authenticated USING (true);

-- Koble kategorier til mapper
ALTER TABLE categories ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- Indekser for rask søking
CREATE INDEX IF NOT EXISTS idx_categories_name         ON categories (name);
CREATE INDEX IF NOT EXISTS idx_categories_shelf_number ON categories (shelf_number);
CREATE INDEX IF NOT EXISTS idx_categories_created_at   ON categories (created_at DESC);

-- Row Level Security (RLS)
-- Anon-nøkkelen ligger i nettleseren og er offentlig kjent. Derfor:
-- alle kan LESE katalogen (det QR-kodene viser), men bare innloggede
-- kan legge til, endre eller slette.
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_lese_offentleg" ON categories
  FOR SELECT USING (true);
CREATE POLICY "categories_skrive_innlogga" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "categories_endre_innlogga" ON categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "categories_slette_innlogga" ON categories
  FOR DELETE TO authenticated USING (true);

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
