# De API-route (later, pas na akkoord)

Nu werkt Uniekind **zonder AI** (sjablonen met gemarkeerde invulvelden) of met de **AI-brug**: de site maakt een prompt, de docent plakt die in de AI-tool van de school en plakt het antwoord terug. Een directe koppeling met een taalmodel is voorbereid, maar staat uit.

## Hoe het straks werkt

1. De docent klikt op **Vul automatisch aan**.
2. De browser stuurt alleen de prompt naar een eigen serverfunctie (`netlify/functions/uniekind-ai.js`). In de prompt staat lesinhoud: vak, niveau, lesdoelen, kernbegrippen, de tekst van de paragraaf en de werkvormen. **Nooit** klasgegevens of namen; `src/ai/prompt.js` controleert dat.
3. De serverfunctie roept het taalmodel aan met een API-sleutel uit een omgevingsvariabele. De sleutel komt nooit in de browser.
4. Het antwoord heeft hetzelfde formaat als bij de AI-brug (`### NAAM`-blokken) en gaat door dezelfde import (`src/ai/import.js`). De sjablonen veranderen dus niet.

## Waarborgen in de functie

- Inloggen met het schoolaccount (zodat er een limiet per persoon kan zijn).
- Een limiet per gebruiker per dag (`AI_LIMIET_PER_DAG`) en een maandbudget.
- Logging zonder persoonsgegevens: alleen datum, aantal tekens en duur.
- Een maximumlengte voor de prompt.

## Wat er vooraf nodig is

- Akkoord van de schoolleiding en de functionaris gegevensbescherming (FG) van Stichting LVO.
- Een verwerkersovereenkomst met de aanbieder van het taalmodel.
- Een afspraak over wie de kosten betaalt, en een budget.
- Een keuze voor de aanbieder en het model.

## Aanzetten

1. Hernoem `netlify/functions/uniekind-ai.voorbeeld.js` naar `uniekind-ai.js` en bouw de aanroep van het taalmodel en de limieten in.
2. Zet in Netlify de omgevingsvariabelen `AI_API_SLEUTEL` en `AI_LIMIET_PER_DAG`.
3. Zet in het schoolprofiel: `"ai": { "apiBeschikbaar": true, "apiAdres": "/.netlify/functions/uniekind-ai" }`.
