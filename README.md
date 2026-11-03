# Uniekind

**Lessen op maat, al was het maar voor één kind.**

Uniekind helpt docenten gedifferentieerde lessen te ontwerpen. De docent geeft aan wat hij wil behandelen en in welke situatie. Uniekind kiest uit een kennisbank de best passende werkvormen en levert een complete les met materiaal.

De eerste versie is gemaakt voor **Sophianum** (Gulpen). Later volgt een **algemene versie**, waarin elke school haar eigen visie, lokalen en lestijden instelt. Beide versies gebruiken dezelfde code; het verschil zit alleen in het schoolprofiel.

> Status: **fase 1 (fundament)**. Het schoolprofiel, de kennisbank (74 werkvormen), de validatie, de werkvormenbibliotheek en het invulformulier zijn klaar. De lesgenerator volgt in fase 2.

---

## Snel starten

Je hebt [Node.js](https://nodejs.org) versie 20 of hoger nodig.

```bash
npm install          # eenmalig
npm run dev          # ontwikkelserver op http://localhost:5173
npm run valideer     # controleer de kennisbank en de profielen
npm run build        # bouw de website in dist/ (valideert eerst)
```

De map `dist/` is de complete website. Die zet je op Netlify of GitHub Pages; er is geen server nodig.

---

## Waarom deze techniek

| Keuze | Waarom |
|---|---|
| **Vanilla JavaScript met ES-modules**, geen framework | Een framework veroudert snel en vraagt extra kennis. Gewone HTML, CSS en JS kun je over vijf jaar nog steeds lezen en aanpassen. |
| **Vite** als bouwhulp | Vite bundelt de code en de lettertypen en laadt zware onderdelen (export, OCR, validatie) pas als ze nodig zijn. De site blijft daardoor snel. |
| **JSON-bestanden** voor kennisbank en profiel | Leesbaar, aan te passen in elke teksteditor of in de GitHub-website, en te controleren met een schema. |
| **Geen server, geen database, geen accounts** | Geen kosten, geen beheer, geen persoonsgegevens. Alles draait in de browser van de docent. |
| **Lettertypen lokaal meegeleverd** | Geen verzoeken aan Google of andere derden. |

---

## Mappen

```
public/
  profiles/            schoolprofielen (sophianum.json) + profiel.schema.json
  data/
    werkvormen/        de kennisbank: één JSON per categorie + werkvorm.schema.json
                       index.json wordt automatisch gemaakt door `npm run valideer`
    bronnen.json       alle bronnen waar werkvormen naar verwijzen
    taxonomie.json     Bloom en RTTI, met vraagstammen
  huisstijl/           logo en hoogtelijnenmotief
src/
  main.js              start: profiel laden, huisstijl toepassen, routeren
  pages/               de pagina's (home, bibliotheek, werkvorm, begin hier, visie, invulformulier)
  data/                laden van profiel en kennisbank, leesbare labels
  opslag/              veilige browseropslag (werkt ook als opslag geblokkeerd is)
  stijl/               CSS: lettertypen, basisstijl, printstijl
  engine/              (fase 2) filter- en scorelogica, lessjablonen, splitsplanner
  export/              (fase 3) PDF, Word, PowerPoint, lesbestand
  ai/                  (fase 4) AI-brug en voorbereide API-laag
tools/
  valideer-kennisbank.js   controleert alles en maakt index.json
  maak-preview.js          maakt een preview-versie voor claude.ai
docs/                  handleidingen
```

---

## Het schoolprofiel

Alles wat schoolspecifiek is, staat in `public/profiles/sophianum.json`: naam, motto, visie, pijlers, leidende principes, huisstijlkleuren, afdelingen en lestijden, vakken, lokalen met capaciteit, regels (telefoon, plein), ondersteuningsaanbod, standaard lesmodel en taxonomie, en de gewichten van de generator.

- **De code bevat geen Sophianum-tekst.** Een andere school krijgt een eigen profiel.
- Velden met `"aanname": true` komen **niet** uit het schoolplan of de schoolgids. Het zijn instelbare standaardwaarden, bijvoorbeeld de capaciteit van de stilteruimte (8) en het deelplein (40). Pas ze aan als de werkelijkheid anders is.
- De huisstijlkleuren zijn gemeten in de PDF van de schoolgids 2026-2027.

Een ander profiel bouwen: `UNIEKIND_PROFIEL=naam npm run build` (met `public/profiles/naam.json`).

---

## Privacy en de toegangscode

- Uniekind vraagt **nooit namen van leerlingen**, alleen aantallen. Er gaat niets naar een server.
- Docentprofiel, voorkeuren en concepten worden in de browser (localStorage) bewaard. Als opslag geblokkeerd is, werkt de site gewoon, maar onthoudt hij niets.
- De Sophianum-versie heeft `noindex`, zodat zoekmachines hem niet opnemen.
- **Toegangscode:** in het profiel staat `"toegangscode": null`. Vul je daar een woord in, dan vraagt de site het één keer bij het eerste bezoek. **Dit is een drempel, geen beveiliging**: iedereen kan het woord in de broncode lezen. Zet er dus nooit iets vertrouwelijks achter.

---

## De kennisbank onderhouden

Zie [`docs/onderhoud-kennisbank.md`](docs/onderhoud-kennisbank.md). Kort:

1. Gebruik het **invulformulier** op de site (onderaan: *Werkvorm toevoegen*). Het controleert direct of alles klopt.
2. Plak het item in het juiste bestand in `public/data/werkvormen/`.
3. Draai `npm run valideer`. Groen? Dan is het goed.

**Bronnen:** voeg alleen echte, gecontroleerde bronnen toe aan `public/data/bronnen.json`. Bij twijfel zet je `"status": "nog-controleren"`; de site toont dan "bron nog controleren". Effectgroottes nemen we bewust niet over.

---

## Publiceren

**Netlify** (aanbevolen, omdat de latere API-route serverless functions nodig heeft):
build-commando `npm run build`, publiceermap `dist`.

**GitHub Pages:** bouw met `npm run build` en publiceer de map `dist` (bijvoorbeeld met een GitHub Action).

---

## Fasering

| Fase | Inhoud | Status |
|---|---|---|
| 0 | Plan | klaar |
| 1 | Schoolprofiel, schema's, kennisbank (74 items), validatie, bibliotheek, invulformulier | klaar |
| 2 | Wizard, filter- en scorelogica, lessjablonen 35/50/70/100, splitsplanner, "Waarom deze?" | volgt |
| 3 | Materialen, digibordmodus, export PDF/Word/PowerPoint/lesbestand | volgt |
| 4 | OCR, AI-brug (Copilot), zoeklinks | volgt |
| 5 | Kennisbank naar 150+, pagina's Hulp, Mijn profiel, reflectie | volgt |
| 6 | Testen, toegankelijkheid, publiceren, handleiding, pitch | volgt |
| 7 | Algemene versie met schoolprofiel-wizard | volgt |

---

## De API-route (later, pas na akkoord)

Nu werkt Uniekind zonder AI, of met de **AI-brug**: de site maakt een prompt, de docent plakt die in de AI-tool van de school (Copilot) en plakt het antwoord terug. Een directe koppeling met een taalmodel kan later via een serverless function op Netlify. De API-sleutel staat dan in een omgevingsvariabele en komt nooit in de browser. Er gaan nooit leerlinggegevens mee. Vooraf nodig: akkoord van de school en de functionaris gegevensbescherming van LVO, een verwerkersovereenkomst met de aanbieder, en een afspraak over de kosten. Details volgen in fase 4.
