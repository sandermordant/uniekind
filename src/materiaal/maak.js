// Het materiaalpakket bij een les. Route A (zonder AI): de materialen worden gevuld met wat de docent
// invoerde (onderwerp, lesdoelen, kernbegrippen, tekst). Waar inhoud nodig is die Uniekind niet kan weten,
// staat een gemarkeerd invulveld (⟦…⟧) met een voorbeeld. Met de AI-brug (fase 4) worden die gevuld.
// Er staan nooit leerlingnamen in: alleen aantallen en groepsletters.
import { kop, alinea, lijst, vink, tabel, vraag, regels, invulveld, kader, schaal, schema, kaarten, pagina } from './model.js';
import * as AI from '../ai/import.js';
import { controleerLesdoel } from '../engine/tekst.js';
import { termen } from '../data/termen.js';

const zonderNummer = (r) => r.replace(/^\d+[.)]\s*/, '');
const aiVragen = (t, start = 1, regelsPer = 3) => AI.vragen(t).map((v, i) => vraag(start + i, v.tekst, regelsPer, v.label));

const NIVEAU_NAAM = { onthouden: 'Onthouden', begrijpen: 'Begrijpen', toepassen: 'Toepassen', analyseren: 'Analyseren', evalueren: 'Evalueren', creeren: 'Creëren' };
const RTTI = { onthouden: 'R', begrijpen: 'T1', toepassen: 'T2', analyseren: 'I', evalueren: 'I', creeren: 'I' };
const PLEK = { lokaal: 'het lokaal', get plein() { return `het ${termen.plein}`; }, get stilte() { return `de ${termen.stilte}`; } };
const ROLNAAM = { steun: 'steun', basis: 'basis', verdieping: 'verdieping', zelfstandig: 'zelfstandig', stilte: 'stilteruimte', wissel: 'wissel', klas: 'hele klas' };
const PRODUCT = ['ontwerpopdracht', 'casusopdracht', 'galerijwandeling', 'keuzebord', 'compacten-verrijken', 'expertgroepen'];

// Vraagsjablonen per denkniveau. {b} en {b2} zijn kernbegrippen, {o} is het onderwerp.
// Tekst tussen ⟦ en ⟧ vult de docent zelf in.
const VRAGEN = {
  onthouden: ['Wat betekent {b}? Schrijf de omschrijving op.', 'Noem twee dingen die je weet over {b}.', 'Welk begrip hoort bij deze omschrijving: ⟦omschrijving van een begrip⟧?'],
  begrijpen: ['Leg in je eigen woorden uit wat {b} is.', 'Geef een eigen voorbeeld van {b}.', 'Wat is het verschil tussen {b} en {b2}?'],
  toepassen: ['Gebruik {b} bij deze situatie: ⟦situatie of opgave⟧. Wat gebeurt er?', 'Los op: ⟦opgave bij {o}⟧. Schrijf je stappen op.', 'Waar kom je {b} tegen in je eigen omgeving? Leg uit hoe het daar werkt.'],
  analyseren: ['Hoe hangen {b} en {b2} met elkaar samen? Gebruik "omdat" of "daardoor".', 'Wat zijn oorzaken en gevolgen van {b}? Noem er van elk minstens één.', 'Vergelijk ⟦twee situaties of bronnen⟧. Wat valt je op?'],
  evalueren: ['Iemand zegt: "⟦stelling over {b}⟧". Ben je het eens? Geef twee argumenten.', 'Welke oplossing of aanpak vind jij het beste bij {o}? Leg uit waarom.', 'Wat is sterk en wat is zwak aan ⟦een bron, oplossing of standpunt⟧?'],
  creeren: ['Bedenk zelf een vraag over {b} voor een klasgenoot. Schrijf het antwoord erbij.', 'Maak een schema of tekening die {o} uitlegt aan een brugklasser.', 'Bedenk een situatie uit het Heuvelland of je eigen leven waarin {b} een rol speelt.']
};
const ZINSSTARTERS = ['Ik denk dat …, omdat …', 'Het verschil tussen … en … is …', 'Een voorbeeld van … is …', 'Dit komt doordat …', 'Daardoor gebeurt er …', 'Ik ben het (niet) eens met …, want …'];

function info(les, profiel) {
  const c = les.invoer?.context ?? {};
  const afd = profiel.afdelingen.find((a) => a.id === c.afdeling);
  const vak = profiel.vakken.find((v) => v.id === c.vak);
  return {
    onderwerp: les.doel.onderwerp || 'het onderwerp van vandaag',
    titel: les.doel.onderwerp || 'Les',
    vak: vak?.naam ?? '', vakObj: vak,
    klas: afd ? `${afd.kort} ${c.leerjaar ?? ''}`.trim() : '',
    taxonomie: les.invoer?.docent?.taxonomie ?? profiel.didactiek.taxonomie
  };
}

const ikKan = (doel) => doel.replace(/^je (kunt|kan)\s+/i, 'Ik kan ').replace(/^(?!Ik kan)/, 'Ik kan: ');
const vul = (s, b, o) => s.replaceAll('{b}', b[0]).replaceAll('{b2}', b[1] ?? b[0]).replaceAll('{o}', o);

/** Het lesdoel voor een groep: bij twee lagen dat van de eigen laag. */
const doelVanGroep = (les, gid) => (les.lagen?.find((l) => l.id === gid)?.lesdoelen ?? les.doel.lesdoelen)[0]?.tekst ?? '';

function begrippenVan(les) {
  const b = (les.doel.begrippen ?? []).filter(Boolean);
  return b.length ? b : ['⟦kernbegrip 1⟧', '⟦kernbegrip 2⟧', '⟦kernbegrip 3⟧'];
}

/** De zin uit de geplakte tekst waarin een begrip voorkomt (als steun voor de omschrijving). */
function zinMet(tekst, begrip) {
  if (!tekst || begrip.startsWith('⟦')) return '';
  const zinnen = tekst.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+/);
  return zinnen.find((z) => z.toLowerCase().includes(begrip.toLowerCase()) && z.length < 220) ?? '';
}

/** Aantallen per niveau. Bij een klassikale les of carrousel: schatting uit het klasbeeld. */
export function aantallen(les) {
  const per = { steun: 0, basis: 0, verdieping: 0 };
  let geschat = false;
  for (const g of les.groepen) {
    if (g.rol === 'steun') per.steun += g.aantal;
    else if (g.rol === 'verdieping') per.verdieping += g.aantal;
    else if (['basis', 'zelfstandig', 'stilte'].includes(g.rol)) per.basis += g.aantal;
    else geschat = true;
  }
  if (geschat) {
    const k = les.invoer?.klas ?? {};
    const n = les.aantal;
    if (k.verdelingBekend && Number(k.steun) + Number(k.basis) + Number(k.verdieping) > 0) {
      const tot = Number(k.steun) + Number(k.basis) + Number(k.verdieping);
      per.steun = Math.round((Number(k.steun) / tot) * n);
      per.verdieping = Math.round((Number(k.verdieping) / tot) * n);
    } else {
      per.steun = Math.round(n * 0.25);
      per.verdieping = Math.round(n * 0.2);
    }
    per.basis = n - per.steun - per.verdieping;
  }
  return { ...per, geschat: geschat || !!les.verdelingGeschat };
}

function denkLabel(niveau, tax) {
  return tax === 'rtti' ? RTTI[niveau] : NIVEAU_NAAM[niveau];
}

