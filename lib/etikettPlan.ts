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

/** Et mål per side: topp, høyre, bunn, venstre */
export interface Sider {
  t: number
  r: number
  b: number
  l: number
}

export const INGEN_KANT: Sider = { t: 0, r: 0, b: 0, l: 0 }

/**
 * QR-koden regnes som versjon 6, 41 × 41 ruter — det en UUID og et vanlig navn
 * i JSON gir — pluss stillesonen på 4 ruter hver vei som QR-standarden
 * (ISO/IEC 18004) krever. Stillesonen ligger inne i SVG-en, så den er med i
 * målet uansett hva som står rundt koden.
 */
export const QR_RUTER = 41 + 2 * 4

/** Minste rute som skannes sikkert med mobilkamera på kort hold */
export const MIN_RUTE_MM = 0.3

// Hvor mange byte hver QR-versjon (1–40) rommer i byte-modus, per
// feilrettingsnivå — tabell 7 i ISO/IEC 18004. JSON, adresser og telefonnummer
// med «tel:» kodes alltid i byte-modus.
const KAPASITET = {
  L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858,
    929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953],
  M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666,
    711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331],
}

export type QrNivå = 'L' | 'M'

/** Ruter langs én side av koden, med stillesonen på 4 ruter hver vei */
export function qrRuter(innhold: string, nivå: QrNivå): number {
  const byte = new TextEncoder().encode(innhold).length
  const i = KAPASITET[nivå].findIndex(k => k >= byte)
  const versjon = i < 0 ? 40 : i + 1
  return 17 + 4 * versjon + 8
}

/**
 * Feilrettingsnivået koden skal ha. M tåler at 15 % av koden er skitten eller
 * ripete, og er standarden. Et langt navn i koden gir en større versjon og
 * mindre ruter; blir rutene da under 0,3 mm, går vi ned til L. På så små koder
 * er rutestørrelsen det som avgjør om den lar seg lese.
 */
export function velgNivå(innhold: string, svgMm: number): { nivå: QrNivå; ruter: number; ruteMm: number } {
  const m = qrRuter(innhold, 'M')
  if (svgMm / m >= MIN_RUTE_MM) return { nivå: 'M', ruter: m, ruteMm: svgMm / m }
  const l = qrRuter(innhold, 'L')
  return { nivå: 'L', ruter: l, ruteMm: svgMm / l }
}

export interface EtikettPlan {
  landscape: boolean
  /** Luft mellom rammen og innholdet, per side */
  pad: Sider
  /** Rammetykkelsen per side */
  frame: Sider
  /** Bredden på sidestripen, 0 uten */
  stripe: number
  /** Hvor langt teksten i sidestripen er skjøvet inn fra arkkanten — fargen går helt ut */
  stripeX: number
  /** Høyden som er satt av til hullet på en hengelapp, øverst i lufta. 0 uten. */
  hull: number
  /** Plassen blokkene deler — uten ramme, luft og stripe */
  innerW: number
  innerH: number
  gap: number
  /** Beskrivelse og ID får bare plass på de større etikettene */
  showDesc: boolean
  showId: boolean
  /** Hvor logoen står, null når den er slått av */
  logoIn: 'head' | 'foot' | null
  /** Plassen QR-blokka har — med hjørnemerker eller ramme */
  qrSide: number
  /** Selve QR-koden med stillesone */
  qrSvg: number
  /** Hjørnemerker rundt koden. Droppes når de ville gjort rutene for små. */
  qrMerker: boolean
  /** Tykkelsen på rammen rundt koden, 0 uten */
  qrRamme: number
  /** Bredden på teksten — hele bredden stående, kolonnen ved siden av QR-en liggende */
  textW: number
  /** Stående: hele etiketten. Liggende: tekstkolonnen */
  blokker: Blokk[]
}

const klem = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/**
 * Rammetykkelse i mm per side. 0,4 er det tynneste en vanlig kontorskriver
 * tegner som en jevn strek; den tykke og den doble vokser med etiketten.
 * Kuttemerkene ligger i lufta i hjørnene og tar ingen plass. Bånd og ekstra
 * tykke rammer går ned til 1 mm på de minste etikettene — tykkere ville tatt
 * høyden QR-koden trenger.
 */
export function rammeMm(frame: LabelTheme['frame'], h: number): Sider {
  if (frame === 'none' || frame === 'corners') return { ...INGEN_KANT }
  if (frame === 'bands') {
    const bånd = klem(h * 0.04, 1, 7)
    return { t: bånd, r: 0, b: bånd, l: 0 }
  }
  // Varselstripene trenger bredde for å synes som striper, ikke grå strek
  if (frame === 'heavy' || frame === 'hazard') {
    const v = klem(h * 0.035, 1, 6)
    return { t: v, r: v, b: v, l: v }
  }
  const v = frame === 'thick' || frame === 'double' ? klem(h * 0.016, 0.9, 2.2) : 0.4
  return { t: v, r: v, b: v, l: v }
}

