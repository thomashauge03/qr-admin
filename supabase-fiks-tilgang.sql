-- ============================================================
-- QR Admin — stram inn tilgang
-- Kjør dette i Supabase SQL Editor, én gang, på den eksisterende databasen.
-- Rører ingen data — bytter bare ut de åpne reglene.
--
-- FØR: hvem som helst på internett med anon-nøkkelen (som ligger i
--      nettleseren) kunne lese, endre og slette hele katalogen.
-- ETTER: alle kan LESE katalogen (så QR-skanning fortsatt virker for
--        kunder), men bare innloggede kan ENDRE noe.
-- ============================================================

-- --- categories ---
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Fjern den gamle "alt tillatt for alle"-regelen
DROP POLICY IF EXISTS "Allow all operations" ON categories;
DROP POLICY IF EXISTS "Allow all for authenticated" ON categories;

-- Alle kan lese — dette er det QR-kodene viser
CREATE POLICY "categories_lese_offentleg" ON categories
  FOR SELECT USING (true);

-- Bare innloggede kan legge til, endre eller slette
CREATE POLICY "categories_skrive_innlogga" ON categories
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "categories_endre_innlogga" ON categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "categories_slette_innlogga" ON categories
  FOR DELETE TO authenticated USING (true);

-- --- folders ---
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON folders;
DROP POLICY IF EXISTS "Allow all operations" ON folders;

CREATE POLICY "folders_lese_offentleg" ON folders
  FOR SELECT USING (true);
CREATE POLICY "folders_skrive_innlogga" ON folders
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "folders_endre_innlogga" ON folders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "folders_slette_innlogga" ON folders
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- FERDIG. Sjekk at det ble riktig:
--   select tablename, policyname, cmd, roles
--   from pg_policies where tablename in ('categories','folders');
-- ============================================================
