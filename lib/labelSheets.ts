/**
 * Forhåndsinnstillinger for vanlige A4 etikettark (adhesive ark).
 *
 * Alle mål i mm. `pitchX`/`pitchY` er avstanden fra venstre kant av én etikett
 * til venstre kant av neste — altså etikettbredde + mellomrom.
 *
 * De «delte» arkene (A4 delt i N) er matematisk eksakte: etikettene ligger kant
 * i kant og dekker hele arket.
 *
 * Avery- og Zweckform-arkene er stanset sentrert på A4, så margene følger av
 * etikettmål, antall og senteravstand: (210 − bredden av rutenettet) / 2 og
 * tilsvarende i høyden. Avery-målene er kontrollert mot produsentens maler
 * (L7169: 9,5 mm topp og 4,65 mm side — ikke 8,5 og 5,0 som sto her før).
 * Ta likevel en testutskrift på vanlig papir før du kjører et ekte etikettark.
 */
export interface LabelSheet {
  id: string
  name: string
  /** Hvor arket hører hjemme i listen */
  gruppe: 'kant' | 'avery' | 'zweckform' | 'egen'
  /** Etikettstørrelse i mm */
  w: number
  h: number
  cols: number
  rows: number
  /** Marg fra arkkanten til første etikett */
  marginTop: number
  marginLeft: number
  /** Senteravstand mellom etiketter */
  pitchX: number
  pitchY: number
}

export const A4 = { w: 210, h: 297 }

/**
 * Den ytterste kanten av arket som en vanlig kontorskriver ikke printer på.
 * Laser ligger typisk på 4,2 mm, blekk på 3–5 mm. QR-kode og tekst på
 * etiketter som ligger mot arkkanten, holdes innenfor denne.
 */
export const SKRIVERKANT = 4.5

