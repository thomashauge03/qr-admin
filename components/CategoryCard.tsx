'use client'
import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Category, buildQRValue } from '@/types'

const QR_TYPE_LABEL: Record<string, string> = {
  url: 'URL', text: 'Tekst', email: 'E-post', phone: 'Telefon',
  sms: 'SMS', wifi: 'WiFi', location: 'Lokasjon', shop: 'Butikk',
}

interface Props {
  category: Category
  onEdit:   (cat: Category) => void
  onDelete: (id: string)   => void
  onPrint:  (cat: Category) => void
}

export default function CategoryCard({ category, onEdit, onDelete, onPrint }: Props) {
  const accent   = category.color || '#000000'
  const qrValue  = buildQRValue(category)
  const qrType   = category.qr_type || 'shop'

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'default' }}
    >
      {/* Color bar */}
      <div style={{ height: 3, backgroundColor: accent }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-display truncate"
              style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--ink)' }}>
              {category.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="rounded-md px-2 py-0.5"
                style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
                  backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)' }}>
                {category.shelf_number}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                {QR_TYPE_LABEL[qrType] || qrType}
              </span>
            </div>
          </div>

          {/* QR code */}
          <div className="shrink-0 rounded-xl p-2"
            style={{ backgroundColor: 'var(--gray-50)', border: '1px solid var(--border)' }}>
            <QRCodeSVG value={qrValue} size={56} bgColor="transparent" fgColor="#000000" level="M" />
          </div>
        </div>

        {/* Description */}
        {category.description && (
          <p className="mb-4 line-clamp-2"
            style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            {category.description}
          </p>
        )}

        {/* Date */}
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-300)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 12 }}>
          {new Date(category.created_at).toLocaleDateString('no-NO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Action bar */}
      <div className="flex" style={{ borderTop: '1px solid var(--border)' }}>
        {[
          {
            label: 'Print',
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
            fn: () => onPrint(category),
            danger: false,
          },
          {
            label: 'Rediger',
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
            fn: () => onEdit(category),
            danger: false,
          },
          {
            label: 'Slett',
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
            fn: () => onDelete(category.id),
            danger: true,
          },
        ].map((btn, i) => (
          <button key={btn.label} onClick={btn.fn}
            className="flex-1 flex items-center justify-center gap-1.5 transition-colors text-xs font-medium"
            style={{
              minHeight: 44,
              color: btn.danger ? 'var(--danger)' : 'var(--muted)',
              fontFamily: 'Inter, sans-serif',
              borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
              letterSpacing: '0.01em',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = btn.danger ? 'var(--danger-bg)' : 'var(--gray-50)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>
    </div>
  )
}
