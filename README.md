# Uniekind

**Lessen op maat, al was het maar voor één kind.**

Uniekind helpt docenten gedifferentieerde lessen te ontwerpen. De docent geeft aan wat er behandeld wordt en in welke situatie. Uniekind kiest uit een kennisbank van 164 werkvormen de best passende vormen en levert een complete les met al het materiaal, klaar om te geven.

> *Je hoeft niet opnieuw te leren lesgeven. Uniekind begint bij hoe jij nu lesgeeft en helpt je stap voor stap verder, met materiaal dat al klaarligt.*

Er zijn **twee versies, één codebasis**:

| Versie | Profiel | Map na het bouwen | Adres na publiceren |
|---|---|---|---|
| **Uniekind Sophianum** (Gulpen), "Lessen op maat, al was het maar voor één kind" | `public/profiles/sophianum.json` | `dist/` | `/` |
| **Uniekind algemeen**, "De lesgenerator voor gedifferentieerd lesgeven", met schoolprofiel-wizard | `public/profiles/voorbeeld-algemeen.json` | `dist-voorbeeld-algemeen/` | `/algemeen/` |

> Status: **klaar (fase 0 tot en met 7)**. Zie [`docs/testverslag-fase6-7.md`](docs/testverslag-fase6-7.md) voor de eindcontrole, [`docs/handleiding-collegas.md`](docs/handleiding-collegas.md) voor de handleiding van één pagina en [`docs/pitch-schoolleiding.md`](docs/pitch-schoolleiding.md) voor de pitch.

---

## Snel starten

Je hebt [Node.js](https://nodejs.org) versie 20 of hoger nodig.

```bash
npm install          # eenmalig
npm run dev          # ontwikkelserver op http://localhost:5173
npm run valideer     # controleer de kennisbank en de profielen
npm run dev:algemeen # hetzelfde voor de algemene versie
npm test             # alle tests: testcases 1-9, 900 willekeurige lessen, materiaal, export, OCR, AI-brug
npm run build:alles  # bouw beide versies (valideert eerst)
npm run site         # bouw beide en zet ze samen in site/ (Sophianum op /, algemeen op /algemeen/)
```

De map `site/` is de complete website. Er is geen server nodig; zie *Publiceren* hieronder.

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
  profiles/            schoolprofielen (sophianum.json, voorbeeld-algemeen.json) + profiel.schema.json
  data/
    werkvormen/        de kennisbank: één JSON per categorie + werkvorm.schema.json
                       index.json wordt automatisch gemaakt door `npm run valideer`
    bronnen.json       alle bronnen waar werkvormen naar verwijzen
    taxonomie.json     Bloom en RTTI, met vraagstammen
  huisstijl/           logo en hoogtelijnenmotief (sophianum/), neutraal motief (algemeen/)
src/
  main.js              start: profiel laden, huisstijl toepassen, routeren
  pages/               de pagina's (home, bibliotheek, werkvorm, begin hier, visie, invulformulier, les maken, les openen,
                       digibord, hulp, privacy, mijn profiel, schoolprofiel)
  data/                laden en opschonen van profielen, kennisbank, leesbare labels, ruimtenamen (termen.js)
  opslag/              veilige browseropslag en Mijn lessen (logboek.js)
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
  maak-site.js             zet beide versies samen in site/
  kopieer-ocr.js           zet de OCR-bestanden klaar in public/ocr/
