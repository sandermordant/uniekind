// Materiaal bij elk onderwerp uit de stof (een domein, subdomein, eindterm of specifieke eindterm).
// Zonder AI maakt Uniekind een leerkaart, een oefenblad op drie niveaus, begrippenkaartjes en een docentblad,
// uit de tekst van SLO: de eindtermen, de toelichtingen en de vakbegrippen. Met de AI-brug laat je
// uitleg en oefenvragen schrijven. Daarnaast: gerichte zoeklinks en bewaarde links van jou en je sectie.
import { kop, alinea, lijst, vink, tabel, vraag, kader, kaarten, schaal, invulveld } from '../materiaal/model.js';
import { alsLesdoel, isDoelzin } from '../data/kaders.js';

export const ONDERWERP_IDS = ['UITLEG', 'OEFENEN-STEUN', 'OEFENEN-BASIS', 'OEFENEN-VERDIEPING', 'ANTWOORDEN'];

const STOP = new Set(('de het een en of van in op met te die dat dit aan voor om tot bij als door naar uit over onder zijn is wordt worden kan kunnen '
  + 'kandidaat leerling leerlingen hij zij zich hun haar deze welke wat waarbij waarin daarbij daarvan ook niet geen meer andere '
  + 'beschrijven uitleggen toepassen herkennen noemen gebruiken geven verklaren analyseren onderscheiden benoemen hanteren '
  + 'domein subdomein eindterm onder andere zoals betreft gaat gericht contexten context begrijpen hoe waarom leidt relevante '
  + 'rol concept kennis inzicht vaardigheden verschillende bepaalde situaties situatie mede daarmee tussen binnen').split(' '));

/** Het onderwerp dat SLO soms tussen haakjes achter een specifieke eindterm zet, zoals "(Marktaanbod)". */
export function onderwerpTussenHaakjes(t) {
  const m = String(t ?? '').trim().match(/\(([^()]{2,45})\)\.?$/);
  if (!m) return null;
  const x = m[1].trim();
  if (x.includes(',') || !/^[A-ZÀ-Ý]/.test(x) || /^(Alleen|Niet|Zie|Bijv|Bv|Dus|Ook|Zoals|Inclusief|Exclusief|Eventueel|O\.a|Excl|Incl)/i.test(x)) return null;
  return x;
}

/** Een leesbare naam voor een onderwerp. */
export function onderwerpNaam(r) {
  const tussen = onderwerpTussenHaakjes(r?.tekst);
  if (tussen && !r?.kop) return tussen;
  let t = String(r?.kop || r?.tekst || '').trim();
  t = t.replace(/^Domein\s+[A-Z0-9]+\s*[:.\-–]?\s*/i, '').replace(/^Subdomein\s+[A-Z0-9]+\s*[:.\-–]?\s*/i, '')
    .replace(/^De (kandidaat|leerling)( kan)?\s+/i, '').replace(/\.$/, '');
  t = t.charAt(0).toUpperCase() + t.slice(1);
  return t.length > 110 ? `${t.slice(0, 107).replace(/\s+\S*$/, '')}…` : t;
}

/** Vakbegrippen met hun uitleg, uit het onderwerp en alles eronder. Lange opsommingen (topografie) vallen weg. */
export function begrippenVan(regels, max = 24) {
  const gezien = new Map();
  for (const r of regels) for (const b of r.begrippen ?? []) {
    const i = String(b).indexOf(':');
    const naam = (i > 0 ? b.slice(0, i) : b).trim();
    const uitleg = i > 0 ? b.slice(i + 1).trim() : '';
    if (naam.length < 2 || naam.length > 40 || naam.includes(',')) continue;
    const sl = naam.toLowerCase();
    if (!gezien.has(sl) || (!gezien.get(sl).uitleg && uitleg)) gezien.set(sl, { naam, uitleg: uitleg.length > 220 ? `${uitleg.slice(0, 217).replace(/\s+\S*$/, '')}…` : uitleg });
  }
  return [...gezien.values()].slice(0, max);
}

