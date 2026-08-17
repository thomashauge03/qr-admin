'use client'

import type { CSSProperties } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Category, buildQRValue } from '@/types'
import { LabelThemeId, getTheme } from '@/lib/labelTheme'
import HaugeMaskinLogo, { LOGO_RATIO } from './HaugeMaskinLogo'

interface Props {
  category: Category
  size?: number
  forPrint?: boolean
  /** Fyller et helt A4-ark med én stor QR-kode */
  fullPage?: boolean
  /** Bredde på klistremerket i mm ved utskrift (default 60, eller 90 med infoliste) */
  widthMm?: number
  /** Høyde i mm — settes når klistremerket skal fylle en celle på et etikettark */
  heightMm?: number
  /** Vis hylle-feltet øverst */
  showBadge?: boolean
  /** Overstyrer fargen som er lagret på QR-koden */
  overrideColor?: string | null
  /** Profil på etiketten — 'hauge' gir HM-logo og merkefarge */
  theme?: LabelThemeId
}

const mmPt = (mm: number) => `${Math.round(mm * 2.8346 * 10) / 10}pt`

// Utskriftstypografi: Inter er langt mer lesbar i småskrift enn display-fonten
// Syne, og monoen har sperret null (0 vs O) for hyllenummer og ID.
const SANS = 'Inter, system-ui, sans-serif'
const MONO = 'JetBrains Mono, ui-monospace, monospace'
const NUM: CSSProperties = { fontVariantNumeric: 'slashed-zero tabular-nums' }

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

