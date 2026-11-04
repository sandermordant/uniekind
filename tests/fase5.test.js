// Fase 5: kennisbank, Mijn lessen en reflectie, variatie, lesbestand met gekozen werkvormen.
import { describe, it, expect, beforeEach } from 'vitest';
import { genereerLes } from '../src/engine/opbouw.js';
import { pastBijVak } from '../src/engine/score.js';
import { maakLesbestand, leesLesbestand } from '../src/export/lesbestand.js';
import { laadData, invoer, idsIn, mislukt } from './helpers.js';

// Een eenvoudige localStorage voor de logboektests (de app gebruikt die van de browser).
const geheugen = new Map();
globalThis.window = {
  localStorage: {
    getItem: (k) => (geheugen.has(k) ? geheugen.get(k) : null),
    setItem: (k, v) => geheugen.set(k, String(v)),
    removeItem: (k) => geheugen.delete(k)
  }
};
const logboek = await import('../src/opslag/logboek.js');
const opslag = await import('../src/opslag/opslag.js');

const data = laadData();
const basis = { context: { afdeling: 'havo', vak: 'biologie', lesduur: 50, ruimte: 'M', aantal: 24 }, inhoud: { onderwerp: 'Fotosynthese' } };

describe('Kennisbank fase 5', () => {
  it('heeft minstens 150 werkvormen en minstens 40 openers', () => {
    expect(data.items.length).toBeGreaterThanOrEqual(150);
    expect(data.items.filter((i) => i.categorie === 'aandachtrichter').length).toBeGreaterThanOrEqual(40);
  });
  it('geen enkele werkvorm noemt een telefoon als middel', () => {
    for (const i of data.items) {
      expect(i.middelen.telefoon).toBe(false);
      expect(i.middelen.lijst.join(' ').toLowerCase()).not.toMatch(/\b(telefoon|smartphone|mobiel|gsm)\b/);
    }
  });
  it('werkvormen die beweging in de ruimte vragen, staan nooit in een M-lokaal zonder dat het past', () => {
    for (const id of ['lopend-dictee', 'speeddate', 'sta-op-en-wissel']) {
      const it = data.items.find((x) => x.id === id);
      expect(it.ruimte.M, id).toBe(false);
    }
  });
  it('herkent een vakvoorbeeld bij het vak', () => {
    const p = data.profiel;
    const vak = (id) => p.vakken.find((v) => v.id === id);
    expect(pastBijVak(data.items.find((i) => i.id === 'korte-demonstratie'), vak('natuurkunde'))).toBe(true);
    expect(pastBijVak(data.items.find((i) => i.id === 'geluidsfragment'), vak('muziek'))).toBe(true);
    expect(pastBijVak(data.items.find((i) => i.id === 'rebus'), vak('latijn'))).toBe(false);
  });
  it('verschillende onderwerpen geven niet allemaal dezelfde opener', () => {
    const openers = new Set();
    for (const onderwerp of ['Fotosynthese', 'Cellen', 'Erfelijkheid', 'Ecosystemen', 'Het hart', 'Spijsvertering', 'Evolutie', 'Hormonen']) {
      const les = genereerLes(invoer({ ...basis, inhoud: { onderwerp } }), data);
      openers.add(les.fases.find((f) => f.type === 'opening').blokken.find((b) => b.werkvorm)?.werkvorm.id);
      expect(mislukt(les)).toEqual([]);
    }
    expect(openers.size).toBeGreaterThanOrEqual(3);
  });
  it('dezelfde invoer geeft dezelfde les', () => {
    expect(idsIn(genereerLes(invoer(basis), data))).toEqual(idsIn(genereerLes(invoer(basis), data)));
  });
});

