'use client'
import { useRef, useState } from 'react'
import { Category } from '@/types'
import {
  LABEL_SHEETS, DEFAULT_SHEET, SKRIVERKANT, perSheet, kantVern,
  lagEgetArk, lesEgetArk, lagreEgetArk, type EgetArkMål,
} from '@/lib/labelSheets'
import { getTheme, lesUtskriftValg, lagreUtskriftValg, nettleserLager, type UtskriftValg } from '@/lib/labelTheme'
import { planEtikett, QR_RUTER, MIN_RUTE_MM } from '@/lib/etikettPlan'
import { ETIKETT_FONTER, skrivUtNårKlar } from '@/lib/utskrift'
import StickerCard from './StickerCard'
import DesignVelger from './DesignVelger'

interface Props {
  categories: Category[]
  onClose: () => void
}

const COLORS = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

// Til miniatyrene i designvelgeren når lista er tom
const EKSEMPEL: Category = {
  id: '00000000', name: 'Eksempel', shelf_number: 'A1', description: null, color: null,
  qr_type: null, qr_data: null, info_lines: null, folder_id: null, created_at: '',
}

const GRUPPER = [
  { gruppe: 'kant', navn: 'A4 delt kant i kant' },
  { gruppe: 'avery', navn: 'Avery' },
  { gruppe: 'zweckform', navn: 'Zweckform' },
] as const

// Feltene for eget format, i den rekkefølgen målene står på pakken
const EGNE_FELT: { k: keyof EgetArkMål; navn: string; heltall?: boolean }[] = [
  { k: 'w', navn: 'Bredde' },
  { k: 'h', navn: 'Høyde' },
  { k: 'cols', navn: 'Bortover', heltall: true },
  { k: 'rows', navn: 'Nedover', heltall: true },
  { k: 'marginTop', navn: 'Toppmarg' },
  { k: 'marginLeft', navn: 'Venstremarg' },
  { k: 'gapX', navn: 'Mellomrom bortover' },
  { k: 'gapY', navn: 'Mellomrom nedover' },
]

