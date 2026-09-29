'use client'

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Category, buildQRValue } from '@/types'
import { LabelThemeId, getTheme, tekstPå, HM_RED, SVART, HVIT } from '@/lib/labelTheme'
import { planEtikett, blokkRekkefolge, type BlokkType } from '@/lib/etikettPlan'
import HaugeMaskinLogo, { LOGO_RATIO } from './HaugeMaskinLogo'

interface Props {
  category: Category
  /** Fyller et helt A4-ark med én stor QR-kode */
  fullPage?: boolean
  /** Bredde på klistremerket i mm ved utskrift (default 60, eller 90 med infoliste) */
  widthMm?: number
  /** Høyde i mm — settes når klistremerket skal fylle en celle på et etikettark */
  heightMm?: number
  /** Vis nummerfeltet */
  showBadge?: boolean
  /** Overstyrer fargen som er lagret på QR-koden og i designet */
  overrideColor?: string | null
  /** Designet på etiketten — se lib/labelTheme.ts */
  theme?: LabelThemeId
  /** Vis HM-logoen der designet har plass til den */
  logo?: boolean
}

const mm = (v: number) => `${Math.round(v * 100) / 100}mm`
/** Punkt per mm. De frie formatene har skriftstørrelsene sine i punkt. */
const PT = 2.8346

// Utskriftstypografi: Inter er langt mer lesbar i småskrift enn display-fonten
// Syne, og monoen har sperret null (0 vs O) for hyllenummer og ID.
const SANS = 'Inter, system-ui, sans-serif'
const MONO = 'JetBrains Mono, ui-monospace, monospace'
const NUM: CSSProperties = { fontVariantNumeric: 'slashed-zero tabular-nums' }
// Store tall i Inter: tabellsiffer er bredere enn det canvas-målingen ser, og
// da sprenger nummeret feltet sitt. Vanlige siffer måles riktig og er penere stort.
const NUM_STOR: CSSProperties = { fontVariantNumeric: 'slashed-zero' }

/** Kutter teksten etter n linjer med ellipse i stedet for å flyte utenfor */
const CLAMP = (lines: number): CSSProperties => ({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: lines,
  overflow: 'hidden',
  overflowWrap: 'anywhere',
})

// Teksten foran nummeret i badgen. Kortes ned på smale etiketter, ellers
// presser den nummeret ut av feltet.
const BADGE_TEXT = 'UTSTYR NUMMER'
const BADGE_TEXT_SHORT = 'UTSTYR NR'
const WORDMARK = 'HAUGE MASKIN'

// ── Tekstmåling ──────────────────────────────────────────────────────────
// Et snitt-tegnbredde-anslag bommer med opptil 30 % mellom «Vibroplate» (0,48)
// og «BETONGSAGBLAD 350MM» (0,62), og da ryker teksten ut på en linje ekstra.
// Derfor måles den faktiske bredden med de samme fontene som utskriften bruker.
type Vekt = 400 | 500 | 600 | 700 | 800 | 900
const målCache = new Map<string, number>()
let måler: CanvasRenderingContext2D | null | undefined

/**
 * Anslag mens fonten ikke er lastet ennå. Store bokstaver og tall er langt
 * bredere enn små — et flatt snitt gjorde «UTSTYR NUMMER» 20 % for smal, og
 * da kolliderte den med nummeret.
 */
const anslag = (text: string, weight: Vekt, mono: boolean) => {
  if (mono) return text.length * 0.6
  let sum = 0
  for (const tegn of text) {
    sum += tegn === ' ' ? 0.27
      : /[A-ZÆØÅ]/.test(tegn) ? 0.69
      : /[0-9]/.test(tegn) ? 0.62
      : /[a-zæøå]/.test(tegn) ? 0.54
      : 0.45
  }
  return sum * (1 + (weight - 600) / 3000)
}

/** Bredden på teksten ved skriftstørrelse 1 (samme enhet som størrelsen) */
const textW1 = (text: string, weight: Vekt = 600, tracking = 0, mono = false) => {
  if (!text) return 0
  const key = `${weight}|${tracking}|${mono ? 'm' : 's'}|${text}`
  const cached = målCache.get(key)
  if (cached !== undefined) return cached
  if (måler === undefined) {
    måler = typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
  }
  const navn = mono ? 'JetBrains Mono' : 'Inter'
  if (måler && typeof document !== 'undefined' && document.fonts?.check(`${weight} 16px ${navn}`)) {
    måler.font = `${weight} 100px ${mono ? MONO : SANS}`
    const bredde = måler.measureText(text).width / 100 + tracking * text.length
    målCache.set(key, bredde)
    return bredde
  }
  // Server-rendering eller font ikke lastet ennå. Anslaget huskes ikke: neste
  // tegning etter at fonten er lastet skal måle ekte.
  return anslag(text, weight, mono) + tracking * text.length
}

/** Største skriftstørrelse som får teksten til å stå på én linje innenfor bredden */
const fitMm = (
  heightBudget: number, width: number, text: string,
  weight: Vekt = 600, tracking = 0, mono = false,
) => Math.min(heightBudget, width / Math.max(0.05, textW1(text, weight, tracking, mono)))

/**
 * Antall linjer teksten trenger — grådig ombrekking på de samme stedene
 * nettleseren bruker (mellomrom og bindestrek), med ekte ordbredder.
 *
 * Er ett av ordene bredere enn linja, gis Infinity: da må skriften ned. Å la
 * nettleseren dele midt i ordet gir både styggere resultat og flere linjer enn
 * en modell kan forutsi — det er bedre å krympe til hele ord får plass.
 */