export const LABEL_SHEETS: LabelSheet[] = [
  // ---- A4 delt kant i kant (ingen mellomrom) ----
  // Helt ark med 10mm luft, siden de fleste skrivere ikke printer helt ut i kanten
  { id: 'a4-1',  gruppe: 'kant', name: '1 per ark — helt A4, 190 × 277', w: 190, h: 277, cols: 1, rows: 1,  marginTop: 10, marginLeft: 10, pitchX: 190, pitchY: 277 },
  { id: 'a4-2',  gruppe: 'kant', name: '2 per ark — 210 × 148,5',  w: 210,   h: 148.5,  cols: 1, rows: 2,  marginTop: 0, marginLeft: 0, pitchX: 210,   pitchY: 148.5  },
  { id: 'a4-4',  gruppe: 'kant', name: '4 per ark — 105 × 148,5',  w: 105,   h: 148.5,  cols: 2, rows: 2,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 148.5  },
  { id: 'a4-8',  gruppe: 'kant', name: '8 per ark — 105 × 74,2',   w: 105,   h: 74.25,  cols: 2, rows: 4,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 74.25  },
  { id: 'a4-10', gruppe: 'kant', name: '10 per ark — 105 × 59,4',  w: 105,   h: 59.4,   cols: 2, rows: 5,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 59.4   },
  { id: 'a4-12', gruppe: 'kant', name: '12 per ark — 105 × 49,5',  w: 105,   h: 49.5,   cols: 2, rows: 6,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 49.5   },
  // 297 / 8 — 37,13 ble 0,04 mm for høyt
  { id: 'a4-16', gruppe: 'kant', name: '16 per ark — 105 × 37,1',  w: 105,   h: 37.125, cols: 2, rows: 8,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 37.125 },
  // Var 70 × 49,5 med 8 rader = 396 mm: de to nederste radene havnet utenfor
  // arket, og 6 av 24 etiketter forsvant i stillhet på hvert ark
  { id: 'a4-24', gruppe: 'kant', name: '24 per ark — 70 × 37,1',   w: 70,    h: 37.125, cols: 3, rows: 8,  marginTop: 0, marginLeft: 0, pitchX: 70,    pitchY: 37.125 },
  { id: 'a4-40', gruppe: 'kant', name: '40 per ark — 52,5 × 29,7', w: 52.5,  h: 29.7,   cols: 4, rows: 10, marginTop: 0, marginLeft: 0, pitchX: 52.5,  pitchY: 29.7   },

  // ---- Avery (med marger og mellomrom) ----
  { id: 'l7169', gruppe: 'avery', name: 'Avery L7169 — 99,1 × 139,0 (4)', w: 99.1, h: 139.0, cols: 2, rows: 2,  marginTop: 9.5,   marginLeft: 4.65, pitchX: 101.6, pitchY: 139.0 },
  { id: 'l7166', gruppe: 'avery', name: 'Avery L7166 — 99,1 × 93,1 (6)',  w: 99.1, h: 93.1,  cols: 2, rows: 3,  marginTop: 8.85,  marginLeft: 4.65, pitchX: 101.6, pitchY: 93.1  },
  { id: 'l7165', gruppe: 'avery', name: 'Avery L7165 — 99,1 × 67,7 (8)',  w: 99.1, h: 67.7,  cols: 2, rows: 4,  marginTop: 13.1,  marginLeft: 4.65, pitchX: 101.6, pitchY: 67.7  },
  { id: 'l7173', gruppe: 'avery', name: 'Avery L7173 — 99,1 × 57 (10)',   w: 99.1, h: 57,    cols: 2, rows: 5,  marginTop: 6,     marginLeft: 4.65, pitchX: 101.6, pitchY: 57    },
  { id: 'l7163', gruppe: 'avery', name: 'Avery L7163 — 99,1 × 38,1 (14)', w: 99.1, h: 38.1,  cols: 2, rows: 7,  marginTop: 15.15, marginLeft: 4.65, pitchX: 101.6, pitchY: 38.1  },
  { id: 'l7162', gruppe: 'avery', name: 'Avery L7162 — 99,1 × 33,9 (16)', w: 99.1, h: 33.9,  cols: 2, rows: 8,  marginTop: 12.9,  marginLeft: 4.65, pitchX: 101.6, pitchY: 33.9  },
  { id: 'l7161', gruppe: 'avery', name: 'Avery L7161 — 63,5 × 46,6 (18)', w: 63.5, h: 46.6,  cols: 3, rows: 6,  marginTop: 8.7,   marginLeft: 7.25, pitchX: 66.0,  pitchY: 46.6  },
  { id: 'l7160', gruppe: 'avery', name: 'Avery L7160 — 63,5 × 38,1 (21)', w: 63.5, h: 38.1,  cols: 3, rows: 7,  marginTop: 15.15, marginLeft: 7.25, pitchX: 66.0,  pitchY: 38.1  },
  { id: 'l7159', gruppe: 'avery', name: 'Avery L7159 — 63,5 × 33,9 (24)', w: 63.5, h: 33.9,  cols: 3, rows: 8,  marginTop: 12.9,  marginLeft: 7.25, pitchX: 66.0,  pitchY: 33.9  },
  { id: 'l7651', gruppe: 'avery', name: 'Avery L7651 — 38,1 × 21,2 (65)', w: 38.1, h: 21.2,  cols: 5, rows: 13, marginTop: 10.7,  marginLeft: 4.75, pitchX: 40.6,  pitchY: 21.2  },

  // ---- Zweckform (kant i kant på siden, marg oppe og nede) ----
  { id: 'z3426', gruppe: 'zweckform', name: 'Zweckform 3426 — 105 × 70 (8)',  w: 105, h: 70, cols: 2, rows: 4, marginTop: 8.5, marginLeft: 0, pitchX: 105, pitchY: 70 },
  { id: 'z3425', gruppe: 'zweckform', name: 'Zweckform 3425 — 105 × 57 (10)', w: 105, h: 57, cols: 2, rows: 5, marginTop: 6,   marginLeft: 0, pitchX: 105, pitchY: 57 },
  { id: 'z3424', gruppe: 'zweckform', name: 'Zweckform 3424 — 105 × 48 (12)', w: 105, h: 48, cols: 2, rows: 6, marginTop: 4.5, marginLeft: 0, pitchX: 105, pitchY: 48 },
  { id: 'z3423', gruppe: 'zweckform', name: 'Zweckform 3423 — 105 × 35 (16)', w: 105, h: 35, cols: 2, rows: 8, marginTop: 8.5, marginLeft: 0, pitchX: 105, pitchY: 35 },
  { id: 'z3481', gruppe: 'zweckform', name: 'Zweckform 3481 — 70 × 41 (21)',  w: 70,  h: 41, cols: 3, rows: 7, marginTop: 5,   marginLeft: 0, pitchX: 70,  pitchY: 41 },
  { id: 'z3475', gruppe: 'zweckform', name: 'Zweckform 3475 — 70 × 36 (24)',  w: 70,  h: 36, cols: 3, rows: 8, marginTop: 4.5, marginLeft: 0, pitchX: 70,  pitchY: 36 },
  { id: 'z3422', gruppe: 'zweckform', name: 'Zweckform 3422 — 70 × 35 (24)',  w: 70,  h: 35, cols: 3, rows: 8, marginTop: 8.5, marginLeft: 0, pitchX: 70,  pitchY: 35 },
]

