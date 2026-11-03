// Staat van de lesgenerator: docentprofiel (blijvend) en het lesconcept (laatste les).
// Alles in de browser; nooit leerlingnamen.
import * as opslag from '../opslag/opslag.js';
import { standaardInvoer } from '../engine/context.js';

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
