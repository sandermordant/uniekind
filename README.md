# Uniekind

**Lessen op maat, al was het maar voor één kind.**

Uniekind helpt docenten gedifferentieerde lessen te ontwerpen. De docent geeft aan wat hij wil behandelen en in welke situatie. Uniekind kiest uit een kennisbank de best passende werkvormen en levert een complete les met materiaal.

De eerste versie is gemaakt voor **Sophianum** (Gulpen). Later volgt een **algemene versie**, waarin elke school haar eigen visie, lokalen en lestijden instelt. Beide versies gebruiken dezelfde code; het verschil zit alleen in het schoolprofiel.

> Status: **fase 5 (kennisbank en eigen ervaring)**. Kennisbank met 160 werkvormen (41 openers), de pagina's Hulp en Mijn profiel, reflectie na de les en "Jouw werkvormen die werken".

> Eerder: **fase 4 (slim invoeren)**. Foto van een paragraaf herkennen (lokaal), AI-brug met Copilot-prompt en import, bronnen- en zoeklinks.
>
> Eerder: **fase 3 (materiaal en export)**. Bovenop fase 2: het complete materiaalpakket, digibordmodus, export naar PDF, Word en PowerPoint, lesbestand en Les openen.
>
> Eerder: **fase 2 (generator)**. Schoolprofiel, kennisbank (74 werkvormen), bibliotheek en invulformulier (fase 1), plus de lesgenerator: wizard in 7 stappen of snel, filter- en scorelogica, lessjablonen, splitsplanner, "Waarom deze?" en aanpassen (fase 2). Materiaal en export volgen in fase 3.

---

## Snel starten

