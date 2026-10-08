/**
 * Design for QR-etikettene.
 *
 * «Standard» er den nøytrale etiketten vi alltid har hatt, i QR-kodens egen
 * farge. Alle de andre designene bruker bare Hauge Maskin-rødt, svart og hvitt.
 * De er delt i fem grupper med 14 i hver, så designvelgeren ikke blir én lang
 * stripe. Først står «Lager», med design til hyllene fra Lagersystemet — de
 * bruker hyllas egen fargekode, som Standard.
 *
 * HM-logoen er ikke en del av designet, men et eget valg ved utskrift — alle
 * designene kan ha den. Designet bestemmer bare HVOR den står (`logoSlot`).
 * Selve logoen brukes alltid uendret: på rød eller svart bunn får den en hvit
 * plate bak seg i stedet for å bli farget om.
 *
 * Fargen er den eksakte røden i logofila, så badge, ramme og logo bruker samme
 * røde på skjerm og på papir.
 */
export type LabelThemeId =
  // Enkle
  | 'plain' | 'hauge' | 'svarthvitt' | 'kontur' | 'svartkontur' | 'minimal' | 'minimalsvart'
  | 'teknisk' | 'tekniskrod' | 'millimeter' | 'prikkpapir' | 'nederst' | 'storqr' | 'storqrsvart'
  // Kraftige
  | 'bjelke' | 'svartbjelke' | 'stort' | 'rammetnr' | 'banner' | 'rodbanner' | 'topp'
  | 'rodtopp' | 'rodbunn' | 'svartbunn' | 'svartrod' | 'rodtoppbunn' | 'todelt' | 'todeltomvendt'
  // Mørke
  | 'mork' | 'natt' | 'nattbaand' | 'negativ' | 'morkbjelke' | 'morkstripe' | 'morkprikk'
  | 'morkfane' | 'morkteknisk' | 'morkstempel' | 'skilt' | 'rodflate' | 'rodstabel' | 'signal'
  // Rammer
  | 'ramme' | 'rundramme' | 'kraftig' | 'kraftigrod' | 'klassisk' | 'dobbelrod' | 'rammeiramme'
  | 'kutt' | 'rodehjorner' | 'baand' | 'svartebaand' | 'varsel' | 'varselsvart' | 'qrramme'
  // Former
  | 'sperre' | 'stripe' | 'svartstripe' | 'prikk' | 'rute' | 'svartrute' | 'fane'
  | 'svartfane' | 'stempel' | 'svartstempel' | 'pille' | 'svartpille' | 'hengelapp' | 'klipp'
  // Lager
  | 'hylle'

export type LabelGruppe = 'lager' | 'enkle' | 'kraftige' | 'morke' | 'rammer' | 'former'

/** Gruppene i designvelgeren, i rekkefølge */
export const LABEL_GRUPPER: { id: LabelGruppe; navn: string; hint: string }[] = [
  { id: 'lager', navn: 'Lager', hint: 'Til hyllene fra Lagersystemet, i hyllas egen farge' },
  { id: 'enkle', navn: 'Enkle', hint: 'Rolige design som bruker lite blekk' },
  { id: 'kraftige', navn: 'Kraftige', hint: 'Store felt og tydelig farge' },
  { id: 'morke', navn: 'Mørke', hint: 'Svart eller rød bunn — bruker mye blekk' },
  { id: 'rammer', navn: 'Rammer', hint: 'Rammen bærer designet' },
  { id: 'former', navn: 'Former', hint: 'Sirkler, faner, stempler og striper' },
]

