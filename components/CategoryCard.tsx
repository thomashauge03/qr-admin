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
  const accent  = category.color || '#000000'
  const qrValue = buildQRValue(category)
  const qrType  = category.qr_type || 'shop'

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ height: 4, backgroundColor: accent }} />

      <div style={{ padding: '14px 14px 10px' }}>
        <div className="flex items-start gap-3">
          {/* QR */}
          <div className="shrink-0 rounded-xl p-2"
            style={{ backgroundColor: 'var(--gray-50)', border: '1px solid var(--border)' }}>
            <QRCodeSVG value={qrValue} size={72} bgColor="transparent" fgColor="#000" level="M" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-display"
              style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, color: 'var(--ink)', wordBreak: 'break-word' }}>
              {category.name}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="rounded-md px-2 py-0.5"
                style={{ fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace',
                  backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)' }}>
                {category.shelf_number}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}>
                {QR_TYPE_LABEL[qrType] || qrType}
              </span>
            </div>
            {category.description && (
              <p className="mt-1.5 line-clamp-2"
                style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.45 }}>
                {category.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex" style={{ borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'Print',   fn: () => onPrint(category), danger: false,
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> },
          { label: 'Rediger', fn: () => onEdit(category),  danger: false,
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
          { label: 'Slett',   fn: () => onDelete(category.id), danger: true,
            icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg> },
        ].map((btn, i) => (
          <button key={btn.label} onClick={btn.fn}
            className="flex-1 flex items-center justify-center gap-1.5 font-medium active:opacity-60"
            style={{
              minHeight: 48,
              fontSize: '0.82rem',
              color: btn.danger ? 'var(--danger)' : 'var(--muted)',
              borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
            }}>
            {btn.icon}
            <span>{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
