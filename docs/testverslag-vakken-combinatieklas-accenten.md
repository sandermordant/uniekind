# Testverslag: vakken volgens de lessentabellen, combinatieklas en sectie-accenten

**Datum:** 19 november 2026

**Automatische tests: 232 van 232 geslaagd** (`npm test`), waarvan 13 nieuw: 8 in `tests/plein.test.js` en 5 in `tests/sectie-accenten.test.js`. Kennisbank, profielen en kaders geldig (`npm run valideer`).

**Controle in de browser:**
- `node tools/controleer-site.cjs` op de gebouwde site: 150 controles, 0 problemen.
- Daarnaast met axe gecontroleerd op laptop en op 375 px, in licht en donker. Uitkomst: 0 overtredingen, nergens zijwaarts scrollen, geen fouten in de console. Gecontroleerd zijn:
  - Mijn profiel, leeg en met een accent;
  - de lesmaker voor havo 1 met *Combinatieklas*;
  - stap 3 met een accent en een combinatieklas;
  - de pagina Schoolprofiel na het inlezen van een accentbestand.

## 1. Vakken volgens de lessentabellen 2025-2026 (akkoord Sander)
**vmbo basis en kader:** alleen de vakken uit de lessentabel. In leerjaar 1-2 zijn dat M&M en M&N in plaats van geschiedenis, aardrijkskunde, natuurkunde en scheikunde; muziek valt onder Kunst en Cultuur. D&P is het enige profielvak. Het algemene "Beroepsgericht profielvak" staat nu bij de overige vakken, als *Andere beroepsgerichte profielvakken (vmbo)*.

Verder:
- Geschiedenis, aardrijkskunde, natuurkunde en scheikunde: mavo, havo en vwo.
- Muziek: havo en vwo.
- Filosofie heet nu *Filosofie en levensbeschouwing*.

**Nieuw**, met de kaders van SLO gekoppeld via `tools/importeer-slo.js`:

| Vak | Afdelingen | SLO-stof |
|---|---|---|
| Wiskunde D | vwo | wiskunde |
| Taal & Rekenen | havo | Nederlands en wiskunde, met de referentiekaders |
| Tekenen | havo, vwo | beeldende vakken |
| Sportoriëntatie | mavo | lichamelijke opvoeding |
| Taal en Cultuur (T&C) | vwo | geen landelijk kader (eigen vak) |
| Mentoruur, studieles en coaching | alle | geen landelijk kader |

Opnieuw importeren gaf dezelfde 445 kaders; alleen de koppeling aan Uniekind-vakken is uitgebreid.

## 2. Combinatieklas: meer gericht op differentiatie
**Keuze van Sander:** geen aparte brugklassen (HM, GAH) in het profiel, wel meer nadruk op differentiatie.

**Hoe het werkt**
- In leerjaar 1 en 2 vraagt de lesmaker *Combinatieklas?* (ja/nee). Bij vmbo-MiX staat het standaard op ja.
- **De verdeling:** als je die niet weet, schat Uniekind hem breder: 30% steun en 30% verdieping, in plaats van 25% en 20%.
- **De werkvormen:** werkvormen die op niveau differentiëren, krijgen een kleine plus.
- **De tip:** iedereen werkt aan hetzelfde lesdoel op het niveau dat past. De routes volgen wat leerlingen in deze les nodig hebben, niet hun advies, en wisselen na de check mag.

**Gevonden en opgelost tijdens het testen:** door de bredere verdeling vond de eigenschapstest (600 willekeurige lessen) drie lessen met 10 leerlingen in een stilteruimte van 8. De oorzaak zat al in de code: bij de opzet *routes* ging de verdiepingsgroep naar het plein of de stilteruimte zonder te kijken of die groep daar past. Nu kiest Uniekind alleen een ruimte waar de groep in past, en anders het lokaal (`verdiepingPlek` in `src/engine/opbouw.js`). Er is een aparte test voor dit geval.

## 3. Sectie-accenten door collega's (optioneel)
**Keuze van Sander:** collega's vullen het zelf in, en het is niet verplicht.

**Hoe het werkt**
- In *Mijn profiel* staat het blok *Accenten van je sectie (optioneel)*. Per vak kies je het lesmodel, de taxonomie, de werkvorm van de maand en de methodewebsite.
- Het staat alleen in de eigen browser en geldt meteen voor je eigen lessen. Wat je zelf invult gaat voor; wat de school heeft ingesteld vult aan.
- *Bestand voor de beheerder* maakt een klein JSON-bestand, met alleen accenten per vak en nooit leerlinggegevens.
- De beheerder leest het in op de pagina Schoolprofiel (*Sectie-accenten van een collega inlezen*). Dat wordt per vak en per veld samengevoegd; daarna downloadt de beheerder het profiel.
- Alles wordt opgeschoond: alleen bekende lesmodellen, links alleen met http(s), alleen vakken van de school.

**Getest:**
- een accent invullen, bewaren en downloaden;
- de les volgt het lesmodel (EDI) en de werkvorm van de maand (wisbordjes);
- het inlezen op Schoolprofiel zet het lesmodel van wiskunde op EDI;
- zonder accent werkt alles zoals voorheen.

## 4. Aanvulling: bronnen nagetrokken (19 november)
Van de zes bronnen met de status "nog controleren" zijn er vijf online nagekeken en op `gecontroleerd` gezet (`public/data/bronnen.json`):

| Bron | Gevonden | Aangepast |
|---|---|---|
| EEF, *Metacognition and Self-Regulated Learning* | eerste editie 2018, tweede editie 2025 | "herziene versie 2021" klopte niet; link naar de EEF-pagina |
| Aronson & Patnoe, *Cooperation in the Classroom: The Jigsaw Method* (3e druk) | Pinter & Martin, Londen, 2011 | ISBN 978-1-905177-22-6 |
| Ebbens & Ettekoven, *Effectief leren. Basisboek* | 4e druk, Noordhoff, 2015 | jaar 2013 werd 2015; ISBN 978-90-01-87312-7; 5e druk (2020) heet "De docent als regisseur" |
| Naylor & Keogh, *Concept Cartoons in Science Education* | Millgate House, 2000 | ISBN 978-0-9527506-2-8 |
| Daly-Smith e.a., systematische review bewegend leren | BMJ Open Sport & Exercise Medicine 4(1), e000341, 2018 | DOI 10.1136/bmjsem-2018-000341 |

**IGDI** blijft op "nog controleren". Online is geen eenduidige oorspronkelijke bron te vinden, en Uniekind verzint er geen. Weet Sander of een collega de bron die de school gebruikt, dan kan die erin.

`npm run valideer` meldt nu nog één bron om te controleren (igdi-slo).

Daarnaast staat een concept voor een mail aan collega's om proef te draaien in `docs/mail-proefdraaien.md`.
