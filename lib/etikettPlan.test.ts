import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planEtikett, qrRuter, velgNivå, QR_RUTER, MIN_RUTE_MM, type EtikettPlan } from './etikettPlan.ts'
import { LABEL_THEMES } from './labelTheme.ts'
import { LABEL_SHEETS, SKRIVERKANT, utskrivbar } from './labelSheets.ts'

const EPS = 1e-6

// Alle etikettark, pluss miniatyren i designvelgeren
const FORMATER = [...LABEL_SHEETS.map(s => ({ id: s.id, w: s.w, h: s.h })), { id: 'velger', w: 42, h: 58 }]

function alle(): [string, EtikettPlan][] {
  const ut: [string, EtikettPlan][] = []
  for (const theme of LABEL_THEMES)
    for (const f of FORMATER)
      for (const logo of [true, false])
        for (const showBadge of [true, false])
          for (const hasInfo of [true, false]) {
            const navn = `${theme.id} ${f.id} logo=${logo} badge=${showBadge} info=${hasInfo}`
            ut.push([navn, planEtikett({ w: f.w, h: f.h, theme, logo, showBadge, hasInfo })])
          }
  return ut
}

/**
 * Hjørnerutene på hvert ark — de som ligger mot to arkkanter samtidig. Der
 * tegnes etiketten bare på delen skriveren når, så den er mindre enn ruta.
 */
function hjørner(): [string, EtikettPlan][] {
  const ut: [string, EtikettPlan][] = []
  for (const s of LABEL_SHEETS) {
    const n = s.cols * s.rows
    const ruter = [0, s.cols - 1, n - s.cols, n - 1].filter((r, i, alle) => alle.indexOf(r) === i)
    for (const i of ruter) {
      const f = utskrivbar(s, i)
      for (const theme of LABEL_THEMES)
        for (const logo of [true, false])
          for (const hasInfo of [true, false]) {
            const navn = `${theme.id} ${s.id} rute=${i} logo=${logo} info=${hasInfo}`
            ut.push([navn, planEtikett({ w: f.w, h: f.h, celleH: s.h, theme, logo, showBadge: true, hasInfo })])
          }
    }
  }
  return ut
}

const passer = (navn: string, p: EtikettPlan) => {
  const brukt = p.blokker.reduce((sum, b) => sum + b.over + b.h, 0)
  assert.ok(brukt <= p.innerH + EPS, `${navn}: ${brukt.toFixed(2)} > ${p.innerH.toFixed(2)} mm`)
  for (const b of p.blokker) assert.ok(b.h >= 0 && b.over >= 0, `${navn}: ${b.type} er negativ`)
  assert.ok(p.qrSide <= p.innerH + EPS, `${navn}: QR høyere enn etiketten`)
  const bredde = p.landscape ? p.qrSide + p.gap + p.textW : p.qrSide
  assert.ok(bredde <= p.innerW + EPS, `${navn}: QR og tekst er bredere enn etiketten`)
}

test('blokkene tar aldri mer plass enn etiketten har', () => {
  for (const [navn, p] of alle()) passer(navn, p)
})

test('QR-koden blir ikke presset for liten i forhold til etiketten', () => {
  for (const [navn, p] of alle()) {
    const minst = Math.min(p.innerW, p.innerH) * 0.3
    assert.ok(p.qrSide >= minst, `${navn}: QR ${p.qrSide.toFixed(1)} mm < ${minst.toFixed(1)} mm`)
  }
})

test('QR-koden har minst 0,3 mm per rute på alle ark, med stillesonen regnet med', () => {
  for (const [navn, p] of alle()) {
    if (navn.includes(' velger ')) continue
    const rute = p.qrSvg / QR_RUTER
    assert.ok(rute >= MIN_RUTE_MM - EPS, `${navn}: ${rute.toFixed(3)} mm per rute`)
  }
  for (const [navn, p] of hjørner()) {
    const rute = p.qrSvg / QR_RUTER
    assert.ok(rute >= MIN_RUTE_MM - EPS, `${navn}: ${rute.toFixed(3)} mm per rute`)
  }
})