describe('Mijn lessen en reflectie', () => {
  beforeEach(() => geheugen.clear());

  it('legt een les vast zonder leerlinggegevens en werkt hem bij onder hetzelfde id', () => {
    const les = genereerLes(invoer({ ...basis, klas: { dyslexie: 2 } }), data);
    logboek.legVast('les-a', les, { vak: 'biologie', afdeling: 'havo' });
    logboek.legVast('les-a', les, { vak: 'biologie', afdeling: 'havo' });
    const lijst = logboek.alleLessen();
    expect(lijst).toHaveLength(1);
    expect(lijst[0].werkvormen.length).toBeGreaterThan(2);
    expect(Object.keys(lijst[0]).sort()).toEqual(['afdeling', 'datum', 'eindtermen', 'id', 'leerjaar', 'lesduur', 'onderwerp', 'opzet', 'reflectie', 'stand', 'vak', 'werkvormen']);
  });

  it('een reflectie wordt een duim voor de generator', () => {
    const les = genereerLes(invoer(basis), data);
    logboek.legVast('les-a', les, { vak: 'biologie' });
    const [a, b] = logboek.alleLessen()[0].werkvormen;
    logboek.bewaarReflectie('les-a', { oordeel: { [a.id]: 1, [b.id]: -1, 'bestaat-niet': 1 }, werkte: 'De opener', anders: '' });
    const d = opslag.lees('duimen');
    expect(d).toEqual({ [a.id]: 1, [b.id]: -1 });
    const e = logboek.ervaringen();
    expect(e[a.id]).toMatchObject({ omhoog: 1, omlaag: 0, score: 1 });
  });

  it('gemengde oordelen middelen uit', () => {
    const les = genereerLes(invoer(basis), data);
    logboek.legVast('les-a', les, { vak: 'biologie' });
    logboek.legVast('les-b', les, { vak: 'biologie' });
    const id = logboek.alleLessen()[0].werkvormen[0].id;
    logboek.bewaarReflectie('les-a', { oordeel: { [id]: 1 } });
    logboek.bewaarReflectie('les-b', { oordeel: { [id]: -1 } });
    expect(opslag.lees('duimen')[id]).toBe(0);
  });

  it('recent gebruikt: alleen hetzelfde vak, en nooit de les waar je nu aan werkt', () => {
    const les = genereerLes(invoer(basis), data);
    logboek.legVast('les-a', les, { vak: 'biologie' });
    logboek.legVast('les-b', genereerLes(invoer({ ...basis, context: { ...basis.context, vak: 'economie' } }), data), { vak: 'economie' });
    expect(logboek.recentGebruikt({ vak: 'biologie', behalve: 'les-a' })).toEqual([]);
    expect(logboek.recentGebruikt({ vak: 'biologie' })).toEqual(logboek.werkvormenVan(les).map((w) => w.id));
  });

  it('variatie: de volgende les van hetzelfde vak kiest een andere opener', () => {
    const eerste = genereerLes(invoer(basis), data);
    const opener = (l) => l.fases.find((f) => f.type === 'opening').blokken.find((b) => b.werkvorm).werkvorm.id;
    const tweede = genereerLes(invoer({ ...basis, opties: { vorigeLes: idsIn(eerste) } }), data);
    expect(opener(tweede)).not.toBe(opener(eerste));
    expect(mislukt(tweede)).toEqual([]);
  });

  it('bestand heen en terug, en rommel wordt geweigerd', () => {
    const les = genereerLes(invoer(basis), data);
    logboek.legVast('les-a', les, { vak: 'biologie' });
    logboek.bewaarReflectie('les-a', { oordeel: { [logboek.werkvormenVan(les)[0].id]: 1 }, werkte: 'Goed' });
    const tekst = logboek.naarBestand();
    geheugen.clear();
    expect(logboek.uitBestand(tekst)).toBe(1);
    expect(logboek.alleLessen()[0].reflectie.werkte).toBe('Goed');
    expect(Object.keys(opslag.lees('duimen'))).toHaveLength(1);
    expect(() => logboek.uitBestand('{"soort":"iets anders"}')).toThrow();
  });

  it('alles wissen laat niets achter', () => {
    logboek.legVast('les-a', genereerLes(invoer(basis), data), { vak: 'biologie' });
    logboek.wisAlles();
    expect(logboek.alleLessen()).toEqual([]);
    expect(opslag.lees('duimen')).toBeNull();
  });
});

describe('Lesbestand met gekozen werkvormen', () => {
  it('opent op een andere computer met dezelfde werkvormen, ook met andere duimen', () => {
    const inv = invoer(basis);
    const les = genereerLes(inv, data);
    const tekst = maakLesbestand({ modus: 'snel', invoer: inv, aanpassingen: {} }, les, 'sophianum');
    const geladen = leesLesbestand(tekst);
    // Op de andere computer: alle werkvormen uit deze les hebben daar een duim omlaag
    const duimen = Object.fromEntries(idsIn(les).map((id) => [id, -1]));
    const opnieuw = genereerLes({ ...geladen.concept.invoer, opties: { ...geladen.concept.invoer.opties, duimen } }, data);
    expect(idsIn(opnieuw)).toEqual(idsIn(les));
    // Zonder de gekozen werkvormen zou de les anders zijn
    const zonder = genereerLes({ ...geladen.concept.invoer, opties: { ...geladen.concept.invoer.opties, duimen, gekozen: {} } }, data);
    expect(idsIn(zonder)).not.toEqual(idsIn(les));
  });
  it('een andere suggestie gaat voor de gekozen werkvorm', () => {
    const inv = invoer(basis);
    const les = genereerLes(inv, data);
    const geladen = leesLesbestand(maakLesbestand({ modus: 'snel', invoer: inv, aanpassingen: {} }, les, 'sophianum'));
    const blok = les.fases.find((f) => f.type === 'opening').blokken.find((b) => b.werkvorm);
    const anders = genereerLes({ ...geladen.concept.invoer, opties: { ...geladen.concept.invoer.opties, overslaan: { [blok.sleutel]: 1 } } }, data);
    const nieuw = anders.fases.find((f) => f.type === 'opening').blokken.find((b) => b.werkvorm);
    expect(nieuw.werkvorm.id).not.toBe(blok.werkvorm.id);
  });
});
