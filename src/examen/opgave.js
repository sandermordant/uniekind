// Examenopgave op niveau: een (eind)examenopgave koppelen aan eindtermen en aanbieden in drie versies
// (steun, basis, verdieping), zonder AI met vaste hulpstructuren, en met de AI-brug ook herschreven naar
// een ander niveau. Alles hier is pure logica, zodat het getest kan worden.
import { kop, alinea, lijst, vraag, regels, invulveld, kader, tabel, kaarten } from '../materiaal/model.js';
import { korteBegrippen } from '../data/kaders.js';

export const NIVEAU_NAAM = { 'vmbo-bb': 'vmbo basis', 'vmbo-kb': 'vmbo kader', 'vmbo-gltl': 'vmbo gl/tl (mavo)', havo: 'havo', vwo: 'vwo' };
export const OPGAVE_IDS = ['OPGAVE-STEUN', 'OPGAVE-BASIS', 'OPGAVE-VERDIEPING', 'HINTS', 'ANTWOORDMODEL'];

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const STOP = new Set(('de het een en of in op aan van voor met door bij uit als dan dat die dit deze ook niet wel wat wie hoe waar waarom welke welk zijn is was waren wordt worden werd heeft hebben had kan kunnen moet moeten zal zullen naar over onder tussen tegen zonder om tot je jij jouw jullie we wij ze zij hij haar hem hun er nog al meer veel geen elk elke alle andere uw u na zo want maar omdat dus toch per keer zich hier daar the and kandidaat leerling volgende gebruik maak bron bronnen tekst vraag vragen antwoord punten punt figuur tabel informatie gegeven').split(' '));
const woordenVan = (s) => norm(s).split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w));

/* ── Vragen en vraagwoorden ── */
const VRAAGWOORDEN = [
  { re: /\b(bereken|reken uit|bepaal)\b/i, soort: 'berekenen', steun: ['Schrijf op wat gegeven is en wat gevraagd wordt.', 'Kies de formule of rekenregel en schrijf hem op.', 'Vul de getallen in en reken stap voor stap.', 'Schrijf het antwoord op met de eenheid en controleer of het kan kloppen.'] },
  { re: /\b(leg uit|verklaar|beredeneer|toon aan|laat zien)\b/i, soort: 'uitleggen', steun: ['Zoek in de bron de oorzaak of het begin van de redenering.', 'Schrijf de stappen als een keten: omdat … daardoor … dus …', 'Gebruik minstens één vakbegrip.', 'Controleer: sluit je laatste stap aan op wat er gevraagd wordt?'] },
  { re: /\b(vergelijk)\b/i, soort: 'vergelijken', steun: ['Maak een tabel met twee kolommen.', 'Schrijf per kolom de kenmerken op.', 'Omcirkel de overeenkomsten en onderstreep de verschillen.', 'Schrijf je antwoord in één of twee zinnen.'] },
  { re: /\b(beoordeel|onderbouw|geef je mening|ben je het eens|is .* terecht)\b/i, soort: 'beoordelen', steun: ['Schrijf eerst je oordeel in één zin.', 'Zoek twee argumenten in de bron of de stof.', 'Verbind ze met "omdat" en "bovendien".', 'Noem eventueel één tegenargument.'] },
  { re: /\b(citeer|neem over)\b/i, soort: 'citeren', steun: ['Zoek de zin in de tekst.', 'Neem de woorden letterlijk over, tussen aanhalingstekens.', 'Controleer of je niet meer of minder woorden gebruikt dan gevraagd.'] },
  { re: /\b(noem|geef|schrijf op)\b/i, soort: 'noemen', steun: ['Lees hoeveel antwoorden er gevraagd worden en zet zoveel streepjes klaar.', 'Zoek de antwoorden in de bron of de stof.', 'Geef niet meer antwoorden dan gevraagd.'] },
  { re: /\b(beschrijf|omschrijf)\b/i, soort: 'beschrijven', steun: ['Wat zie of lees je precies? Schrijf het in je eigen woorden.', 'Gebruik de vakbegrippen.', 'Gebruik volledige zinnen.'] },
  { re: /\b(teken|schets|maak een grafiek|maak een diagram)\b/i, soort: 'tekenen', steun: ['Kijk welke grootheden op de assen moeten en met welke eenheden.', 'Kies een handige schaalverdeling.', 'Zet de punten en geef de grafiek of tekening een titel.'] }
];
const ALGEMEEN = { soort: 'algemeen', steun: ['Lees de vraag twee keer. Onderstreep wat er gevraagd wordt.', 'Zoek in de bron het stuk dat erbij hoort.', 'Schrijf je antwoord in hele zinnen en gebruik een vakbegrip.'] };

