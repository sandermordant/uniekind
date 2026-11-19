// Combinatieklas met twee lagen (bijvoorbeeld GA4 en GA5): eigen onderwerp, lesdoel en materiaal per laag.
import { describe, it, expect } from 'vitest';
import { genereerLes } from '../src/engine/opbouw.js';
import { maakMateriaal } from '../src/materiaal/maak.js';
import { tekstVan } from '../src/materiaal/model.js';
import { naarPptx } from '../src/export/pptx.js';
import { maakLesbestand, leesLesbestand } from '../src/export/lesbestand.js';
import { klasLabel, klasCode } from '../src/data/klas.js';
import { schoonProfiel } from '../src/data/profiel.js';
import { laadData, invoer, mislukt } from './helpers.js';

const data = laadData();
const profiel = schoonProfiel(data.profiel, data.profiel);
const tweeLagen = (context = {}, laag2 = {}) => invoer({
  stand: 2,
  context: { afdeling: 'vwo-a', leerjaar: 4, vak: 'biologie', lesduur: 50, ruimte: 'L', aantal: 28, ...context },
  inhoud: { onderwerp: 'Erfelijkheid', begrippen: ['gen', 'allel'], lesdoelen: [{ tekst: 'Je kunt een kruisingsschema maken.' }] },
  klas: { gemengd: true, laag2: { afdeling: 'vwo-a', aantal: 12, onderwerp: 'Evolutie', doel1: 'Je kunt uitleggen hoe natuurlijke selectie werkt.', ...laag2 } }
});

describe('Klascodes uit de lessentabellen', () => {
  it('GA4, H4, HM1 en GAH1; vmbo zonder verzonnen code', () => {
    const afd = (id) => profiel.afdelingen.find((a) => a.id === id);
    expect(klasCode(afd('vwo-a'), 4)).toBe('GA4');
    expect(klasCode(afd('havo'), 1)).toBe('HM1');
    expect(klasLabel(afd('vwo-g'), 1)).toBe('vwo gymnasium 1 (GAH1)');
    expect(klasLabel(afd('havo'), 4)).toBe('havo 4 (H4)');
    expect(klasCode(afd('mavo'), 3)).toBe('');
    expect(klasLabel(afd('vmbo-b'), 1)).toBe('vmbo basis 1 (vmbo-MiX)');
  });
});

describe('Twee lagen: de les', () => {
  const les = genereerLes(tweeLagen(), data);
  it('GA4 en GA5 met eigen onderwerp en lesdoel; standaard het leerjaar erboven', () => {
    expect(les.lagen.map((l) => l.code)).toEqual(['GA4', 'GA5']);
    expect(les.lagen.map((l) => l.aantal)).toEqual([16, 12]);
    expect(les.lagen[1].onderwerp).toBe('Evolutie');
    expect(les.lagen[1].lesdoelen[0].tekst).toMatch(/natuurlijke selectie/);
  });
  it('opzet "Twee lagen": om de beurt instructie, alle lesregels gehaald', () => {
    expect(les.opzet).toBe('lagen');
    const instructieBij = (gid) => les.fases.filter((f) => f.type === 'instructie' && f.blokken.some((b) => b.groepen.includes(gid) && b.rol === 'instructie' && b.begeleiding === 'docent'));
    expect(instructieBij('A')).toHaveLength(1);
    expect(instructieBij('B')).toHaveLength(1);
    expect(les.fases.reduce((t, f) => t + f.duur, 0)).toBe(50);
    expect(mislukt(les)).toEqual([]);
  });
  it('ook in een vol M-lokaal (30 leerlingen, blokuur): de wachtende laag gaat naar het plein, nooit boven de capaciteit', () => {
    const vol = genereerLes(tweeLagen({ ruimte: 'M', aantal: 30, lesduur: 100 }), data);
    expect(vol.opzet).toBe('lagen');
    expect(mislukt(vol)).toEqual([]);
  });
  it('havo/mavo-combinatie werkt ook', () => {
    const hm = genereerLes(tweeLagen({ afdeling: 'havo', leerjaar: 1, vak: 'nederlands', lesduur: 50 }, { afdeling: 'mavo', leerjaar: 1, onderwerp: '' }), data);
    expect(hm.lagen.map((l) => l.code)).toEqual(['HM1', 'mavo 1']);
    expect(hm.lagen[1].onderwerp).toBe('Erfelijkheid'); // leeg = hetzelfde onderwerp
    expect(mislukt(hm)).toEqual([]);
  });
  it('zonder tweede laag blijft het een gewone (combinatie)klas', () => {
    expect(genereerLes(tweeLagen({}, { afdeling: '' }), data).lagen).toBeNull();
  });
});