function vragenVoor(niveaus, b, o, tax, start = 1) {
  const uit = [];
  let nr = start;
  niveaus.forEach(([niveau, aantal], i) => {
    for (let k = 0; k < aantal; k++) {
      const sjabloon = VRAGEN[niveau][(k + i) % VRAGEN[niveau].length];
      const bb = [b[(nr - 1) % b.length], b[nr % b.length]];
      uit.push(vraag(nr++, vul(sjabloon, bb, o), niveau === 'creeren' || niveau === 'evalueren' ? 5 : 3, denkLabel(niveau, tax)));
    }
  });
  return uit;
}

function schemaVoor(les, inf, b) {
  if (inf.vakObj?.id === 'geschiedenis') return schema('tijdlijn', ['⟦gebeurtenis 1⟧', '⟦gebeurtenis 2⟧', '⟦gebeurtenis 3⟧']);
  const niveaus = les.doel.lesdoelen.map((d) => d.niveau);
  if (niveaus.some((n) => ['analyseren', 'evalueren'].includes(n))) return schema('oorzaak-gevolg', [b[0]]);
  return schema('vergelijking', b.slice(0, 2));
}

/* ───────────────────────── Leerlingmateriaal ───────────────────────── */

function werkbladen(les, inf, per, ai = {}) {
  const b = begrippenVan(les);
  const o = inf.onderwerp;
  const tax = inf.taxonomie;
  const doelen = les.doel.lesdoelen.length ? les.doel.lesdoelen.map((d) => ikKan(d.tekst)) : ['⟦Ik kan … (lesdoel)⟧'];
  const tekst = les.invoer?.inhoud?.tekst ?? '';
  const kopregel = [alinea(`Naam: ____________________   Klas: ________   ${inf.vak}`, { klein: true })];
  const doelKader = kader('Dit ga je leren', [lijst(doelen)]);

  const steun = {
    id: 'werkblad-steun', titel: `Werkblad steun: ${inf.titel}`, voor: 'leerling', soort: 'werkblad', niveau: 'steun',
    aantal: per.steun, aantalUitleg: 'één per leerling in de steunroute',
    blokken: [
      ...kopregel, doelKader,
      kop('1. Kijk eerst naar het voorbeeld'),
      kader('Uitgewerkt voorbeeld', ai['UITGEWERKT-VOORBEELD'] ? [lijst(AI.regelsVan(ai['UITGEWERKT-VOORBEELD']).map(zonderNummer), true)] : [invulveld('Zet hier een uitgewerkt voorbeeld met alle stappen.', `Bijvoorbeeld een opgave over ${o} waarbij elke stap is uitgeschreven, met één zin uitleg per stap.`)]),
      vraag(1, 'Waarom staat stap 2 in het voorbeeld? Leg het uit in één zin.', 2, 'Zelfuitleg'),
      kop('2. Maak de opgave af'),
      kader('Aanvulopdracht', [...(ai.AANVULOPDRACHT ? AI.regelsVan(ai.AANVULOPDRACHT).map((r) => alinea(r)) : [invulveld('Zet hier een opgave die lijkt op het voorbeeld, met de eerste stappen al ingevuld.', 'Laat de laatste één of twee stappen leeg.')]), regels(4)]),
      kop('3. De belangrijkste begrippen'),
      tabel(['Begrip', 'Uit de tekst', 'Wat betekent het? (in je eigen woorden)'], b.map((x) => [x, zinMet(tekst, x) || '', ''])),
      kop('4. Vragen'),
      alinea(`Begin zo: "${ZINSSTARTERS[0]}" of "${ZINSSTARTERS[2]}"`, { klein: true }),
      ...(ai['VRAGEN-STEUN'] ? aiVragen(ai['VRAGEN-STEUN'], 2) : vragenVoor([['onthouden', 2], ['begrijpen', 2]], b, o, tax, 2)),
      kop('5. Zet de begrippen in een woordweb'),
      schema('woordweb', [o, ...b.slice(0, 5)]),
      alinea('Klaar? Laat je werk zien aan je docent en pak dan het werkblad basis.', { nadruk: true })
    ]
  };
  const basis = {
    id: 'werkblad-basis', titel: `Werkblad basis: ${inf.titel}`, voor: 'leerling', soort: 'werkblad', niveau: 'basis',
    aantal: per.basis, aantalUitleg: 'één per leerling in de basisroute',
    blokken: [
      ...kopregel, doelKader,
      kop('Vragen'),
      ...(ai['VRAGEN-BASIS'] ? aiVragen(ai['VRAGEN-BASIS']) : vragenVoor([['begrijpen', 2], ['toepassen', 2], ['analyseren', 1]], b, o, tax)),
      kop('Schema'),
      schemaVoor(les, inf, b),
      kop('Opgave van je docent'),
      ...(ai['OPGAVE-BASIS'] ? AI.regelsVan(ai['OPGAVE-BASIS']).map((r) => alinea(r)) : [invulveld('Zet hier een opgave uit de methode of een eigen opgave.', `Bijvoorbeeld: opgave … uit paragraaf ${o}.`)]),
      regels(4),
      alinea(`Loop je vast? ${inf.heeft?.hint === false ? 'Vraag het eerst aan je buur.' : 'Pak hint 1.'} Klaar? Kijk je werk na en pak een pluskaart of het werkblad verdieping.`, { nadruk: true })
    ]
  };
  const verdieping = {
    id: 'werkblad-verdieping', titel: `Werkblad verdieping: ${inf.titel}`, voor: 'leerling', soort: 'werkblad', niveau: 'verdieping',
    aantal: per.verdieping, aantalUitleg: 'één per leerling in de verdiepingsroute',
    blokken: [
      ...kopregel, doelKader,
      alinea('Je beheerst de basis al. Op dit werkblad ga je verder dan het lesdoel: verbanden leggen, beoordelen en zelf iets maken.'),
      kop('Vragen'),
      ...(ai['VRAGEN-VERDIEPING'] ? aiVragen(ai['VRAGEN-VERDIEPING'], 1, 4) : vragenVoor([['analyseren', 1], ['evalueren', 2], ['creeren', 2]], b, o, tax)),
      kop('Open opdracht'),
      kader('Uitdaging', [...(ai.UITDAGING ? AI.regelsVan(ai.UITDAGING).map((r) => alinea(r)) : [invulveld('Zet hier een open opdracht of onderzoeksvraag.', `Bijvoorbeeld: zoek uit hoe ${o} een rol speelt in de regio en maak er een korte uitleg van voor de klas.`)]), regels(6)]),
      kop('Maak je eigen schema'),
      schema('woordweb', [o]),
      alinea('Klaar? Bespreek je antwoord bij de laatste vraag met een andere leerling uit de verdiepingsroute.', { nadruk: true })
    ]
  };
  return [steun, basis, verdieping];
}

