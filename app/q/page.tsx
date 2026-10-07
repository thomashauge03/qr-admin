import type { Metadata } from 'next'
import Videresend from '@/components/Videresend'

// Adressen som står trykt i URL-kodene — se lib/videresending.ts
export const metadata: Metadata = {
  title: 'Hauge Maskin',
  robots: { index: false, follow: false },
}

export default function QPage() {
  return <Videresend />
}
