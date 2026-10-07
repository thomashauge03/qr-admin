'use client'
import { useEffect, useState } from 'react'
import { Category } from '@/types'
import { lesKode, trygtMål } from '@/lib/videresending'

/*
 * Sida bak hver URL-etikett. Slår opp lenka koden har nå, og sender videre.
 *
 * Rett mot REST-endepunktet i stedet for supabase-klienten: dette er sida
 * kundene venter på mellom skanning og lenke, og klienten er tung og ville
 * bare lest en innlogget økt vi ikke trenger. Katalogen er åpen for lesing
 * (se supabase-setup.sql), så anon-nøkkelen holder.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Tilstand = 'henter' | 'død' | 'feil'

async function hentLenke(id: string): Promise<string | null> {
  const headers: Record<string, string> = { apikey: ANON_KEY }
  // Den gamle anon-nøkkelen er en JWT og skal også stå som Bearer.
  // De nye sb_publishable_-nøklene skal ikke det.
  if (ANON_KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${ANON_KEY}`

  const r = await fetch(`${SUPABASE_URL}/rest/v1/categories?id=eq.${id}&select=qr_type,qr_data`, {
    headers,
    cache: 'no-store',
    credentials: 'omit',
  })
  if (!r.ok) throw new Error(`Basen svarte ${r.status}`)
  const [rad] = (await r.json()) as Pick<Category, 'qr_type' | 'qr_data'>[]
  if (!rad || rad.qr_type !== 'url') return null
  return trygtMål(rad.qr_data?.url)
}

export default function Videresend() {
  const [tilstand, setTilstand] = useState<Tilstand>('henter')

  useEffect(() => {
    const id = lesKode(window.location.search)
    if (!id) { setTilstand('død'); return }
    hentLenke(id)
      .then(mål => {
        // replace: tilbakeknappen skal ikke lande her og sende videre på nytt
        if (mål) window.location.replace(mål)
        else setTilstand('død')
      })
      .catch(() => setTilstand('feil'))
  }, [])

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100dvh', backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm px-4 text-center">
        {tilstand === 'henter' && (
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Åpner lenka …</p>
        )}

        {tilstand !== 'henter' && (
          <div className="rounded-2xl p-8" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h1 className="font-display mb-2" style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {tilstand === 'død' ? 'Koden er ikke i bruk' : 'Fikk ikke åpnet lenka'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              {tilstand === 'død'
                ? 'Denne QR-koden peker ikke til noe lenger. Spør gjerne en av de ansatte.'
                : 'Sjekk at telefonen har nett, og prøv igjen.'}
            </p>
            {tilstand === 'feil' && (
              <button onClick={() => window.location.reload()}
                className="w-full rounded-xl py-3 mt-6 font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: 'var(--black)', color: 'var(--white)', fontSize: '0.875rem' }}>
                Prøv igjen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
