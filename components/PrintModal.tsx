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
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Sticker — ${category.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;700&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
            @media print { @page { margin: 5mm; } }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,15,15,0.7)' }}>
      <div className="animate-fade-up w-full max-w-sm rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl" style={{ fontWeight: 700 }}>Print sticker</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 2 }}>{category.name}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.25rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Preview */}
        <div className="flex justify-center mb-6" ref={printRef}>
          <StickerCard category={category} size={140} forPrint={false} />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-70"
            style={{ backgroundColor: 'var(--paper-dark)', color: 'var(--ink)' }}
          >
            Lukk
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 rounded-xl py-3 text-sm font-medium transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--ink)', color: 'var(--paper)', fontFamily: 'Syne, sans-serif', fontWeight: 600 }}
          >
            <span>🖨</span> Print
          </button>
        </div>
      </div>
    </div>
  )
}
