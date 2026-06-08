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
    <div className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div style={{ height: 4, backgroundColor: accent }} />

      {/* Clickable top area */}
      <button onClick={onClick} className="w-full text-left active:opacity-70"
        style={{ padding: '16px 16px 14px' }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 48, height: 48, backgroundColor: accent + '18' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-display"
                style={{ fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.3 }}>
                {folder.name}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>
                {count} {count === 1 ? 'QR-kode' : 'QR-koder'}
              </p>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </button>

      {/* Actions */}
      <div className="flex" style={{ borderTop: '1px solid var(--border)' }}>
        {[
          { label: 'Rediger', fn: () => onEdit(folder), danger: false,
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> },
          { label: 'Slett',   fn: () => onDelete(folder.id), danger: true,
            icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg> },
        ].map((btn, i) => (
          <button key={btn.label} onClick={btn.fn}
            className="flex-1 flex items-center justify-center gap-2 font-medium active:opacity-60"
            style={{
              minHeight: 52,
              fontSize: '0.85rem',
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
