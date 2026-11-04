// Fase 6 en 7: sectie-accenten, visie-accenten, termen uit het profiel en de algemene versie.
import { describe, it, expect } from 'vitest';
import { genereerLes } from '../src/engine/opbouw.js';
import { maakContext } from '../src/engine/context.js';
import { visieScore } from '../src/engine/score.js';
import { termen } from '../src/data/termen.js';
import { laadData, invoer, idsIn, mislukt } from './helpers.js';

const sopho = laadData('sophianum');
const alg = laadData('voorbeeld-algemeen');
const kloon = (x) => JSON.parse(JSON.stringify(x));

function lcg(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const kies = (r, l) => l[Math.floor(r() * l.length)];

describe('Sectie-accenten (drie lagen: school, sectie, docent)', () => {
  const data = { ...sopho, profiel: kloon(sopho.profiel) };
  data.profiel.sectieAccenten.perVak = { wiskunde: { lesmodel: 'edi', werkvormVanDeMaand: 'wisbordjes' } };
  const basis = { context: { afdeling: 'havo', vak: 'wiskunde', lesduur: 50, ruimte: 'L', aantal: 24 }, inhoud: { onderwerp: 'Breuken' } };

  it('de sectie bepaalt het lesmodel als de docent de schoolstandaard heeft laten staan', () => {
    const les = genereerLes(invoer(basis), data);
    expect(idsIn(les)).toContain('expliciete-directe-instructie');
    expect(les.tips.join(' ')).toMatch(/sectie werkt met/);
  });
  it('kiest de docent zelf een ander model, dan wint de docent', () => {
    const les = genereerLes(invoer({ ...basis, docent: { lesmodel: 'igdi' } }), data);
    expect(idsIn(les)).not.toContain('expliciete-directe-instructie');
  });
  it('de werkvorm van de maand komt in de les, met uitleg', () => {
    const les = genereerLes(invoer(basis), data);
    const blok = les.fases.flatMap((f) => f.blokken).find((b) => b.werkvorm?.id === 'wisbordjes');
    expect(blok).toBeTruthy();
    expect(blok.uitleg.koppeling).toMatch(/werkvorm van de maand/);
  });
  it('een ander vak merkt niets van het accent', () => {
    const les = genereerLes(invoer({ ...basis, context: { ...basis.context, vak: 'economie' } }), data);
    expect(idsIn(les)).toContain('directe-instructie');
  });
});

describe('Visie-accenten uit het profiel', () => {
  const casus = sopho.items.find((i) => i.id === 'placemat');
  it('meer accenten die passen geven een hogere visiescore', () => {
    expect(visieScore(casus, ['samenwerkend-leren'])).toBeGreaterThan(visieScore(casus, []));
  });
  it('onbekende accenten worden genegeerd', () => {
    expect(visieScore(casus, ['bestaat-niet'])).toBe(visieScore(casus, []));
  });
});

describe('Algemene versie', () => {
  it('heeft geen gegevens van Sophianum in het voorbeeldprofiel', () => {
    const t = JSON.stringify(alg.profiel);
    for (const w of ['Sophianum', 'Gulpen', 'Heuvelland', 'Barat', 'LVO', 'Landsraderweg']) expect(t).not.toContain(w);
    expect(alg.profiel.uniekind.ondertitel).toBe('De lesgenerator voor gedifferentieerd lesgeven');
  });
  it('gebruikt de ruimtenamen uit het profiel', () => {
    maakContext(invoer(), alg.profiel);
    expect(termen.M).toBe('instructielokaal');
    expect(termen.plein).toBe('leerplein');
    maakContext(invoer(), sopho.profiel);
    expect(termen.M).toBe('M-lokaal');
    expect(termen.plein).toBe('deelplein');
  });

  it('300 willekeurige lessen met het algemene profiel voldoen aan alle harde eisen', () => {
    const r = lcg(777);
    const fouten = [];
    for (let n = 0; n < 300; n++) {
      const afd = kies(r, alg.profiel.afdelingen);
      const vakken = alg.profiel.vakken.filter((v) => v.afdelingen === 'alle' || v.afdelingen.includes(afd.id));
      const inv = invoer({
        stand: kies(r, [1, 2, 3]),
        context: { afdeling: afd.id, vak: kies(r, vakken).id, lesduur: kies(r, [...afd.lesduren, 45, 80]), ruimte: kies(r, ['M', 'L', 'anders']), aantal: kies(r, [12, 24, 28, 31]), oa: r() < 0.3, stilte: r() < 0.4 },
        klas: { dyslexie: Math.floor(r() * 3) }
      });
      const les = genereerLes(inv, alg);
      if (mislukt(les).length) fouten.push([inv.context, mislukt(les).map((x) => x.id)]);
    }
    expect(fouten.slice(0, 3)).toEqual([]);
  });

  it('werkt ook voor een school zonder instructielokalen met plein en zonder stilteruimte', () => {
    const p = kloon(alg.profiel);
    p.ruimtes = p.ruimtes.filter((x) => !['M', 'plein', 'stilte'].includes(x.id));
    const data = { ...alg, profiel: p };
    for (const aantal of [20, 30]) {
      const les = genereerLes(invoer({ context: { afdeling: 'havo', vak: 'biologie', lesduur: 50, ruimte: 'M', aantal } }), data);
      expect(les.ruimte).toBe('L');
      expect(les.fases.flatMap((f) => f.blokken).some((b) => b.plek === 'plein' || b.plek === 'stilte')).toBe(false);
      expect(mislukt(les).map((x) => x.id)).toEqual([]);
    }
    // 34 leerlingen in een lokaal voor 32, zonder plein of stilteruimte: dat past niet, en dat zegt Uniekind ook
    const te = genereerLes(invoer({ context: { afdeling: 'havo', vak: 'biologie', lesduur: 50, ruimte: 'L', aantal: 34 } }), data);
    expect(mislukt(te).map((x) => x.id)).toEqual(['capaciteit']);
    expect(te.tips.join(' ')).toMatch(/\d/);
  });
});

describe('Schoolprofiel van buiten wordt opgeschoond', async () => {
  const { schoonProfiel } = await import('../src/data/profiel.js');
  const basis = alg.profiel;
  it('vult ontbrekende delen aan en houdt eigen keuzes', () => {
    const p = schoonProfiel({ school: { naam: 'Test' }, ruimtes: [{ id: 'L', naam: 'Lokaal', kort: 'lokaal', capaciteit: 28 }] }, basis);
    expect(p.school.naam).toBe('Test');
    expect(p.afdelingen.length).toBe(basis.afdelingen.length);
    expect(p.ruimtes.map((r) => r.id)).toEqual(['L', 'anders']);
    expect(genereerLes(invoer({ context: { afdeling: 'havo', vak: 'biologie', lesduur: 50, aantal: 26 } }), { ...alg, profiel: p }).controles.every((c) => c.ok)).toBe(true);
  });
  it('weigert gevaarlijke of kapotte waarden', () => {
    const p = schoonProfiel({
      huisstijl: { logo: 'javascript:alert(1)', motief: 'https://elders.nl/x.svg', kleuren: { hoofd: 'red; background:url(x)', paars: '#123456' } },
      sectieAccenten: { perVak: { biologie: { methodesite: 'javascript:alert(1)', lesmodel: 'onzin', werkvormVanDeMaand: 'wisbordjes' } } },
      bronnenZoeken: [{ naam: 'x', url: 'javascript:alert(1)' }],
      ['__proto__']: { vervuild: true }
    }, basis);
    expect(p.huisstijl.logo).toBeNull();
    expect(p.huisstijl.motief).toBeNull();
    expect(p.huisstijl.kleuren.hoofd).toBe(basis.huisstijl.kleuren.hoofd);
    expect(p.huisstijl.kleuren.paars).toBe('#123456');
    expect(p.sectieAccenten.perVak.biologie).toEqual({ werkvormVanDeMaand: 'wisbordjes' });
    expect(p.bronnenZoeken).toEqual([]);
    expect({}.vervuild).toBeUndefined();
  });
  it('geen object is geen profiel', () => {
    expect(() => schoonProfiel('tekst', basis)).toThrow();
  });
});

describe('Verwijzing naar het ondersteuningsaanbod van de school', () => {
  it('noemt alleen het aanbod bij behoeften die in de klas spelen', () => {
    const les = genereerLes(invoer({ context: { afdeling: 'havo', vak: 'nederlands', lesduur: 50, ruimte: 'L', aantal: 24 }, klas: { dyslexie: 2 } }), sopho);
    const tip = les.tips.find((t) => t.startsWith('Op school'));
    expect(tip).toMatch(/dyslexiepas/);
    expect(tip).not.toMatch(/faalangstreductie/);
    const zonder = genereerLes(invoer({ context: { afdeling: 'havo', vak: 'nederlands', lesduur: 50, ruimte: 'L', aantal: 24 } }), sopho);
    expect(zonder.tips.some((t) => t.startsWith('Op school'))).toBe(false);
  });
});
