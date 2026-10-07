import { test } from 'node:test'
import assert from 'node:assert/strict'
import { QR_ORIGIN, videresendingsadresse, lesKode, trygtMål } from './videresending.ts'
import { qrRuter, QR_RUTER } from './etikettPlan.ts'

const ID = '3f2b8c1e-9a4d-4e7b-b1c2-0d9e8f7a6b5c'

test('adressen peker til /q på det faste domenet', () => {
  assert.equal(videresendingsadresse(ID), `${QR_ORIGIN}/q?k=${ID}`)
  assert.equal(videresendingsadresse(ID.toUpperCase()), `${QR_ORIGIN}/q?k=${ID}`)
})

test('ingen adresse uten ekte id', () => {
  assert.equal(videresendingsadresse(''), null)
  assert.equal(videresendingsadresse('00000000'), null)
})

test('adressen blir ikke tettere enn etikettene er planlagt for', () => {
  // Planen regner med versjon 6 — videresendingen må ikke kreve mer.
  assert.ok(qrRuter(videresendingsadresse(ID)!, 'M') <= QR_RUTER)
})

test('lesKode godtar bare en uuid', () => {
  assert.equal(lesKode(`?k=${ID}`), ID)
  assert.equal(lesKode(`?k=${ID.toUpperCase()}`), ID)
  assert.equal(lesKode('?k=abc'), null)
  assert.equal(lesKode(`?k=${ID}&k=x`), ID)
  assert.equal(lesKode(''), null)
  assert.equal(lesKode(`?k=${ID}' or 1=1`), null)
})

test('trygtMål slipper bare gjennom vanlige nettadresser', () => {
  assert.equal(trygtMål('https://haugemaskin.no/sag'), 'https://haugemaskin.no/sag')
  assert.equal(trygtMål('  http://eksempel.no  '), 'http://eksempel.no/')
  assert.equal(trygtMål('javascript:alert(1)'), null)
  assert.equal(trygtMål('JavaScript:alert(1)'), null)
  assert.equal(trygtMål('data:text/html,<script>x</script>'), null)
  assert.equal(trygtMål('haugemaskin.no'), null)
  assert.equal(trygtMål(''), null)
  assert.equal(trygtMål(null), null)
})
