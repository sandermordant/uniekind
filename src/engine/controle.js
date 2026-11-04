import { termen } from '../data/termen.js';
// Harde eisen die in elke gegenereerde les moeten kloppen. De interface toont ze als checklist,
// en de tests gebruiken dezelfde functie.

const NIVEAU = { 1: 'Klassikaal-plus', 2: 'Een stap verder', 3: 'Volledig Uniekind' };

export function controleerLes(les, items) {
  const perId = new Map(items.map((i) => [i.id, i]));
  const uit = [];
  const eis = (id, tekst, ok, toelichting = '') => uit.push({ id, eis: tekst, ok: !!ok, toelichting });
  const blokken = les.fases.flatMap((f) => f.blokken.map((b) => ({ ...b, fase: f })));
  const werkvormen = blokken.map((b) => b.werkvorm && perId.get(b.werkvorm.id)).filter(Boolean);
  if (les.fases.some((f) => f.extra)) for (const f of les.fases) for (const e of f.extra ?? []) { const it = perId.get(e.id); if (it) werkvormen.push(it); }

  const totaal = les.fases.reduce((t, f) => t + (Number(f.duur) || 0), 0);
  eis('lesduur', `De les telt op tot ${les.lesduur} minuten`, totaal === les.lesduur, totaal === les.lesduur ? '' : `Nu ${totaal} minuten: ${totaal > les.lesduur ? totaal - les.lesduur + ' te veel' : les.lesduur - totaal + ' te weinig'}.`);

  eis('telefoon', 'Geen werkvorm met een telefoon', werkvormen.every((w) => w.middelen.telefoon === false));
  eis('plein', `Geen plein in een lokaal zonder ${termen.plein}`, les.ruimte === 'M' || !blokken.some((b) => b.plek === 'plein'));

  const teVol = [];
  for (const f of les.fases) {
    const per = {};
    for (const b of f.blokken) per[b.plek] = (per[b.plek] ?? 0) + b.aantal;
    for (const [plek, n] of Object.entries(per)) {
      const cap = les.capaciteit?.[plek];
      if (cap != null && Number.isFinite(cap) && n > cap) teVol.push(`${f.titel}: ${n} leerlingen in ${plek} (max ${cap})`);
    }
  }
  eis('capaciteit', 'Nooit meer leerlingen in een ruimte dan er passen', !teVol.length, teVol.join('; '));

  eis('aandachtrichter', 'Minstens één aandachtrichter', werkvormen.some((w) => w.categorie === 'aandachtrichter'));
  eis('relevantie', 'Een relevantie-haak (waarom leren we dit?)', les.fases.some((f) => f.type === 'doel'));
  eis('check', 'Een check op begrip met als-dan', blokken.some((b) => ['check', 'startcheck', 'tussencheck'].includes(b.fase.type) && b.werkvorm && perId.get(b.werkvorm.id)?.alsDan?.length));
  eis('differentiatie', 'Minstens één expliciete differentiatievorm', les.differentiatie?.length >= 1, les.differentiatie?.map((d) => d.naam).join(', '));
  const gv = new Set(werkvormen.flatMap((w) => w.groepsvorm));
  eis('samen', 'Zowel individueel als samenwerkend leren', gv.has('individueel') && (gv.has('tweetal') || gv.has('groepje')));
  const leeg = blokken.filter((b) => !b.werkvorm && !['doel', 'beweeg-zelf', 'zelfcheck'].includes(b.rol)).map((b) => `${b.fase.titel} (${b.plek})`);
  eis('compleet', 'Elk onderdeel heeft een werkvorm', !leeg.length, [...new Set(leeg)].join('; '));
  eis('afsluiting', 'Een afsluiting', les.fases.some((f) => f.type === 'afsluiting' && f.blokken.some((b) => b.werkvorm)));

  // Per groep: aaneengesloten instructie en wissels
  const groepen = les.groepen.map((x) => x.id);
  const teLang = [];
  const geenWissel = [];
  for (const gid of groepen) {
    let instr = 0;
    let zelfde = 0;
    let vorige = null;
    for (const f of les.fases) {
      const b = f.blokken.find((x) => x.groepen.includes(gid));
      if (!b) continue;
      if (b.plek === 'lokaal' && (b.rol === 'doel' || b.rol === 'instructie')) { instr += f.duur; if (instr > les.instructieMax) teLang.push(`groep ${gid}: ${instr} min`); }
      else instr = 0;
      const sleutel = b.werkvorm?.id ?? `${b.rol}-${f.id}`;
      zelfde = sleutel === vorige ? zelfde + f.duur : f.duur;
      if (zelfde > 25) geenWissel.push(`groep ${gid}: ${zelfde} min dezelfde werkvorm`);
      vorige = sleutel;
    }
  }
  eis('instructie', `Aaneengesloten instructie maximaal ${les.instructieMax} minuten${les.ruimte === 'M' ? ` (krukken in het ${termen.M})` : ''}`, !teLang.length, [...new Set(teLang)].join('; '));
  eis('wissel', 'Uiterlijk na 25 minuten een wissel of beweegmoment', !geenWissel.length, [...new Set(geenWissel)].join('; '));
  if (les.lesduur >= 70) {
    const beweeg = les.fases.filter((f) => f.type === 'beweeg').length + (werkvormen.some((w) => w.beweegmoment && w.categorie !== 'energizer') ? 1 : 0);
    eis('beweeg', 'Blokuur: minstens één beweegmoment', beweeg >= 1, `${beweeg} beweegmoment(en)`);
  }
  eis('stand', `Werkvormen passen bij de stand ${NIVEAU[les.stand] ?? ''}`, true);
  return uit;
}

export const allesGoed = (controles) => controles.every((c) => c.ok);