export default function PrintAllModal({ categories, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const [sheetId,   setSheetId]   = useState(DEFAULT_SHEET.id)
  // Designet og logoen man valgte sist
  const [valg,      setValg]      = useState<UtskriftValg>(() => lesUtskriftValg(nettleserLager()))
  const [offsetX,   setOffsetX]   = useState(0)
  const [offsetY,   setOffsetY]   = useState(0)
  const [showBadge, setShowBadge] = useState(true)
  const [useColor,  setUseColor]  = useState(false)
  const [color,     setColor]     = useState(COLORS[0])
  const [showList,  setShowList]  = useState(false)
  // Alle er valgt til å begynne med
  const [selected,  setSelected]  = useState<Set<string>>(() => new Set(categories.map(c => c.id)))
  // Målene for eget format huskes til neste gang
  const [egetMål,   setEgetMål]   = useState<EgetArkMål>(() => lesEgetArk(nettleserLager()))

  const eget     = lagEgetArk(egetMål)
  const egetFeil = sheetId === 'egen' && 'feil' in eget ? eget.feil : null
  const sheet    = sheetId === 'egen'
    ? ('ark' in eget ? eget.ark : DEFAULT_SHEET)
    : LABEL_SHEETS.find(s => s.id === sheetId) || DEFAULT_SHEET
  const override = useColor ? color : null
  const per      = perSheet(sheet)

  const chosen = categories.filter(c => selected.has(c.id))
  const pageCount = Math.ceil(chosen.length / per)
  const kanPrinte = chosen.length > 0 && !egetFeil

  // Etiketter som ligger mot arkkanten får ekstra luft der skriveren ikke når
  const kantSone = Array.from({ length: per }, (_, i) => kantVern(sheet, i, offsetX, offsetY))
    .some(k => k.t > 0 || k.r > 0 || k.b > 0 || k.l > 0)
  // Blir QR-rutene for små på dette arket med dette designet, sies det fra her
  // og ikke først når skanneren ikke leser koden
  const prøve = planEtikett({
    w: sheet.w, h: sheet.h, theme: getTheme(valg.design), logo: valg.logo, showBadge, hasInfo: false,
  })
  const qrRute = prøve.qrSvg / QR_RUTER
  const forLitenQr = qrRute < MIN_RUTE_MM

  const endreEget = (k: keyof EgetArkMål, verdi: number) => {
    const nytt = { ...egetMål, [k]: verdi }
    setEgetMål(nytt)
    lagreEgetArk(nytt, nettleserLager())
  }

  const endreValg = (neste: Partial<UtskriftValg>) => {
    const nytt = { ...valg, ...neste }
    setValg(nytt)
    lagreUtskriftValg(nytt, nettleserLager())
  }

  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  // Del opp i ark
  const pages: Category[][] = []
  for (let i = 0; i < chosen.length; i += per) pages.push(chosen.slice(i, i + per))
  if (pages.length === 0) pages.push([])

  const handlePrint = () => {
    const content = printRef.current
    if (!content || !kanPrinte) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiketter — QR Admin</title>
          <link href="${ETIKETT_FONTER}" rel="stylesheet">
          <style>
            /* Uten print-color-adjust dropper skriveren bakgrunnsfargene, og da
               kommer nummer-badgen ut som grå tekst på hvitt i stedet for rød */
            * { margin: 0; padding: 0; box-sizing: border-box;
                -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { background: white; font-family: sans-serif; }
            /* Etikettene plasseres absolutt, slik at de treffer cellene på arket */
            .page {
              position: relative;
              width: 210mm;
              height: 297mm;
              page-break-after: always;
              overflow: hidden;
            }
            .page:last-child { page-break-after: auto; }
            .cell { position: absolute; }
            .sticker-card { break-inside: avoid; page-break-inside: avoid; }
            @page { size: A4 portrait; margin: 0; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    // Vent på fontene og logoene før print-dialogen åpnes
    skrivUtNårKlar(printWindow)
  }

  // A4 er 210mm ≈ 794px — skaleres ned i forhåndsvisningen
  const scale = 0.42
  const A4_W = 794, A4_H = 1123

  const sectionLabel = (txt: string) => (
    <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
      color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
      {txt}
    </p>
  )

  const toggle = (on: boolean, fn: () => void) => (
    <button onClick={fn} role="switch" aria-checked={on}
      className="rounded-full transition-all shrink-0"
      style={{ width: 46, height: 26, padding: 3, backgroundColor: on ? 'var(--black)' : 'var(--gray-200)' }}>
      <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%',
        backgroundColor: 'var(--white)', transform: on ? 'translateX(20px)' : 'none',
        transition: 'transform 0.15s' }} />
    </button>
  )

  // Selve arkene — samme markup i forhåndsvisning og utskrift
  const sheetMarkup = (
    <>
      {pages.map((page, p) => (
        <div key={p} className="page"
          style={{ position: 'relative', width: '210mm', height: '297mm', overflow: 'hidden',
            backgroundColor: '#ffffff' }}>
          {page.map((cat, i) => (
            <div key={cat.id} className="cell"
              style={{
                position: 'absolute',
                left: `${sheet.marginLeft + (i % sheet.cols) * sheet.pitchX + offsetX}mm`,
                top:  `${sheet.marginTop + Math.floor(i / sheet.cols) * sheet.pitchY + offsetY}mm`,
              }}>
              <StickerCard category={cat}
                widthMm={sheet.w} heightMm={sheet.h}
                showBadge={showBadge} overrideColor={override}
                theme={valg.design} logo={valg.logo}
                kant={kantVern(sheet, i, offsetX, offsetY)} />
            </div>
          ))}
        </div>
      ))}
    </>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,15,15,0.7)' }}>
      <div className="animate-fade-up w-full max-w-2xl rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="p-8 pb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl" style={{ fontWeight: 700 }}>Print etiketter</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 2 }}>
              {chosen.length} av {categories.length} valgt — {per} per ark, {pageCount} ark
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.25rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Innstillinger og forhåndsvisning ruller sammen. Hver for seg ble
            innstillingene høyere enn skjermen, og forhåndsvisningen klemt til ingenting. */}
        <div className="overflow-y-auto" style={{ flex: 1, minHeight: 0 }}>
        <div className="px-8 pb-5 space-y-5" style={{ borderBottom: '1px solid var(--border)' }}>

          {/* Hvilke QR-koder som skal med */}
          <div>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              {sectionLabel(`QR-KODER (${chosen.length}/${categories.length})`)}
              <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                <button onClick={() => setSelected(new Set(categories.map(c => c.id)))}
                  className="underline" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Velg alle
                </button>
                <button onClick={() => setSelected(new Set())}
                  className="underline" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Fjern alle
                </button>
                <button onClick={() => setShowList(v => !v)}
                  className="underline" style={{ fontSize: '0.75rem', color: 'var(--ink)', fontWeight: 500 }}>
                  {showList ? 'Skjul liste' : 'Velg enkeltvis'}
                </button>
              </div>
            </div>
            {showList && (
              <div className="rounded-xl overflow-y-auto"
                style={{ border: '1.5px solid var(--border)', maxHeight: 190 }}>
                {categories.map((c, i) => {
                  const on = selected.has(c.id)
                  return (
                    <button key={c.id} onClick={() => toggleOne(c.id)}
                      className="w-full flex items-center gap-3 text-left transition-colors"
                      style={{ padding: '9px 12px',
                        borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                        backgroundColor: on ? 'var(--surface)' : 'var(--gray-50)',
                        opacity: on ? 1 : 0.55 }}>
                      <span className="flex items-center justify-center rounded-md shrink-0"
                        style={{ width: 18, height: 18,
                          border: `1.5px solid ${on ? 'var(--black)' : 'var(--border-dark)'}`,
                          backgroundColor: on ? 'var(--black)' : 'transparent' }}>
                        {on && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--white)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </span>
                      <span className="flex-1 min-w-0 truncate" style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
                        {c.name}
                      </span>
                      <span className="shrink-0" style={{ fontSize: '0.75rem', color: 'var(--muted)',
                        fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'slashed-zero' }}>
                        {c.shelf_number}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Design og logo */}
          <div>
            {sectionLabel('DESIGN')}
            <DesignVelger
              category={chosen[0] ?? categories[0] ?? EKSEMPEL}
              themeId={valg.design}
              onTheme={id => endreValg({ design: id })}
              logo={valg.logo}
              onLogo={on => endreValg({ logo: on })}
              overrideColor={override}
            />
          </div>

          {/* Arktype */}
          <div>
            {sectionLabel('ETIKETTARK')}
            <select value={sheetId} onChange={e => setSheetId(e.target.value)}
              style={{ width: '100%', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
              {GRUPPER.map(g => (
                <optgroup key={g.gruppe} label={g.navn}>
                  {LABEL_SHEETS.filter(s => s.gruppe === g.gruppe).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
              <optgroup label="Andre ark">
                <option value="egen">Eget format — skriv inn målene</option>
              </optgroup>
            </select>

            {sheetId === 'egen' && (
              <div style={{ marginTop: 10 }}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EGNE_FELT.map(f => (
                    <label key={f.k} style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      {f.navn}{f.heltall ? '' : ' (mm)'}
                      <input type="number" min={f.heltall ? 1 : 0} step={f.heltall ? 1 : 0.1}
                        value={Number.isFinite(egetMål[f.k]) ? egetMål[f.k] : ''}
                        onChange={e => endreEget(f.k, e.target.value === '' ? NaN : Number(e.target.value))}
                        style={{ display: 'block', width: '100%', borderRadius: 10, fontSize: '0.875rem', marginTop: 3 }} />
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6 }}>
                  Målene står på pakken, eller mål et ark med linjal: etikettens størrelse, hvor mange
                  bortover og nedover, avstanden fra arkkanten til første etikett og mellomrommet mellom dem.
                </p>
              </div>
            )}

            {egetFeil ? (
              <p role="alert" style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 6 }}>{egetFeil}</p>
            ) : (
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6 }}>
                Etikett {String(Math.round(sheet.w * 100) / 100).replace('.', ',')} × {String(Math.round(sheet.h * 100) / 100).replace('.', ',')} mm
                {' '}— {sheet.cols} × {sheet.rows} per ark.
                Skriv ut i 100 % («Faktisk størrelse») med marger satt til «Ingen» — ellers krymper
                skriveren arket, og etikettene havner feil. Ta en testutskrift på vanlig papir først.
              </p>
            )}
            {!egetFeil && kantSone && (
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                Etikettene mot arkkanten får ekstra luft der: skrivere printer ikke de ytterste
                {' '}{String(SKRIVERKANT).replace('.', ',')} mm, så QR-kode og tekst holdes innenfor.
              </p>
            )}
            {!egetFeil && forLitenQr && (
              <p role="alert" style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: 4 }}>
                QR-koden blir for liten på så små etiketter ({String(Math.round(qrRute * 100) / 100).replace('.', ',')} mm
                per rute) og kan bli vanskelig å skanne. Velg større etiketter eller «Stor QR».
              </p>
            )}
          </div>

          {/* Finjustering */}
          <div>
            {sectionLabel('JUSTERING (MM)')}
            <div className="flex gap-3">
              {([
                { label: 'Høyre/venstre', value: offsetX, set: setOffsetX },
                { label: 'Opp/ned',       value: offsetY, set: setOffsetY },
              ]).map(f => (
                <div key={f.label} className="flex-1">
                  <input type="number" step="0.5" value={f.value}
                    onChange={e => f.set(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', borderRadius: 10, fontSize: '0.875rem' }} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>{f.label}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6 }}>
              Skyv alle etikettene hvis skriveren treffer litt skjevt.
            </p>
          </div>

          {/* Badge */}
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>Nummer-badge</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Fargefeltet med utstyrsnummer øverst</p>
            </div>
            {toggle(showBadge, () => setShowBadge(b => !b))}
          </div>

          {/* Farge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>Felles farge</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {useColor
                    ? 'Overstyrer fargen på hver QR-kode'
                    : getTheme(valg.design).accent
                    ? 'Designet har faste farger'
                    : 'Hver QR-kode beholder sin egen farge'}
                </p>
              </div>
              {toggle(useColor, () => setUseColor(v => !v))}
            </div>
            {useColor && (
              <div className="flex items-center gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className="rounded-full transition-transform hover:scale-110"
                    style={{ width: 26, height: 26, backgroundColor: c, flexShrink: 0,
                      outline: color === c ? `3px solid ${c}` : '2px solid transparent',
                      outlineOffset: 2, transform: color === c ? 'scale(1.15)' : undefined }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)}
                  style={{ width: 26, height: 26, padding: 2, backgroundColor: 'transparent',
                    border: '1.5px solid var(--border)', borderRadius: '50%', cursor: 'pointer' }}
                  title="Egendefinert farge" />
              </div>
            )}
          </div>
        </div>

        {/* Forhåndsvisning — nedskalert, men markupen som printes er i full størrelse */}
        <div className="px-8 py-5" style={{ backgroundColor: 'var(--gray-100)' }}>
          {egetFeil ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>
              Forhåndsvisningen kommer når målene for eget format går opp.
            </p>
          ) : (
            <div style={{ width: A4_W * scale, height: (A4_H * pages.length + 16 * (pages.length - 1)) * scale,
              overflow: 'hidden', margin: '0 auto' }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: A4_W }}>
                <div ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {sheetMarkup}
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        <div className="p-8 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-70"
            style={{ backgroundColor: 'var(--gray-100)', color: 'var(--ink)' }}
          >
            Lukk
          </button>
          <button
            onClick={handlePrint}
            disabled={!kanPrinte}
            className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--black)', color: 'var(--white)', fontFamily: 'Syne, sans-serif',
              fontWeight: 600, opacity: kanPrinte ? 1 : 0.4,
              cursor: kanPrinte ? 'pointer' : 'not-allowed' }}
          >
            <span>🖨</span> {chosen.length === 0 ? 'Ingen valgt' : egetFeil ? 'Sjekk målene' : `Print ${pageCount} ark`}
          </button>
        </div>
      </div>
    </div>
  )
}
