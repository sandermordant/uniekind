# Testverslag fase 6 en 7, en eindcontrole tegen de opdracht

**Automatische tests: 147 van 147 geslaagd** (`npm test`).
**Kennisbank: 164 werkvormen, alle geldig** (`npm run valideer`). Beide schoolprofielen geldig.
**Toegankelijkheid: 0 overtredingen** van WCAG 2.1 A en AA (axe-core), op 20 schermen per thema, licht en donker, voor beide versies.

## Wat er in fase 6 en 7 is bijgekomen

| Onderdeel | Waar |
|---|---|
| Privacypagina in gewone taal | `#privacy`, `src/pages/privacy.js`; link in de voet en bij Hulp |
| Toegangscode (drempel, geen beveiliging) | `uniekind.toegangscode` in het profiel; `src/main.js` |
| Sectie-accenten (school → sectie → docent): lesmodel, taxonomie, methodewebsite, werkvorm van de maand | `sectieAccenten.perVak`; `src/engine/context.js`, `opbouw.js`, `uitleg.js` |
| Visie-accenten uit het profiel bepalen de visiescore | `VISIE_ACCENTEN` in `src/engine/score.js` |
| Verwijzing naar het ondersteuningsaanbod van de school (dyslexiepas, remedial teaching, faalangstreductietraining, compacten en verrijken, ondersteuningslessen) bij behoeften in de klas | `src/engine/opbouw.js`; staat bij "Goed om te weten" in lesplan en materiaal |
| Optioneel actualiteitsmoment; label "Actualiteit en diversiteit" en burgerschapslabels in het lesplan | stap Inhoud; `src/wizard/lesplan.js` |
| AI-brug benoemt het risico van afhankelijkheid (schoolplan 1.3) | `src/wizard/materiaalstap.js` |
| Vier werkvormen die in de opdracht genoemd werden maar nog ontbraken: 30-secondenuitdaging, stelling bij binnenkomst, bewust groeperen (homogeen/heterogeen), vaste plek voor hulpkaarten | kennisbank |
| Knop "Naar de inhoud" voor toetsenbordgebruikers | `src/main.js` |
| Publicatie klaargezet: Netlify (`netlify.toml`) en GitHub Pages (`.github/workflows/pages.yml`), beide versies samen in `site/` | `npm run site` |
| Handleiding van één pagina | `docs/handleiding-collegas.md`, `.html`, `.pdf` |
| Pitch van één pagina | `docs/pitch-schoolleiding.md`, `.html`, `.pdf` |
| **Fase 7:** voorbeeldprofiel zonder Sophianum-gegevens, neutrale huisstijl, ondertitel "De lesgenerator voor gedifferentieerd lesgeven" | `public/profiles/voorbeeld-algemeen.json`, `public/huisstijl/algemeen/` |
| **Fase 7:** schoolprofiel-wizard (naam, motto, logo, kleuren, visie, principes, lokalen met eigen namen, lestijden, vakken, sectie-accenten, regels, terminologie, regio, AI-tool, toegang) | `#schoolprofiel`, `src/pages/schoolprofiel.js` |
| **Fase 7:** profiel downloaden, delen, inlezen; gebruiken in de browser; deellink; vaste link `?school=` | `src/data/profiel.js` |
| **Fase 7:** ruimtenamen in alle teksten uit het profiel | `src/data/termen.js` |

## Gevonden en opgelost

- De oude link "Naar de inhoud" stuurde toetsenbordgebruikers terug naar de startpagina, omdat `#inhoud` als paginanaam werd gelezen.
- Het hele scherm was een "live region", waardoor een schermlezer bij elke pagina alles opnieuw voorlas. Nu meldt hij alleen "… geladen".
- Contrast: de gekleurde getallen op de startpagina (geel en oranje op wit, blauw op donker), één groene melding en het label "plein" haalden de norm niet.
- Een uitklapbaar codeblok in het invulformulier was niet met het toetsenbord te bereiken.
- Een school zonder instructielokaal met plein liet de generator een lokaal kiezen dat niet bestond.
- Het ondersteuningsaanbod van de school stond in het profiel, maar Uniekind verwees er nergens naar.
- Teksten noemden overal "M-lokaal" en "deelplein", ook voor een andere school.
- Beide versies bouwden naar dezelfde map.

