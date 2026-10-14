import { HM_LOGO_SRC } from '@/lib/hmLogo'
import { LOGO_RATIO } from '@/lib/etikettPlan'

/**
 * HM-merket til Hauge Maskin — selve originallogoen, se lib/hmLogo.ts.
 */
interface Props {
  /** Høyde som CSS-verdi, f.eks. '6mm' eller '18px'. Bredden regnes ut selv. */
  height: string
}

// Bredde/høyde på logoen. Står i etikettPlan, som regner plassen til den.
export { LOGO_RATIO }

export default function HaugeMaskinLogo({ height }: Props) {
  return (
    // Data-URI som må overleve kopieringen inn i utskriftsvinduet
    // eslint-disable-next-line @next/next/no-img-element
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
