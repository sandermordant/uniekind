// Overige vakken: alle vakken waarvoor SLO stof publiceert, ook als ze niet in het schoolprofiel staan.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { OVERIGE_VAKKEN, metOverigeVakken, zonderOverigeVakken, vakKeuzes } from '../src/data/overige-vakken.js';
import { schoonProfiel } from '../src/data/profiel.js';
import { kadersVoor } from '../src/data/kaders.js';
import { genereerLes } from '../src/engine/opbouw.js';
import { laadData, invoer, mislukt } from './helpers.js';

const index = JSON.parse(readFileSync('public/data/kaders/index.json', 'utf8'));
const NIVEAU_NAAR_AFDELING = { 'vmbo-bb': ['vmbo-b'], 'vmbo-kb': ['vmbo-k'], 'vmbo-gltl': ['mavo'], havo: ['havo'], vwo: ['vwo-a', 'vwo-g'] };
const data = laadData('sophianum');
const profiel = metOverigeVakken(schoonProfiel(data.profiel, data.profiel));

describe('Overige vakken', () => {
  it('elk SLO-vak heeft een plek: in het schoolprofiel of bij de overige vakken', () => {
    const bekend = new Set(profiel.vakken.map((v) => v.id));
    const zonderPlek = index.kaders.filter((k) => !k.vakken.some((v) => bekend.has(v))).map((k) => `${k.sloVak}: ${k.titel}`);
    expect(zonderPlek).toEqual([]);
  });

  it.each(OVERIGE_VAKKEN.map((v) => [v.id, v]))('%s: de afdelingen volgen uit de SLO-kaders', (id, v) => {
    // Referentiekaders (zoals het ERK) gelden voor elk niveau en zeggen niets over waar een vak gegeven wordt
    const kaders = index.kaders.filter((k) => k.vakken.includes(id) && k.soort !== 'referentiekader');
    expect(kaders.length).toBeGreaterThan(0);
    const niveaus = new Set(kaders.flatMap((k) => k.niveaus));
    if (niveaus.has('onderbouw') || niveaus.has('alle')) expect(v.afdelingen).toBe('alle');
    else expect([...v.afdelingen].sort()).toEqual([...new Set([...niveaus].flatMap((n) => NIVEAU_NAAR_AFDELING[n] ?? []))].sort());
  });

  it('een vak uit het schoolprofiel wint en blijft niet-overig', () => {
    const p = metOverigeVakken({ ...profiel, vakken: [{ id: 'spaans', naam: 'Spaans (school)', afdelingen: 'alle' }] , afdelingen: profiel.afdelingen });
    const spaans = p.vakken.filter((v) => v.id === 'spaans');
    expect(spaans).toHaveLength(1);
    expect(spaans[0].naam).toBe('Spaans (school)');
    expect(spaans[0].overig).toBeUndefined();
  });

  it('het schoolprofiel bewerken of downloaden gebeurt zonder de overige vakken', () => {
    expect(zonderOverigeVakken(profiel).vakken.some((v) => v.overig)).toBe(false);
    expect(zonderOverigeVakken(profiel).vakken).toHaveLength(data.profiel.vakken.length);
  });

  it('in een keuzelijst staan de vakken op alfabet, dus T&T onder de T', () => {
    const mavo = vakKeuzes(profiel.vakken.filter((v) => !v.overig && (v.afdelingen === 'alle' || v.afdelingen.includes('mavo')))).map((k) => k[1]);
    expect(mavo).toEqual([...mavo].sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' })));
    expect(mavo.indexOf('T&T (Technologie & Toepassen)')).toBeGreaterThan(mavo.indexOf('Scheikunde'));
    expect(profiel.vakken[0].id).toBe('nederlands'); // het profiel zelf houdt zijn volgorde
  });

  it('in een keuzelijst staan de overige vakken in een eigen groep', () => {
    const k = vakKeuzes(profiel.vakken);
    expect(k.find(([id]) => id === 'nederlands')[2]).toBe('');
    expect(k.find(([id]) => id === 'spaans')[2]).toMatch(/Overige vakken/);
  });

  it('Spaans havo heeft examenstof en levert een les die aan alle eisen voldoet', () => {
    const havo = profiel.afdelingen.find((a) => a.id === 'havo');
    expect(kadersVoor(index, { vak: 'spaans', afdeling: havo, leerjaar: 5 }).some((k) => k.soort === 'examenprogramma')).toBe(true);
    const les = genereerLes(invoer({ stand: 3, context: { afdeling: 'havo', leerjaar: 4, vak: 'spaans', lesduur: 50, ruimte: 'M', aantal: 24 }, inhoud: { onderwerp: 'Leesvaardigheid' } }), { ...data, profiel });
    expect(les.fases.reduce((t, f) => t + f.duur, 0)).toBe(50);
    expect(mislukt(les)).toEqual([]);
  });

  it('de referentiekaders hangen aan de juiste vakken', () => {
    const ref = (id) => index.kaders.find((k) => k.id === id);
    expect(ref('referentiekader-taal').vakken).toContain('nederlands');
    expect(ref('referentiekader-rekenen').vakken).toEqual(expect.arrayContaining(['rekenen', 'wiskunde']));
    expect(ref('referentiekader-erk').vakken).toEqual(expect.arrayContaining(['engels', 'duits', 'frans', 'spaans']));
    for (const id of ['referentiekader-taal', 'referentiekader-rekenen', 'referentiekader-erk']) expect(ref(id).aantal).toBeGreaterThan(400);
  });
});
