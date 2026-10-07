/*
 * Dynamiske QR-koder.
 *
 * En URL-kode inneholder ikke selve lenka, men en fast adresse her i appen med
 * kodens id. Sida på den adressen (app/q) slår opp lenka i basen hver gang
 * noen skanner, og sender videre. Bytter du lenke i appen, følger etikettene
 * som alt henger printet med — uten ny utskrift.
 *
 * Adressen er HARDKODET. Det er den som står trykt på etikettene, så den må
 * være den samme uansett hvor appen kjører fra: i Android-appen er
 * window.location capacitor://localhost, som ingen telefon kan åpne. Flytter
 * appen til et annet domene, må det gamle fortsatt svare på /q — ellers dør
 * hver etikett som henger ute.
 */
export const QR_ORIGIN = 'https://qr-admin-fawn.vercel.app'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Adressen som trykkes i QR-koden, eller null om id-en ikke er en ekte rad-id. */
export function videresendingsadresse(id: string): string | null {
  if (!UUID.test(id)) return null
  return `${QR_ORIGIN}/q?k=${id.toLowerCase()}`
}

/** Henter kode-id-en ut av ?k=… på videresendingssida. */
export function lesKode(search: string): string | null {
  const k = new URLSearchParams(search).get('k')?.trim() ?? ''
  return UUID.test(k) ? k.toLowerCase() : null
}

/*
 * Sida sender videre med location.replace(). Uten denne sjekken ville en
 * «javascript:»-lenke i basen kjørt som skript på vårt domene — der den
 * innloggede økta ligger — for alle som skanner koden.
 */
export function trygtMål(url: string | null | undefined): string | null {
  if (!url) return null
  try {
    const u = new URL(url.trim())
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : null
  } catch {
    return null
  }
}
