// Mijn lessen: een klein logboek in de browser, alleen voor de docent zelf.
// Per les: onderwerp, vak, afdeling, lesduur, stand en de gebruikte werkvormen, plus (later) een reflectie.
// Nooit leerlinggegevens: geen namen, geen klaslijsten, geen cijfers. Niets verlaat de computer.
import * as opslag from './opslag.js';

const SLEUTEL = 'lessen';
const MAX = 40;

export const alleLessen = () => {
  const l = opslag.lees(SLEUTEL, []);
  return Array.isArray(l) ? l.filter((x) => x && typeof x.id === 'string' && Array.isArray(x.werkvormen)) : [];
};
const bewaar = (lijst) => opslag.schrijf(SLEUTEL, lijst.slice(0, MAX));

export const nieuwId = () => `les-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;

/** Werkvormen in een gegenereerde les, in volgorde en zonder dubbelingen. */
export function werkvormenVan(les) {
  const gezien = new Map();
  for (const f of les.fases) for (const b of f.blokken) if (b.werkvorm && !gezien.has(b.werkvorm.id)) gezien.set(b.werkvorm.id, b.werkvorm.naam);
  return [...gezien].map(([id, naam]) => ({ id, naam }));
}

/** Les toevoegen of bijwerken (zelfde id). Een al gegeven reflectie blijft staan. */
export function legVast(id, les, extra = {}) {
  const lijst = alleLessen();
  const oud = lijst.find((x) => x.id === id);
  const regel = {
    id,
    datum: oud?.datum ?? new Date().toISOString().slice(0, 10),
    onderwerp: String(les.doel?.onderwerp ?? '').slice(0, 120),
    vak: extra.vak ?? oud?.vak ?? '',
    afdeling: extra.afdeling ?? oud?.afdeling ?? '',
    leerjaar: Number(les.invoer?.context?.leerjaar) || oud?.leerjaar || null,
    lesduur: les.lesduur,
    stand: les.stand,
    opzet: les.opzetNaam,
    werkvormen: werkvormenVan(les),
    eindtermen: (les.doel?.eindtermen ?? []).length ? (les.invoer?.inhoud?.eindtermen ?? []).filter((g) => g?.sleutel).map((g) => ({ sleutel: String(g.sleutel).slice(0, 120), kader: g.kader, kaderTitel: String(g.kaderTitel ?? '').slice(0, 120), code: String(g.code ?? '').slice(0, 60), tekst: String(g.tekst ?? '').slice(0, 400) })) : [],
    reflectie: oud?.reflectie ?? null
  };
  bewaar([regel, ...lijst.filter((x) => x.id !== id)]);
  return regel;
}

export function bewaarReflectie(id, reflectie) {
  const lijst = alleLessen();
  const les = lijst.find((x) => x.id === id);
  if (!les) return false;
  const oordeel = {};
  for (const w of les.werkvormen) {
    const v = Number(reflectie.oordeel?.[w.id]);
    if (v === 1 || v === -1) oordeel[w.id] = v;
  }
  les.reflectie = {
    datum: new Date().toISOString().slice(0, 10),
    oordeel,
    werkte: String(reflectie.werkte ?? '').slice(0, 600),
    anders: String(reflectie.anders ?? '').slice(0, 600)
  };
  bewaar(lijst);
  werkDuimenBij();
  return true;
}

export function verwijder(id) {
  bewaar(alleLessen().filter((x) => x.id !== id));
  werkDuimenBij();
}

export function wisAlles() {
  opslag.wis(SLEUTEL);
  opslag.wis('duimen');
}

/**
 * Per werkvorm: hoe vaak gebruikt, hoe vaak duim omhoog of omlaag.
 * score = (omhoog − omlaag) / aantal beoordelingen, tussen −1 en 1.
 */
export function ervaringen(lijst = alleLessen()) {
  const per = {};
  for (const les of lijst) {
    for (const w of les.werkvormen) {
      const e = (per[w.id] ??= { id: w.id, naam: w.naam, gebruikt: 0, omhoog: 0, omlaag: 0, laatst: les.datum });
      e.gebruikt++;
      if (les.datum > e.laatst) e.laatst = les.datum;
      const o = les.reflectie?.oordeel?.[w.id];
      if (o === 1) e.omhoog++;
      if (o === -1) e.omlaag++;
    }
  }
  for (const e of Object.values(per)) {
    const n = e.omhoog + e.omlaag;
    e.score = n ? (e.omhoog - e.omlaag) / n : 0;
  }
  return per;
}

/** De generator leest 'duimen' ({werkvormId: −1..1}); die houden we hier bij. */
export function werkDuimenBij() {
  const d = {};
  for (const e of Object.values(ervaringen())) if (e.omhoog + e.omlaag > 0) d[e.id] = Math.round(e.score * 100) / 100;
  opslag.schrijf('duimen', d);
  return d;
}

/**
 * Werkvormen uit je vorige lessen van hetzelfde vak (de les waar je nu aan werkt telt niet mee).
 * De generator geeft die een kleine min, zodat opeenvolgende lessen niet steeds hetzelfde doen.
 */
export function recentGebruikt({ vak = '', behalve = '', aantal = 2 } = {}) {
  const lessen = alleLessen().filter((x) => x.id !== behalve && (!vak || x.vak === vak)).slice(0, aantal);
  return [...new Set(lessen.flatMap((x) => x.werkvormen.map((w) => w.id)))];
}

/** Bestand om mee te nemen naar een andere computer (alleen jouw lessen en reflecties). */
export function naarBestand() {
  return JSON.stringify({ soort: 'uniekind-mijn-lessen', versie: 1, lessen: alleLessen() }, null, 1);
}

export function uitBestand(tekst) {
  const d = JSON.parse(tekst);
  if (d?.soort !== 'uniekind-mijn-lessen' || !Array.isArray(d.lessen)) throw new Error('Dit is geen bestand met Mijn lessen van Uniekind.');
  const schoon = d.lessen.filter((x) => x && typeof x.id === 'string' && Array.isArray(x.werkvormen)).map((x) => ({
    id: String(x.id).slice(0, 60),
    datum: /^\d{4}-\d{2}-\d{2}$/.test(x.datum) ? x.datum : new Date().toISOString().slice(0, 10),
    onderwerp: String(x.onderwerp ?? '').slice(0, 120),
    vak: String(x.vak ?? '').slice(0, 40),
    afdeling: String(x.afdeling ?? '').slice(0, 40),
    leerjaar: Number(x.leerjaar) || null,
    lesduur: Number(x.lesduur) || null,
    stand: [1, 2, 3].includes(Number(x.stand)) ? Number(x.stand) : null,
    opzet: String(x.opzet ?? '').slice(0, 80),
    werkvormen: x.werkvormen.filter((w) => w && typeof w.id === 'string').map((w) => ({ id: String(w.id).slice(0, 80), naam: String(w.naam ?? w.id).slice(0, 80) })),
    eindtermen: (Array.isArray(x.eindtermen) ? x.eindtermen : []).filter((g) => g && typeof g.sleutel === 'string').map((g) => ({ sleutel: g.sleutel.slice(0, 120), kader: String(g.kader ?? '').slice(0, 120), kaderTitel: String(g.kaderTitel ?? '').slice(0, 120), code: String(g.code ?? '').slice(0, 60), tekst: String(g.tekst ?? '').slice(0, 400) })),
    reflectie: x.reflectie && typeof x.reflectie === 'object' ? {
      datum: String(x.reflectie.datum ?? '').slice(0, 10),
      oordeel: Object.fromEntries(Object.entries(x.reflectie.oordeel ?? {}).filter(([, v]) => v === 1 || v === -1)),
      werkte: String(x.reflectie.werkte ?? '').slice(0, 600),
      anders: String(x.reflectie.anders ?? '').slice(0, 600)
    } : null
  }));
  const bestaand = alleLessen();
  const ids = new Set(schoon.map((x) => x.id));
  const samen = [...schoon, ...bestaand.filter((x) => !ids.has(x.id))].sort((a, b) => (a.datum < b.datum ? 1 : -1));
  bewaar(samen);
  werkDuimenBij();
  return schoon.length;
}

/** Per kader: welke kerndoelen of eindtermen in welke lessen aan bod kwamen. */
export function dekking(lijst = alleLessen()) {
  const per = new Map();
  for (const les of lijst) {
    for (const g of les.eindtermen ?? []) {
      const k = per.get(g.kader) ?? { kader: g.kader, titel: g.kaderTitel, regels: new Map() };
      const r = k.regels.get(g.sleutel) ?? { ...g, lessen: [] };
      r.lessen.push({ datum: les.datum, onderwerp: les.onderwerp });
      k.regels.set(g.sleutel, r);
      per.set(g.kader, k);
    }
  }
  return [...per.values()].map((k) => ({ ...k, regels: [...k.regels.values()].sort((a, b) => a.code.localeCompare(b.code, 'nl', { numeric: true })) }));
}