// ── Tekstmåling ──────────────────────────────────────────────────────────
// Et snitt-tegnbredde-anslag bommer med opptil 30 % mellom «Vibroplate» (0,48)
// og «BETONGSAGBLAD 350MM» (0,62), og da ryker teksten ut på en linje ekstra.
// Derfor måles den faktiske bredden med de samme fontene som utskriften bruker.
type Vekt = 400 | 500 | 600
const ANSLAG: Record<Vekt, number> = { 400: 0.52, 500: 0.56, 600: 0.56 }
const målCache = new Map<string, number>()
let måler: CanvasRenderingContext2D | null | undefined

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
  let bredde: number
  if (måler && typeof document !== 'undefined' && document.fonts?.check(`${weight} 16px ${navn}`)) {
    måler.font = `${weight} 100px ${mono ? MONO : SANS}`
    bredde = måler.measureText(text).width / 100 + tracking * text.length
  } else {
    // Server-rendering eller font ikke lastet ennå
    bredde = text.length * ((mono ? 0.6 : ANSLAG[weight]) + tracking)
  }
  målCache.set(key, bredde)
  return bredde
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
const wrapLines = (text: string, width: number, font: number, weight: Vekt, tracking: number) => {
  let lines = 1, brukt = 0
  for (const ord of text.split(/(?<=[\s-])/)) {
    const full = textW1(ord, weight, tracking) * font
    const uten = textW1(ord.trimEnd(), weight, tracking) * font
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
  maxLines: number, weight: Vekt = 600, tracking = 0, lineHeight = 1.18,
) => {
  if (!text || width <= 0 || heightBudget <= 0) return { mm: 0, lines: 1 }
  // Margin: canvas-målingen kjenner ikke tabular-nums og hinting på liten
  // skrift, så den bommer et par prosent på tekst med tall
  const linje = width * 0.96
  const passer = (f: number) => {
    const l = wrapLines(text, linje, f, weight, tracking)
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
  const trengs = wrapLines(text, linje, lo, weight, tracking)
  return {
    mm: lo,
    lines: Math.max(Number.isFinite(trengs) ? trengs : 1, Math.min(maxLines, romForLinjer)),
  }
}

export default function StickerCard({
  category, size = 160, forPrint = false, fullPage = false,
  widthMm, heightMm, showBadge = true, overrideColor, theme: themeId,
}: Props) {
  // Samme innhold som vises på skjermen: URL, wifi, tlf osv. ut fra qr_type,
  // med shop-JSON som fallback. Tidligere kodet utskriften alltid shop-JSON.
  const qrValue = buildQRValue(category)

  const theme = getTheme(themeId)
  // En valgt fellesfarge går foran temaet, som igjen går foran QR-kodens egen
  const accentColor = overrideColor || theme.accent || category.color || '#0f0f0f'
  // Ramme og skillestreker kan ha egen farge — HM-temaet har svart ramme
  const frameColor = overrideColor || theme.border || theme.accent || category.color || '#0f0f0f'
  const showLogo = theme.logo

  const infoLines = (category.info_lines || []).filter(l => l.label || l.value)
  const hasInfo = infoLines.length > 0

  // ── Etikettmodus: høyden er låst av cellen på arket, så plassen fordeles
  //    eksplisitt i mm. Summen av blokkene er nøyaktig lik etiketthøyden.
  const isLabel = !!heightMm && forPrint
  const h = heightMm || 0
  const w = widthMm ?? 60

  const pad     = Math.min(4, Math.max(0.8, h * 0.055))
  const availH  = h - pad * 2
  const availW  = w - pad * 2
  const gap     = availH * 0.04
  // Beskrivelse og ID får bare plass på de større etikettene
  const showDesc = isLabel ? h >= 50 : true
  const showId   = isLabel ? h >= 70 : true

  // Brede etiketter (f.eks. 105 x 74mm) får QR-en ved siden av teksten i stedet
  // for over den — ellers begrenser høyden QR-en til under halv størrelse.
  const landscape = isLabel && w > h * 1.15

  // Bunnraden rommer logo (til venstre) og ID (til høyre). Logoen trenger litt
  // mer høyde enn ID-teksten alene for å være lesbar på små etiketter.
  const showFoot = showId || showLogo
  const badgeH = showBadge ? availH * (landscape ? 0.2 : 0.19) : 0
  const footH  = showFoot ? availH * ((landscape ? 0.09 : 0.08) + (showLogo ? 0.05 : 0)) : 0

  // Tekstkolonnens bredde og de enkelte blokkenes høyde
  let qrSide: number, textW: number, nameH: number, infoH: number
  if (landscape) {
    qrSide = Math.max(4, Math.min(availH, availW * 0.5))
    textW  = Math.max(1, availW - qrSide - gap)
    const rest = availH - badgeH - footH - gap * ((showBadge ? 1 : 0) + (showFoot ? 1 : 0))
    infoH  = hasInfo ? rest * 0.55 - gap : 0
    nameH  = hasInfo ? rest * 0.45 : rest
  } else {
    nameH = availH * (showDesc ? 0.28 : 0.2)
    const qrBudget = availH - badgeH - nameH - footH - gap * (showBadge ? 3 : 2)
    qrSide = Math.max(4, Math.min(qrBudget, hasInfo ? availW * 0.42 : availW))
    textW  = availW
    infoH  = 0
  }
  const infoColW = landscape ? textW : Math.max(1, availW - qrSide - gap)
  const longestInfoValue = infoLines.reduce((a, l) => (l.value.length > a.length ? l.value : a), '')
  // Høyden hver infolinje har til rådighet, minus mellomrom og skillestrek
  const infoLineH = (landscape ? infoH : qrSide) / Math.max(1, infoLines.length)
  const infoLineContent = Math.max(0.5, infoLineH - gap * 1.5)
  // Badgen har innvendig padding som teksten ikke kan bruke
  const badgeInnerW = Math.max(1, textW - pad * 2)

  // Navnet får plassen det trenger; beskrivelsen får det som er igjen i
  // navneblokka. Begge kan gå over flere linjer når teksten er lang.
  const harDesc = !!category.description && showDesc
  const nameFit = fitBlock(nameH * (harDesc ? 0.64 : 1) - (isLabel ? gap / 2 : 0), textW, category.name, 4)
  // Selv et veldig langt navn skal være lesbart — heller kutte enn å krympe
  const nameFontMm = Math.max(nameFit.mm, Math.min(1.9, nameH * 0.3))
  const nameLines = nameFit.lines
  const descBudget = nameH - nameFontMm * 1.18 * nameLines - gap
  const descFit = fitBlock(Math.max(0, descBudget), textW, category.description || '', 2, 400, 0, 1.25)
  const descFontMm = Math.min(descFit.mm, nameFontMm * 0.72)
  const descLines = descFit.lines

  // ── Fri modus (enkelt klistremerke uten fast høyde)
  const baseMm = w
  const cardMm = hasInfo && !isLabel ? Math.round(baseMm * 1.5) : baseMm
  const k = cardMm / 60
  const pt = (base: number) => `${Math.round(base * k * 10) / 10}pt`
  const padFree = Math.max(1.5, Math.round(6 * k * 10) / 10)
  const innerFree = cardMm - padFree * 2

  const padMm = isLabel ? pad : padFree
  const badgeWidth = fullPage ? 162 : isLabel ? availW : innerFree
  const badgeText = badgeWidth < 55 ? BADGE_TEXT_SHORT : BADGE_TEXT

  // «UTSTYR NUMMER» og selve nummeret står side om side i badgen. Hver for seg
  // kan begge få plass og likevel sprenge feltet til sammen, så etter at hver
  // er tilpasset høyden skaleres begge ned til summen går inn i bredden.
  const badgeFit = (() => {
    const wTekst = textW1(badgeText, 600, 0.1)
    const wNr = textW1(category.shelf_number, 500, 0.02, true)
    let label = Math.min(badgeH * 0.34, (badgeInnerW * 0.52) / Math.max(0.05, wTekst))
    let shelf = Math.min(badgeH * 0.5, (badgeInnerW * 0.44) / Math.max(0.05, wNr))
    const sum = label * wTekst + shelf * wNr
    const rom = badgeInnerW * 0.94
    if (sum > rom) { const k = rom / sum; label *= k; shelf *= k }
    return { label, shelf }
  })()

  // Logoen på etikettark: så høy bunnraden tillater, men aldri bredere enn en
  // fjerdedel av etiketten — resten av raden skal være til ordmerke og ID.
  // Streken og lufta over bunnraden spiser av høyden dens
  const footInnerH = Math.max(0.5, footH - (landscape ? gap / 2 + 0.2 : 0))
  const logoMm  = Math.min(footInnerH * 0.9, textW * 0.26 / LOGO_RATIO)
  // Ordmerket får bare den bredden logoen og ID-en levner i bunnraden
  const idMm    = Math.min(footInnerH * 0.5, textW * 0.05)
  const idTekst = category.id.slice(0, 8).toUpperCase()
  const wordRoom = textW - logoMm * LOGO_RATIO
    - (showId ? idMm * textW1(idTekst, 500, 0.03, true) : 0) - gap * 2.5
  const wordMm  = fitMm(footInnerH * 0.42, Math.max(0, wordRoom), theme.wordmark || '', 600, 0.08)
  // Ordmerket droppes når det ikke blir lesbart i plassen som er igjen
  const showWord = !!theme.wordmark && (!isLabel || wordMm >= 1.4)

  const font = fullPage
    ? { label: '16pt', shelf: '30pt', name: '34pt', desc: '13pt', id: '10pt', infoLabel: '11pt', infoValue: '17pt', word: '12pt' }
    : isLabel
    ? {
        label:     mmPt(badgeFit.label),
        shelf:     mmPt(badgeFit.shelf),
        name:      mmPt(nameFontMm),
        desc:      mmPt(descFontMm),
        id:        mmPt(idMm),
        infoLabel: mmPt(Math.min(infoLineContent * 0.3, infoColW * 0.12)),
        infoValue: mmPt(fitMm(infoLineContent * 0.48, infoColW, longestInfoValue, 600)),
        word:      mmPt(wordMm),
      }
    : forPrint
    ? { label: pt(7), shelf: pt(9), name: pt(10), desc: pt(7), id: pt(6), infoLabel: pt(5), infoValue: pt(7.5), word: pt(5.5) }
    : { label: '10px', shelf: '13px', name: '14px', desc: '10px', id: '9px', infoLabel: '8px', infoValue: '12px', word: '9px' }

  // Høyde på logoen i hver modus
  const logoHeight = fullPage
    ? '15mm'
    : isLabel
    ? `${Math.round(logoMm * 100) / 100}mm`
    : forPrint
    ? `${Math.round(Math.max(2.5, innerFree * 0.11) * 10) / 10}mm`
    : '18px'

  const qrWidth = fullPage
    ? (hasInfo ? '105mm' : '145mm')
    : isLabel
    ? `${Math.round(qrSide * 10) / 10}mm`
    : forPrint
    ? `${hasInfo ? Math.round((innerFree - 4) * 0.52) : innerFree}mm`
    : undefined

  const infoList = hasInfo && (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: isLabel ? `${gap}mm` : fullPage ? '6mm' : forPrint ? '2mm' : '10px',
        flex: landscape ? undefined : 1,
        width: landscape ? '100%' : undefined,
        height: landscape ? `${infoH}mm` : undefined,
        minWidth: 0,
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      {infoLines.map((line, i) => (
        <div
          key={i}
          style={{
            borderBottom: `1px solid ${frameColor}22`,
            paddingBottom: isLabel ? `${gap / 2}mm` : fullPage ? '3mm' : forPrint ? '1mm' : '6px',
          }}
        >
          {line.label && (
            <div
              style={{
                fontSize: font.infoLabel,
                fontFamily: SANS,
                fontWeight: 500,
                letterSpacing: '0.06em',
                color: '#7c776f',
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
                color: '#0f0f0f',
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

  const badgeEl = showBadge && (
      <div
        className="w-full rounded-lg mb-3 flex items-center justify-between px-3 py-1.5"
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: isLabel ? `${badgeH}mm` : undefined,
          flexShrink: 0,
          backgroundColor: accentColor,
          borderRadius: fullPage ? '4mm' : isLabel ? `${pad / 2}mm` : '8px',
          padding: fullPage ? '6mm 8mm' : isLabel ? `0 ${pad}mm` : forPrint ? `${padMm / 3}mm ${padMm}mm` : '6px 12px',
          marginBottom: fullPage ? '10mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '12px',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: font.label,
            fontFamily: SANS,
            letterSpacing: '0.1em',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {badgeText}
        </span>
        <span
          style={{
            color: '#ffffff',
            ...NUM,
            fontSize: font.shelf,
            fontFamily: MONO,
            letterSpacing: '0.02em',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {category.shelf_number}
        </span>
      </div>
  )

  // QR-en. I liggende layout står den alene til venstre; ellers med
  // infolisten ved siden av seg.
  const qrRowEl = (
      <div
        className="flex items-center justify-center"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: hasInfo && !landscape ? (fullPage ? '10mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '16px') : undefined,
          width: hasInfo && !landscape ? '100%' : undefined,
          height: isLabel ? `${qrSide}mm` : undefined,
          flexShrink: 0,
          margin: fullPage || forPrint ? '0' : '8px 0',
        }}
      >
        <div style={{ flexShrink: 0, width: qrWidth, lineHeight: 0 }}>
          <QRCodeSVG
            value={qrValue}
            size={qrWidth ? 1024 : size}
            bgColor="#ffffff"
            fgColor="#0f0f0f"
            level="M"
            includeMargin={false}
            style={qrWidth ? { width: '100%', height: 'auto', display: 'block' } : undefined}
          />
        </div>
        {!landscape && infoList}
      </div>
  )

  const nameEl = (
      <div
        className="w-full text-center mt-2"
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height: isLabel ? `${nameH}mm` : undefined,
          overflow: 'hidden',
          // Liggende etiketter har ofte luft til overs i navneblokka — da ser
          // det ryddigere ut at teksten står midt i den enn klistret i toppen
          display: landscape ? 'flex' : undefined,
          flexDirection: landscape ? 'column' : undefined,
          justifyContent: landscape ? 'center' : undefined,
          textAlign: landscape ? 'left' : 'center',
          borderTop: landscape ? undefined : `1px solid ${frameColor}22`,
          paddingTop: landscape ? 0 : fullPage ? '8mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '10px',
          marginTop: landscape ? `${gap}mm` : fullPage ? '10mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '8px',
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
            fontFamily: SANS,
            fontWeight: 600,
            color: '#0f0f0f',
            lineHeight: 1.18,
            letterSpacing: '-0.005em',
            // Lange navn brekkes over inntil tre linjer og kuttes med ellipse
            // hvis de fortsatt ikke får plass, i stedet for å velte layouten
            ...(isLabel ? CLAMP(nameLines) : null),
          }}
        >
          {category.name}
        </p>
        {category.description && showDesc && descFontMm > 0.9 && (
          <p
            style={{
              fontSize: font.desc,
              color: '#6f6a63',
              margin: 0,
              lineHeight: 1.25,
              marginTop: fullPage ? '4mm' : isLabel ? `${gap / 2}mm` : '3px',
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
  // etiketter der plassen trengs til navnet, og hele raden faller bort hvis
  // temaet er uten logo.
  const footEl = showFoot && (
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: landscape
            ? 'flex-start'
            : showLogo && showId ? 'space-between' : 'center',
          gap: isLabel ? `${gap}mm` : fullPage ? '5mm' : forPrint ? `${padMm / 2}mm` : '10px',
          width: '100%',
          height: isLabel ? `${footH}mm` : undefined,
          flexShrink: 0,
          overflow: 'hidden',
          // Liggende etikett har ingen strek over bunnraden fra før — uten den
          // flyter logoen og ID-en løst under teksten
          borderTop: landscape ? `0.2mm solid ${frameColor}33` : undefined,
          paddingTop: landscape ? `${gap / 2}mm` : undefined,
          marginTop: fullPage ? '6mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 3}mm` : '8px',
        }}
      >
        {showLogo && (
          // Ordmerket kan krympes/klippes hvis målingen bommer — logoen og
          // ID-en skal aldri presses ut over etikettkanten
          <span style={{
            display: 'flex', alignItems: 'center', minWidth: 0, flexShrink: 1, overflow: 'hidden',
            gap: isLabel ? `${gap * 0.8}mm` : fullPage ? '4mm' : forPrint ? '1.5mm' : '7px',
          }}>
            <HaugeMaskinLogo height={logoHeight} />
            {showWord && (
              <span style={{
                fontSize: font.word,
                fontFamily: SANS,
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: '#0f0f0f',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}>
                {theme.wordmark}
              </span>
            )}
          </span>
        )}
        {showId && (
          <span
            style={{
              ...NUM,
              fontSize: font.id,
              color: '#a8a39c',
              lineHeight: 1.2,
              fontFamily: MONO,
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
            }}
          >
            {category.id.slice(0, 8).toUpperCase()}
          </span>
        )}
      </div>
  )

  const cardStyle: CSSProperties = {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: landscape ? 'row' : 'column',
    alignItems: landscape ? 'center' : 'center',
    justifyContent: fullPage ? 'center' : undefined,
    gap: landscape ? `${gap}mm` : undefined,
    width: fullPage ? '190mm' : forPrint ? `${cardMm}mm` : hasInfo ? '340px' : undefined,
    height: fullPage ? '277mm' : isLabel ? `${h}mm` : undefined,
    overflow: isLabel ? 'hidden' : undefined,
    padding: fullPage ? '14mm' : forPrint ? `${padMm}mm` : '20px',
    backgroundColor: '#ffffff',
    border: `${fullPage ? '4px' : isLabel ? '0.4mm' : '2px'} solid ${frameColor}`,
    borderRadius: fullPage ? '8mm' : isLabel ? `${pad}mm` : forPrint ? '4mm' : '16px',
    fontFamily: SANS,
    pageBreakInside: 'avoid',
  }

  // Liggende etikett: QR til venstre, all tekst i en kolonne til høyre
  if (landscape) {
    return (
      <div className="sticker-card" style={cardStyle}>
        {qrRowEl}
        <div style={{
          display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0,
          height: '100%', justifyContent: 'center', overflow: 'hidden',
        }}>
          {badgeEl}
          {nameEl}
          {infoList}
          {footEl}
        </div>
      </div>
    )
  }

  return (
    <div className="sticker-card" style={cardStyle}>
      {badgeEl}
      {qrRowEl}
      {nameEl}
      {footEl}
    </div>
  )
}
