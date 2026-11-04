# Testverslag fase 4: foto, AI-brug en bronnen

**Automatische tests: 118 van 118 geslaagd** (`npm test`), waarvan 11 nieuw voor testcase 8 en 9.

## Testcase 8: foto van een paragraaf met leerdoelen bovenaan

Testfoto: `tests/fixtures/paragraaf-foto.jpg`, een lesboekparagraaf over fotosynthese met drie leerdoelen in een kader. De foto is licht scheef, wat onscherp en heeft een rand, zoals een telefoonfoto.

| Wat moet blijken | Uitkomst |
|---|---|
| De tekst wordt lokaal herkend | Zekerheid 93%, in Node 1,5 s en in de browser 2,9 s, zonder netwerkverkeer |
| De leerdoelen worden herkend | Alle drie, ook al las de herkenning de opsommingstekens als « |
| De leerdoelen zijn waarneembaar en hebben een denkniveau | Begrijpen, Onthouden, Begrijpen |
| Kernbegrippen worden voorgesteld | fotosynthese, bladgroen, plant, licht, energie, glucose, koolstofdioxide, water |
| De docent controleert en bevestigt | De herkende tekst staat in het tekstvak; de begrippen moeten worden aangevinkt |

## Testcase 9: AI-brug

| Wat moet blijken | Uitkomst |
|---|---|
| De prompt bevat geen leerlinggegevens | Getest met een klas met 4 leerlingen met dyslexie, 2 met NT2, 3 met faalangst en "onrustig": geen van die gegevens in de prompt, ook niet de klasgrootte |
| De prompt bevat de lesinhoud | Vak, niveau, lesdoelen met denkniveau, kernbegrippen, tekst, werkvormen, routes |
| Kleine prompts vragen alleen hun eigen onderdelen | Voor alle 8 pakketten gecontroleerd |
| Een teruggeplakt antwoord vult de sjablonen | Werkblad basis, uitgewerkt voorbeeld, hintkaart, vaktaalkaart, scharniervraag in lesplan en presentatie, en een nieuwe antwoordkaart |
| Wat niet herkend wordt, blijft zichtbaar | Inleiding ("Natuurlijk! …"), een eigen kopje en de afsluitende vraag ("Wil je dat ik …?") staan apart |
| Robuust voor opmaak | `### NAAM`, `**NAAM**`, `## Hintkaart 1` en JSON worden allemaal herkend |
| Controleregel voor de docent | "Lees AI-materiaal altijd na op juistheid en niveau" in het paneel en bovenaan het lesplan |

## Controle in de browser

Uitgebreide modus, biologie vwo 2: foto geüpload → drie lesdoelen en begrippen → les gegenereerd → bij Materiaal de prompt gekopieerd (3.596 tekens, alleen de gevraagde koppen, geen klasgegevens) → antwoord teruggeplakt → zes onderdelen herkend en in het materiaal gezet. Daarna een gecureerde bron aangevinkt en een eigen link toegevoegd; beide staan in het lesplan. Word (34 pagina's) en PowerPoint (9 dia's, met de scharniervraag) openen foutloos in LibreOffice. Het lesbestand bewaart de zes AI-onderdelen en de twee links.

## Gevonden en opgelost

- Opsommingstekens die door de herkenning als « werden gelezen, zorgden ervoor dat lesdoelen werden gemist.
- Het meervoudsfilter bij kernbegrippen haalde ook gewone woorden op "-en" weg (bijvoorbeeld *bladgroen*).
- De voorbeeldkop in de prompt noemde altijd VRAGEN-BASIS, ook als je alleen verdiepingsvragen vroeg.
- Zoeklinks zochten met het paragraafnummer erbij ("4.3 Fotosynthese").
- Een afsluitende chatzin van de AI-tool kwam in het laatste materiaalblok terecht.

## Ook in de preview op claude.ai

De preview levert geen `.gz`-bestanden. Daarom heet het taalpakket nu `nld.traineddata.gz.wasm` (inhoud ongewijzigd), en een klein hulpscript (`ocr/worker.js`) stuurt het verzoek van Tesseract daarheen. In de echte viewer van claude.ai is de foto daarna herkend in 3,5 seconden, met alle drie de lesdoelen.