/** Zoekwoorden voor externe bronnen: het onderwerp tussen haakjes, een vakbegrip, of de kern van de tekst. */
export function zoekterm(r) {
  const tussen = onderwerpTussenHaakjes(r?.tekst);
  if (tussen) return tussen.toLowerCase();
  const begrip = begrippenVan([r], 2).map((b) => b.naam);
  if (begrip.length) return begrip.join(' ').toLowerCase();
  const woorden = onderwerpNaam(r).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[()[\]"“”'‘’:;,.!?/…]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w) && !/^\d/.test(w));
  return [...new Set(woorden)].slice(0, 4).join(' ');
}

const q = (s) => encodeURIComponent(String(s ?? '').trim());

/**
 * Zoeklinks bij een onderwerp: de zoekbronnen uit het schoolprofiel, Wikipedia en, in de examenklas, Examenblad.
 * Uniekind haalt zelf niets op: de docent klikt en kijkt zelf.
 */
export function zoekLinks(profiel, { term, vakNaam = '', niveauNaam = '', examen = false, vakId = null }) {
  const metVak = `${term} ${vakNaam}`.trim();
  const uit = (profiel.bronnenZoeken ?? []).map((z) => ({ naam: z.naam, url: z.url.replace('{q}', q(z.id === 'youtube' ? metVak : term)) }));
  uit.push({ naam: 'Wikipedia', url: `https://nl.wikipedia.org/w/index.php?search=${q(term)}` });
  if (examen) uit.push({ naam: 'Examenblad: examens en syllabus', url: `https://www.google.com/search?q=${q(`site:examenblad.nl ${vakNaam} ${String(niveauNaam).split(',')[0]}`.trim())}` });
  const methode = vakId ? profiel.sectieAccenten?.perVak?.[vakId]?.methodesite : null;
  if (methode) uit.push({ naam: 'Methodewebsite', url: methode });
  return uit;
}

/** Werkvormen uit de kennisbank die goed passen bij oefenen en herhalen van stof. */
export function werkvormIdsVoor({ examen, metBegrippen }) {
  const lijst = examen ? ['ophaaloefening', 'gespreide-herhaling', 'afwisselen-opgavetypen', 'leerplanning'] : ['concrete-voorbeelden', 'zelfuitleg-elaboratie', 'ophaaloefening', 'dual-coding'];
  return metBegrippen ? ['flitskaarten', 'begrippenkaart', ...lijst].slice(0, 5) : lijst;
}

/** Alleen http(s)-links: geen javascript:, data: of bestanden. */
export function veiligeUrl(u) {
  try { const x = new URL(String(u).trim()); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; }
}

const regelsUitAi = (t) => String(t ?? '').split('\n').map((r) => r.trim()).filter(Boolean);
const vragenUitAi = (t, voorvoegsel) => regelsUitAi(t).map((r) => {
  const m = r.match(/^(\d+)[.)]\s*(.+)$/);
  return m ? vraag(`${voorvoegsel}${m[1]}`, m[2], 3) : alinea(r);
});

/**
 * @param {object} o { regel, kinderen, vakNaam, niveauNaam, examen, bron, ai, links, werkvormen: [{titel}] }
 * @returns {Array} documenten (docentblad, leerkaart, oefenblad, begrippenkaartjes)
 */
