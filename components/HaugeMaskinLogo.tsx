import { HM_RED } from '@/lib/labelTheme'

/**
 * HM-merket til Hauge Maskin, tegnet som ren SVG.
 *
 * Logoen må være inline SVG og ikke en <img>: utskriften åpnes i et tomt vindu
 * der innholdet kopieres inn som HTML, og da rekker ikke en bildefil å lastes
 * før print-dialogen kommer. Inline SVG er dessuten skarp i alle størrelser.
 *
 * Bokstavene er kursive (skewX), hver med svart kontur og en forskjøvet svart
 * kopi bak seg som gir 3D-skyggen. M-en tegnes over H-en, slik som i logoen.
 */
interface Props {
  /** Høyde som CSS-verdi, f.eks. '6mm' eller '18px'. Bredden regnes ut selv. */
  height: string
}

// Bokstavene i eget koordinatsystem, 100 høye
const H_PATH = 'M0,0 H34 V40 H66 V0 H100 V100 H66 V62 H34 V100 H0 Z'
const M_PATH = 'M0,100 V0 H32 L65,62 L98,0 H130 V100 H104 V34 L65,98 L26,34 V100 Z'

// Konturen og skyggen må være tynne nok til at mothullene i M-en fortsatt er
// hvite når logoen printes i noen få millimeter.
const STROKE = 6
const SHADOW = 'translate(-2.5 5)'
const RATIO  = 256 / 152   // bredde/høyde på viewBox

export default function HaugeMaskinLogo({ height }: Props) {
  return (
    <svg
      viewBox="0 0 256 152"
      role="img"
      aria-label="Hauge Maskin"
      style={{
        height,
        width: `calc(${height} * ${Math.round(RATIO * 1000) / 1000})`,
        display: 'block',
        flexShrink: 0,
      }}
    >
      <g transform="translate(36 8) skewX(-14)" strokeLinejoin="miter">
        <g>
          <path d={H_PATH} transform={SHADOW} fill="#000000" stroke="#000000" strokeWidth={STROKE} />
          <path d={H_PATH} fill="#000000" stroke="#000000" strokeWidth={STROKE} />
          <path d={H_PATH} fill="#ffffff" />
        </g>
        <g transform="translate(88 26)">
          <path d={M_PATH} transform={SHADOW} fill="#000000" stroke="#000000" strokeWidth={STROKE} />
          <path d={M_PATH} fill="#000000" stroke="#000000" strokeWidth={STROKE} />
          <path d={M_PATH} fill={HM_RED} />
        </g>
      </g>
    </svg>
  )
}