const wrapLines = (text: string, width: number, font: number, weight: Vekt, tracking: number, mono: boolean) => {
  let lines = 1, brukt = 0
  for (const ord of text.split(/(?<=[\s-])/)) {
    const full = textW1(ord, weight, tracking, mono) * font
    const uten = textW1(ord.trimEnd(), weight, tracking, mono) * font
    if (uten > width) return Infinity
    if (brukt > 0 && brukt + uten > width) { lines++; brukt = full }
    else brukt += full
  }
  return lines
}

/**
 * Samme som `fitMm`, men teksten får bruke flere linjer. Prøver 1..maxLines og
 * velger det linjeantallet som gir størst skrift — korte navn havner på én stor
 * linje, lange navn brekkes i stedet for å krympe til ingenting.
 *
 * Største skrift som får teksten til å stå innenfor både bredden og høyden,
 * med inntil `maxLines` linjer. Binærsøk, siden linjeantallet hopper i trinn.
 */
const fitBlock = (
  heightBudget: number, width: number, text: string,
  maxLines: number, weight: Vekt = 600, tracking = 0, lineHeight = 1.18, mono = false,
) => {
  if (!text || width <= 0 || heightBudget <= 0) return { mm: 0, lines: 1 }
  // Margin: canvas-målingen kjenner ikke tabular-nums og hinting på liten
  // skrift, så den bommer et par prosent på tekst med tall
  const linje = width * 0.96
  const passer = (f: number) => {
    const l = wrapLines(text, linje, f, weight, tracking, mono)
    return l <= maxLines && f * lineHeight * l <= heightBudget
  }
  let lo = 0.4, hi = Math.max(0.5, heightBudget / lineHeight)
  if (!passer(lo)) return { mm: lo, lines: maxLines }
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (passer(mid)) lo = mid; else hi = mid
  }
  // Klipp først når blokka faktisk er full — nettleseren kan brekke litt annerledes
  const romForLinjer = Math.floor(heightBudget / (lo * lineHeight))
  const trengs = wrapLines(text, linje, lo, weight, tracking, mono)
  return {
    mm: lo,
    lines: Math.max(Number.isFinite(trengs) ? trengs : 1, Math.min(maxLines, romForLinjer)),
  }
}

// Alle skriftene etikettene kan bruke. Målingen over faller tilbake til et
// anslag til de er lastet, så etiketten tegnes på nytt når de er klare.
const FONTER = [
  ...[400, 500, 600, 700, 800, 900].map(v => `${v} 16px Inter`),
  ...[400, 500, 700].map(v => `${v} 16px "JetBrains Mono"`),
]

const antallLastet = () =>
  typeof document === 'undefined' || !document.fonts ? 0 : FONTER.filter(f => document.fonts.check(f)).length

function useFonterLastet() {
  const [, setLastet] = useState(0)
  // Telles mens etiketten tegnes, ikke når effekten kjører: fontene kan bli
  // ferdige i mellomtiden, og da ville etiketten blitt stående med anslaget.
  const vedTegning = antallLastet()
  useEffect(() => {
    if (vedTegning === FONTER.length || typeof document === 'undefined' || !document.fonts) return
    let aktiv = true
    Promise.all(FONTER.map(f => document.fonts.load(f).catch(() => null)))
      // Bare når flere fonter faktisk er lastet — uten nett blir det ingen løkke
      .then(() => { if (aktiv && antallLastet() > vedTegning) setLastet(n => n + 1) })
    return () => { aktiv = false }
  }, [vedTegning])
}

interface Skrift { w: Vekt; t: number; mono: boolean }

