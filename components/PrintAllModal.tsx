'use client'
import { useRef, useState } from 'react'
import { Category } from '@/types'
import StickerCard from './StickerCard'

interface Props {
  categories: Category[]
  onClose: () => void
}

type Format = 'sticker' | 'full'

const SIZES: { mm: number; label: string; hint: string }[] = [
  { mm: 45, label: 'Liten',    hint: '45 mm' },
  { mm: 60, label: 'Standard', hint: '60 mm' },
  { mm: 90, label: 'Stor',     hint: '90 mm' },
]

const COLORS = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

export default function PrintAllModal({ categories, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const [format,    setFormat]    = useState<Format>('sticker')
  const [widthMm,   setWidthMm]   = useState(60)
  const [showBadge, setShowBadge] = useState(true)
  const [useColor,  setUseColor]  = useState(false)
  const [color,     setColor]     = useState(COLORS[0])

  const fullPage = format === 'full'
  const override = useColor ? color : null

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Alle stickere — QR Admin</title>
          <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: sans-serif; }
            /* flex-wrap fordi stickere med infoliste er bredere enn de uten */
            .grid {
              display: flex;
              flex-wrap: wrap;
              align-items: flex-start;
              gap: ${fullPage ? '0' : '8mm'};
              padding: ${fullPage ? '0' : '10mm'};
            }
            .sticker-card { break-inside: avoid; page-break-inside: avoid; }
            ${fullPage ? `
            /* ett ark per QR-kode */
            .grid > .sticker-card { page-break-after: always; }
            .grid > .sticker-card:last-child { page-break-after: auto; }
            ` : ''}
            @page { size: A4 portrait; margin: ${fullPage ? '10mm' : '5mm'}; }
          </style>
        </head>
        <body><div class="grid">${content.innerHTML}</div></body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 700)
  }

  // A4-arket er 190mm (~718px) bredt — skaleres ned i forhåndsvisningen
  const previewScale = 0.22

  const sectionLabel = (txt: string) => (
    <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em',
      color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 8 }}>
      {txt}
    </p>
  )

  const chip = (active: boolean) => ({
    backgroundColor: active ? 'var(--black)' : 'var(--gray-50)',
    color:           active ? 'var(--white)' : 'var(--muted)',
    border:          `1.5px solid ${active ? 'var(--black)' : 'var(--border)'}`,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,15,15,0.7)' }}>
      <div className="animate-fade-up w-full max-w-2xl rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="p-8 pb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl" style={{ fontWeight: 700 }}>Print alle stickere</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 2 }}>
              {categories.length} QR-koder — {fullPage ? 'ett ark per kode' : `${widthMm} mm, fyller arket radvis`}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.25rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Innstillinger */}
        <div className="px-8 pb-5 space-y-5" style={{ borderBottom: '1px solid var(--border)' }}>

          {/* Format */}
          <div>
            {sectionLabel('FORMAT')}
            <div className="flex gap-2">
              {([
                { key: 'sticker' as Format, label: 'Klistremerker', hint: 'flere per ark' },
                { key: 'full'    as Format, label: 'Helt ark',      hint: 'ett per ark'   },
              ]).map(f => (
                <button key={f.key} onClick={() => setFormat(f.key)}
                  className="flex-1 rounded-xl py-2.5 text-sm transition-all"
                  style={chip(format === f.key)}>
                  {f.label}
                  <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7 }}>{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Størrelse — kun relevant for klistremerker */}
          {!fullPage && (
            <div>
              {sectionLabel('STØRRELSE')}
              <div className="flex gap-2">
                {SIZES.map(s => (
                  <button key={s.mm} onClick={() => setWidthMm(s.mm)}
                    className="flex-1 rounded-xl py-2.5 text-sm transition-all"
                    style={chip(widthMm === s.mm)}>
                    {s.label}
                    <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.7 }}>{s.hint}</span>
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 6 }}>
                QR-koder med infoliste blir automatisk bredere for å få plass til teksten.
              </p>
            </div>
          )}

          {/* Badge */}
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)' }}>Hylle-badge</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Fargefeltet med hyllenummer øverst</p>
            </div>
            <button onClick={() => setShowBadge(b => !b)} role="switch" aria-checked={showBadge}
              className="rounded-full transition-all shrink-0"
              style={{ width: 46, height: 26, padding: 3,
                backgroundColor: showBadge ? 'var(--black)' : 'var(--gray-200)' }}>
              <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%',
                backgroundColor: 'var(--white)', transform: showBadge ? 'translateX(20px)' : 'none',
                transition: 'transform 0.15s' }} />
            </button>
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
              <button onClick={() => setUseColor(v => !v)} role="switch" aria-checked={useColor}
                className="rounded-full transition-all shrink-0"
                style={{ width: 46, height: 26, padding: 3,
                  backgroundColor: useColor ? 'var(--black)' : 'var(--gray-200)' }}>
                <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: 'var(--white)', transform: useColor ? 'translateX(20px)' : 'none',
                  transition: 'transform 0.15s' }} />
              </button>
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

        {/* Forhåndsvisning */}
        <div className="overflow-y-auto px-8 py-5 flex-1">
          {fullPage ? (
            // Skalert ned, men markupen som printes er i full størrelse
            <div style={{ height: 1047 * previewScale * Math.min(categories.length, 3) + 16, overflow: 'hidden' }}>
              <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left', width: 718 }}>
                <div ref={printRef}>
                  {categories.map(cat => (
                    <StickerCard key={cat.id} category={cat} fullPage
                      showBadge={showBadge} overrideColor={override} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div ref={printRef}
              style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '12px' }}>
              {categories.map(cat => (
                <StickerCard key={cat.id} category={cat} forPrint
                  widthMm={widthMm} showBadge={showBadge} overrideColor={override} />
              ))}
            </div>
          )}
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
            <span>🖨</span> Print {categories.length} QR-koder
          </button>
        </div>
      </div>
    </div>
  )
}
