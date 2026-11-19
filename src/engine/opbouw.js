// Lesopbouw: van invoer naar een complete les.
// Stappen: context → lessjabloon → splitsing/opzet → plaatsing van groepen → werkvormkeuze (filter + score)
// → controles → uitleg. Deterministisch: dezelfde invoer geeft dezelfde les.

import { maakContext } from './context.js';
import { maakSlots, SLOT_TITEL } from './sjablonen.js';
import { hardeFilter } from './filters.js';
import { scoreWerkvorm } from './score.js';
import { planSplitsing, OPZETTEN } from './splitsplanner.js';
import { controleerLes } from './controle.js';
import { uitlegWerkvorm, uitlegLes } from './uitleg.js';
import { termen } from '../data/termen.js';

export const LESVERSIE = 1;
export const STANDEN = { 1: 'Klassikaal-plus', 2: 'Een stap verder', 3: 'Volledig Uniekind' };
const MAX_RUN = 25;
const LESMODEL_ITEM = { di: 'directe-instructie', adi: 'activerende-directe-instructie', edi: 'expliciete-directe-instructie', igdi: 'igdi', eigen: 'directe-instructie' };
const MODELITEMS = Object.values(LESMODEL_ITEM);

// Welke werkvormen passen bij welke rol in de les
const ROL = {
  opening: { cats: ['aandachtrichter'] },
  startopdracht: { ids: ['startopdracht', 'ophaaloefening', 'gespreide-herhaling'], vast: true },
  voorbereiding: { ids: ['afwisselen-opgavetypen', 'gespreide-herhaling', 'ophaaloefening', 'woordweb', 'dual-coding'], terugval: 'zelfstandig' },
  voorkennis: { cats: ['leerstrategie', 'activerende-werkvorm', 'routine'], fase: ['voorkennis'], niet: ['startopdracht'] },
  startcheck: { ids: ['startcheck-routes'], vast: true },
  instructie: { cats: ['instructiemodel'], fase: ['instructie'], niet: ['flipped-start-kennisclip'] },
  check: { cats: ['formatieve-check'], fase: ['check'], alsDan: true },
  basis: { cats: ['activerende-werkvorm', 'leerstrategie'], fase: ['verwerken', 'inoefenen'], terugval: 'zelfstandig' },
  steun: { ids: ['instructietafel', 'verlengde-instructie', 'hintkaarten', 'pre-teaching'] },
  verdieping: { ids: ['compacten-verrijken', 'plusopdracht-klaar', 'drie-sporen', 'keuzebord', 'casusopdracht', 'zelfuitleg-elaboratie', 'sorteeropdracht'], terugval: 'zelfstandig' },
  zelfstandig: { cats: ['leerstrategie', 'activerende-werkvorm'], fase: ['verwerken', 'inoefenen'], groepsvorm: ['individueel', 'tweetal'], terugval: 'basis' },
  zelfinstructie: { ids: ['uitgewerkt-voorbeeld-fading', 'flipped-start-kennisclip'], vast: true },
  clip: { ids: ['flipped-start-kennisclip'], vast: true },
  beweeg: { cats: ['energizer'] },
  afsluiting: { cats: ['afsluiter', 'formatieve-check'], fase: ['afsluiting'] },
  stilte: { ids: ['stilteruimte-route'], vast: true, terugval: 'zelfstandig' },
  element: { ids: ['instructietafel', 'plusopdracht-klaar', 'hintkaarten', 'verlengde-instructie', 'stilteruimte-route'] }
};
// Rol → slottype voor het scoren
const SCORE_ALS = { startopdracht: 'opening', voorbereiding: 'voorkennis', startcheck: 'check', basis: 'verwerken', zelfstandig: 'verwerken', zelfinstructie: 'instructie', clip: 'instructie', stilte: 'verwerken', element: 'verwerken' };
const ZONDER_WERKVORM = new Set(['doel', 'beweeg-zelf', 'zelfcheck']);

/* ───────────── Werkvormkeuze ───────────── */

