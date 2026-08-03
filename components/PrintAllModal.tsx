'use client'
import { useRef, useState } from 'react'
import { Category } from '@/types'
import { LABEL_SHEETS, DEFAULT_SHEET, perSheet } from '@/lib/labelSheets'
import StickerCard from './StickerCard'

interface Props {
  categories: Category[]
  onClose: () => void
}

const COLORS = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

export default function PrintAllModal({ categories, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const [sheetId,   setSheetId]   = useState(DEFAULT_SHEET.id)
  const [offsetX,   setOffsetX]   = useState(0)
  const [offsetY,   setOffsetY]   = useState(0)
  const [showBadge, setShowBadge] = useState(true)
  const [useColor,  setUseColor]  = useState(false)
  const [color,     setColor]     = useState(COLORS[0])

  const sheet    = LABEL_SHEETS.find(s => s.id === sheetId) || DEFAULT_SHEET
  const override = useColor ? color : null
  const per      = perSheet(sheet)
  const pageCount = Math.max(1, Math.ceil(categories.length / per))

  // Del opp i ark
  const pages: Category[][] = []
  for (let i = 0; i < categories.length; i += per) pages.push(categories.slice(i, i + per))
  if (pages.length === 0) pages.push([])

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiketter — QR Admin</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
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
    setTimeout(() => { printWindow.print(); printWindow.close() }, 700)
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
              <StickerCard category={cat} forPrint
                widthMm={sheet.w} heightMm={sheet.h}
                showBadge={showBadge} overrideColor={override} />
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
              {categories.length} QR-koder — {per} per ark, {pageCount} {pageCount === 1 ? 'ark' : 'ark'}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.25rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Innstillinger */}
        <div className="px-8 pb-5 space-y-5" style={{ borderBottom: '1px solid var(--border)' }}>

          {/* Arktype */}
          <div>
            {sectionLabel('ETIKETTARK')}
            <select value={sheetId} onChange={e => setSheetId(e.target.value)}
              style={{ width: '100%', borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
              <optgroup label="A4 delt kant i kant">
                {LABEL_SHEETS.filter(s => s.id.startsWith('a4-')).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
              <optgroup label="Avery / Zweckform">
                {LABEL_SHEETS.filter(s => !s.id.startsWith('a4-')).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </optgroup>
            </select>
            <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6 }}>
              Etikett {sheet.w} × {sheet.h} mm — {sheet.cols} × {sheet.rows} per ark.
              Ta en testutskrift på vanlig papir og hold den mot etikettarket før du printer.
            </p>
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
              <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>Hylle-badge</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Fargefeltet med hyllenummer øverst</p>
            </div>
            {toggle(showBadge, () => setShowBadge(b => !b))}
          </div>

          {/* Farge */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>Felles farge</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {useColor ? 'Overstyrer fargen på hver QR-kode' : 'Hver QR-kode beholder sin egen farge'}
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
        <div className="overflow-y-auto px-8 py-5 flex-1" style={{ backgroundColor: 'var(--gray-100)' }}>
          <div style={{ width: A4_W * scale, height: (A4_H * pages.length + 16 * (pages.length - 1)) * scale,
            overflow: 'hidden', margin: '0 auto' }}>
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: A4_W }}>
              <div ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {sheetMarkup}
              </div>
            </div>
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
            className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--black)', color: 'var(--white)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}
          >
            <span>🖨</span> Print {pageCount} {pageCount === 1 ? 'ark' : 'ark'}
          </button>
        </div>
      </div>
    </div>
  )
}
