'use client'
import { useRef } from 'react'
import { Category } from '@/types'
import StickerCard from './StickerCard'

interface Props {
  category: Category
  onClose: () => void
}

export default function PrintModal({ category, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head>
        <title>Sticker — ${category.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Syne:wght@700;800&family=Inter:wght@400;500&display=swap" rel="stylesheet">
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { display:flex; align-items:center; justify-content:center; min-height:100vh; background:white; }
          @media print { @page { margin:5mm; } }
        </style>
      </head><body>${content.innerHTML}</body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
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

        {/* Preview */}
        <div className="flex justify-center px-6 py-6" ref={printRef}>
          <StickerCard category={category} size={140} forPrint={false} />
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
