'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function PendingPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      setEmail(session.user.email ?? '')
    })
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  const handleCheckStatus = async () => {
    setChecking(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }
    const { data: profile } = await supabase
      .from('profiles').select('status').eq('id', session.user.id).single()
    if (profile?.status === 'approved') {
      router.replace('/')
    } else if (profile?.status === 'rejected') {
      await supabase.auth.signOut()
      router.replace('/login?error=rejected')
    }
    setChecking(false)
  }

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
      <div className="anim-fade-up w-full max-w-sm px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center rounded-2xl mb-4"
            style={{ width: 56, height: 56, backgroundColor: 'var(--black)' }}>
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="white"/>
              <rect x="11" y="1" width="6" height="6" rx="1" fill="white"/>
              <rect x="1" y="11" width="6" height="6" rx="1" fill="white"/>
              <rect x="11" y="11" width="3" height="3" rx="0.5" fill="white"/>
              <rect x="15" y="11" width="2" height="2" rx="0.5" fill="white"/>
              <rect x="11" y="15" width="2" height="2" rx="0.5" fill="white"/>
              <rect x="14" y="14" width="3" height="3" rx="0.5" fill="white"/>
            </svg>
          </div>
          <h1 className="font-display" style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
            QR Admin
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Klokke-ikon */}
          <div className="inline-flex items-center justify-center rounded-2xl mb-5"
            style={{ width: 64, height: 64, backgroundColor: 'var(--gray-100)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gray-500)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>

          <h2 className="font-display mb-2" style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Venter på godkjenning
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Forespørselen din er sendt til administrator.<br />
            Du vil få tilgang når kontoen din er godkjent.
          </p>

          {email && (
            <div className="rounded-xl px-4 py-3 mb-6"
              style={{ backgroundColor: 'var(--gray-50)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 2 }}>Innlogget som</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{email}</p>
            </div>
          )}

          <button onClick={handleCheckStatus} disabled={checking}
            className="w-full rounded-xl py-3 font-semibold transition-all hover:opacity-90 active:scale-95 mb-3"
            style={{ backgroundColor: 'var(--black)', color: 'var(--white)', fontSize: '0.875rem', opacity: checking ? 0.6 : 1 }}>
            {checking ? 'Sjekker...' : 'Sjekk status'}
          </button>

          <button onClick={handleSignOut}
            className="w-full rounded-xl py-3 font-medium transition-all hover:bg-gray-100"
            style={{ fontSize: '0.875rem', color: 'var(--muted)', border: '1px solid var(--border)' }}>
            Logg ut
          </button>
        </div>
      </div>
    </div>
  )
}
