'use client'

import type { CSSProperties } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Category, buildQRValue } from '@/types'
import { LabelThemeId, getTheme } from '@/lib/labelTheme'
import HaugeMaskinLogo from './HaugeMaskinLogo'

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

// Teksten foran nummeret i badgen. Kortes ned på smale etiketter, ellers
// presser den nummeret ut av feltet.
const BADGE_TEXT = 'UTSTYR NUMMER'
const BADGE_TEXT_SHORT = 'UTSTYR NR'

// Bredde/høyde på HM-logoen — brukes til å regne ut hvor mye plass den tar
const LOGO_RATIO = 256 / 152

/**
 * Skriftstørrelse i mm som både får plass i høyden og på én linje i bredden.
 * `ratio` er snittbredden per tegn delt på skriftstørrelsen — målt i nettleser:
 * 0.55 for Inter i blandet skrift, 0.79 for versaler med sperring, 0.62 for
 * JetBrains Mono.
 */
const fitMm = (heightBudget: number, width: number, text: string, ratio = 0.55) =>
  Math.min(heightBudget, width / (ratio * Math.max(6, text.length)))

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
  const footH  = showFoot ? availH * ((landscape ? 0.09 : 0.08) + (showLogo ? 0.03 : 0)) : 0

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

  // Navnet får plassen det trenger; beskrivelsen får det som er igjen i navneblokka
  const nameFontMm = fitMm(nameH * (showDesc ? 0.38 : 0.5), textW, category.name)
  const descBudget = nameH - gap - nameFontMm * 1.3 - gap / 2
  const descFontMm = Math.max(0, Math.min(descBudget / 1.35, fitMm(nameH * 0.26, textW, category.description || '')))

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

  // Logoen på etikettark: så høy bunnraden tillater, men aldri bredere enn en
  // femtedel av etiketten — resten av raden skal være til navnetekst/ID.
  const logoMm  = Math.min(footH * 0.85, textW * 0.2 / LOGO_RATIO)
  const wordMm  = fitMm(footH * 0.42, textW * 0.42, theme.wordmark || '', 0.68)
  // Ordmerket droppes når etiketten er for smal til at det blir lesbart
  const showWord = !!theme.wordmark && (!isLabel || (textW >= 45 && wordMm >= 1.4))

  const font = fullPage
    ? { label: '16pt', shelf: '30pt', name: '34pt', desc: '13pt', id: '10pt', infoLabel: '11pt', infoValue: '17pt', word: '12pt' }
    : isLabel
    ? {
        // Teksten og nummeret deler badgens bredde — begge må begrenses av den
        label:     mmPt(fitMm(badgeH * 0.34, badgeInnerW * 0.52, badgeText, 0.79)),
        shelf:     mmPt(fitMm(badgeH * 0.5, badgeInnerW * 0.44, category.shelf_number, 0.63)),
        name:      mmPt(nameFontMm),
        desc:      mmPt(descFontMm),
        id:        mmPt(Math.min(footH * 0.5, textW * 0.05)),
        infoLabel: mmPt(Math.min(infoLineContent * 0.3, infoColW * 0.12)),
        infoValue: mmPt(fitMm(infoLineContent * 0.48, infoColW, longestInfoValue)),
        word:      mmPt(wordMm),
      }
    : forPrint
    ? { label: pt(7), shelf: pt(9), name: pt(10), desc: pt(7), id: pt(6), infoLabel: pt(5), infoValue: pt(7.5), word: pt(5.5) }
    : { label: '10px', shelf: '13px', name: '14px', desc: '10px', id: '9px', infoLabel: '8px', infoValue: '12px', word: '9px' }

  // Høyde på logoen i hver modus
  const logoHeight = fullPage
    ? '13mm'
    : isLabel
    ? `${Math.round(logoMm * 100) / 100}mm`
    : forPrint
    ? `${Math.round(Math.max(2.5, innerFree * 0.09) * 10) / 10}mm`
    : '16px'

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
            borderBottom: `1px solid ${accentColor}22`,
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
          textAlign: landscape ? 'left' : 'center',
          borderTop: landscape ? undefined : `1px solid ${accentColor}22`,
          paddingTop: landscape ? 0 : fullPage ? '8mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '10px',
          marginTop: landscape ? `${gap}mm` : fullPage ? '10mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '8px',
        }}
      >
        <p
          style={{
            ...NUM,
            margin: 0,
            fontSize: font.name,
            fontFamily: SANS,
            fontWeight: 600,
            color: '#0f0f0f',
            lineHeight: 1.2,
            letterSpacing: '-0.005em',
          }}
        >
          {category.name}
        </p>
        {category.description && showDesc && (
          <p
            style={{
              fontSize: font.desc,
              color: '#6f6a63',
              margin: 0,
              lineHeight: 1.25,
              marginTop: fullPage ? '4mm' : isLabel ? `${gap / 2}mm` : '3px',
              fontFamily: SANS,
              fontWeight: 400,
            }}
          >
            {category.description}
          </p>
        )}
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
          marginTop: fullPage ? '6mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 3}mm` : '8px',
        }}
      >
        {showLogo && (
          <span style={{
            display: 'flex', alignItems: 'center', minWidth: 0, flexShrink: 0,
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
    border: `${fullPage ? '4px' : isLabel ? '0.4mm' : '2px'} solid ${accentColor}`,
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
