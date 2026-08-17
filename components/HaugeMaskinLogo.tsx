import { HM_RED } from '@/lib/labelTheme'

/**
 * HM-merket til Hauge Maskin.
 *
 * Konturene er vektorisert fra den originale logofila («hm logo.png»), så
 * formen er identisk med merkevaren — avviket mot originalen er 0,7 % av
 * pikslene, og det er bare antialias-kanten. Tre flater: den sorte silhuetten
 * med 3D-skyggen (H-en og M-en er stanset ut som hull), den hvite H-flaten og
 * den røde M-flaten.
 *
 * Logoen må være inline SVG og ikke en <img>: utskriften åpnes i et tomt vindu
 * der innholdet kopieres inn som HTML, og da rekker ikke en bildefil å lastes
 * før print-dialogen kommer. Inline SVG er dessuten skarp i alle størrelser og
 * legger bare ~1 kB på hver etikett.
 */
interface Props {
  /** Høyde som CSS-verdi, f.eks. '6mm' eller '18px'. Bredden regnes ut selv. */
  height: string
}

const SORT = 'M362.1,0L518.9,0L560.5,54.2L543.1,114.2L659.2,114.2L693.1,154.9L694.1,208.1L702.8,206.2L757,115.2L960.3,116.2L1000,175.2L864.5,602.1L707.6,602.1L694.1,569.2L680.5,569.2L669.9,602.1L540.2,602.1L517.9,569.2L504.4,571.2L494.7,602.1L334.9,602.1L295.3,551.8L312.7,492.7L232.3,492.7L221.7,458.9L184.9,458.9L192.6,492.7L28.1,490.8L0,429.8L138.4,3.9L301.1,1L331.1,42.6L341.7,40.7ZM371.7,17.4L322.4,158.8L241,157.8L284.6,18.4L151,18.4L17.4,426.9L159.7,426.9L212,262.3L288.5,262.3L233.3,426.9L371.7,426.9L505.3,21.3ZM531.5,137.5L416.3,489.8L346.6,490.8L331.1,536.3L448.2,536.3L533.4,271.1L546,270.1L523.7,537.3L620.5,537.3L771.5,268.2L785.1,266.2L698,536.3L819.9,537.3L942.9,137.5L764.8,137.5L638.9,359.1L627.3,355.3L641.8,137.5Z'
const HVIT = 'M371.7,17.4L505.3,17.4L371.7,426.9L233.3,426.9L288.5,262.3L211,263.3L159.7,426.9L17.4,426.9L151,18.4L284.6,18.4L241,157.8L322.4,158.8Z'
const ROD  = 'M531.5,137.5L641.8,137.5L627.3,359.1L641.8,355.3L764.8,137.5L942.9,137.5L819.9,537.3L698,536.3L785.1,266.2L771.5,268.2L620.5,537.3L523.7,537.3L546,270.1L533.4,271.1L448.2,536.3L331.1,536.3L346.6,490.8L416.3,489.8Z'

/** Bredde/høyde på logoen — brukes også av StickerCard til plassregningen */
export const LOGO_RATIO = 1000 / 602.1

export default function HaugeMaskinLogo({ height }: Props) {
  return (
    <svg
      viewBox="0 0 1000 602.1"
      role="img"
      aria-label="Hauge Maskin"
      style={{
        height,
        width: `calc(${height} * ${Math.round(LOGO_RATIO * 1000) / 1000})`,
        display: 'block',
        flexShrink: 0,
      }}
    >
      <path d={SORT} fill="#000000" />
      <path d={HVIT} fill="#ffffff" />
      <path d={ROD} fill={HM_RED} />
    </svg>
  )
}
