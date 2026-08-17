/**
 * Tema for QR-etikettene.
 *
 * «Standard» er den nøytrale etiketten vi alltid har hatt: svart/egen farge og
 * ingen logo. «Hauge Maskin» setter merkefargen og legger HM-logoen nederst på
 * klistremerket, slik at utstyret er merket som vårt.
 *
 * Fargen er den eksakte røden i logofila, så badge, ramme og logo bruker samme
 * røde på skjerm og på papir.
 */
export type LabelThemeId = 'plain' | 'hauge'

export interface LabelTheme {
  id: LabelThemeId
  name: string
  /** Kort forklaring i print-dialogene */
  hint: string
  /** Farge på nummer-badgen. null = behold fargen QR-koden har fra før */
  accent: string | null
  /** Farge på ramme og skillestreker. null = følg `accent` */
  border: string | null
  /** Vis HM-logoen nederst på etiketten */
  logo: boolean
  /** Tekst ved siden av logoen — droppes automatisk på smale etiketter */
  wordmark: string | null
}

export const HM_RED = '#e40112'

export const LABEL_THEMES: LabelTheme[] = [
  {
    id: 'plain',
    name: 'Standard',
    hint: 'Nøytral etikett uten logo',
    accent: null,
    border: null,
    logo: false,
    wordmark: null,
  },
  {
    id: 'hauge',
    name: 'Hauge Maskin',
    hint: 'HM-logo, rød badge og svart ramme',
    accent: HM_RED,
    // Svart ramme som konturen i logoen — rødt er forbeholdt badgen
    border: '#000000',
    logo: true,
    wordmark: 'HAUGE MASKIN',
  },
]

export const DEFAULT_THEME = LABEL_THEMES[0]

export const getTheme = (id: LabelThemeId | undefined): LabelTheme =>
  LABEL_THEMES.find(t => t.id === id) || DEFAULT_THEME
