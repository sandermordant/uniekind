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

describe('Vakken volgens de lessentabellen 2025-2026', () => {
  const vak = (id) => data.profiel.vakken.find((v) => v.id === id);
  const bij = (afd) => data.profiel.vakken.filter((v) => v.afdelingen === 'alle' || v.afdelingen.includes(afd)).map((v) => v.id);
  it('vmbo basis en kader: M&M en M&N in plaats van losse mens- en natuurvakken, D&P als profielvak', () => {
    for (const afd of ['vmbo-b', 'vmbo-k']) {
      expect(bij(afd)).toEqual(expect.arrayContaining(['mm', 'mn', 'dp', 'economie', 'biologie', 'maatschappijleer', 'ckv']));
      for (const id of ['geschiedenis', 'aardrijkskunde', 'natuurkunde', 'scheikunde', 'muziek', 'beroepsgericht']) expect(bij(afd)).not.toContain(id);
    }
  });
  it('nieuwe vakken op de juiste afdelingen', () => {
    expect(vak('wiskunde-d').afdelingen).toEqual(['vwo-a', 'vwo-g']);
    expect(vak('taal-rekenen').afdelingen).toEqual(['havo']);
    expect(vak('tekenen').afdelingen).toEqual(['havo', 'vwo-a', 'vwo-g']);
    expect(vak('sportorientatie').afdelingen).toEqual(['mavo']);
    expect(vak('mentoruur').afdelingen).toBe('alle');
  });
  it('een les voor een vak zonder SLO-kader werkt ook', () => {
    const l = genereerLes(invoer({ stand: 2, context: { afdeling: 'vwo-a', leerjaar: 3, vak: 'taal-cultuur', lesduur: 50, ruimte: 'L', aantal: 28 } }), data);
    expect(l.fases.reduce((t, f) => t + f.duur, 0)).toBe(50);
    expect(mislukt(l)).toEqual([]);
  });
});

describe('Combinatieklas: sterker gericht op differentiatie', () => {
  const ctxLes = (afdeling, leerjaar, klas = {}) => genereerLes(invoer({ stand: 2, context: { afdeling, leerjaar, vak: 'nederlands', lesduur: afdeling.startsWith('vmbo') || afdeling === 'mavo' ? 70 : 50, ruimte: 'L', aantal: 28 }, klas }), data);
  const tipC = (l) => l.tips.find((t) => /^Combinatieklas/.test(t));
  it('vmbo-MiX (leerjaar 1-2) is standaard een combinatieklas', () => {
    expect(tipC(ctxLes('vmbo-b', 1))).toBeTruthy();
    expect(tipC(ctxLes('vmbo-b', 3))).toBeUndefined();
  });
  it('havo/mavo of vwo/havo: alleen als de docent het aangeeft', () => {
    expect(tipC(ctxLes('havo', 1))).toBeUndefined();
    expect(tipC(ctxLes('havo', 1, { gemengd: true }))).toBeTruthy();
    expect(tipC(ctxLes('vmbo-b', 1, { gemengd: false }))).toBeUndefined();
  });
  it('de geschatte verdeling is breder en de les voldoet aan alle eisen', () => {
    const gewoon = ctxLes('havo', 1);
    const gemengd = ctxLes('havo', 1, { gemengd: true });
    const groep = (l, s) => l.groepen.find((g) => g.naam.includes(s))?.aantal ?? 0;
    expect(groep(gemengd, 'verdieping') + groep(gemengd, 'steun')).toBeGreaterThanOrEqual(groep(gewoon, 'verdieping') + groep(gewoon, 'steun'));
    expect(mislukt(gemengd)).toEqual([]);
  });
});

describe('Capaciteit van de stilteruimte bij routes', () => {
  it('een verdiepingsgroep groter dan de stilteruimte gaat daar niet heen', () => {
    const l = genereerLes(invoer({ stand: 3, context: { afdeling: 'vmbo-k', leerjaar: 1, vak: 'duits', lesduur: 70, ruimte: 'L', aantal: 32, stilte: true } }), data);
    const max = data.profiel.ruimtes.find((r) => r.id === 'stilte').capaciteit;
    for (const f of l.fases) expect(f.blokken.filter((b) => b.plek === 'stilte').reduce((n, b) => n + b.aantal, 0)).toBeLessThanOrEqual(max);
    expect(mislukt(l)).toEqual([]);
  });
});
