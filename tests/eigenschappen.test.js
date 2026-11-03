// Eigenschapstests: voor honderden combinaties moeten de harde eisen altijd kloppen.
import { describe, it, expect } from 'vitest';
import { genereerLes } from '../src/engine/opbouw.js';
import { maakSlots } from '../src/engine/sjablonen.js';
import { controleerLesdoel, vindLesdoelen, vindKernbegrippen } from '../src/engine/tekst.js';
import { laadData, invoer, mislukt } from './helpers.js';

const data = laadData();

// Kleine voorspelbare toevalsgenerator, zodat de tests elke keer hetzelfde doen
function lcg(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const kies = (r, lijst) => lijst[Math.floor(r() * lijst.length)];

describe('Lessjablonen', () => {
  for (const d of [20, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120, 150, 200]) {
    for (const lesmodel of ['di', 'adi', 'edi', 'igdi']) {
      it(`${d} minuten (${lesmodel}) telt exact op en heeft geen fase langer dan 25 min`, () => {
        const s = maakSlots(d, { lesmodel, instructieMax: 15 });
        expect(s.reduce((t, x) => t + x.duur, 0)).toBe(d);
        expect(Math.max(...s.map((x) => x.duur))).toBeLessThanOrEqual(25);
        const doel = s.find((x) => x.type === 'doel').duur;
        const instr = s.find((x) => x.type === 'instructie').duur;
        expect(doel + instr).toBeLessThanOrEqual(15);
      });
    }
  }
});

describe('Harde eisen over 600 willekeurige lessen', () => {
  const r = lcg(20261103);
  const gevallen = [];
  for (let n = 0; n < 600; n++) {
    const afdeling = kies(r, ['vmbo-b', 'vmbo-k', 'mavo', 'havo', 'vwo-a', 'vwo-g']);
    const ruimte = kies(r, ['M', 'M', 'L', 'anders']);
    const aantal = kies(r, [8, 14, 20, 24, 26, 27, 28, 30, 32]);
    const bekend = r() < 0.5;
    const steun = Math.floor(r() * 8), verdieping = Math.floor(r() * 9);
    gevallen.push(invoer({
      stand: kies(r, [1, 2, 3]),
      docent: { lesmodel: kies(r, ['di', 'adi', 'edi', 'igdi', 'eigen']), stijl: { uitleggen: kies(r, [1, 3, 5]), samenwerken: kies(r, [1, 3, 5]), houvast: kies(r, [1, 3, 5]), ontdekken: kies(r, [1, 3, 5]) } },
      context: {
        afdeling, vak: kies(r, ['economie', 'nederlands', 'oo', 'wiskunde', 'duits', 'biologie', 'geschiedenis', 'tt']),
        lesduur: kies(r, [35, 50, 70, 100, 45, 60, 90, 120]), ruimte, aantal,
        oa: r() < 0.3, stilte: r() < 0.4, laptops: kies(r, ['alle', 'deel', 'geen']),
        reeks: kies(r, ['introductie', 'uitleg', 'verdieping', 'herhaling', 'afsluiting', 'toets']),
        tijdstip: kies(r, ['eerste', 'midden', 'pauze', 'laatste'])
      },
      inhoud: { voorkennisZeker: kies(r, ['zeker', 'twijfel', 'niet']) },
      klas: {
        verdelingBekend: bekend, steun, basis: Math.max(1, aantal - steun - verdieping), verdieping,
        dyslexie: Math.floor(r() * 4), nt2: Math.floor(r() * 3), faalangst: Math.floor(r() * 3),
        dynamiek: kies(r, ['rustig', 'levendig', 'onrustig']), samenwerken: kies(r, ['goed', 'wisselend', 'moeizaam'])
      },
      opties: { splitsing: r() < 0.2 ? kies(r, ['gespreide-start', 'startcheck', 'carrousel', 'flipped', 'oa', 'stilte']) : null }
    }));
  }

  it('alle lessen voldoen aan alle harde eisen', () => {
    const fouten = [];
    for (const inv of gevallen) {
      const les = genereerLes(inv, data);
      const f = mislukt(les);
      if (f.length) fouten.push({ c: inv.context, stand: inv.stand, opzet: les.opzet, f: f.map((x) => `${x.id}: ${x.toelichting}`) });
    }
    if (fouten.length) console.log(JSON.stringify(fouten.map((x) => [x.c.lesduur, x.c.ruimte, x.c.aantal, x.stand, x.opzet, x.c.oa, x.c.stilte, x.f]), null, 0).replace(/\],\[/g, "]\n["));
    expect(fouten.slice(0, 5), `${fouten.length} lessen met fouten`).toEqual([]);
  });

  it('geen enkele les heeft een werkvorm boven de gekozen stand (behalve organisatie- en vakeigen werkvormen)', () => {
    const vrij = new Set(['startcheck-routes', 'uitgewerkt-voorbeeld-fading', 'flipped-start-kennisclip', 'stilteruimte-route', 'startopdracht', 'ophaaloefening', 'gespreide-herhaling', 'ontwerpopdracht', 'woordweb', 'cornell-notities', 'dual-coding']);
    for (const inv of gevallen.slice(0, 200)) {
      const les = genereerLes(inv, data);
      for (const f of les.fases) for (const b of f.blokken) {
        if (!b.werkvorm || vrij.has(b.werkvorm.id)) continue;
        const it = data.items.find((i) => i.id === b.werkvorm.id);
        expect(it.instapniveau, `${it.id} in stand ${les.stand}`).toBeLessThanOrEqual(les.stand);
      }
    }
  });
});

describe('Tekstanalyse', () => {
  it('herkent niet-waarneembare lesdoelen', () => {
    expect(controleerLesdoel('Je begrijpt wat inflatie is.').waarneembaar).toBe(false);
    expect(controleerLesdoel('Je kunt uitleggen wat inflatie is.')).toMatchObject({ waarneembaar: true, niveau: 'begrijpen' });
    expect(controleerLesdoel('Je kunt de koopkracht berekenen.').niveau).toBe('toepassen');
    expect(controleerLesdoel('Je kunt een fietsenstalling ontwerpen.').niveau).toBe('creeren');
  });
  it('vindt lesdoelen en kernbegrippen in een paragraaf', () => {
    const tekst = `3.2 Inflatie
Leerdoelen
- Je kunt uitleggen wat inflatie is.
- Je kunt berekenen hoeveel je koopkracht daalt.
Als de prijzen stijgen, spreken we van inflatie. Het begrip koopkracht geeft aan wat je met je geld kunt kopen.
Bij inflatie daalt de koopkracht. De consumentenprijsindex meet de inflatie. Inflatie en koopkracht hangen samen.`;
    expect(vindLesdoelen(tekst)).toEqual(['Je kunt uitleggen wat inflatie is.', 'Je kunt berekenen hoeveel je koopkracht daalt.']);
    const b = vindKernbegrippen(tekst);
    expect(b).toContain('inflatie');
    expect(b).toContain('koopkracht');
  });
});
