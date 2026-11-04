// Scoren: hoe goed past een werkvorm bij dit lesdoel, deze fase, deze docent, deze klas en de schoolvisie.
// De gewichten komen uit het schoolprofiel (generator.gewichten). Alles deterministisch.

const BLOOM = ['onthouden', 'begrijpen', 'toepassen', 'analyseren', 'evalueren', 'creeren'];
const PAST = { goed: 1, aanpassen: 0.6, minder: 0.1 };
const BEWIJS = { sterk: 0.3, redelijk: 0.2, beperkt: 0.1, praktijk: 0 };

// Voorkeuren per plek in de lessenreeks
const REEKS = {
  introductie: { ids: ['voorspellen', 'prikkelende-vraag', 'foto-zonder-context', 'woordweb', 'conceptcartoon', 'verrassend-getal'], cats: ['aandachtrichter'] },
  uitleg: { ids: ['uitgewerkt-voorbeeld-fading', 'tweetal-coach', 'modelleren-hardop-denken', 'wisbordjes', 'denken-delen-uitwisselen'], cats: [] },
  verdieping: { ids: ['casusopdracht', 'expertgroepen', 'socratisch-gesprek', 'zelfuitleg-elaboratie', 'sorteeropdracht', 'compacten-verrijken'], cats: [] },
  herhaling: { ids: ['ophaaloefening', 'gespreide-herhaling', 'afwisselen-opgavetypen', 'binnen-buitenkring', 'mix-en-koppel'], cats: ['leerstrategie'] },
  afsluiting: { ids: ['galerijwandeling', 'casusopdracht', 'drie-twee-een', 'woordweb', 'een-ding-meenemen'], cats: [] },
  toets: { ids: ['ophaaloefening', 'gespreide-herhaling', 'afwisselen-opgavetypen', 'succescriteria-zelfbeoordeling', 'tweetal-coach'], cats: ['leerstrategie'] }
};

const SLOT_FASE = {
  opening: 'opening', voorkennis: 'voorkennis', instructie: 'instructie', check: 'check', tussencheck: 'check',
  verwerken: 'verwerken', beweeg: 'inoefenen', afsluiting: 'afsluiting', steun: 'verwerken', verdieping: 'verwerken'
};

// Past de werkvorm bij het vak? Ja als een van de vakvoorbeelden uit dit vak komt.
const vakSleutels = new WeakMap();
function sleutelsVan(vak) {
  if (!vak) return [];
  if (!vakSleutels.has(vak)) {
    const naam = String(vak.naam ?? '').toLowerCase();
    const s = new Set([naam.split('(')[0].trim(), ...naam.split(/[^a-z\u00e0-\u00ff&]+/).filter((w) => w.length > 3)]);
    s.delete('');
    vakSleutels.set(vak, [...s]);
  }
  return vakSleutels.get(vak);
}
export function pastBijVak(item, vak) {
  const sl = sleutelsVan(vak);
  return sl.length > 0 && item.vakvoorbeelden.some((v) => { const x = v.vak.toLowerCase(); return sl.some((k) => x === k || x.startsWith(k) || k.startsWith(x)); });
}

