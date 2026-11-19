// Materiaal en exports: compleet, juiste aantallen, geen namen, en bestanden die echt geldig zijn.
import { describe, it, expect } from 'vitest';
import { genereerLes } from '../src/engine/opbouw.js';
import { maakMateriaal } from '../src/materiaal/maak.js';
import { tekstVan, rustig } from '../src/materiaal/model.js';
import { naarDocx } from '../src/export/docx.js';
import { naarPdf } from '../src/export/pdf.js';
import { naarPptx } from '../src/export/pptx.js';
import { maakLesbestand, leesLesbestand } from '../src/export/lesbestand.js';
import { laadData, invoer } from './helpers.js';

const data = laadData();
const GEVALLEN = {
  'economie havo 3, 30 lln, M': { stand: 2, context: { afdeling: 'havo', leerjaar: 3, vak: 'economie', lesduur: 50, ruimte: 'M', aantal: 30 }, inhoud: { onderwerp: 'Inflatie', begrippen: ['inflatie', 'koopkracht'], lesdoelen: [{ tekst: 'Je kunt uitleggen wat inflatie is.' }] } },
  'nederlands vmbo-k, dyslexie, L': { stand: 2, context: { afdeling: 'vmbo-k', leerjaar: 2, vak: 'nederlands', lesduur: 70, ruimte: 'L', aantal: 22 }, inhoud: { onderwerp: 'Signaalwoorden' }, klas: { dyslexie: 4, nt2: 2 } },
  'O&O met assistent': { stand: 2, context: { afdeling: 'havo', leerjaar: 1, vak: 'oo', lesduur: 100, ruimte: 'L', aantal: 28, oa: true }, inhoud: { onderwerp: 'Fietsenstalling' } },
  'geschiedenis klassikaal': { stand: 1, context: { afdeling: 'havo', leerjaar: 4, vak: 'geschiedenis', lesduur: 50, ruimte: 'L', aantal: 27 }, inhoud: { onderwerp: 'Koude Oorlog' } }
};

describe('Materiaalpakket', () => {
  for (const [naam, inv] of Object.entries(GEVALLEN)) {
    const les = genereerLes(invoer(inv), data);
    const m = maakMateriaal(les, data);
    const ids = m.alle.map((d) => d.id);
    it(`${naam}: alle verplichte documenten`, () => {
      for (const id of ['lesplan', 'voorbereiding', 'differentiatie-overzicht', 'kijkwijzer', 'reflectiekaart', 'werkblad-steun', 'werkblad-basis', 'werkblad-verdieping', 'succescriteria', 'vaktaalkaart', 'vandaag']) expect(ids).toContain(id);
    });
    it(`${naam}: exit tickets, hintkaarten en opdrachtkaarten alleen als de les ze gebruikt`, () => {
      const wv = new Set(les.fases.flatMap((f) => [...f.blokken.map((b) => b.werkvorm?.id), ...(f.extra ?? []).map((e) => e.id)]));
      expect(ids.includes('exit-tickets')).toBe(wv.has('exit-ticket'));
      const noemtHint = [...wv].some((id) => (data.items.find((i) => i.id === id)?.alsDan ?? []).some((r) => /hintkaart/i.test(`${r.als} ${r.dan}`)));
      const hint = wv.has('hintkaarten') || noemtHint;
      expect(ids.includes('hintkaarten')).toBe(hint);
      expect(ids.includes('opdrachtkaarten')).toBe(les.groepen.length > 1);
      const alles = m.alle.map(tekstVan).join('\n');
      if (!hint) expect(alles).not.toMatch(/hintkaart|hint 1|hint 2/i);
      if (!wv.has('exit-ticket')) expect(alles).not.toMatch(/exit ticket/i);
    });
    it(`${naam}: werkbladen per niveau tellen op tot de klas`, () => {
      const n = ['werkblad-steun', 'werkblad-basis', 'werkblad-verdieping'].reduce((t, id) => t + m.alle.find((d) => d.id === id).aantal, 0);
      expect(n).toBe(les.aantal);
    });
    it(`${naam}: geen kapotte tekst`, () => {
      for (const d of m.alle) expect(tekstVan(d), d.id).not.toMatch(/undefined|NaN|\[object Object\]/);
    });
  }
  it('rekenhulpkaart bij economie, rolkaarten en assistentkaart bij O&O, pleinafspraken alleen met plein', () => {
    const eco = maakMateriaal(genereerLes(invoer(GEVALLEN['economie havo 3, 30 lln, M']), data), data).alle.map((d) => d.id);
    const oo = maakMateriaal(genereerLes(invoer(GEVALLEN['O&O met assistent']), data), data).alle.map((d) => d.id);
    expect(eco).toContain('rekenhulpkaart');
    expect(eco).toContain('pleinafspraken');
    expect(oo).toContain('rolkaarten');
    expect(oo).toContain('oa-kaart');
    expect(oo).toContain('rubric');
    expect(oo).not.toContain('pleinafspraken');
  });
  it('rustige versie zet maximaal drie vragen op een blad', () => {
    const m = maakMateriaal(genereerLes(invoer(GEVALLEN['economie havo 3, 30 lln, M']), data), data);
    const r = rustig(m.alle.find((d) => d.id === 'werkblad-basis'));
    let sinds = 0;
    for (const b of r.blokken) { if (b.t === 'pagina') sinds = 0; if (b.t === 'vraag') sinds++; expect(sinds).toBeLessThanOrEqual(3); }
  });
});

