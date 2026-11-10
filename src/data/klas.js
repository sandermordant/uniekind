// De klas waarvoor de docent voorbereidt: eindexamenklas of een andere klas, met afdeling, leerjaar en vak.
// Eén keer kiezen; de werkplek, de lesmaker, Opgave op niveau en Stof en materiaal nemen het over.
// Dit is lesvoorbereiding, geen leerlinggegeven: er staat geen naam of klascode in.
import * as opslag from '../opslag/opslag.js';
import { sloNiveau } from './kaders.js';

export const MODUS = {
  examen: { id: 'examen', naam: 'Eindexamenklas', hash: 'examenklas', kort: 'Examenklas' },
  regulier: { id: 'regulier', naam: 'Andere klassen', hash: 'klas', kort: 'Andere klassen' }
};

/** Het examenjaar van een afdeling: het laatste leerjaar (vmbo 4, havo 5, vwo 6). */
export const examenjaar = (afd) => Math.max(...(afd?.leerjaren?.length ? afd.leerjaren : [0]));
export const isExamenjaar = (afd, leerjaar) => !!afd && Number(leerjaar) === examenjaar(afd);

/** Leerjaren die bij een modus horen: in de examenklas alleen het examenjaar, anders de rest. */
export function leerjarenVoor(afd, modus) {
  if (!afd) return [];
  return modus === 'examen' ? [examenjaar(afd)] : afd.leerjaren.filter((j) => j !== examenjaar(afd));
}

export const vakkenVoor = (profiel, afdelingId) => profiel.vakken.filter((v) => v.afdelingen === 'alle' || v.afdelingen.includes(afdelingId));

/** De klas uit de opslag, aangevuld en gecontroleerd tegen het schoolprofiel. */
export function laadKlas(profiel, docent = {}, opgeslagen = opslag.lees('klas', null)) {
  const k = { ...(opgeslagen ?? {}) };
  k.modus = k.modus === 'examen' ? 'examen' : 'regulier';
  const afd = profiel.afdelingen.find((a) => a.id === k.afdeling)
    ?? profiel.afdelingen.find((a) => (docent.afdelingen ?? []).includes(a.id)) ?? profiel.afdelingen[0];
  k.afdeling = afd.id;
  const jaren = leerjarenVoor(afd, k.modus);
  if (!jaren.includes(Number(k.leerjaar))) k.leerjaar = jaren[0] ?? afd.leerjaren[0];
  k.leerjaar = Number(k.leerjaar);
  const vakken = vakkenVoor(profiel, afd.id);
  if (!vakken.some((v) => v.id === k.vak)) k.vak = vakken.find((v) => (docent.vakken ?? []).includes(v.id))?.id ?? vakken[0]?.id ?? null;
  k.gekozen = !!opgeslagen;
  return k;
}

export function bewaarKlas(klas) {
  const { gekozen, ...rest } = klas;
  opslag.schrijf('klas', rest);
}

/** Alleen de modus wisselen (bijvoorbeeld via het menu), de rest blijft zo goed mogelijk staan. */
export function zetModus(profiel, docent, modus) {
  const k = laadKlas(profiel, docent, { ...(opslag.lees('klas', {}) ?? {}), modus });
  bewaarKlas(k);
  return k;
}

export const huidigeModus = () => (opslag.lees('klas', null)?.modus === 'examen' ? 'examen' : 'regulier');

export function klasInfo(profiel, klas) {
  const afd = profiel.afdelingen.find((a) => a.id === klas.afdeling);
  const vak = profiel.vakken.find((v) => v.id === klas.vak);
  return { afd, vak, niveau: sloNiveau(afd), naam: `${afd?.naam ?? ''} ${klas.leerjaar}`.trim(), vakNaam: vak?.naam ?? '' };
}
