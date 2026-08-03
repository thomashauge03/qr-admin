'use client'

import type { CSSProperties } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Category } from '@/types'

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
}

const mmPt = (mm: number) => `${Math.round(mm * 2.8346 * 10) / 10}pt`

// Utskriftstypografi: Inter er langt mer lesbar i småskrift enn display-fonten
// Syne, og monoen har sperret null (0 vs O) for hyllenummer og ID.
const SANS = 'Inter, system-ui, sans-serif'
const MONO = 'JetBrains Mono, ui-monospace, monospace'
const NUM: CSSProperties = { fontVariantNumeric: 'slashed-zero tabular-nums' }

/**
 * Skriftstørrelse i mm som både får plass i høyden og på én linje i bredden.
 * 0.55 er omtrentlig snittbredde per tegn i forhold til skriftstørrelsen.
 */
const fitMm = (heightBudget: number, width: number, text: string, ratio = 0.55) =>
  Math.min(heightBudget, width / (ratio * Math.max(6, text.length)))

export default function StickerCard({
  category, size = 160, forPrint = false, fullPage = false,
  widthMm, heightMm, showBadge = true, overrideColor,
}: Props) {
  const qrValue = JSON.stringify({
    id: category.id,
    name: category.name,
    shelf: category.shelf_number,
  })

  const accentColor = overrideColor || category.color || '#0f0f0f'

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
  const badgeH  = showBadge ? availH * 0.19 : 0
  // Beskrivelse og ID får bare plass på de større etikettene
  const showDesc = isLabel ? h >= 50 : true
  const showId   = isLabel ? h >= 70 : true
  const nameH   = availH * (showDesc ? 0.28 : 0.2)
  const idH     = showId ? availH * 0.08 : 0
  const qrBudget = availH - badgeH - nameH - idH - gap * (showBadge ? 3 : 2)
  const qrSide  = Math.max(4, Math.min(qrBudget, hasInfo ? availW * 0.42 : availW))
  const infoColW = Math.max(1, availW - qrSide - gap)
  const longestInfoValue = infoLines.reduce((a, l) => (l.value.length > a.length ? l.value : a), '')

  // Navnet får plassen det trenger; beskrivelsen får det som er igjen i navneblokka
  const nameFontMm = fitMm(nameH * (showDesc ? 0.38 : 0.5), availW, category.name)
  const descBudget = nameH - gap - nameFontMm * 1.3 - gap / 2
  const descFontMm = Math.max(0, Math.min(descBudget / 1.35, fitMm(nameH * 0.26, availW, category.description || '')))

  // ── Fri modus (enkelt klistremerke uten fast høyde)
  const baseMm = w
  const cardMm = hasInfo && !isLabel ? Math.round(baseMm * 1.5) : baseMm
  const k = cardMm / 60
  const pt = (base: number) => `${Math.round(base * k * 10) / 10}pt`
  const padFree = Math.max(1.5, Math.round(6 * k * 10) / 10)
  const innerFree = cardMm - padFree * 2

  const padMm = isLabel ? pad : padFree

  const font = fullPage
    ? { label: '16pt', shelf: '30pt', name: '34pt', desc: '13pt', id: '10pt', infoLabel: '11pt', infoValue: '17pt' }
    : isLabel
    ? {
        label:     mmPt(Math.min(badgeH * 0.34, availW * 0.06)),
        shelf:     mmPt(fitMm(badgeH * 0.5, availW * 0.5, category.shelf_number)),
        name:      mmPt(nameFontMm),
        desc:      mmPt(descFontMm),
        id:        mmPt(Math.min(idH * 0.6, availW * 0.05)),
        infoLabel: mmPt(Math.min(qrSide * 0.11, infoColW * 0.12)),
        infoValue: mmPt(fitMm(qrSide * 0.17, infoColW, longestInfoValue)),
      }
    : forPrint
    ? { label: pt(7), shelf: pt(9), name: pt(10), desc: pt(7), id: pt(6), infoLabel: pt(5), infoValue: pt(7.5) }
    : { label: '10px', shelf: '13px', name: '14px', desc: '10px', id: '9px', infoLabel: '8px', infoValue: '12px' }

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
        flex: 1,
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

  return (
    <div
      className="sticker-card flex flex-col items-center"
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: fullPage ? 'center' : undefined,
        width: fullPage ? '190mm' : forPrint ? `${cardMm}mm` : hasInfo ? '340px' : undefined,
        height: fullPage ? '277mm' : isLabel ? `${h}mm` : undefined,
        overflow: isLabel ? 'hidden' : undefined,
        padding: fullPage ? '14mm' : forPrint ? `${padMm}mm` : '20px',
        backgroundColor: '#ffffff',
        border: `${fullPage ? '4px' : isLabel ? '0.4mm' : '2px'} solid ${accentColor}`,
        borderRadius: fullPage ? '8mm' : isLabel ? `${pad}mm` : forPrint ? '4mm' : '16px',
        fontFamily: SANS,
        pageBreakInside: 'avoid',
      }}
    >
      {/* Hylle-badge øverst */}
      {showBadge && (
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
          HYLLE
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
      )}

      {/* QR + infoliste side ved side */}
      <div
        className="flex items-center justify-center"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: hasInfo ? (fullPage ? '10mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '16px') : undefined,
          width: hasInfo ? '100%' : undefined,
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
        {infoList}
      </div>

      {/* Navn */}
      <div
        className="w-full text-center mt-2"
        style={{
          boxSizing: 'border-box',
          width: '100%',
          height: isLabel ? `${nameH}mm` : undefined,
          overflow: 'hidden',
          textAlign: 'center',
          borderTop: `1px solid ${accentColor}22`,
          paddingTop: fullPage ? '8mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '10px',
          marginTop: fullPage ? '10mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 2}mm` : '8px',
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

      {/* ID nederst — droppes på små etiketter der plassen trengs til navnet */}
      {showId && (
      <p
        style={{
          ...NUM,
          fontSize: font.id,
          color: '#a8a39c',
          margin: 0,
          lineHeight: 1.2,
          height: isLabel ? `${idH}mm` : undefined,
          marginTop: fullPage ? '6mm' : isLabel ? `${gap}mm` : forPrint ? `${padMm / 3}mm` : '8px',
          fontFamily: MONO,
          letterSpacing: '0.03em',
        }}
      >
        {category.id.slice(0, 8).toUpperCase()}
      </p>
      )}
    </div>
  )
}