export interface LabelTheme {
  id: LabelThemeId
  name: string
  /** Kort forklaring i designvelgeren */
  hint: string
  /** Gruppen designet står i i designvelgeren */
  gruppe: LabelGruppe
  /** Farge på nummerfeltet. null = behold fargen QR-koden har fra før */
  accent: string | null
  /** Farge på rammen. null = følg `accent` */
  border: string | null
  /** Bunnen på hele etiketten */
  surface: 'paper' | 'dark' | 'red'
  /**
   * Rammen rundt etiketten. Tykk og dobbel vokser med etiketten; «corners» er
   * kuttemerker i hjørnene og «bands» er bånd bare oppe og nede. «heavy» er
   * en ekstra tykk strek og «hazard» en stripet varselramme i `accent` og hvitt.
   */
  frame: 'thin' | 'thick' | 'dashed' | 'double' | 'corners' | 'bands' | 'heavy' | 'hazard' | 'none'
  /** Hjørnene: «pill» gir store runde hjørner og nummerfelt med runde ender */
  corners: 'round' | 'square' | 'pill'
  /**
   * Nummerfeltet — «UTSTYR NUMMER» og selve nummeret:
   *  fill     fylt felt, tekst og nummer side om side
   *  outline  bare kantlinje i fargen
   *  band     bjelke helt ut til kanten
   *  stripes  sperrebåndstriper rundt et hvitt felt
   *  cells    to ruter med strek i fargen, som et tegningshode
   *  rule     ingen flate, bare en strek under
   *  stack    teksten over et stort nummer
   *  number   bare nummeret — teksten står i sidestripen
   *  split    to felt: svart med teksten, farget med nummeret — eller rødt
   *           med teksten når nummerfeltet selv er svart
   *  dot      nummeret i en sirkel, teksten ved siden av
   *  square   nummeret i en firkant, teksten ved siden av
   *  tab      nummeret i en fane som henger fra hjørnet, teksten ved siden av
   *  stamp    dobbel kantlinje rundt tekst og nummer, som et stempel
   */
  badge: 'fill' | 'outline' | 'band' | 'stripes' | 'cells' | 'rule' | 'stack' | 'number' | 'split' | 'dot'
    | 'square' | 'tab' | 'stamp'
  /** Teksten i nummerfeltet i stedet for «UTSTYR NUMMER» */
  merke?: string
  /** Høyst så mange infolinjer, de første — så lappene på et ark blir like */
  maksInfo?: number
  /** Farge på nummerfeltet når den skal være en annen enn `accent` */
  badgeColor?: string
  /** Skrift på navn og nummer */
  type: 'sans' | 'heavy' | 'mono'
  /** Hvor HM-logoen står når den er slått på: bunnraden eller øverst */
  logoSlot: 'foot' | 'head'
  /** Nummeret stort under bjelken, navnet som undertekst — som i Lagersystemet */
  hero?: boolean
  /** Hjørnemerker i `accent` rundt QR-koden */
  qrMarks?: boolean
  /** Stripe i `accent` langs venstre kant med «UTSTYR NUMMER» på høykant */
  sideStripe?: boolean
  /** Linje innenfor kanten — hvit på farget bunn, i `accent` på papir */
  innerLine?: boolean
  /** Saks ved den stiplede klippekanten */
  scissors?: boolean
  /** Strek i denne fargen under bjelken */
  bandRule?: string
  /** Nummerfeltet går helt ut til kanten (bjelken gjør det alltid) */
  badgeBleed?: boolean
  /** Felt i `accent` nederst med logo og ID */
  footBand?: boolean
  /** Rutepapir eller prikker i bakgrunnen */
  pattern?: 'grid' | 'dots'
  /** Stablet nummer med kantlinje i stedet for fylt felt */
  outlined?: boolean
  /** Merke for hull øverst, til en hengelapp som festes med strips */
  hull?: boolean
  /** Nummerfeltet nederst, under navnet */
  badgeLast?: boolean
  /** Mest mulig plass til QR-koden: smalt nummerfelt, ingen beskrivelse */
  qrFocus?: boolean
  /** Ramme i `accent` rundt QR-koden */
  qrFrame?: boolean
}

export const HM_RED = '#e40112'
export const SVART = '#0f0f0f'
export const HVIT = '#ffffff'