describe('Exports', () => {
  const les = genereerLes(invoer(GEVALLEN['economie havo 3, 30 lln, M']), data);
  const m = maakMateriaal(les, data);
  it('Word (.docx) is een geldig zip-bestand', async () => {
    const buf = await naarDocx(m.alle, { kleur: '#00489a', toonAantal: true });
    expect(buf.subarray(0, 2).toString()).toBe('PK');
    expect(buf.length).toBeGreaterThan(10000);
  });
  it('PDF begint met %PDF', async () => {
    const buf = await naarPdf([m.alle[0]], { kleur: '#00489a', dyslexie: true });
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  }, 30000);
  it('PowerPoint (.pptx) is een geldig zip-bestand', async () => {
    const buf = await naarPptx(les, data);
    expect(Buffer.from(buf).subarray(0, 2).toString()).toBe('PK');
  });
  it('lesbestand: heen en terug geeft dezelfde les, zonder namen', () => {
    const concept = { modus: 'snel', invoer: { ...invoer(GEVALLEN['economie havo 3, 30 lln, M']), klas: { naam: 'Jan', steun: '3' } }, aanpassingen: {}, gekozenStand: 2 };
    const tekst = maakLesbestand(concept, les, 'sophianum');
    expect(tekst).not.toMatch(/Jan/);
    const terug = leesLesbestand(tekst);
    const opnieuw = genereerLes({ ...terug.concept.invoer, stand: terug.concept.gekozenStand }, data);
    expect(opnieuw.fases.map((f) => f.id)).toEqual(les.fases.map((f) => f.id));
    expect(() => leesLesbestand('{"formaat":"iets anders"}')).toThrow(/geen Uniekind/);
  });
});

describe('Presentatie volgt de gekozen afsluiter', () => {
  it('de afsluitdia noemt alleen een exit ticket als dat de afsluiter is', async () => {
    const JSZip = (await import('jszip')).default;
    for (const inv of Object.values(GEVALLEN)) {
      const les = genereerLes(invoer(inv), data);
      const afsluiter = les.fases.find((f) => f.type === 'afsluiting')?.blokken[0]?.werkvorm?.id;
      const zip = await JSZip.loadAsync(await naarPptx(les, data));
      const dias = await Promise.all(Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).map((f) => zip.file(f).async('string')));
      const tekst = dias.join(' ');
      expect(/Exit ticket|lever het in bij de deur/i.test(tekst), `${inv.inhoud.onderwerp}: ${afsluiter}`).toBe(afsluiter === 'exit-ticket');
    }
  });
});
