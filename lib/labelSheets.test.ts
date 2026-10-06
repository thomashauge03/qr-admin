import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LABEL_SHEETS, A4, SKRIVERKANT, kantVern, lagEgetArk, lesEgetArk, lagreEgetArk, STANDARD_EGET,
  type LabelSheet,
} from './labelSheets.ts'

const EPS = 0.01
const høyre = (s: LabelSheet) => A4.w - (s.marginLeft + (s.cols - 1) * s.pitchX + s.w)
const bunn = (s: LabelSheet) => A4.h - (s.marginTop + (s.rows - 1) * s.pitchY + s.h)
const ark = (id: string) => LABEL_SHEETS.find(s => s.id === id)!

test('alle etikettene ligger innenfor A4-arket', () => {
  for (const s of LABEL_SHEETS) {
    assert.ok(s.marginLeft >= -EPS && s.marginTop >= -EPS, s.id)
    assert.ok(høyre(s) >= -EPS, `${s.id}: ${(-høyre(s)).toFixed(2)} mm for bredt`)
    assert.ok(bunn(s) >= -EPS, `${s.id}: ${(-bunn(s)).toFixed(2)} mm for høyt`)
    assert.ok(s.pitchX >= s.w - EPS && s.pitchY >= s.h - EPS, `${s.id}: etikettene overlapper`)
  }
})

test('navnet sier antallet og høyden arket faktisk har', () => {
  for (const s of LABEL_SHEETS) {
    assert.ok(s.name.includes(String(s.cols * s.rows)), `${s.id}: «${s.name}» mangler antallet`)
    assert.ok(s.name.includes(String(Math.floor(s.h))), `${s.id}: «${s.name}» mangler høyden ${s.h}`)
  }
})

test('produsentarkene er sentrert på A4, slik de stanses', () => {
  for (const s of LABEL_SHEETS.filter(s => s.gruppe !== 'kant')) {
    assert.ok(Math.abs(s.marginLeft - høyre(s)) <= 0.3,
      `${s.id}: venstre ${s.marginLeft} mm, høyre ${høyre(s).toFixed(2)} mm`)
    assert.ok(Math.abs(s.marginTop - bunn(s)) <= 0.3,
      `${s.id}: topp ${s.marginTop} mm, bunn ${bunn(s).toFixed(2)} mm`)
  }
})

test('Avery L7169 har produsentens marger: 9,5 mm topp og 4,65 mm side', () => {
  assert.equal(ark('l7169').marginTop, 9.5)
  assert.equal(ark('l7169').marginLeft, 4.65)
})

test('24 per ark er 3 × 8 etiketter på 70 × 37,125 mm', () => {
  const s = ark('a4-24')
  assert.equal(s.cols * s.rows, 24)
  assert.ok(Math.abs(s.h - 297 / 8) < 0.001, `høyde ${s.h}`)
})

test('de vanlige Zweckform- og Avery-arkene som manglet, finnes', () => {
  for (const id of ['z3425', 'z3424', 'z3426', 'z3423', 'z3481', 'z3475', 'z3422',
    'l7173', 'l7166', 'l7162', 'l7161', 'l7159']) {
    assert.ok(LABEL_SHEETS.some(s => s.id === id), id)
  }
})

test('kantvern: etiketter mot arkkanten får skriverens døde sone, de andre ingenting', () => {
  assert.deepEqual(kantVern(ark('a4-8'), 0), { t: SKRIVERKANT, r: 0, b: 0, l: SKRIVERKANT })
  assert.deepEqual(kantVern(ark('a4-8'), 7), { t: 0, r: SKRIVERKANT, b: SKRIVERKANT, l: 0 })
  // En etikett midt på arket
  assert.deepEqual(kantVern(ark('a4-40'), 5), { t: 0, r: 0, b: 0, l: 0 })
  // Justering mot kanten skyver etiketten lenger inn i sonen
  const før = kantVern(ark('l7165'), 0)
  const etter = kantVern(ark('l7165'), 0, -1, 0)
  assert.ok(Math.abs(etter.l - før.l - 1) < EPS, `venstre ${før.l} → ${etter.l}`)
})

test('skriverkanten dekker standardskriveren, som ikke når de ytterste 5,0–5,08 mm', () => {
  // KONICA MINOLTA bizhub C224e: 5,00 venstre og topp, 5,08 høyre, 4,91 bunn
  assert.ok(SKRIVERKANT >= 5.08 + 0.3, `${SKRIVERKANT} mm`)
})

test('egendefinert ark: gyldige mål gir et ark, ugyldige gir en forklaring', () => {
  const ok = lagEgetArk({ w: 100, h: 50, cols: 2, rows: 5, marginTop: 10, marginLeft: 4, gapX: 2, gapY: 2 })
  assert.ok('ark' in ok)
  if ('ark' in ok) {
    assert.equal(ok.ark.id, 'egen')
    assert.equal(ok.ark.pitchX, 102)
    assert.equal(ok.ark.pitchY, 52)
  }
  const forBredt = lagEgetArk({ w: 106, h: 50, cols: 2, rows: 5, marginTop: 0, marginLeft: 0, gapX: 0, gapY: 0 })
  assert.ok('feil' in forBredt && /bred/i.test(forBredt.feil), JSON.stringify(forBredt))
  const forHøyt = lagEgetArk({ w: 100, h: 60, cols: 2, rows: 5, marginTop: 10, marginLeft: 0, gapX: 0, gapY: 0 })
  assert.ok('feil' in forHøyt && /høy/i.test(forHøyt.feil), JSON.stringify(forHøyt))
  assert.ok('feil' in lagEgetArk({ ...STANDARD_EGET, w: 0 }))
  assert.ok('feil' in lagEgetArk({ ...STANDARD_EGET, cols: 0 }))
  assert.ok('feil' in lagEgetArk({ ...STANDARD_EGET, marginTop: -1 }))
})

test('standardmålene for eget ark er et gyldig ark', () => {
  assert.ok('ark' in lagEgetArk(STANDARD_EGET))
})

test('egendefinert ark huskes, og noe ugyldig i lageret gir standardmålene', () => {
  let lagret = ''
  lagreEgetArk({ ...STANDARD_EGET, w: 70, cols: 3 }, { setItem: (_k, v) => { lagret = v } })
  assert.deepEqual(lesEgetArk({ getItem: () => lagret }), { ...STANDARD_EGET, w: 70, cols: 3 })
  assert.deepEqual(lesEgetArk({ getItem: () => 'tull' }), STANDARD_EGET)
  assert.deepEqual(lesEgetArk({ getItem: () => JSON.stringify({ w: 'x' }) }), STANDARD_EGET)
  assert.deepEqual(lesEgetArk({ getItem: () => { throw new Error('blokkert') } }), STANDARD_EGET)
  assert.deepEqual(lesEgetArk(null), STANDARD_EGET)
  assert.doesNotThrow(() => lagreEgetArk(STANDARD_EGET, { setItem: () => { throw new Error('fullt') } }))
})
