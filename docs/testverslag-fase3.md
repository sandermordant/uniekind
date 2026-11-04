# Testverslag fase 3: materiaal, digibord en export

**Automatische tests: 107 van 107 geslaagd** (`npm test`): de 89 tests van fase 2 plus 18 nieuwe.

| Onderdeel | Wat is getest | Uitkomst |
|---|---|---|
| Materiaalpakket (4 lessen) | Alle verplichte documenten aanwezig; werkbladen steun + basis + verdieping tellen op tot de klasgrootte; geen kapotte tekst | geslaagd |
| Situatieafhankelijk materiaal | Rekenhulpkaart bij economie; pleinafspraken alleen met plein; rolkaarten, assistentkaart en rubric bij O&O | geslaagd |
| Rustige versie | Maximaal drie vragen per blad | geslaagd |
| Word | Geldig .docx-bestand | geslaagd |
| PDF | Geldig PDF-bestand (dyslexievriendelijk) | geslaagd |
| PowerPoint | Geldig .pptx-bestand | geslaagd |
| Lesbestand | Heen en terug geeft dezelfde les; een naam in de invoer komt niet in het bestand; vreemde bestanden worden geweigerd | geslaagd |

## Controle in de browser en met LibreOffice

Een les (economie havo 3, inflatie, 30 leerlingen in een M-lokaal) is in de browser gemaakt en alle exports zijn gedownload:

| Bestand | Controle | Uitkomst |
|---|---|---|
| Opdrachtkaarten als PDF | pdfinfo | 8 pagina's, geldig |
| Opdrachtkaarten als Word | geopend en omgezet door LibreOffice | 8 pagina's |
| Alles als PDF | pdfinfo | 43 pagina's, geldig |
| Alles als Word | geopend door LibreOffice en python-docx | 42 pagina's, 273 alinea's |
| Presentatie (.pptx) | geopend door LibreOffice en python-pptx | 9 dia's met notities |
| Alles printen | printweergave van Chromium | 39 pagina's, elk document op een nieuwe pagina, printlijst vooraf |
| Lesbestand (.uniekind) | weer geopend via Les openen | les komt terug op 50 van 50 minuten, alle eisen in orde |

Digibordmodus op 1920 × 1080: pijltjes wisselen van fase, spatie start de timer (1:58 na 2 seconden), toets 1 zet het geluidsniveau op "Stil", R toont het routeschema, K kiest een nummer, G maakt 8 groepjes van ongeveer vier, Esc gaat terug naar de les.

## Gevonden en opgelost

- In Word verschenen drie schrijfregels als één regel (Word voegt lege alinea's met dezelfde rand samen). Nu als tabel met alleen onderranden.
- De instructiedia in een gesplitste les toonde alleen een tabel; nu een plek voor je eigen uitleg met onderaan wat de andere groep doet.
- Op het digibord was tijdens "Lesdoel" het vak van de lokaalgroep leeg, en de kolomkoppen van het routeschema waren onzichtbaar.
- Opdrachtkaarten namen een halve pagina per rij; compacter gemaakt (43 → 39 pagina's voor het hele pakket).

## Wat de docent nog zelf invult

Uniekind kan zonder AI de vakinhoud niet weten. Die plekken zijn geel gemarkeerd: het uitgewerkte voorbeeld, opgaven uit de methode, toepassingsvragen, de uitwerking op de hintkaarten, de omschrijvingen op de vaktaalkaart en de checkvragen in de presentatie. In fase 4 vult de AI-brug deze velden.
