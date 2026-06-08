'use client'
import { QRCodeSVG } from 'qrcode.react'
import { Category, buildQRValue } from '@/types'

interface Props {
  category: Category
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
  onPrint: (cat: Category) => void
}

export default function CategoryCard({ category, onEdit, onDelete, onPrint }: Props) {
  const accent = category.color || '#0f0f0f'
  const qrValue = buildQRValue(category)

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderTop: `4px solid ${accent}`,
      }}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className="font-display truncate"
              style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ink)' }}
            >
              {category.name}
            </h3>
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${accent}18`,
                color: accent,
                fontSize: '0.7rem',
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '0.06em',
                fontWeight: 500,
              }}
            >
              HYLLE {category.shelf_number}
            </span>
          </div>
          {/* Mini QR */}
          <div className="shrink-0 rounded-xl p-1.5" style={{ backgroundColor: 'var(--paper)', border: '1px solid var(--border)' }}>
            <QRCodeSVG value={qrValue} size={52} bgColor="transparent" fgColor="#0f0f0f" level="M" />
          </div>
        </div>

        {category.description && (
          <p
            className="mt-2 line-clamp-2"
            style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}
          >
            {category.description}
          </p>
        )}
      </div>

      {/* Date */}
      <div className="px-5 pb-3">
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
          {new Date(category.created_at).toLocaleDateString('no-NO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Actions */}
      <div className="flex border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => onPrint(category)}
          className="flex-1 py-3 text-xs font-medium transition-all hover:opacity-60 flex items-center justify-center gap-1.5"
          style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}
        >
          🖨 PRINT
        </button>
        <div style={{ width: 1, backgroundColor: 'var(--border)' }} />
        <button
          onClick={() => onEdit(category)}
          className="flex-1 py-3 text-xs font-medium transition-all hover:opacity-60 flex items-center justify-center gap-1.5"
          style={{ color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}
        >
          ✏ REDIGER
        </button>
        <div style={{ width: 1, backgroundColor: 'var(--border)' }} />
        <button
          onClick={() => onDelete(category.id)}
          className="flex-1 py-3 text-xs font-medium transition-all hover:opacity-60 flex items-center justify-center gap-1.5"
          style={{ color: '#e84e2a', fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em' }}
        >
          ✕ SLETT
        </button>
      </div>
    </div>
  )
}