/** Rekkefølgen på blokkene — delt med de frie formatene, som ikke har fast høyde */
export function blokkRekkefolge(opt: {
  landscape: boolean
  hero: boolean
  head: boolean
  badge: boolean
  info: boolean
  foot: boolean
  badgeLast?: boolean
}): BlokkType[] {
  const head = opt.head && 'head'
  const badge = opt.badge && 'badge'
  const foot = opt.foot && 'foot'
  const typer: (BlokkType | false)[] = opt.landscape
    ? opt.badgeLast
      ? [head, 'name', opt.info && 'info', badge, foot]
      : [head, badge, 'name', opt.info && 'info', foot]
    : opt.hero
    // Som i Lagersystemet: nummeret og navnet over QR-en
    ? [head, badge, 'name', 'qr', foot]
    : opt.badgeLast
    ? [head, 'qr', 'name', badge, foot]
    : [head, badge, 'qr', 'name', foot]
  return typer.filter((t): t is BlokkType => !!t)
}

interface PlanValg {
  w: number
  h: number
  theme: LabelTheme
  logo: boolean
  showBadge: boolean
  hasInfo: boolean
  /** Hvor mye av etiketten som ligger i skriverens døde sone, per side — se kantVern */
  kant?: Sider
}

export function planEtikett(valg: PlanValg): EtikettPlan {
  const plan = lagPlan(valg, true)
  // Under 25 mm høyde er det ikke plass til både hullet på hengelappen og en
  // QR-kode som kan skannes — da er det hullet som ryker
  if (plan.hull > 0 && valg.h < 25 && plan.qrSvg / QR_RUTER < MIN_RUTE_MM) {
    const uten = lagPlan(valg, false)
    if (uten.qrSvg > plan.qrSvg) return uten
  }
  return plan
}

