'use client'
import { useRef } from 'react'
import { Category } from '@/types'
import StickerCard from './StickerCard'

interface Props {
  categories: Category[]
  onClose: () => void
}

export default function PrintAllModal({ categories, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Alle stickere — QR Admin</title>
          <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;700&family=DM+Sans:wght@300;400&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: sans-serif; }
            .grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 8mm;
              padding: 10mm;
            }
            .sticker-card { break-inside: avoid; page-break-inside: avoid; }
            @media print { @page { margin: 5mm; } }
          </style>
        </head>
        <body><div class="grid">${content.innerHTML}</div></body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 700)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,15,15,0.7)' }}>
      <div className="animate-fade-up w-full max-w-2xl rounded-2xl shadow-2xl" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="p-8 pb-4 flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl" style={{ fontWeight: 700 }}>Print alle stickere</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: 2 }}>
              {categories.length} stickere — grid-layout (3 per rad)
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', fontSize: '1.25rem', lineHeight: 1 }}>✕</button>
        </div>

        {/* Preview grid */}
        <div className="overflow-y-auto px-8 pb-4 flex-1">
          <div
            ref={printRef}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}
          >
            {categories.map(cat => (
              <StickerCard key={cat.id} category={cat} size={100} forPrint={true} />
            ))}
          </div>
        </div>

        <div className="p-8 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
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
            <span>🖨</span> Print alle {categories.length} stickere
          </button>
        </div>
      </div>
    </div>
  )
}