function maakKiezer(ctx, items) {
  const gebruikt = new Set();
  const kern = new Set(ctx.vak?.kernwerkvormen ?? []);
  const lesmodelItem = LESMODEL_ITEM[ctx.docent.lesmodel] ?? 'directe-instructie';

  function kandidaten(rol, slot, plek, o = {}) {
    const spec = ROL[rol];
    let kand = items.filter((i) => (spec.ids?.includes(i.id) || spec.cats?.includes(i.categorie)) && !spec.niet?.includes(i.id) && !o.niet?.includes(i.id));
    if (spec.fase) kand = kand.filter((i) => spec.fase.some((f) => i.lesfase.includes(f)) || spec.ids?.includes(i.id));
    if (spec.alsDan) kand = kand.filter((i) => i.alsDan?.length >= 2);
    if (spec.groepsvorm) kand = kand.filter((i) => i.groepsvorm.some((g) => spec.groepsvorm.includes(g)));
    if (o.moetGroepsvorm) kand = kand.filter((i) => i.groepsvorm.some((g) => o.moetGroepsvorm.includes(g)));
    if (rol === 'instructie' && ctx.docent.lesmodel !== 'eigen') kand = kand.filter((i) => !MODELITEMS.includes(i.id) || i.id === lesmodelItem);
    if (rol === 'basis' || rol === 'zelfstandig') kand = kand.filter((i) => !['startcheck-routes'].includes(i.id));
    // In het basisonderdeel kernwerkvormen van het vak toevoegen (bijv. ontwerpopdracht bij O&O)
    if (rol === 'basis') for (const id of kern) { const k = items.find((i) => i.id === id); if (k && !kand.includes(k)) kand.push(k); }

    return kand.map((item) => {
      const ruim = spec.vast || kern.has(item.id) ? { ...ctx, stand: 3 } : ctx; // organisatievormen en vakeigen werkvormen: instapniveau telt niet
      const f = hardeFilter(item, slot, ruim, plek, { heleKlas: o.heleKlas });
      const s = scoreWerkvorm(item, SCORE_ALS[rol] ?? rol, ctx);
      let bonus = 0;
      if (spec.vast && spec.ids) bonus += (spec.ids.length - spec.ids.indexOf(item.id)) * 0.5;
      if (rol === 'instructie' && item.id === lesmodelItem) bonus += 5;
      if (kern.has(item.id)) bonus += 2.5;
      if (ctx.inhoud.actualiteit && item.id === 'regionaal-nieuwsitem') bonus += 4; // optioneel actualiteitsmoment (schoolplan 1.3)
      if (o.voorkeur?.[item.id]) bonus += o.voorkeur[item.id];
      if (ctx.sectie?.werkvormVanDeMaand === item.id) bonus += 1; // PLG: de werkvorm van de maand van je sectie
      // Past de werkvorm qua lengte bij het blok? Een werkvorm van 5 minuten vult geen blok van 20.
      if (!['element', 'steun'].includes(rol)) { // die lopen naast het verwerken, de lengte telt dan niet
        if (item.duur.max >= slot.duur) bonus += 1;
        else if (item.duur.max < slot.duur * 0.6) bonus -= 2;
      }
      return { item, ok: f.ok, reden: f.reden, score: s.score + bonus, delen: s.delen };
    });
  }

  return {
    gebruikt,
    kies(sleutel, rol, slot, plek, o = {}) {
      const alle = kandidaten(rol, slot, plek, o);
      const ok = alle.filter((k) => k.ok).sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
      let vrij = ok.filter((k) => !gebruikt.has(k.item.id));
      if (!vrij.length && ROL[rol].terugval) {
        // Alles al gebruikt: kijk bij een verwante rol, zodat de les niet twee keer hetzelfde doet
        const extra = kandidaten(ROL[rol].terugval, slot, plek, o).filter((k) => k.ok && !gebruikt.has(k.item.id));
        vrij = extra.sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
        ok.push(...vrij);
      }
      const pool = vrij.length ? vrij : ok;
      if (!pool.length) return { item: null, alternatieven: [], afgevallen: alle.slice(0, 5).map((k) => ({ id: k.item.id, reden: k.reden })) };
      let keuze;
      const vast = ctx.opties.vastgezet?.[sleutel];
      if (vast) keuze = ok.find((k) => k.item.id === vast);
      // Uit een lesbestand: de werkvorm die toen gekozen was, tenzij je om een andere suggestie vroeg
      const eerder = !vast && !ctx.opties.overslaan?.[sleutel] ? ctx.opties.gekozen?.[sleutel] : null;
      if (!keuze && eerder) keuze = pool.find((k) => k.item.id === eerder);
      if (!keuze) keuze = pool[(Number(ctx.opties.overslaan?.[sleutel]) || 0) % pool.length];
      if (!kern.has(keuze.item.id)) gebruikt.add(keuze.item.id); // vakeigen werkvormen mogen in een volgend blok doorlopen
      return {
        item: keuze.item, score: keuze.score, delen: keuze.delen, vastgezet: !!vast && keuze.item.id === vast,
        alternatieven: ok.filter((k) => k !== keuze).slice(0, 6).map((k) => k.item.id),
        afgevallen: alle.filter((k) => !k.ok).slice(0, 5).map((k) => ({ id: k.item.id, naam: k.item.naam, reden: k.reden }))
      };
    }
  };
}

/* ───────────── Opzetten: wie is waar ───────────── */

const g = (id, naam, rol, aantal) => ({ id, naam, rol, aantal });
// Waar de verdiepingsgroep werkt: alleen op het plein of in de stilteruimte als de groep daar past (nooit boven de capaciteit)
const verdiepingPlek = (ctx) => {
  const n = ctx.verdeling.verdieping;
  if (ctx.stand >= 2 && ctx.pleinMogelijk && ctx.dynamiek !== 'onrustig' && n <= ctx.capaciteit.plein) return 'plein';
  if (ctx.stand === 3 && ctx.stilteMogelijk && n <= ctx.capaciteit.stilte) return 'stilte';
  return 'lokaal';
};

function routeGroepen(ctx, zonder = 0) {
  // Verdeel de klas over steun, basis en verdieping; 'zonder' leerlingen gaan naar een aparte groep (uit verdieping eerst).
  const v = { ...ctx.verdeling };
  let weg = zonder;
  for (const k of ['verdieping', 'basis', 'steun']) { const t = Math.min(v[k], weg); v[k] -= t; weg -= t; }
  return v;
}

function vervangSlots(slots, ctx) { return slots.map((s) => ({ ...s })); }

