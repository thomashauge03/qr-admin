'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isAllowed } from '@/lib/auth'
import { Category, CategoryInsert } from '@/types'
import CategoryCard from '@/components/CategoryCard'
import CategoryForm from '@/components/CategoryForm'
import PrintModal from '@/components/PrintModal'
import PrintAllModal from '@/components/PrintAllModal'

type View    = 'grid' | 'list'
type SortKey = 'name' | 'shelf_number' | 'created_at'

export default function HomePage() {
  const router = useRouter()
  const [userEmail,     setUserEmail]     = useState<string | null>(null)
  const [authLoading,   setAuthLoading]   = useState(true)
  const [categories,    setCategories]    = useState<Category[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState('')
  const [search,        setSearch]        = useState('')
  const [view,          setView]          = useState<View>('grid')
  const [sort,          setSort]          = useState<SortKey>('created_at')
  const [showForm,      setShowForm]      = useState(false)
  const [editCategory,  setEditCategory]  = useState<Category | null>(null)
  const [printCategory, setPrintCategory] = useState<Category | null>(null)
  const [showPrintAll,  setShowPrintAll]  = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Auth-sjekk
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email
      if (!session) {
        router.replace('/login')
      } else if (!isAllowed(email)) {
        supabase.auth.signOut()
        router.replace('/login?error=unauthorized')
      } else {
        setUserEmail(email ?? null)
        setAuthLoading(false)
      }
    })
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4"
            style={{ width: 48, height: 48, backgroundColor: 'var(--black)' }}>
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="white"/>
              <rect x="11" y="1" width="6" height="6" rx="1" fill="white"/>
              <rect x="1" y="11" width="6" height="6" rx="1" fill="white"/>
              <rect x="11" y="11" width="3" height="3" rx="0.5" fill="white"/>
            </svg>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Sjekker tilgang...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <header className="no-print sticky top-0 z-40"
        style={{ backgroundColor: 'var(--black)', borderBottom: '1px solid #1f1f1f' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div className="flex items-center justify-between" style={{ height: 60 }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-lg"
                style={{ width: 32, height: 32, backgroundColor: 'var(--white)', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1" fill="black"/>
                  <rect x="11" y="1" width="6" height="6" rx="1" fill="black"/>
                  <rect x="1" y="11" width="6" height="6" rx="1" fill="black"/>
                  <rect x="11" y="11" width="3" height="3" rx="0.5" fill="black"/>
                  <rect x="15" y="11" width="2" height="2" rx="0.5" fill="black"/>
                  <rect x="11" y="15" width="2" height="2" rx="0.5" fill="black"/>
                  <rect x="14" y="14" width="3" height="3" rx="0.5" fill="black"/>
                </svg>
              </div>
              <div>
                <p className="font-display" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1 }}>QR Admin</p>
                <p style={{ fontSize: '0.6rem', color: '#555', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginTop: 2 }}>BUTIKKSTYRING</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {categories.length > 0 && (
                <button onClick={() => setShowPrintAll(true)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 transition-all hover:bg-white/10"
                  style={{ color: '#888', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 6 2 18 2 18 9"/>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                  </svg>
                  Print alle
                </button>
              )}
              <button onClick={() => { setEditCategory(null); setShowForm(true) }}
                className="flex items-center gap-2 rounded-lg px-4 py-2 transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: 'var(--white)', color: 'var(--black)', fontSize: '0.875rem', fontWeight: 600 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ny kategori
              </button>

              {/* Brukar + logg ut */}
              <div className="flex items-center gap-2 pl-2" style={{ borderLeft: '1px solid #2a2a2a' }}>
                <span style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'Inter, sans-serif' }}>
                  {userEmail?.split('@')[0]}
                </span>
                <button onClick={handleSignOut}
                  className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                  style={{ width: 32, height: 32, color: '#888' }}
                  title="Logg ut">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px' }}>

        {/* Stats */}
        <div className="stagger flex gap-3 mb-8">
          {[
            { label: 'Totalt kategorier', value: categories.length },
            { label: 'Søkeresultat',      value: filtered.length },
            { label: 'Uten beskrivelse',  value: categories.filter(c => !c.description).length },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-5 py-4 flex items-baseline gap-3"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="font-display" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em' }}>
                {s.value}
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex gap-3 mb-6 flex-wrap items-center no-print">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Søk i kategorier, hyllenummer..."
              style={{ paddingLeft: 38, borderRadius: 10 }} />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
            style={{ width: 'auto', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.8rem' }}>
            <option value="created_at">Nyeste først</option>
            <option value="name">Navn A–Å</option>
            <option value="shelf_number">Hyllenummer</option>
          </select>
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1.5px solid var(--border)' }}>
            {(['grid', 'list'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="flex items-center justify-center px-3 py-2 transition-all"
                style={{ width: 40, backgroundColor: view === v ? 'var(--black)' : 'var(--surface)', color: view === v ? 'var(--white)' : 'var(--muted)' }}>
                {v === 'grid'
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                }
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl px-4 py-3 flex items-center gap-3 anim-fade-in"
            style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid #fca5a5', color: 'var(--danger)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{error}</span>
            <button onClick={fetchCategories} className="ml-auto text-sm underline">Prøv igjen</button>
          </div>
        )}

        {/* Skeleton loader */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl"
                style={{ height: 220, border: '1px solid var(--border)',
                  backgroundImage: 'linear-gradient(90deg, var(--gray-100) 25%, var(--white) 50%, var(--gray-100) 75%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && categories.length === 0 && (
          <div className="text-center py-28 anim-fade-up">
            <div className="inline-flex items-center justify-center rounded-2xl mb-5"
              style={{ width: 72, height: 72, backgroundColor: 'var(--gray-100)' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
            </div>
            <h2 className="font-display mb-2" style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Ingen kategorier ennå
            </h2>
            <p className="mb-7" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
              Kom i gang ved å opprette din første kategori
            </p>
            <button onClick={() => { setEditCategory(null); setShowForm(true) }}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'var(--black)', color: 'var(--white)', fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Opprett første kategori
            </button>
          </div>
        )}

        {/* No results */}
        {!loading && categories.length > 0 && filtered.length === 0 && (
          <div className="text-center py-20 anim-fade-in">
            <p className="font-display mb-1" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Ingen treff for &ldquo;{search}&rdquo;
            </p>
            <button onClick={() => setSearch('')} className="text-sm underline" style={{ color: 'var(--muted)' }}>
              Tøm søk
            </button>
          </div>
        )}

        {/* Grid view */}
        {!loading && filtered.length > 0 && view === 'grid' && (
          <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(cat => (
              <div key={cat.id} style={{ position: 'relative' }}>
                <CategoryCard category={cat} onEdit={handleEdit} onDelete={handleDelete} onPrint={setPrintCategory} />
                {deleteConfirm === cat.id && (
                  <div className="absolute inset-0 rounded-2xl flex items-center justify-center anim-scale-in"
                    style={{ backgroundColor: 'var(--danger)', zIndex: 10 }}>
                    <div className="text-center px-6">
                      <p style={{ color: '#fff', fontWeight: 700, marginBottom: 12 }}>Slette {cat.name}?</p>
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => setDeleteConfirm(null)}
                          className="rounded-lg px-4 py-2 text-sm font-medium transition-all"
                          style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>Avbryt</button>
                        <button onClick={() => handleDelete(cat.id)}
                          className="rounded-lg px-4 py-2 text-sm font-bold transition-all"
                          style={{ backgroundColor: '#fff', color: 'var(--danger)' }}>Ja, slett</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* List view */}
        {!loading && filtered.length > 0 && view === 'list' && (
          <div className="stagger rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {filtered.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50"
                style={{ backgroundColor: 'var(--surface)', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div className="w-1 h-9 rounded-full shrink-0" style={{ backgroundColor: cat.color || 'var(--gray-300)' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-display truncate" style={{ fontWeight: 700, fontSize: '0.9rem', letterSpacing: '-0.01em' }}>{cat.name}</p>
                  {cat.description && <p className="truncate" style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 1 }}>{cat.description}</p>}
                </div>
                <span className="shrink-0 rounded-lg px-2.5 py-1"
                  style={{ fontSize: '0.72rem', backgroundColor: 'var(--gray-100)', color: 'var(--gray-700)',
                    fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
                  {cat.shelf_number}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setPrintCategory(cat)}
                    className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                    style={{ width: 36, height: 36, color: 'var(--muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 6 2 18 2 18 9"/>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                      <rect x="6" y="14" width="12" height="8"/>
                    </svg>
                  </button>
                  <button onClick={() => handleEdit(cat)}
                    className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                    style={{ width: 36, height: 36, color: 'var(--muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(cat.id)}
                    className="flex items-center justify-center rounded-lg transition-colors hover:bg-red-50"
                    style={{ width: 36, height: 36, color: deleteConfirm === cat.id ? 'var(--danger)' : 'var(--muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <CategoryForm category={editCategory} onSave={handleSave}
          onClose={() => { setShowForm(false); setEditCategory(null) }} />
      )}
      {printCategory && <PrintModal category={printCategory} onClose={() => setPrintCategory(null)} />}
      {showPrintAll  && <PrintAllModal categories={filtered} onClose={() => setShowPrintAll(false)} />}
    </div>
  )
}
