import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LABEL_THEMES, getTheme, HM_RED, SVART, HVIT, tekstPå,
  lesUtskriftValg, lagreUtskriftValg, STANDARD_VALG,
  type LabelThemeId,
} from './labelTheme.ts'

const NYE: LabelThemeId[] = [
  'bjelke', 'sperre', 'mork', 'kontur', 'minimal', 'teknisk',
  'skilt', 'stort', 'stripe', 'klipp', 'ramme', 'topp',
]

test('tolv nye design i tillegg til Standard og Hauge Maskin', () => {
  assert.deepEqual(LABEL_THEMES.map(t => t.id), ['plain', 'hauge', ...NYE])
  assert.equal(new Set(LABEL_THEMES.map(t => t.name)).size, LABEL_THEMES.length)
})

test('de nye designene bruker bare rødt, svart og hvitt', () => {
  for (const id of NYE) {
    const t = getTheme(id)
    for (const farge of [t.accent, t.border]) {
      if (farge !== null) assert.ok([HM_RED, SVART, HVIT].includes(farge), `${id}: ${farge}`)
    }
    assert.notEqual(t.accent, null, `${id} må ha fast farge, ikke QR-kodens egen`)
  }
})

test('Standard beholder QR-kodens egen farge', () => {
  assert.equal(getTheme('plain').accent, null)
})

test('logoen er et valg ved utskrift, ikke låst til designet', () => {
  for (const t of LABEL_THEMES) {
    assert.equal('logo' in t, false, `${t.id} har fortsatt et eget logoflagg`)
    assert.ok(['foot', 'head'].includes(t.logoSlot), `${t.id}: ${t.logoSlot}`)
  }
})

test('tekst på fargefelt: hvit på mørke farger, svart på lyse', () => {
  assert.equal(tekstPå(HM_RED), HVIT)
  assert.equal(tekstPå('#2563eb'), HVIT)
  assert.equal(tekstPå(SVART), HVIT)
  assert.equal(tekstPå('#eab308'), SVART)
  assert.equal(tekstPå(HVIT), SVART)
})

test('husket utskriftsvalg: standard når lageret mangler eller feiler', () => {
  assert.deepEqual(lesUtskriftValg(null), STANDARD_VALG)
  assert.deepEqual(lesUtskriftValg({ getItem: () => { throw new Error('blokkert') } }), STANDARD_VALG)
  assert.deepEqual(lesUtskriftValg({ getItem: () => 'ikke json' }), STANDARD_VALG)
  assert.deepEqual(lesUtskriftValg({ getItem: () => null }), STANDARD_VALG)
})

test('husket utskriftsvalg: leser lagret design og logo', () => {
  const lager = { getItem: () => JSON.stringify({ design: 'mork', logo: false }) }
  assert.deepEqual(lesUtskriftValg(lager), { design: 'mork', logo: false })
})

test('husket utskriftsvalg: ukjent design faller tilbake, logovalget beholdes', () => {
  const lager = { getItem: () => JSON.stringify({ design: 'finnes-ikke', logo: false }) }
  assert.deepEqual(lesUtskriftValg(lager), { design: STANDARD_VALG.design, logo: false })
})

test('lagring av utskriftsvalg: skriver JSON og kaster aldri', () => {
  assert.doesNotThrow(() =>
    lagreUtskriftValg({ design: 'mork', logo: true }, { setItem: () => { throw new Error('fullt') } }))
  let lagret = ''
  lagreUtskriftValg({ design: 'topp', logo: false }, { setItem: (_nøkkel, verdi) => { lagret = verdi } })
  assert.deepEqual(JSON.parse(lagret), { design: 'topp', logo: false })
})