const STAPPEN_ROUTE = {
  steun: ['Ga aan de instructietafel zitten. Neem je werkblad steun mee.', 'Doe samen met je docent een voorbeeld.', 'Maak daarna zelf de volgende opgave. Je docent kijkt mee.', 'Lukt het? Ga terug naar je plek en werk verder.'],
  basis: ['Pak het werkblad basis.', 'Werk de vragen op volgorde af. Overleggen mag fluisterend met je buur.', 'Loop je vast? Pak eerst hint 1, dan hint 2.', 'Kijk je werk na met de antwoordkaart.'],
  verdieping: ['Pak het werkblad verdieping.', 'Werk zelfstandig of met één klasgenoot uit dezelfde route.', 'Schrijf bij elke vraag op waarom je antwoord klopt.', 'Klaar? Maak de uitdaging onderaan.'],
  zelfstandig: ['Pak het werkblad basis.', 'Lees eerst het uitgewerkte voorbeeld.', 'Werk de vragen op volgorde af.', 'Loop je vast? Pak een hintkaart.'],
  stilte: ['Ga naar de stilteruimte en ga zitten op een vrije plek.', 'Werk in stilte aan je werkblad.', 'Loop je vast? Sla de vraag over en ga door.', 'Kom op tijd terug.'],
  wissel: ['Volg het routeschema op het bord.', 'Op het plein: werk aan je opdracht met de laptop alleen voor de les.', 'In het lokaal: je krijgt instructie van je docent.', 'Bij het signaal wissel je rustig van plek.'],
  klas: ['Pak het werkblad basis.', 'Werk de vragen op volgorde af.', 'Twijfel je na de uitleg? Schuif aan bij de instructietafel.', 'Klaar? Pak een pluskaart.']
};
/** Stappen per route; zonder hintkaarten in de les verwijzen ze er ook niet naar. */
function routeStappen(rol, inf) {
  const stappen = STAPPEN_ROUTE[rol] ?? STAPPEN_ROUTE.basis;
  if (inf.heeft?.hint !== false) return stappen;
  return stappen.map((s) => (/hint/i.test(s) ? 'Loop je vast? Vraag het eerst aan je buur, dan aan je docent.' : s));
}
const KLAAR = { steun: 'Klaar? Pak het werkblad basis.', basis: 'Klaar? Pak een pluskaart of het werkblad verdieping.', verdieping: 'Klaar? Maak de uitdaging en help daarna een klasgenoot met een vraag (niet met het antwoord).', zelfstandig: 'Klaar? Pak een pluskaart.', stilte: 'Klaar? Lees je antwoorden nog een keer na.', wissel: 'Klaar? Kijk je werk na met de antwoordkaart.', klas: 'Klaar? Pak een pluskaart.' };

function groepPlanning(les, gid) {
  return les.fases.map((f) => ({ f, b: f.blokken.find((x) => x.groepen.includes(gid)) })).filter((x) => x.b);
}

function opdrachtkaarten(les, inf) {
  const kaartenLijst = [];
  for (const g of les.groepen) {
    const plan = groepPlanning(les, g.id).filter(({ f, b }) => ['verwerken', 'instructie', 'voorkennis', 'check', 'opening', 'doel'].includes(f.type) && (f.type === 'verwerken' || b.plek !== 'lokaal'));
    if (!plan.length) continue;
    const van = plan[0].f.start;
    const tot = plan.at(-1).f.start + plan.at(-1).f.duur;
    const plekken = [...new Set(plan.map((x) => x.b.plek))];
    const werkvormen = [...new Set(plan.map((x) => x.b.werkvorm?.naam).filter(Boolean))];
    const rol = g.rol;
    const kopie = Math.max(1, Math.ceil(g.aantal / 2));
    const kaart = {
      titel: `${g.naam}`,
      blokken: [
        alinea(`Waar: ${plekken.map((p) => PLEK[p]).join(', dan ')}. Tijd: van minuut ${van} tot ${tot}.`, { nadruk: true }),
        alinea(`Lesdoel: ${doelVanGroep(les, g.id) ? ikKan(doelVanGroep(les, g.id)) : '⟦lesdoel⟧'}`),
        lijst(routeStappen(rol, inf), true),
        werkvormen.length ? alinea(`Werkvorm: ${werkvormen.join(', ')}.`, { klein: true }) : null,
        alinea(KLAAR[rol] ?? KLAAR.basis),
        plekken.some((p) => p !== 'lokaal') ? alinea(`Om minuut ${tot} ben je terug in het lokaal.`, { nadruk: true }) : null
      ].filter(Boolean)
    };
    for (let i = 0; i < kopie; i++) kaartenLijst.push(kaart);
  }
  return {
    id: 'opdrachtkaarten', titel: `Opdrachtkaarten per route: ${inf.titel}`, voor: 'leerling', soort: 'kaarten',
    aantal: 1, aantalUitleg: 'één keer printen: er zit al één kaart per tweetal in',
    blokken: [kaarten(kaartenLijst, 4)]
  };
}

function hintkaarten(les, inf, ai = {}) {
  const b = begrippenVan(les);
  const uitAi = ['HINTKAART-1', 'HINTKAART-2'].filter((k) => ai[k]).map((k) => AI.hintkaart(ai[k]));
  const set = uitAi.length ? uitAi.flatMap((h, n) => [
    { titel: `Opgave ${n + 1} · Hint 1`, kleur: 'groen', blokken: [alinea(h.opgave, { klein: true }), alinea(h.hint1)] },
    { titel: `Opgave ${n + 1} · Hint 2`, kleur: 'oranje', blokken: [alinea(h.opgave, { klein: true }), alinea(h.hint2)] },
    { titel: `Opgave ${n + 1} · Uitwerking`, kleur: 'rood', blokken: [alinea('Pak deze kaart pas als je hint 1 en 2 hebt gebruikt.', { klein: true }), alinea(h.uitwerking)] }
  ]) : [1, 2].flatMap((n) => [
    { titel: `Opgave ⟦${n === 1 ? 'nummer' : 'nummer'}⟧ · Hint 1`, kleur: 'groen', blokken: [alinea(`Welke begrippen horen bij deze opgave? Kijk op je vaktaalkaart: ${b.slice(0, 3).join(', ')}.`), alinea('Lees de vraag nog een keer. Wat wordt er precies gevraagd?', { klein: true })] },
    { titel: `Opgave ⟦nummer⟧ · Hint 2`, kleur: 'oranje', blokken: [alinea('Kijk naar het uitgewerkte voorbeeld. Wat is de eerste stap?'), invulveld('Schrijf hier de eerste stap van deze opgave.', 'Bijvoorbeeld: "Schrijf eerst op wat gegeven is en wat er gevraagd wordt."')] },
    { titel: `Opgave ⟦nummer⟧ · Uitwerking`, kleur: 'rood', blokken: [alinea('Pak deze kaart pas als je hint 1 en 2 hebt gebruikt.', { klein: true }), invulveld('Zet hier de uitwerking.', '')] }
  ]);
  const sets = Math.max(1, Math.ceil(les.aantal / 8));
  return {
    id: 'hintkaarten', titel: `Hintkaarten: ${inf.titel}`, voor: 'leerling', soort: 'kaarten',
    aantal: sets, aantalUitleg: 'één set per acht leerlingen, op een vaste plek in het lokaal',
    blokken: [alinea('Vul per opgave het nummer en de hints in. Hint 1 is een vraag, hint 2 de eerste stap. De uitwerking leg je bij jezelf neer.', { klein: true }), kaarten(set, 4)]
  };
}

function succescriteria(les, inf) {
  const items = les.doel.lesdoelen.length ? les.doel.lesdoelen.map((d) => ikKan(d.tekst)) : ['⟦Ik kan … (lesdoel 1)⟧', '⟦Ik kan … (lesdoel 2)⟧'];
  return {
    id: 'succescriteria', titel: `Succescriteria: ${inf.titel}`, voor: 'leerling', soort: 'kaart',
    aantal: les.aantal, aantalUitleg: 'één per leerling',
    blokken: [
      alinea('Kruis aan het begin van de les aan hoe goed je het al kunt. Doe het aan het eind nog een keer.'),
      kop('Begin van de les', 3), schaal(items),
      kop('Eind van de les', 3), schaal(items),
      kop('Mijn bewijs', 3),
      alinea('Bij welke opgave liet je zien dat je het kunt?', { klein: true }), regels(2)
    ]
  };
}