export const vraagwoord = (t) => VRAAGWOORDEN.find((v) => v.re.test(t)) ?? ALGEMEEN;

/**
 * Splitst een opgave in inleiding (bron, context) en vragen. Een vraag is een regel die met een nummer
 * begint ("3", "3.", "3a", "1p 3") of met een vraagteken eindigt.
 */
export function splitsOpgave(tekst) {
  const regelsTekst = String(tekst ?? '').replace(/\r/g, '').split('\n');
  const inleiding = [];
  const vragen = [];
  const vraagStart = /^\s*(?:(\d+)\s*p\s+)?(\d{1,2}[a-z]?)[.)]?\s+(\S.*)$/i;
  for (const r of regelsTekst) {
    const m = r.match(vraagStart);
    if (m && (vragen.length || /[?]|\b(bereken|leg|verklaar|noem|geef|beschrijf|vergelijk|beoordeel|citeer|toon|teken|schets|bepaal|beredeneer|onderbouw|laat)\b/i.test(m[3]))) {
      vragen.push({ nr: m[2], punten: m[1] ? Number(m[1]) : null, tekst: m[3].trim() });
    } else if (vragen.length && r.trim() && !/^\s*$/.test(r) && !/^(bron|tekst|figuur|tabel|informatie)\b/i.test(r.trim())) {
      vragen.at(-1).tekst += ` ${r.trim()}`;
    } else if (!vragen.length && r.trim()) inleiding.push(r.trim());
    else if (vragen.length && r.trim()) inleiding.push(r.trim());
  }
  if (!vragen.length) {
    // Geen nummering: losse zinnen met een vraagteken of een vraagwoord zijn de vragen
    const zinnen = inleiding.filter((r) => /\?$/.test(r) || VRAAGWOORDEN.some((v) => v.re.test(r)));
    return { inleiding: inleiding.filter((r) => !zinnen.includes(r)), vragen: zinnen.map((t, i) => ({ nr: String(i + 1), punten: null, tekst: t })) };
  }
  return { inleiding, vragen };
}

/* ── Eindtermen zoeken die bij de opgave passen ── */
/**
 * @param {string} opgave
 * @param {Array<{sleutel,tekst,toel,begrippen,heeftKinderen,info}>} regelsKader  platte regels (vlak()) van de kandidaat-kaders
 * @returns de best passende regels met een score, hoogste eerst
 */
export function zoekEindtermen(opgave, regelsKader, max = 6) {
  const opgWoorden = new Set(woordenVan(opgave));
  const opgNorm = ` ${norm(opgave).replace(/[^a-z0-9]+/g, ' ')} `;
  const kandidaten = regelsKader.filter((r) => !r.heeftKinderen && r.tekst);
  // Hoe zeldzamer een woord in de kandidaten, hoe zwaarder het telt
  const df = new Map();
  const woordenPer = kandidaten.map((r) => {
    const w = new Set(woordenVan([r.tekst, ...(r.toel ?? []), ...(r.begrippen ?? [])].join(' ')));
    for (const x of w) df.set(x, (df.get(x) ?? 0) + 1);
    return w;
  });
  const n = kandidaten.length || 1;
  const scores = kandidaten.map((r, i) => {
    let s = 0;
    for (const w of woordenPer[i]) if (opgWoorden.has(w)) s += Math.log(1 + n / df.get(w));
    for (const b of korteBegrippen(r.begrippen)) if (b.length > 3 && opgNorm.includes(` ${norm(b)} `)) s += 3;
    return { r, s };
  });
  return scores.filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, max).map((x) => ({ ...x.r, score: Math.round(x.s * 10) / 10 }));
}

/* ── De drie versies, zonder AI ── */
const zinOpgave = (inleiding) => (inleiding.length ? [kader('Bron en context', inleiding.map((r) => alinea(r)))] : []);
const puntLabel = (v) => (v.punten ? `${v.punten}p` : '');

/**
 * @param {object} o { vak, niveau, bronNiveau, opgave, antwoord, eindtermen: [{code,tekst,kaderTitel,begrippen?}], ai: {OPGAVE-STEUN,...}, titel }
 * @returns {Array} documenten volgens het documentmodel van Uniekind (voor scherm, print, PDF en Word)
 */
