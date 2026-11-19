// Het vaste uitwisselformaat tussen Uniekind en een AI-tool (AI-brug nu, API-route later).
// Elk onderdeel begint met een kopregel "### NAAM". Uniekind leest het antwoord terug in deze blokken.
// Dezelfde namen gelden voor de latere API-route, zodat de sjablonen niet hoeven te veranderen.

export const ONDERDELEN = [
  { id: 'LESDOEL', label: 'Lesdoel', vorm: 'Eén of twee lesdoelen voor deze les, elk op een eigen regel, beginnend met "Je kunt" en met een werkwoord dat je kunt zien of horen (bijvoorbeeld uitleggen, berekenen, vergelijken). Alleen nodig als er hierboven nog geen lesdoel staat.' },
  { id: 'UITGEWERKT-VOORBEELD', label: 'Uitgewerkt voorbeeld', vorm: 'Een opgave bij het lesdoel, volledig uitgewerkt in genummerde stappen (1., 2., 3., …). Zet achter elke stap in één korte zin waarom die stap nodig is.' },
  { id: 'AANVULOPDRACHT', label: 'Aanvulopdracht', vorm: 'Een opgave die lijkt op het uitgewerkte voorbeeld. Schrijf de eerste stappen uit en laat de laatste één of twee stappen open met "…".' },
  { id: 'VRAGEN-STEUN', label: 'Vragen werkblad steun', vorm: '4 genummerde vragen op het niveau onthouden en begrijpen, in eenvoudige taal en korte zinnen. Zet het denkniveau tussen rechte haken achter elke vraag, bijvoorbeeld [Begrijpen].' },
  { id: 'VRAGEN-BASIS', label: 'Vragen werkblad basis', vorm: '5 genummerde vragen: 2 op begrijpen, 2 op toepassen, 1 op analyseren. Zet het denkniveau tussen rechte haken achter elke vraag.' },
  { id: 'VRAGEN-VERDIEPING', label: 'Vragen werkblad verdieping', vorm: '5 genummerde vragen op analyseren, evalueren en creëren, voor leerlingen die het lesdoel al beheersen. Zet het denkniveau tussen rechte haken achter elke vraag.' },
  { id: 'OPGAVE-BASIS', label: 'Opgave basisroute', vorm: 'Eén toepassingsopgave voor de basisroute, met alle gegevens die nodig zijn.' },
  { id: 'UITDAGING', label: 'Uitdaging verdieping', vorm: 'Eén open opdracht voor de verdiepingsroute (onderzoeken, beoordelen of ontwerpen) van 15 tot 20 minuten.' },
  { id: 'HINTKAART-1', label: 'Hintkaart 1', vorm: 'Voor de lastigste vraag van VRAGEN-BASIS. Precies vier regels: "Opgave: …", "Hint 1: …" (een vraag die de goede kant op wijst, geen antwoord), "Hint 2: …" (de eerste stap), "Uitwerking: …".' },
  { id: 'HINTKAART-2', label: 'Hintkaart 2', vorm: 'Voor een tweede lastige vraag, in dezelfde vier regels als HINTKAART-1.' },
  { id: 'CHECKVRAAG', label: 'Scharniervraag', vorm: 'Eén meerkeuzevraag voor de check op begrip, waarbij elk fout antwoord een bekende misvatting is. Regels: "Vraag: …", "A: …", "B: …", "C: …", "D: …", "Goed: (letter)", "Misvattingen: …" (bij elk fout antwoord kort welke denkfout erachter zit).' },
  { id: 'STARTCHECK', label: 'Startcheck', vorm: '4 korte genummerde vragen die laten zien of een leerling het lesdoel al beheerst, van makkelijk naar moeilijk. Daarna een regel "Antwoorden: 1. … 2. … 3. … 4. …".' },
  { id: 'EXIT-TICKET', label: 'Exit tickets', vorm: 'Drie regels met één vraag per niveau: "Steun: …", "Basis: …", "Verdieping: …".' },
  { id: 'VAKTAAL', label: 'Vaktaal-steunkaart', vorm: 'Voor elk kernbegrip één regel: "begrip | omschrijving in eenvoudig Nederlands (taalniveau A2-B1) | korte voorbeeldzin".' },
  { id: 'RELEVANTIE', label: 'Relevantie-haak', vorm: 'Twee of drie zinnen die leerlingen laten zien waarom dit ertoe doet, met een concreet voorbeeld uit {regio}. Verzin geen feiten, cijfers of namen van bedrijven; weet je iets niet zeker, kies dan een alledaags voorbeeld uit het leven van een tiener.' },
  { id: 'ANTWOORDEN', label: 'Antwoorden', vorm: 'De antwoorden bij VRAGEN-STEUN, VRAGEN-BASIS en VRAGEN-VERDIEPING. Begin elk werkblad met een regel "Steun:", "Basis:" of "Verdieping:" en nummer de antwoorden.' }
];

export const IDS = ONDERDELEN.map((o) => o.id);

/** Welke onderdelen het materiaal van deze les echt gebruikt (geen hintkaarten, exit tickets of startcheck als die er niet zijn). */
export function nodigVoorMateriaal(docIds, heeftLesdoel = true) {
  // Documenten per laag heten bijvoorbeeld 'hintkaarten-laag-B'
  const heeft = new Set(docIds.map((id) => id.replace(/-laag-[A-Z]$/, '')));
  return IDS.filter((id) => !((id === 'LESDOEL' && heeftLesdoel) || (id.startsWith('HINTKAART') && !heeft.has('hintkaarten')) || (id === 'EXIT-TICKET' && !heeft.has('exit-tickets')) || (id === 'STARTCHECK' && !heeft.has('startcheck'))));
}

/** Kleine prompts per materiaalsoort. */
export const PAKKETTEN = [
  { id: 'alles', label: 'Alles in één keer', ids: IDS },
  { id: 'werkbladen', label: 'Alleen de werkbladen (met antwoorden)', ids: ['UITGEWERKT-VOORBEELD', 'AANVULOPDRACHT', 'VRAGEN-STEUN', 'VRAGEN-BASIS', 'VRAGEN-VERDIEPING', 'OPGAVE-BASIS', 'UITDAGING', 'ANTWOORDEN'] },
  { id: 'verdieping', label: 'Alleen 5 extra verdiepingsvragen en een uitdaging', ids: ['VRAGEN-VERDIEPING', 'UITDAGING'] },
  { id: 'voorbeeld', label: 'Alleen een uitgewerkt voorbeeld met aanvulopdracht', ids: ['UITGEWERKT-VOORBEELD', 'AANVULOPDRACHT'] },
  { id: 'hints', label: 'Alleen hintkaarten', ids: ['HINTKAART-1', 'HINTKAART-2'] },
  { id: 'checks', label: 'Alleen startcheck, scharniervraag en exit tickets', ids: ['STARTCHECK', 'CHECKVRAAG', 'EXIT-TICKET'] },
  { id: 'vaktaal', label: 'Alleen een vaktaalkaart', ids: ['VAKTAAL'] },
  { id: 'relevantie', label: 'Alleen een relevantie-haak met een voorbeeld uit de regio', ids: ['RELEVANTIE'] }
];