export default function StickerCard({
  category, fullPage = false, widthMm, heightMm, showBadge = true, overrideColor, theme: themeId, logo = false,
}: Props) {
  useFonterLastet()

  // Samme innhold som vises på skjermen: URL, wifi, tlf osv. ut fra qr_type,
  // med shop-JSON som fallback. Tidligere kodet utskriften alltid shop-JSON.
  const qrValue = buildQRValue(category)
  const theme = getTheme(themeId)
  const isPage = fullPage
  // Etikettmodus: høyden er låst av cellen på arket, så plassen fordeles
  // eksplisitt i mm — se lib/etikettPlan.ts
  const isLabel = !fullPage && !!heightMm

  const infoLines = (category.info_lines || []).filter(l => l.label || l.value)
  const hasInfo = infoLines.length > 0
  const nr = category.shelf_number

  // ── Farger ───────────────────────────────────────────────────────────────
  // En valgt fellesfarge går foran designet, som igjen går foran QR-kodens egen
  const accent = overrideColor || theme.accent || category.color || SVART
  const frameColor = overrideColor || theme.border || theme.accent || category.color || SVART
  const påAccent = tekstPå(accent)
  const papir = theme.surface === 'paper'
  const mørk = theme.surface === 'dark'
  // Skiltet er helt i nummerfeltets farge, så en fellesfarge farger hele etiketten
  const bg = mørk ? SVART : papir ? HVIT : accent
  const ink = papir ? SVART : tekstPå(bg)
  const muted = papir ? '#6f6a63' : mørk ? '#bdb8b1' : ink
  const faint = papir ? '#a8a39c' : mørk ? '#8f8a83' : ink
  const infoLabelFarge = papir ? '#7c776f' : mørk ? '#a8a39c' : ink
  // Skillestreker: svakt i rammefargen på Standard, grått på designene med faste farger
  const linjeBase = theme.accent ? SVART : frameColor
  const linje = (alfa: string) => (papir ? `${linjeBase}${alfa}` : mørk ? 'rgba(255,255,255,0.22)' : ink)
  // Logoen brukes uendret. På rød eller svart bunn får den en hvit plate bak seg.
  const plate = !papir

  // ── Mål ──────────────────────────────────────────────────────────────────
  const plan = isLabel
    ? planEtikett({ w: widthMm ?? 60, h: heightMm!, theme, logo, showBadge, hasInfo })
    : null
  const landscape = plan?.landscape ?? false
  const baseMm = widthMm ?? 60
  const cardMm = isPage ? 190 : isLabel ? baseMm : hasInfo ? Math.round(baseMm * 1.5) : baseMm
  // Fri modus (enkelt klistremerke uten fast høyde) skaleres med bredden
  const k = cardMm / 60
  const grunnPad = isPage ? 14 : Math.max(1.5, Math.round(6 * k * 10) / 10)
  const pad = plan ? plan.pad : grunnPad * (theme.innerLine ? 1.5 : 1)
  const frame = plan ? plan.frame
    : theme.frame === 'none' ? 0
    : theme.frame === 'thick' ? (isPage ? 3 : 1.4 * k)
    : isPage ? 1.06 : 0.53
  const stripe = plan ? plan.stripe : theme.sideStripe ? (isPage ? 16 : 5 * k) : 0
  const innerW = plan ? plan.innerW : cardMm - 2 * pad - 2 * frame - stripe
  const textW = plan ? plan.textW : innerW
  const gap = plan ? plan.gap : isPage ? 10 : grunnPad / 2

  const logoIn = plan ? plan.logoIn : logo ? theme.logoSlot : null
  const showId = plan ? plan.showId : true
  const showDesc = plan ? plan.showDesc : true
  const showFoot = showId || logoIn === 'foot'
  // Nummeret stort under bjelken i stedet for i den
  const hero = !!theme.hero && showBadge
  const blokker = plan
    ? plan.blokker
    : blokkRekkefolge({ landscape: false, hero, head: logoIn === 'head', badge: showBadge, info: false, foot: showFoot })
        .map((type, i) => ({ type, h: 0, over: i === 0 ? 0 : type === 'foot' ? (isPage ? 6 : grunnPad / 3) : gap }))
  const høyde = (t: BlokkType) => blokker.find(b => b.type === t)?.h ?? 0
  const headH = høyde('head'), badgeH = høyde('badge'), nameH = høyde('name')
  const infoH = høyde('info'), footH = høyde('foot')
  const qrSide = plan?.qrSide ?? 0

  // Grunnstørrelser i punkt for de frie formatene
  const F = isPage
    ? { label: 16, shelf: 30, name: 34, desc: 13, id: 10, infoLabel: 11, infoValue: 17, word: 12,
        hero: 110, heroSub: 16, bandLabel: 18, stackLabel: 14, stackNr: 96, soloNr: 80 }
    : { label: 7 * k, shelf: 9 * k, name: 10 * k, desc: 7 * k, id: 6 * k, infoLabel: 5 * k, infoValue: 7.5 * k,
        word: 5.5 * k, hero: 24 * k, heroSub: 7.5 * k, bandLabel: 7 * k, stackLabel: 6 * k, stackNr: 22 * k, soloNr: 20 * k }

  // ── Skrift ───────────────────────────────────────────────────────────────
  const v = theme.badge
  const LB: Skrift = theme.type === 'mono' ? { w: 500, t: 0.04, mono: true }
    : theme.type === 'heavy' ? { w: 800, t: 0.1, mono: false }
    : { w: 600, t: 0.1, mono: false }
  const NR: Skrift = theme.type === 'mono' ? { w: 700, t: 0.02, mono: true }
    : theme.type === 'heavy' ? { w: 900, t: -0.01, mono: false }
    : v === 'stack' || v === 'number' ? { w: 800, t: -0.02, mono: false }
    : { w: 500, t: 0.02, mono: true }
  // Monoskriften er høyere enn Inter og trenger mer linjehøyde for ikke å klippes
  const NM = theme.type === 'mono' ? { w: 700 as Vekt, t: 0.02, mono: true, upper: true, lh: 1.3 }
    : theme.type === 'heavy' ? { w: 800 as Vekt, t: 0.01, mono: false, upper: true, lh: 1.18 }
    : { w: 600 as Vekt, t: 0, mono: false, upper: false, lh: 1.18 }

  // ── Nummerfeltet ─────────────────────────────────────────────────────────
  const badgeText = innerW < 55 ? BADGE_TEXT_SHORT : BADGE_TEXT
  const bpx = isPage ? 8 : isLabel ? pad : grunnPad
  const bpy = isPage ? 6 : isLabel ? 0 : grunnPad / 3
  const kantB = v === 'outline' ? (isLabel ? Math.max(0.3, badgeH * 0.045) : isPage ? 1 : 0.5) : 0
  const stripeB = v === 'stripes' ? (isLabel ? badgeH * 0.2 : isPage ? 5 : 1.6 * k) : 0
  const celleB = isPage ? 0.5 : 0.3
  const regelB = v === 'rule' ? (isLabel ? Math.max(0.4, badgeH * 0.07) : isPage ? 1.2 : 0.5 * k) : 0
  const bandRegel = theme.bandRule ? (isLabel ? Math.max(0.5, badgeH * 0.09) : isPage ? 2.5 : 0.8 * k) : 0
  // Bredden teksten i feltet har til rådighet, innenfor padding og kanter
  const romW =
    v === 'band' ? (landscape ? textW - pad * 0.6 : textW)
    : v === 'outline' ? textW - 2 * bpx - 2 * kantB
    : v === 'stripes' ? textW - 2 * stripeB - 0.5 - 2 * bpx * 0.7
    : v === 'cells' ? textW - 3 * celleB - 4 * bpx * 0.6
    : v === 'rule' || v === 'number' ? textW
    : textW - 2 * bpx
  const boxH =
    v === 'outline' ? badgeH - 2 * kantB
    : v === 'stripes' ? badgeH - 2 * stripeB - 0.5
    : v === 'cells' ? badgeH - 2 * celleB
    : v === 'rule' ? badgeH - regelB
    : v === 'band' ? badgeH - bandRegel
    : badgeH

  // «UTSTYR NUMMER» og selve nummeret står side om side i badgen. Hver for seg
  // kan begge få plass og likevel sprenge feltet til sammen, så etter at hver
  // er tilpasset høyden skaleres begge ned til summen går inn i bredden.
  const passRad = (maxL: number, maxN: number, andel: boolean) => {
    const wTekst = textW1(badgeText, LB.w, LB.t, LB.mono)
    const wNr = textW1(nr, NR.w, NR.t, NR.mono)
    let label = andel ? Math.min(maxL, (romW * 0.52) / Math.max(0.05, wTekst)) : maxL
    let shelf = andel ? Math.min(maxN, (romW * 0.44) / Math.max(0.05, wNr)) : maxN
    const sum = label * wTekst + shelf * wNr
    const rom = romW * 0.94
    if (sum > rom) { const s = rom / sum; label *= s; shelf *= s }
    return { label, shelf }
  }
  const bf = (() => {
    if (hero) {
      // Bjelken bærer bare teksten; nummeret står stort under den
      const maks = isLabel ? boxH * 0.46 : F.bandLabel / PT
      return { label: Math.min(maks, (romW * 0.92) / Math.max(0.05, textW1(badgeText, 900, 0.24))), shelf: 0 }
    }
    if (v === 'stack') {
      return {
        label: Math.min(isLabel ? badgeH * 0.15 : F.stackLabel / PT,
          (romW * 0.95) / Math.max(0.05, textW1(badgeText, LB.w, LB.t, LB.mono))),
        shelf: Math.min(isLabel ? badgeH * 0.58 : F.stackNr / PT,
          (romW * 0.95) / Math.max(0.05, textW1(nr, NR.w, NR.t, NR.mono))),
      }
    }
    if (v === 'number') {
      return { label: 0, shelf: Math.min(isLabel ? badgeH * 0.78 : F.soloNr / PT,
        romW / Math.max(0.05, textW1(nr, NR.w, NR.t, NR.mono))) }
    }
    const [mL, mN] = v === 'rule' ? [0.3, 0.62] : [0.34, theme.type === 'heavy' ? 0.52 : 0.5]
    // De frie formatene har faste størrelser og krympes bare når de ikke får plass
    return isLabel ? passRad(boxH * mL, boxH * mN, true) : passRad(F.label / PT, F.shelf / PT, false)
  })()

  // ── Stort nummer og navn (Fargebjelke) ───────────────────────────────────
  const heroGap = isLabel ? gap * 0.5 : isPage ? 4 : grunnPad / 4
  const hs = (() => {
    if (!hero) return { nr: 0, sub: 0, lines: 2 }
    const nrMm = fitMm(isLabel ? nameH * 0.62 : F.hero / PT, textW * 0.98, nr.toUpperCase(), 900, -0.03)
    if (!isLabel) return { nr: nrMm, sub: F.heroSub / PT, lines: 2 }
    const sub = fitBlock(Math.max(0, nameH - nrMm * 0.92 - heroGap), textW, category.name.toUpperCase(), 2, 700, 0.06, 1.2)
    return { nr: nrMm, sub: Math.min(sub.mm, nrMm * 0.42), lines: sub.lines }
  })()

  // ── Navn og beskrivelse ──────────────────────────────────────────────────
  // Navnet får plassen det trenger; beskrivelsen får det som er igjen i
  // navneblokka. Begge kan gå over flere linjer når teksten er lang.
  const navnVist = NM.upper ? category.name.toUpperCase() : category.name
  const harDesc = !!category.description && showDesc && !hero
  // Skillestrek over navnet stående — bortsett fra på skiltet, som har sin egen linje
  const skille = !landscape && theme.surface !== 'red'
  // Høyden teksten faktisk har: navneblokka minus lufta og streken over navnet
  const navnRom = nameH - (skille ? gap + 0.3 : 0)
  const nameFit = isLabel && !hero
    ? fitBlock(harDesc ? (navnRom - gap / 2) * 0.66 : navnRom, textW, navnVist, 4, NM.w, NM.t, NM.lh, NM.mono)
    : { mm: 0, lines: 1 }
  // Selv et veldig langt navn skal være lesbart — heller kutte enn å krympe
  const nameFontMm = Math.max(nameFit.mm, Math.min(1.9, nameH * 0.3))
  const nameLines = nameFit.lines
  // Beskrivelsen får det som er igjen under navnet, minus lufta mellom dem
  const descBudget = navnRom - nameFontMm * NM.lh * nameLines - gap / 2
  const descFit = isLabel ? fitBlock(Math.max(0, descBudget), textW, category.description || '', 2, 400, 0, 1.25) : { mm: 0, lines: 2 }
  const descFontMm = Math.min(descFit.mm, nameFontMm * 0.72)
  const descLines = descFit.lines

  // ── Infolisten ───────────────────────────────────────────────────────────
  const infoColW = landscape ? textW : Math.max(1, innerW - qrSide - gap)
  const longestInfoValue = infoLines.reduce((a, l) => (l.value.length > a.length ? l.value : a), '')
  // Høyden hver infolinje har til rådighet, minus mellomrom og skillestrek
  const infoLineH = (landscape ? infoH : qrSide) / Math.max(1, infoLines.length)
  const infoLineContent = Math.max(0.5, infoLineH - gap * 1.5)

  // ── Bunnraden og logoen ──────────────────────────────────────────────────
  // Teknisk har strek over bunnraden også stående, som et tegningshode
  const footLinje = landscape || v === 'cells'
  // Streken og lufta over bunnraden spiser av høyden dens
  const footInnerH = Math.max(0.5, footH - (footLinje ? gap / 2 + 0.3 : 0))
  // Logoen på etikettark: så høy bunnraden tillater, men aldri bredere enn en
  // fjerdedel av etiketten — resten av raden skal være til ordmerke og ID.
  const logoMaks = isLabel
    ? Math.min(footInnerH * 0.9, textW * 0.26 / LOGO_RATIO)
    : isPage ? 15 : Math.max(2.5, innerW * 0.11)
  const logoMm = plate ? logoMaks / 1.28 : logoMaks
  const hodeMaks = isLabel
    ? Math.min(headH * 0.92, textW * 0.45 / LOGO_RATIO)
    : isPage ? 20 : Math.max(3, innerW * 0.13)
  const hodeLogo = plate ? hodeMaks / 1.28 : hodeMaks
  const idMm = isLabel ? Math.min(footInnerH * 0.5, textW * 0.05) : F.id / PT
  const idTekst = category.id.slice(0, 8).toUpperCase()
  // Ordmerket får bare den bredden logoen og ID-en levner i bunnraden
  const wordRoom = textW - logoMaks * LOGO_RATIO
    - (showId ? idMm * textW1(idTekst, 500, 0.03, true) : 0) - gap * 2.5
  const wordMm = isLabel ? fitMm(footInnerH * 0.42, Math.max(0, wordRoom), WORDMARK, 600, 0.08) : F.word / PT
  // Ordmerket droppes når det ikke blir lesbart i plassen som er igjen
  const showWord = logoIn === 'foot' && (!isLabel || wordMm >= 1.4)

  const font = isLabel
    ? {
        name: mm(nameFontMm),
        desc: mm(descFontMm),
        id: mm(idMm),
        infoLabel: mm(Math.min(infoLineContent * 0.3, infoColW * 0.12)),
        infoValue: mm(fitMm(infoLineContent * 0.48, infoColW, longestInfoValue, 600)),
        word: mm(wordMm),
      }
    : {
        name: mm(F.name / PT), desc: mm(F.desc / PT), id: mm(F.id / PT),
        infoLabel: mm(F.infoLabel / PT), infoValue: mm(F.infoValue / PT), word: mm(F.word / PT),
      }

  // Helt ark har fast høyde, men skriften står fast i punkt. QR-en får det som
  // er igjen når alt annet er regnet med — ellers skyver et stort nummer, en
  // logo øverst eller et navn over to linjer innholdet ut over kanten av arket.
  const sideQr = () => {
    const tilgjengelig = 277 - 2 * pad - 2 * frame
    const linje = (pt: number, f = 1.21) => (pt / PT) * f
    const linjer = (tekst: string, størrelse: number, w: Vekt, t: number, mono: boolean) => {
      const n = wrapLines(tekst, innerW * 0.96, størrelse, w, t, mono)
      return Number.isFinite(n) ? n : 3
    }
    const badge = !showBadge ? 0
      : hero ? 2 * bpy + linje(F.bandLabel)
      : v === 'stack' ? 2 * bpy + linje(F.stackLabel, 1) + bf.shelf * 1.03
      : v === 'number' ? bf.shelf * 1.25
      : v === 'rule' ? linje(F.shelf) + regelB
      : v === 'stripes' ? 2 * stripeB + 0.5 + 1.2 * bpy + linje(F.shelf)
      : v === 'cells' ? 2 * celleB + 1.2 * bpy + linje(F.shelf)
      : 2 * bpy + linje(F.shelf) + 2 * kantB + bandRegel
    const navn = hero
      ? hs.nr * 0.92 + heroGap + linjer(category.name.toUpperCase(), hs.sub, 700, 0.06, false) * hs.sub * 1.2
      : (theme.surface !== 'red' ? 8.3 : 0)
        + linjer(navnVist, F.name / PT, NM.w, NM.t, NM.mono) * (F.name / PT) * NM.lh
        + (harDesc ? 4 + linjer(category.description || '', F.desc / PT, 400, 0, false) * (F.desc / PT) * 1.25 : 0)
    const hode = logoIn === 'head' ? hodeMaks : 0
    const fot = Math.max(logoIn === 'foot' ? logoMaks : 0, (F.id / PT) * 1.2) + (footLinje ? gap / 3 + 0.3 : 0)
    const mellomrom = blokker.reduce((sum, b) => sum + b.over, 0)
    // 4 mm slakk: linjehøydene over er anslag
    return tilgjengelig - badge - navn - hode - fot - mellomrom - 4
  }

  const qrW = isPage
    ? Math.max(60, Math.min(hasInfo ? 105 : 145, innerW, sideQr()))
    : isLabel ? qrSide
    : hasInfo ? Math.round((innerW - 4) * 0.52) : innerW

  const hjørne = theme.corners === 'square' ? 0
    : isPage ? (theme.frame === 'thick' ? 11 : 8)
    : isLabel ? pad * (theme.frame === 'thick' ? 1.5 : 1)
    : theme.frame === 'thick' ? 6 : 4
  const badgeHjørne = theme.corners === 'square' ? 0 : isPage ? 4 : isLabel ? pad / 2 : 2.12
  const førsteBlokk = blokker[0]?.type
  // Sidestripen har teksten på høykant, så tekst og nummer står venstrestilt
  const venstre = landscape || !!theme.sideStripe

  // ── Blokkene ─────────────────────────────────────────────────────────────
  const logoEl = (h: number) => plate
    ? (
      <span style={{ display: 'inline-flex', flexShrink: 0, backgroundColor: HVIT,
        padding: mm(h * 0.14), borderRadius: mm(h * 0.2) }}>
        <HaugeMaskinLogo height={mm(h)} />
      </span>
    )
    : <HaugeMaskinLogo height={mm(h)} />

  const hodeEl = (over: number) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: landscape ? 'flex-start' : 'center',
      width: '100%', height: isLabel ? mm(headH) : undefined, flexShrink: 0, marginTop: mm(over),
    }}>
      {logoEl(hodeLogo)}
    </div>
  )

  const badgeEl = (over: number) => {
    const felles: CSSProperties = {
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      height: isLabel ? mm(badgeH) : undefined,
      flexShrink: 0,
      overflow: 'hidden',
      marginTop: mm(over),
      borderRadius: mm(badgeHjørne),
      padding: `${mm(bpy)} ${mm(bpx)}`,
    }
    const lbl = (farge: string, ekstra?: CSSProperties) => (
      <span style={{
        color: farge, fontSize: mm(bf.label), fontFamily: LB.mono ? MONO : SANS,
        letterSpacing: `${LB.t}em`, fontWeight: LB.w, whiteSpace: 'nowrap', ...ekstra,
      }}>
        {badgeText}
      </span>
    )
    const tall = (farge: string, ekstra?: CSSProperties) => (
      <span style={{
        color: farge, ...(NR.mono ? NUM : NUM_STOR), fontSize: mm(bf.shelf), fontFamily: NR.mono ? MONO : SANS,
        letterSpacing: `${NR.t}em`, fontWeight: NR.w, whiteSpace: 'nowrap', ...ekstra,
      }}>
        {nr}
      </span>
    )

    if (v === 'band') {
      // Bjelken går helt ut til rammen — og opp til den når den står øverst
      const først = førsteBlokk === 'badge'
      return (
        <div style={{
          ...felles,
          backgroundColor: accent,
          borderRadius: 0,
          width: landscape ? `calc(100% + ${mm(pad)})` : `calc(100% + ${mm(2 * pad)})`,
          marginLeft: landscape ? 0 : mm(-pad),
          marginRight: mm(-pad),
          marginTop: først ? mm(-pad) : mm(over),
          height: isLabel ? mm(badgeH + (først ? pad : 0)) : undefined,
          padding: `${mm(bpy + (først ? pad : 0))} ${mm(pad)} ${mm(bpy)} ${mm(landscape ? pad * 0.6 : pad)}`,
          borderBottom: bandRegel ? `${mm(bandRegel)} solid ${HM_RED}` : undefined,
          justifyContent: hero ? (landscape ? 'flex-start' : 'center') : 'space-between',
        }}>
          {hero
            ? lbl(påAccent, { fontWeight: 900, letterSpacing: '0.24em' })
            : <>{lbl(påAccent)}{tall(påAccent)}</>}
        </div>
      )
    }
    if (v === 'outline') {
      return <div style={{ ...felles, border: `${mm(kantB)} solid ${accent}` }}>{lbl(accent)}{tall(accent)}</div>
    }
    if (v === 'stripes') {
      const s = stripeB * 1.1
      return (
        <div style={{
          ...felles, padding: mm(stripeB), borderRadius: 0,
          background: `repeating-linear-gradient(-45deg, ${accent} 0 ${mm(s)}, ${HVIT} ${mm(s)} ${mm(2 * s)})`,
        }}>
          <div style={{
            flex: 1, alignSelf: 'stretch', minWidth: 0, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: HVIT, border: `${mm(0.25)} solid ${SVART}`,
            padding: `${mm(bpy * 0.6)} ${mm(bpx * 0.7)}`,
          }}>
            {lbl(SVART)}{tall(SVART)}
          </div>
        </div>
      )
    }
    if (v === 'cells') {
      const celle: CSSProperties = { display: 'flex', alignItems: 'center', padding: `${mm(bpy * 0.6)} ${mm(bpx * 0.6)}` }
      return (
        <div style={{ ...felles, padding: 0, borderRadius: 0, alignItems: 'stretch', border: `${mm(celleB)} solid ${SVART}` }}>
          {lbl(SVART, { ...celle, borderRight: `${mm(celleB)} solid ${SVART}` })}
          {tall(SVART, { ...celle, flex: 1, justifyContent: 'flex-end' })}
        </div>
      )
    }
    if (v === 'rule') {
      return (
        <div style={{ ...felles, padding: 0, borderRadius: 0, borderBottom: `${mm(regelB)} solid ${accent}` }}>
          {lbl(infoLabelFarge, { fontWeight: 500 })}{tall(ink)}
        </div>
      )
    }
    if (v === 'stack') {
      return (
        <div style={{ ...felles, flexDirection: 'column', justifyContent: 'center', gap: mm(bf.shelf * 0.08), backgroundColor: accent }}>
          {lbl(påAccent, { lineHeight: 1 })}{tall(påAccent, { lineHeight: 0.95 })}
        </div>
      )
    }
    if (v === 'number') {
      return (
        <div style={{ ...felles, padding: 0, borderRadius: 0, justifyContent: venstre ? 'flex-start' : 'center' }}>
          {tall(accent, { lineHeight: 1.25 })}
        </div>
      )
    }
    return <div style={{ ...felles, backgroundColor: accent }}>{lbl(påAccent)}{tall(påAccent)}</div>
  }

  // QR-en på rød eller svart bunn får sin egen hvite stillesone
  const øy = !papir
  const qrKode = (bredde: number) => {
    const kode = (
      <QRCodeSVG
        value={qrValue}
        size={1024}
        bgColor={HVIT}
        fgColor={SVART}
        level="M"
        marginSize={øy ? 4 : 0}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
    )
    if (theme.qrMarks) {
      // Hjørnemerker som i en søker. De står utenfor koden, i lufta rundt den.
      const lengde = mm(bredde * 0.14)
      const strek = `${mm(Math.max(0.3, bredde * 0.012))} solid ${SVART}`
      const hjørner: CSSProperties[] = [
        { top: 0, left: 0, borderTop: strek, borderLeft: strek },
        { top: 0, right: 0, borderTop: strek, borderRight: strek },
        { bottom: 0, left: 0, borderBottom: strek, borderLeft: strek },
        { bottom: 0, right: 0, borderBottom: strek, borderRight: strek },
      ]
      return (
        <div style={{
          position: 'relative', flexShrink: 0, width: mm(bredde), padding: mm(bredde * 0.1),
          boxSizing: 'border-box', lineHeight: 0,
        }}>
          {kode}
          {hjørner.map((h, i) => (
            <span key={i} style={{ position: 'absolute', width: lengde, height: lengde, ...h }} />
          ))}
        </div>
      )
    }
    return (
      <div style={{
        flexShrink: 0, width: mm(bredde), lineHeight: 0,
        borderRadius: øy ? mm(bredde * 0.05) : undefined, overflow: øy ? 'hidden' : undefined,
      }}>
        {kode}
      </div>
    )
  }

  const infoListe = (over: number) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: isLabel ? mm(gap) : isPage ? '6mm' : '2mm',
        flex: landscape ? undefined : 1,
        width: landscape ? '100%' : undefined,
        height: landscape ? mm(infoH) : undefined,
        marginTop: landscape ? mm(over) : undefined,
        minWidth: 0,
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      {infoLines.map((line, i) => (
        <div
          key={i}
          style={{
            borderBottom: `1px solid ${linje('22')}`,
            paddingBottom: isLabel ? mm(gap / 2) : isPage ? '3mm' : '1mm',
          }}
        >
          {line.label && (
            <div
              style={{
                fontSize: font.infoLabel,
                fontFamily: SANS,
                fontWeight: 500,
                letterSpacing: '0.06em',
                color: infoLabelFarge,
                textTransform: 'uppercase',
                lineHeight: 1.2,
              }}
            >
              {line.label}
            </div>
          )}
          {line.value && (
            <div
              style={{
                ...NUM,
                fontSize: font.infoValue,
                fontFamily: SANS,
                fontWeight: 600,
                color: ink,
                lineHeight: 1.2,
                wordBreak: 'break-word',
              }}
            >
              {line.value}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  // QR-en. I liggende layout står den alene til venstre; ellers med
  // infolisten ved siden av seg.
  const qrRadEl = (over: number) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: hasInfo && !landscape ? (isPage ? '10mm' : mm(gap)) : undefined,
        width: hasInfo && !landscape ? '100%' : undefined,
        height: isLabel ? mm(qrSide) : undefined,
        flexShrink: 0,
        marginTop: mm(over),
      }}
    >
      {qrKode(qrW)}
      {!landscape && hasInfo && infoListe(0)}
    </div>
  )

  // Nummeret stort og navnet under — som hylleetikettene i Lagersystemet
  const heroEl = (over: number) => (
    <div style={{
      boxSizing: 'border-box', width: '100%', height: isLabel ? mm(nameH) : undefined, overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      alignItems: landscape ? 'flex-start' : 'center', textAlign: landscape ? 'left' : 'center',
      marginTop: mm(over),
    }}>
      <div style={{
        ...NUM_STOR, fontFamily: SANS, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 0.92,
        fontSize: mm(hs.nr), color: ink, whiteSpace: 'nowrap', textTransform: 'uppercase',
      }}>
        {nr}
      </div>
      <div style={{ width: '100%', minWidth: 0, marginTop: mm(heroGap) }}>
        <p style={{
          margin: 0, fontFamily: SANS, fontWeight: 700, letterSpacing: '0.06em', lineHeight: 1.2,
          fontSize: mm(hs.sub), color: muted, textTransform: 'uppercase',
          ...(isLabel ? CLAMP(hs.lines) : null),
        }}>
          {category.name}
        </p>
      </div>
    </div>
  )

  const navnEl = (over: number) => (
    <div
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: isLabel ? mm(nameH) : undefined,
        overflow: 'hidden',
        // Liggende etiketter har ofte luft til overs i navneblokka — da ser
        // det ryddigere ut at teksten står midt i den enn klistret i toppen
        display: landscape ? 'flex' : undefined,
        flexDirection: landscape ? 'column' : undefined,
        justifyContent: landscape ? 'center' : undefined,
        textAlign: venstre ? 'left' : 'center',
        borderTop: skille ? (v === 'cells' ? `${mm(0.3)} solid ${SVART}` : `1px solid ${linje('22')}`) : undefined,
        paddingTop: skille ? (isPage ? '8mm' : isLabel ? mm(gap) : mm(grunnPad / 2)) : 0,
        marginTop: mm(over),
      }}
    >
      {/* Egen innpakning: som flex-barn ville avsnittene fått `display`
          blokkert, og da slutter linjekuttingen under å virke */}
      <div style={{ width: '100%', minWidth: 0 }}>
        <p
          style={{
            ...NUM,
            margin: 0,
            fontSize: font.name,
            fontFamily: NM.mono ? MONO : SANS,
            fontWeight: NM.w,
            color: ink,
            lineHeight: NM.lh,
            letterSpacing: NM.upper ? `${NM.t}em` : '-0.005em',
            textTransform: NM.upper ? 'uppercase' : undefined,
            // Lange navn brekkes over inntil fire linjer og kuttes med ellipse
            // hvis de fortsatt ikke får plass, i stedet for å velte layouten
            ...(isLabel ? CLAMP(nameLines) : null),
          }}
        >
          {category.name}
        </p>
        {harDesc && (!isLabel || descFontMm > 0.9) && (
          <p
            style={{
              fontSize: font.desc,
              color: muted,
              margin: 0,
              lineHeight: 1.25,
              marginTop: isPage ? '4mm' : isLabel ? mm(gap / 2) : '3px',
              fontFamily: SANS,
              fontWeight: 400,
              ...(isLabel ? CLAMP(descLines) : null),
            }}
          >
            {category.description}
          </p>
        )}
      </div>
    </div>
  )

  // Bunnraden: logo til venstre og ID til høyre. ID-en droppes på små
  // etiketter der plassen trengs til navnet, og hele raden faller bort når
  // det verken er logo eller ID å vise.
  const footEl = (over: number) => (
    <div
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: landscape
          ? 'flex-start'
          : logoIn === 'foot' && showId ? 'space-between' : 'center',
        gap: isLabel ? mm(gap) : isPage ? '5mm' : mm(grunnPad / 2),
        width: '100%',
        height: isLabel ? mm(footH) : undefined,
        flexShrink: 0,
        overflow: 'hidden',
        // Liggende etikett har ingen strek over bunnraden fra før — uten den
        // flyter logoen og ID-en løst under teksten
        borderTop: footLinje ? (v === 'cells' ? `${mm(0.3)} solid ${SVART}` : `0.2mm solid ${linje('33')}`) : undefined,
        paddingTop: footLinje ? mm(isLabel ? gap / 2 : gap / 3) : undefined,
        marginTop: mm(over),
      }}
    >
      {logoIn === 'foot' && (
        // Ordmerket kan krympes/klippes hvis målingen bommer — logoen og
        // ID-en skal aldri presses ut over etikettkanten
        <span style={{
          display: 'flex', alignItems: 'center', minWidth: 0, flexShrink: 1, overflow: 'hidden',
          gap: isLabel ? mm(gap * 0.8) : isPage ? '4mm' : '1.5mm',
        }}>
          {logoEl(logoMm)}
          {showWord && (
            <span style={{
              fontSize: font.word,
              fontFamily: SANS,
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: ink,
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}>
              {WORDMARK}
            </span>
          )}
        </span>
      )}
      {showId && (
        <span
          style={{
            ...NUM,
            fontSize: font.id,
            color: faint,
            lineHeight: 1.2,
            fontFamily: MONO,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
          }}
        >
          {idTekst}
        </span>
      )}
    </div>
  )

  const blokk = (type: BlokkType, over: number): ReactNode => {
    switch (type) {
      case 'head': return hodeEl(over)
      case 'badge': return badgeEl(over)
      case 'qr': return qrRadEl(over)
      case 'name': return hero ? heroEl(over) : navnEl(over)
      case 'info': return infoListe(over)
      case 'foot': return footEl(over)
    }
  }

  // ── Pynt som ligger utenfor flyten ───────────────────────────────────────
  const stripeTekst = (() => {
    if (!stripe || !showBadge) return null
    // Stående tekst langs hele høyden. Den frie etiketten har ingen fast høyde,
    // så der anslås den ut fra bredden.
    const lengde = (isLabel ? heightMm! : isPage ? 277 : innerW * 1.2) - 2 * frame
    for (const t of [BADGE_TEXT, BADGE_TEXT_SHORT]) {
      const f = Math.min(stripe * 0.5, (lengde * 0.8) / textW1(t, 700, 0.2))
      if (f >= 1.2) return { t, f }
    }
    return null
  })()
  const grunnLinje = isLabel ? pad / 1.5 : grunnPad
  const innset = grunnLinje * 0.55
  const saksMm = Math.min(pad * 0.85, isPage ? 7 : 5)

  const dekor = (
    <>
      {stripe > 0 && (
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: mm(stripe), backgroundColor: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {stripeTekst && (
            <span style={{
              writingMode: 'vertical-rl', transform: 'rotate(180deg)', color: påAccent,
              fontFamily: SANS, fontWeight: 700, letterSpacing: '0.2em', fontSize: mm(stripeTekst.f),
              whiteSpace: 'nowrap', lineHeight: 1,
            }}>
              {stripeTekst.t}
            </span>
          )}
        </div>
      )}
      {theme.innerLine && (
        <div style={{
          position: 'absolute', top: mm(innset), left: mm(innset), right: mm(innset), bottom: mm(innset),
          border: `${mm(isPage ? 1.4 : Math.max(0.35, grunnLinje * 0.22))} solid ${ink}`,
          borderRadius: mm(Math.max(0, hjørne - innset)),
        }} />
      )}
      {theme.scissors && saksMm >= 1.2 && (
        <svg viewBox="0 0 24 24" fill="none" stroke={SVART} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', top: mm((pad - saksMm) / 2), left: mm(pad * 2), width: mm(saksMm), height: mm(saksMm) }}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      )}
    </>
  )

  const cardStyle: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: landscape ? 'row' : 'column',
    alignItems: 'center',
    // Helt ark: innholdet midt på siden — med mindre en bjelke skal stå øverst
    justifyContent: isPage ? (v === 'band' && førsteBlokk === 'badge' ? 'flex-start' : 'center') : undefined,
    gap: landscape ? mm(gap) : undefined,
    width: mm(cardMm),
    height: isPage ? '277mm' : isLabel ? mm(heightMm!) : undefined,
    overflow: 'hidden',
    padding: `${mm(pad)} ${mm(pad)} ${mm(pad)} ${mm(pad + stripe)}`,
    backgroundColor: bg,
    border: frame > 0 ? `${mm(frame)} ${theme.frame === 'dashed' ? 'dashed' : 'solid'} ${frameColor}` : 'none',
    borderRadius: mm(hjørne),
    fontFamily: SANS,
    color: ink,
    // Fast linjehøyde: i appen arves 1,5 fra Tailwind, i utskriftsvinduet
    // «normal» — da ble forhåndsvisningen noen piksler høyere enn utskriften
    lineHeight: 1.2,
    pageBreakInside: 'avoid',
  }

  const innhold = blokker.map(b => <Fragment key={b.type}>{blokk(b.type, b.over)}</Fragment>)

  // Liggende etikett: QR til venstre, all tekst i en kolonne til høyre
  if (landscape) {
    return (
      <div className="sticker-card" style={cardStyle}>
        {dekor}
        {qrRadEl(0)}
        <div style={{
          display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0,
          height: '100%', justifyContent: 'center',
        }}>
          {innhold}
        </div>
      </div>
    )
  }

  return (
    <div className="sticker-card" style={cardStyle}>
      {dekor}
      {innhold}
    </div>
  )
}