// Gruppe for gruppe. Innenfor gruppen står variantene ved siden av designet
// de bygger på — «Kontur» og «Svart kontur», «Fane» og «Svart fane».
export const LABEL_THEMES: LabelTheme[] = [
  // ── Enkle ────────────────────────────────────────────────────────────────
  {
    id: 'plain', name: 'Standard', hint: 'I QR-kodens egen farge', gruppe: 'enkle',
    accent: null, border: null,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'hauge', name: 'Hauge Maskin', hint: 'Rød badge og svart ramme', gruppe: 'enkle',
    accent: HM_RED,
    // Svart ramme som konturen i logoen — rødt er forbeholdt badgen
    border: '#000000',
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'svarthvitt', name: 'Svart-hvitt', hint: 'For skrivere uten farge', gruppe: 'enkle',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'kontur', name: 'Kontur', hint: 'Bare streker — sparer blekk', gruppe: 'enkle',
    accent: HM_RED, border: null,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'svartkontur', name: 'Svart kontur', hint: 'Bare svarte streker — sparer blekk', gruppe: 'enkle',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'minimal', name: 'Minimal', hint: 'Uten ramme — til stansede ark', gruppe: 'enkle',
    accent: HM_RED, border: null,
    surface: 'paper', frame: 'none', corners: 'square', badge: 'rule', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'minimalsvart', name: 'Minimal svart', hint: 'Uten ramme, med svart strek', gruppe: 'enkle',
    accent: SVART, border: null,
    surface: 'paper', frame: 'none', corners: 'square', badge: 'rule', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'teknisk', name: 'Teknisk', hint: 'Tegningshode i svart-hvitt', gruppe: 'enkle',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'cells', type: 'mono', logoSlot: 'foot',
    qrMarks: true,
  },
  {
    id: 'tekniskrod', name: 'Teknisk rød', hint: 'Tegningshode med rødt nummerfelt', gruppe: 'enkle',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'cells', type: 'mono', logoSlot: 'foot',
    qrMarks: true,
  },
  {
    id: 'millimeter', name: 'Millimeter', hint: 'Rutepapir, som en arbeidstegning', gruppe: 'enkle',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'fill', type: 'sans', logoSlot: 'foot',
    pattern: 'grid',
  },
  {
    id: 'prikkpapir', name: 'Prikkpapir', hint: 'Prikker i bakgrunnen', gruppe: 'enkle',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
    pattern: 'dots',
  },
  {
    id: 'nederst', name: 'Nummer nederst', hint: 'QR-koden øverst, nummeret under', gruppe: 'enkle',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
    badgeLast: true,
  },
  {
    id: 'storqr', name: 'Stor QR', hint: 'Størst mulig kode — skannes på avstand', gruppe: 'enkle',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'rule', type: 'sans', logoSlot: 'foot',
    qrFocus: true,
  },
  {
    id: 'storqrsvart', name: 'Stor QR svart', hint: 'Størst mulig kode, svart nummerfelt', gruppe: 'enkle',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'fill', type: 'sans', logoSlot: 'foot',
    qrFocus: true,
  },

  // ── Kraftige ─────────────────────────────────────────────────────────────
  {
    id: 'bjelke', name: 'Fargebjelke', hint: 'Samme stil som Lagersystemet', gruppe: 'kraftige',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'head',
    hero: true,
  },
  {
    id: 'svartbjelke', name: 'Svart bjelke', hint: 'Som Fargebjelke, i svart med rød strek', gruppe: 'kraftige',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'head',
    hero: true, bandRule: HM_RED,
  },
  {
    id: 'stort', name: 'Stort nummer', hint: 'Leses på lang avstand', gruppe: 'kraftige',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'stack', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'rammetnr', name: 'Rammet nummer', hint: 'Stort nummer i rød ramme', gruppe: 'kraftige',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'stack', type: 'sans', logoSlot: 'foot',
    outlined: true,
  },
  {
    id: 'banner', name: 'Banner', hint: 'Stort nummer i svart felt', gruppe: 'kraftige',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'stack', type: 'sans', logoSlot: 'foot',
    badgeBleed: true,
  },
  {
    id: 'rodbanner', name: 'Rødt banner', hint: 'Stort nummer i rødt felt', gruppe: 'kraftige',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'stack', type: 'sans', logoSlot: 'foot',
    badgeBleed: true,
  },
  {
    id: 'topp', name: 'Svart topp', hint: 'Svart felt øverst, rød strek under', gruppe: 'kraftige',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
    bandRule: HM_RED,
  },
  {
    id: 'rodtopp', name: 'Rød topp', hint: 'Rødt felt øverst, svart strek under', gruppe: 'kraftige',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
    bandRule: SVART,
  },
  {
    id: 'rodbunn', name: 'Rød bunn', hint: 'Rødt felt nederst med logo', gruppe: 'kraftige',
    accent: HM_RED, border: SVART, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'rule', type: 'sans', logoSlot: 'foot',
    footBand: true,
  },
  {
    id: 'svartbunn', name: 'Svart bunn', hint: 'Svart felt nederst med logo', gruppe: 'kraftige',
    accent: SVART, border: SVART, badgeColor: HM_RED,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
    footBand: true,
  },
  {
    id: 'svartrod', name: 'Svart og rødt', hint: 'Svart felt øverst, rødt felt nederst', gruppe: 'kraftige',
    accent: HM_RED, border: SVART, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
    footBand: true,
  },
  {
    id: 'rodtoppbunn', name: 'Rød topp og bunn', hint: 'Røde felt øverst og nederst', gruppe: 'kraftige',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
    bandRule: SVART, footBand: true,
  },
  {
    id: 'todelt', name: 'Todelt', hint: 'Svart tekstfelt, rødt nummerfelt', gruppe: 'kraftige',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'split', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'todeltomvendt', name: 'Todelt omvendt', hint: 'Rødt tekstfelt, svart nummerfelt', gruppe: 'kraftige',
    accent: HM_RED, border: SVART, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'split', type: 'heavy', logoSlot: 'foot',
  },

  // ── Mørke ────────────────────────────────────────────────────────────────
  {
    id: 'mork', name: 'Mørk', hint: 'Svart etikett — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null,
    surface: 'dark', frame: 'none', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'natt', name: 'Natt', hint: 'Svart med rød ramme — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: HM_RED,
    surface: 'dark', frame: 'thick', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'nattbaand', name: 'Natt med bånd', hint: 'Svart med røde bånd — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: HM_RED, badgeColor: HVIT,
    surface: 'dark', frame: 'bands', corners: 'square', badge: 'rule', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'negativ', name: 'Negativ', hint: 'Svart med hvit linje — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null, badgeColor: HVIT,
    surface: 'dark', frame: 'none', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
    innerLine: true,
  },
  {
    id: 'morkbjelke', name: 'Mørk bjelke', hint: 'Svart med rød bjelke — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null,
    surface: 'dark', frame: 'none', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'morkstripe', name: 'Mørk stripe', hint: 'Svart med rød sidestripe — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null, badgeColor: HVIT,
    surface: 'dark', frame: 'none', corners: 'square', badge: 'number', type: 'sans', logoSlot: 'foot',
    sideStripe: true,
  },
  {
    id: 'morkprikk', name: 'Mørk prikk', hint: 'Svart med rød sirkel — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null,
    surface: 'dark', frame: 'none', corners: 'round', badge: 'dot', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'morkfane', name: 'Mørk fane', hint: 'Svart med rød fane — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null,
    surface: 'dark', frame: 'none', corners: 'round', badge: 'tab', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'morkteknisk', name: 'Mørk teknisk', hint: 'Tegningshode i hvitt på svart — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null, badgeColor: HVIT,
    surface: 'dark', frame: 'none', corners: 'square', badge: 'cells', type: 'mono', logoSlot: 'foot',
    qrMarks: true,
  },
  {
    id: 'morkstempel', name: 'Mørkt stempel', hint: 'Hvitt stempel på svart — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: HM_RED, badgeColor: HVIT,
    surface: 'dark', frame: 'thin', corners: 'round', badge: 'stamp', type: 'mono', logoSlot: 'foot',
  },
  {
    id: 'skilt', name: 'Skilt', hint: 'Hel rød etikett — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null,
    surface: 'red', frame: 'none', corners: 'round', badge: 'stack', type: 'sans', logoSlot: 'foot',
    innerLine: true,
  },
  {
    id: 'rodflate', name: 'Rød flate', hint: 'Hel rød etikett — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null, badgeColor: HVIT,
    surface: 'red', frame: 'none', corners: 'round', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'rodstabel', name: 'Rød stabel', hint: 'Rød med stort nummer i svart felt — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null, badgeColor: SVART,
    surface: 'red', frame: 'none', corners: 'round', badge: 'stack', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'signal', name: 'Signal', hint: 'Rød med svart bjelke — bruker mye blekk', gruppe: 'morke',
    accent: HM_RED, border: null, badgeColor: SVART,
    surface: 'red', frame: 'none', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
  },

  // ── Rammer ───────────────────────────────────────────────────────────────
  {
    id: 'ramme', name: 'Rød ramme', hint: 'Tykk rød ramme', gruppe: 'rammer',
    accent: HM_RED, border: null,
    surface: 'paper', frame: 'thick', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'rundramme', name: 'Rund ramme', hint: 'Tykk rød ramme med runde hjørner', gruppe: 'rammer',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'thick', corners: 'pill', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'kraftig', name: 'Kraftig', hint: 'Ekstra tykk svart ramme', gruppe: 'rammer',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'heavy', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'kraftigrod', name: 'Kraftig rød', hint: 'Ekstra tykk rød ramme', gruppe: 'rammer',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'heavy', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'klassisk', name: 'Klassisk', hint: 'Dobbel svart ramme', gruppe: 'rammer',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'double', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'dobbelrod', name: 'Dobbel rød', hint: 'Dobbel rød ramme', gruppe: 'rammer',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'double', corners: 'square', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'rammeiramme', name: 'Ramme i ramme', hint: 'Svart ramme med rød linje innenfor', gruppe: 'rammer',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
    innerLine: true,
  },
  {
    id: 'kutt', name: 'Kuttemerker', hint: 'Merker i hjørnene, ingen ramme', gruppe: 'rammer',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'corners', corners: 'square', badge: 'rule', type: 'mono', logoSlot: 'foot',
  },
  {
    id: 'rodehjorner', name: 'Røde hjørner', hint: 'Røde merker i hjørnene, ingen ramme', gruppe: 'rammer',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'corners', corners: 'square', badge: 'outline', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'baand', name: 'Rødt bånd', hint: 'Røde bånd oppe og nede', gruppe: 'rammer',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'bands', corners: 'square', badge: 'rule', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'svartebaand', name: 'Svarte bånd', hint: 'Svarte bånd oppe og nede', gruppe: 'rammer',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'bands', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'varsel', name: 'Varselramme', hint: 'Rød og hvit stripet ramme', gruppe: 'rammer',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'hazard', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'varselsvart', name: 'Varsel svart', hint: 'Svart og hvit stripet ramme', gruppe: 'rammer',
    accent: SVART, border: SVART, badgeColor: HM_RED,
    surface: 'paper', frame: 'hazard', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'qrramme', name: 'QR-ramme', hint: 'Rød ramme rundt QR-koden', gruppe: 'rammer',
    accent: HM_RED, border: SVART, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
    qrFrame: true,
  },

  // ── Former ───────────────────────────────────────────────────────────────
  {
    id: 'sperre', name: 'Sperrebånd', hint: 'Røde og hvite striper', gruppe: 'former',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thick', corners: 'square', badge: 'stripes', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'stripe', name: 'Sidestripe', hint: 'Rød stripe langs kanten', gruppe: 'former',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'number', type: 'sans', logoSlot: 'foot',
    sideStripe: true,
  },
  {
    id: 'svartstripe', name: 'Svart stripe', hint: 'Svart stripe langs kanten, rødt nummer', gruppe: 'former',
    accent: SVART, border: SVART, badgeColor: HM_RED,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'number', type: 'sans', logoSlot: 'foot',
    sideStripe: true,
  },
  {
    id: 'prikk', name: 'Prikk', hint: 'Nummeret i en rød sirkel', gruppe: 'former',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'dot', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'rute', name: 'Rute', hint: 'Nummeret i en rød firkant', gruppe: 'former',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'square', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'svartrute', name: 'Svart rute', hint: 'Nummeret i en svart firkant', gruppe: 'former',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'square', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'fane', name: 'Fane', hint: 'Nummeret i en rød fane i hjørnet', gruppe: 'former',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'tab', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'svartfane', name: 'Svart fane', hint: 'Nummeret i en svart fane i hjørnet', gruppe: 'former',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'tab', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'stempel', name: 'Stempel', hint: 'Nummeret i et rødt stempel', gruppe: 'former',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'stamp', type: 'mono', logoSlot: 'foot',
  },
  {
    id: 'svartstempel', name: 'Svart stempel', hint: 'Nummeret i et svart stempel', gruppe: 'former',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'stamp', type: 'mono', logoSlot: 'foot',
  },
  {
    id: 'pille', name: 'Pille', hint: 'Runde hjørner og rundt nummerfelt', gruppe: 'former',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'pill', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'svartpille', name: 'Svart pille', hint: 'Runde hjørner og svart nummerfelt', gruppe: 'former',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'pill', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'hengelapp', name: 'Hengelapp', hint: 'Merke for hull — henges på med strips', gruppe: 'former',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
    hull: true,
  },
  {
    id: 'klipp', name: 'Klippelapp', hint: 'Stiplet kant å klippe etter', gruppe: 'former',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'dashed', corners: 'square', badge: 'fill', type: 'mono', logoSlot: 'foot',
    scissors: true,
  },

  // ── Lager ────────────────────────────────────────────────────────────────
  // Hylla har sin fargekode i verkstedet, og lappen bærer den samme. Navnet
  // på en hylle ER hyllenummeret, så det står bare én gang — stort.
  {
    id: 'hylle', name: 'Lagerhylle', hint: 'Bjelke i hyllas farge og stort hyllenummer', gruppe: 'lager',
    accent: null, border: null, merke: 'HYLLE', maksInfo: 2,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
    hero: true,
  },
]

