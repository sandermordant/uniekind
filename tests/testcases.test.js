// De testcases uit de opdracht (deel 12). Elke test controleert eerst alle harde eisen,
// en daarna wat er in deze situatie moet blijken.
import { describe, it, expect } from 'vitest';
import { genereerLes, genereerVarianten } from '../src/engine/opbouw.js';
import { laadData, invoer, idsIn, plekkenIn, mislukt } from './helpers.js';

const data = laadData();
const harde = (les) => expect(mislukt(les), JSON.stringify(mislukt(les), null, 1)).toEqual([]);
const maxInPlek = (les, plek) => Math.max(0, ...les.fases.map((f) => f.blokken.filter((b) => b.plek === plek).reduce((t, b) => t + b.aantal, 0)));

describe('Testcase 1 · Economie havo 3, 50 min, M-lokaal, 30 leerlingen, geen assistent, stand 2', () => {
  const les = genereerLes(invoer({
    stand: 2,
    context: { afdeling: 'havo', leerjaar: 3, vak: 'economie', lesduur: 50, ruimte: 'M', aantal: 30, oa: false },
    inhoud: { onderwerp: 'Inflatie', lesdoelen: [{ tekst: 'Je kunt uitleggen wat inflatie is.' }, { tekst: 'Je kunt berekenen hoeveel je koopkracht daalt.' }] }
  }), data);
  it('voldoet aan alle harde eisen', () => harde(les));
  it('de splitsplanner start automatisch', () => {
    expect(les.splitsing.overflow).toBe(4);
    expect(les.splitsing.nodig).toBe(true);
    expect(['startcheck', 'gespreide-start', 'carrousel']).toContain(les.opzet);
  });
  it('geldige verdeling lokaal/plein: nooit meer dan 26 in het lokaal', () => {
    expect(maxInPlek(les, 'lokaal')).toBeLessThanOrEqual(26);
    expect(plekkenIn(les).has('plein')).toBe(true);
    expect(maxInPlek(les, 'plein')).toBeLessThanOrEqual(40);
  });
});

describe('Testcase 2 · Nederlands vmbo-k 2, 70 min, L-lokaal, 22 leerlingen, 4 dyslexie, 2 NT2', () => {
  const les = genereerLes(invoer({
    stand: 2,
    context: { afdeling: 'vmbo-k', leerjaar: 2, vak: 'nederlands', lesduur: 70, ruimte: 'L', aantal: 22 },
    inhoud: { onderwerp: 'Signaalwoorden', lesdoelen: [{ tekst: 'Je kunt signaalwoorden in een tekst herkennen en benoemen.' }] },
    klas: { dyslexie: 4, nt2: 2 }
  }), data);
  it('voldoet aan alle harde eisen', () => harde(les));
  it('dyslexievriendelijk materiaal en vaktaalkaart', () => {
    expect(les.materiaalAdvies.dyslexievriendelijk).toBe(true);
    expect(les.materiaalAdvies.vaktaalkaart).toBe(true);
  });
  it('hoeken in plaats van plein', () => {
    expect(plekkenIn(les).has('plein')).toBe(false);
    expect(les.differentiatie.map((d) => d.id)).toContain('hoeken-l-lokaal');
  });
  it('beweegmoment in het blokuur', () => {
    expect(les.fases.some((f) => f.type === 'beweeg')).toBe(true);
  });
});

describe('Testcase 3 · Wiskunde vwo 5 gymnasium, 100 min, M-lokaal, 18 leerlingen, 6 klaar voor verdieping', () => {
  const les = genereerLes(invoer({
    stand: 2,
    context: { afdeling: 'vwo-g', leerjaar: 5, vak: 'wiskunde', lesduur: 100, ruimte: 'M', aantal: 18 },
    inhoud: { onderwerp: 'Afgeleiden', lesdoelen: [{ tekst: 'Je kunt de afgeleide van een samengestelde functie berekenen met de kettingregel.' }] },
    klas: { verdelingBekend: true, steun: 4, basis: 8, verdieping: 6 }
  }), data);
  it('voldoet aan alle harde eisen', () => harde(les));
  it('compacten en verrijken', () => expect(idsIn(les)).toContain('compacten-verrijken'));
  it('verdieping op het plein', () => {
    const c = les.fases.flatMap((f) => f.blokken).filter((b) => b.rol === 'verdieping');
    expect(c.length).toBeGreaterThan(0);
    expect(c.every((b) => b.plek === 'plein')).toBe(true);
  });
});

describe('Testcase 4 · O&O havo 1, 100 min, L-lokaal, 28 leerlingen, onderwijsassistent aanwezig', () => {
  const les = genereerLes(invoer({
    stand: 2,
    context: { afdeling: 'havo', leerjaar: 1, vak: 'oo', lesduur: 100, ruimte: 'L', aantal: 28, oa: true },
    inhoud: { onderwerp: 'Een fietsenstalling ontwerpen', lesdoelen: [{ tekst: 'Je kunt drie eisen van een opdrachtgever vertalen naar een eerste ontwerpschets.' }] }
  }), data);
  it('voldoet aan alle harde eisen', () => harde(les));
  it('ontwerpopdracht in groepjes met rolkaarten', () => {
    expect(idsIn(les)).toContain('ontwerpopdracht');
    expect(les.routines).toContain('rolkaarten');
  });
  it('de assistent heeft een eigen kaart', () => {
    expect(les.oa?.aanwezig).toBe(true);
    expect(les.materiaalAdvies.oaKaart).toBe(true);
    expect(les.oa.rol.length).toBeGreaterThan(10);
  });
});

