# Testverslag fase 5: kennisbank, Hulp, Mijn profiel en reflectie

**Automatische tests: 133 van 133 geslaagd** (`npm test`), waarvan 15 nieuw in `tests/fase5.test.js`.
**Kennisbank: 160 werkvormen, alle geldig** (`npm run valideer`).

## Kennisbank

| Categorie | Fase 4 | Fase 5 |
|---|---|---|
| Aandachtrichters (openers) | 6 | 41 |
| Activerende werkvormen | 15 | 29 |
| Differentiatievormen | 14 | 20 |
| Formatieve checks | 10 | 18 |
| Leerstrategieën | 6 | 11 |
| Instructiemodellen | 8 | 10 |
| Energizers | 4 | 10 |
| Afsluiters | 3 | 8 |
| Routines | 8 | 13 |
| **Totaal** | **74** | **160** |

Elk nieuw item heeft: een startzin, 3 tot 6 stappen, valkuilen met oplossing, varianten voor vmbo, havo en vwo en voor steun, basis en verdieping, voorbeelden uit minstens drie vakken, tips per ondersteuningsbehoefte en een eerlijke onderbouwing. Waar weinig onderzoek is, staat "praktijkervaring" of "beperkt onderzoek". Effectgroottes zijn niet opgenomen. Elke formatieve check heeft als-dan-regels.

Nieuwe bronnen, alle gecontroleerd op auteur, titel en jaar: Mazur (1997), Weinstein, Madan en Sumeracki (2018), Hattie en Timperley (2007), Zimmerman (2002), Tomlinson (2014).

Werkvormen die door het lokaal lopen (lopend dictee, speeddate, sta op en wissel) staan alleen op L-lokaal. Geen enkel item noemt een telefoon.

## Variatie

Met 41 openers kozen de eerste versies toch vaak dezelfde opener, omdat die net iets hoger scoorde. Daarom wegen drie dingen licht mee:

- **Een voorbeeld uit het eigen vak** (bijvoorbeeld een demonstratie bij natuurkunde). In "Waarom deze?" staat dan "Er staat een voorbeeld uit … bij".
- **Een kleine vaste afwisseling** bij openers, energizers en afsluiters, op basis van onderwerp en vak. Dezelfde invoer geeft nog steeds dezelfde les. Getest: 8 biologie-onderwerpen geven minstens 3 verschillende openers.
- **Je vorige lessen**: werkvormen uit je laatste twee lessen van hetzelfde vak krijgen een min. In de browser kreeg de tweede les over hetzelfde onderwerp een andere opener, check, verwerking en afsluiter. De splitsing en het lesmodel bleven gelijk, omdat die uit het lokaal en je profiel volgen.

## Mijn profiel en reflectie

| Wat moet blijken | Uitkomst |
|---|---|
| Een les komt vanzelf in Mijn lessen | Ja, zodra je bij Materiaal bent. Opnieuw openen werkt dezelfde regel bij, maakt geen tweede |
| Er staan geen leerlinggegevens in | Alleen datum, onderwerp, vak, afdeling, lesduur, stand, opzet, werkvormen en reflectie. Getest met een klas met dyslexie: niets daarvan in het logboek |
| Een duim wordt een voorkeur | 👍 wordt +1, 👎 wordt −1 in `duimen`; bij gemengde oordelen het gemiddelde |
| "Jouw werkvormen die werken" | Toont wat werkt, wat minder ging en wat je vaak gebruikt maar nog niet beoordeelde |
| Meenemen naar een andere laptop | Downloaden en inlezen geeft dezelfde lessen en duimen; een ander bestand wordt geweigerd |
| Wissen | "Lessen en reflecties wissen" en "Alles wissen" laten niets achter |
| Lesmaker en digibord tonen dezelfde les | Beide gebruiken nu dezelfde invoer (`generatorInvoer`) |
| Lesbestand opent elders hetzelfde | Ja, ook als daar alle werkvormen een duim omlaag hebben. "Andere suggestie" gaat nog steeds voor |

## Hulp

Veelgestelde vragen in vijf blokken (aan de slag, lokalen en grote klassen, vormen van differentiatie, materiaal/foto/AI, privacy en bronnen). Feiten over de school (capaciteit M-lokaal, plein, stilteruimte, telefoonregel, AI-tool) komen uit het schoolprofiel, niet uit de pagina. "Wat doe ik met 30 leerlingen in een M-lokaal?" rekent met de capaciteit uit het profiel en noemt de zes opzetten van de splitsplanner. Bij elke vorm van differentiatie staan werkvormen uit de kennisbank.

## Controle in de browser

Laptop (1366 breed) en telefoon (390 breed): geen horizontaal scrollen, geen fouten in de console. Les gemaakt, reflectie gegeven met een duim omhoog en omlaag, melding "Bewaard", overzicht bijgewerkt, tweede les gevarieerd. De knoppen bovenaan Hulp zetten de focus op de juiste kop. De duimknoppen zijn radioknoppen met een tekstlabel voor schermlezers en een zichtbare focusrand.

## Gevonden en opgelost

- De digibordmodus bouwde de les zonder je eerdere lessen op en kon dus een andere les tonen dan de lesmaker.
- "Maak een nieuwe les met variatie op deze" (Les openen) werd overschreven door de nieuwe variatie; beide tellen nu mee.
- Een lesbestand kon op een andere computer andere werkvormen geven door andere reflecties daar.
- In Hulp stond een technische aantekening uit het schoolprofiel ("Zet op false …"); vervangen door gewone taal.
- Twee afsluiters en twee activerende werkvormen voldeden niet aan het schema of hadden bewijs "beperkt" zonder bron; gecorrigeerd.
