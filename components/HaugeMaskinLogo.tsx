import { HM_LOGO_SRC } from '@/lib/hmLogo'

/**
 * HM-merket til Hauge Maskin — selve originallogoen, se lib/hmLogo.ts.
 */
interface Props {
  /** Høyde som CSS-verdi, f.eks. '6mm' eller '18px'. Bredden regnes ut selv. */
  height: string
}

/** Bredde/høyde på logoen — brukes også av StickerCard til plassregningen */
export const LOGO_RATIO = 420 / 253

export default function HaugeMaskinLogo({ height }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- data-URI, må overleve
    // kopieringen inn i utskriftsvinduet
    <img
      src={HM_LOGO_SRC}
      alt="Hauge Maskin"
      style={{
        height,
        width: `calc(${height} * ${Math.round(LOGO_RATIO * 1000) / 1000})`,
        display: 'block',
        flexShrink: 0,
      }}
    />
  )
}