// 8 per ark er formatet vi har flest av
export const DEFAULT_SHEET = LABEL_SHEETS.find(s => s.id === 'a4-8')!

export const perSheet = (s: LabelSheet) => s.cols * s.rows

/**
 * Hvor mye av etiketten i rute `i` som ligger i skriverens døde sone, per side.
 * 0 når etiketten ligger trygt innenfor; ellers antall mm innholdet må holde
 * seg unna kanten. Justeringen flytter etikettene, så den regnes med.
 */
export function kantVern(s: LabelSheet, i: number, offsetX = 0, offsetY = 0) {
  const venstre = s.marginLeft + (i % s.cols) * s.pitchX + offsetX
  const topp = s.marginTop + Math.floor(i / s.cols) * s.pitchY + offsetY
  const sone = (avstand: number) => Math.max(0, SKRIVERKANT - avstand)
  return {
    t: sone(topp),
    r: sone(A4.w - (venstre + s.w)),
    b: sone(A4.h - (topp + s.h)),
    l: sone(venstre),
  }
}

// ── Eget format ─────────────────────────────────────────────────────────────
// For ark som ikke står i listen: målene leses av pakken eller måles opp.

export interface EgetArkMål {
  w: number
  h: number
  cols: number
  rows: number
  marginTop: number
  marginLeft: number
  /** Mellomrom mellom etikettene — 0 når de ligger kant i kant */
  gapX: number
  gapY: number
}

// Zweckform 3427-mål: 8 per ark, 105 × 74 mm — det vanligste arket i hyllene
export const STANDARD_EGET: EgetArkMål = {
  w: 105, h: 74, cols: 2, rows: 4, marginTop: 0.5, marginLeft: 0, gapX: 0, gapY: 0,
}

const fmt = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',')

export function lagEgetArk(m: EgetArkMål): { ark: LabelSheet } | { feil: string } {
  const tall = [m.w, m.h, m.cols, m.rows, m.marginTop, m.marginLeft, m.gapX, m.gapY]
  if (tall.some(v => typeof v !== 'number' || !Number.isFinite(v))) return { feil: 'Fyll inn alle målene.' }
  if (m.w <= 0 || m.h <= 0) return { feil: 'Etiketten må ha både bredde og høyde.' }
  if (m.cols < 1 || m.rows < 1 || !Number.isInteger(m.cols) || !Number.isInteger(m.rows)) {
    return { feil: 'Antall etiketter bortover og nedover må være hele tall fra 1.' }
  }
  if (m.marginTop < 0 || m.marginLeft < 0 || m.gapX < 0 || m.gapY < 0) {
    return { feil: 'Marger og mellomrom kan ikke være negative.' }
  }
  const bredde = m.marginLeft + m.cols * m.w + (m.cols - 1) * m.gapX
  const høyde = m.marginTop + m.rows * m.h + (m.rows - 1) * m.gapY
  if (bredde > A4.w + 0.01) return { feil: `Etikettene blir ${fmt(bredde - A4.w)} mm for brede for A4.` }
  if (høyde > A4.h + 0.01) return { feil: `Etikettene blir ${fmt(høyde - A4.h)} mm for høye for A4.` }
  return {
    ark: {
      id: 'egen', gruppe: 'egen',
      name: `Eget format — ${fmt(m.w)} × ${fmt(m.h)} (${m.cols * m.rows})`,
      w: m.w, h: m.h, cols: m.cols, rows: m.rows,
      marginTop: m.marginTop, marginLeft: m.marginLeft,
      pitchX: m.w + m.gapX, pitchY: m.h + m.gapY,
    },
  }
}

const EGET_NØKKEL = 'qr-admin.egetark'

export function lesEgetArk(lager: Pick<Storage, 'getItem'> | null): EgetArkMål {
  try {
    const rå = lager?.getItem(EGET_NØKKEL)
    if (!rå) return { ...STANDARD_EGET }
    const v = JSON.parse(rå)
    const mål = { ...STANDARD_EGET }
    for (const k of Object.keys(STANDARD_EGET) as (keyof EgetArkMål)[]) {
      if (typeof v?.[k] !== 'number') return { ...STANDARD_EGET }
      mål[k] = v[k]
    }
    return 'ark' in lagEgetArk(mål) ? mål : { ...STANDARD_EGET }
  } catch {
    return { ...STANDARD_EGET }
  }
}

export function lagreEgetArk(mål: EgetArkMål, lager: Pick<Storage, 'setItem'> | null): void {
  try {
    lager?.setItem(EGET_NØKKEL, JSON.stringify(mål))
  } catch {
    // Full eller blokkert lagring: målene huskes bare ikke til neste gang
  }
}
