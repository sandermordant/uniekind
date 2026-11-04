// Testcase 8: foto van een paragraaf met leerdoelen bovenaan.
// De foto (tests/fixtures/paragraaf-foto.jpg) is licht scheef, wat onscherp en met een rand, zoals een telefoonfoto.
// De herkenning draait lokaal met het Nederlandse taalpakket uit node_modules: geen netwerk nodig.
import { describe, it, expect } from 'vitest';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWorker } from 'tesseract.js';
import { schoonOcrTekst } from '../src/ocr/ocr.js';
import { vindLesdoelen, vindKernbegrippen, controleerLesdoel } from '../src/engine/tekst.js';

const hier = dirname(fileURLToPath(import.meta.url));

describe('Testcase 8 · foto van een paragraaf met leerdoelen', () => {
  let tekst = '';
  let zekerheid = 0;
  it('herkent de tekst lokaal', async () => {
    const w = await createWorker('nld', 1, { langPath: join(hier, '../node_modules/@tesseract.js-data/nld/4.0.0_best_int'), gzip: true, cacheMethod: 'none' });
    const { data } = await w.recognize(join(hier, 'fixtures/paragraaf-foto.jpg'));
    await w.terminate();
    tekst = schoonOcrTekst(data.text);
    zekerheid = data.confidence;
    expect(tekst).toMatch(/Fotosynthese/);
    expect(zekerheid).toBeGreaterThan(70);
  }, 60000);
  it('vindt de drie leerdoelen', () => {
    const doelen = vindLesdoelen(tekst);
    expect(doelen).toHaveLength(3);
    expect(doelen[0]).toMatch(/^Je kunt uitleggen wat fotosynthese is/);
    expect(doelen.every((d) => controleerLesdoel(d).waarneembaar)).toBe(true);
  });
  it('stelt de kernbegrippen voor', () => {
    const b = vindKernbegrippen(tekst);
    expect(b).toContain('fotosynthese');
    expect(b).toContain('bladgroen');
    expect(b).toContain('glucose');
  });
});
