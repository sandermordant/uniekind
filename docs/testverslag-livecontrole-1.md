# Testverslag: controle van de live site en drie verbeteringen voor de telefoon

**Datum:** 18 november 2026
**Site:** https://sandermordant.github.io/uniekind/ (publicatie van commit `2569ceb`, workflow geslaagd)

**Automatische tests: 192 van 192 geslaagd** (`npm test`), waarvan 11 nieuw in `tests/toegankelijkheid.test.js`. Kennisbank en profielen geldig (`npm run valideer`).

## Wat is gecontroleerd op de live site
- **Pagina's:** alle 17 pagina's en drie werkvormpagina's, op laptop (1366×768), digibord (1920×1080) en telefoon (375 px). Ze laden allemaal zonder fouten in de console en zonder ontbrekende bestanden.
- **Privacy:** de site maakt geen verbinding met andere sites; alle verzoeken gaan naar `sandermordant.github.io`. `noindex` staat aan.
- **Een les van 100 minuten** (havo, "Betogende teksten"):
  - De drie varianten tellen elk precies op tot 100 minuten.
  - De kern-instructie duurt 12 minuten.
  - Er is nergens een stuk langer dan 25 minuten zonder beweegmoment of wissel; er zijn twee beweegmomenten.
  - Elke variant meldt "Voldoet aan alle eisen".
- **Downloads:** alle zes werken en de bestanden zijn te openen.
  - PDF van al het materiaal (32 pagina's) en van het lesplan (4 pagina's)
  - Word van al het materiaal en van het lesplan
  - PowerPoint
  - het lesbestand `.uniekind`

## Gevonden en opgelost (alleen op de telefoon)
1. **Stap 3 "Aanpassen" was 53 px te breed.** Het keuzemenu *Andere suggestie* werd zo breed als zijn langste optie, en lange labels (zoals "Burgerschap: rechtvaardigheid, gemeenschappelijkheid") liepen niet door naar de volgende regel. De pagina schoof daardoor zijwaarts.
   - **Oplossing:** de kolom van een lesblok mag krimpen (`grid-template-columns: minmax(0, 1fr)`) en labels in een lesblok lopen door (`src/stijl/wizard.css`).
2. **Tabellen die zijwaarts schuiven waren niet met het toetsenbord te bereiken** (axe: `scrollable-region-focusable`, ernstig). Dat gold voor:
   - Visie;
   - de tabel *Wie is waar, wanneer* en de als-dan-tabellen in het lesplan;
   - op de werkvormpagina's de tabellen *Als je dit ziet, doe dan dit* en *Voor leerlingen die iets extra nodig hebben*.

   **Oplossing:** elk vak heeft nu `tabindex="0"`, `role="region"` en een label.
3. **Het voorbeeld van een document** in stap 4 "Materiaal" en bij *Opgave op niveau* had hetzelfde probleem. Het krijgt nu dezelfde oplossing als het materiaalpaneel, dat dit al had.

## Controle na de verbeteringen
- **Axe en schermbreedte** (WCAG 2.1 A en AA), opnieuw gecontroleerd op de gebouwde site (`npm run site`). Het ging om 144 controles: 24 schermen op 3 schermformaten, in licht en donker. De 24 schermen zijn:
  - alle pagina's;
  - drie werkvormpagina's;
  - de stappen 2, 3 en 4 van de lesmaker;
  - Opgave op niveau.
- **Resultaat:** 0 overtredingen, nergens zijwaarts scrollen en geen fouten in de console.
- **Nieuwe test:** `tests/toegankelijkheid.test.js` zoekt elk schuifvak (`tabelvak`, `mat-blad`) in de broncode. Het test faalt als zo'n vak geen `tabindex`, `role` of label heeft, of als de regel voor de lesblokken verdwijnt.

## Nog te doen
De verbeteringen staan op de werkbranch. Ze komen live zodra ze naar `main` gaan.
