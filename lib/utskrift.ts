/**
 * Fontene utskriftsvinduet laster — de samme vektene som etikettene måles med
 * i StickerCard. Mangler en vekt her, printes teksten med en reservefont som er
 * bredere enn det den er målt til, og da kan den sprenge feltet sitt.
 */
export const ETIKETT_FONTER =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap'

const FONTER = [
  ...[400, 500, 600, 700, 800, 900].map(v => `${v} 16px Inter`),
  ...[400, 500, 700].map(v => `${v} 16px "JetBrains Mono"`),
]

const escape = (tekst: string) =>
  tekst.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/**
 * Utskriftsdokumentet for etikettark: hvert ark er en `.page` på 210 × 297 mm
 * med etikettene plassert absolutt i `.cell`-er. `innhold` er forhåndsvisningens
 * HTML — det som printes er nøyaktig det som vises.
 */
export function arkDokument(innhold: string): string {
  return `
      <html>
        <head>
          <title>Etiketter — QR Admin</title>
          <link href="${ETIKETT_FONTER}" rel="stylesheet">
          <style>
            /* Uten print-color-adjust dropper skriveren bakgrunnsfargene, og da
               kommer nummer-badgen ut som grå tekst på hvitt i stedet for rød */
            * { margin: 0; padding: 0; box-sizing: border-box;
                -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { background: white; font-family: sans-serif; }
            /* Etikettene plasseres absolutt, slik at de treffer cellene på arket */
            .page {
              position: relative;
              width: 210mm;
              height: 297mm;
              page-break-after: always;
              overflow: hidden;
            }
            .page:last-child { page-break-after: auto; }
            .cell { position: absolute; }
            .sticker-card { break-inside: avoid; page-break-inside: avoid; }
            @page { size: A4 portrait; margin: 0; }
          </style>
        </head>
        <body>${innhold}</body>
      </html>
    `
}

/** Utskriftsdokumentet for ett klistremerke, eller én etikett over et helt A4-ark */
export function enkeltDokument(tittel: string, innhold: string, helside: boolean): string {
  return `
      <html><head>
        <title>${escape(tittel)}</title>
        <link href="${ETIKETT_FONTER}" rel="stylesheet">
        <style>
          /* print-color-adjust: ellers dropper skriveren bakgrunnsfargene, og
             nummer-badgen kommer ut som grå tekst på hvitt i stedet for rød */
          * { margin:0; padding:0; box-sizing:border-box;
              -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { display:flex; align-items:center; justify-content:center; min-height:100vh; background:white; }
          @page { size: A4 portrait; margin: ${helside ? '10mm' : '5mm'}; }
        </style>
      </head><body>${innhold}</body></html>
    `
}

const vent = (ms: number) => new Promise(r => setTimeout(r, ms))

/**
 * Skriver ut når utskriftsvinduet er klart: stilarket med fontene er hentet,
 * fontene er lastet og logoen er dekodet. Kommer print-dialogen før det, får
 * etiketten reservefont og tom logo. Etter fem sekunder skrives det ut uansett,
 * så et tregt nett ikke gjør at ingenting skjer.
 */
export function skrivUtNårKlar(win: Window) {
  const doc = win.document
  const lenker = Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
  const klar = Promise.all([
    vent(700),
    ...lenker.map(l => (l.sheet ? null : new Promise(r => { l.onload = l.onerror = r }))),
    ...Array.from(doc.images).map(img =>
      img.complete ? null : new Promise(r => { img.onload = img.onerror = r })),
  ]).then(() => Promise.all(FONTER.map(f => doc.fonts?.load(f).catch(() => null))))

  Promise.race([klar, vent(5000)]).then(() => { win.print(); win.close() })
}