docs/                  handleiding collega's, pitch, onderhoud kennisbank, API-route, testverslagen
netlify.toml           publiceren op Netlify
.github/workflows/     publiceren op GitHub Pages
```

---

## Het schoolprofiel

Alles wat schoolspecifiek is, staat in `public/profiles/sophianum.json`: naam, motto, visie, pijlers, leidende principes, huisstijlkleuren, afdelingen en lestijden, vakken, lokalen met capaciteit, regels (telefoon, plein), ondersteuningsaanbod, standaard lesmodel en taxonomie, en de gewichten van de generator.

- **De code bevat geen Sophianum-tekst.** Een andere school krijgt een eigen profiel.
- Velden met `"aanname": true` komen **niet** uit het schoolplan of de schoolgids. Het zijn instelbare standaardwaarden, bijvoorbeeld de capaciteit van de stilteruimte (8) en het deelplein (40). Pas ze aan als de werkelijkheid anders is.
- De huisstijlkleuren zijn gemeten in de PDF van de schoolgids 2026-2027.

**Drie lagen.** Uniekind combineert de school (visie en regels in het profiel), de sectie (accenten per vak: lesmodel, taxonomie, methodewebsite, werkvorm van de maand; `sectieAccenten.perVak`) en de docent (eigen stijl en kracht, in de browser). Een sectie-accent geldt zolang de docent zelf de schoolstandaard laat staan.

**De visie stuurt de generator.** `generator.visieAccenten` bepaalt welke werkvormen een visiebonus krijgen (bijvoorbeeld samenwerkend leren, eigenaarschap, formatief handelen, burgerschap; zie `VISIE_ACCENTEN` in `src/engine/score.js`). De ruimtenamen in alle teksten komen uit het profiel (`src/data/termen.js`), zodat een andere school "leerplein" of "studiezaal" ziet.

### De algemene versie en de schoolprofiel-wizard

Op de pagina **Schoolprofiel** stelt een school in: naam, motto, logo en kleuren; visie in eigen woorden plus de principes die de gewichten bepalen; lokalen met eigen namen en capaciteit (ook "dit hebben wij niet"); afdelingen en lestijden; vakken en sectie-accenten; regels (telefoon, laptop, plein-toezicht); taxonomie en lesmodel; terminologie (sectie/vakgroep, mentor/coach); regio-onderwerpen; AI-tool; toegangscode.

Het resultaat is een JSON-bestand dat de school downloadt, deelt en weer inleest. In de algemene versie kan de school het profiel ook:
- **in de eigen browser gebruiken** (knop *Gebruik dit profiel*);
- **als deellink versturen**: het profiel zit gecomprimeerd in de link (`?profiel=…`), er hoeft niets op een server te staan;
- **op de website zetten**: bestand in `public/profiles/naam.json`, dan werkt `…/algemeen/?school=naam` als vaste link.

Alles wat van buiten komt, wordt opgeschoond (`src/data/profiel.js`): kleuren alleen als `#rrggbb`, logo alleen als afbeelding, links alleen `https`, ontbrekende delen aangevuld. In de Sophianum-versie toont de pagina alleen *Profiel downloaden*, voor de beheerder.

Een ander profiel bouwen als eigen site: `UNIEKIND_PROFIEL=naam npm run build` (met `public/profiles/naam.json`).

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
- De pagina **Privacy** legt dit in gewone taal uit.
- **Toegangscode:** in het profiel staat `"toegangscode": null`. Vul je daar een woord in, dan vraagt de site het één keer bij het eerste bezoek. **Dit is een drempel, geen beveiliging**: iedereen kan het woord in de broncode lezen. Zet er dus nooit iets vertrouwelijks achter.

---

## De kennisbank onderhouden

Zie [`docs/onderhoud-kennisbank.md`](docs/onderhoud-kennisbank.md). Kort:

1. Gebruik het **invulformulier** op de site (onderaan: *Werkvorm toevoegen*). Het controleert direct of alles klopt.
2. Plak het item in het juiste bestand in `public/data/werkvormen/`.
3. Draai `npm run valideer`. Groen? Dan is het goed.

**Bronnen:** voeg alleen echte, gecontroleerde bronnen toe aan `public/data/bronnen.json`. Bij twijfel zet je `"status": "nog-controleren"`; de site toont dan "bron nog controleren". Effectgroottes nemen we bewust niet over.

---

## Toegankelijkheid

Gecontroleerd met axe-core op WCAG 2.1 A en AA: alle pagina's en alle wizardstappen, in licht en donker thema, voor beide versies: geen overtredingen. Verder handmatig: alles met het toetsenbord te bedienen (knop *Naar de inhoud*, zichtbare focusrand), digibord op 1920×1080 met opdrachten in 88 px, telefoon (375 px) zonder horizontaal scrollen, en een printvoorbeeld van alle 19 materiaalsoorten. Zie het testverslag.

