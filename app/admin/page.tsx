'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { isAdmin } from '@/lib/auth'

interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  pending:  'Venter',
  approved: 'Godkjent',
  rejected: 'Avvist',
}
const STATUS_COLOR: Record<string, string> = {
  pending:  '#f59e0b',
  approved: '#22c55e',
  rejected: '#ef4444',
}

export default function AdminPage() {
  const router = useRouter()
  const [loading,   setLoading]   = useState(true)
  const [profiles,  setProfiles]  = useState<Profile[]>([])
  const [updating,  setUpdating]  = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      if (!isAdmin(session.user.email)) { router.replace('/'); return }
    })
  }, [router])

  const fetchProfiles = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setProfiles(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProfiles() }, [fetchProfiles])

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    setUpdating(id)
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id)
    if (!error) setProfiles(prev => prev.map(p => p.id === id ? { ...p, status } : p))
    setUpdating(null)
  }

  const filtered = profiles.filter(p => activeTab === 'all' || p.status === activeTab)
  const counts = {
    pending:  profiles.filter(p => p.status === 'pending').length,
    approved: profiles.filter(p => p.status === 'approved').length,
    rejected: profiles.filter(p => p.status === 'rejected').length,
    all:      profiles.length,
  }

  const TABS = [
    { key: 'pending',  label: 'Venter' },
    { key: 'approved', label: 'Godkjente' },
    { key: 'rejected', label: 'Avviste' },
    { key: 'all',      label: 'Alle' },
  ] as const

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>

      {/* Header */}
      <header className="sticky top-0 z-40"
        style={{ backgroundColor: 'var(--black)', borderBottom: '1px solid #1f1f1f' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px' }}>
          <div className="flex items-center justify-between" style={{ height: 56 }}>
            <div className="flex items-center gap-3">
              <button onClick={() => router.replace('/')}
                className="flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                style={{ width: 32, height: 32, color: '#888' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <div className="flex items-center justify-center rounded-lg"
                style={{ width: 32, height: 32, backgroundColor: 'var(--white)' }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="1" y="1" width="6" height="6" rx="1" fill="black"/>
                  <rect x="11" y="1" width="6" height="6" rx="1" fill="black"/>
                  <rect x="1" y="11" width="6" height="6" rx="1" fill="black"/>
                  <rect x="11" y="11" width="3" height="3" rx="0.5" fill="black"/>
                </svg>
              </div>
              <div>
                <p className="font-display" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--white)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Brukere
                </p>
                <p style={{ fontSize: '0.6rem', color: '#555', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginTop: 2 }}>
                  ADMIN
                </p>
              </div>
            </div>

            {counts.pending > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#f59e0b20', border: '1px solid #f59e0b40' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b' }}>
                  {counts.pending} venter
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Stats */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { label: 'Totalt', value: counts.all },
            { label: 'Venter', value: counts.pending, color: '#f59e0b' },
            { label: 'Godkjente', value: counts.approved, color: '#22c55e' },
            { label: 'Avviste', value: counts.rejected, color: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="rounded-xl px-4 py-3 flex items-baseline gap-2 shrink-0"
              style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span className="font-display" style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', color: s.color || 'var(--ink)' }}>
                {s.value}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ backgroundColor: 'var(--gray-100)' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 rounded-lg py-2 text-sm font-medium transition-all"
              style={{
                fontSize: '0.8rem',
                backgroundColor: activeTab === tab.key ? 'var(--white)' : 'transparent',
                color: activeTab === tab.key ? 'var(--ink)' : 'var(--muted)',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}>
              {tab.label}
              {counts[tab.key] > 0 && (
                <span className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: activeTab === tab.key ? 'var(--gray-100)' : 'var(--gray-200)',
                    color: 'var(--gray-700)',
                    fontSize: '0.7rem',
                  }}>
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-2xl"
                style={{ height: 80, border: '1px solid var(--border)',
                  backgroundImage: 'linear-gradient(90deg, var(--gray-100) 25%, var(--white) 50%, var(--gray-100) 75%)',
                  backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--muted)' }}>
              Ingen brukere her
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 anim-fade-up">
            {filtered.map(profile => (
              <div key={profile.id} className="rounded-2xl p-4"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                    style={{ width: 44, height: 44, backgroundColor: 'var(--gray-100)' }}>
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display truncate" style={{ fontSize: '0.9rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                      {profile.full_name || profile.email.split('@')[0]}
                    </p>
                    <p className="truncate" style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {profile.email}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className="shrink-0 rounded-full px-2.5 py-1"
                    style={{
                      fontSize: '0.7rem', fontWeight: 600,
                      backgroundColor: STATUS_COLOR[profile.status] + '18',
                      color: STATUS_COLOR[profile.status],
                    }}>
                    {STATUS_LABEL[profile.status]}
                  </span>
                </div>

                {/* Actions */}
                {profile.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => updateStatus(profile.id, 'rejected')}
                      disabled={updating === profile.id}
                      className="flex-1 rounded-xl py-2.5 font-medium transition-all hover:opacity-80"
                      style={{ fontSize: '0.8rem', border: '1px solid var(--border)', color: 'var(--danger)', backgroundColor: 'var(--danger-bg)' }}>
                      Avvis
                    </button>
                    <button onClick={() => updateStatus(profile.id, 'approved')}
                      disabled={updating === profile.id}
                      className="flex-1 rounded-xl py-2.5 font-semibold transition-all hover:opacity-90 active:scale-95"
                      style={{ fontSize: '0.8rem', backgroundColor: 'var(--black)', color: 'var(--white)',
                        opacity: updating === profile.id ? 0.6 : 1 }}>
                      {updating === profile.id ? 'Lagrer...' : 'Godkjenn'}
                    </button>
                  </div>
                )}

                {profile.status === 'approved' && (
                  <button onClick={() => updateStatus(profile.id, 'rejected')}
                    disabled={updating === profile.id}
                    className="w-full mt-3 rounded-xl py-2.5 font-medium transition-all hover:opacity-80"
                    style={{ fontSize: '0.8rem', border: '1px solid var(--border)', color: 'var(--danger)' }}>
                    Trekk tilbake tilgang
                  </button>
                )}

                {profile.status === 'rejected' && (
                  <button onClick={() => updateStatus(profile.id, 'approved')}
                    disabled={updating === profile.id}
                    className="w-full mt-3 rounded-xl py-2.5 font-semibold transition-all hover:opacity-90"
                    style={{ fontSize: '0.8rem', backgroundColor: 'var(--black)', color: 'var(--white)' }}>
                    Gi tilgang
                  </button>
                )}

                <p style={{ fontSize: '0.7rem', color: 'var(--gray-300)', fontFamily: 'JetBrains Mono, monospace', marginTop: 8 }}>
                  Registrert {new Date(profile.created_at).toLocaleDateString('no-NO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
