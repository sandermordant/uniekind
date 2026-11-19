# Testverslag: materiaal alleen wat de les nodig heeft, en helemaal invulbaar met AI

**Datum:** 19 november 2026

**Automatische tests: 239 van 239 geslaagd** (`npm test`), waarvan 7 nieuw in `tests/materiaal.test.js` en `tests/aibrug.test.js`. Kennisbank, profielen en kaders geldig (`npm run valideer`).

**Controle in de browser:**
- `node tools/controleer-site.cjs` op de gebouwde site: 150 controles, 0 problemen.
- Stap 4 met axe op laptop en op 375 px, in licht en donker, ook met het AI-paneel open en met *Meer materiaal* opengeklapt. Uitkomst: 0 overtredingen, nergens zijwaarts scrollen.

## Vragen van Sander
- **Worden exit tickets alleen genoemd als ze in de les zitten?** Nee, dat was zo niet. Ze werden altijd gemaakt, en de afsluitdia van de presentatie noemde altijd een exit ticket. Dat is nu opgelost.
- **Blijven de materialen leeg?** Nee. Opbouw, instructies en vragen op drie niveaus vult Uniekind zelf in, uit het lesdoel en de kernbegrippen. Alleen vakinhoud staat als geel invulveld (⟦…⟧). Gemeten in een les met lesdoel en kernbegrippen:
  - zonder AI blijven er velden open, bijvoorbeeld de opgave, de checkvraag en de hintkaarten;
  - met een volledig AI-antwoord blijft er **geen enkel veld** open, in alle 21 documenten.

## Wat er veranderd is (akkoord Sander)
1. **Materiaal alleen als de les het gebruikt.**
   - Exit tickets alleen als de afsluiter een exit ticket is.
   - Hintkaarten bij de werkvorm hintkaarten, of als een werkvorm ze in zijn als-dan-regels voorschrijft (de startcheck doet dat).
   - Opdrachtkaarten alleen als er routes zijn.
   - Ook de teksten elders volgen dit: de routekaarten, het werkblad basis, de pleinafspraken, de kaart voor de onderwijsassistent, het differentiatie-overzicht, de voorbereiding en de antwoordkaart.
   - Een test zoekt in al het materiaal naar "hintkaart" en "exit ticket" als die er niet horen te zijn.
2. **De presentatie volgt de les.** De afsluitdia toont de gekozen afsluiter. Een test leest de dia's uit het .pptx-bestand.
3. **Stap 4: eerst "Nodig voor deze les".** Het differentiatie-overzicht, de kijkwijzer en de reflectie na de les staan ingeklapt onder *Meer materiaal*. *Alles printen*, *Alles als PDF* en *Alles als Word* nemen alleen wat nodig is.
4. **Open velden zichtbaar.**
   - Per document staat in de lijst "3 open"; dezelfde plek op elke kopie telt één keer.
   - Bovenaan staat het totaal, met een knop die *Maak af met AI* opent en de focus erop zet.
   - Bij het geopende document staat hoeveel velden er nog open zijn.
   - Zonder lesdoel of kernbegrippen geeft Uniekind de tip die in te vullen.

## Ook verbeterd: echt helemaal invulbaar met AI
- De AI-opdracht vraagt alleen om wat het materiaal gebruikt. Er worden geen hintkaarten, exit tickets of startcheck gevraagd als ze er niet zijn, en de keuzelijst toont alleen passende pakketten.
- Nieuw onderdeel **LESDOEL**: als de docent geen lesdoel invulde, stelt AI er een voor ("Je kunt …"). Dat lesdoel komt dan in het materiaal.
- Zijn er geen kernbegrippen ingevuld, dan gelden de begrippen uit de vaktaalkaart van AI.
- Test: een les zonder lesdoel en kernbegrippen, met een volledig AI-antwoord, houdt 0 open velden.
- **Nalezen blijft nodig:** AI kan fouten maken. De site zegt dat bij het AI-paneel en in het lesplan.
