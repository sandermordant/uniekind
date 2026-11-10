# Testverslag: alle eindtermen, syllabi en onderwerpen; opgave op niveau

**Automatische tests: 164 van 164 geslaagd** (`npm test`), waarvan 10 nieuw in `tests/examen.test.js`. Kennisbank, profielen en 422 kaders geldig (`npm run valideer`). Toegankelijkheid (axe-core, WCAG 2.1 AA): 0 overtredingen op alle 22 schermen per thema, licht en donker, inclusief Examenstof en Opgave op niveau.

## Wat erin zit

Bron: de open data van SLO op GitHub (licentie MIT), releases van augustus tot oktober 2026 (syllabi: november 2025). De websites van SLO en Examenblad zijn vanuit deze omgeving niet bereikbaar; GitHub wel.

| Soort | Aantal kaders | Wat |
|---|---|---|
| Kerndoelen | 27 | De 58 kerndoelen onderbouw (geldend) en de nieuwe kerndoelen (concept) |
| Leerdoelenkaarten | 21 | Onderwerpen per vak: vakkern, subkern, inhoud |
| Examenprogramma's | 264 | Alle geldende programma's voor vmbo, havo en vwo, plus conceptexamenprogramma's en de praktijkgerichte programma's van vmbo |
| Syllabi | 110 | Per examenprogramma en vmbo-leerweg de nieuwste, met specifieke eindtermen, toelichtingen en vakbegrippen |
| **Totaal** | **422** | **59 vakken, 19.794 regels** |

Nieuw ten opzichte van de vorige ronde: de vakken buiten het Sophianum-profiel (onder meer Spaans, Italiaans, Russisch, Turks, Arabisch, Chinees, Fries, NLT, ANW, M&O, maatschappijwetenschappen, maatschappijkunde, BSM, dans en film), de toelichtingen en vakbegrippen bij de syllabi, de leerdoelenkaarten, alle conceptexamenprogramma's en de praktijkgerichte programma's (gekoppeld aan het beroepsgerichte profielvak, dat eerst geen kader had).

## Examenstof

Kaders per vak, niveau en soort bekijken, met per eindterm de toelichting en vakbegrippen. Zoeken in één vak of in alle vakken. Bij elke eindterm: **In een les** (de eindterm wordt aan je lesconcept gekoppeld) of **Opgave op niveau**.

Getest: economie havo toont leerdoelenkaart, examenprogramma en syllabus (146 regels); zoeken op "koopkracht" bij havo geeft terecht niets (het woord staat alleen in de vmbo- en vwo-syllabus) en zegt welk filter aanstaat; "In een les" opent de wizard met de eindterm gekoppeld.

## Opgave op niveau

| Wat moet blijken | Uitkomst |
|---|---|
| Vragen, punten en vraagwoorden worden herkend | "2p 5 Leg uit…", "1p 6 Bereken…", "2p 7 Beoordeel…" → uitleggen, berekenen, beoordelen |
| Passende eindtermen worden gevonden | Bij een opgave over prijsstijging en koopkracht: eindtermen uit de syllabus over loon-prijsspiraal en koopkracht |
| Drie versies zonder AI | Steun met vaktaal (de vakbegrippen van de eindterm), een stappenplan per vraagwoord en hintkaarten; basis met nakijkcheck; verdieping met vier extra denkvragen; docentblad met eindtermen, vraagwoorden en antwoordmodel |
| Herschrijven naar een ander niveau | De AI-opdracht vraagt om herschrijven van havo naar vmbo kader en bevat alleen de opgave en de eindtermen |
| Teruggeplakt antwoord | Blokken worden herkend en verschijnen in de versies, met "lees na op juistheid en niveau" |
| Export | Word en PDF |
| Les bij de opgave | De wizard opent met de opgave als tekst, de eindtermen gekoppeld en de lessenreeks op toetsvoorbereiding |
| Telefoon (375) | Geen horizontaal scrollen |

## Wat niet kan

- **Examenopgaven zelf** zitten niet in de open data van SLO; ze zijn van het CvTE en staan op Examenblad, dat hier niet bereikbaar is. Je plakt of fotografeert een opgave. Er is een zoeklink naar Examenblad.
- **Herschrijven naar een ander niveau** vraagt echt taalwerk; dat doet de AI-brug. Zonder AI krijg je de vaste hulpstructuren.
- De syllabi in de open data lopen tot examenjaar 2024; de importer pakt een nieuwere release vanzelf mee.
