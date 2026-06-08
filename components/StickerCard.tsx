'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Category } from '@/types'

interface Props {
  category: Category
  size?: number
  forPrint?: boolean
}

export default function StickerCard({ category, size = 160, forPrint = false }: Props) {
  const qrValue = JSON.stringify({
    id: category.id,
    name: category.name,
    shelf: category.shelf_number,
  })

  const accentColor = category.color || '#0f0f0f'

  return (
    <div
      className="sticker-card flex flex-col items-center"
      style={{
        width: forPrint ? '60mm' : undefined,
        padding: forPrint ? '6mm' : '20px',
        backgroundColor: '#ffffff',
        border: `2px solid ${accentColor}`,
        borderRadius: forPrint ? '4mm' : '16px',
        fontFamily: 'Syne, sans-serif',
        pageBreakInside: 'avoid',
      }}
    >
      {/* Top bar */}
      <div
        className="w-full rounded-lg mb-3 flex items-center justify-between px-3 py-1.5"
        style={{ backgroundColor: accentColor }}
      >
        <span
          style={{
            color: '#ffffff',
            fontSize: forPrint ? '7pt' : '10px',
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
            fontSize: forPrint ? '9pt' : '13px',
            fontFamily: 'DM Mono, monospace',
            letterSpacing: '0.06em',
            fontWeight: 500,
          }}
        >
          {category.shelf_number}
        </span>
      </div>

      {/* QR Code */}
      <div className="flex items-center justify-center" style={{ margin: '8px 0' }}>
        <QRCodeSVG
          value={qrValue}
          size={size}
          bgColor="#ffffff"
          fgColor="#0f0f0f"
          level="M"
          includeMargin={false}
        />
      </div>

      {/* Category name */}
      <div className="w-full text-center mt-2" style={{ borderTop: `1px solid ${accentColor}22`, paddingTop: '10px' }}>
        <p
          style={{
            fontSize: forPrint ? '10pt' : '14px',
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
              fontSize: forPrint ? '7pt' : '10px',
              color: '#8a857d',
              marginTop: '3px',
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
          fontSize: forPrint ? '6pt' : '9px',
          color: '#c0bbb3',
          marginTop: '8px',
          fontFamily: 'DM Mono, monospace',
          letterSpacing: '0.05em',
        }}
      >
        {category.id.slice(0, 8).toUpperCase()}
      </p>
    </div>
  )
}