export function maakOnderwerpMateriaal(o) {
  const r = o.regel;
  const alle = [r, ...(o.kinderen ?? [])].filter((x) => !x.kopje);
  const naam = onderwerpNaam(r);
  const sub = [o.vakNaam, o.niveauNaam].filter(Boolean).join(' · ');
  const ai = o.ai ?? {};
  const begrippen = begrippenVan(alle);
  // Doelen: de eindtermen onder dit onderwerp (of het onderwerp zelf), als doelzin in de je-vorm
  const termen = alle.filter((x) => !x.heeftKinderen && x.tekst).slice(0, 14);
  const doelen = termen.map((x) => (isDoelzin(x.tekst) ? alsLesdoel(x.tekst) : x.tekst.replace(/\.?$/, '.')));
  const aiLet = Object.keys(ai).length ? [alinea('Met AI gemaakt: lees na op juistheid en niveau.', { klein: true })] : [];

  const leerkaart = {
    id: 'onderwerp-leerkaart', titel: `Leerkaart: ${naam}`, ondertitel: sub, voor: 'leerling', soort: 'werkblad', kleur: 'groen',
    blokken: [
      kop('Dit moet je kunnen', 2),
      vink(doelen.length ? doelen : [`${naam}.`]),
      ...(ai.UITLEG ? [kader('Uitleg', [...regelsUitAi(ai.UITLEG).map((x) => alinea(x)), ...aiLet])] : []),
      ...(begrippen.length ? [kop('Begrippen', 2), tabel(['Begrip', 'Wat betekent het?'], begrippen.map((b) => [b.naam, b.uitleg || '']), [32, 68]),
        ...(begrippen.some((b) => !b.uitleg) ? [alinea('Staat er geen uitleg? Schrijf de betekenis op in je eigen woorden en check hem bij je docent of in je boek.', { klein: true })] : [])] : []),
      kop('Zo leer je dit', 2),
      lijst([
        'Dek de uitleg af en leg elk doel hardop uit, alsof je het aan een klasgenoot vertelt.',
        begrippen.length ? 'Maak van elk begrip een kaartje. Overhoor jezelf vandaag, over twee dagen en over een week.' : 'Schrijf op wat je nog weet zonder te kijken. Vergelijk daarna met je boek.',
        o.examen ? 'Oefen met examenvragen over dit onderwerp en kijk je antwoord na met het correctievoorschrift.' : 'Bedenk bij elk doel een voorbeeld uit je eigen leven of uit het nieuws.'
      ], true),
      kop('Hoe goed kun je dit?', 3),
      schaal(doelen.slice(0, 6).map((d) => d.replace(/^Je kunt /, '').replace(/\.$/, '')))
    ]
  };

  const b = begrippen;
  const steunVragen = ai['OEFENEN-STEUN'] ? vragenUitAi(ai['OEFENEN-STEUN'], 'S') : [
    ...(b.length >= 2 ? [alinea(`Woordbank: ${b.slice(0, 6).map((x) => x.naam).join(' · ')}`, { nadruk: true }),
      ...b.slice(0, 6).filter((x) => x.uitleg).slice(0, 4).map((x, i) => vraag(`S${i + 1}`, `Welk begrip uit de woordbank hoort bij deze uitleg? "${x.uitleg}"`, 1))] : []),
    ...doelen.slice(0, 2).map((d, i) => vraag(`S${b.length >= 2 ? 5 + i : i + 1}`, `${d.replace(/^Je kunt /, 'Laat zien dat je kunt: ').replace(/^Je /, 'Laat zien: je ')} Begin zo: "Ik weet dat … omdat …"`, 3))
  ];
  const basisVragen = ai['OEFENEN-BASIS'] ? vragenUitAi(ai['OEFENEN-BASIS'], 'B') : [
    ...b.slice(0, 3).map((x, i) => vraag(`B${i + 1}`, `Leg in je eigen woorden uit wat ${x.naam} betekent. Geef een voorbeeld.`, 3)),
    ...(b.length >= 2 ? [vraag(`B${Math.min(b.length, 3) + 1}`, `Wat is het verschil tussen ${b[0].naam} en ${b[1].naam}?`, 3)] : []),
    ...doelen.slice(0, 3).map((d, i) => vraag(`B${Math.min(b.length, 3) + (b.length >= 2 ? 2 : 1) + i}`, `Opdracht: ${d.replace(/^Je kunt /, '').replace(/^Je /, '')}`, 4))
  ];
  const plusVragen = ai['OEFENEN-VERDIEPING'] ? vragenUitAi(ai['OEFENEN-VERDIEPING'], 'P') : [
    vraag('P1', o.examen ? `Bedenk zelf een examenvraag over ${b[0]?.naam ?? naam.toLowerCase()} en schrijf het antwoordmodel erbij, met punten.` : `Bedenk zelf een toetsvraag over ${b[0]?.naam ?? naam.toLowerCase()} en schrijf het antwoord erbij.`, 4),
    vraag('P2', `Zoek een voorbeeld uit het nieuws van deze week dat met ${b[1]?.naam ?? b[0]?.naam ?? 'dit onderwerp'} te maken heeft. Leg uit hoe het verband loopt.`, 4),
    vraag('P3', 'Welke fout maken leerlingen vaak bij dit onderwerp, denk je? Leg uit hoe je die fout voorkomt.', 3)
  ];
  const oefenblad = {
    id: 'onderwerp-oefenblad', titel: `Oefenen: ${naam}`, ondertitel: sub, voor: 'leerling', soort: 'werkblad', kleur: 'oranje',
    blokken: [
      alinea('Begin bij Start als je het onderwerp nog lastig vindt, bij Basis als je het al aardig kent. Klaar? Ga door met Plus.', { klein: true }),
      kader('Start: met hulp', steunVragen.length ? steunVragen : [vraag('S1', `Schrijf drie dingen op die je al weet over: ${naam}.`, 3)]),
      kader('Basis', basisVragen.length ? basisVragen : [vraag('B1', `Leg uit: ${naam}.`, 4)]),
      kader('Plus: een stap verder', plusVragen),
      ...aiLet
    ]
  };

  const docs = [];
  docs.push({
    id: 'onderwerp-docent', titel: `Docentblad: ${naam}`, ondertitel: sub, voor: 'docent', soort: 'lesplan',
    blokken: [
      alinea(`Bron: ${o.bron ?? 'SLO'}. ${o.examen ? 'Eindexamenklas.' : ''}`.trim(), { klein: true }),
      kop('Eindtermen', 3),
      lijst(termen.length ? termen.map((x) => `${x.code ? `${x.code}: ` : ''}${x.tekst}${x.ce ? ' (CE)' : x.se ? ' (SE)' : ''}${x.d ? ` [${x.d}]` : ''}`) : [r.tekst]),
      ...(alle.some((x) => x.toel?.length) ? [kop('Toelichting uit de syllabus', 3), ...alle.flatMap((x) => x.toel ?? []).slice(0, 4).map((t) => alinea(t, { klein: true }))] : []),
      ...(begrippen.length ? [kop('Vakbegrippen', 3), alinea(begrippen.map((x) => x.naam).join(' · '))] : []),
      kop('Zo zet je het materiaal in', 3),
      lijst([
        'Leerkaart: aan het begin van het onderwerp uitdelen; leerlingen vinken af wat ze kunnen.',
        'Oefenblad: iedereen werkt aan dezelfde doelen; Start met hulp, Basis op niveau, Plus voor wie klaar is.',
        ...(begrippen.length ? ['Begrippenkaartjes: knippen en in tweetallen overhoren; herhaal na een paar dagen.'] : []),
        'Sluit af met een korte check: drie vragen zonder boek, en bespreek de fouten klassikaal.'
      ]),
      ...((o.werkvormen ?? []).length ? [kop('Werkvormen die hierbij passen', 3), lijst(o.werkvormen.map((w) => w.naam))] : []),
      ...((o.links ?? []).length ? [kop('Gevonden materiaal', 3), lijst(o.links.map((l) => `${l.titel}: ${l.url}`))] : []),
      kop('Antwoorden', 3),
      ...(ai.ANTWOORDEN ? [...regelsUitAi(ai.ANTWOORDEN).map((x) => alinea(x)), ...aiLet] : [invulveld('Antwoorden', 'Vul je eigen antwoorden in, of laat ze maken met de AI-brug en lees ze na.')])
    ]
  });
  docs.push(leerkaart, oefenblad);
  if (begrippen.length >= 2) {
    docs.push({
      id: 'onderwerp-kaartjes', titel: `Begrippenkaartjes: ${naam}`, ondertitel: sub, voor: 'leerling', soort: 'kaarten', kleur: 'blauw',
      blokken: [
        alinea('Knip de kaartjes uit. Voorkant: het begrip. Schrijf op de achterkant de betekenis en een voorbeeld.', { klein: true }),
        kaarten(begrippen.slice(0, 16).map((x) => ({ titel: x.naam, blokken: [alinea(x.uitleg ? `Betekenis: ${x.uitleg}` : 'Betekenis: ……………………………………'), alinea('Voorbeeld: ……………………………………', { klein: true })] })), 4)
      ]
    });
  }
  return docs;
}