export const DEFAULT_THEME = LABEL_THEMES[0]

export const getTheme = (id: LabelThemeId | undefined): LabelTheme =>
  LABEL_THEMES.find(t => t.id === id) || DEFAULT_THEME

/** Relativ luminans etter WCAG 2: 0 for svart, 1 for hvitt. null for noe som ikke er #rrggbb. */
function luminans(hex: string): number | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (!m) return null
  const lin = (c: string) => {
    const v = parseInt(c, 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(m[1]) + 0.7152 * lin(m[2]) + 0.0722 * lin(m[3])
}

/** Kontrasten mellom to farger etter WCAG, fra 1 (like) til 21 (svart på hvitt) */
export function kontrast(a: string, b: string): number {
  const la = luminans(a), lb = luminans(b)
  if (la === null || lb === null) return 1
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Farget tekst rett på etiketten — kontur, stempel, tegningshode. Holder ikke
 * fargen 4,5:1 mot bunnen (som vanlig tekst skal etter WCAG), blir teksten i
 * `reserve` og fargen sitter igjen i streken rundt. Rødt på svart er 3,9:1.
 */
export function lesbarFarge(farge: string, bunn: string, reserve: string): string {
  return kontrast(farge, bunn) >= 4.5 ? farge : reserve
}

/**
 * Tekstfargen oppå et fargefelt. Hvit så lenge kontrasten holder til stor,
 * fet tekst (WCAG 3:1) — ellers svart, som på gult, lysegrønt og oransje der
 * hvit tekst nesten forsvinner på papir.
 */
export function tekstPå(hex: string): string {
  if (luminans(hex) === null) return HVIT
  return kontrast(HVIT, hex) >= 3 ? HVIT : SVART
}

/**
 * Grå strek der fargen selv forsvinner. En hvit hylle tegnet med hvit ramme og
 * hvitt nummerfelt på hvitt papir er usynlig — samme grå kant som
 * Lagersystemet tegner rundt sine hvite hyller.
 */
export const LYS_KANT = '#9a9a9a'

/** Fargen selv, eller grått når den knapt skiller seg fra bunnen */
export function synligStrek(farge: string, bunn: string = HVIT): string {
  return luminans(farge) !== null && kontrast(farge, bunn) < 1.3 ? LYS_KANT : farge
}

// ── Husket valg ─────────────────────────────────────────────────────────────
// Designet og logoen man valgte sist, så man slipper å velge på nytt hver gang.

export interface UtskriftValg {
  design: LabelThemeId
  logo: boolean
}

export const STANDARD_VALG: UtskriftValg = { design: 'plain', logo: true }

const VALG_NØKKEL = 'qr-admin.utskriftvalg'

/** localStorage, eller null der nettleseren nekter (privat modus, blokkert lagring) */
export function nettleserLager(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export function lesUtskriftValg(lager: Pick<Storage, 'getItem'> | null): UtskriftValg {
  try {
    const rå = lager?.getItem(VALG_NØKKEL)
    if (!rå) return { ...STANDARD_VALG }
    const v = JSON.parse(rå)
    return {
      design: LABEL_THEMES.some(t => t.id === v?.design) ? v.design : STANDARD_VALG.design,
      logo: typeof v?.logo === 'boolean' ? v.logo : STANDARD_VALG.logo,
    }
  } catch {
    return { ...STANDARD_VALG }
  }
}

export function lagreUtskriftValg(valg: UtskriftValg, lager: Pick<Storage, 'setItem'> | null): void {
  try {
    lager?.setItem(VALG_NØKKEL, JSON.stringify(valg))
  } catch {
    // Full eller blokkert lagring: valget huskes bare ikke til neste gang
  }
}