function opzetKlassikaal(ctx, slots) {
  return {
    slots, groepen: [g('K', 'Hele klas', 'klas', ctx.aantal)],
    plaats(s) {
      const rol = s.type === 'verwerken' ? 'basis' : s.type === 'tussencheck' ? 'check' : s.type;
      return [{ groep: 'K', plek: 'lokaal', rol, begeleiding: 'docent' }];
    }
  };
}

function opzetRoutes(ctx, slots) {
  const v = ctx.verdeling;
  const startcheck = ctx.stand === 3 || !v.bekend;
  slots = vervangSlots(slots, ctx);
  if (startcheck) {
    const vk = slots.find((s) => s.type === 'voorkennis');
    if (vk) { vk.type = 'startcheck'; vk.id = 'startcheck-1'; }
  }
  const groepen = [g('A', 'Groep A · steun', 'steun', v.steun), g('B', 'Groep B · basis', 'basis', v.basis), g('C', 'Groep C · verdieping', 'verdieping', v.verdieping)].filter((x) => x.aantal > 0);
  const heeft = (id) => groepen.some((x) => x.id === id);
  const vplek = verdiepingPlek(ctx);
  const iStart = slots.findIndex((s) => s.type === 'startcheck');
  const iCheck = slots.findIndex((s) => s.type === 'check');
  const iVerw = slots.findIndex((s) => s.type === 'verwerken');
  const cWeg = (i) => (ctx.stand === 3 && iStart >= 0 && i > iStart) || (ctx.docent.lesmodel === 'igdi' && i >= iCheck) || i >= iVerw;
  const begB = ctx.oa ? 'oa' : 'zelfstandig';
  return {
    slots, groepen,
    plaats(s, i) {
      const uit = [];
      const alleLokaal = (rol) => groepen.forEach((x) => uit.push({ groep: x.id, plek: 'lokaal', rol, begeleiding: 'docent' }));
      if (s.type === 'afsluiting') { alleLokaal('afsluiting'); return uit; }
      const cBinnen = !heeft('C') || !cWeg(i);
      if (s.type !== 'verwerken' && cBinnen) { alleLokaal(s.type === 'tussencheck' ? 'check' : s.type); return uit; }
      const lokaalGroepen = groepen.filter((x) => x.id !== 'C');
      if (s.type === 'verwerken') {
        if (heeft('A')) uit.push({ groep: 'A', plek: 'lokaal', rol: 'steun', begeleiding: 'docent' });
        if (heeft('B')) uit.push({ groep: 'B', plek: 'lokaal', rol: 'basis', begeleiding: begB });
      } else {
        const rol = s.type === 'tussencheck' ? 'check' : s.type;
        lokaalGroepen.forEach((x) => uit.push({ groep: x.id, plek: 'lokaal', rol, begeleiding: 'docent' }));
      }
      if (heeft('C')) {
        const rol = s.type === 'beweeg' ? (vplek === 'lokaal' ? 'beweeg' : 'beweeg-zelf') : s.type === 'tussencheck' ? 'check' : 'verdieping';
        uit.push({ groep: 'C', plek: vplek, rol, begeleiding: vplek === 'lokaal' ? 'docent' : 'op afstand' });
      }
      return uit;
    }
  };
}

function opzetPleinGroep(ctx, slots, soort, pleinGroep) {
  // gespreide-start, flipped, oa, stilte: een groep P werkt de hele les op het plein (of in de stilteruimte)
  const plek = soort === 'stilte' ? 'stilte' : 'plein';
  const P = Math.max(1, pleinGroep);
  const r = routeGroepen(ctx, P);
  const groepen = [g('A', 'Groep A · steun', 'steun', r.steun), g('B', 'Groep B · basis', 'basis', r.basis + r.verdieping),
    g('P', plek === 'stilte' ? 'Groep S · stilteruimte' : 'Groep P · plein', soort === 'stilte' ? 'stilte' : (P <= ctx.verdeling.verdieping ? 'verdieping' : 'zelfstandig'), P)].filter((x) => x.aantal > 0);
  const verdiepingAlleen = P <= ctx.verdeling.verdieping;
  const beg = soort === 'oa' ? 'oa' : 'op afstand';
  const routes = opzetRoutes({ ...ctx, stand: Math.min(ctx.stand, 2), verdeling: { ...ctx.verdeling, ...r, verdieping: 0, bekend: true } }, slots);
  return {
    slots: routes.slots, groepen,
    plaats(s, i) {
      const uit = routes.plaats(s, i).filter((x) => x.groep !== 'C');
      let rol;
      if (s.type === 'opening' || s.type === 'doel') rol = soort === 'stilte' ? 'stilte' : 'startopdracht';
      else if (s.type === 'beweeg') rol = 'beweeg-zelf';
      else if (s.type === 'afsluiting') rol = 'afsluiting';
      else if (s.type === 'instructie') rol = soort === 'flipped' ? 'clip' : verdiepingAlleen ? 'verdieping' : 'zelfinstructie';
      else if (s.type === 'check' || s.type === 'tussencheck') rol = verdiepingAlleen ? 'verdieping' : 'check';
      else rol = verdiepingAlleen ? 'verdieping' : 'zelfstandig';
      if (soort === 'stilte' && rol === 'startopdracht') rol = 'stilte';
      uit.push({ groep: 'P', plek, rol, begeleiding: beg });
      return uit;
    }
  };
}

