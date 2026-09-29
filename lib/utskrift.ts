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
