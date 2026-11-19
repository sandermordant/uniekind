# Testverslag: schoolprofiel gecontroleerd met de lessentabellen en Sanders antwoorden

**Datum:** 19 november 2026

**Automatische tests: 219 van 219 geslaagd** (`npm test`), waarvan 6 nieuw in `tests/plein.test.js`. Kennisbank, profielen en kaders geldig (`npm run valideer`).

**Controle in de browser:** `node tools/controleer-site.cjs` op de gebouwde site gaf 150 controles en 0 problemen. Daarnaast met axe op laptop en op 375 px gecontroleerd: de pagina Schoolprofiel met de nieuwe keuzes, Hulp en stap 3 van een havo-les. Uitkomst: 0 overtredingen, nergens zijwaarts scrollen.

## Wat online staat en is gebruikt
Op sophianum.nl (Downloads) staan onder meer:
- de lessentabellen 2025-2026 per kolom;
- de PTA's 2026/2027;
- de schoolgids 2026-2027;
- het schoolondersteuningsprofiel 2025-2026;
- het beleidsdocument onderwijstijd.

Dit volgt eruit:

| Onderwerp | Bron | In Uniekind |
|---|---|---|
| Latijn en Grieks (alleen gymnasium) | lessentabel vwo | bevestigd, aanname eraf |
| Bedrijfseconomie (havo 4-5, vwo 4-6) | lessentabellen havo en vwo | bevestigd, aanname eraf |
| Informatica | staat niet in de lessentabellen havo en vwo | uit het profiel; stof bij de overige vakken (akkoord Sander) |
| Telefoon "Thuis of in de kluis", locker | schoolgids 2026-2027 | klopte al |
| Leerplein alleen met (school)laptop, toezicht docent of onderwijsassistent | schoolgids 2026-2027 | klopte al |
| Stilteruimte bestaat | schoolondersteuningsprofiel | klopte al; het aantal plekken (8) blijft een aanname |
| Lessen van 35 minuten op vmbo en mavo | lessentabellen | klopte al (70 of 35 minuten) |
| O&O (Technasium) op havo en vwo, T&T op mavo | lessentabellen | klopte al |

## Antwoorden van Sander, verwerkt
- **Plein:**
  - in een M-lokaal passen 26 leerlingen (stond er al);
  - leerplein: 36 plekken (was 40 als aanname);
  - de docent houdt toezicht vanuit het M-lokaal;
  - bij vmbo en vwo grenst het plein met ramen aan het lokaal; bij mavo en havo is het zicht beperkt;
  - onderwijsassistenten zijn er niet altijd.
  - **Nieuw** in het profiel: `regels.pleinZichtPerKolom`. Bij "beperkt" en zonder onderwijsassistent blijft het plein mogelijk, en staat er in de les een tip over toezicht: de zelfstandigste groep op het plein, vooraf afspreken waar ze zitten, er tussendoor even langslopen. De Hulp-pagina zegt het ook. Op de pagina Schoolprofiel is het per kolom in te stellen.
- **Lesduur havo en vwo:** 50 minuten, blokuur 100. Bevestigd.
- **AI-tool:** waarschijnlijk Copilot met het schoolaccount. De aanname blijft staan, met die toelichting.
- **Toegangscode:** advies om er geen te gebruiken; die blijft dus uit. Er staat niets vertrouwelijks op de site, en een code is alleen een drempel: iedereen kan hem in de broncode lezen.
- **Sectie-accenten:** onbekend. Het idee is dat collega's ze zelf invullen; dat is nog niet gebouwd.

## Ook bijgewerkt
De README zegt bij Publiceren nu dat GitHub Pages in gebruik is, en dat Netlify pas nodig is bij de API-route.

## Nog open (voorgelegd aan Sander)
1. Volgens de lessentabel hebben vmbo basis en kader een kleiner vakkenpakket dan het profiel toont, met D&P als enige beroepsgerichte profielvak. Moeten de vakken per afdeling worden ingeperkt?
2. Moeten de vakken uit de lessentabellen die nog ontbreken erbij? Het gaat om Taal en Cultuur (vwo 3), Wiskunde D, Tekenen, Sportoriëntatie (mavo 4), Taal & Rekenen (havo) en studieles, mentoruur en coaching.
3. Moet er iets komen voor de gemengde brugklassen HM1-2 en GAH1-2?
4. Moeten collega's de sectie-accenten zelf kunnen invullen?
