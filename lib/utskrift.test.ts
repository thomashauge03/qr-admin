import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ETIKETT_FONTER, arkDokument, enkeltDokument } from './utskrift.ts'

test('utskriftsvinduet laster alle skriftvektene etikettene måles med', () => {
  const familier = new URL(ETIKETT_FONTER).searchParams.getAll('family')
  assert.deepEqual(familier, ['Inter:wght@400;500;600;700;800;900', 'JetBrains Mono:wght@400;500;700'])
})

test('etikettark: sidemargen er skriverkanten, med bakgrunnsfarger og fontene', () => {
  const html = arkDokument('<div class="page">X</div>', 5.5)
  assert.ok(html.includes('<body><div class="page">X</div></body>'))
  // Ber siden om marg 0, presser Chrome den opp til skriverkanten og krymper
  // hele arket for å få det inn — med marg minst like stor som kanten skjer ikke det
  assert.ok(html.includes('@page { size: A4 portrait; margin: 5.5mm; }'))
  assert.ok(html.includes('print-color-adjust: exact'))
  assert.ok(html.includes(ETIKETT_FONTER))
})

test('etikettark: cellene flyttes etter sideområdet, så de treffer arket med alle marginnstillinger', () => {
  const html = arkDokument('', 5.5)
  // Siden fyller sideområdet Chrome faktisk gir den, og cellene står i arkets
  // koordinater: med marg 5,5 mm flyttes de 5,5 mm opp og til venstre, med «Ingen» står de stille
  assert.ok(html.includes('.page { width: 100vw !important; height: 100vh !important; }'))
  assert.ok(html.includes('.cell { margin-left: calc((100vw - 210mm) / 2); margin-top: calc((100vh - 297mm) / 2); }'))
  // På skjermen er arket fortsatt et helt A4
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