test('stående etikett har QR-en med i stabelen, liggende har den ved siden av', () => {
  for (const [navn, p] of alle()) {
    const qr = p.blokker.find(b => b.type === 'qr')
    if (p.landscape) assert.equal(qr, undefined, navn)
    else assert.equal(qr?.h, p.qrSide, navn)
  }
})

test('logoen havner der designet vil ha den, og bare når den er slått på', () => {
  for (const [navn, p] of alle()) {
    const [id, , logo] = navn.split(' ')
    const plass = LABEL_THEMES.find(t => t.id === id)!.logoSlot
    assert.equal(p.logoIn, logo === 'logo=true' ? plass : null, navn)
    assert.equal(p.blokker.some(b => b.type === 'head'), p.logoIn === 'head', navn)
  }
})

test('ramme, sidestripe og luft er trukket fra før blokkene fordeles', () => {
  for (const [navn, p] of alle()) {
    const [id, format] = navn.split(' ')
    const f = FORMATER.find(x => x.id === format)!
    const w = f.w - p.frame.l - p.frame.r - p.pad.l - p.pad.r - p.stripe
    const h = f.h - p.frame.t - p.frame.b - p.pad.t - p.pad.b
    assert.ok(Math.abs(p.innerW - w) < EPS, `${navn}: bredde`)
    assert.ok(Math.abs(p.innerH - h) < EPS, `${navn}: høyde`)
    if (LABEL_THEMES.find(t => t.id === id)!.sideStripe) assert.ok(p.stripe > 0, navn)
  }
})

test('etikettene i arkhjørnene får plass til alt på delen skriveren når', () => {
  for (const [navn, p] of hjørner()) passer(navn, p)
})

test('alle etikettene på et ark viser det samme, også de som tegnes mindre mot arkkanten', () => {
  const t = LABEL_THEMES[0]
  for (const s of LABEL_SHEETS) {
    const hel = planEtikett({ w: s.w, h: s.h, theme: t, logo: true, showBadge: true, hasInfo: false })
    for (let i = 0; i < s.cols * s.rows; i++) {
      const f = utskrivbar(s, i)
      const p = planEtikett({ w: f.w, h: f.h, celleH: s.h, theme: t, logo: true, showBadge: true, hasInfo: false })
      assert.equal(p.showDesc, hel.showDesc, `${s.id} rute ${i}: beskrivelse`)
      assert.equal(p.showId, hel.showId, `${s.id} rute ${i}: ID`)
    }
  }
})

test('egne formater: alt får plass på alle størrelser fra 25 × 15 mm til helt A4', () => {
  for (const w of [25, 38, 52.5, 70, 99.1, 105, 150, 190, 210])
    for (const h of [15, 21.2, 29.7, 38.1, 57, 74.25, 99, 148.5, 210, 297])
      for (const theme of LABEL_THEMES)
        for (const logo of [true, false])
          for (const hasInfo of [true, false]) {
            const p = planEtikett({ w, h, theme, logo, showBadge: true, hasInfo })
            passer(`${theme.id} ${w}×${h} logo=${logo} info=${hasInfo}`, p)
          }
})

test('egne formater: QR-rutene blir minst 0,3 mm på vanlige etikettstørrelser, også i arkhjørnet', () => {
  // Dymo, Brother, fraktetiketter og smale stående lapper — mål folk skriver inn under «Eget format»
  const mål = [[40, 30], [50, 25], [57, 32], [62, 29], [89, 28], [89, 36], [70, 50], [100, 70], [102, 76],
    [148, 105], [102, 152], [54, 101], [50, 80], [40, 70], [30, 60]]
  for (const [w, h] of mål)
    // Midt på arket, og i hjørnet der skriverkanten tar en bit av to sider
    for (const sone of [0, SKRIVERKANT])
      for (const theme of LABEL_THEMES)
        for (const logo of [true, false])
          for (const hasInfo of [true, false]) {
            const p = planEtikett({ w: w - sone, h: h - sone, celleH: h, theme, logo, showBadge: true, hasInfo })
            const navn = `${theme.id} ${w}×${h} sone=${sone} logo=${logo} info=${hasInfo}`
            passer(navn, p)
            const rute = p.qrSvg / QR_RUTER
            assert.ok(rute >= MIN_RUTE_MM - EPS, `${navn}: ${rute.toFixed(3)} mm per rute`)
          }
})

