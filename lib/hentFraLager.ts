import { Capacitor, CapacitorHttp } from '@capacitor/core'

/*
 * Henter QR-grunnlaget rett fra Lagersystemet med en kortlevd hentekode.
 *
 * Adressen er HARDKODET med vilje. En verdi som kan settes utenfra — env,
 * database, et inputfelt — er en eksfiltreringsbryter: får noen deg til å peke
 * den et annet sted, sender du hentekoden dit. Skal Lagersystemet flytte,
 * er det en kodeendring, og det er riktig nivå for den avgjørelsen.
 */
export const LAGER_ORIGIN = 'https://stock-smart-pi.vercel.app'

const KODE_MONSTER = /^SS1\.[A-Za-z0-9_-]{1,3000}\.[A-Za-z0-9_-]{1,200}$/

export async function hentQrGrunnlag(raaKode: string): Promise<string> {
  const kode = raaKode.trim()
  if (!KODE_MONSTER.test(kode)) {
    throw new Error('Det ser ikke ut som en hentekode. Kopier hele koden fra Lagersystemet.')
  }

  const url = `${LAGER_ORIGIN}/api/qr-eksport`
  const headers = { Authorization: `Bearer ${kode}` }

  let status: number
  let tekst: string

  if (Capacitor.isNativePlatform()) {
    /*
     * Native går utenom WebViewen via OkHttp/URLSession: ingen CORS, ingen
     * preflight, og ingen usikkerhet rundt hvilken Origin et custom scheme
     * sender.
     *
     * disableRedirects er IKKE standard. Uten den følger klienten en 3xx og tar
     * Authorization-headeren med til den nye verten — altså leverer hentekoden
     * til hvem som helst som kan svare med en omdirigering.
     */
    const r = await CapacitorHttp.request({
      method: 'GET',
      url,
      headers,
      disableRedirects: true,
      connectTimeout: 15000,
      readTimeout: 30000,
      responseType: 'text',
    })
    status = r.status
    tekst = typeof r.data === 'string' ? r.data : JSON.stringify(r.data)
  } else {
    const r = await fetch(url, {
      headers,
      redirect: 'error',      // samme grunn som disableRedirects over
      cache: 'no-store',
      credentials: 'omit',
    })
    status = r.status
    tekst = await r.text()
  }

  if (status === 200) return tekst

  if (status === 410) throw new Error('Hentekoden er utgått. Lag en ny i Lagersystemet.')
  if (status === 401) throw new Error('Hentekoden er ugyldig eller utgått.')

  let melding = `Lagersystemet svarte ${status}`
  try {
    melding = (JSON.parse(tekst).feil as string) ?? melding
  } catch {
    /* behold statuskoden */
  }
  throw new Error(melding)
}
