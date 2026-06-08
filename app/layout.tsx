import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'QR Admin — Butikkstyring',
  description: 'Administrer QR-koder og kategorier for butikken',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body>{children}</body>
    </html>
  )
}
