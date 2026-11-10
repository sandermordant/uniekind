// Alle stof voor één klas en één vak: elk examenprogramma samen met zijn syllabi in één overzicht,
// en verder de kerndoelen, leerdoelenkaarten en keuzevakken. Gebruikt door de werkplek.
import { vlak, kadersVoor, sloNiveau } from './kaders.js';

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const domeinSleutel = (c) => norm(c).replace(/^domein/, '').replace(/[^a-z0-9]/g, '');
const top = (r) => Number(r.sleutel.split(':').pop().split('.')[0]);

/**
 * De onderdelen van de stof: een examenprogramma neemt zijn syllabi mee, andere kaders staan los.
 * In de examenklas vallen de kerndoelen van de onderbouw weg.
 */
export function onderdelenVoor(index, { vak, afdeling, leerjaar, modus, concept = false }) {
  const niveau = sloNiveau(afdeling);
  let lijst = kadersVoor(index, { vak, afdeling, leerjaar }).filter((k) => concept || k.status === 'geldend');
  if (modus === 'examen') lijst = lijst.filter((k) => k.soort !== 'kerndoelen');
  // Op vmbo alleen de kaders van de eigen leerweg (kadersVoor laat ook de andere vmbo-leerwegen toe)
  if (niveau) lijst = lijst.filter((k) => !k.niveaus.some((n) => n.startsWith('vmbo')) || k.niveaus.includes(niveau));
  const ids = new Set(lijst.map((k) => k.id));
  const uit = [];
  for (const k of lijst) {
    if (k.soort === 'syllabus' && k.ep && ids.has(k.ep)) continue; // komt mee met zijn examenprogramma
    const syllabi = k.soort === 'examenprogramma' ? lijst.filter((s) => s.soort === 'syllabus' && s.ep === k.id) : [];
    uit.push({ id: k.id, titel: k.titel, soort: k.soort, status: k.status, kaders: [k, ...syllabi], aantal: [k, ...syllabi].reduce((n, x) => n + x.aantal, 0) });
  }
  return uit;
}

/**
 * Eén lijst regels voor een onderdeel. Bij een examenprogramma komt onder elk domein de uitwerking uit de syllabus
 * (de specifieke eindtermen voor het centraal examen). Elke regel houdt zijn eigen sleutel en kader,
 * zodat koppelen aan een les en de dekking gewoon blijven werken.
 * @param {(info) => object|undefined} kaderVan geeft het geladen kader bij een index-regel
 */
export function stofRegels(onderdeel, kaderVan) {
  const [hoofd, ...syllabi] = onderdeel.kaders;
  const hk = kaderVan(hoofd);
  if (!hk) return null;
  const metInfo = (rows, info) => rows.map((r) => ({ ...r, info }));
  const hoofdRegels = metInfo(vlak(hk), hoofd);
  if (!syllabi.length) return hoofdRegels;
  const syl = syllabi.map((info) => {
    const k = kaderVan(info);
    const groepen = new Map();
    if (k) for (const r of metInfo(vlak(k), info)) {
      const sl = domeinSleutel(k.items[top(r)].c) || `#${top(r)}`;
      if (!groepen.has(sl)) groepen.set(sl, []);
      groepen.get(sl).push(r);
    }
    return { info, groepen };
  });
  const uit = [];
  const sluitAf = (t) => {
    if (t < 0) return;
    const sl = domeinSleutel(hk.items[t]?.c);
    if (!sl) return;
    for (const s of syl) {
      const g = s.groepen.get(sl);
      if (!g?.length) continue;
      uit.push({ kopje: true, sleutel: `kop:${s.info.id}:${sl}`, tekst: `Uitwerking in de ${s.info.titel.replace(/^Syllabus/, 'syllabus')}`, diepte: 1, info: s.info });
      uit.push(...g.filter((r) => r.diepte > 0).map((r) => ({ ...r, diepte: r.diepte + 1 })));
      s.groepen.delete(sl);
    }
  };
  let vorige = -1;
  for (const r of hoofdRegels) {
    if (top(r) !== vorige) { sluitAf(vorige); vorige = top(r); }
    uit.push(r);
  }
  sluitAf(vorige);
  // Wat niet bij een domein past (vmbo-syllabi zonder domeinen, toelichting, vakbegrippen) komt erachter
  for (const s of syl) {
    const rest = [...s.groepen.values()].flat();
    if (!rest.length) continue;
    uit.push({ kopje: true, sleutel: `kop:${s.info.id}:rest`, tekst: s.info.titel, diepte: 0, info: s.info });
    uit.push(...rest.map((r) => ({ ...r, diepte: r.diepte + 1 })));
  }
  return uit;
}

/** De regels onder een regel (zijn nakomelingen), op volgorde. */
export function kinderenVan(regels, regel) {
  const i = regels.findIndex((r) => r.sleutel === regel.sleutel);
  if (i < 0) return [];
  const uit = [];
  for (let j = i + 1; j < regels.length && regels[j].diepte > regel.diepte; j++) uit.push(regels[j]);
  return uit;
}

/** Onderwerpen die je kunt behandelen: regels zonder kinderen, geen kopjes. */
export const isOnderwerp = (r) => !r.kopje && !r.heeftKinderen;