function exitTickets(les, inf, per, ai = {}) {
  const doel = les.doel.lesdoelen[0]?.tekst ?? '⟦lesdoel⟧';
  const b = begrippenVan(les);
  const zeker = alinea('Hoe zeker ben je?   1   2   3   4   5', { klein: true });
  const et = ai['EXIT-TICKET'] ? AI.exitTicket(ai['EXIT-TICKET']) : null;
  const varianten = et ? [
    { titel: 'Exit ticket · steun', kleur: 'groen', aantal: per.steun, blokken: [alinea(`Lesdoel: ${doel}`, { klein: true }), vraag(1, et.steun, 2), zeker] },
    { titel: 'Exit ticket · basis', kleur: 'oranje', aantal: per.basis, blokken: [alinea(`Lesdoel: ${doel}`, { klein: true }), vraag(1, et.basis, 3), zeker] },
    { titel: 'Exit ticket · verdieping', kleur: 'rood', aantal: per.verdieping, blokken: [alinea(`Lesdoel: ${doel}`, { klein: true }), vraag(1, et.verdieping, 3)] }
  ] : [
    { titel: 'Exit ticket · steun', kleur: 'groen', aantal: per.steun, blokken: [alinea(`Lesdoel: ${doel}`, { klein: true }), vraag(1, `Wat betekent ${b[0]}? Maak de zin af: "${b[0]} is …"`, 2), zeker] },
    { titel: 'Exit ticket · basis', kleur: 'oranje', aantal: per.basis, blokken: [alinea(`Lesdoel: ${doel}`, { klein: true }), vraag(1, `Leg in je eigen woorden uit wat ${b[0]} is.`, 2), vraag(2, '⟦Toepassingsvraag bij het lesdoel⟧', 2), zeker] },
    { titel: 'Exit ticket · verdieping', kleur: 'rood', aantal: per.verdieping, blokken: [alinea(`Lesdoel: ${doel}`, { klein: true }), vraag(1, `Hoe hangen ${b[0]} en ${b[1] ?? b[0]} samen?`, 2), vraag(2, 'Bedenk een vraag over de les van vandaag die een klasgenoot moeilijk zou vinden.', 2)] }
  ];
  const lijstKaarten = varianten.flatMap((v) => Array.from({ length: Math.max(1, v.aantal) }, () => ({ titel: v.titel, kleur: v.kleur, blokken: v.blokken })));
  return {
    id: 'exit-tickets', titel: `Exit tickets: ${inf.titel}`, voor: 'leerling', soort: 'kaarten',
    aantal: 1, aantalUitleg: `één keer printen: ${per.steun} steun, ${per.basis} basis, ${per.verdieping} verdieping`,
    blokken: [kaarten(lijstKaarten, 4)]
  };
}

function vaktaalkaart(les, inf, ai = {}) {
  const b = begrippenVan(les);
  const tekst = les.invoer?.inhoud?.tekst ?? '';
  const uitAi = ai.VAKTAAL ? AI.vaktaal(ai.VAKTAAL) : [];
  if (uitAi.length) {
    return {
      id: 'vaktaalkaart', titel: `Vaktaal-steunkaart: ${inf.titel}`, voor: 'leerling', soort: 'kaart',
      aantal: Math.max(1, Math.ceil(les.aantal / 2)), aantalUitleg: 'één per tweetal; extra voor NT2- en taalzwakke leerlingen',
      blokken: [alinea('Deze woorden heb je vandaag nodig. Gebruik ze in je antwoorden.'), tabel(['Woord', 'Wat betekent het?', 'Voorbeeld'], uitAi.map((x) => [x.begrip, x.omschrijving, x.voorbeeld])), kop('Zo begin je een zin', 3), lijst(ZINSSTARTERS)]
    };
  }
  return {
    id: 'vaktaalkaart', titel: `Vaktaal-steunkaart: ${inf.titel}`, voor: 'leerling', soort: 'kaart',
    aantal: Math.max(1, Math.ceil(les.aantal / 2)), aantalUitleg: 'één per tweetal; extra voor NT2- en taalzwakke leerlingen',
    blokken: [
      alinea('Deze woorden heb je vandaag nodig. Gebruik ze in je antwoorden.'),
      tabel(['Woord', 'Zo staat het in de tekst', 'In gewone woorden', 'Voorbeeld'], b.map((x) => [x, zinMet(tekst, x), '⟦eenvoudige omschrijving⟧', ''])),
      kop('Zo begin je een zin', 3),
      lijst(ZINSSTARTERS)
    ]
  };
}

function rekenhulpkaart(inf) {
  return {
    id: 'rekenhulpkaart', titel: 'Rekenhulpkaart', voor: 'leerling', soort: 'kaart',
    aantal: 0, aantalUitleg: 'één per tweetal',
    blokken: [
      kop('Stappenplan bij een rekenopgave', 3),
      lijst(['Lees de vraag twee keer. Onderstreep wat gevraagd wordt.', 'Schrijf op wat gegeven is (met eenheden).', 'Kies de formule of de bewerking.', 'Vul in en reken uit. Schrijf elke tussenstap op.', 'Zet de eenheid achter je antwoord.', 'Controleer: kan dit antwoord kloppen?'], true),
      kop('Handig om te weten', 3),
      tabel(['Wat', 'Zo doe je het'], [
        ['1% van een getal', 'Deel het getal door 100.'],
        ['Procent van een getal', 'Eerst 1% uitrekenen, dan keer het aantal procent.'],
        ['Breuk naar procent', 'Teller gedeeld door noemer, keer 100.'],
        ['Gemiddelde', 'Alle getallen optellen en delen door het aantal getallen.'],
        ['Lengte omrekenen', 'km – hm – dam – m – dm – cm – mm: elke stap naar rechts × 10.'],
        ['Tijd', '1 uur = 60 minuten; 1 minuut = 60 seconden.']
      ]),
      kop('Verhoudingstabel', 3),
      tabel(['', '', '', ''], [['', '', '', ''], ['', '', '', '']])
    ]
  };
}

function rolkaarten(les, inf) {
  const rollen = [
    ['Voorzitter', 'groen', ['Zorgt dat iedereen aan het woord komt.', 'Leest de opdracht voor.'], ['"Wat vind jij ervan?"', '"Wie heeft nog een idee?"']],
    ['Tijdbewaker', 'oranje', ['Houdt de tijd en de stappen in de gaten.', 'Waarschuwt halverwege en vijf minuten voor het einde.'], ['"We hebben nog … minuten."', '"Gaan we door naar de volgende stap?"']],
    ['Schrijver', 'paars', ['Schrijft de antwoorden en ideeën van de groep op.', 'Leest aan het eind voor wat er staat.'], ['"Klopt het zo?"', '"Hoe zal ik dat opschrijven?"']],
    ['Controleur', 'rood', ['Controleert of het klopt met de opdracht en de criteria.', 'Checkt of iedereen het kan uitleggen.'], ['"Past dit bij de opdracht?"', '"Kun jij het uitleggen?"']]
  ];
  const sets = Math.max(1, Math.ceil(les.aantal / 4));
  return {
    id: 'rolkaarten', titel: 'Rolkaarten voor samenwerking', voor: 'leerling', soort: 'kaarten',
    aantal: sets, aantalUitleg: 'één set per groepje van vier',
    blokken: [kaarten(rollen.map(([t, k, taken, zinnen]) => ({ titel: t, kleur: k, blokken: [lijst(taken), alinea('Wat je kunt zeggen:', { klein: true }), lijst(zinnen)] })), 4)]
  };
}

