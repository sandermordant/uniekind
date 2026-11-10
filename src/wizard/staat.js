// Staat van de lesgenerator: docentprofiel (blijvend) en het lesconcept (laatste les).
// Alles in de browser; nooit leerlingnamen.
import * as opslag from '../opslag/opslag.js';
import { standaardInvoer } from '../engine/context.js';
import { recentGebruikt } from '../opslag/logboek.js';

const KLOON = (x) => JSON.parse(JSON.stringify(x));

export function laadDocent(profiel) {
  const std = standaardInvoer(profiel).docent;
  const d = opslag.lees('docentprofiel');
  return d ? { ...std, ...d, stijl: { ...std.stijl, ...(d.stijl ?? {}) } } : { ...std, stand: 2 };
}
export const bewaarDocent = (docent) => opslag.schrijf('docentprofiel', docent);

export function nieuwConcept(profiel, docent) {
  const inv = standaardInvoer(profiel);
  inv.docent = KLOON(docent);
  inv.stand = docent.stand ?? 2;
  if (docent.vakken?.[0]) inv.context.vak = docent.vakken[0];
  if (docent.afdelingen?.[0]) {
    const afd = profiel.afdelingen.find((a) => a.id === docent.afdelingen[0]);
    if (afd) { inv.context.afdeling = afd.id; inv.context.leerjaar = afd.leerjaren[0]; inv.context.lesduur = afd.standaardLesduur; }
  }
  // De klas uit de werkplek (eindexamenklas of andere klas) gaat voor
  const klas = opslag.lees('klas', null);
  const kAfd = klas && profiel.afdelingen.find((a) => a.id === klas.afdeling);
  if (kAfd) {
    inv.context.afdeling = kAfd.id;
    inv.context.leerjaar = kAfd.leerjaren.includes(Number(klas.leerjaar)) ? Number(klas.leerjaar) : kAfd.leerjaren[0];
    inv.context.lesduur = kAfd.standaardLesduur;
    if (klas.vak && profiel.vakken.some((v) => v.id === klas.vak && (v.afdelingen === 'alle' || v.afdelingen.includes(kAfd.id)))) inv.context.vak = klas.vak;
  }
  inv.inhoud.lesdoelen = [{ tekst: '' }];
  return { versie: 1, modus: 'snel', stap: 'snel', invoer: inv, aanpassingen: {}, gekozenStand: null };
}

export function laadConcept(profiel, docent) {
  const c = opslag.lees('concept');
  if (!c || c.versie !== 1 || !c.invoer) return nieuwConcept(profiel, docent);
  c.invoer.docent = { ...c.invoer.docent, ...KLOON(docent), stand: c.invoer.docent?.stand ?? docent.stand };
  return c;
}
export const bewaarConcept = (c) => opslag.schrijf('concept', c);

/** Waarde op een pad als "context.aantal" lezen of zetten. */
export function lees(obj, pad) { return pad.split('.').reduce((o, k) => o?.[k], obj); }
export function zet(obj, pad, waarde) {
  const delen = pad.split('.');
  let o = obj;
  for (const k of delen.slice(0, -1)) o = o[k] ??= {};
  o[delen.at(-1)] = waarde;
}

/** Handmatige aanpassingen (volgorde, tijden) opnieuw toepassen na genereren. */
export function pasAanpassingenToe(les, aanp = {}) {
  if (aanp.volgorde?.length) {
    const pos = new Map(aanp.volgorde.map((id, i) => [id, i]));
    les.fases.sort((a, b) => (pos.get(a.id) ?? 999) - (pos.get(b.id) ?? 999));
  }
  if (aanp.duur) for (const f of les.fases) if (aanp.duur[f.id] != null) f.duur = Math.max(1, Number(aanp.duur[f.id]) || 1);
  return les;
}

/**
 * De invoer voor de generator: het concept plus wat de docent eerder ervoer.
 * Ervaring (duimen uit reflecties) en afwisseling (werkvormen uit de vorige lessen van dit vak) wegen licht mee.
 * Lesmaker en digibord gebruiken allebei deze functie, zodat ze precies dezelfde les tonen.
 */
export function generatorInvoer(concept) {
  const inv = concept.invoer;
  return {
    ...inv,
    opties: { ...inv.opties, duimen: opslag.lees('duimen', {}), vorigeLes: [...new Set([...(inv.opties?.vorigeLes ?? []), ...recentGebruikt({ vak: inv.context?.vak, behalve: concept.logId })])] }
  };
}
