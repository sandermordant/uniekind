# De kennisbank onderhouden

De kennisbank is het hart van Uniekind. Je hoeft geen programmeur te zijn om er iets aan toe te voegen.

## Een werkvorm toevoegen

1. Open de site en klik onderaan op **Werkvorm toevoegen**.
2. Vul het formulier in. Het staat ingevuld met een voorbeeld; klik op *Begin met een leeg formulier* om opnieuw te beginnen.
3. Onderaan zie je direct of alles klopt. Groen betekent: compleet.
4. Klik op **Kopieer JSON** (of download het bestand) en stuur het naar de beheerder.

De beheerder plakt het item in het juiste bestand in `public/data/werkvormen/` (bijvoorbeeld `activerend.json` voor een activerende werkvorm), tussen de andere items, en draait:

```bash
npm run valideer
```

## Waar let je op?

- **Stappen:** schrijf ze zo dat een collega die de werkvorm nooit heeft gedaan, hem morgen kan uitvoeren. Begin met wat je letterlijk zegt.
- **Nooit een telefoon.** "Thuis of in de kluis". Digitaal gaat via de schoollaptop.
- **Plein:** zet *Kan alleen met een deelplein* alleen aan als het echt niet anders kan. Zo'n werkvorm wordt nooit voorgesteld in een L-lokaal.
- **Drie vakvoorbeelden** uit verschillende vakken.
- **Eerlijke onderbouwing.** Weinig onderzoek? Schrijf dat op en kies *Praktijkervaring, weinig onderzoek*. Verzin nooit bronnen of effectgroottes.
- **Formatieve checks** hebben minstens twee als-dan-regels: wat doe je bij welke uitslag?
- **Instapniveau 1** betekent: ook te doen door iemand die nog nooit gedifferentieerd heeft.

## Wat controleert `npm run valideer`?

- Alle verplichte velden en toegestane waarden (via `werkvorm.schema.json`).
- Unieke sleutels, duur min ≤ max, nooit een telefoon in de middelen.
- Werkvormen die een plein vereisen, staan niet als geschikt voor een L-lokaal.
- Formatieve checks hebben als-dan-regels.
- Elke bron bestaat in `bronnen.json`.
- Precies tien werkvormen in *Begin hier*.
- De schoolprofielen kloppen met `profiel.schema.json`.

Daarna maakt het script `index.json` opnieuw: de lichte samenvatting waarmee de bibliotheek snel laadt.

## Een bron toevoegen

Open `public/data/bronnen.json` en voeg een item toe:

```json
"achternaam-jaar": {
  "titel": "Titel van het artikel of boek",
  "auteur": "Achternaam, V.",
  "jaar": 2020,
  "waar": "Tijdschrift, jaargang(nummer), pagina's",
  "status": "nog-controleren"
}
```

Zet `status` pas op `gecontroleerd` als je titel, auteur en jaar zelf hebt nagekeken.
