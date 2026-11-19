# Testverslag: eigen materiaal van de docent als basis voor de les

**Datum:** 19 november 2026

**Automatische tests: 261 van 261 geslaagd** (`npm test`), waarvan 11 nieuw in `tests/eigen-materiaal.test.js`. Kennisbank, profielen en kaders geldig (`npm run valideer`).

**Controle in de browser:**
- `node tools/controleer-site.cjs` op de gebouwde site: 150 controles, 0 problemen.
- Met een echt Word-bestand en een echte PDF: inlezen in de snelle modus, de les maken, en de AI-opdracht in stap 4. Gecontroleerd met axe op laptop en op 375 px, in licht en donker.
- Ook het tabblad *Eigen document* bij Inhoud is getest.

## Vraag van Sander
Kan de site vragen of de collega al eigen materiaal heeft, en dat verwerken in de AI-opdracht en de PowerPoint? Of kost dat API-geld? En kunnen docenten bestaande documenten of leerstof uploaden, zodat al het materiaal daarop wordt gebouwd?

**Geen API-kosten.** De AI-brug is kopiëren en plakken in de AI-tool van de school (Copilot met het schoolaccount). Eigen materiaal maakt de opdracht langer, maar kost niets extra. Een directe koppeling (de API-route) zou per gebruik geld kosten; die is er niet en komt alleen na akkoord.

## Wat er gebouwd is
1. **Eigen materiaal toevoegen.**
   - Snelle modus: *Eigen materiaal of lesstof toevoegen* (ingeklapt, optioneel).
   - Uitgebreide modus: tabblad *Eigen document* bij Inhoud.
   - Kiezen of slepen kan voor Word, PowerPoint, PDF, tekst of een foto. Plakken kan ook.
   - Uniekind haalt het onderwerp, de lesdoelen en de kernbegrippen eruit, en meldt wat het vond.
2. **In de browser gelezen** (`src/ocr/document.js`): Word met tabellen, PowerPoint per dia, PDF met tekst via pdf.js (alleen geladen bij een PDF), en foto's via de bestaande OCR. Er gaat niets naar een server.
   - Duidelijke meldingen bij een oud .doc- of .ppt-bestand, een scan-PDF zonder tekst, een te groot bestand (meer dan 15 MB) of een onbekende soort.
3. **De AI-opdracht bouwt erop.**
   - Het materiaal staat onder "STOF EN EIGEN MATERIAAL VAN DE DOCENT (dit is de basis …)": neem de inhoud, voorbeelden, opgaven en volgorde over en maak er drie niveaus van.
   - Maximaal 12.000 tekens; langer wordt ingekort, en de site meldt dat.
   - Bij *Maak af met AI* staat hoeveel woorden eigen materiaal meegaan.
4. **De PowerPoint wordt gevuld.** Nieuw AI-onderdeel *Uitlegdia's* (3 tot 6 dia's). De instructiedia krijgt de uitleg in plaats van het lege vak, met vervolgdia's. Er is ook een los pakket *Alleen uitlegdia's voor de presentatie*. De eigen PowerPoint van de docent blijft ongewijzigd; Uniekind maakt een nieuwe met die inhoud.
5. **Privacy.**
   - Een vakinhoudelijk woord als "dyslexie" in de lesstof blokkeerde de AI-opdracht. Nu staat er een waarschuwing om gegevens over leerlingen eruit te halen.
   - De controle op klasgegevens in de rest van de opdracht blijft streng; een test bewaakt dat.
6. **Twee lagen.** Het eigen materiaal hoort bij laag 1. Een laag met een ander onderwerp krijgt het niet mee.

## Gevonden en opgelost tijdens het testen
Op 375 px maakte het geopende blok de pagina 11 px te breed. De rasterkolom van de stap groeide mee met het bestandsveld; die kolom is nu `minmax(0, 1fr)`.