function pleinafspraken(les, profiel, heeft = {}) {
  const p = profiel.ruimtes.find((r) => r.id === 'plein');
  const eind = les.fases.filter((f) => f.blokken.some((b) => b.plek === 'plein')).at(-1);
  const terug = eind ? eind.start + eind.duur : null;
  return {
    id: 'pleinafspraken', titel: `Afspraken op het ${p?.kort ?? 'plein'}`, voor: 'leerling', soort: 'kaart',
    aantal: 2, aantalUitleg: 'een paar exemplaren op de pleintafels',
    blokken: [
      lijst([
        'Je gebruikt alleen de schoollaptop, en alleen voor deze opdracht.',
        profiel.regels?.telefoon?.motto ? `Je telefoon is ${profiel.regels.telefoon.motto.toLowerCase()}.` : 'Geen telefoon.',
        'Je werkt op de plek die je docent heeft aangewezen.',
        'Je praat fluisterend. Anderen zijn ook aan het werk.',
        heeft.hint !== false ? 'Loop je vast? Eerst je opdrachtkaart en de hintkaart, dan pas je docent.' : 'Loop je vast? Eerst je opdrachtkaart, dan pas je docent.',
        terug != null ? `Om minuut ${terug} ben je terug in het lokaal.` : 'Je komt op de afgesproken tijd terug.'
      ], true),
      alinea(`Op het plein is er toezicht door je docent of een onderwijsassistent${p?.cameratoezicht ? ', en er is cameratoezicht' : ''}.`, { klein: true })
    ]
  };
}

function vandaagkaarten(les, inf) {
  const kaartenLijst = [];
  for (const g of les.groepen) {
    const plan = groepPlanning(les, g.id);
    kaartenLijst.push({
      titel: `Vandaag · ${g.naam}`,
      blokken: [
        alinea(`Lesdoel: ${doelVanGroep(les, g.id) ? ikKan(doelVanGroep(les, g.id)) : '⟦lesdoel⟧'}`, { nadruk: true }),
        tabel(['Minuut', 'Wat', 'Waar'], plan.map(({ f, b }) => [`${f.start}–${f.start + f.duur}`, b.werkvorm?.naam ?? f.titel, PLEK[b.plek].replace(/^het |^de /, '')])),
        alinea(inf.heeft?.exit === false ? 'Je weet dat je het kunt als je het lesdoel aan een klasgenoot kunt uitleggen.' : 'Je weet dat je het kunt als je de exit ticket goed hebt én het aan een klasgenoot kunt uitleggen.', { klein: true })
      ]
    });
  }
  return {
    id: 'vandaag', titel: `Vandaag-kaart: ${inf.titel}`, voor: 'leerling', soort: 'kaarten',
    aantal: 1, aantalUitleg: 'één keer printen en op tafel leggen of op het bord tonen',
    blokken: [kaarten(kaartenLijst, les.groepen.length > 2 ? 4 : 2)]
  };
}

function rubric(les, inf) {
  const b = begrippenVan(les);
  return {
    id: 'rubric', titel: `Rubric bij het product: ${inf.titel}`, voor: 'leerling', soort: 'kaart',
    aantal: les.aantal, aantalUitleg: 'één per leerling of per groepje',
    blokken: [
      tabel(['Criterium', 'Begin', 'Op weg', 'Doel bereikt', 'Boven verwachting'], [
        ['Vakinhoud', 'Kernbegrippen ontbreken of kloppen niet.', `Een paar begrippen (zoals ${b[0]}) worden goed gebruikt.`, 'Alle kernbegrippen worden correct gebruikt.', 'Begrippen worden met elkaar verbonden en uitgelegd.'],
        ['Lesdoel', 'Het product laat het lesdoel nog niet zien.', 'Het lesdoel is deels zichtbaar.', 'Het product laat het lesdoel duidelijk zien.', 'Het product gaat verder dan het lesdoel.'],
        ['Onderbouwing', 'Keuzes worden niet uitgelegd.', 'Sommige keuzes worden uitgelegd.', 'Keuzes worden met argumenten uitgelegd.', 'Ook andere oplossingen worden afgewogen.'],
        ['Samenwerking', 'Eén persoon doet het meeste.', 'Taken zijn verdeeld, niet iedereen doet mee.', 'Iedereen heeft een rol en doet mee.', 'De groep helpt elkaar en verbetert samen.'],
        ['Verzorging', 'Rommelig, moeilijk te volgen.', 'Te volgen, maar onoverzichtelijk.', 'Overzichtelijk en verzorgd.', 'Helder, aantrekkelijk en compleet.']
      ])
    ]
  };
}

function pluskaarten(les, inf) {
  const b = begrippenVan(les);
  const o = inf.onderwerp;
  const k = [
    { titel: 'Pluskaart 1', blokken: [alinea(vul(VRAGEN.creeren[0], b, o))] },
    { titel: 'Pluskaart 2', blokken: [alinea(vul(VRAGEN.analyseren[1], b, o))] },
    { titel: 'Pluskaart 3', blokken: [alinea(vul(VRAGEN.evalueren[1], b, o))] },
    { titel: 'Pluskaart 4', blokken: [alinea(vul(VRAGEN.creeren[2], b, o))] }
  ].map((x) => ({ ...x, kleur: 'paars', blokken: [...x.blokken, alinea('Eerst je eigen werk nakijken, dan pas deze kaart.', { klein: true })] }));
  return {
    id: 'pluskaarten', titel: `Pluskaarten: ${inf.titel}`, voor: 'leerling', soort: 'kaarten',
    aantal: Math.max(1, Math.ceil(les.aantal / 8)), aantalUitleg: 'een paar sets op een vaste plek',
    blokken: [kaarten(k, 4)]
  };
}

function startcheck(les, inf, ai = {}) {
  const b = begrippenVan(les);
  const tax = inf.taxonomie;
  if (ai.STARTCHECK) {
    const sc = AI.startcheck(ai.STARTCHECK);
    return {
      id: 'startcheck', titel: `Startcheck: ${inf.titel}`, voor: 'leerling', soort: 'werkblad',
      aantal: les.aantal, aantalUitleg: 'één per leerling (of gebruik wisbordjes)',
      blokken: [alinea('Dit is geen toets. Het helpt om te kiezen wat jij vandaag het beste kunt doen. Werk alleen, zonder overleg.'), ...sc.vragen.map((v, i) => vraag(i + 1, v.tekst, 3, v.label)), alinea('Kijk je antwoorden na met de antwoordkaart. Alles goed: route verdieping. Eén of twee fout: route basis. Meer fout: route steun.', { klein: true })]
    };
  }
  return {
    id: 'startcheck', titel: `Startcheck: ${inf.titel}`, voor: 'leerling', soort: 'werkblad',
    aantal: les.aantal, aantalUitleg: 'één per leerling (of gebruik wisbordjes)',
    blokken: [
      alinea('Dit is geen toets. Het helpt om te kiezen wat jij vandaag het beste kunt doen. Werk alleen, zonder overleg.'),
      vraag(1, vul(VRAGEN.onthouden[0], b, inf.onderwerp), 2, denkLabel('onthouden', tax)),
      vraag(2, vul(VRAGEN.begrijpen[0], [b[1] ?? b[0]], inf.onderwerp), 2, denkLabel('begrijpen', tax)),
      vraag(3, '⟦Een korte toepassingsvraag bij het lesdoel⟧', 3, denkLabel('toepassen', tax)),
      vraag(4, '⟦Een vraag op het niveau van het lesdoel⟧', 3, denkLabel(les.doel.lesdoelen[0]?.niveau ?? 'begrijpen', tax)),
      alinea('Kijk je antwoorden na met de antwoordkaart. Alles goed: route verdieping. Eén of twee fout: route basis. Meer fout: route steun.', { klein: true })
    ]
  };
}

/* ───────────────────────── Docentmateriaal ───────────────────────── */

const BEGELEIDING = { docent: 'bij jou', zelfstandig: 'zelfstandig', 'op afstand': 'zelfstandig (jij houdt toezicht)', oa: 'met de onderwijsassistent' };