Je hebt [Node.js](https://nodejs.org) versie 20 of hoger nodig.

```bash
npm install          # eenmalig
npm run dev          # ontwikkelserver op http://localhost:5173
npm run valideer     # controleer de kennisbank en de profielen
npm run build        # bouw de website in dist/ (valideert eerst)
npm test             # draai de tests van de generator (testcases, 600 willekeurige lessen)
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
  pages/               de pagina's (home, bibliotheek, werkvorm, begin hier, visie, invulformulier, les maken, les openen, digibord, hulp, mijn profiel)
  data/                laden van profiel en kennisbank, leesbare labels
  opslag/              veilige browseropslag (werkt ook als opslag geblokkeerd is)
  stijl/               CSS: lettertypen, basisstijl, printstijl
  engine/              de generator: context, filters, score, sjablonen, splitsplanner, opbouw, controle, uitleg
  wizard/              de stappen van de lesgenerator en de weergave van het lesplan
  materiaal/           documentmodel, materiaalgenerator, HTML-weergave
  export/              PDF (pdfmake), Word (docx), PowerPoint (PptxGenJS), lesbestand (.uniekind)
  ai/                  AI-brug: uitwisselformaat, prompt, import, adapter (API voorbereid)
  ocr/                 foto van een paragraaf herkennen (Tesseract.js, lokaal)
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

## Materiaal en export

Alle materiaal wordt eerst beschreven in één **documentmodel** (`src/materiaal/model.js`): koppen, alinea's, tabellen, vragen met schrijfregels, invulvelden, kaarten, schema's. Uit dat ene model maakt Uniekind de weergave op het scherm, de printversie, PDF en Word. Een nieuw werkblad hoef je dus maar één keer te maken.

- `src/materiaal/maak.js` bepaalt welk materiaal bij een les hoort en hoeveel je van elk moet printen.
- Velden die de docent zelf moet invullen staan tussen ⟦ en ⟧ en worden overal geel gemarkeerd.
- De exportbibliotheken laden pas als je exporteert, zodat de site snel blijft.
- De digibordmodus (`src/pages/digibord.js`) werkt met het toetsenbord: ← → fase, spatie timer, 1 2 3 geluidsniveau, R routeschema, K kiezer, G groepjes, F volledig scherm, Esc terug. Namen in de groepjesmaker worden nergens bewaard.

## Foto van een paragraaf (OCR)

De herkenning draait volledig in de browser met Tesseract.js en het Nederlandse taalpakket. `tools/kopieer-ocr.js` zet de benodigde bestanden (worker, rekenkern, taalpakket; samen ongeveer 11 MB) bij het bouwen in `public/ocr/`, zodat de site niets van een andere server hoeft te halen. De foto verlaat de computer niet en wordt niet bewaard; alleen het taalpakket blijft in de cache van de browser. Na herkenning haalt Uniekind de lesdoelen (patronen als "Leerdoelen", "Je kunt…") en kernbegrippen uit de tekst; de docent controleert en verbetert.

## De AI-brug

Bij het materiaal staat **Maak af met AI**. Uniekind maakt een prompt met alleen lesinhoud (vak, niveau, lesdoelen, kernbegrippen, de tekst, de werkvormen) en vraagt het antwoord in vaste blokken (`### VRAGEN-BASIS`, `### HINTKAART-1`, …; zie `src/ai/formaat.js`). De docent plakt de prompt in de AI-tool van de school, plakt het antwoord terug, en Uniekind zet herkende blokken in de juiste sjablonen. Wat niet herkend wordt, toont Uniekind apart. Er zijn ook kleine prompts per materiaalsoort.

- `src/ai/prompt.js` controleert dat er geen klasgegevens in de prompt staan.
- `src/ai/import.js` leest ook markdown, vetgedrukte koppen en JSON.
- De API-route is voorbereid maar staat uit; zie [`docs/api-route.md`](docs/api-route.md).

## Bronnen en media

Per les maakt Uniekind zoeklinks met het onderwerp (Schooltv, Wikiwijs, Kennisnet, YouTube, Jeugdjournaal, L1 en de methodewebsite van de sectie) en toont het een gecureerde lijst per vak uit `public/data/bronnen-per-vak.json`. Een link komt pas in het lesplan als de docent hem aanvinkt of zelf toevoegt. Secties stellen nieuwe bronnen voor via een formuliertje dat een stukje tekst voor de beheerder maakt.

## Hoe de generator werkt

De generator (`src/engine/`) is deterministisch: dezelfde invoer geeft dezelfde les.

1. **Context** (`context.js`): de invoer wordt aangevuld met standaardwaarden uit het schoolprofiel (lesduur, capaciteit, plein, stilteruimte).
2. **Sjabloon** (`sjablonen.js`): de lesopbouw met uitgewerkte tijden voor 35, 50, 70 en 100 minuten; een vrije lesduur wordt geschaald. In een M-lokaal is instructie maximaal 15 minuten aaneen, en geen fase duurt langer dan 25 minuten.
3. **Splitsplanner** (`splitsplanner.js`): bij meer leerlingen dan het lokaal bergt (of bij stand 3) kiest Uniekind een opzet: gespreide start, startcheck, carrousel, flipped start, met onderwijsassistent of stilteruimte.
4. **Harde filters** (`filters.js`): tijd, ruimte, telefoon (nooit), laptops, assistent, plein, instapniveau.
5. **Score** (`score.js`): denkniveau, lesfase en plek in de reeks, een vakvoorbeeld uit het eigen vak, docentprofiel, klas, schoolvisie, variatie (werkvormen uit je vorige twee lessen van dit vak krijgen een min), eigen ervaring (duimen uit je reflecties) en een kleine vaste afwisseling bij openers, energizers en afsluiters (op basis van onderwerp en vak, zodat niet elke les met dezelfde opener begint). De gewichten staan in het schoolprofiel (`generator.gewichten`).
6. **Controle** (`controle.js`): veertien harde eisen, zichtbaar als checklist in de les.
7. **Uitleg** (`uitleg.js`): bij elke werkvorm "Waarom deze?" en bij de les twee zinnen waarom deze opzet past.

## Privacy en de toegangscode

- Uniekind vraagt **nooit namen van leerlingen**, alleen aantallen. Er gaat niets naar een server.
- Docentprofiel, voorkeuren en concepten worden in de browser (localStorage) bewaard. Als opslag geblokkeerd is, werkt de site gewoon, maar onthoudt hij niets.
- **Mijn lessen** (`src/opslag/logboek.js`, sleutel `uniekind:lessen`): per les alleen datum, onderwerp, vak, afdeling, lesduur, stand, opzet, de werkvormen en de reflectie van de docent (duim per werkvorm, twee korte teksten). Hooguit 40 lessen. De duimen gaan als `uniekind:duimen` naar de generator. In Mijn profiel kan de docent alles downloaden, inlezen op een andere laptop en wissen.
- Een **lesbestand** bewaart de gekozen werkvorm per blok, zodat een les op een andere computer hetzelfde opent, ook als daar andere reflecties staan.
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
| 2 | Wizard, filter- en scorelogica, lessjablonen 35/50/70/100, splitsplanner, "Waarom deze?" | klaar (zie docs/testverslag-fase2.md) |
| 3 | Materialen, digibordmodus, export PDF/Word/PowerPoint/lesbestand | klaar (zie docs/testverslag-fase3.md) |
| 4 | OCR, AI-brug (Copilot), zoeklinks | klaar (zie docs/testverslag-fase4.md) |
| 5 | Kennisbank naar 150+ (160, waarvan 41 openers), pagina's Hulp en Mijn profiel, reflectie na de les | klaar (zie docs/testverslag-fase5.md) |
| 6 | Testen, toegankelijkheid, publiceren, handleiding, pitch | volgt |
| 7 | Algemene versie met schoolprofiel-wizard | volgt |

---

## De API-route (later, pas na akkoord)

Nu werkt Uniekind zonder AI, of met de **AI-brug**: de site maakt een prompt, de docent plakt die in de AI-tool van de school (Copilot) en plakt het antwoord terug. Een directe koppeling met een taalmodel kan later via een serverless function op Netlify. De API-sleutel staat dan in een omgevingsvariabele en komt nooit in de browser. Er gaan nooit leerlinggegevens mee. Vooraf nodig: akkoord van de school en de functionaris gegevensbescherming van LVO, een verwerkersovereenkomst met de aanbieder, en een afspraak over de kosten. Details volgen in fase 4.
