// Het plein: capaciteit en zicht vanuit het M-lokaal per kolom (informatie van Sander, november 2026).
import { describe, it, expect } from 'vitest';
import { genereerLes } from '../src/engine/opbouw.js';
import { schoonProfiel } from '../src/data/profiel.js';
import { laadData, invoer, plekkenIn, mislukt } from './helpers.js';

const data = laadData('sophianum');
const les = (afdeling, extra = {}) => genereerLes(invoer({ stand: 3, context: { afdeling, leerjaar: 3, vak: 'nederlands', lesduur: afdeling.startsWith('vwo') || afdeling === 'havo' ? 50 : 70, ruimte: 'M', aantal: 26, ...extra } }), data);
const tip = (l) => l.tips.find((t) => /minder goed op het/.test(t));

describe('Plein: zicht vanuit het M-lokaal per kolom', () => {
  it('het profiel kent 36 plekken per leerplein en zicht per kolom', () => {
    const p = schoonProfiel(data.profiel, data.profiel);
    expect(p.ruimtes.find((r) => r.id === 'plein').capaciteit).toBe(36);
    expect(p.regels.pleinZichtPerKolom).toEqual({ vmbo: 'goed', mavo: 'beperkt', havo: 'beperkt', vwo: 'goed' });
  });
  it('havo zonder onderwijsassistent: plein mag, met een tip over toezicht', () => {
    const l = les('havo');
    expect(plekkenIn(l).has('plein')).toBe(true);
    expect(tip(l)).toMatch(/havo/);
    expect(mislukt(l)).toEqual([]);
  });
  it('mavo zonder onderwijsassistent krijgt de tip ook', () => {
    expect(tip(les('mavo'))).toBeTruthy();
  });
  it('met een onderwijsassistent, of bij vwo en vmbo, geen tip', () => {
    expect(tip(les('havo', { oa: true }))).toBeUndefined();
    expect(tip(les('vwo-a'))).toBeUndefined();
    expect(tip(les('vmbo-k'))).toBeUndefined();
  });
  it('een onbekende waarde in het profiel wordt genegeerd', () => {
    const p = schoonProfiel({ ...data.profiel, regels: { ...data.profiel.regels, pleinZichtPerKolom: { havo: 'soms', vwo: 'goed' } } }, data.profiel);
    expect(p.regels.pleinZichtPerKolom.havo).toBeUndefined();
    expect(p.regels.pleinZichtPerKolom.vwo).toBe('goed');
  });
});

describe('Informatica', () => {
  it('staat niet meer in het schoolprofiel (niet in de lessentabellen 2025-2026)', () => {
    expect(data.profiel.vakken.some((v) => v.id === 'informatica')).toBe(false);
  });
});