function lesplanDoc(les, inf, profiel, itemMap, ai = {}) {
  const rijen = [];
  for (const f of les.fases) {
    for (const b of f.blokken) {
      const it = b.werkvorm ? itemMap.get(b.werkvorm.id) : null;
      const groep = les.groepen.length > 1 ? b.groepen.map((g) => les.groepen.find((x) => x.id === g)?.naam.split(' · ')[0] ?? g).join(' + ') + ', ' : '';
      const wat = b.rol === 'doel'
        ? `Lesdoel noemen. ${les.doel.relevantie.vraag} ${ai.RELEVANTIE ? AI.regelsVan(ai.RELEVANTIE).join(' ') : `${les.doel.relevantie.regionaal ? `Idee: ${les.doel.relevantie.regionaal}. ` : ''}⟦eigen voorbeeld⟧`}`
        : it ? `${it.naam}${b.vervolg ? ' (loopt door)' : `. Je zegt: "${it.startzin}"`}` : (b.tekst ?? '');
      rijen.push([`${f.start}–${f.start + f.duur}`, f.titel, `${groep}${PLEK[b.plek].replace(/^het |^de /, '')}, ${BEGELEIDING[b.begeleiding] ?? b.begeleiding}`, wat]);
    }
  }
  const checks = [];
  for (const f of les.fases) for (const b of f.blokken) {
    const it = b.werkvorm ? itemMap.get(b.werkvorm.id) : null;
    if (it?.alsDan?.length && !b.vervolg && ['check', 'startcheck', 'tussencheck'].includes(f.type)) checks.push(kop(`${f.titel}: ${it.naam}`, 3), tabel(['Als', 'Dan'], it.alsDan.map((r) => [r.als, r.dan])));
  }
  return {
    id: 'lesplan', titel: `Lesplan: ${inf.titel}`, voor: 'docent', soort: 'lesplan', aantal: 1,
    ondertitel: [inf.vak, inf.klas, `${les.lesduur} minuten`, les.ruimteNaam, `${les.aantal} leerlingen`, `${les.standNaam} · ${les.opzetNaam}`].filter(Boolean).join(' · '),
    blokken: [
      ...(Object.keys(ai).length ? [alinea('Deze les bevat materiaal dat met AI is gemaakt. Lees het altijd na op juistheid en niveau voordat je het gebruikt.', { nadruk: true })] : []),
      kader('Lesdoelen', [
        ...(les.lagen ? les.lagen.flatMap((l) => [alinea(`Laag ${l.code} (${l.aantal} leerlingen)${l.onderwerp ? `: ${l.onderwerp}` : ''}`, { nadruk: true }),
          lijst(l.lesdoelen.length ? l.lesdoelen.map((d) => `${d.tekst} (${denkLabel(d.niveau, inf.taxonomie)})`) : [`⟦lesdoel ${l.code}⟧`])])
          : [lijst(les.doel.lesdoelen.length ? les.doel.lesdoelen.map((d) => `${d.tekst} (${denkLabel(d.niveau, inf.taxonomie)})`) : ['⟦lesdoel⟧'])]),
        les.doel.begrippen?.length ? alinea(`Kernbegrippen: ${les.doel.begrippen.join(', ')}.`) : invulveld('Kernbegrippen', ''),
        ...(les.doel.eindtermen?.length ? [alinea('Sluit aan bij:', { nadruk: true }), lijst(les.doel.eindtermen.map((g) => `${g.code ? `${g.code}: ` : ''}${g.tekst} (${g.kaderTitel})`))] : [])
      ]),
      alinea(les.waarom),
      kop('Verloop'),
      tabel(['Min', 'Fase', 'Wie en waar', 'Werkvorm en wat je zegt'], rijen, [9, 18, 22, 51]),
      ...(checks.length ? [kop('Checks: als je dit ziet, doe dan dit'), ...checks] : []),
      ...(ai.CHECKVRAAG ? (() => { const c = AI.checkvraag(ai.CHECKVRAAG); return [kop('Scharniervraag', 3), alinea(c.vraag), lijst([`A: ${c.a}`, `B: ${c.b}`, `C: ${c.c}`, `D: ${c.d}`]), alinea(`Goed: ${c.goed}. ${c.misvattingen}`, { klein: true })]; })() : []),
      kop('Differentiatie'),
      lijst(les.differentiatie.map((d) => d.naam)),
      ...(les.oa ? [alinea(`Onderwijsassistent: ${les.oa.rol}`)] : []),
      ...(les.tips.length ? [kop('Goed om te weten'), lijst(les.tips)] : []),
      kop('Vooruitblik'),
      invulveld(les.vooruitblik, 'Bijvoorbeeld: "Volgende les gebruiken we dit om …"')
    ]
  };
}

function differentiatieDoc(les, inf, per) {
  const rijen = les.groepen.map((g) => {
    const plan = groepPlanning(les, g.id).filter(({ f }) => f.type === 'verwerken');
    const wat = [...new Set(plan.map(({ b }) => b.werkvorm?.naam).filter(Boolean))].join(', ') || '—';
    const waar = [...new Set(plan.map(({ b }) => PLEK[b.plek]))].join(', ') || PLEK.lokaal;
    const hk = inf.heeft?.hint === false ? '' : ', hintkaarten';
    const mat = { steun: `werkblad steun${hk}`, basis: `werkblad basis${hk}`, verdieping: 'werkblad verdieping, pluskaarten', zelfstandig: 'werkblad basis', stilte: 'werkblad basis of verdieping', wissel: 'werkblad basis', klas: 'werkblad basis, pluskaarten' }[g.rol] ?? 'werkblad basis';
    return [g.naam, String(g.aantal), wat, waar, mat];
  });
  return {
    id: 'differentiatie-overzicht', titel: `Differentiatie-overzicht: ${inf.titel}`, voor: 'docent', soort: 'overzicht', aantal: 1,
    blokken: [
      tabel(['Groep', 'Aantal', 'Wat krijgen ze', 'Waar', 'Materiaal'], rijen),
      per.geschat ? alinea('De aantallen zijn geschat. De startcheck of de check op begrip bepaalt wie echt in welke route zit.', { klein: true }) : null,
      kop('Differentiatievormen in deze les', 3),
      lijst(les.differentiatie.map((d) => d.naam)),
      alinea('Iedereen werkt aan hetzelfde lesdoel, met meer of minder steun (convergent). Alleen de verdiepingsroute gaat verder dan het doel.', { klein: true })
    ].filter(Boolean)
  };
}

function kijkwijzer(les, inf, profiel) {
  const speer = profiel.speerpunten?.items?.find((s) => /didactiek/i.test(s)) ?? profiel.speerpunten?.items?.[0];
  const vragen = [
    'Is het lesdoel zichtbaar en waarneembaar ("je kunt …")? Weten leerlingen waar ze naartoe werken?',
    `Hoe lang duurt de instructie aaneen? (richtlijn: maximaal ${les.instructieMax} minuten)`,
    'Laat de check zien wat de hele klas weet? Wat doet de docent met de uitkomst (als-dan)?',
    'Krijgt de steunroute iets anders dan herhaling (ander voorbeeld, kleinere stap)?',
    'Wordt de bovenkant van de klas echt uitgedaagd (hoger denkniveau)?',
    'Werken leerlingen zowel individueel als samen? Hoe gaat het samenwerken?'
  ];
  if (les.fases.some((f) => f.blokken.some((b) => b.plek !== 'lokaal'))) vragen.push('Hoe verlopen de wissels tussen lokaal en plein? Hoeveel tijd kosten ze?');
  return {
    id: 'kijkwijzer', titel: `Kijkwijzer collegiaal lesbezoek: ${inf.titel}`, voor: 'docent', soort: 'kijkwijzer', aantal: 1, aantalUitleg: 'voor de collega die komt kijken',
    blokken: [
      speer ? alinea(`Speerpunt ${profiel.speerpunten.schooljaar ?? ''}: ${speer}.`.replace(' :', ':'), { nadruk: true }) : null,
      alinea(`In deze les: ${les.standNaam.toLowerCase()}, ${les.opzetNaam.toLowerCase()}. Differentiatie: ${les.differentiatie.map((d) => d.naam.toLowerCase()).join(', ')}.`),
      tabel(['Kijkvraag', 'Wat zie je?'], vragen.map((v) => [v, ''])),
      kop('Na afloop', 3),
      tabel(['Eén top', 'Eén tip'], [['', '']]),
      alinea('Gespreksvraag: wat zou je de volgende keer anders doen, en wat houd je zeker vast?', { klein: true })
    ].filter(Boolean)
  };
}

