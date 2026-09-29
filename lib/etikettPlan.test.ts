import { test } from 'node:test'
import assert from 'node:assert/strict'
import { planEtikett, type EtikettPlan } from './etikettPlan.ts'
import { LABEL_THEMES } from './labelTheme.ts'
import { LABEL_SHEETS } from './labelSheets.ts'

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

test('blokkene tar aldri mer høyde enn etiketten har', () => {
  for (const [navn, p] of alle()) {
    const brukt = p.blokker.reduce((sum, b) => sum + b.over + b.h, 0)
    assert.ok(brukt <= p.innerH + EPS, `${navn}: ${brukt.toFixed(2)} > ${p.innerH.toFixed(2)} mm`)
    for (const b of p.blokker) assert.ok(b.h >= 0 && b.over >= 0, `${navn}: ${b.type} er negativ`)
  }
})

test('QR-koden holder seg innenfor rammen og blir ikke presset for liten', () => {
  for (const [navn, p] of alle()) {
    assert.ok(p.qrSide <= p.innerH + EPS, `${navn}: QR høyere enn etiketten`)
    const bredde = p.landscape ? p.qrSide + p.gap + p.textW : p.qrSide
    assert.ok(bredde <= p.innerW + EPS, `${navn}: QR og tekst er bredere enn etiketten`)
    const minst = Math.min(p.innerW, p.innerH) * 0.3
    assert.ok(p.qrSide >= minst, `${navn}: QR ${p.qrSide.toFixed(1)} mm < ${minst.toFixed(1)} mm`)
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
  const stripe = LABEL_THEMES.find(t => t.id === 'stripe')!
  const p = planEtikett({ w: 105, h: 74.25, theme: stripe, logo: true, showBadge: true, hasInfo: false })
  assert.ok(p.stripe > 0)
  assert.ok(Math.abs(p.innerW - (105 - 2 * p.pad - 2 * p.frame - p.stripe)) < EPS)
  assert.ok(Math.abs(p.innerH - (74.25 - 2 * p.pad - 2 * p.frame)) < EPS)
})