function opzetStartcheck(ctx, slots, pleinGroep) {
  // Iedereen start op het plein met de startcheck; daarna gaat de instructiegroep naar binnen.
  slots = vervangSlots(slots, ctx);
  const op = slots.find((s) => s.type === 'opening');
  const vk = slots.find((s) => s.type === 'voorkennis');
  const grootsteVerw = () => slots.filter((s) => s.type === 'verwerken').sort((a, b) => b.duur - a.duur)[0];
  // De startcheck krijgt de tijd van de oude opening (+ voorkennis); de lokaalgroep krijgt daarna
  // een korte aandachtrichter van 2 minuten, die uit het verwerken komt.
  const sc = { type: 'startcheck', id: 'startcheck-1', duur: op.duur + (vk?.duur ?? 0) };
  if (vk) slots.splice(slots.indexOf(vk), 1);
  op.duur = 2;
  slots.unshift(sc);
  let teveel = slots.reduce((t, s) => t + s.duur, 0) - ctx.lesduur;
  while (teveel > 0) { grootsteVerw().duur--; teveel--; }
  while (sc.duur < 5) { sc.duur++; grootsteVerw().duur--; }

  const P = Math.max(1, pleinGroep);
  const r = routeGroepen(ctx, P);
  const groepen = [g('A', 'Groep A · steun', 'steun', r.steun), g('B', 'Groep B · basis', 'basis', r.basis + r.verdieping), g('C', 'Groep C · verdieping (plein)', 'verdieping', P)].filter((x) => x.aantal > 0);
  const lokaal = groepen.filter((x) => x.id !== 'C');
  return {
    slots, groepen,
    plaats(s) {
      if (s.type === 'startcheck') return groepen.map((x) => ({ groep: x.id, plek: 'plein', rol: 'startcheck', begeleiding: 'docent' }));
      const uit = [];
      if (s.type === 'verwerken') {
        if (lokaal.some((x) => x.id === 'A')) uit.push({ groep: 'A', plek: 'lokaal', rol: 'steun', begeleiding: 'docent' });
        if (lokaal.some((x) => x.id === 'B')) uit.push({ groep: 'B', plek: 'lokaal', rol: 'basis', begeleiding: ctx.oa ? 'oa' : 'zelfstandig' });
      } else {
        const rol = s.type === 'tussencheck' ? 'check' : s.type;
        lokaal.forEach((x) => uit.push({ groep: x.id, plek: 'lokaal', rol, begeleiding: 'docent' }));
      }
      const pr = s.type === 'beweeg' ? 'beweeg-zelf' : s.type === 'afsluiting' ? 'afsluiting' : s.type === 'tussencheck' ? 'check' : 'verdieping';
      if (groepen.some((x) => x.id === 'C')) uit.push({ groep: 'C', plek: 'plein', rol: pr, begeleiding: 'op afstand' });
      return uit;
    }
  };
}

function opzetCarrousel(ctx, basisSlots) {
  const D = ctx.lesduur;
  const get = (t) => basisSlots.find((s) => s.type === t)?.duur ?? 0;
  const o = get('opening'), d = get('doel'), c = get('check'), a = get('afsluiting');
  const nBeweeg = basisSlots.filter((s) => s.type === 'beweeg').length;
  let I = Math.min(get('instructie'), ctx.instructieMax - d);
  let R = D - o - 2 * (d + I + c) - a - nBeweeg * 3;
  while (R < 10 && I > 5) { I--; R += 2; }
  const slots = [
    { type: 'opening', duur: o }, { type: 'doel', duur: d }, { type: 'instructie', duur: I }, { type: 'check', duur: c },
    { type: 'doel', duur: d, wissel: true }, { type: 'instructie', duur: I }, { type: 'check', duur: c }
  ];
  const delen = Math.max(Math.ceil(R / MAX_RUN), nBeweeg > 0 && R >= 12 ? Math.min(nBeweeg + 1, Math.floor(R / 6)) : 1);
  for (let k = 0; k < delen; k++) {
    const duur = Math.floor(R / delen) + (k < R % delen ? 1 : 0);
    slots.push({ type: 'verwerken', duur });
    if (k < delen - 1 && nBeweeg > 0) slots.push({ type: 'beweeg', duur: 3 });
  }
  const gebruikteBeweeg = slots.filter((s) => s.type === 'beweeg').length;
  if (gebruikteBeweeg < nBeweeg) slots[slots.length - 1].duur += (nBeweeg - gebruikteBeweeg) * 3;
  slots.push({ type: 'afsluiting', duur: a });
  slots.forEach((s, i) => { s.id = `${s.type}-${slots.slice(0, i).filter((x) => x.type === s.type).length + 1}`; });

  const X = Math.ceil(ctx.aantal / 2), Y = ctx.aantal - X;
  const groepen = [g('X', 'Groep X · eerst instructie', 'wissel', X), g('Y', 'Groep Y · eerst plein', 'wissel', Y)];
  const iWissel = slots.findIndex((s) => s.wissel);
  return {
    slots, groepen, herhaalRollen: ['instructie', 'check'],
    plaats(s, i) {
      if (i < iWissel) {
        return [{ groep: 'X', plek: 'lokaal', rol: s.type, begeleiding: 'docent' },
          { groep: 'Y', plek: 'plein', rol: s.type === 'opening' ? 'startopdracht' : 'voorbereiding', begeleiding: 'op afstand' }];
      }
      if (s.type === 'doel' || s.type === 'instructie' || s.type === 'check') {
        return [{ groep: 'Y', plek: 'lokaal', rol: s.type, begeleiding: 'docent' }, { groep: 'X', plek: 'plein', rol: 'zelfstandig', begeleiding: 'op afstand' }];
      }
      if (s.type === 'beweeg') return [{ groep: 'Y', plek: 'lokaal', rol: 'beweeg', begeleiding: 'docent' }, { groep: 'X', plek: 'plein', rol: 'beweeg-zelf', begeleiding: 'op afstand' }];
      if (s.type === 'afsluiting') return [{ groep: 'Y', plek: 'lokaal', rol: 'afsluiting', begeleiding: 'docent' }, { groep: 'X', plek: 'plein', rol: 'afsluiting', begeleiding: 'op afstand' }];
      return [{ groep: 'Y', plek: 'lokaal', rol: 'basis', begeleiding: 'docent' }, { groep: 'X', plek: 'plein', rol: 'verdieping', begeleiding: 'op afstand' }];
    }
  };
}

