# Uniekind – afspraken voor Claude

Uniekind is een statische website (Vite, vanilla JS) die docenten van het Sophianum (Gulpen) helpt gedifferentieerde lessen te maken. Eigenaar: Sander. Online via GitHub Pages: https://sandermordant.github.io/uniekind/ (workflow `.github/workflows/pages.yml`, draait bij elke push naar `main` eerst `npm test`, dan `npm run site`).

Lees eerst `README.md`. De rondes en keuzes staan in `docs/testverslag-*.md` (laatste: `testverslag-livecontrole-1.md`).

## Harde afspraken (niet van afwijken)
- Route A: geen server, geen database, geen accounts, geen API-sleutel. Alles draait in de browser.
- Nooit leerlinggegevens opslaan; alleen aantallen. Een namenlijst mag alleen tijdelijk om te printen.
- Geen trackers, geen externe analytics, geen cookies die toestemming vragen. AI-prompts bevatten nooit leerlinggegevens. OCR-foto's verlaten de computer nooit.
- Telefoons komen nooit in een les ("Thuis of in de kluis"). Het plein alleen met schoollaptop en toezicht, nooit vanuit een L-lokaal; nooit boven de capaciteit van een ruimte.
- Lesregels: totale duur exact; altijd een aandachtrichter, relevantie-haak, check met als-dan, een expliciete differentiatievorm, individueel én samen werken, en een afsluiting; doorlopende instructie in een M-lokaal max. 15 minuten; bij blokuren elke 25 minuten een beweegmoment of wissel.
- Nooit bronnen of effectgroottes verzinnen; twijfel = `"status": "nog-controleren"`. Geen feiten over het Sophianum verzinnen: onbekend = instelbaar met duidelijke standaard.
- Alles in het Nederlands, je-vorm, collegiaal, nooit belerend. WCAG 2.1 AA (axe-core), werkt op laptop, digibord 1920×1080 en telefoon (375 px).
- Techniek simpel houden zodat Sander het kan onderhouden. Kennisbank uitbreidbaar via het invulformulier.
- Een echte API-route (server-side AI) alleen na akkoord van Sander (voorbereid in `docs/api-route.md`).
- Toegangscode is een drempel, geen beveiliging; de site heeft `noindex`.

## Inhoudelijke keuzes die vaststaan
- Alleen de Sophianum-versie (de algemene versie is geschrapt; `tests/fixtures/profiel-andere-school.json` blijft als test).
- Bovenin kiest de docent *Eindexamenklas* (vmbo 4, havo 5, vwo 6) of *Andere klassen*; het menu past zich aan.
- M&M alleen vmbo basis en kader. Filosofie alleen vwo (atheneum en gymnasium). Latijn en Grieks bij vwo gymnasium.
- SLO-data komt uit de open data op GitHub (MIT), te vernieuwen met `npm run importeer-slo -- <map>` (zie README). Examenopgaven zelf zitten er niet in (CvTE); docenten plakken of fotograferen ze.

## Werkwijze
- `npm test` en `npm run valideer` moeten groen zijn vóór elke push; controleer nieuwe schermen met axe en op 375 px.
- Na elke ronde: kort testverslag in `docs/`, README bijwerken.
- Commit en push alleen als Sander erom vraagt of als het bij de opdracht hoort; geen pull requests tenzij gevraagd.