describe('Testcase 5 · Duits mavo 3, 35 min, M-lokaal, 24 leerlingen, laatste uur, klas onrustig', () => {
  const les = genereerLes(invoer({
    stand: 2,
    context: { afdeling: 'mavo', leerjaar: 3, vak: 'duits', lesduur: 35, ruimte: 'M', aantal: 24, tijdstip: 'laatste' },
    inhoud: { onderwerp: 'Der Dativ', lesdoelen: [{ tekst: 'Je kunt de derde naamval na mit en bei toepassen in een zin.' }] },
    klas: { dynamiek: 'onrustig' }
  }), data);
  it('voldoet aan alle harde eisen', () => harde(les));
  it('heeft een energizer', () => expect(les.fases.some((f) => f.type === 'beweeg' && f.blokken.some((b) => b.werkvorm?.categorie === 'energizer'))).toBe(true));
  it('korte, gestructureerde opzet met weinig wissels: iedereen blijft in het lokaal', () => {
    expect([...plekkenIn(les)]).toEqual(['lokaal']);
    expect(les.fases.length).toBeLessThanOrEqual(8);
  });
});

describe('Testcase 6 · Geschiedenis havo 4, 50 min, stand 1, docent legt graag zelf uit', () => {
  const les = genereerLes(invoer({
    stand: 1,
    docent: { stijl: { uitleggen: 5, structuur: 4, samenwerken: 2, ontdekken: 2, digitaal: 2, relatie: 3, houvast: 4 }, kracht: 'uitleggen met verhalen' },
    context: { afdeling: 'havo', leerjaar: 4, vak: 'geschiedenis', lesduur: 50, ruimte: 'L', aantal: 27 },
    inhoud: { onderwerp: 'De Koude Oorlog', lesdoelen: [{ tekst: 'Je kunt twee oorzaken van de Koude Oorlog uitleggen.' }] }
  }), data);
  it('voldoet aan alle harde eisen', () => harde(les));
  it('les blijft herkenbaar klassikaal', () => {
    expect(les.opzet).toBe('klassikaal');
    expect(les.groepen).toHaveLength(1);
    expect(idsIn(les)).toContain('directe-instructie');
  });
  it('met één kleine differentiatiestap', () => {
    expect(les.differentiatie).toHaveLength(1);
    expect(les.differentiatie[0].id).toBe('instructietafel');
    expect(les.waarom).toMatch(/uitleggen met verhalen/);
  });
});

describe('Testcase 7 · Biologie vwo 2, 50 min, "weet ik niet" bij de verdeling', () => {
  const les = genereerLes(invoer({
    stand: 2,
    context: { afdeling: 'vwo-a', leerjaar: 2, vak: 'biologie', lesduur: 50, ruimte: 'M', aantal: 24 },
    inhoud: { onderwerp: 'Fotosynthese', lesdoelen: [{ tekst: 'Je kunt het proces van fotosynthese in eigen woorden uitleggen.' }] },
    klas: { verdelingBekend: false }
  }), data);
  it('voldoet aan alle harde eisen', () => harde(les));
  it('een startcheck bepaalt de routes', () => {
    expect(les.fases.some((f) => f.type === 'startcheck')).toBe(true);
    expect(idsIn(les)).toContain('startcheck-routes');
    expect(les.verdelingGeschat).toBe(true);
  });
});

describe('Varianten en determinisme', () => {
  const inv = invoer({ stand: 2, context: { afdeling: 'havo', vak: 'economie', lesduur: 50, ruimte: 'M', aantal: 24 } });
  it('drie varianten, gekozen stand bovenaan', () => {
    const v = genereerVarianten(inv, data);
    expect(v.map((l) => l.stand)).toEqual([2, 1, 3]);
    v.forEach(harde);
  });
  it('dezelfde invoer geeft dezelfde les', () => {
    expect(JSON.stringify(genereerLes(inv, data))).toBe(JSON.stringify(genereerLes(inv, data)));
  });
  it('"Andere suggestie" kiest de eerstvolgende goede kandidaat', () => {
    const a = genereerLes(inv, data);
    const blok = a.fases.find((f) => f.type === 'opening').blokken[0];
    const b = genereerLes({ ...inv, opties: { overslaan: { [blok.sleutel]: 1 } } }, data);
    const nieuw = b.fases.find((f) => f.type === 'opening').blokken[0];
    expect(nieuw.werkvorm.id).not.toBe(blok.werkvorm.id);
    expect(blok.alternatieven).toContain(nieuw.werkvorm.id);
  });
  it('een vastgezette werkvorm blijft staan', () => {
    const a = genereerLes(inv, data);
    const blok = a.fases.find((f) => f.type === 'opening').blokken[0];
    const kies = blok.alternatieven[2];
    const b = genereerLes({ ...inv, opties: { vastgezet: { [blok.sleutel]: kies } } }, data);
    expect(b.fases.find((f) => f.type === 'opening').blokken[0].werkvorm.id).toBe(kies);
  });
});
