/**
 * Design for QR-etikettene.
 *
 * «Standard» er den nøytrale etiketten vi alltid har hatt, i QR-kodens egen
 * farge. «Hauge Maskin» og de tolv designene etter den bruker bare
 * Hauge Maskin-rødt, svart og hvitt.
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
  | 'plain' | 'hauge'
  | 'bjelke' | 'sperre' | 'mork' | 'kontur' | 'minimal' | 'teknisk'
  | 'skilt' | 'stort' | 'stripe' | 'klipp' | 'ramme' | 'topp'
  | 'svarthvitt' | 'rodtopp' | 'rodbunn' | 'natt' | 'klassisk' | 'kutt' | 'banner' | 'millimeter'
  | 'todelt' | 'nederst' | 'storqr' | 'baand' | 'prikk' | 'qrramme' | 'morkbjelke' | 'rammeiramme'
  | 'varsel' | 'fane' | 'stempel' | 'svartrod' | 'rammetnr' | 'rodflate' | 'negativ' | 'pille'
  | 'hengelapp' | 'rute' | 'prikkpapir' | 'kraftig'

export interface LabelTheme {
  id: LabelThemeId
  name: string
  /** Kort forklaring i designvelgeren */
  hint: string
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
   *  cells    to ruter med strek, som et tegningshode
   *  rule     ingen flate, bare en strek under
   *  stack    teksten over et stort nummer
   *  number   bare nummeret — teksten står i sidestripen
   *  split    to felt: svart med teksten, farget med nummeret
   *  dot      nummeret i en sirkel, teksten ved siden av
   *  square   nummeret i en firkant, teksten ved siden av
   *  tab      nummeret i en fane som henger fra hjørnet, teksten ved siden av
   *  stamp    dobbel kantlinje rundt tekst og nummer, som et stempel
   */
  badge: 'fill' | 'outline' | 'band' | 'stripes' | 'cells' | 'rule' | 'stack' | 'number' | 'split' | 'dot'
    | 'square' | 'tab' | 'stamp'
  /** Farge på nummerfeltet når den skal være en annen enn `accent` */
  badgeColor?: string
  /** Skrift på navn og nummer */
  type: 'sans' | 'heavy' | 'mono'
  /** Hvor HM-logoen står når den er slått på: bunnraden eller øverst */
  logoSlot: 'foot' | 'head'
  /** Nummeret stort under bjelken, navnet som undertekst — som i Lagersystemet */
  hero?: boolean
  /** Hjørnemerker rundt QR-koden */
  qrMarks?: boolean
  /** Rød stripe langs venstre kant med «UTSTYR NUMMER» på høykant */
  sideStripe?: boolean
  /** Linje innenfor kanten — hvit på farget bunn, i `accent` på papir */
  innerLine?: boolean
  /** Saks ved den stiplede klippekanten */
  scissors?: boolean
  /** Strek i denne fargen under bjelken */
  bandRule?: string
  /** Nummerfeltet går helt ut til kanten (bjelken gjør det alltid) */
  badgeBleed?: boolean
  /** Farget felt nederst med logo og ID */
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

