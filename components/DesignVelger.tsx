'use client'
import { useEffect, useRef, useState } from 'react'
import { Category } from '@/types'
import { LABEL_THEMES, LABEL_GRUPPER, LabelThemeId, getTheme, type LabelGruppe } from '@/lib/labelTheme'
import StickerCard from './StickerCard'

interface Props {
  /** QR-koden miniatyrene viser — den man faktisk skal skrive ut */
  category: Category
  themeId: LabelThemeId
  onTheme: (id: LabelThemeId) => void
  logo: boolean
  onLogo: (on: boolean) => void
  /** Felles farge fra etikettark-utskriften, så miniatyrene viser det som printes */
  overrideColor?: string | null
}

// Miniatyrene er ekte etiketter i 42 × 58 mm, skalert ned — ikke skisser, så
// det man ser i velgeren er det som kommer ut av skriveren
const MINI_W = 42
const MINI_H = 58
const PX_PER_MM = 96 / 25.4
const SKALA = 0.42

/**
 * Valg av design og HM-logo, delt av «Print sticker» og «Print etiketter».
 * Designene er delt i grupper, og stripa viser én gruppe om gangen.
 */
export default function DesignVelger({ category, themeId, onTheme, logo, onLogo, overrideColor }: Props) {
  const valgt = getTheme(themeId)
  // Vinduet åpner på gruppen designet man brukte sist står i
  const [gruppe, setGruppe] = useState<LabelGruppe>(valgt.gruppe)
  const synlige = LABEL_THEMES.filter(t => t.gruppe === gruppe)
  const stripe = useRef<HTMLDivElement>(null)

  const velgGruppe = (g: LabelGruppe) => {
    setGruppe(g)
    // Ny gruppe begynner fra starten, ikke midt i der forrige slapp
    if (stripe.current) stripe.current.scrollLeft = 0
  }

  // Også én gruppe er flere skjermbredder lang. Et vanlig musehjul
  // ruller den sidelengs — React legger hjul-lyttere som passive, så
  // preventDefault krever en egen lytter.
  useEffect(() => {
    const el = stripe.current
    if (!el) return
    const hjul = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || el.scrollWidth <= el.clientWidth) return
      const før = el.scrollLeft
      el.scrollLeft += e.deltaY
      // Ved enden av stripa får siden rulle videre som vanlig
      if (el.scrollLeft !== før) e.preventDefault()
    }
    el.addEventListener('wheel', hjul, { passive: false })
    return () => el.removeEventListener('wheel', hjul)
  }, [])

  // Designet man valgte sist kan ligge langt ute i stripa — vis det når
  // vinduet åpnes. Ikke ved hvert klikk: da ville stripa hoppet under fingeren.
  useEffect(() => {
    const boks = stripe.current
    const el = boks?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!boks || !el) return
    const fraVenstre = el.getBoundingClientRect().left - boks.getBoundingClientRect().left
    boks.scrollLeft += fraVenstre - (boks.clientWidth - el.clientWidth) / 2
  }, [])

  return (
    <div>
      <div role="group" aria-label="Designgrupper" className="flex flex-wrap gap-1" style={{ marginBottom: 8 }}>
        {LABEL_GRUPPER.map(g => {
          const på = g.id === gruppe
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => velgGruppe(g.id)}
              aria-pressed={på}
              title={g.hint}
              className="flex items-center rounded-full transition-colors"
              style={{
                gap: 5, padding: '5px 9px', fontSize: '0.75rem', fontWeight: på ? 600 : 500,
                backgroundColor: på ? 'var(--black)' : 'var(--gray-100)',
                color: på ? 'var(--white)' : 'var(--ink)',
              }}
            >
              {g.navn}
              {/* Prikken viser hvilken gruppe det valgte designet ligger i */}
              {g.id === valgt.gruppe && (
                <span aria-hidden="true" style={{
                  width: 5, height: 5, borderRadius: '50%', backgroundColor: 'currentColor',
                }} />
              )}
            </button>
          )
        })}
      </div>

      <div ref={stripe} className="flex gap-1 overflow-x-auto" style={{ paddingBottom: 6, scrollSnapType: 'x proximity' }}>
        {synlige.map(t => {
          const on = t.id === themeId
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onTheme(t.id)}
              aria-pressed={on}
              title={t.hint}
              className="shrink-0 flex flex-col items-center rounded-xl transition-colors"
              style={{
                gap: 6, padding: 6, scrollSnapAlign: 'start',
                backgroundColor: on ? 'var(--gray-100)' : 'transparent',
                boxShadow: on ? 'inset 0 0 0 2px var(--black)' : 'none',
              }}
            >
              <span aria-hidden="true" style={{
                display: 'block', overflow: 'hidden', borderRadius: 3, backgroundColor: '#ffffff',
                width: MINI_W * PX_PER_MM * SKALA, height: MINI_H * PX_PER_MM * SKALA,
                boxShadow: '0 0 0 1px var(--border)',
              }}>
                <span style={{
                  display: 'block', width: MINI_W * PX_PER_MM, pointerEvents: 'none',
                  transform: `scale(${SKALA})`, transformOrigin: 'top left',
                }}>
                  <StickerCard category={category} widthMm={MINI_W} heightMm={MINI_H}
                    theme={t.id} logo={logo} overrideColor={overrideColor} />
                </span>
              </span>
              <span style={{ fontSize: '0.7rem', fontWeight: on ? 600 : 500, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
                {t.name}
              </span>
            </button>
          )
        })}
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 2 }}>
        {valgt.name} — {valgt.hint}
        {valgt.gruppe !== gruppe && ` (under ${LABEL_GRUPPER.find(g => g.id === valgt.gruppe)?.navn})`}
      </p>

      <div className="flex items-center justify-between" style={{ marginTop: 14 }}>
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>Hauge Maskin-logo</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            {logo ? 'Står der designet har plass til den' : 'Etiketten skrives ut uten logo'}
          </p>
        </div>
        <button type="button" onClick={() => onLogo(!logo)} role="switch" aria-checked={logo}
          aria-label="Hauge Maskin-logo"
          className="rounded-full transition-all shrink-0"
          style={{ width: 46, height: 26, padding: 3, backgroundColor: logo ? 'var(--black)' : 'var(--gray-200)' }}>
          <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%',
            backgroundColor: 'var(--white)', transform: logo ? 'translateX(20px)' : 'none',
            transition: 'transform 0.15s' }} />
        </button>
      </div>
    </div>
  )
}
