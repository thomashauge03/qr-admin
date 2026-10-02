import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ETIKETT_FONTER, arkDokument, enkeltDokument } from './utskrift.ts'

test('utskriftsvinduet laster alle skriftvektene etikettene måles med', () => {
  const familier = new URL(ETIKETT_FONTER).searchParams.getAll('family')
  assert.deepEqual(familier, ['Inter:wght@400;500;600;700;800;900', 'JetBrains Mono:wght@400;500;700'])
})

test('etikettark: A4 uten marger, med bakgrunnsfarger og fontene', () => {
  const html = arkDokument('<div class="page">X</div>')
  assert.ok(html.includes('<body><div class="page">X</div></body>'))
  assert.ok(html.includes('@page { size: A4 portrait; margin: 0; }'))
  assert.ok(html.includes('print-color-adjust: exact'))
  assert.ok(html.includes(ETIKETT_FONTER))
  // Arket er like stort som A4, så cellene treffer etikettene på arket
  assert.ok(html.includes('width: 210mm;') && html.includes('height: 297mm;'))
})

test('enkelt klistremerke: tittelen escapes, helt ark får plass innenfor 10 mm marg', () => {
  const html = enkeltDokument('Sticker — <b>Pigg & hammer</b>', '<p>x</p>', false)
  assert.ok(html.includes('<title>Sticker — &lt;b&gt;Pigg &amp; hammer&lt;/b&gt;</title>'))
  assert.ok(html.includes('<body><p>x</p></body>'))
  assert.ok(html.includes('margin: 5mm'))
  // Helt ark er 190 × 277 mm: A4 minus 10 mm på hver side
  assert.ok(enkeltDokument('A4', '', true).includes('margin: 10mm'))
  assert.ok(html.includes('print-color-adjust: exact'))
})
