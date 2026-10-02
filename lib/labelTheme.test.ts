import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  LABEL_THEMES, LABEL_GRUPPER, getTheme, HM_RED, SVART, HVIT, tekstPå, kontrast, lesbarFarge,
  lesUtskriftValg, lagreUtskriftValg, STANDARD_VALG,
  type LabelThemeId,
} from './labelTheme.ts'

// Gruppe for gruppe, i samme rekkefølge som i designvelgeren
const ENKLE: LabelThemeId[] = [
  'plain', 'hauge', 'svarthvitt', 'kontur', 'svartkontur', 'minimal', 'minimalsvart',
  'teknisk', 'tekniskrod', 'millimeter', 'prikkpapir', 'nederst', 'storqr', 'storqrsvart',
]
const KRAFTIGE: LabelThemeId[] = [
  'bjelke', 'svartbjelke', 'stort', 'rammetnr', 'banner', 'rodbanner', 'topp',
  'rodtopp', 'rodbunn', 'svartbunn', 'svartrod', 'rodtoppbunn', 'todelt', 'todeltomvendt',
]
const MØRKE: LabelThemeId[] = [
  'mork', 'natt', 'nattbaand', 'negativ', 'morkbjelke', 'morkstripe', 'morkprikk',
  'morkfane', 'morkteknisk', 'morkstempel', 'skilt', 'rodflate', 'rodstabel', 'signal',
]
const RAMMER: LabelThemeId[] = [
  'ramme', 'rundramme', 'kraftig', 'kraftigrod', 'klassisk', 'dobbelrod', 'rammeiramme',
  'kutt', 'rodehjorner', 'baand', 'svartebaand', 'varsel', 'varselsvart', 'qrramme',
]
const FORMER: LabelThemeId[] = [
  'sperre', 'stripe', 'svartstripe', 'prikk', 'rute', 'svartrute', 'fane',
  'svartfane', 'stempel', 'svartstempel', 'pille', 'svartpille', 'hengelapp', 'klipp',
]
const ALLE = [...ENKLE, ...KRAFTIGE, ...MØRKE, ...RAMMER, ...FORMER]
// Alt utenom Standard, som beholder QR-kodens egen farge
const NYE = ALLE.filter(id => id !== 'plain' && id !== 'hauge')

test('70 design, med Standard først', () => {
  assert.equal(LABEL_THEMES.length, 70)
  assert.deepEqual(LABEL_THEMES.map(t => t.id), ALLE)
  assert.equal(LABEL_THEMES[0].id, 'plain')
  assert.equal(new Set(LABEL_THEMES.map(t => t.name)).size, LABEL_THEMES.length)
})

test('fem grupper med 14 design i hver', () => {
  assert.deepEqual(LABEL_GRUPPER.map(g => g.id), ['enkle', 'kraftige', 'morke', 'rammer', 'former'])
  const forventet = { enkle: ENKLE, kraftige: KRAFTIGE, morke: MØRKE, rammer: RAMMER, former: FORMER }
  for (const g of LABEL_GRUPPER) {
    assert.deepEqual(LABEL_THEMES.filter(t => t.gruppe === g.id).map(t => t.id), forventet[g.id], g.id)
    assert.ok(g.navn.length > 0, g.id)
  }
  assert.equal(new Set(LABEL_GRUPPER.map(g => g.navn)).size, LABEL_GRUPPER.length)
})

test('mørke design har svart eller rød bunn, de andre er på papir', () => {
  for (const t of LABEL_THEMES) {
    if (t.gruppe === 'morke') assert.notEqual(t.surface, 'paper', t.id)
    else assert.equal(t.surface, 'paper', t.id)
  }
})