export const LABEL_THEMES: LabelTheme[] = [
  {
    id: 'plain', name: 'Standard', hint: 'I QR-kodens egen farge',
    accent: null, border: null,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'hauge', name: 'Hauge Maskin', hint: 'Rød badge og svart ramme',
    accent: HM_RED,
    // Svart ramme som konturen i logoen — rødt er forbeholdt badgen
    border: '#000000',
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'bjelke', name: 'Fargebjelke', hint: 'Samme stil som Lagersystemet',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'head',
    hero: true,
  },
  {
    id: 'sperre', name: 'Sperrebånd', hint: 'Røde og hvite striper',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thick', corners: 'square', badge: 'stripes', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'mork', name: 'Mørk', hint: 'Svart etikett — bruker mye blekk',
    accent: HM_RED, border: null,
    surface: 'dark', frame: 'none', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'kontur', name: 'Kontur', hint: 'Bare streker — sparer blekk',
    accent: HM_RED, border: null,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'minimal', name: 'Minimal', hint: 'Uten ramme — til stansede ark',
    accent: HM_RED, border: null,
    surface: 'paper', frame: 'none', corners: 'square', badge: 'rule', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'teknisk', name: 'Teknisk', hint: 'Tegningshode i svart-hvitt',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'cells', type: 'mono', logoSlot: 'foot',
    qrMarks: true,
  },
  {
    id: 'skilt', name: 'Skilt', hint: 'Hel rød etikett — bruker mye blekk',
    accent: HM_RED, border: null,
    surface: 'red', frame: 'none', corners: 'round', badge: 'stack', type: 'sans', logoSlot: 'foot',
    innerLine: true,
  },
  {
    id: 'stort', name: 'Stort nummer', hint: 'Leses på lang avstand',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'stack', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'stripe', name: 'Sidestripe', hint: 'Rød stripe langs kanten',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'number', type: 'sans', logoSlot: 'foot',
    sideStripe: true,
  },
  {
    id: 'klipp', name: 'Klippelapp', hint: 'Stiplet kant å klippe etter',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'dashed', corners: 'square', badge: 'fill', type: 'mono', logoSlot: 'foot',
    scissors: true,
  },
  {
    id: 'ramme', name: 'Rød ramme', hint: 'Tykk rød ramme',
    accent: HM_RED, border: null,
    surface: 'paper', frame: 'thick', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'topp', name: 'Svart topp', hint: 'Svart felt øverst, rød strek under',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
    bandRule: HM_RED,
  },
  {
    id: 'svarthvitt', name: 'Svart-hvitt', hint: 'For skrivere uten farge',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'rodtopp', name: 'Rød topp', hint: 'Rødt felt øverst, svart strek under',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
    bandRule: SVART,
  },
  {
    id: 'rodbunn', name: 'Rød bunn', hint: 'Rødt felt nederst med logo',
    accent: HM_RED, border: SVART, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'rule', type: 'sans', logoSlot: 'foot',
    footBand: true,
  },
  {
    id: 'natt', name: 'Natt', hint: 'Svart med rød ramme — bruker mye blekk',
    accent: HM_RED, border: HM_RED,
    surface: 'dark', frame: 'thick', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'klassisk', name: 'Klassisk', hint: 'Dobbel svart ramme',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'double', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'kutt', name: 'Kuttemerker', hint: 'Merker i hjørnene, ingen ramme',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'corners', corners: 'square', badge: 'rule', type: 'mono', logoSlot: 'foot',
  },
  {
    id: 'banner', name: 'Banner', hint: 'Stort nummer i svart felt',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'stack', type: 'sans', logoSlot: 'foot',
    badgeBleed: true,
  },
  {
    id: 'millimeter', name: 'Millimeter', hint: 'Rutepapir, som en arbeidstegning',
    accent: SVART, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'fill', type: 'sans', logoSlot: 'foot',
    pattern: 'grid',
  },
  {
    id: 'todelt', name: 'Todelt', hint: 'Svart tekstfelt, rødt nummerfelt',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'split', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'nederst', name: 'Nummer nederst', hint: 'QR-koden øverst, nummeret under',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
    badgeLast: true,
  },
  {
    id: 'storqr', name: 'Stor QR', hint: 'Størst mulig kode — skannes på avstand',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'rule', type: 'sans', logoSlot: 'foot',
    qrFocus: true,
  },
  {
    id: 'baand', name: 'Rødt bånd', hint: 'Røde bånd oppe og nede',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'bands', corners: 'square', badge: 'rule', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'prikk', name: 'Prikk', hint: 'Nummeret i en rød sirkel',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'dot', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'qrramme', name: 'QR-ramme', hint: 'Rød ramme rundt QR-koden',
    accent: HM_RED, border: SVART, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
    qrFrame: true,
  },
  {
    id: 'morkbjelke', name: 'Mørk bjelke', hint: 'Svart med rød bjelke — bruker mye blekk',
    accent: HM_RED, border: null,
    surface: 'dark', frame: 'none', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'rammeiramme', name: 'Ramme i ramme', hint: 'Svart ramme med rød linje innenfor',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
    innerLine: true,
  },
  {
    id: 'varsel', name: 'Varselramme', hint: 'Rød og hvit stripet ramme',
    accent: HM_RED, border: HM_RED, badgeColor: SVART,
    surface: 'paper', frame: 'hazard', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'fane', name: 'Fane', hint: 'Nummeret i en rød fane i hjørnet',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'tab', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'stempel', name: 'Stempel', hint: 'Nummeret i et rødt stempel',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'stamp', type: 'mono', logoSlot: 'foot',
  },
  {
    id: 'svartrod', name: 'Svart og rødt', hint: 'Svart felt øverst, rødt felt nederst',
    accent: HM_RED, border: SVART, badgeColor: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'band', type: 'heavy', logoSlot: 'foot',
    footBand: true,
  },
  {
    id: 'rammetnr', name: 'Rammet nummer', hint: 'Stort nummer i rød ramme',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'stack', type: 'sans', logoSlot: 'foot',
    outlined: true,
  },
  {
    id: 'rodflate', name: 'Rød flate', hint: 'Hel rød etikett — bruker mye blekk',
    accent: HM_RED, border: null, badgeColor: HVIT,
    surface: 'red', frame: 'none', corners: 'round', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'negativ', name: 'Negativ', hint: 'Svart med hvit linje — bruker mye blekk',
    accent: HM_RED, border: null, badgeColor: HVIT,
    surface: 'dark', frame: 'none', corners: 'round', badge: 'outline', type: 'sans', logoSlot: 'foot',
    innerLine: true,
  },
  {
    id: 'pille', name: 'Pille', hint: 'Runde hjørner og rundt nummerfelt',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'pill', badge: 'fill', type: 'sans', logoSlot: 'foot',
  },
  {
    id: 'hengelapp', name: 'Hengelapp', hint: 'Merke for hull — henges på med strips',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
    hull: true,
  },
  {
    id: 'rute', name: 'Rute', hint: 'Nummeret i en rød firkant',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'square', badge: 'square', type: 'heavy', logoSlot: 'foot',
  },
  {
    id: 'prikkpapir', name: 'Prikkpapir', hint: 'Prikker i bakgrunnen',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'thin', corners: 'round', badge: 'fill', type: 'sans', logoSlot: 'foot',
    pattern: 'dots',
  },
  {
    id: 'kraftig', name: 'Kraftig', hint: 'Ekstra tykk svart ramme',
    accent: HM_RED, border: SVART,
    surface: 'paper', frame: 'heavy', corners: 'square', badge: 'fill', type: 'heavy', logoSlot: 'foot',
  },
]

export const DEFAULT_THEME = LABEL_THEMES[0]

export const getTheme = (id: LabelThemeId | undefined): LabelTheme =>
  LABEL_THEMES.find(t => t.id === id) || DEFAULT_THEME

/**
 * Tekstfargen oppå et fargefelt. Hvit så lenge kontrasten holder til stor,
 * fet tekst (WCAG 3:1) — ellers svart, som på gult, lysegrønt og oransje der
 * hvit tekst nesten forsvinner på papir.
 */
export function tekstPå(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
  if (!m) return HVIT
  const lin = (c: string) => {
    const v = parseInt(c, 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const l = 0.2126 * lin(m[1]) + 0.7152 * lin(m[2]) + 0.0722 * lin(m[3])
  return 1.05 / (l + 0.05) >= 3 ? HVIT : SVART
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
