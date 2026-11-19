# Testverslag: combinatieklas met twee lagen (bijvoorbeeld GA4 en GA5)

**Datum:** 19 november 2026

**Automatische tests: 250 van 250 geslaagd** (`npm test`), waarvan 11 nieuw in `tests/lagen.test.js`. Kennisbank, profielen en kaders geldig (`npm run valideer`).

**Controle in de browser:**
- `node tools/controleer-site.cjs` op de gebouwde site: 150 controles, 0 problemen.
- De hele flow met twee lagen, met axe op laptop en op 375 px, in licht en donker: stap 1 met de tweede laag, stap 2, stap 3, en stap 4 met de AI-opdracht voor laag B. Uitkomst: 0 overtredingen, nergens zijwaarts scrollen, geen fouten in de console.

## Vraag van Sander
Een combinatieklas, bijvoorbeeld GA4 met GA5, waarin je per laag een onderwerp en lesdoelen kunt plaatsen, en materiaal per laag krijgt.

## Wat er gebouwd is
1. **Klascodes uit de lessentabellen.** Bij het leerjaar staat nu bijvoorbeeld "vwo atheneum 4 (GA4)", "havo 4 (H4)" en "vwo gymnasium 1 (GAH1)". Voor vmbo en mavo zijn geen codes bekend; die zijn niet verzonnen.
2. **Invoer.**
   - *Combinatieklas?* staat nu bij elk leerjaar.
   - Bij *Ja* kun je een tweede laag opgeven: afdeling, leerjaar (standaard het leerjaar erboven, dus GA4 met GA5), aantal leerlingen (standaard de helft), onderwerp (leeg = hetzelfde) en één of twee lesdoelen.
   - De klas bovenaan is laag 1.
3. **De les: opzet "Twee lagen".**
   - Laag 1 krijgt eerst lesdoel, instructie en check bij jou; laag 2 begint zelfstandig.
   - Daarna wisselen ze: laag 2 krijgt het eigen lesdoel, de instructie en de check.
   - Daarna verwerken beide lagen, en ze sluiten samen af.
   - Past de klas niet in het lokaal, dan werkt de wachtende laag op het plein, ook bij de afsluiting. Nooit boven de capaciteit.
   - Alle lesregels worden gehaald. Getest: L-lokaal 28/50 min, M-lokaal 24/50 min, M-lokaal 30/100 min, L-lokaal 30/100 min, en havo/mavo.
4. **Lesplan (stap 3):** bij elk lesdoelmoment staat het onderwerp en lesdoel van die laag.
5. **Materiaal per laag.**
   - Elke laag krijgt eigen werkbladen (steun, basis, verdieping), hintkaarten, succescriteria, exit tickets (als de les die gebruikt), een vaktaalkaart en een antwoordkaart, elk met het eigen onderwerp en lesdoel. De aantallen tellen per laag op.
   - In stap 4 staan ze per laag gegroepeerd.
   - Opdrachtkaarten en vandaagkaarten noemen het lesdoel van de eigen laag.
6. **AI per laag.** In *Maak af met AI* kies je de laag. De opdracht gaat dan over het onderwerp, lesdoel en leerjaar van die laag, en het antwoord vult alleen het materiaal van die laag. Doe dit voor elke laag.
7. **Presentatie:** elke dia toont het lesdoel (en de AI-checkvraag) van de laag die op dat moment instructie krijgt. De titeldia noemt beide lagen.
8. **Lesbestand:** *Combinatieklas*, de tweede laag en het AI-materiaal van laag 2 gaan mee. Dat *Combinatieklas* niet in het lesbestand stond, was een fout die er al zat.

## Antwoord op de vraag over materiaal kiezen
Je hoeft niets aan te kruisen. Uniekind maakt alleen het materiaal dat je les gebruikt; *Alles printen*, *PDF* en *Word* nemen dat. Een los document print of download je via *Dit document als PDF/Word*.