export function maakVersies(o) {
  const { inleiding, vragen } = splitsOpgave(o.opgave);
  const ai = o.ai ?? {};
  const titel = o.titel || `${o.vak ?? 'Opgave'}${o.niveau ? ` ${NIVEAU_NAAM[o.niveau] ?? o.niveau}` : ''}`;
  // De eindterm zoals hij er staat: omzetten naar de ik-vorm geeft bij veel werkwoorden fout Nederlands
  const doelen = (o.eindtermen ?? []).map((g) => g.tekst);
  const begrippen = [...new Set((o.eindtermen ?? []).flatMap((g) => korteBegrippen(g.begrippen ?? [])))].slice(0, 10);
  const vragenOf = (versieVragen) => versieVragen.length ? versieVragen : [{ nr: '1', punten: null, tekst: '⟦Plak de opgave hierboven; de vragen verschijnen dan hier⟧' }];
  const aiTekst = (id) => (ai[id] ? [kader('Herschreven met AI: lees na op juistheid en niveau', String(ai[id]).split('\n').filter((r) => r.trim()).map((r) => alinea(r)))] : []);

  const steun = {
    id: 'opgave-steun', titel: `Steun: ${titel}`, voor: 'leerling', soort: 'werkblad', kleur: 'groen',
    blokken: [
      ...(doelen.length ? [alinea(`Hiermee oefen je deze eindterm: ${doelen[0]}`, { nadruk: true })] : []),
      ...(begrippen.length ? [kader('Vaktaal', [tabel(['Begrip', 'Wat betekent het?'], begrippen.map((b) => [b, '⟦uitleg in eenvoudige woorden⟧']), [35, 65])])] : []),
      ...(ai['OPGAVE-STEUN'] ? aiTekst('OPGAVE-STEUN') : [
        ...zinOpgave(inleiding),
        ...vragenOf(vragen).flatMap((v) => {
          const w = vraagwoord(v.tekst);
          return [vraag(v.nr, v.tekst, 4, puntLabel(v)), kader('Zo pak je het aan', [lijst(w.steun, true)])];
        })
      ]),
      ...(ai.HINTS ? [kop('Hints', 3), ...String(ai.HINTS).split('\n').filter((r) => r.trim()).map((r) => alinea(r))]
        : [kaarten(vragenOf(vragen).slice(0, 4).map((v) => ({ titel: `Hint bij vraag ${v.nr}`, blokken: [invulveld('Hint 1: waar moet je kijken?', ''), invulveld('Hint 2: de eerste stap', '')] })), 4)])
    ]
  };
  const basis = {
    id: 'opgave-basis', titel: `Basis: ${titel}`, voor: 'leerling', soort: 'werkblad', kleur: 'oranje',
    blokken: [
      ...(doelen.length ? [alinea(`Hiermee oefen je deze eindterm: ${doelen[0]}`, { nadruk: true })] : []),
      ...(ai['OPGAVE-BASIS'] ? aiTekst('OPGAVE-BASIS') : [...zinOpgave(inleiding), ...vragenOf(vragen).map((v) => vraag(v.nr, v.tekst, 4, puntLabel(v)))]),
      kop('Kijk je antwoord na', 3),
      lijst(['Heb ik precies beantwoord wat er gevraagd wordt?', 'Heb ik de bron gebruikt?', 'Staan er vakbegrippen in mijn antwoord?'])
    ]
  };
  const extra = [
    `Bedenk zelf een examenvraag over ${begrippen[0] ?? 'dit onderwerp'} en schrijf het antwoord erbij.`,
    'Verander één gegeven in de bron. Wat verandert er dan aan je antwoord? Leg uit.',
    'Beoordeel: in welke situatie zou je redenering niet kloppen?',
    begrippen.length > 1 ? `Leg het verband uit tussen ${begrippen[0]} en ${begrippen[1]}.` : 'Leg in je eigen woorden uit welk vakbegrip in deze opgave centraal staat.'
  ];
  const verdieping = {
    id: 'opgave-verdieping', titel: `Verdieping: ${titel}`, voor: 'leerling', soort: 'werkblad', kleur: 'rood',
    blokken: [
      ...(ai['OPGAVE-VERDIEPING'] ? aiTekst('OPGAVE-VERDIEPING') : [...zinOpgave(inleiding), ...vragenOf(vragen).map((v) => vraag(v.nr, v.tekst, 3, puntLabel(v)))]),
      kop('Een stap verder', 3),
      ...extra.map((t, i) => vraag(`+${i + 1}`, t, 3))
    ]
  };
  const docent = {
    id: 'opgave-docent', titel: `Docentblad: ${titel}`, voor: 'docent', soort: 'lesplan',
    blokken: [
      alinea(`${o.vak ?? ''}${o.niveau ? `, ${NIVEAU_NAAM[o.niveau] ?? o.niveau}` : ''}${o.bronNiveau && o.bronNiveau !== o.niveau ? `. De opgave komt van ${NIVEAU_NAAM[o.bronNiveau] ?? o.bronNiveau}.` : '.'}`),
      ...((o.eindtermen ?? []).length ? [kader('Sluit aan bij', [lijst(o.eindtermen.map((g) => `${g.code ? `${g.code}: ` : ''}${g.tekst} (${g.kaderTitel})`))])] : [invulveld('Eindterm', 'Koppel de opgave aan een eindterm uit de syllabus.')]),
      kop('Vragen en vraagwoorden', 3),
      tabel(['Vraag', 'Vraagwoord', 'Punten'], vragenOf(vragen).map((v) => [v.nr, vraagwoord(v.tekst).soort, v.punten ? String(v.punten) : '-']), [15, 60, 25]),
      kop('Antwoordmodel', 3),
      ...(ai.ANTWOORDMODEL ? String(ai.ANTWOORDMODEL).split('\n').filter((r) => r.trim()).map((r) => alinea(r)) : o.antwoord ? String(o.antwoord).split('\n').filter((r) => r.trim()).map((r) => alinea(r)) : [invulveld('Antwoordmodel', 'Plak het correctievoorschrift of schrijf je eigen antwoorden.')]),
      kop('Zo zet je de versies in', 3),
      lijst(['Steun: met vaktaal, een stappenplan per vraag en hintkaarten. Voor wie nog vastloopt.', 'Basis: de opgave zoals hij is, met een korte nakijkcheck.', 'Verdieping: de opgave plus vragen die verder gaan dan het examen. Voor wie klaar is.', 'Iedereen werkt aan dezelfde eindterm. Bespreek daarna één vraag klassikaal.']),
      ...(Object.keys(ai).length ? [alinea('Deze versies bevatten tekst die met AI is gemaakt. Lees alles na op juistheid en niveau voordat je het gebruikt.', { nadruk: true })] : [])
    ]
  };
  return [docent, steun, basis, verdieping];
}

