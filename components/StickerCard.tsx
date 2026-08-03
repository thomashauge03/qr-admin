'use client'

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
  /** Vis hylle-feltet øverst */
  showBadge?: boolean
  /** Overstyrer fargen som er lagret på QR-koden */
  overrideColor?: string | null
}

export default function StickerCard({
  category, size = 160, forPrint = false, fullPage = false,
  widthMm, showBadge = true, overrideColor,
}: Props) {
  const qrValue = JSON.stringify({
    id: category.id,
    name: category.name,
    shelf: category.shelf_number,
  })

  const accentColor = overrideColor || category.color || '#0f0f0f'

  const infoLines = (category.info_lines || []).filter(l => l.label || l.value)
  const hasInfo = infoLines.length > 0

  // Bredde: infolisten trenger mer plass ved siden av QR-koden
  const baseMm = widthMm ?? 60
  const cardMm = hasInfo ? Math.round(baseMm * 1.5) : baseMm
  // Typografien skaleres med bredden, slik at 45mm og 90mm begge blir lesbare
  const k = cardMm / 60
  const pt = (base: number) => `${Math.round(base * k * 10) / 10}pt`

  const font = fullPage
    ? { label: '16pt', shelf: '30pt', name: '34pt', desc: '13pt', id: '10pt', infoLabel: '11pt', infoValue: '17pt' }
    : forPrint
    ? { label: pt(7), shelf: pt(9), name: pt(10), desc: pt(7), id: pt(6), infoLabel: pt(5), infoValue: pt(7.5) }
    : { label: '10px', shelf: '13px', name: '14px', desc: '10px', id: '9px', infoLabel: '8px', infoValue: '12px' }

  const printWidth = `${cardMm}mm`
  // QR-en er kvadratisk og styres av bredden på venstre kolonne.
  // Ved utskrift: kortbredde minus padding, halvert når infolisten står ved siden av.
  const innerMm = cardMm - 12
  const qrWidth = fullPage
    ? (hasInfo ? '105mm' : '145mm')
    : forPrint
    ? `${hasInfo ? Math.round((innerMm - 4) * 0.52) : innerMm}mm`
    : undefined

  const infoList = hasInfo && (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: fullPage ? '6mm' : forPrint ? '2mm' : '10px',
        flex: 1,
        minWidth: 0,
        textAlign: 'left',
      }}
    >
      {infoLines.map((line, i) => (
        <div
          key={i}
          style={{
            borderBottom: `1px solid ${accentColor}22`,
            paddingBottom: fullPage ? '3mm' : forPrint ? '1mm' : '6px',
          }}
        >
          {line.label && (
            <div
              style={{
                fontSize: font.infoLabel,
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '0.08em',
                color: '#8a857d',
                textTransform: 'uppercase',
                lineHeight: 1.3,
              }}
            >
              {line.label}
            </div>
          )}
          {line.value && (
            <div
              style={{
                fontSize: font.infoValue,
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                color: '#0f0f0f',
                lineHeight: 1.25,
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: fullPage ? 'center' : undefined,
        width: fullPage ? '190mm' : forPrint ? printWidth : hasInfo ? '340px' : undefined,
        height: fullPage ? '277mm' : undefined,
        padding: fullPage ? '14mm' : forPrint ? '6mm' : '20px',
        backgroundColor: '#ffffff',
        border: `${fullPage ? '4px' : '2px'} solid ${accentColor}`,
        borderRadius: fullPage ? '8mm' : forPrint ? '4mm' : '16px',
        fontFamily: 'Syne, sans-serif',
        pageBreakInside: 'avoid',
      }}
    >
      {/* Hylle-badge øverst */}
      {showBadge && (
      <div
        className="w-full rounded-lg mb-3 flex items-center justify-between px-3 py-1.5"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          backgroundColor: accentColor,
          borderRadius: fullPage ? '4mm' : '8px',
          padding: fullPage ? '6mm 8mm' : '6px 12px',
          marginBottom: fullPage ? '10mm' : '12px',
        }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: font.label,
            fontFamily: 'DM Mono, monospace',
            letterSpacing: '0.08em',
            fontWeight: 500,
          }}
        >
          HYLLE
        </span>
        <span
          style={{
            color: '#ffffff',
            fontSize: font.shelf,
            fontFamily: 'DM Mono, monospace',
            letterSpacing: '0.06em',
            fontWeight: 500,
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
          gap: hasInfo ? (fullPage ? '10mm' : forPrint ? '4mm' : '16px') : undefined,
          width: hasInfo ? '100%' : undefined,
          margin: fullPage ? '0' : '8px 0',
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

      {/* Category name */}
      <div
        className="w-full text-center mt-2"
        style={{
          width: '100%',
          textAlign: 'center',
          borderTop: `1px solid ${accentColor}22`,
          paddingTop: fullPage ? '8mm' : '10px',
          marginTop: fullPage ? '10mm' : '8px',
        }}
      >
        <p
          style={{
            fontSize: font.name,
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            color: '#0f0f0f',
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
          }}
        >
          {category.name}
        </p>
        {category.description && (
          <p
            style={{
              fontSize: font.desc,
              color: '#8a857d',
              marginTop: fullPage ? '4mm' : '3px',
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 300,
            }}
          >
            {category.description}
          </p>
        )}
      </div>

      {/* ID footer */}
      <p
        style={{
          fontSize: font.id,
          color: '#c0bbb3',
          marginTop: fullPage ? '6mm' : '8px',
          fontFamily: 'DM Mono, monospace',
          letterSpacing: '0.05em',
        }}
      >
        {category.id.slice(0, 8).toUpperCase()}
      </p>
    </div>
  )
}
