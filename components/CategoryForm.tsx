'use client'
import { useState, useEffect } from 'react'
import { Category, CategoryInsert } from '@/types'

const PRESET_COLORS = [
  '#e84e2a', '#2a7a4b', '#2a4a7a', '#7a2a6a',
  '#7a6a2a', '#2a6a7a', '#4a2a7a', '#7a3a2a',
]

interface Props {
  category?: Category | null
  onSave: (data: CategoryInsert) => Promise<void>
  onClose: () => void
}

export default function CategoryForm({ category, onSave, onClose }: Props) {
  const [form, setForm] = useState<CategoryInsert>({
    name: '',
    shelf_number: '',
    description: '',
    color: PRESET_COLORS[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        shelf_number: category.shelf_number,
        description: category.description || '',
        color: category.color || PRESET_COLORS[0],
      })
    }
  }, [category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.shelf_number.trim()) {
      setError('Navn og hyllenummer er påkrevd')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,15,15,0.6)' }}>
      <div className="animate-fade-up w-full max-w-md rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-700" style={{ fontWeight: 700 }}>
            {category ? 'Rediger kategori' : 'Ny kategori'}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '4px' }}>
            {category ? `Oppdaterer: ${category.name}` : 'Legg til en ny kategori i systemet'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--muted)' }}>
              KATEGORINAVN *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="f.eks. Sportsutstyr"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ backgroundColor: 'var(--paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'DM Sans, sans-serif' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--muted)' }}>
              HYLLENUMMER *
            </label>
            <input
              type="text"
              value={form.shelf_number}
              onChange={e => setForm(p => ({ ...p, shelf_number: e.target.value }))}
              placeholder="f.eks. A-12 eller 042"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{ backgroundColor: 'var(--paper)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--muted)' }}>
              BESKRIVELSE
            </label>
            <textarea
              value={form.description || ''}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Valgfri beskrivelse av kategorien..."
              rows={3}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
              style={{ backgroundColor: 'var(--paper)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.05em', color: 'var(--muted)' }}>
              FARGE
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, color: c }))}
                  className="rounded-full transition-transform hover:scale-110"
                  style={{
                    width: 28, height: 28,
                    backgroundColor: c,
                    outline: form.color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: 2,
                    transform: form.color === c ? 'scale(1.15)' : undefined,
                  }}
                />
              ))}
              <input
                type="color"
                value={form.color || '#000000'}
                onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                className="rounded-full cursor-pointer border-0"
                style={{ width: 28, height: 28, padding: 2, backgroundColor: 'transparent' }}
                title="Egendefinert farge"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm rounded-lg px-4 py-2" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-70"
              style={{ backgroundColor: 'var(--paper-dark)', color: 'var(--ink)' }}
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}
            >
              {loading ? 'Lagrer...' : category ? 'Oppdater' : 'Opprett'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
