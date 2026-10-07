-- ============================================================
-- QR Admin — bare godkjente brukere kan endre katalogen
-- Kjør dette i Supabase SQL Editor, én gang. Rører ingen data.
--
-- HVORFOR: URL-kodene er nå dynamiske. Etiketten inneholder bare en adresse
-- til appen, og lenka den sender videre til, hentes fra basen ved hver
-- skanning. Den som kan endre en rad i categories, styrer dermed hvor hver
-- etikett i butikken sender kundene.
--
-- FØR: alle som logget inn — også med en tilfeldig Google-konto som aldri
--      ble godkjent — kunne endre katalogen rett mot API-et. Statussjekken
--      i appen stopper bare skjermbildet, ikke basen.
-- ETTER: bare admin og brukere med status «approved» kan endre. Alle kan
--        fortsatt LESE, så skanning virker for kunder uten innlogging.
--        En bruker kan heller ikke lenger godkjenne seg selv.
-- ============================================================

-- Admin, eller en godkjent profil. SECURITY DEFINER så regelen kan lese
-- profiles uansett hvilke regler som ligger på den tabellen.
CREATE OR REPLACE FUNCTION public.er_godkjent()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'thomashauge03@gmail.com'
      OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND status = 'approved'
      );
$$;

-- --- Fjern ALLE gamle regler på katalogen ---
-- Regler med samme kommando legges sammen med ELLER: én gammel «alt
-- tillatt»-regel med et navn vi ikke kjenner, ville latt alt det nye stå åpent.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('categories', 'folders')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- --- categories ---
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_lese_offentleg" ON categories
  FOR SELECT USING (true);
CREATE POLICY "categories_skrive_godkjent" ON categories
  FOR INSERT TO authenticated WITH CHECK (public.er_godkjent());
CREATE POLICY "categories_endre_godkjent" ON categories
  FOR UPDATE TO authenticated USING (public.er_godkjent()) WITH CHECK (public.er_godkjent());
CREATE POLICY "categories_slette_godkjent" ON categories
  FOR DELETE TO authenticated USING (public.er_godkjent());

-- --- folders ---
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "folders_lese_offentleg" ON folders
  FOR SELECT USING (true);
CREATE POLICY "folders_skrive_godkjent" ON folders
  FOR INSERT TO authenticated WITH CHECK (public.er_godkjent());
CREATE POLICY "folders_endre_godkjent" ON folders
  FOR UPDATE TO authenticated USING (public.er_godkjent()) WITH CHECK (public.er_godkjent());
CREATE POLICY "folders_slette_godkjent" ON folders
  FOR DELETE TO authenticated USING (public.er_godkjent());

-- --- profiles: bare admin setter status ---
-- Appen lager profilen selv ved første innlogging (upsert fra nettleseren).
-- Uten denne kunne en ny bruker sendt status = 'approved' i den samme
-- forespørselen, eller endret den etterpå — og dermed sluppet inn over.
-- SQL Editor og service-nøkkelen har ingen innlogget rolle og går fri.
CREATE OR REPLACE FUNCTION public.las_profilstatus()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(auth.role(), '') NOT IN ('anon', 'authenticated')
     OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'thomashauge03@gmail.com' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSE
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS las_profilstatus ON public.profiles;
CREATE TRIGGER las_profilstatus
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.las_profilstatus();

-- ============================================================
-- FERDIG. Sjekk at det ble riktig — skal gi 4 regler per tabell,
-- der bare SELECT har roles {public}:
--   select tablename, policyname, cmd, roles
--   from pg_policies where tablename in ('categories','folders')
--   order by tablename, cmd;
-- ============================================================
