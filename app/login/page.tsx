'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('error') === 'unauthorized') {
      setError('Denne Google-kontoen har ikke tilgang. Kontakt administrator.')
    }
  }, [searchParams])

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="anim-fade-up w-full max-w-sm">
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
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 6 }}>
          Logg inn for å administrere kategorier
        </p>
      </div>

      {/* Card */}
      <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl py-3.5 font-medium transition-all hover:opacity-90 active:scale-95"
          style={{
            backgroundColor: 'var(--black)', color: 'var(--white)',
            fontSize: '0.9rem', fontWeight: 600,
            opacity: loading ? 0.6 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <svg style={{ animation: 'spin 1s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Logger inn...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Fortsett med Google
            </>
          )}
        </button>

        {error && (
          <div className="mt-4 rounded-xl px-4 py-3 text-sm anim-fade-in"
            style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <p className="text-center mt-6" style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
          Kun autoriserte brukere har tilgang.<br />
          Kontakt administrator for å få tilgang.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
