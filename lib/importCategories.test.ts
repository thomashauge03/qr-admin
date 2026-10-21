import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leggPlan, mappeVedOppdatering, parseImport, tellFlytting } from './importCategories.ts'

const json = (urlar: string[]) =>
  JSON.stringify({
    rader: urlar.map((u, i) => ({
      name: `Vare ${i}`, shelf_number: `${i}`, qr_type: 'url', qr_data: { type: 'url', url: `https://rorlager.vercel.app/r/${u}` },
    })),
  })

const finst = (id: string, slug: string, folder_id: string | null) => ({
  id, folder_id, name: slug, shelf_number: slug, description: null, color: null, qr_type: 'url' as const,
  qr_data: { type: 'url' as const, url: `https://rorlager.vercel.app/r/${slug}` }, info_lines: null, created_at: '',
})

test('ein vald mappe flyttar òg kodane som finst frå før', () => {
  assert.equal(mappeVedOppdatering('ny-mappe', true), 'ny-mappe')
})

test('«Uten mappe» tek aldri kodar ut av mappa dei ligg i', () => {
  assert.equal(mappeVedOppdatering(null, true), undefined)
  assert.equal(mappeVedOppdatering(null, false), undefined)
})

test('den som vel å la dei liggje, får det', () => {
  assert.equal(mappeVedOppdatering('ny-mappe', false), undefined)
})

test('maskinsider frå utleie-appen kan importerast, framande vertar ikkje', () => {
  const rad = (url: string) => JSON.stringify([{ name: 'MOTORSAGER', shelf_number: 'M-0068', qr_type: 'url', qr_data: { type: 'url', url } }])
  const ok = parseImport(rad('https://utleie-hauge-maskin.vercel.app/m/M-0068'))
  assert.equal(ok.rader.length, 1)
  assert.equal(ok.problemer.length, 0)
  const nei = parseImport(rad('https://utleie-hauge-maskin.vercel.app.example.com/m/M-0068'))
  assert.equal(nei.rader.length, 0)
  assert.match(nei.problemer[0].grunn, /fremmed vert/)
})

test('tel berre dei som faktisk byter mappe', () => {
  const { rader } = parseImport(json(['a', 'b', 'c', 'd']))
  const eksisterende = [finst('1', 'a', 'gammal'), finst('2', 'b', null), finst('3', 'c', 'ny')]
  const plan = leggPlan(rader, eksisterende)
  assert.equal(plan.nye.length, 1)
  assert.equal(plan.oppdateres.length, 3)
  // a og b flyttar inn; c ligg alt i «ny»
  assert.equal(tellFlytting(plan, eksisterende, 'ny'), 2)
  assert.equal(tellFlytting(plan, eksisterende, null), 0)
})
