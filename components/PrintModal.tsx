'use client'
import { useRef, useState } from 'react'
import { Category } from '@/types'
import { LABEL_THEMES, LabelThemeId, DEFAULT_THEME } from '@/lib/labelTheme'
import StickerCard from './StickerCard'
import HaugeMaskinLogo from './HaugeMaskinLogo'

interface Props {
  category: Category
  onClose: () => void
}

type Layout = 'sticker' | 'full'

export default function PrintModal({ category, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<Layout>('sticker')
  const [themeId, setThemeId] = useState<LabelThemeId>(DEFAULT_THEME.id)
  const fullPage = layout === 'full'
  const hasInfo = (category.info_lines || []).length > 0

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head>
        <title>${fullPage ? 'A4' : 'Sticker'} — ${category.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          /* print-color-adjust: ellers dropper skriveren bakgrunnsfargene, og
             nummer-badgen kommer ut som grå tekst på hvitt i stedet for rød */
          * { margin:0; padding:0; box-sizing:border-box;
              -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { display:flex; align-items:center; justify-content:center; min-height:100vh; background:white; }
          @page { size: A4 portrait; margin: ${fullPage ? '10mm' : '5mm'}; }
        </style>
      </head><body>${content.innerHTML}</body></html>
    `)
    win.document.close()
    win.focus()
    // Vent på at logoen er dekodet før print-dialogen åpnes
    Promise.all([
      new Promise(r => setTimeout(r, 700)),
      ...Array.from(win.document.images).map(img =>
        img.complete ? null : new Promise(r => { img.onload = img.onerror = r })),
    ]).then(() => { win.print(); win.close() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 anim-fade-in"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="anim-scale-in w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
              Print sticker
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>{category.name}</p>
          </div>
          <button onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            style={{ width: 32, height: 32, color: 'var(--muted)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Layout-valg */}
        <div className="flex gap-2 px-6 pt-5">
          {([
            { key: 'sticker' as Layout, label: 'Klistremerke', hint: hasInfo ? '90 mm' : '60 mm' },
            { key: 'full' as Layout, label: 'Helt ark', hint: 'A4' },
          ]).map(opt => (
            <button
              key={opt.key}
              onClick={() => setLayout(opt.key)}
              className="flex-1 rounded-xl py-2.5 text-sm transition-all"
              style={{
                backgroundColor: layout === opt.key ? 'var(--black)' : 'var(--gray-100)',
                color: layout === opt.key ? 'var(--white)' : 'var(--ink)',
                fontWeight: layout === opt.key ? 600 : 500,
              }}>
              {opt.label}
              <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.6, fontWeight: 400 }}>
                {opt.hint}
              </span>
            </button>
          ))}
        </div>

        {/* Tema */}
        <div className="flex gap-2 px-6 pt-2">
          {LABEL_THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              className="flex-1 rounded-xl py-2.5 text-sm transition-all"
              style={{
                backgroundColor: themeId === t.id ? 'var(--black)' : 'var(--gray-100)',
                color: themeId === t.id ? 'var(--white)' : 'var(--ink)',
                fontWeight: themeId === t.id ? 600 : 500,
              }}>
              <span className="flex items-center justify-center gap-2">
                {t.logo && <HaugeMaskinLogo height="13px" />}
                {t.name}
              </span>
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="flex justify-center px-6 py-6">
          {fullPage ? (
            // A4-arket er 190mm (~718px) bredt — skaler ned til forhåndsvisning
            <div style={{ width: 718 * 0.32, height: 1047 * 0.32, overflow: 'hidden' }}>
              <div style={{ transform: 'scale(0.32)', transformOrigin: 'top left', width: 718 }}>
                <div ref={printRef}>
                  <StickerCard category={category} fullPage theme={themeId} />
                </div>
              </div>
            </div>
          ) : (
            <div ref={printRef}>
              <StickerCard category={category} size={200} forPrint theme={themeId} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose}
            className="flex-1 rounded-xl py-3 text-sm font-medium transition-colors hover:bg-gray-50"
            style={{ backgroundColor: 'var(--gray-100)', color: 'var(--ink)' }}>
            Lukk
          </button>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: 'var(--black)', color: 'var(--white)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <rect x="6" y="14" width="12" height="8"/>
            </svg>
            Print
          </button>
        </div>
      </div>
    </div>
  )
}
