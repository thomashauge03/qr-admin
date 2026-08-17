import { Category, CategoryInsert, InfoLine, QRData, QRType } from '@/types'

/*
 * Import av QR-grunnlag fra Lagersystemet (Stock Smart).
 *
 * De to appene ligger i hvert sitt Supabase-prosjekt, så dataene kommer som
 * tekst — limt inn fra utklippstavla eller valgt som fil. Parsingen tar imot
 * begge formene Lagersystemet eksporterer: JSON-array og CSV med kolonnene til
 * denne tabellen.
 *
 * Alt er tilgivende med vilje. En import som avviser hele bunken fordi én rad
 * mangler et felt er ubrukelig når du står med 200 varer; ugyldige rader
 * rapporteres i stedet enkeltvis, og resten går gjennom.
 */

const GYLDIGE_TYPER: QRType[] = ['shop', 'url', 'text', 'email', 'phone', 'sms', 'wifi', 'location']

export interface ImportProblem {
  /** 1-indeksert radnummer slik brukeren ser det, ikke array-indeks. */
  rad: number
  navn: string
  grunn: string
}

export interface ParseResultat {
  rader: CategoryInsert[]
  problemer: ImportProblem[]
  kilde: 'json' | 'csv' | null
}

/**
 * Deler hele CSV-teksten i rader og felt i én gjennomgang, etter RFC 4180.
 *
 * Å splitte på linjeskift først og parse sitater etterpå er den vanlige feilen:
 * et sitert felt får lov til å inneholde linjeskift, og et kategorinavn eller
 * en beskrivelse limt inn fra Excel gjør det gjerne. Da blir én rad delt i to
 * halve, og begge avvises.
 */
function delCsv(tekst: string, skille: string): string[][] {
  const rader: string[][] = []
  let rad: string[] = []
  let felt = ''
  let iSitat = false

  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i]

    if (iSitat) {
      if (c === '"' && tekst[i + 1] === '"') { felt += '"'; i++ }
      else if (c === '"') iSitat = false
      else felt += c
      continue
    }

    if (c === '"') { iSitat = true; continue }
    if (c === skille) { rad.push(felt); felt = ''; continue }
    if (c === '\r') continue                       // CRLF: hopp over, \n avslutter
    if (c === '\n') {
      rad.push(felt); felt = ''
      // Tomme linjer skal ikke bli rader med ett tomt felt.
      if (rad.length > 1 || rad[0] !== '') rader.push(rad)
      rad = []
      continue
    }
    felt += c
  }

  rad.push(felt)
  if (rad.length > 1 || rad[0] !== '') rader.push(rad)
  return rader
}

/** Gjetter skilletegn på overskriftslinja — Lagersystemet kan eksportere begge. */
function gjettSkilletegn(overskrift: string): string {
  const semi = (overskrift.match(/;/g) || []).length
  const komma = (overskrift.match(/,/g) || []).length
  return semi >= komma ? ';' : ','
}

function trygtJson<T>(tekst: string | undefined, fallback: T): T {
  if (!tekst || !tekst.trim()) return fallback
  try {
    return JSON.parse(tekst) as T
  } catch {
    return fallback
  }
}

/**
 * Normaliserer én rå rad til CategoryInsert, eller returnerer en grunn til at
 * den ikke kan brukes.
 */
function normaliser(rå: Record<string, unknown>): CategoryInsert | string {
  const navn = typeof rå.name === 'string' ? rå.name.trim() : ''
  if (!navn) return 'mangler navn'

  const qrData = (rå.qr_data ?? null) as QRData | null
  let type = (rå.qr_type as QRType | undefined) ?? qrData?.type

  // Lagersystemet sender alltid qr_type, men en håndredigert fil trenger ikke.
  // Finnes det en url, er «url» det eneste fornuftige.
  if (!type && qrData?.url) type = 'url'
  if (!type) return 'mangler qr_type'
  if (!GYLDIGE_TYPER.includes(type)) return `ukjent qr_type «${type}»`

  if (!qrData) return 'mangler qr_data'
  if (type === 'url' && !qrData.url?.trim()) return 'qr_type er url, men qr_data.url er tom'

  // shelf_number er påkrevd i skjemaet. Heller en synlig strek enn en rad som
  // ikke lar seg redigere etterpå.
  const hylle = typeof rå.shelf_number === 'string' && rå.shelf_number.trim()
    ? rå.shelf_number.trim()
    : '—'

  const infoLinjer = Array.isArray(rå.info_lines)
    ? (rå.info_lines as InfoLine[])
        .filter(l => l && typeof l.label === 'string' && typeof l.value === 'string')
        .map(l => ({ label: l.label.trim(), value: l.value.trim() }))
        .filter(l => l.label || l.value)
    : []

  const farge = typeof rå.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(rå.color)
    ? rå.color
    : '#000000'

  return {
    name: navn,
    shelf_number: hylle,
    description: typeof rå.description === 'string' && rå.description.trim()
      ? rå.description.trim()
      : null,
    color: farge,
    qr_type: type,
    qr_data: { ...qrData, type },
    info_lines: infoLinjer.length ? infoLinjer : null,
    // Settes av importflyten, ikke av fila — en eksportert folder_id peker på
    // en mappe i et annet prosjekt og ville blitt en død fremmednøkkel.
    folder_id: null,
  }
}

