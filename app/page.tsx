'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Category, CategoryInsert } from '@/types'
import CategoryCard from '@/components/CategoryCard'
import CategoryForm from '@/components/CategoryForm'
import PrintModal from '@/components/PrintModal'
import PrintAllModal from '@/components/PrintAllModal'

type View = 'grid' | 'list'
type SortKey = 'name' | 'shelf_number' | 'created_at'

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('grid')
  const [sort, setSort] = useState<SortKey>('created_at')
  const [showForm, setShowForm] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [printCategory, setPrintCategory] = useState<Category | null>(null)
  const [showPrintAll, setShowPrintAll] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setCategories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const handleSave = async (data: CategoryInsert) => {
    if (editCategory) {
      const { error } = await supabase.from('categories').update(data).eq('id', editCategory.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('categories').insert([data])
      if (error) throw error
    }
    await fetchCategories()
    setEditCategory(null)
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) { setDeleteConfirm(id); return }
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setCategories(prev => prev.filter(c => c.id !== id))
    setDeleteConfirm(null)
  }

  const handleEdit = (cat: Category) => { setEditCategory(cat); setShowForm(true) }

  const filtered = categories
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.shelf_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'created_at') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return a[sort].localeCompare(b[sort])
    })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--paper)' }}>
      <header className="no-print sticky top-0 z-40" style={{ backgroundColor: 'var(--paper)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(8px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div className="flex items-center justify-between" style={{ height: 64 }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 36, height: 36, backgroundColor: 'var(--ink)' }}>
                <span style={{ fontSize: 18, color: 'var(--paper)' }}>▦</span>
              </div>
              <div>
                <h1 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  QR Admin
                </h1>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>
                  BUTIKKSTYRING
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {categories.length > 0 && (
                <button
                  onClick={() => setShowPrintAll(true)}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition-all hover:opacity-70 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--paper-dark)', color: 'var(--ink)', border: '1px solid var(--border)', fontFamily: 'DM Mono, monospace', fontSize: '0.75rem' }}
                >
                  🖨 Print alle
                </button>
              )}
              <button
                onClick={() => { setEditCategory(null); setShowForm(true) }}
                className="rounded-xl px-5 py-2 text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: 'var(--accent)', color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.875rem' }}
              >
                + Ny kategori
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div className="flex gap-4 mb-8 stagger">
          {[
            { label: 'Totalt', value: categories.length, icon: '▦' },
            { label: 'Søkeresultat', value: filtered.length, icon: '◎' },
            { label: 'Uten beskrivelse', value: categories.filter(c => !c.description).length, icon: '○' },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '1.25rem', opacity: 0.4 }}>{stat.icon}</span>
              <div>
                <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em', marginTop: 2 }}>{stat.label.toUpperCase()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-6 flex-wrap items-center no-print">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søk i kategorier og hyllenummer..."
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none transition-all"
            style={{ minWidth: 200, backgroundColor: 'var(--card)', border: '1.5px solid var(--border)', color: 'var(--ink)' }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
            style={{ backgroundColor: 'var(--card)', border: '1.5px solid var(--border)', color: 'var(--ink)', fontFamily: 'DM Mono, monospace', fontSize: '0.75rem' }}
          >
            <option value="created_at">Sorter: Nyeste</option>
            <option value="name">Sorter: Navn A–Å</option>
            <option value="shelf_number">Sorter: Hyllenummer</option>
          </select>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--border)' }}>
            {(['grid', 'list'] as View[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-4 py-2.5 text-sm transition-all"
                style={{
                  backgroundColor: view === v ? 'var(--ink)' : 'var(--card)',
                  color: view === v ? 'var(--paper)' : 'var(--muted)',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.75rem',
                  letterSpacing: '0.04em',
                }}
              >
                {v === 'grid' ? '▦ GRID' : '☰ LISTE'}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl px-5 py-4" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
            <strong>Feil:</strong> {error}
            <button onClick={fetchCategories} className="ml-3 underline text-sm">Prøv igjen</button>
          </div>
        )}

        {loading && (
          <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
            <p className="font-display text-lg" style={{ fontWeight: 700 }}>Laster kategorier...</p>
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-24 animate-fade-up">
            <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.15 }}>▦</div>
            <h2 className="font-display text-2xl mb-2" style={{ fontWeight: 700 }}>Ingen kategorier ennå</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Kom i gang ved å opprette din første kategori</p>
            <button
              onClick={() => { setEditCategory(null); setShowForm(true) }}
              className="rounded-xl px-6 py-3 font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}
            >
              + Opprett første kategori
            </button>
          </div>
        )}

        {!loading && categories.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
            <p className="font-display text-lg" style={{ fontWeight: 700 }}>Ingen treff for &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch('')} className="mt-3 text-sm underline">Tøm søk</button>
          </div>
        )}

        {!loading && filtered.length > 0 && view === 'grid' && (
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(cat => (
              <div key={cat.id} style={{ position: 'relative' }}>
                <CategoryCard category={cat} onEdit={handleEdit} onDelete={handleDelete} onPrint={setPrintCategory} />
                {deleteConfirm === cat.id && (
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(232,78,42,0.96)', zIndex: 10 }}>
                    <div className="text-center px-4">
                      <p style={{ color: '#fff', fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12 }}>Slette {cat.name}?</p>
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-4 py-2 text-sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>Avbryt</button>
                        <button onClick={() => handleDelete(cat.id)} className="rounded-lg px-4 py-2 text-sm font-bold" style={{ backgroundColor: '#fff', color: 'var(--accent)' }}>Ja, slett</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && view === 'list' && (
          <div className="stagger rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {filtered.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-4 px-5 py-4 transition-all hover:opacity-80" style={{ backgroundColor: 'var(--card)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div className="w-1 self-stretch rounded-full" style={{ backgroundColor: cat.color || 'var(--muted)' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-display truncate" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{cat.name}</p>
                  {cat.description && <p className="truncate text-sm" style={{ color: 'var(--muted)' }}>{cat.description}</p>}
                </div>
                <span className="shrink-0 px-3 py-1 rounded-full text-xs" style={{ backgroundColor: `${cat.color || 'var(--ink)'}18`, color: cat.color || 'var(--ink)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.05em' }}>
                  {cat.shelf_number}
                </span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setPrintCategory(cat)} className="rounded-lg px-3 py-1.5 text-xs transition-all hover:opacity-60" style={{ backgroundColor: 'var(--paper)', color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>🖨</button>
                  <button onClick={() => handleEdit(cat)} className="rounded-lg px-3 py-1.5 text-xs transition-all hover:opacity-60" style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)', fontFamily: 'DM Mono, monospace' }}>✏</button>
                  <button onClick={() => handleDelete(cat.id)} className="rounded-lg px-3 py-1.5 text-xs transition-all hover:opacity-60" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', fontFamily: 'DM Mono, monospace' }}>
                    {deleteConfirm === cat.id ? 'Sikker? ✕' : '✕'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <CategoryForm category={editCategory} onSave={handleSave} onClose={() => { setShowForm(false); setEditCategory(null) }} />
      )}
      {printCategory && (
        <PrintModal category={printCategory} onClose={() => setPrintCategory(null)} />
      )}
      {showPrintAll && (
        <PrintAllModal categories={filtered} onClose={() => setShowPrintAll(false)} />
      )}
    </div>
  )
}
