# Testverslag: één tool met een menu per soort klas, alle examenstof, materiaal bij elk onderwerp

**Automatische tests: 181 van 181 geslaagd** (`npm test`), waarvan 17 nieuw in `tests/bundel.test.js`. Kennisbank, profielen en 442 kaders geldig (`npm run valideer`).

**Toegankelijkheid** (axe-core, WCAG 2.1 AA): 0 overtredingen, in licht en donker. Gecontroleerd zijn alle bestaande schermen en daarnaast de nieuwe:
- de startpagina met de klaskeuze;
- de werkplek van de eindexamenklas, met en zonder open materiaalpaneel;
- de werkplek van andere klassen;
- Stof en materiaal, met het materiaalpaneel open;
- Bewaard materiaal.

## Wat er veranderd is

**Eén tool, een menu per soort klas.** Bovenin staat de keuze *Eindexamenklas* of *Andere klassen*. Op de startpagina is dat de eerste vraag. Je kiest afdeling, leerjaar en vak één keer. Daarna nemen *Maak een les*, *Opgave op niveau* en *Stof en materiaal* die klas over.

| | Eindexamenklas (vmbo 4, havo 5, vwo 6) | Andere klassen |
|---|---|---|
| Werkplek | Alle examenstof: het examenprogramma met onder elk domein de uitwerking uit de syllabus; op vmbo ook de beroepsgerichte profielvakken en keuzevakken | Kerndoelen, leerdoelenkaart en, in de bovenbouw, het examenprogramma |
| Menu | Maak een les · Opgave op niveau · Stof en materiaal · Werkvormen · Mijn profiel · Hulp | Maak een les · Stof en materiaal · Werkvormen · Begin hier · Mijn profiel · Hulp |

Visie, Les openen en Bewaard materiaal staan in de voet en op de werkplek.

**Alle stof van de eindexamendoelen.**
- **Nieuw:** de beroepsgerichte examenprogramma's van vmbo (SLO-dataset `curriculum-examenprogramma-bg`). Dat zijn 10 profielvakken, elk met de kern en vier profielmodules, en alle 158 keuzevakken. Ze zijn uitgewerkt tot 677 deeltaken en 3.473 globale eindtermen, met per eindterm de leerwegen.
- **Totaal:** 442 kaders, ruim 24.000 regels.
- **Examenprogramma en syllabus in één overzicht:** elke syllabus weet nu bij welk examenprogramma hij hoort. In de werkplek staan ze samen, met per domein het aantal onderwerpen en hoeveel er al in je lessen zat.

**Materiaal bij elk onderwerp.** Naast elk domein, elke eindterm en elke specifieke eindterm staat de knop *Materiaal*. Die opent een paneel met:
1. **Direct klaar, zonder AI:**
   - een docentblad;
   - een leerkaart ("Dit moet je kunnen", begrippen met uitleg uit de syllabus, leerstrategieën en een zelfbeoordeling);
   - een oefenblad op drie niveaus (Start met hulp, Basis, Plus);
   - begrippenkaartjes.

   Alles als PDF of Word.
2. **Met AI:** een opdracht die alleen de eindtermen en begrippen bevat. Het teruggeplakte antwoord vult de leerkaart, het oefenblad en de antwoorden.
3. **Zoeken:** links naar de zoekbronnen van de school, Wikipedia en, in de examenklas, Examenblad. De zoekterm komt uit het onderwerp:
   - het onderwerp dat SLO tussen haakjes zet, zoals "(Marktaanbod)";
   - anders een vakbegrip;
   - anders de kernwoorden.
4. **Bewaard:** links die jij en je sectie bij dit onderwerp bewaarden. Delen gaat met een bestand via *Bewaard materiaal*. Alleen http(s)-links worden overgenomen.
5. **Werkvormen** uit de kennisbank om stof te laten beklijven.

Bovenaan het paneel staan *Nieuwe les over dit onderwerp* en, in de examenklas, *Opgave op niveau*.

## Doorgelopen in de browser

| Wat moet blijken | Uitkomst |
|---|---|
| Startpagina vraagt eerst naar de klas | Twee keuzes, met de examenjaren uit het schoolprofiel |
| Menu wisselt met de keuze | Eindexamenklas: Opgave op niveau in het menu. Andere klassen: Begin hier |
| Havo 5 economie toont alle examenstof | Examenprogramma met de syllabus Economie havo 2024. Onder domein D staat "Uitwerking in de syllabus" met 4.1a tot en met 4.3 |
| Materiaal bij "(Marktaanbod)" | Paneel "Materiaal bij: Marktaanbod". Zoeklinks op "marktaanbod". Leerkaart, oefenblad en docentblad |
| Link bewaren | Een https-link wordt bewaard. `javascript:` wordt geweigerd met een melding |
| AI-antwoord terugplakken | UITLEG, OEFENEN-BASIS en ANTWOORDEN herkend; de uitleg staat in de leerkaart |
| Export | Word en PDF (4 pagina's: docentblad, leerkaart, oefenblad) |
| Sluiten | De focus gaat terug naar de knop Materiaal |
| Zoeken in de stof | "inflatie" geeft 7 onderwerpen |
| Nieuwe les over een onderwerp | De lesmaker opent met havo 5 economie, het onderwerp "Marktvraag", de eindterm gekoppeld en het lesdoel in de je-vorm |
| Andere klassen, havo 1 en havo 4 | Havo 1: eerst de kerndoelen. Havo 4: eerst het examenprogramma. Het examenjaar zit niet in de keuzelijst |
| Vmbo kader, beroepsgericht | 9 profielvakken met hun keuzevakken; D&P staat bij het eigen vak D&P |
| Stof en materiaal en Opgave op niveau | Beginnen met het vak en niveau van je klas; het materiaalpaneel werkt ook bij Stof en materiaal |
| Algemene versie | Zelfde menu en werkplek, plus Schoolprofiel |
| Telefoon (375 px) | Geen horizontaal scrollen, ook niet met het materiaalpaneel open |

## Wat niet kan

- **Kant-en-klaar lesmateriaal van buiten** (video's, methodeteksten, oude examens) zit niet in Uniekind. Uniekind:
  - maakt zelf een basis uit de tekst van SLO;
  - zoekt gericht;
  - onthoudt wat jij en je sectie vinden.

  De zoeksites zelf zijn vanuit deze testomgeving niet bereikbaar. Daarom is gecontroleerd dat de links goed worden opgebouwd, niet wat de sites teruggeven.
- **Gedeeld materiaal** voor de hele school vraagt één handeling van de beheerder: het geëxporteerde bestand in `public/data/materiaal-sectie.json` zetten. Er is geen server.
- **Welke beroepsgerichte profielen het Sophianum aanbiedt**, staat niet in de schoolgids die ik had. Daarom toont Uniekind ze allemaal; de docent kiest.