test('«Nummer nederst» har nummerfeltet under navnet', () => {
  const t = LABEL_THEMES.find(x => x.id === 'nederst')!
  const p = planEtikett({ w: 105, h: 148.5, theme: t, logo: true, showBadge: true, hasInfo: false })
  const typer = p.blokker.map(b => b.type)
  assert.ok(typer.indexOf('badge') > typer.indexOf('name'), typer.join(','))
  assert.ok(typer.indexOf('qr') < typer.indexOf('name'), typer.join(','))
})

const json = (navn: string, shelf = 'A2') =>
  JSON.stringify({ id: '3f9a1c22-0000-4000-8000-000000000001', name: navn, shelf })
// Verste tilfelle fra kontrollen av alle formater: 125 byte, versjon 8 på nivå M
const LANGT = json('Hydraulisk pigghammer for minigraver 1,5–3 tonn', 'HM-10423-B')

test('QR: antall ruter med stillesone følger versjonen innholdet krever', () => {
  // 14 byte er versjon 1 på nivå M: 21 ruter + 2 × 4 stillesone
  assert.equal(qrRuter('a'.repeat(14), 'M'), 29)
  assert.equal(qrRuter('a'.repeat(15), 'M'), 33)
  // Et vanlig navn i JSON: versjon 5 (37 ruter)
  assert.equal(qrRuter(json('Volvo dumpere'), 'M'), 45)
})

test('QR: æ, ø og å teller to byte hver', () => {
  assert.equal(qrRuter('æ'.repeat(7), 'M'), 29)
  assert.equal(qrRuter('æ'.repeat(8), 'M'), 33)
})

test('QR: lavere feilretting gir færre og større ruter for langt innhold', () => {
  assert.equal(qrRuter(LANGT, 'M'), 57)
  assert.equal(qrRuter(LANGT, 'L'), 49)
})

test('QR: nivå M beholdes når rutene blir store nok, ellers L', () => {
  // 17 mm: M gir 0,298 mm per rute, L gir 0,347
  const smal = velgNivå(LANGT, 17)
  assert.equal(smal.nivå, 'L')
  assert.ok(smal.ruteMm >= MIN_RUTE_MM)
  assert.equal(velgNivå(LANGT, 30).nivå, 'M')
  // Kort innhold på liten kode: M holder
  assert.equal(velgNivå(json('Volvo dumpere'), 15).nivå, 'M')
})

test('QR: innhold som ikke får plass i noen versjon gir største versjon', () => {
  assert.equal(qrRuter('x'.repeat(5000), 'M'), 177 + 8)
})

test('hengelappen har plass til hullet øverst, uten å gå ut over innholdet', () => {
  const t = LABEL_THEMES.find(x => x.id === 'hengelapp')!
  for (const f of FORMATER) {
    const p = planEtikett({ w: f.w, h: f.h, theme: t, logo: true, showBadge: true, hasInfo: false })
    assert.ok(p.hull > 0, f.id)
    assert.ok(p.pad.t >= p.pad.b + p.hull - EPS, `${f.id}: ${p.pad.t} < ${p.pad.b} + ${p.hull}`)
  }
})

test('kraftig og varselramme er tykkere enn den vanlige rammen', () => {
  for (const id of ['kraftig', 'kraftigrod', 'varsel', 'varselsvart']) {
    const t = LABEL_THEMES.find(x => x.id === id)!
    const p = planEtikett({ w: 105, h: 74.25, theme: t, logo: true, showBadge: true, hasInfo: false })
    assert.ok(p.frame.t >= 1.5 && p.frame.l >= 1.5, `${id}: ${p.frame.t}`)
  }
})

test('design med bunnbånd har alltid en bunnrad, også uten logo og ID', () => {
  for (const t of LABEL_THEMES.filter(x => x.footBand)) {
    const p = planEtikett({ w: 52.5, h: 29.7, theme: t, logo: false, showBadge: true, hasInfo: false })
    assert.ok(p.blokker.some(b => b.type === 'foot'), t.id)
  }
})