function reflectiekaart(les, inf) {
  const vormen = [...new Set(les.fases.flatMap((f) => f.blokken.map((b) => b.werkvorm?.naam)).filter(Boolean))];
  return {
    id: 'reflectiekaart', titel: `Reflectie na de les: ${inf.titel}`, voor: 'docent', soort: 'reflectie', aantal: 1,
    blokken: [
      tabel(['Werkvorm', 'Duim omhoog', 'Duim omlaag', 'Opmerking'], vormen.map((v) => [v, '☐', '☐', ''])),
      vraag(1, 'Wat werkte goed?', 3), vraag(2, 'Wat werkte niet, en waarom denk je?', 3), vraag(3, 'Wat neem ik mee naar de volgende les?', 3)
    ]
  };
}

function oaKaart(les, inf) {
  const momenten = [];
  for (const f of les.fases) for (const b of f.blokken) if (b.begeleiding === 'oa' && !b.vervolg) momenten.push([`${f.start}–${f.start + f.duur}`, b.groepen.join(' + '), PLEK[b.plek], b.werkvorm?.naam ?? f.titel]);
  return {
    id: 'oa-kaart', titel: `Kaart voor de onderwijsassistent: ${inf.titel}`, voor: 'docent', soort: 'kaart', aantal: 1,
    blokken: [
      alinea(les.oa.rol, { nadruk: true }),
      alinea(`Lesdoel: ${les.doel.lesdoelen[0]?.tekst ?? '⟦lesdoel⟧'}`),
      momenten.length ? tabel(['Minuut', 'Groep', 'Waar', 'Werkvorm'], momenten) : alinea('Loop rond in het lokaal en help waar nodig.'),
      kop('Zo help je', 3),
      lijst([inf.heeft?.hint === false ? 'Geef geen antwoorden; stel een vraag die de leerling op weg helpt.' : 'Geef geen antwoorden; stel een vraag of wijs op de hintkaart.', inf.heeft?.hint === false ? 'Leerling zit echt vast? Stuur hem naar de instructietafel of laat het de docent weten.' : 'Leerling zit vast na hint 2? Stuur hem naar de instructietafel of laat het de docent weten.', 'Houd de tijd in de gaten en waarschuw vijf minuten voor de wissel.', 'Op het plein: alleen de schoollaptop, alleen voor de opdracht.']),
      kop('Waarschuw de docent als', 3),
      lijst(['meer dan een paar leerlingen dezelfde fout maken;', 'iemand niet aan het werk komt of zich niet aan de afspraken houdt;', 'een groep veel eerder klaar is dan gepland.'])
    ]
  };
}

function voorbereiding(les, inf, docs, itemMap) {
  const printen = docs.filter((d) => d.aantal > 0).map((d) => `${d.aantal}× ${d.titel.split(':')[0]}${d.aantalUitleg ? ` (${d.aantalUitleg})` : ''}`);
  const middelen = [...new Set(les.fases.flatMap((f) => f.blokken.flatMap((b) => itemMap.get(b.werkvorm?.id)?.middelen.lijst ?? [])))].filter((m) => !/^geen$/i.test(m));
  const inrichten = [];
  if (les.fases.some((f) => f.blokken.some((b) => b.rol === 'steun'))) inrichten.push('Een instructietafel met plek voor 4 tot 6 leerlingen.');
  if (les.differentiatie.some((d) => d.id === 'hoeken-l-lokaal')) inrichten.push('Drie zones in het lokaal: instructie, stil werken, overleggen (met zonekaarten).');
  if (les.fases.some((f) => f.blokken.some((b) => b.plek === 'plein'))) inrichten.push(`Een vaste plek op het ${termen.plein} voor de pleingroep, met de afsprakenkaart.`);
  if (les.fases.some((f) => f.blokken.some((b) => b.plek === 'stilte'))) inrichten.push('Afspraak over de stilteruimte: is hij vrij, en wie houdt toezicht?');
  const kaartsoorten = [docs.some((d) => d.id === 'hintkaarten') && 'Hintkaarten', docs.some((d) => d.id === 'pluskaarten') && 'pluskaarten'].filter(Boolean);
  if (kaartsoorten.length) inrichten.push(`${kaartsoorten.join(' en ').replace(/^p/, 'P')} op een vaste plek.`);
  return {
    id: 'voorbereiding', titel: `Voorbereiding: ${inf.titel}`, voor: 'docent', soort: 'checklist', aantal: 1,
    blokken: [
      kop('Printen', 3), vink(printen),
      kop('Klaarzetten', 3), vink([...middelen, 'Antwoordkaart bij het werkblad', ...(les.invoer?.context?.laptops !== 'geen' && les.fases.some((f) => f.blokken.some((b) => itemMap.get(b.werkvorm?.id)?.middelen.laptop === 'vereist')) ? ['Schoollaptops (opgeladen)'] : [])]),
      kop('Inrichten', 3), vink(inrichten),
      kop('Digibord', 3), vink(['Open de digibordmodus en test de timer en het geluid.', 'Zet het routeschema klaar.']),
      kop('Invullen', 3), vink(['De gemarkeerde invulvelden in het materiaal (eigen vragen, voorbeeld, uitwerkingen).', 'Het regionale of eigen voorbeeld voor de relevantie-haak.'])
    ]
  };
}

/* ───────────────────────── Alles samen ───────────────────────── */

function antwoordkaart(les, inf, ai) {
  const blokken = [];
  if (ai.ANTWOORDEN) blokken.push(kop('Werkbladen', 3), ...AI.regelsVan(ai.ANTWOORDEN).map((r) => alinea(r)));
  if (ai.STARTCHECK) { const sc = AI.startcheck(ai.STARTCHECK); if (sc.antwoorden) blokken.push(kop('Startcheck', 3), alinea(sc.antwoorden)); }
  if (ai.CHECKVRAAG) { const c = AI.checkvraag(ai.CHECKVRAAG); blokken.push(kop('Scharniervraag', 3), alinea(`Goed antwoord: ${c.goed}. ${c.misvattingen}`)); }
  for (const k of ['HINTKAART-1', 'HINTKAART-2']) if (ai[k] && inf.heeft?.hint !== false) { const h = AI.hintkaart(ai[k]); blokken.push(kop(`Uitwerking ${k.toLowerCase().replace('hintkaart-', 'opgave ')}`, 3), alinea(h.opgave, { klein: true }), alinea(h.uitwerking)); }
  if (!blokken.length) return null;
  return { id: 'antwoordkaart', titel: `Antwoordkaart: ${inf.titel}`, voor: 'docent', soort: 'antwoorden', aantal: 1, aantalUitleg: 'voor jezelf of om leerlingen zelf te laten nakijken', blokken: [alinea('Gemaakt met AI: controleer de antwoorden voordat je ze gebruikt.', { klein: true }), ...blokken] };
}