/* ── De AI-brug ── */
export function maakOpgavePrompt(o) {
  const herschrijf = o.bronNiveau && o.niveau && o.bronNiveau !== o.niveau;
  const eind = (o.eindtermen ?? []).map((g) => `- ${g.code ? `${g.code}: ` : ''}${g.tekst} (${g.kaderTitel})${g.toel?.length ? `\n  Toelichting: ${g.toel.join(' ')}` : ''}`);
  return [
    'Je bent een ervaren docent en examenmaker in het Nederlandse voortgezet onderwijs.',
    `Vak: ${o.vak ?? '-'}`,
    `Niveau van de klas: ${NIVEAU_NAAM[o.niveau] ?? o.niveau ?? '-'}`,
    ...(herschrijf ? [`De opgave hieronder komt van ${NIVEAU_NAAM[o.bronNiveau] ?? o.bronNiveau}. Herschrijf hem naar het niveau ${NIVEAU_NAAM[o.niveau] ?? o.niveau}: pas taal, context, aantal denkstappen en hulp aan, maar toets dezelfde eindterm.`] : []),
    ...(eind.length ? ['De opgave toetst deze eindterm(en) uit het examenprogramma of de syllabus (SLO):', ...eind] : []),
    '',
    'OPGAVE',
    '"""', String(o.opgave ?? '').trim(), '"""',
    ...(o.antwoord ? ['', 'ANTWOORDMODEL (correctievoorschrift)', '"""', String(o.antwoord).trim(), '"""'] : []),
    '',
    'Maak drie versies van deze opgave voor dezelfde klas. Iedereen werkt aan dezelfde eindterm, met meer of minder steun:',
    '- STEUN: eenvoudiger taal, de opgave opgeknipt in kleinere deelvragen, met een stappenplan bij elke vraag. Verander de vakinhoud niet.',
    '- BASIS: de opgave op het niveau van de klas, duidelijk geformuleerd.',
    '- VERDIEPING: de opgave plus één of twee vragen die verder gaan (toepassen in een nieuwe situatie, beoordelen).',
    'Geef ook bij elke vraag twee hints (eerst waar je moet kijken, dan de eerste stap) en een antwoordmodel met puntenverdeling.',
    'Gebruik alleen gegevens uit de opgave. Als je een gegeven moet verzinnen, zet het tussen [vierkante haken] zodat de docent het kan controleren.',
    '',
    'Antwoord precies in dit formaat, met deze kopjes en niets ervoor of erna:',
    ...OPGAVE_IDS.map((id) => `### ${id}\n(…)`)
  ].join('\n');
}
