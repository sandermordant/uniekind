// Sectie-accenten door collega's: optioneel, alleen in de eigen browser, via een bestand naar de beheerder.
import { describe, it, expect } from 'vitest';
import { schoonAccent, sectieVoor, naarAccentBestand, uitAccentBestand, voegAccentenSamen } from '../src/data/sectie-accenten.js';
import { genereerLes } from '../src/engine/opbouw.js';
import { laadData, invoer, mislukt, idsIn } from './helpers.js';

const data = laadData('sophianum');

describe('Sectie-accenten', () => {
  it('alleen geldige velden blijven over', () => {
    expect(schoonAccent({ lesmodel: 'edi', taxonomie: 'x', methodesite: 'javascript:alert(1)', werkvormVanDeMaand: 'wisbordjes', namen: ['Piet'] }))
      .toEqual({ lesmodel: 'edi', werkvormVanDeMaand: 'wisbordjes' });
    expect(schoonAccent(null)).toEqual({});
  });
  it('wat de docent invult gaat voor, de school vult aan', () => {
    const profiel = { sectieAccenten: { perVak: { wiskunde: { lesmodel: 'igdi', methodesite: 'https://methode.example' } } } };
    expect(sectieVoor(profiel, 'wiskunde', { wiskunde: { lesmodel: 'edi' } })).toEqual({ lesmodel: 'edi', methodesite: 'https://methode.example' });
    expect(sectieVoor(profiel, 'wiskunde')).toEqual({ lesmodel: 'igdi', methodesite: 'https://methode.example' });
  });
  it('het is optioneel: zonder accent werkt de les zoals altijd', () => {
    const l = genereerLes(invoer({ context: { afdeling: 'havo', vak: 'wiskunde', lesduur: 50, ruimte: 'L', aantal: 26 } }), data);
    expect(mislukt(l)).toEqual([]);
  });
  it('een eigen accent stuurt de les: lesmodel en werkvorm van de maand', () => {
    const l = genereerLes(invoer({ docent: { sectieAccenten: { wiskunde: { lesmodel: 'edi', werkvormVanDeMaand: 'wisbordjes' } } }, context: { afdeling: 'havo', vak: 'wiskunde', lesduur: 50, ruimte: 'L', aantal: 26 } }), data);
    expect(idsIn(l)).toContain('expliciete-directe-instructie');
    expect(idsIn(l)).toContain('wisbordjes');
    expect(mislukt(l)).toEqual([]);
  });
  it('bestand heen en terug, alleen vakken van de school, samenvoegen per veld', () => {
    const tekst = naarAccentBestand({ wiskunde: { lesmodel: 'edi' }, onbekend: { lesmodel: 'di' }, leeg: {} }, '2026-11-19');
    expect(JSON.parse(tekst)).toMatchObject({ soort: 'uniekind-sectie-accenten', versie: 1, gemaakt: '2026-11-19' });
    expect(uitAccentBestand(tekst, ['wiskunde', 'nederlands'])).toEqual({ wiskunde: { lesmodel: 'edi' } });
    expect(() => uitAccentBestand('{"soort":"iets anders"}')).toThrow(/geen bestand met sectie-accenten/);
    expect(() => uitAccentBestand(tekst, ['nederlands'])).toThrow(/geen accenten voor vakken/);
    expect(voegAccentenSamen({ wiskunde: { lesmodel: 'igdi', taxonomie: 'rtti' } }, { wiskunde: { lesmodel: 'edi' } })).toEqual({ wiskunde: { lesmodel: 'edi', taxonomie: 'rtti' } });
  });
});