/** De les gezien vanuit één laag van een combinatieklas: eigen onderwerp, lesdoelen, aantal en klas. */
export function lesVoorLaag(les, laagId) {
  const l = les.lagen?.find((x) => x.id === laagId);
  if (!l) return les;
  return {
    ...les, aantal: l.aantal, laag: l,
    doel: { ...les.doel, onderwerp: l.onderwerp || les.doel.onderwerp, lesdoelen: l.lesdoelen, begrippen: l.begrippen?.length ? l.begrippen : (l.id === 'A' ? les.doel.begrippen : []), eindtermen: l.id === 'A' ? les.doel.eindtermen : [] },
    invoer: { ...les.invoer, context: { ...(les.invoer?.context ?? {}), afdeling: l.afdeling, leerjaar: l.leerjaar } }
  };
}

/** Een document voor één laag: eigen id en de laag in de titel. */
const voorLaag = (d, l) => ({ ...d, id: `${d.id}-laag-${l.id}`, titel: d.titel.replace(/^([^:]+)/, `$1 · ${l.code}`), laag: l.id });

export function maakMateriaal(les, data, ai = {}, links = [], aiPerLaag = {}) {
  ai = ai ?? {};
  // Geen lesdoel ingevuld, maar wel een voorstel van AI? Dan geldt dat lesdoel in het materiaal.
  if (!les.doel.lesdoelen.length && ai.LESDOEL) {
    const doelen = AI.regelsVan(ai.LESDOEL).map((x) => x.replace(/^[-*•\d.)\s]+/, '').trim()).filter((x) => /^je (kunt|kan)\b/i.test(x)).slice(0, 2)
      .map((tekst) => ({ tekst, niveau: controleerLesdoel(tekst).niveau ?? 'begrijpen' }));
    if (doelen.length) les = { ...les, doel: { ...les.doel, lesdoelen: doelen } };
  }
  // Geen kernbegrippen ingevuld, maar wel een vaktaalkaart van AI? Dan gelden die begrippen als kernbegrippen.
  if (!(les.doel.begrippen ?? []).filter(Boolean).length && ai.VAKTAAL) {
    const uitAi = AI.vaktaal(ai.VAKTAAL).map((x) => x.begrip).filter(Boolean).slice(0, 6);
    if (uitAi.length) les = { ...les, doel: { ...les.doel, begrippen: uitAi } };
  }
  const { profiel } = data;
  const itemMap = data.itemMap ?? new Map(data.items.map((i) => [i.id, i]));
  const inf = info(les, profiel);
  const per = aantallen(les);
  const ids = new Set(les.fases.flatMap((f) => [...f.blokken.map((b) => b.werkvorm?.id), ...(f.extra ?? []).map((e) => e.id)]).filter(Boolean));

  // Alleen materiaal dat de les echt gebruikt
  // Hintkaarten ook als een werkvorm in de les ze in zijn als-dan-regels voorschrijft (bijvoorbeeld de startcheck)
  const noemt = (woord) => [...ids].some((id) => (itemMap.get(id)?.alsDan ?? []).some((r) => new RegExp(woord, 'i').test(`${r.als} ${r.dan}`)));
  inf.heeft = { hint: ids.has('hintkaarten') || noemt('hintkaart'), exit: ids.has('exit-ticket'), routes: les.groepen.length > 1 };
  // Per laag (combinatieklas met twee lagen) of voor de hele klas: werkbladen, hintkaarten, succescriteria, exit tickets, vaktaal
  const perLaag = (lesL, infL, perL, aiL) => [
    ...werkbladen(lesL, infL, perL, aiL),
    infL.heeft.hint ? hintkaarten(lesL, infL, aiL) : null,
    succescriteria(lesL, infL),
    infL.heeft.exit ? exitTickets(lesL, infL, perL, aiL) : null,
    vaktaalkaart(lesL, infL, aiL)
  ].filter(Boolean);
  const laagDocs = les.lagen
    ? les.lagen.flatMap((l) => {
      const aiL = l.id === 'A' ? ai : (aiPerLaag?.[l.id] ?? {});
      let lesL = lesVoorLaag(les, l.id);
      if (!(lesL.doel.begrippen ?? []).length && aiL.VAKTAAL) lesL = { ...lesL, doel: { ...lesL.doel, begrippen: AI.vaktaal(aiL.VAKTAAL).map((x) => x.begrip).filter(Boolean).slice(0, 6) } };
      if (!lesL.doel.lesdoelen.length && aiL.LESDOEL) lesL = { ...lesL, doel: { ...lesL.doel, lesdoelen: AI.regelsVan(aiL.LESDOEL).map((x) => x.replace(/^[-*•\d.)\s]+/, '').trim()).filter((x) => /^je (kunt|kan)\b/i.test(x)).slice(0, 2).map((tekst) => ({ tekst, niveau: controleerLesdoel(tekst).niveau ?? 'begrijpen' })) } };
      const infL = { ...info(lesL, profiel), heeft: inf.heeft };
      const f = l.aantal / Math.max(1, les.aantal);
      const perL = { ...per, steun: Math.round(per.steun * f), verdieping: Math.round(per.verdieping * f) };
      perL.basis = Math.max(0, l.aantal - perL.steun - perL.verdieping);
      return perLaag(lesL, infL, perL, aiL).map((d) => voorLaag(d, l));
    })
    : perLaag(les, inf, per, ai);
  const leerling = [
    ...laagDocs.filter((d) => d.id.startsWith('werkblad')),
    inf.heeft.routes ? opdrachtkaarten(les, inf) : null,
    ...laagDocs.filter((d) => !d.id.startsWith('werkblad'))
  ].filter(Boolean);
  if (ids.has('startcheck-routes') || ai.STARTCHECK) leerling.unshift(startcheck(les, inf, ai));
  if (ids.has('plusopdracht-klaar') || per.verdieping > 0) leerling.push(pluskaarten(les, inf));
  if (les.materiaalAdvies.rekenhulpkaart) { const r = rekenhulpkaart(inf); r.aantal = Math.max(1, Math.ceil(les.aantal / 2)); leerling.push(r); }
  if (les.routines.includes('rolkaarten')) leerling.push(rolkaarten(les, inf));
  if (les.fases.some((f) => f.blokken.some((b) => b.plek === 'plein'))) leerling.push(pleinafspraken(les, profiel, inf.heeft));
  leerling.push(vandaagkaarten(les, inf));
  if ([...ids].some((id) => PRODUCT.includes(id))) leerling.push(rubric(les, inf));

  const docent = [
    lesplanDoc(les, inf, profiel, itemMap, ai),
    differentiatieDoc(les, inf, per),
    kijkwijzer(les, inf, profiel),
    reflectiekaart(les, inf)
  ];
  if (les.oa) docent.push(oaKaart(les, inf));
  if (les.lagen) {
    for (const l of les.lagen) {
      const aiL = l.id === 'A' ? ai : (aiPerLaag?.[l.id] ?? {});
      const akL = antwoordkaart(lesVoorLaag(les, l.id), inf, aiL);
      if (akL) docent.push(voorLaag(akL, l));
    }
  } else {
    const ak = antwoordkaart(les, inf, ai);
    if (ak) docent.push(ak);
  }
  docent.splice(1, 0, voorbereiding(les, inf, [...docent, ...leerling], itemMap));
  // Aangevinkte bronnen in het lesplan (alleen wat de docent zelf heeft gekozen)
  if (links?.length) docent[0].blokken.push(kop('Bronnen en media'), lijst(links.map((l) => `${l.titel}: ${l.url}`)));
  // Materialenlijst in het lesplan
  docent[0].blokken.push(kop('Materialen'), lijst([...docent.slice(1), ...leerling].filter((d) => d.aantal > 0).map((d) => `${d.aantal}× ${d.titel.split(':')[0]}`)));

  return {
    docent, leerling,
    alle: [...docent, ...leerling],
    aantallen: per,
    advies: les.materiaalAdvies
  };
}