function lagPlan({ w, h, theme, logo, showBadge, hasInfo, kant = INGEN_KANT }: PlanValg, medHull: boolean): EtikettPlan {
  // Nesten kvadratiske etiketter får også QR-en ved siden av teksten: stående
  // ville koden fått det som er igjen under nummer, navn og bunnrad — på
  // 99 × 93 mm bare 24 mm.
  const landscape = w >= h * 0.95
  // Lufta følger den korteste siden: på en smal, stående lapp ville luft etter
  // høyden tatt bredden QR-koden trenger
  const pad0 = Math.min(4, Math.max(0.8, Math.min(w, h) * 0.055))
  // Linja innenfor kanten trenger luft på begge sider av seg
  const pad = theme.innerLine ? pad0 * 1.5 : pad0
  const frame = rammeMm(theme.frame, h)
  const stripe = theme.sideStripe ? klem(w * 0.085, 2.5, 12) : 0
  // Etiketten går helt ut til arkkanten, også der skriveren ikke når — rammen
  // og bakgrunnen blir bare ikke printet helt ut. Tekst og QR må med, så de
  // holdes unna skriverens døde sone.
  const stripeX = stripe ? Math.max(0, kant.l - frame.l) : 0
  // Hengelappen har hullet over innholdet, i en egen sone øverst
  const hull = theme.hull && medHull ? klem(h * 0.1, 3, 10) : 0
  const luft: Sider = {
    t: Math.max(pad, kant.t - frame.t) + hull,
    r: Math.max(pad, kant.r - frame.r),
    b: Math.max(pad, kant.b - frame.b),
    l: stripe ? pad : Math.max(pad, kant.l - frame.l),
  }
  const innerW = w - frame.l - frame.r - stripeX - stripe - luft.l - luft.r
  const innerH = h - frame.t - frame.b - luft.t - luft.b
  const gap = innerH * 0.04
  const showDesc = h >= 50 && !theme.qrFocus
  const showId = h >= 70
  const logoIn = logo ? theme.logoSlot : null
  // Bunnbåndet er en del av designet og står også uten logo og ID
  const showFoot = showId || logoIn === 'foot' || !!theme.footBand
  // Uten nummerfelt er det ikke noe nummer å løfte fram
  const hero = !!theme.hero && showBadge

  const headH = logoIn === 'head' ? innerH * (landscape ? 0.13 : 0.08) : 0
  // Nummerfeltets høyde i forhold til det vanlige. Bjelken over et stort nummer
  // og streken over en stor QR er smale; stablet nummer, prikk og
  // sidestripens tall trenger mer.
  const badgeAndel = hero ? 0.5
    : theme.qrFocus ? 0.7
    : theme.badge === 'stack' ? 1.4
    : theme.badge === 'dot' || theme.badge === 'square' ? 1.25
    : theme.badge === 'stamp' ? 1.15
    : theme.badge === 'tab' ? 1.1
    : theme.badge === 'number' ? 1.2
    : theme.badge === 'stripes' ? 1.1
    : 1
  let badgeH = showBadge ? innerH * (landscape ? 0.2 : 0.19) * badgeAndel : 0
  // Bunnraden rommer logo (til venstre) og ID (til høyre). Logoen trenger litt
  // mer høyde enn ID-teksten alene for å være lesbar på små etiketter.
  const footH = showFoot ? innerH * ((landscape ? 0.09 : 0.08) + (logoIn === 'foot' ? 0.05 : 0)) : 0

  const rekkefolge = blokkRekkefolge({
    landscape, hero, head: headH > 0, badge: showBadge, info: hasInfo && landscape, foot: showFoot,
    badgeLast: theme.badgeLast,
  })
  const mellomrom = gap * (rekkefolge.length - 1)

  // Den minste koden som skannes sikkert. QR-koden går foran teksten: der
  // etiketten har plass til den, gir teksten fra seg plass før rutene blir for små.
  const qrMin = QR_RUTER * MIN_RUTE_MM

  let qrSide: number, textW: number, nameH: number, infoH = 0
  if (landscape) {
    // Brede etiketter får QR-en ved siden av teksten i stedet for over den —
    // ellers begrenser høyden QR-en til under halv størrelse. På de minste
    // etikettene tar koden inntil 62 % av bredden for å holde rutene store nok.
    const andel = theme.qrFocus ? 0.6 : 0.5
    qrSide = Math.max(0, Math.min(innerH, Math.max(innerW * andel, Math.min(qrMin, innerW * 0.62))))
    textW = Math.max(1, innerW - qrSide - gap)
    const rest = Math.max(0, innerH - headH - badgeH - footH - mellomrom)
    nameH = hasInfo ? rest * 0.45 : rest
    infoH = hasInfo ? rest * 0.55 : 0
  } else {
    const nameAndel = hero ? 0.22
      : theme.qrFocus ? 0.14
      : (showDesc ? 0.28 : 0.2) * (theme.badge === 'stack' && showBadge ? 0.75 : 1)
    nameH = innerH * nameAndel
    // Med infoliste deler QR-en raden med lista — men blir ikke så smal at
    // rutene blir for små. Er raden for smal til begge, får koden plassen
    // først, og lista får det som blir igjen; blir den for trang til å leses,
    // tar StickerCard den bort.
    const qrBredde = !hasInfo ? innerW
      : innerW * 0.42 >= qrMin ? innerW * 0.42
      : innerW * 0.6 >= qrMin ? qrMin
      : innerW
    let qrBudget = innerH - headH - badgeH - nameH - footH - mellomrom
    // For lite høyde igjen til koden: navnet og nummerfeltet gir fra seg inntil 30 %
    const mangler = Math.min(qrBredde, qrMin) - qrBudget
    if (mangler > 0 && nameH + badgeH > 0) {
      const krymp = 1 - Math.min(mangler, (nameH + badgeH) * 0.3) / (nameH + badgeH)
      nameH *= krymp
      badgeH *= krymp
      qrBudget = innerH - headH - badgeH - nameH - footH - mellomrom
    }
    qrSide = Math.max(0, Math.min(qrBudget, qrBredde))
    textW = innerW
  }

  // Hjørnemerker og ramme tar plass fra selve koden. Blir rutene da for små
  // til å skannes, er det pynten som ryker, ikke koden.
  const innslag = theme.qrMarks ? qrSide * 0.1 : theme.qrFrame ? klem(qrSide * 0.025, 0.4, 1.5) : 0
  const pynt = innslag > 0 && (qrSide - 2 * innslag) / QR_RUTER >= MIN_RUTE_MM
  const qrSvg = pynt ? qrSide - 2 * innslag : qrSide

  const høyde: Record<BlokkType, number> = {
    head: headH, badge: badgeH, qr: qrSide, name: nameH, info: infoH, foot: footH,
  }
  const blokker = rekkefolge.map((type, i) => ({ type, h: høyde[type], over: i === 0 ? 0 : gap }))

  return {
    landscape, pad: luft, frame, stripe, stripeX, hull, innerW, innerH, gap, showDesc, showId, logoIn,
    qrSide, qrSvg, qrMerker: pynt && !!theme.qrMarks, qrRamme: pynt && theme.qrFrame ? innslag : 0,
    textW, blokker,
  }
}

/**
 * Infolinjene som får plass, tatt bort bakfra. Før forsvant alle på én gang så
 * snart én linje ble for trang — da fikk hyllene med «Kategorier» et kjempenavn
 * uten infoliste, mens naboene på samme ark hadde fargekode og antall.
 * Linjene står etter viktighet, så det er de siste som må vike.
 */
export function beholdInfo<T>(linjer: T[], passer: (linjer: T[]) => boolean): T[] {
  let ut = linjer
  while (ut.length > 0 && !passer(ut)) ut = ut.slice(0, -1)
  return ut
}
