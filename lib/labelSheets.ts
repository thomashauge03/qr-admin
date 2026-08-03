/**
 * Forhåndsinnstillinger for vanlige A4 etikettark (adhesive ark).
 *
 * Alle mål i mm. `pitchX`/`pitchY` er avstanden fra venstre kant av én etikett
 * til venstre kant av neste — altså etikettbredde + mellomrom.
 *
 * De «delte» arkene (A4 delt i N) er matematisk eksakte: etikettene ligger kant
 * i kant og dekker hele arket. Avery-formatene har marger og mellomrom, og de
 * oppgitte verdiene er produsentens standardmål — ta alltid en testutskrift på
 * vanlig papir før du kjører et ekte etikettark.
 */
export interface LabelSheet {
  id: string
  name: string
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

export const LABEL_SHEETS: LabelSheet[] = [
  // ---- A4 delt kant i kant (ingen mellomrom) ----
  // Helt ark med 10mm luft, siden de fleste skrivere ikke printer helt ut i kanten
  { id: 'a4-1',  name: '1 per ark — helt A4',      w: 190,   h: 277,   cols: 1, rows: 1,  marginTop: 10, marginLeft: 10, pitchX: 190, pitchY: 277 },
  { id: 'a4-2',  name: '2 per ark — 210 × 148,5',  w: 210,   h: 148.5, cols: 1, rows: 2,  marginTop: 0, marginLeft: 0, pitchX: 210,   pitchY: 148.5 },
  { id: 'a4-4',  name: '4 per ark — 105 × 148,5',  w: 105,   h: 148.5, cols: 2, rows: 2,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 148.5 },
  { id: 'a4-8',  name: '8 per ark — 105 × 74,2',   w: 105,   h: 74.25, cols: 2, rows: 4,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 74.25 },
  { id: 'a4-10', name: '10 per ark — 105 × 59,4',  w: 105,   h: 59.4,  cols: 2, rows: 5,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 59.4  },
  { id: 'a4-12', name: '12 per ark — 105 × 49,5',  w: 105,   h: 49.5,  cols: 2, rows: 6,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 49.5  },
  { id: 'a4-16', name: '16 per ark — 105 × 37,1',  w: 105,   h: 37.13, cols: 2, rows: 8,  marginTop: 0, marginLeft: 0, pitchX: 105,   pitchY: 37.13 },
  { id: 'a4-24', name: '24 per ark — 70 × 49,5',   w: 70,    h: 49.5,  cols: 3, rows: 8,  marginTop: 0, marginLeft: 0, pitchX: 70,    pitchY: 49.5  },
  { id: 'a4-40', name: '40 per ark — 52,5 × 29,7', w: 52.5,  h: 29.7,  cols: 4, rows: 10, marginTop: 0, marginLeft: 0, pitchX: 52.5,  pitchY: 29.7  },

  // ---- Avery / Zweckform-klassikere (med marger og mellomrom) ----
  { id: 'l7169', name: 'Avery L7169 — 99,1 × 139,0 (4)',  w: 99.1, h: 139.0, cols: 2, rows: 2,  marginTop: 8.5,  marginLeft: 5.0,  pitchX: 101.6, pitchY: 139.0 },
  { id: 'l7165', name: 'Avery L7165 — 99,1 × 67,7 (8)',   w: 99.1, h: 67.7,  cols: 2, rows: 4,  marginTop: 13.0, marginLeft: 5.0,  pitchX: 101.6, pitchY: 67.7  },
  { id: 'l7163', name: 'Avery L7163 — 99,1 × 38,1 (14)',  w: 99.1, h: 38.1,  cols: 2, rows: 7,  marginTop: 15.1, marginLeft: 5.0,  pitchX: 101.6, pitchY: 38.1  },
  { id: 'l7160', name: 'Avery L7160 — 63,5 × 38,1 (21)',  w: 63.5, h: 38.1,  cols: 3, rows: 7,  marginTop: 15.1, marginLeft: 7.2,  pitchX: 66.0,  pitchY: 38.1  },
  { id: 'l7651', name: 'Avery L7651 — 38,1 × 21,2 (65)',  w: 38.1, h: 21.2,  cols: 5, rows: 13, marginTop: 10.7, marginLeft: 4.7,  pitchX: 40.6,  pitchY: 21.2  },
]

// 8 per ark er formatet vi har flest av
export const DEFAULT_SHEET = LABEL_SHEETS.find(s => s.id === 'a4-8')!

export const perSheet = (s: LabelSheet) => s.cols * s.rows
