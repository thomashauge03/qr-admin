'use client'
import React from 'react'
import { Folder } from '@/types'

interface Props {
  folder: Folder
  count: number
  onClick: () => void
  onEdit: (f: Folder) => void
  onDelete: (id: string) => void
}

export default function FolderCard({ folder, count, onClick, onEdit, onDelete }: Props) {
  const accent = folder.color || '#000000'

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
    >
      {/* Color bar */}
      <div style={{ height: 4, backgroundColor: accent }} />

      <div className="p-5">
        {/* Icon + name */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, backgroundColor: accent + '18', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-display"
                style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--ink)' }}>
                {folder.name}
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 3 }}>
                {count} {count === 1 ? 'QR-kode' : 'QR-koder'}
              </p>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 4 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        {/* Date */}
        <p style={{ fontSize: '0.72rem', color: 'var(--gray-300)', fontFamily: 'JetBrains Mono, monospace' }}>
          {new Date(folder.created_at).toLocaleDateString('no-NO', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {/* Action bar */}
      <div className="flex" style={{ borderTop: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>
        {[
          {
            label: 'Rediger',
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
            fn: () => onEdit(folder),
            danger: false,
          },
          {
            label: 'Slett',
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
            fn: () => onDelete(folder.id),
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
