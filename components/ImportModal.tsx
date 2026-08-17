'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Category, Folder } from '@/types'
import { leggPlan, parseImport } from '@/lib/importCategories'

interface Props {
  folders: Folder[]
  /** Alt som allerede ligger i basen — brukes til å skille nytt fra oppdatering. */
  existing: Category[]
  defaultFolderId: string | null
  onClose: () => void
  onDone: () => Promise<void> | void
}

/*
 * Lagersystemet og QR Admin ligger i hvert sitt Supabase-prosjekt, så det
 * finnes ingen direkte kobling. Den korteste veien mellom dem er utklippstavla:
 * «Kopier JSON» der, lim inn her. Filvalg er med som reserve for den som lastet
 * ned i stedet.
 */
export default function ImportModal({ folders, existing, defaultFolderId, onClose, onDone }: Props) {
  const [tekst, setTekst] = useState('')
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId)
  const [jobber, setJobber] = useState(false)
  const [feil, setFeil] = useState('')
  const [ferdig, setFerdig] = useState<{ nye: number; oppdatert: number } | null>(null)
  const filInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !jobber) onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, jobber])

  const { rader, problemer, kilde } = useMemo(() => parseImport(tekst), [tekst])
  const plan = useMemo(() => leggPlan(rader, existing), [rader, existing])

  const lesFil = async (fil: File) => {
    setFeil('')
    setTekst(await fil.text())
  }

  const limInn = async () => {
    try {
      setTekst(await navigator.clipboard.readText())
    } catch {
      setFeil('Fikk ikke lese utklippstavla. Lim inn med Ctrl+V i feltet i stedet.')
    }
  }

  const importer = async () => {
    setJobber(true)
    setFeil('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user.id
      if (!userId) throw new Error('Ingen aktiv innlogging')

      // Rader uten user_id kan bli usynlige om RLS strammes til per bruker.
      // Den settes her, ikke fra fila.
      const felles = { folder_id: folderId, user_id: userId }

      // Chunket: én insert med 500+ rader er en payload PostgREST gjerne avviser.
      const BOLK = 200
      for (let i = 0; i < plan.nye.length; i += BOLK) {
        const bolk = plan.nye.slice(i, i + BOLK).map(r => ({ ...r, ...felles }))
        const { error } = await supabase.from('categories').insert(bolk)
        if (error) throw error
      }

      for (const o of plan.oppdateres) {
        // folder_id holdes urørt ved oppdatering — den som har sortert en kode
        // inn i en mappe skal ikke få den flyttet av en reimport.
        const { error } = await supabase
          .from('categories')
          .update({ ...o.rad, folder_id: undefined, user_id: userId })
          .eq('id', o.id)
        if (error) throw error
      }

      setFerdig({ nye: plan.nye.length, oppdatert: plan.oppdateres.length })
      await onDone()
    } catch (e: unknown) {
      setFeil(e instanceof Error ? e.message : 'Noe gikk galt under importen')
    } finally {
      setJobber(false)
    }
  }

  const merkelapp = (txt: string) => (
    <label className="block mb-1.5" style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
      {txt}
    </label>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 anim-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && !jobber && onClose()}>

      <div className="anim-scale-in w-full max-w-lg shadow-xl overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '94dvh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Importer fra Lagersystem
            </h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2 }}>
              Lim inn eller velg fila du eksporterte
            </p>
          </div>
          <button onClick={onClose} disabled={jobber}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ width: 32, height: 32, color: 'var(--muted)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-7 flex flex-col gap-5">

          {ferdig ? (
            <>
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center rounded-2xl mb-4"
                  style={{ width: 56, height: 56, backgroundColor: 'var(--success)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="font-display" style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                  Importen er ferdig
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginTop: 4 }}>
                  {ferdig.nye} nye
                  {ferdig.oppdatert > 0 && ` · ${ferdig.oppdatert} oppdatert`}
                </p>
              </div>
              <button onClick={onClose}
                className="rounded-xl px-6 py-3 active:scale-95"
                style={{ backgroundColor: 'var(--black)', color: 'var(--white)', fontWeight: 600 }}>
                Lukk
              </button>
            </>
          ) : (
            <>
              {/* Kilde */}
              <div>
                {merkelapp('DATA')}
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={limInn}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 active:scale-95"
                    style={{ border: '1.5px solid var(--border)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    Lim inn
                  </button>
                  <button type="button" onClick={() => filInput.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 active:scale-95"
                    style={{ border: '1.5px solid var(--border)', fontSize: '0.85rem', fontWeight: 600 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Velg fil
                  </button>
                  <input ref={filInput} type="file" accept=".json,.csv,application/json,text/csv"
                    style={{ display: 'none' }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) lesFil(f) }} />
                </div>
                <textarea
                  value={tekst}
                  onChange={e => setTekst(e.target.value)}
                  rows={5}
                  placeholder='Lim inn JSON eller CSV her…'
                  style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', resize: 'vertical' }}
                />
              </div>

              {/* Sammendrag */}
              {tekst.trim() && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--gray-50)', border: '1px solid var(--border)' }}>
                  {rader.length === 0 && problemer.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Fant ingen rader.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-baseline gap-4">
                        <span className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                          {plan.nye.length}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>nye QR-koder</span>
                      </div>
                      {plan.oppdateres.length > 0 && (
                        <div className="flex items-baseline gap-4">
                          <span className="font-display" style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
                            {plan.oppdateres.length}
                          </span>
                          <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                            finnes fra før og oppdateres
                          </span>
                        </div>
                      )}
                      {kilde && (
                        <p className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>
                          lest som {kilde.toUpperCase()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Problemer — vises, men stopper ikke resten */}
              {problemer.length > 0 && (
                <div className="rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)' }}>
                    {problemer.length} {problemer.length === 1 ? 'rad hoppes over' : 'rader hoppes over'}
                  </p>
                  <ul style={{ fontSize: '0.74rem', color: 'var(--danger)', marginTop: 6, opacity: 0.85 }}>
                    {problemer.slice(0, 5).map((p, i) => (
                      <li key={i}>Rad {p.rad}{p.navn && ` («${p.navn}»)`}: {p.grunn}</li>
                    ))}
                    {problemer.length > 5 && <li>… og {problemer.length - 5} til</li>}
                  </ul>
                </div>
              )}

              {/* Mappe */}
              {plan.nye.length > 0 && (
                <div>
                  {merkelapp('LEGG NYE I MAPPE')}
                  <select value={folderId ?? ''} onChange={e => setFolderId(e.target.value || null)}>
                    <option value="">Uten mappe</option>
                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6 }}>
                    Koder som finnes fra før beholder mappen de allerede ligger i.
                  </p>
                </div>
              )}

              {feil && (
                <p style={{ fontSize: '0.82rem', color: 'var(--danger)' }}>{feil}</p>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={onClose} disabled={jobber}
                  className="flex-1 rounded-xl px-6 py-3 active:scale-95"
                  style={{ border: '1.5px solid var(--border)', fontWeight: 600 }}>
                  Avbryt
                </button>
                <button type="button" onClick={importer}
                  disabled={jobber || (plan.nye.length === 0 && plan.oppdateres.length === 0)}
                  className="flex-1 rounded-xl px-6 py-3 active:scale-95"
                  style={{
                    backgroundColor: 'var(--black)', color: 'var(--white)', fontWeight: 600,
                    opacity: jobber || (plan.nye.length === 0 && plan.oppdateres.length === 0) ? 0.4 : 1,
                  }}>
                  {jobber ? 'Importerer…' : `Importer ${plan.nye.length + plan.oppdateres.length}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
