// Zet de invoer van de wizard om naar een volledige context met verstandige standaardwaarden.
import { controleerLesdoel } from './tekst.js';
import { zetTermen } from '../data/termen.js';

export const STIJLEN = ['uitleggen', 'structuur', 'samenwerken', 'ontdekken', 'digitaal', 'relatie', 'houvast'];
const NIVEAU_PER_REEKS = {
  introductie: 'begrijpen', uitleg: 'toepassen', verdieping: 'analyseren',
  herhaling: 'toepassen', afsluiting: 'evalueren', toets: 'toepassen'
};

/** Standaardinvoer: wat de snelle modus aanvult. */
export function standaardInvoer(profiel) {
  const afd = profiel.afdelingen.find((a) => a.id === 'havo') ?? profiel.afdelingen[0];
  return {
    stand: 2,
    docent: {
      vakken: [], afdelingen: [],
      stijl: Object.fromEntries(STIJLEN.map((s) => [s, 3])),
      eigenStijl: [], kracht: '',
      lesmodel: profiel.didactiek.lesmodel, taxonomie: profiel.didactiek.taxonomie
    },
    context: {
      afdeling: afd.id, leerjaar: afd.leerjaren[0], vak: profiel.vakken[0]?.id ?? '',
      lesduur: afd.standaardLesduur, ruimte: profiel.ruimtes.some((r) => r.id === 'M') ? 'M' : 'L', stilte: false, aantal: 24, oa: false,
      laptops: 'alle', reeks: 'uitleg', tijdstip: 'midden'
    },
    inhoud: { onderwerp: '', tekst: '', lesdoelen: [], begrippen: [], voorkennis: '', voorkennisZeker: 'zeker', misvattingen: '' },
    klas: {
      verdelingBekend: false, steun: 0, basis: 0, verdieping: 0,
      dyslexie: 0, dyscalculie: 0, nt2: 0, faalangst: 0, structuur: 0, hoogbegaafd: 0,
      dynamiek: 'rustig', samenwerken: 'goed'
    },
    opties: { vastgezet: {}, overslaan: {}, splitsing: null, vorigeLes: [], duimen: {} }
  };
}

const getal = (x, std = 0) => (Number.isFinite(Number(x)) && x !== '' && x != null ? Number(x) : std);

