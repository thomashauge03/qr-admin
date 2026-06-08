'use client'
import React, { useState, useEffect } from 'react'
import { Folder, FolderInsert } from '@/types'

const COLORS = [
  '#000000','#ef4444','#f97316','#eab308','#22c55e',
  '#06b6d4','#3b82f6','#8b5cf6','#ec4899','#6b7280',
]

interface Props {
  folder?: Folder | null
  onSave: (data: FolderInsert) => Promise<void>
  onClose: () => void
}

export default function FolderForm({ folder, onSave, onClose }: Props) {
  const [name,    setName]    = useState(folder?.name || '')
  const [color,   setColor]   = useState(folder?.color || '#000000')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Navn er påkrevd'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), color })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className="w-full max-w-md rounded-2xl anim-scale-in"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="font-display" style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            {folder ? 'Rediger mappe' : 'Ny mappe'}
          </h2>
          <button onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ width: 32, height: 32, color: 'var(--muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Navn */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
              Mappenavn
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="f.eks. Sportsutstyr"
              autoFocus
              style={{ borderRadius: 10 }}
            />
          </div>

          {/* Farge */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink)', display: 'block', marginBottom: 8 }}>
              Farge
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="rounded-full transition-transform hover:scale-110"
                  style={{
                    width: 32, height: 32,
                    backgroundColor: c,
                    border: color === c ? '3px solid var(--ink)' : '2px solid transparent',
                    outline: color === c ? '2px solid white' : 'none',
                    outlineOffset: -4,
                  }} />
              ))}
              <label className="rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                style={{ width: 32, height: 32, border: '2px dashed var(--border)', position: 'relative' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ backgroundColor: 'var(--gray-50)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-center rounded-lg"
              style={{ width: 36, height: 36, backgroundColor: color + '18' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span className="font-display" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)' }}>
              {name || 'Mappenavn'}
            </span>
          </div>

          {error && (
            <p style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-xl py-3 font-medium transition-all hover:bg-gray-100"
              style={{ fontSize: '0.875rem', color: 'var(--muted)', border: '1px solid var(--border)' }}>
              Avbryt
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-xl py-3 font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--black)', color: 'var(--white)', fontSize: '0.875rem', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Lagrer...' : folder ? 'Lagre endringer' : 'Opprett mappe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