## Controle in de browser

| Wat | Uitkomst |
|---|---|
| Laptop (1366 breed) | Alle pagina's en wizardstappen zonder fouten in de console |
| Digibord (1920×1080) | Geen horizontaal scrollen, opdracht in 88 px, routeschema leesbaar, bediening met ← → spatie 1 2 3 R K G F Esc |
| Telefoon (375 breed) | 12 pagina's, geen horizontaal scrollen |
| Toetsenbord | Les maken van startpagina tot "Genereer de les" alleen met Tab en Enter; zichtbare focusrand overal |
| Printvoorbeeld | Alle 19 materiaalsoorten geven een nette printpagina |
| Export | Word (33 pagina's), PowerPoint (9 dia's) en PDF (32 pagina's) openen foutloos in LibreOffice |
| Algemene versie | Profiel aangepast (naam, kleur, geen instructielokaal, eigen vak, schoolwoord), gedownload, gebruikt; les zonder plein voldoet aan alle eisen; deellink (6,5 kB) opent in een schone browser met het juiste profiel; een kapotte link valt terug op het voorbeeldprofiel; `?school=sophianum` laadt Sophianum |
| Samengevoegde site | `/` en `/algemeen/` werken allebei, met bibliotheek en werkvormpagina's |

## Eindcontrole: de opdracht, deel voor deel

✔ = gebouwd en getest · ◐ = gebouwd, met een kanttekening

### Deel 1 · Eindresultaat
| Gevraagd | Status |
|---|---|
| Werkende, gepubliceerde website | ◐ Werkt, en staat als preview online (Sophianum en algemeen). Publicatie op Netlify of GitHub Pages is klaargezet, maar vraagt jouw account; zie README, *Publiceren* |
| Broncode met README | ✔ |
| Kennisbank in JSON | ✔ 164 items, schema en validatiescript |
| Handleiding van één pagina | ✔ |
| Pitch voor de schoolleiding | ✔ |
| Kernbelofte | ✔ op de startpagina, in de handleiding en in het profiel |

### Deel 2 · Context
| Gevraagd | Status |
|---|---|
| Alle niveaus: vmbo-MiX (basis, kader), mavo, havo, vwo (atheneum, gymnasium) | ✔ |
| Vakoverstijgend D&P, M&M, M&N, T&T, O&O; Duits schoolbreed, Frans havo/vwo | ✔ |
| M-lokaal 26 met krukken, deelplein, L-lokaal 32, anders | ✔ instelbaar in het profiel |
| Klassen tot 30: splitsen of gedifferentieerd starten | ✔ splitsplanner |
| Stilteruimte als extra werkplek | ✔ (capaciteit 8 is een aanname, instelbaar) |
| Lestijden per afdeling, altijd ook vrij | ✔ |
| Thuis of in de kluis; plein alleen laptop onder toezicht; onderwijsassistent per les | ✔ harde regels |
| Verwijzen naar het ondersteuningsaanbod, zonder leerlinggegevens; examenstress | ✔ (nieuw in fase 6) |

### Deel 3 · Visie Sophianum
| Gevraagd | Status |
|---|---|
| Visie in `profiles/sophianum.json`, geen Sophianum-tekst in de code | ✔ gecontroleerd; ook ruimtenamen komen nu uit het profiel |
| Visie werkt door in de generator | ✔ visie-accenten, "Waarom deze?" koppelt aan pijlers en principes |
| Motto als rode draad, aan beide kanten | ✔ steun én verdieping in elke les; uitleg bij de les |
| Kernwaarden, koers, vier pijlers | ✔ visiepagina en uitleg |
| Leidende principes 1.1 tot 1.12 als regels | ✔ zie de tabel op de visiepagina; actualiteit en AI-risico's nieuw in fase 6 |
| "Leerstijl" als keuze in aanpak en verwerking, respectvol uitgelegd | ✔ visiepagina |
| Burgerschapslabels | ✔ in de bibliotheek, op werkvormpagina's en nu ook in het lesplan |
| Speerpunten: kijkwijzer, PLG | ✔ kijkwijzer per les; werkvorm van de maand per sectie |
| Sectie-accenten | ✔ (nieuw in fase 6) |
| Instelbare aannames (Bloom/RTTI, lesmodel, capaciteiten) | ✔ |

### Deel 4 · Techniek
| Gevraagd | Status |
|---|---|
| Statisch, geen server, database, sleutel of accounts | ✔ |
| Licht: vanilla JS en Vite | ✔ |
| Geen trackers, analytics of toestemmingscookies | ✔ |
| OCR lokaal met Tesseract.js (nld), lesdoelen en kernbegrippen herkennen | ✔ testcase 8 |
| Alleen aantallen; namen alleen tijdelijk | ✔ |
| Lesbestand .uniekind en Les openen | ✔ bewaart nu ook de gekozen werkvormen |
| localStorage in try/catch | ✔ |
| Toegangscode en noindex | ✔ |
| Privacypagina | ✔ (nieuw in fase 6) |
| Export PDF, Word, PowerPoint, lesbestand, alles printen | ✔ |
| Responsive, WCAG 2.1 AA, Nederlands, lui laden | ✔ |

### Deel 5 · Wizard
| Gevraagd | Status |
|---|---|
| Zeven stappen met i-knopjes, en een snelle modus | ✔ |
| Profiel: uitspraken 1-5 plus eigen uitspraak, kracht in één zin, schuif, lesmodel, taxonomie | ✔ |
| Context: afdeling, leerjaar, vak, lesduur, lokaal, stilteruimte, aantal met melding boven 26, assistent, laptops, reeks, tijdstip | ✔ |
| Inhoud: foto, tekst of kernwoorden; lesdoelen waarneembaar en met denkniveau; begrippen; voorkennis met activering bij twijfel; misvattingen | ✔ |
| Klasbeeld: verdeling of "weet ik niet" (startcheck), behoeften als getal, dynamiek | ✔ |
| Drie varianten met tijdlijn, wie waar, twee zinnen uitleg | ✔ |
| Aanpassen: slepen, tijden met waarschuwing, andere suggestie, alternatieven, vastzetten | ✔ |
| Materiaal en export | ✔ |
| Reflectie na de les en "Jouw werkvormen die werken" | ✔ |

### Deel 6 · Kennisbank
| Gevraagd | Status |
|---|---|
| Minimaal 150 items, kwaliteit boven aantal | ✔ 164 |
| Alle velden uit het datamodel | ✔ schema, gecontroleerd door `npm run valideer` |
| Differentiatietaxonomie, convergent/divergent uitgelegd in de bibliotheek | ✔ |
| Alle genoemde instructiemodellen, organisatievormen, activerende werkvormen, leerstrategieën, checks met als-dan, energizers onder 3 minuten, afsluiters, routines, veiligheid en rust | ✔ elke naam uit de opdracht nagelopen |
| Minimaal 40 openers | ✔ 43 |
| Instapset Begin hier (10) | ✔ |
| Alleen echte bronnen, geen effectgroottes, "bron nog controleren" | ✔ 37 bronnen; 6 gemarkeerd als nog te controleren |

### Deel 7 · Generator
| Gevraagd | Status |
|---|---|
| Deterministisch; "andere suggestie" kiest de volgende kandidaat | ✔ |
| Harde filters, gewogen score met gewichten uit het profiel | ✔ |
| Docentprofiel telt zwaar bij stand 1, minder bij stand 3 | ✔ |
| Variatie, ook met de vorige les uit het lesbestand; persoonlijke ervaring | ✔ |
| Lessjablonen 35/50/70/100, schalen, beweegmoment per 25 minuten | ✔ |
| Splitsplanner met zes opzetten, schema wie waar wanneer, groepen A/B/C, overgangsscript | ✔ |
| "Waarom deze?" met koppeling aan les, visie en onderbouwing | ✔ |

### Deel 8 · Materialen
| Gevraagd | Status |
|---|---|
| Docent: lesplan, voorbereiding, differentiatie-overzicht, kijkwijzer, reflectiekaart | ✔ |
| Digibordmodus met timer, routeschema, geluidsniveau, kiezer, groepjesmaker, toetsenbord | ✔ |
| Presentatie | ✔ |
| Leerling: werkbladen op drie niveaus met schema's en uitgewerkt voorbeeld, opdrachtkaarten, hintkaarten, succescriteria, exit tickets, vaktaalkaart, rekenhulpkaart, rolkaarten, pleinafspraken, Vandaag-kaart, rubric | ✔ |
| Dyslexievriendelijk en rustige versie | ✔ |
| Zoeklinks, gecureerde lijst, voorstelformulier, nooit automatisch video | ✔ |
| Alles printen met aantallen | ✔ |

### Deel 9 · AI
| Gevraagd | Status |
|---|---|
| Adapter met drie modi, de eerste twee actief | ✔ |
| AI-brug: complete prompt, vast formaat, Copilot, geen leerlinggegevens, melding, importveld, onherkende delen zichtbaar, controleregel, kleine prompts | ✔ testcase 9 |
| API-route voorbereid, niet gebouwd, met limieten, budget en voorwaarden | ✔ `docs/api-route.md` |

### Deel 10 · Algemene versie
| Gevraagd | Status |
|---|---|
| Dezelfde code, alleen profiel en huisstijl verschillen | ✔ |
| Wizard met alle genoemde onderdelen; principes bepalen de gewichten | ✔ |
| Downloaden, delen, inladen; eigen link met profiel | ✔ |
| Sophianum-profiel als voorbeeld, zonder vertrouwelijke gegevens of namen van medewerkers | ✔ |
| Neutrale huisstijl, naam Uniekind | ✔ |
| Drie lagen: school, sectie, docent | ✔ |

### Deel 11 · Ontwerp en pagina's
| Gevraagd | Status |
|---|---|
| Donkerblauw, vijf accentkleuren als balk, hoogtelijnen, rond lettertype, logo | ✔ |
| Toon: je-vorm, collegiaal, niet belerend | ✔ |
| Pagina's: Home, Lesgenerator, Bibliotheek (filters, werkvormpagina, printbare kaart), Begin hier, Mijn profiel, Les openen, Visie, Hulp, Privacy | ✔ alle negen, plus Schoolprofiel |

### Deel 12 · Kwaliteit
| Gevraagd | Status |
|---|---|
| Harde eisen in elke les | ✔ 900 willekeurige lessen (600 Sophianum, 300 algemeen) |
| Testcases 1 tot en met 9 | ✔ |
| Exports openen foutloos | ✔ LibreOffice |
| Laptop, digibord, telefoon, toetsenbord, contrast, printvoorbeeld | ✔ |
| Geen verzonnen feiten over Sophianum | ✔ aannames staan gemarkeerd in het profiel |
| Kennisbank aan te vullen zonder programmeren | ✔ invulformulier |

## Wat nog bij jou ligt

1. **Publiceren** op Netlify of GitHub Pages (een paar klikken; zie README). Daarvoor is jouw account nodig.
2. **Aannames bevestigen** in het profiel: capaciteit stilteruimte (8) en deelplein (40), toezicht op het plein door de docent, Copilot als AI-tool.
3. **Zes bronnen nalopen** die als "nog controleren" staan (zie `npm run valideer`).
4. **Toegangscode**: zet een schoolwoord in het profiel als je een drempel wilt.
