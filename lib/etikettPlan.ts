import type { LabelTheme } from './labelTheme'

/**
 * Plassfordelingen på en etikett med fast størrelse — én rute på et etikettark.
 *
 * Høyden er låst av ruta, så hver blokk får en eksplisitt høyde i mm, og
 * summen av blokkene og mellomrommene er aldri mer enn det som er innenfor
 * ramme og luft. Går regnestykket ikke opp, klipper etiketten QR-koden i
 * stillhet (overflow: hidden) — derfor er dette skilt ut og testet for alle
 * design på alle ark.
 *
 * Stående: alt i én stabel, øverst til nederst.
 * Liggende: QR-en til venstre, og stabelen er tekstkolonnen til høyre.
 */
export type BlokkType = 'head' | 'badge' | 'qr' | 'name' | 'info' | 'foot'

export interface Blokk {
  type: BlokkType
  /** Høyden i mm */
  h: number
  /** Mellomrommet over blokka i mm */
  over: number
}

export interface EtikettPlan {
  landscape: boolean
  /** Luft mellom rammen og innholdet */
  pad: number
  /** Rammetykkelsen */
  frame: number
  /** Bredden på sidestripen, 0 uten */
  stripe: number
  /** Plassen blokkene deler — uten ramme, luft og stripe */
  innerW: number
  innerH: number
  gap: number
  /** Beskrivelse og ID får bare plass på de større etikettene */
  showDesc: boolean
  showId: boolean
  /** Hvor logoen står, null når den er slått av */
  logoIn: 'head' | 'foot' | null
  qrSide: number
  /** Bredden på teksten — hele bredden stående, kolonnen ved siden av QR-en liggende */
  textW: number
  /** Stående: hele etiketten. Liggende: tekstkolonnen */
  blokker: Blokk[]
}

const klem = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Rammetykkelse i mm. 0,4 er det tynneste en vanlig kontorskriver tegner som
 * en jevn strek; den tykke vokser med etiketten.
 */
export function rammeMm(frame: LabelTheme['frame'], h: number): number {
  if (frame === 'none') return 0
  if (frame === 'thick') return klem(h * 0.016, 0.9, 2.2)
  return 0.4
}

/** Rekkefølgen på blokkene — delt med de frie formatene, som ikke har fast høyde */
export function blokkRekkefolge(opt: {
  landscape: boolean
  hero: boolean
  head: boolean
  badge: boolean
  info: boolean
  foot: boolean
}): BlokkType[] {
  const typer: (BlokkType | false)[] = opt.landscape
    ? [opt.head && 'head', opt.badge && 'badge', 'name', opt.info && 'info', opt.foot && 'foot']
    : opt.hero
    // Som i Lagersystemet: nummeret og navnet over QR-en
    ? [opt.head && 'head', opt.badge && 'badge', 'name', 'qr', opt.foot && 'foot']
    : [opt.head && 'head', opt.badge && 'badge', 'qr', 'name', opt.foot && 'foot']
  return typer.filter((t): t is BlokkType => !!t)
}

export function planEtikett({ w, h, theme, logo, showBadge, hasInfo }: {
  w: number
  h: number
  theme: LabelTheme
  logo: boolean
  showBadge: boolean
  hasInfo: boolean
}): EtikettPlan {
  const landscape = w > h * 1.15
  const pad0 = Math.min(4, Math.max(0.8, h * 0.055))
  // Skiltet har en hvit linje innenfor kanten og trenger luft på begge sider av den
  const pad = theme.innerLine ? pad0 * 1.5 : pad0
  const frame = rammeMm(theme.frame, h)
  const stripe = theme.sideStripe ? klem(w * 0.085, 2.5, 12) : 0
  const innerW = w - 2 * pad - 2 * frame - stripe
  const innerH = h - 2 * pad - 2 * frame
  const gap = innerH * 0.04
  const showDesc = h >= 50
  const showId = h >= 70
  const logoIn = logo ? theme.logoSlot : null
  const showFoot = showId || logoIn === 'foot'
  // Uten nummerfelt er det ikke noe nummer å løfte fram
  const hero = !!theme.hero && showBadge

  const headH = logoIn === 'head' ? innerH * (landscape ? 0.13 : 0.08) : 0
  // Nummerfeltets høyde i forhold til det vanlige. Bjelken over et stort nummer
  // er smal; det stablede nummeret og sidestripens tall trenger mer.
  const badgeAndel = hero ? 0.5
    : theme.badge === 'stack' ? 1.4
    : theme.badge === 'number' ? 1.2
    : theme.badge === 'stripes' ? 1.1
    : 1
  const badgeH = showBadge ? innerH * (landscape ? 0.2 : 0.19) * badgeAndel : 0
  // Bunnraden rommer logo (til venstre) og ID (til høyre). Logoen trenger litt
  // mer høyde enn ID-teksten alene for å være lesbar på små etiketter.
  const footH = showFoot ? innerH * ((landscape ? 0.09 : 0.08) + (logoIn === 'foot' ? 0.05 : 0)) : 0

  const rekkefolge = blokkRekkefolge({
    landscape, hero, head: headH > 0, badge: showBadge, info: hasInfo && landscape, foot: showFoot,
  })
  const mellomrom = gap * (rekkefolge.length - 1)

  let qrSide: number, textW: number, nameH: number, infoH = 0
  if (landscape) {
    // Brede etiketter får QR-en ved siden av teksten i stedet for over den —
    // ellers begrenser høyden QR-en til under halv størrelse.
    qrSide = Math.max(4, Math.min(innerH, innerW * 0.5))
    textW = Math.max(1, innerW - qrSide - gap)
    const rest = Math.max(0, innerH - headH - badgeH - footH - mellomrom)
    nameH = hasInfo ? rest * 0.45 : rest
    infoH = hasInfo ? rest * 0.55 : 0
  } else {
    const nameAndel = hero ? 0.22
      : (showDesc ? 0.28 : 0.2) * (theme.badge === 'stack' && showBadge ? 0.75 : 1)
    nameH = innerH * nameAndel
    const qrBudget = innerH - headH - badgeH - nameH - footH - mellomrom
    // Med infoliste deler QR-en raden med lista
    qrSide = Math.max(0, Math.min(qrBudget, hasInfo ? innerW * 0.42 : innerW))
    textW = innerW
  }

  const høyde: Record<BlokkType, number> = {
    head: headH, badge: badgeH, qr: qrSide, name: nameH, info: infoH, foot: footH,
  }
  const blokker = rekkefolge.map((type, i) => ({ type, h: høyde[type], over: i === 0 ? 0 : gap }))

  return {
    landscape, pad, frame, stripe, innerW, innerH, gap, showDesc, showId,
    logoIn, qrSide, textW, blokker,
  }
}