const ORGANISATIE = { 'gespreide-start': 'gespreide-start', startcheck: 'startcheck-routes', carrousel: 'rotatie-lokaal-plein', flipped: 'flipped-start-kennisclip', oa: 'gespreide-start', stilte: 'stilteruimte-route' };

/* ───────────── Relevantie-haak ───────────── */

function relevantie(ctx) {
  const haken = ctx.profiel.regio?.haken ?? [];
  const passend = haken.filter((h) => h.vakken.includes(ctx.vakId));
  const lijst = passend.length ? passend : haken;
  const h = [...(ctx.inhoud.onderwerp || 'les')].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const haak = lijst.length ? lijst[h % lijst.length] : null;
  return {
    vraag: `Waarom leren we dit? Wat heeft ${ctx.inhoud.onderwerp || 'dit onderwerp'} met jou te maken?`,
    regionaal: haak?.thema ?? null,
    invulveld: 'Vul hier je eigen voorbeeld in: een situatie uit het leven van je leerlingen of uit de regio.'
  };
}

/* ───────────── De les bouwen ───────────── */

export function bouwLes(ctx, items) {
  const slots0 = maakSlots(ctx.lesduur, {
    lesmodel: ctx.docent.lesmodel,
    instructieMax: ctx.instructieMax,
    extraBeweeg: ctx.lesduur <= 50 && (ctx.dynamiek === 'onrustig' || ctx.tijdstip === 'laatste'),
    extraVoorkennis: ctx.inhoud.voorkennisZeker !== 'zeker' || (ctx.stand >= 2 && !ctx.verdeling.bekend) || ctx.stand === 3
  });
  const split = planSplitsing(ctx);
  const opzetId = split.gekozen ?? (ctx.opties.splitsing === 'routes' ? 'routes' : ctx.stand === 1 ? 'klassikaal' : 'routes');
  const pg = split.opties.find((o) => o.id === opzetId)?.pleinGroep ?? 0;
  const opzet =
    opzetId === 'klassikaal' ? opzetKlassikaal(ctx, slots0)
      : opzetId === 'routes' ? opzetRoutes(ctx, slots0)
        : opzetId === 'startcheck' ? opzetStartcheck(ctx, slots0, pg)
          : opzetId === 'carrousel' ? opzetCarrousel(ctx, slots0)
            : opzetPleinGroep(ctx, slots0, opzetId, pg);

  const groepAantal = Object.fromEntries(opzet.groepen.map((x) => [x.id, x.aantal]));

  function kiesAlles(constraint) {
    const kiezer = maakKiezer(ctx, items);
    // 1. Plaatsingen per slot
    const plaatsingen = opzet.slots.map((s, i) => opzet.plaats(s, i));
    // 2. Blokken: groepen met dezelfde plek en rol in een slot vormen één blok
    const blokkenPerSlot = plaatsingen.map((pl) => {
      const m = new Map();
      for (const p of pl) {
        if (!groepAantal[p.groep]) continue;
        const k = `${p.plek}|${p.rol}|${p.begeleiding}`;
        if (!m.has(k)) m.set(k, { plek: p.plek, rol: p.rol, begeleiding: p.begeleiding, groepen: [] });
        m.get(k).groepen.push(p.groep);
      }
      return [...m.values()];
    });
    // 3. Runs: hetzelfde blok in opeenvolgende slots (max 25 min) krijgt één werkvorm
    const runs = [];
    const open = new Map();
    blokkenPerSlot.forEach((blokken, i) => {
      const s = opzet.slots[i];
      const nu = new Set();
      for (const b of blokken) {
        const k = `${b.plek}|${b.rol}|${b.groepen.join('')}`;
        nu.add(k);
        const r = open.get(k);
        const kanDoor = r && r.eind === i - 1 && r.duur + s.duur <= MAX_RUN && !ZONDER_WERKVORM.has(b.rol)
          && ['verdieping', 'zelfstandig', 'voorbereiding', 'startopdracht', 'stilte', 'basis', 'steun'].includes(b.rol)
          && !(s.type === 'verwerken' && opzet.slots[r.eind].type === 'verwerken' && b.rol !== 'verdieping');
        if (kanDoor) { r.eind = i; r.duur += s.duur; r.slots.push(i); b.run = r; }
        else { const nr = { ...b, start: i, eind: i, duur: s.duur, slots: [i] }; runs.push(nr); open.set(k, nr); b.run = nr; }
      }
      for (const k of [...open.keys()]) if (!nu.has(k)) open.delete(k);
    });
    // 4. Werkvorm per run
    let eersteBasis = true;
    const eerdere = {};
    for (const r of runs) {
      if (ZONDER_WERKVORM.has(r.rol)) continue;
      if (opzet.herhaalRollen?.includes(r.rol) && eerdere[r.rol]) { r.keuze = eerdere[r.rol]; r.sleutel = eerdere[r.rol].sleutel; continue; }
      const s0 = opzet.slots[r.start];
      const sleutel = `${opzet.slots[r.start].id}:${r.rol}:${r.groepen.join('')}`;
      const heleKlas = r.groepen.reduce((t, x) => t + groepAantal[x], 0) === ctx.aantal;
      const o = { heleKlas };
      if (r.rol === 'basis' && eersteBasis && constraint) { o.moetGroepsvorm = constraint; eersteBasis = false; }
      if (r.rol === 'verdieping' && ctx.verdeling.bekend && ctx.verdeling.verdieping >= 4) o.voorkeur = { 'compacten-verrijken': 1.5 };
      const keuze = kiezer.kies(sleutel, r.rol, { type: s0.type, duur: r.duur }, r.plek, o);
      r.sleutel = sleutel;
      r.keuze = keuze;
      keuze.sleutel = sleutel;
      if (!eerdere[r.rol]) eerdere[r.rol] = keuze;
    }
    // Geen passende werkvorm voor een kort tussenblok? Laat de vorige (of volgende) werkvorm van die groep doorlopen.
    for (const r of runs) {
      if (ZONDER_WERKVORM.has(r.rol) || r.keuze?.item) continue;
      const zelfde = (x) => x !== r && x.keuze?.item && x.plek === r.plek && x.groepen.join('') === r.groepen.join('');
      const vorige = runs.filter((x) => zelfde(x) && x.eind < r.start).sort((a, b) => b.eind - a.eind)[0];
      const volgende = runs.filter((x) => zelfde(x) && x.start > r.eind).sort((a, b) => a.start - b.start)[0];
      const past = (x) => x && x.duur + r.duur <= MAX_RUN && (x.eind === r.start - 1 || x.start === r.eind + 1);
      const bron = past(vorige) ? vorige : past(volgende) ? volgende : null;
      if (bron) { r.keuze = { ...bron.keuze, alternatieven: [], afgevallen: [] }; r.sleutel = bron.sleutel; r.doorloop = true; bron.duur += r.duur; }
      else r.rol = 'zelfcheck'; // kort moment zonder nieuwe werkvorm
    }
    return { blokkenPerSlot, runs, kiezer };
  }

  let res = kiesAlles(null);
  const vormen = (rs) => rs.filter((r) => r.keuze?.item).flatMap((r) => r.keuze.item.groepsvorm);
  let gv = vormen(res.runs);
  if (!gv.some((x) => x === 'tweetal' || x === 'groepje')) { res = kiesAlles(['tweetal', 'groepje']); }
  else if (!gv.includes('individueel')) { res = kiesAlles(['individueel']); }

  // Extra differentiatie-element (klassikaal) en organisatievorm
  const extraKiezer = maakKiezer(ctx, items);
  for (const r of res.runs) if (r.keuze?.item) extraKiezer.gebruikt.add(r.keuze.item.id);
  const differentiatie = [];
  let element = null;
  const iEersteVerw = opzet.slots.findIndex((s) => s.type === 'verwerken');
  const kiesElement = () => {
    const e = extraKiezer.kies('element', 'element', { type: 'verwerken', duur: opzet.slots[iEersteVerw]?.duur ?? 15 }, 'lokaal', { niet: ctx.stilteMogelijk ? [] : ['stilteruimte-route'] });
    return e?.item ? e : null;
  };
  if (opzetId === 'klassikaal') element = kiesElement();
  for (const r of res.runs) if (r.keuze?.item?.categorie === 'differentiatievorm' && !differentiatie.includes(r.keuze.item.id)) differentiatie.push(r.keuze.item.id);
  // Niemand in de steun- of verdiepingsgroep opgegeven? Dan toch één element: wie twijfelt of klaar is, heeft iets.
  if (!element && !differentiatie.length && iEersteVerw >= 0) element = kiesElement();
  if (element?.item) differentiatie.unshift(element.item.id);
  let organisatie = null;
  if (ORGANISATIE[opzetId]) organisatie = items.find((i) => i.id === ORGANISATIE[opzetId]) ?? null;
  else if (opzetId === 'routes' && ctx.ruimte !== 'M' && ctx.stand >= 2) organisatie = items.find((i) => i.id === 'hoeken-l-lokaal') ?? null;
  if (organisatie && !differentiatie.includes(organisatie.id)) differentiatie.push(organisatie.id);

  // Fasen samenstellen
  let start = 0;
  const fases = opzet.slots.map((s, i) => {
    const blokken = res.blokkenPerSlot[i].map((b) => {
      const r = b.run;
      const item = r.keuze?.item ?? null;
      return {
        groepen: b.groepen, plek: b.plek, begeleiding: b.begeleiding,
        aantal: b.groepen.reduce((t, x) => t + (groepAantal[x] ?? 0), 0),
        werkvorm: item ? { id: item.id, naam: item.naam, categorie: item.categorie } : null,
        sleutel: r.sleutel ?? null, vervolg: r.start !== i || !!r.doorloop, vastgezet: !!r.keuze?.vastgezet,
        alternatieven: r.start === i ? (r.keuze?.alternatieven ?? []) : [],
        afgevallen: r.start === i ? (r.keuze?.afgevallen ?? []) : [],
        uitleg: item && r.start === i ? uitlegWerkvorm(item, b, r.keuze.delen, ctx) : null,
        rol: r.rol,
        tekst: r.rol === 'beweeg-zelf' ? 'Korte pauze op je plek: sta even op, rek je uit en kijk je werk na met de antwoordkaart.'
          : r.rol === 'zelfcheck' ? 'Zelfcheck: kijk je werk na met de antwoordkaart en schrijf op wat je nog lastig vindt.' : null
      };
    });
    const f = { id: s.id, type: s.type, titel: s.wissel ? 'Wissel: de andere groep krijgt instructie' : SLOT_TITEL[s.type] ?? s.type, start, duur: s.duur, blokken };
    if (i === iEersteVerw && element?.item) f.extra = [{ id: element.item.id, naam: element.item.naam, uitleg: uitlegWerkvorm(element.item, blokken[0], element.delen, ctx) }];
    if (organisatie && i === iEersteVerw) f.organisatie = { id: organisatie.id, naam: organisatie.naam };
    start += s.duur;
    return f;
  });

  const alleIds = [...new Set(fases.flatMap((f) => f.blokken.map((b) => b.werkvorm?.id).filter(Boolean)))];
  const gebruiktItems = alleIds.map((id) => items.find((i) => i.id === id));
  const plekken = new Set(fases.flatMap((f) => f.blokken.map((b) => b.plek)));
  const routines = [];
  if (plekken.has('plein')) routines.push('pleinafspraken', 'overgangsscript-lokaal-plein');
  if (alleIds.includes('instructietafel') || element?.item?.id === 'instructietafel') routines.push('signaalkaarten', 'eerst-drie-dan-ik');
  if (gebruiktItems.some((i) => i.groepsvorm.includes('groepje') && !i.groepsvorm.includes('individueel'))) routines.push('rolkaarten');
  if (opzet.groepen.length > 1) routines.push('timer-geluidsniveau');

  const les = {
    versie: LESVERSIE,
    stand: ctx.stand, standNaam: STANDEN[ctx.stand],
    opzet: opzetId, opzetNaam: OPZETTEN[opzetId]?.naam ?? opzetId, opzetKort: OPZETTEN[opzetId]?.kort ?? '',
    lesduur: ctx.lesduur, ruimte: ctx.ruimte, ruimteNaam: ctx.ruimteDef?.naam ?? ctx.ruimte, aantal: ctx.aantal,
    capaciteit: { lokaal: Number.isFinite(ctx.capaciteit.lokaal) ? ctx.capaciteit.lokaal : null, plein: ctx.capaciteit.plein, stilte: ctx.capaciteit.stilte },
    instructieMax: ctx.instructieMax, lesmodel: ctx.docent.lesmodel,
    groepen: opzet.groepen.filter((x) => x.aantal > 0),
    verdelingGeschat: !ctx.verdeling.bekend,
    fases,
    splitsing: split,
    differentiatie: differentiatie.map((id) => ({ id, naam: items.find((i) => i.id === id)?.naam ?? id })),
    routines: [...new Set(routines)],
    doel: { lesdoelen: ctx.inhoud.doelen, onderwerp: ctx.inhoud.onderwerp, begrippen: ctx.inhoud.begrippen ?? [], eindtermen: (ctx.inhoud.eindtermen ?? []).filter((g) => g && g.tekst).map((g) => ({ code: g.code, tekst: g.tekst, kaderTitel: g.kaderTitel })), relevantie: relevantie(ctx) },
    vooruitblik: 'Vertel kort wat de volgende les komt en hoe het aansluit op vandaag.',
    materiaalAdvies: {
      dyslexievriendelijk: ctx.behoeften.dyslexie > 0,
      rustigeVersie: ctx.behoeften.faalangst > 0 || ctx.behoeften.structuur > 0,
      vaktaalkaart: true,
      rekenhulpkaart: !!ctx.vak?.rekenen || ctx.behoeften.dyscalculie > 0,
      oaKaart: ctx.oa
    },
    oa: ctx.oa ? { aanwezig: true, rol: opzetId === 'oa' ? 'Begeleidt groep P op het plein met een eigen instructiekaart.' : fases.some((f) => f.blokken.some((b) => b.begeleiding === 'oa')) ? 'Begeleidt groep B tijdens het verwerken met een eigen kaart; jij zit aan de instructietafel.' : 'Loopt rond en helpt waar nodig, met een eigen kaart.' } : null,
    tips: [],
    invoer: null
  };
  if (ctx.reeks === 'toets' || ctx.behoeften.faalangst > 0) les.tips.push('Examenstress en faalangst spelen bij veel leerlingen. Oefen zonder cijfer, maak succescriteria zichtbaar en laat antwoorden eerst op papier of een wisbordje geven.');
  // Verwijzing naar het ondersteuningsaanbod van de school (uit het profiel), alleen bij behoeften die in deze klas spelen.
  const aanbod = (id) => ctx.profiel.ondersteuning?.find((o) => o.id === id);
  const verwijs = [];
  for (const b of ['dyslexie', 'dyscalculie', 'nt2', 'faalangst', 'hoogbegaafd']) {
    const o = aanbod(b);
    if (ctx.behoeften[b] > 0 && o?.aanbod) verwijs.push(`${o.naam}: ${o.aanbod.charAt(0).toLowerCase()}${o.aanbod.slice(1)}`);
  }
  if (ctx.verdeling.bekend && ctx.verdeling.verdieping > 0 && !(ctx.behoeften.hoogbegaafd > 0) && aanbod('hoogbegaafd')?.aanbod) verwijs.push(`${aanbod('hoogbegaafd').naam}: ${aanbod('hoogbegaafd').aanbod.charAt(0).toLowerCase()}${aanbod('hoogbegaafd').aanbod.slice(1)}`);
  if (ctx.verdeling.bekend && ctx.verdeling.steun > 0 && (ctx.vak?.taal || ctx.vak?.rekenen) && aanbod('taal-rekenen')?.inDeLes) verwijs.push(`${aanbod('taal-rekenen').naam}: ${aanbod('taal-rekenen').inDeLes.charAt(0).toLowerCase()}${aanbod('taal-rekenen').inDeLes.slice(1)}`);
  if (verwijs.length) les.tips.push(`Op school is er ondersteuning buiten de les. ${verwijs.map((v) => v.replace(/\.+$/, '')).join('. ')}.`);
  if (ctx.reeks === 'toets' && aanbod('examenstress')?.inDeLes) les.tips.push(aanbod('examenstress').inDeLes);
  if (ctx.inhoud.misvattingen) les.tips.push(`Bekende struikelpunten: ${ctx.inhoud.misvattingen}. Gebruik ze als foute antwoorden in je check.`);
  if (split.waarschuwing) les.tips.push(split.waarschuwing);
  if (ctx.gemengd) les.tips.push('Combinatieklas: iedereen werkt aan hetzelfde lesdoel, op het niveau dat past. De routes volgen wat leerlingen in deze les nodig hebben, niet hun advies; na de check mag een leerling gerust van route wisselen. Het materiaal staat klaar op drie niveaus.');
  if (ctx.pleinZicht === 'beperkt' && !ctx.oa && fases.some((f) => f.blokken.some((b) => b.plek === 'plein'))) {
    les.tips.push(`Bij ${ctx.afdeling.naam} kijk je vanuit het ${termen.M} minder goed op het ${termen.plein}. Is er geen onderwijsassistent, zet dan de groep die het zelfstandigst werkt op het ${termen.plein}, spreek vooraf af waar ze zitten en loop er tussen twee instructiemomenten even langs.`);
  }
  if (ctx.inhoud.actualiteit) les.tips.push('Actualiteitsmoment: kies een nieuwsbericht van deze week. Bij Materiaal staan zoeklinks naar nieuwsbronnen; laat leerlingen ook een ander perspectief op het bericht bedenken.');
  if (ctx.sectie?.lesmodel && ctx.docent.lesmodel === ctx.sectie.lesmodel && ctx.sectie.lesmodel !== ctx.profiel.didactiek.lesmodel) {
    const naam = ctx.profiel.didactiek.lesmodelOpties.find((o) => o.id === ctx.sectie.lesmodel)?.naam ?? ctx.sectie.lesmodel;
    les.tips.push(`Je ${ctx.profiel.terminologie?.sectie ?? 'sectie'} werkt met ${naam}; daarom volgt deze les dat model. Kies in je profiel een ander lesmodel als je dat wilt.`);
  }
  les.waarom = uitlegLes(les, ctx, items);
  les.controles = controleerLes(les, items);
  return les;
}

export function genereerLes(invoer, data) {
  const ctx = maakContext(invoer, data.profiel);
  const les = bouwLes(ctx, data.items);
  les.invoer = invoer;
  return les;
}

/** Drie varianten volgens de drie standen van de schuif; de gekozen stand staat bovenaan. */
export function genereerVarianten(invoer, data) {
  const gekozen = [1, 2, 3].includes(Number(invoer.stand)) ? Number(invoer.stand) : 2;
  return [gekozen, ...[1, 2, 3].filter((s) => s !== gekozen)].map((stand) => {
    const inv = { ...invoer, stand };
    if (stand !== gekozen) inv.opties = { ...invoer.opties, vastgezet: {}, overslaan: {}, gekozen: {}, splitsing: null };
    return genereerLes(inv, data);
  });
}

/** Na handmatig aanpassen (volgorde, tijden): starttijden en controles opnieuw berekenen. */
export function herbereken(les, items) {
  let start = 0;
  for (const f of les.fases) { f.start = start; start += Number(f.duur) || 0; }
  les.controles = controleerLes(les, items);
  return les;
}