test('de nye designene bruker bare rødt, svart og hvitt', () => {
  for (const id of NYE) {
    const t = getTheme(id)
    for (const farge of [t.accent, t.border, t.badgeColor ?? null, t.bandRule ?? null]) {
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

test('kontrast: svart på hvitt er 21, like farger er 1, rekkefølgen spiller ingen rolle', () => {
  assert.ok(Math.abs(kontrast('#000000', HVIT) - 21) < 1e-9)
  assert.equal(kontrast(HM_RED, HM_RED), 1)
  assert.equal(kontrast(HM_RED, HVIT), kontrast(HVIT, HM_RED))
  // Hauge Maskin-rødt holder til vanlig tekst på hvitt, og til stor tekst på svart
  assert.ok(kontrast(HM_RED, HVIT) >= 4.5)
  assert.ok(kontrast(HM_RED, SVART) >= 3)
})

// Fargene slik StickerCard setter dem sammen, for designene med faste farger
function farger(id: LabelThemeId) {
  const t = getTheme(id)
  const accent = t.accent!
  const bunn = t.surface === 'dark' ? SVART : t.surface === 'red' ? accent : HVIT
  return {
    t, accent, bunn,
    tekst: t.surface === 'paper' ? SVART : tekstPå(bunn),
    felt: t.badgeColor ?? accent,
    ramme: t.border ?? accent,
  }
}

test('navn og annen tekst rett på etiketten er lett å lese i alle design', () => {
  for (const id of NYE) {
    const { tekst, bunn } = farger(id)
    assert.ok(kontrast(tekst, bunn) >= 4.5, `${id}: ${tekst} på ${bunn}`)
  }
})

test('nummeret synes, enten det står i et fylt felt eller rett på etiketten', () => {
  for (const id of NYE) {
    const { t, felt, bunn, tekst } = farger(id)
    // Strek, kontur og tall rett på bunnen — ingen flate bak
    const påBunnen = ['outline', 'stamp', 'rule', 'number', 'cells'].includes(t.badge) || !!t.outlined
    if (påBunnen) {
      assert.ok(kontrast(felt, bunn) >= 3, `${id}: streken ${felt} på ${bunn}`)
      const skrift = lesbarFarge(felt, bunn, tekst)
      assert.ok(kontrast(skrift, bunn) >= 4.5, `${id}: teksten ${skrift} på ${bunn}`)
    } else {
      assert.ok(kontrast(tekstPå(felt), felt) >= 4.5, `${id}: teksten i feltet ${felt}`)
    }
  }
})

test('farget tekst rett på etiketten går over til tekstfargen når den blir for svak', () => {
  // Rødt på hvitt holder, rødt på svart og gult på hvitt gjør det ikke
  assert.equal(lesbarFarge(HM_RED, HVIT, SVART), HM_RED)
  assert.equal(lesbarFarge(HM_RED, SVART, HVIT), HVIT)
  assert.equal(lesbarFarge('#eab308', HVIT, SVART), SVART)
})

test('todelt nummerfelt har to felt som skiller seg fra hverandre', () => {
  for (const t of LABEL_THEMES.filter(x => x.badge === 'split')) {
    const { felt, accent } = farger(t.id)
    const tekstFelt = felt === SVART ? accent : SVART
    assert.ok(kontrast(tekstFelt, felt) >= 3, `${t.id}: ${tekstFelt} mot ${felt}`)
  }
})

test('ramme, striper, bånd og merker synes mot bunnen', () => {
  for (const id of NYE) {
    const { t, accent, bunn, tekst, ramme } = farger(id)
    const synes = (farge: string, hva: string) =>
      assert.ok(kontrast(farge, bunn) >= 3, `${id}: ${hva} ${farge} på ${bunn}`)
    if (t.frame === 'hazard') assert.ok(kontrast(accent, HVIT) >= 3, `${id}: varselstripene`)
    else if (t.frame !== 'none') synes(ramme, 'rammen')
    if (t.sideStripe) synes(accent, 'sidestripen')
    if (t.footBand) synes(accent, 'bunnfeltet')
    if (t.qrMarks) synes(accent, 'hjørnemerkene')
    if (t.qrFrame) synes(accent, 'QR-rammen')
    if (t.innerLine) synes(t.surface === 'paper' ? accent : tekst, 'linja innenfor kanten')
    if (t.bandRule) synes(t.bandRule, 'streken under bjelken')
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
