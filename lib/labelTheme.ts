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
  /** Rammen rundt etiketten. Tykk ramme vokser med etiketten */
  frame: 'thin' | 'thick' | 'dashed' | 'none'
  corners: 'round' | 'square'
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
   */
  badge: 'fill' | 'outline' | 'band' | 'stripes' | 'cells' | 'rule' | 'stack' | 'number'
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
  /** Hvit linje innenfor kanten, som på et skilt */
  innerLine?: boolean
  /** Saks ved den stiplede klippekanten */
  scissors?: boolean
  /** Rød strek under den svarte bjelken */
  bandRule?: boolean
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
    bandRule: true,
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
