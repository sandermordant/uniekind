# Testverslag: een rustige lesmaker en alle stof van SLO

**Datum:** 18 november 2026

**Automatische tests: 211 van 211 geslaagd** (`npm test`), waarvan 19 nieuw in `tests/overige-vakken.test.js`. Kennisbank, profielen en 445 kaders geldig (`npm run valideer`).

**Controle in de browser:** `node tools/controleer-site.cjs` op de gebouwde site. Uitkomst: 150 controles, 0 problemen (axe WCAG 2.1 AA, breedte, fouten, externe verbindingen, downloads). Getest op laptop, digibord en telefoon, in licht en donker. Daarnaast met axe op 375 px en op laptop, in licht en donker:
- de werkplek havo met Nederlands en met Spaans;
- *Stof en materiaal* met het ERK opengeklapt;
- de lesmaker met Spaans;
- stap 3 met een Wijzig-paneel open.

Uitkomst: 0 overtredingen, nergens zijwaarts scrollen.

## 1. De lesmaker is rustiger
**Aanleiding.** Sander vond een les "Volledig Uniekind" verwarrend en druk: te veel keuzes tegelijk. Gemeten voor een les van 50 minuten in stand 3:
- stap 3 was 7.087 px hoog, met 37 knoppen, 8 keuzelijsten, 37 labels en 1.689 woorden;
- bovenaan stonden eerst zeven manieren om de klas te verdelen, nog voor de les zelf.

**Keuze van Sander:** rustig in beeld, alles achter *Wijzig*. Er verdwijnt niets.

**Genereren**
- De gekozen variant staat groot.
- De andere twee staan ingeklapt onder *Liever iets anders?*.
- De lange uitleg staat achter *Waarom deze opzet?*.

**Aanpassen**
- Per lesfase zie je de tijd, de naam en per groep wat je doet en wat je zegt. Een groep is bijvoorbeeld "Groep A + Groep B · M-lokaal · bij jou", of "Hele klas".
- De als-dan-tabel bij een check blijft zichtbaar, want die heb je in de les nodig.
- Achter **Wijzig** bij een fase staan:
  - de minuten;
  - eerder en later;
  - *Andere suggestie* en *Ook passend…*;
  - *Zet vast* en *Stappenplan*;
  - de labels en *Waarom deze?*.
- *Zo verdeel je de klas* is één regel. De zeven opties staan achter **Wijzig**.
- De controle is één regel ("Voldoet aan alle 15 eisen"). De volledige lijst klap je open; een eis die niet klopt, staat er altijd los bij.
- *Routines die helpen* is ingeklapt.

**Resultaat** in dezelfde les: 4.902 px hoog, 14 knoppen, geen losse keuzelijsten, 1.101 woorden.

**Werking en toegankelijkheid**
- Een open paneel blijft open als je minuten aanpast of een fase verschuift, en de focus blijft op de knop.
- Elke knop heeft `aria-expanded` en een verborgen label met de naam van de fase.

## 2. Overige vakken
**Aanleiding.** Dertien vakken hadden wel stof op *Stof en materiaal*, maar je kon ze niet kiezen in de lesmaker of de werkplek, omdat ze niet in het schoolprofiel staan. Het gaat om Spaans, Italiaans, Russisch, Turks, Arabisch, Chinees, Fries, NLT, ANW, maatschappijwetenschappen, drama, dans en film.

**Keuze van Sander:** allemaal kiesbaar als *overig vak*, zonder te beweren dat het Sophianum ze aanbiedt.

**Hoe het werkt**
- In `src/data/overige-vakken.js` staan de afdelingen per vak. Ze volgen uit de niveaus van de SLO-kaders; de test controleert dat.
- In elke keuzelijst staan deze vakken in een eigen groep *Overige vakken (alle stof van SLO)*.
- Op de pagina Schoolprofiel en in de download staan ze niet.

**Test:** elk van de 445 kaders hangt nu aan een vak dat je kunt kiezen. Een havo-les Spaans van 50 minuten voldoet aan alle eisen.

## 3. Referentiekader taal en rekenen, en het ERK
**Aanleiding.** Sander vroeg om alle stof van alle vakken. Het importscript las al alles wat SLO publiceert aan kerndoelen, leerdoelenkaarten, examenprogramma's, syllabi en beroepsgerichte programma's. Twee sets ontbraken nog.

**Toegevoegd** via `tools/importeer-slo.js`, uit de open data van SLO (MIT):
- **Referentiekader taal**, bij Nederlands: domeinen, subdomeinen, onderwerpen en deelonderwerpen, met per niveau (1F tot en met 4F) wat een leerling kan. 553 regels.
- **Referentiekader rekenen**, bij wiskunde en rekenen: per domein en onderwerp de doelen op 1F, 1S, 2F en 3F. 577 regels.
- **ERK**, bij alle moderne vreemde talen (Engels, Duits, Frans, Spaans, Italiaans, Russisch, Turks, Arabisch, Chinees): per taalactiviteit en competentie de schalen, met de beschrijvingen van pre-A1 tot en met C2 en tot drie voorbeelden per beschrijving. 1.362 regels.

**Waar je het ziet:** deze kaders zijn een nieuwe soort, *Referentiekader*. Ze staan op de werkplek, op *Stof en materiaal* (met een eigen filter) en bij de eindtermen in de lesmaker. Je kunt een les eraan koppelen.

**Niets verzonnen**
- De niveaus en teksten komen letterlijk uit SLO.
- Er staat niet bij welk niveau bij welke afdeling hoort, want dat zit niet in de data.
- Codes zoals "RKT2.1" zijn van SLO; per niveau staat alleen het niveau zelf als code.

**Controle van het importscript:** opnieuw draaien met de nieuwste SLO-data gaf voor de bestaande 442 kaders precies dezelfde uitkomst; alleen de datum verschilde. Er zijn dus geen bestaande gegevens veranderd. Totaal: 445 kaders in 60 vakken, ruim 26.500 regels (6,9 MB, per vak geladen als je het opent).

## Nachtcontrole
`tools/controleer-site.cjs` klapt nu ook de andere varianten open en opent een Wijzig-paneel. Op de huidige live site, die deze onderdelen nog niet heeft, slaat het die stappen over: 138 controles, 0 problemen.

## Nog te doen
De verbeteringen staan op de werkbranch. Ze komen live zodra ze naar `main` gaan.