---

## Publiceren

Beide manieren zijn gratis en hebben geen server nodig. De site staat daarna op `/` (Sophianum) en `/algemeen/` (algemene versie).

**Netlify** (aanbevolen, omdat de latere API-route serverless functions nodig heeft)
1. Zet deze map in een (privé) GitHub-repository.
2. Maak een gratis account op netlify.com → *Add new site* → *Import an existing project* → kies de repository.
3. Netlify leest `netlify.toml`: bouwcommando `npm run site`, publiceermap `site`. Klik op *Deploy*.
4. Eventueel: *Domain settings* voor een eigen adres, bijvoorbeeld uniekind.sophianum.nl (dan moet de ICT-afdeling een DNS-regel toevoegen).

Zonder GitHub kan het ook: draai `npm run site` en sleep de map `site/` naar app.netlify.com/drop.

**GitHub Pages**
1. Zet deze map in een GitHub-repository (Pages werkt gratis met een publieke repository).
2. *Settings → Pages → Source: GitHub Actions*.
3. Push naar `main`. De workflow `.github/workflows/pages.yml` draait de tests, bouwt beide versies en publiceert.

`netlify.toml` zet ook veilige headers en `X-Robots-Tag: noindex` voor de Sophianum-versie.

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
| 6 | Alle tests, toegankelijkheid, publicatie klaarzetten, README, handleiding, pitch, plus wat bij de eindcontrole nog ontbrak (privacypagina, toegangscode, sectie-accenten, vier werkvormen) | klaar (zie docs/testverslag-fase6-7.md) |
| 7 | Algemene versie: voorbeeldprofiel, neutrale huisstijl, schoolprofiel-wizard, profiel via bestand, link of `?school=` | klaar (zie docs/testverslag-fase6-7.md) |

---

## De API-route (later, pas na akkoord)

Nu werkt Uniekind zonder AI, of met de **AI-brug**: de site maakt een prompt, de docent plakt die in de AI-tool van de school (Copilot) en plakt het antwoord terug. Een directe koppeling met een taalmodel kan later via een serverless function op Netlify. De API-sleutel staat dan in een omgevingsvariabele en komt nooit in de browser. Er gaan nooit leerlinggegevens mee; alleen lesinhoud, in dezelfde vaste uitvoerformaten als de AI-brug. Met een limiet per gebruiker per dag, een maandbudget en logging zonder persoonsgegevens. Vooraf nodig: akkoord van de school en de functionaris gegevensbescherming van LVO, een verwerkersovereenkomst met de aanbieder, en een afspraak over wie betaalt. Zie [`docs/api-route.md`](docs/api-route.md) en `netlify/functions/uniekind-ai.voorbeeld.js`.

---

## Wat later nog beter kan (roadmap)

Niet gebouwd, maar de opzet blokkeert het niet:

- **Lessenreeks-planner**: 3 tot 6 lessen plannen met gespreide herhaling. Het logboek in Mijn profiel en de variatie tussen lessen zijn er al.
- **Gedeelde lesbank per sectie**, met inloggen via het schoolaccount; pas zinvol na de pilot. Lesbestanden kun je nu al delen.
- **Koppeling met PTO en PTA**: lesdoelen koppelen aan toetsdoelen van de sectie.
- **Leerlingfeedback**: een korte, anonieme vraag aan het eind van de les over hoe de route beviel.
- **Docentontwikkeling**: een groeipad op basis van Mijn lessen ("je deed 3 keer een instructietafel, probeer eens een carrousel").
- **PLG-modus**: de werkvorm van de maand staat al in de sectie-accenten; een bespreekkaart erbij is de volgende stap.
- **Regionale contextbank** per vak, aansluitend op de regio-onderwerpen in het profiel.
- **Meertaligheid**: Duitstalige of Engelstalige materialen.
- **API-route**: volledig automatische inhoud, na akkoord.
- **Effectonderzoek** met de pilotdocenten, meegenomen in de interne review.