describe('Twee lagen: materiaal, AI, presentatie en lesbestand', () => {
  const les = genereerLes(tweeLagen(), data);
  const blok = (id, tekst) => `### ${id}\n${tekst}`;
  const aiB = { 'VRAGEN-BASIS': '1. Wat is natuurlijke selectie? [Begrijpen]\n2. b [Begrijpen]\n3. c [Toepassen]\n4. d [Toepassen]\n5. e [Analyseren]' };
  const m = maakMateriaal(les, data, {}, [], { B: aiB });
  const doc = (id) => m.alle.find((d) => d.id === id);
  it('werkbladen per laag, met het eigen lesdoel en de eigen aantallen', () => {
    for (const l of ['A', 'B']) for (const w of ['werkblad-steun', 'werkblad-basis', 'werkblad-verdieping']) expect(doc(`${w}-laag-${l}`), `${w}-laag-${l}`).toBeTruthy();
    expect(doc('werkblad-basis-laag-A').titel).toMatch(/GA4/);
    expect(tekstVan(doc('werkblad-basis-laag-A'))).toMatch(/kruisingsschema/);
    expect(tekstVan(doc('werkblad-basis-laag-B'))).toMatch(/natuurlijke selectie/);
    for (const l of les.lagen) {
      const n = ['werkblad-steun', 'werkblad-basis', 'werkblad-verdieping'].reduce((t, w) => t + doc(`${w}-laag-${l.id}`).aantal, 0);
      expect(n).toBe(l.aantal);
    }
  });
  it('het AI-antwoord van laag B vult alleen het materiaal van laag B', () => {
    expect(tekstVan(doc('werkblad-basis-laag-B'))).toMatch(/Wat is natuurlijke selectie\?/);
    expect(tekstVan(doc('werkblad-basis-laag-A'))).not.toMatch(/Wat is natuurlijke selectie\?/);
  });
  it('lesplan en opdrachtkaarten noemen het lesdoel per laag', () => {
    expect(tekstVan(doc('lesplan'))).toMatch(/Laag GA4[\s\S]*kruisingsschema[\s\S]*Laag GA5[\s\S]*natuurlijke selectie/);
    expect(tekstVan(doc('opdrachtkaarten'))).toMatch(/natuurlijke selectie/);
  });
  it('de presentatie noemt beide lesdoelen', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(await naarPptx(les, { ...data, aiLagen: { B: aiB } }));
    const tekst = (await Promise.all(Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).map((f) => zip.file(f).async('string')))).join(' ');
    expect(tekst).toMatch(/kruisingsschema/);
    expect(tekst).toMatch(/natuurlijke selectie/);
  });
  it('het lesbestand bewaart de tweede laag en het AI-materiaal van laag B', () => {
    const inv = tweeLagen();
    const concept = { modus: 'snel', invoer: inv, aanpassingen: {}, ai: {}, aiLagen: { B: aiB } };
    const terug = leesLesbestand(maakLesbestand(concept, les, 'sophianum'));
    expect(terug.concept.invoer.klas.laag2).toMatchObject({ afdeling: 'vwo-a', onderwerp: 'Evolutie' });
    expect(terug.concept.invoer.klas.gemengd).toBe(true);
    expect(terug.concept.aiLagen.B['VRAGEN-BASIS']).toMatch(/natuurlijke selectie/);
  });
});
