import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Lukkar } from '@/components/Lukkar'

export const metadata: Metadata = {
  title: 'QR Admin — Butikkstyring',
  description: 'Administrer QR-koder og kategorier for butikken',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'QR Admin',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no">
      <body>
        {/* Først i body, så platene er malt før noe annet rekker å vises. */}
        <Lukkar />
        {children}
      </body>
    </html>
  )
}