export function maakContext(invoer, profiel) {
  zetTermen(profiel);
  const std = standaardInvoer(profiel);
  const d = { ...std.docent, ...invoer.docent, stijl: { ...std.docent.stijl, ...(invoer.docent?.stijl ?? {}) } };
  const c = { ...std.context, ...invoer.context };
  const inh = { ...std.inhoud, ...invoer.inhoud };
  const k = { ...std.klas, ...invoer.klas };
  const opties = { ...std.opties, ...invoer.opties };

  const afdeling = profiel.afdelingen.find((a) => a.id === c.afdeling) ?? profiel.afdelingen[0];
  const lesduur = Math.max(20, Math.min(240, Math.round(getal(c.lesduur, afdeling.standaardLesduur))));
  // Alleen ruimtes die de school heeft; anders de eerste die er wel is.
  const heeft = (id) => profiel.ruimtes.some((r) => r.id === id);
  const gevraagd = ['M', 'L', 'anders'].includes(c.ruimte) ? c.ruimte : 'L';
  const ruimteId = heeft(gevraagd) || gevraagd === 'anders' ? gevraagd : ['L', 'M', 'anders'].find((r) => r === 'anders' || heeft(r));
  const ruimteDef = profiel.ruimtes.find((r) => r.id === ruimteId);
  const pleinDef = profiel.ruimtes.find((r) => r.id === 'plein');
  const stilteDef = profiel.ruimtes.find((r) => r.id === 'stilte');
  const aantal = Math.max(1, Math.round(getal(c.aantal, 24)));
  const oa = !!c.oa;

  const capaciteit = {
    lokaal: ruimteDef?.capaciteit ?? Infinity,
    plein: pleinDef?.capaciteit ?? Infinity,
    stilte: stilteDef?.capaciteit ?? 0
  };
  const pleinMogelijk = ruimteId === 'M' && !!pleinDef && (oa || profiel.regels.pleinToezichtDoorDocent !== false);
  const stilteMogelijk = !!c.stilte && !!stilteDef && capaciteit.stilte > 0;

  // Verdeling over steun, basis, verdieping
  let verdeling;
  const bekend = !!k.verdelingBekend && getal(k.steun) + getal(k.basis) + getal(k.verdieping) > 0;
  if (bekend) {
    const tot = getal(k.steun) + getal(k.basis) + getal(k.verdieping);
    const f = aantal / tot;
    const steun = Math.round(getal(k.steun) * f);
    const verdieping = Math.round(getal(k.verdieping) * f);
    verdeling = { steun, basis: Math.max(0, aantal - steun - verdieping), verdieping, bekend: true };
  } else {
    const steun = Math.round(aantal * 0.25);
    const verdieping = Math.round(aantal * 0.2);
    verdeling = { steun, basis: aantal - steun - verdieping, verdieping, bekend: false };
  }

  // Lesdoelen en denkniveau
  const doelen = (inh.lesdoelen ?? []).map((x) => (typeof x === 'string' ? { tekst: x } : x)).filter((x) => x.tekst?.trim());
  const doelInfo = doelen.map((x) => {
    const ch = controleerLesdoel(x.tekst);
    return { tekst: x.tekst.trim(), niveau: x.niveau || ch.niveau || NIVEAU_PER_REEKS[c.reeks] || 'begrijpen', waarneembaar: ch.waarneembaar, tip: ch.tip };
  });
  const niveaus = doelInfo.length ? [...new Set(doelInfo.map((x) => x.niveau))] : [NIVEAU_PER_REEKS[c.reeks] ?? 'begrijpen'];

  const behoeften = Object.fromEntries(['dyslexie', 'dyscalculie', 'nt2', 'faalangst', 'structuur', 'hoogbegaafd'].map((b) => [b, Math.max(0, getal(k[b]))]));
  if (bekend && verdeling.verdieping > 0) behoeften.hoogbegaafd = Math.max(behoeften.hoogbegaafd, 0);

  const vak = profiel.vakken.find((v) => v.id === c.vak);
  const sectie = profiel.sectieAccenten?.perVak?.[c.vak] ?? {};
  const stand = [1, 2, 3].includes(Number(invoer.stand)) ? Number(invoer.stand) : 2;

  return {
    profiel, stand,
    // Drie lagen: school (profiel), sectie (accenten per vak) en docent. Een sectie-accent geldt zolang de
    // docent zelf de schoolstandaard heeft laten staan; kiest de docent bewust iets anders, dan wint de docent.
    docent: {
      ...d,
      lesmodel: (!d.lesmodel || d.lesmodel === profiel.didactiek.lesmodel) && sectie.lesmodel ? sectie.lesmodel : d.lesmodel || profiel.didactiek.lesmodel,
      taxonomie: (!d.taxonomie || d.taxonomie === profiel.didactiek.taxonomie) && sectie.taxonomie ? sectie.taxonomie : d.taxonomie || profiel.didactiek.taxonomie
    },
    sectie,
    afdeling, niveau: afdeling.niveau, leerjaar: getal(c.leerjaar, afdeling.leerjaren[0]),
    vak, vakId: c.vak, lesduur, ruimte: ruimteId, ruimteDef, aantal, oa,
    laptops: ['alle', 'deel', 'geen'].includes(c.laptops) ? c.laptops : 'alle',
    reeks: c.reeks ?? 'uitleg', tijdstip: c.tijdstip ?? 'midden',
    capaciteit, pleinMogelijk, stilteMogelijk,
    pleinZicht: profiel.regels.pleinZichtPerKolom?.[afdeling.kolom] ?? 'goed',
    inhoud: { ...inh, doelen: doelInfo }, niveaus,
    verdeling, behoeften,
    dynamiek: k.dynamiek ?? 'rustig', samenwerken: k.samenwerken ?? 'goed',
    opties,
    instructieMax: ruimteId === 'M' ? (profiel.generator.instructieMaxMlokaal ?? 15) : (profiel.generator.instructieMaxStandaard ?? 20)
  };
}