export function parseImport(tekst: string): ParseResultat {
  const rensa = tekst.trim()
  if (!rensa) return { rader: [], problemer: [], kilde: null }

  const rådata: Record<string, unknown>[] = []
  let kilde: 'json' | 'csv'

  if (rensa.startsWith('[') || rensa.startsWith('{')) {
    kilde = 'json'
    let tolket: unknown
    try {
      tolket = JSON.parse(rensa)
    } catch (e) {
      return {
        rader: [],
        problemer: [{ rad: 0, navn: '', grunn: `Ugyldig JSON: ${(e as Error).message}` }],
        kilde,
      }
    }
    // Godtar både en rein array og et objekt som pakker den inn.
    const liste = Array.isArray(tolket)
      ? tolket
      : ((tolket as Record<string, unknown>).kategorier ??
         (tolket as Record<string, unknown>).rader ??
         (tolket as Record<string, unknown>).categories)
    if (!Array.isArray(liste)) {
      return {
        rader: [],
        problemer: [{ rad: 0, navn: '', grunn: 'Fant ingen liste med rader i JSON-en' }],
        kilde,
      }
    }
    rådata.push(...(liste as Record<string, unknown>[]))
  } else {
    kilde = 'csv'
    // BOM-en Lagersystemet skriver for Excel ville ellers blitt en del av
    // den første kolonneoverskriften.
    const utenBom = rensa.charCodeAt(0) === 0xfeff ? rensa.slice(1) : rensa

    // Skilletegnet gjettes på første linje. Et sitert felt kan inneholde
    // linjeskift, men overskriftsraden gjør det ikke.
    const førsteLinje = utenBom.split('\n', 1)[0]
    const skille = gjettSkilletegn(førsteLinje)

    const alleRader = delCsv(utenBom, skille)
    if (alleRader.length < 2) {
      return {
        rader: [],
        problemer: [{ rad: 0, navn: '', grunn: 'CSV-en har ingen datarader' }],
        kilde,
      }
    }
    const kolonner = alleRader[0].map(k => k.trim().toLowerCase())
    for (const felt of alleRader.slice(1)) {
      const rad: Record<string, unknown> = {}
      kolonner.forEach((kol, i) => { rad[kol] = felt[i] ?? '' })
      rad.qr_data = trygtJson<QRData | null>(rad.qr_data as string, null)
      rad.info_lines = trygtJson<InfoLine[]>(rad.info_lines as string, [])
      rådata.push(rad)
    }
  }

  const rader: CategoryInsert[] = []
  const problemer: ImportProblem[] = []
  rådata.forEach((rå, i) => {
    const resultat = normaliser(rå)
    if (typeof resultat === 'string') {
      problemer.push({
        rad: i + 1,
        navn: typeof rå.name === 'string' ? rå.name : '',
        grunn: resultat,
      })
    } else {
      rader.push(resultat)
    }
  })

  return { rader, problemer, kilde }
}

/**
 * Identiteten til en QR-kode er det den peker på. To rader med samme URL er
 * samme klistrelapp, uansett hva den heter — så en import etter at en hylle
 * er døpt om oppdaterer raden framfor å lage en tvilling.
 *
 * Rader uten URL (wifi, tekst, telefon) faller tilbake på navn + hyllenummer.
 */
export function identitet(rad: Pick<Category, 'name' | 'shelf_number' | 'qr_data'>): string {
  const url = rad.qr_data?.url?.trim()
  if (url) return `url:${url}`
  return `navn:${rad.name.trim().toLowerCase()}|${rad.shelf_number.trim().toLowerCase()}`
}

export interface Plan {
  nye: CategoryInsert[]
  oppdateres: { id: string; rad: CategoryInsert; fraNavn: string }[]
}

/** Deler de parsede radene i «finnes fra før» og «ny», mot det som ligger i basen. */
export function leggPlan(rader: CategoryInsert[], eksisterende: Category[]): Plan {
  const kjente = new Map<string, Category>()
  for (const k of eksisterende) kjente.set(identitet(k), k)

  const nye: CategoryInsert[] = []
  const oppdateres: Plan['oppdateres'] = []
  // Duplikater innad i selve fila skal ikke bli to innsettinger.
  const settIDenneBunken = new Set<string>()

  for (const rad of rader) {
    const id = identitet(rad)
    if (settIDenneBunken.has(id)) continue
    settIDenneBunken.add(id)

    const treff = kjente.get(id)
    if (treff) oppdateres.push({ id: treff.id, rad, fraNavn: treff.name })
    else nye.push(rad)
  }

  return { nye, oppdateres }
}