/** De opdracht voor de AI-tool. Alleen vakinhoud: geen namen en geen gegevens over de klas. */
export function onderwerpPrompt(o) {
  const r = o.regel;
  const alle = [r, ...(o.kinderen ?? [])].filter((x) => !x.kopje);
  const termen = alle.filter((x) => !x.heeftKinderen && x.tekst).slice(0, 14);
  const begrippen = begrippenVan(alle);
  const toel = alle.flatMap((x) => x.toel ?? []).slice(0, 3);
  return [
    `Je bent een ervaren docent ${o.vakNaam ?? ''} in het Nederlandse voortgezet onderwijs.`.replace(/\s+in het/, ' in het'),
    `Maak lesmateriaal over het onderwerp "${onderwerpNaam(r)}" voor ${o.niveauNaam ?? 'de klas'}${o.examen ? ', een eindexamenklas' : ''}.`,
    'Het materiaal sluit aan bij deze eindterm(en) van SLO:',
    ...(termen.length ? termen : [r]).map((x) => `- ${x.code ? `${x.code}: ` : ''}${x.tekst}`),
    ...(begrippen.length ? [`Vakbegrippen: ${begrippen.map((x) => x.naam).join(', ')}`] : []),
    ...(toel.length ? ['Toelichting uit de syllabus:', ...toel.map((t) => `- ${t}`)] : []),
    '',
    'Schrijf in het Nederlands, op het niveau van de klas, en spreek de leerling aan met je.',
    'Verzin geen feiten, cijfers, jaartallen of bronnen. Weet je iets niet zeker, zet het dan tussen [vierkante haken] zodat de docent het controleert.',
    '',
    'Antwoord precies in dit formaat, met deze kopjes en niets ervoor of erna:',
    '### UITLEG',
    '(korte uitleg voor leerlingen, hooguit 200 woorden, met één concreet voorbeeld)',
    '### OEFENEN-STEUN',
    '(4 genummerde vragen met een hulpzin of woordbank, voor wie het nog lastig vindt)',
    '### OEFENEN-BASIS',
    `(5 genummerde vragen op het niveau van de klas${o.examen ? ', in de stijl van het centraal examen, met vraagwoorden als leg uit, bereken, beoordeel' : ''})`,
    '### OEFENEN-VERDIEPING',
    '(3 genummerde vragen die verder gaan: toepassen in een nieuwe situatie, beoordelen, verbanden leggen)',
    '### ANTWOORDEN',
    '(een antwoordmodel bij alle vragen hierboven, per kopje)'
  ].join('\n');
}