// Openers, energizers en afsluiters lijken qua geschiktheid vaak op elkaar. Een kleine, vaste afwisseling op basis
// van onderwerp en vak zorgt dat niet elke les met dezelfde opener begint. Zelfde invoer geeft dezelfde les.
const LICHT = new Set(['aandachtrichter', 'energizer', 'afsluiter']);
function afwisseling(item, ctx) {
  if (!LICHT.has(item.categorie)) return 0;
  let h = 2166136261;
  for (const ch of `${ctx.inhoud?.onderwerp ?? ''}|${ctx.vakId ?? ''}|${item.id}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return (h % 1000) / 1000;
}

export const VISIE_ACCENTEN = {
  socialisatie: { naam: 'Socialisatie: samen leren leven', past: (i) => i.doeldomein.includes('socialisatie'), bonus: 0.15 },
  persoonsvorming: { naam: 'Persoonsvorming: eigenheid en veerkracht', past: (i) => i.doeldomein.includes('persoonsvorming'), bonus: 0.15 },
  burgerschap: { naam: 'Burgerschap en verschillende perspectieven', past: (i) => i.perspectieven || i.burgerschap.length > 0, bonus: (i) => (i.perspectieven ? 0.25 : 0) + (i.burgerschap.length ? 0.1 : 0) },
  'samenwerkend-leren': { naam: 'Samenwerkend leren', past: (i) => i.groepsvorm.includes('tweetal') || i.groepsvorm.includes('groepje'), bonus: 0.15 },
  eigenaarschap: { naam: 'Eigenaarschap van leerlingen', past: (i) => i.differentiatie.includes('keuze-aanpak') || i.differentiatie.includes('tempo') || i.categorie === 'leerstrategie', bonus: 0.15 },
  'formatief-handelen': { naam: 'Formatief handelen', past: (i) => i.categorie === 'formatieve-check' || (i.alsDan?.length ?? 0) > 0, bonus: 0.15 },
  talentontwikkeling: { naam: 'Talentontwikkeling', past: (i) => i.differentiatie.includes('interesse') || i.differentiatie.includes('niveau'), bonus: 0.15 },
  'individueel-samenwerkend': { naam: 'Balans tussen individueel en samenwerkend leren', past: () => false, bonus: 0, toelichting: 'Bewaakt door de harde eisen: elke les heeft beide.' },
  relevantie: { naam: 'Relevantie: waarom leren we dit?', past: () => false, bonus: 0, toelichting: 'Elke les heeft een relevantie-haak.' },
  regionaal: { naam: 'Regionale verbinding', past: () => false, bonus: 0, toelichting: 'De relevantie-haak gebruikt de voorbeelden uit de regio in het profiel.' }
};

export function visieScore(item, accenten) {
  let v = BEWIJS[item.bewijs] ?? 0;
  for (const a of accenten) {
    const d = VISIE_ACCENTEN[a];
    if (d && d.past(item)) v += typeof d.bonus === 'function' ? d.bonus(item) : d.bonus;
  }
  return Math.min(1, v);
}

function denkniveauScore(item, niveaus) {
  let best = 0;
  for (const n of niveaus) {
    const a = BLOOM.indexOf(n);
    for (const m of item.denkniveau) {
      const dist = Math.abs(a - BLOOM.indexOf(m));
      best = Math.max(best, Math.max(0, 1 - 0.35 * dist));
    }
  }
  return best;
}

export function scoreWerkvorm(item, slotType, ctx) {
  const g = ctx.profiel.generator.gewichten;
  const delen = {};

  delen.denkniveau = denkniveauScore(item, ctx.niveaus);

  const fase = SLOT_FASE[slotType] ?? slotType;
  const voork = REEKS[ctx.reeks];
  delen.lesfase = (item.lesfase.includes(fase) || (fase === 'verwerken' && item.lesfase.includes('inoefenen')) ? 1 : 0.2)
    + (voork && (voork.ids.includes(item.id) || voork.cats.includes(item.categorie)) ? 0.4 : 0)
    + (pastBijVak(item, ctx.vak) ? 0.25 : 0);

  // Docent: overeenkomst met het docentprofiel (1-5 per uitspraak)
  const st = ctx.docent.stijl ?? {};
  const tags = item.docentstijl.filter((t) => t !== 'houvast');
  let doc = tags.length ? tags.reduce((s, t) => s + ((st[t] ?? 3) - 1) / 4, 0) / tags.length : 0.5;
  const houvast = ((st.houvast ?? 3) - 3) / 2; // -1 .. 1
  if (houvast > 0) doc += item.docentstijl.includes('houvast') ? 0.25 * houvast : -0.15 * houvast * (item.instapniveau - 1);
  delen.docent = Math.max(0, Math.min(1.25, doc));

  // Klas: ondersteuningsbehoeften, groepsdynamiek, tijdstip
  const nodig = Object.entries(ctx.behoeften).filter(([, n]) => n > 0);
  let klas = nodig.length
    ? nodig.reduce((s, [b, n]) => s + n * (PAST[item.ondersteuning[b]?.past] ?? 0.5), 0) / nodig.reduce((s, [, n]) => s + n, 0)
    : 0.7;
  const groepje = item.groepsvorm.includes('groepje') && !item.groepsvorm.includes('tweetal') && !item.groepsvorm.includes('individueel');
  if (ctx.dynamiek === 'onrustig') {
    if (item.energie === 'rustig') klas += 0.15;
    if (item.energie === 'actief' && slotType !== 'beweeg') klas -= 0.2;
    if (item.docentstijl.includes('structuur')) klas += 0.1;
    if (item.instapniveau >= 3) klas -= 0.15;
  }
  if (ctx.dynamiek === 'levendig' && item.energie === 'actief' && slotType !== 'beweeg') klas -= 0.05;
  if (ctx.samenwerken === 'moeizaam' && groepje) klas -= 0.3;
  if (ctx.samenwerken === 'wisselend' && groepje) klas -= 0.1;
  if (ctx.tijdstip === 'laatste' && slotType === 'beweeg' && item.energie === 'actief') klas += 0.15;
  if (ctx.tijdstip === 'pauze' && slotType === 'opening' && item.energie !== 'actief') klas += 0.1;
  if (ctx.tijdstip === 'eerste' && ['ophaaloefening', 'startopdracht', 'gespreide-herhaling'].includes(item.id)) klas += 0.1;
  if (slotType === 'verdieping' && (item.differentiatie.includes('niveau') || item.differentiatie.includes('tempo'))) klas += 0.15;
  if (slotType === 'steun' && item.differentiatie.includes('ondersteuning')) klas += 0.15;
  delen.klas = Math.max(0, Math.min(1.3, klas));

  // Schoolvisie: welke accenten tellen, staat in het schoolprofiel (generator.visieAccenten).
  // Onderbouwing telt altijd mee: evidence-informed is een uitgangspunt van Uniekind zelf.
  delen.visie = visieScore(item, ctx.profiel.generator.visieAccenten ?? []);

  delen.variatie = ctx.opties.vorigeLes?.includes(item.id) ? -1 : 0;
  delen.afwisseling = afwisseling(item, ctx);
  delen.ervaring = Math.max(-1, Math.min(1, Number(ctx.opties.duimen?.[item.id] ?? 0)));

  const wDoc = g.docentstijl?.[String(ctx.stand)] ?? 2;
  const score = g.denkniveau * delen.denkniveau + g.lesfase * delen.lesfase + wDoc * delen.docent + g.klas * delen.klas
    + g.visie * delen.visie + (g.afwisseling ?? 1) * delen.afwisseling + g.variatie * delen.variatie + g.ervaring * delen.ervaring;
  return { score: Math.round(score * 1000) / 1000, delen };
}
