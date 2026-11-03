# Testverslag fase 2: de lesgenerator

Gedraaid met `npm test` (Vitest). **Resultaat: 89 van 89 tests geslaagd.**

| Onderdeel | Tests | Uitkomst |
|---|---|---|
| Testcases 1 t/m 7 uit de opdracht, elk met alle harde eisen | 21 | geslaagd |
| Varianten en determinisme (drie standen, zelfde invoer = zelfde les, "Andere suggestie", vastzetten) | 4 | geslaagd |
| Lessjablonen: 15 lesduren × 4 lesmodellen (exacte som, max 25 min per fase, max 15 min instructie) | 60 | geslaagd |
| 600 willekeurige lessen (alle afdelingen, lokalen, aantallen, standen, lesmodellen, splitsopties) | 2 | geslaagd |
| Tekstanalyse (waarneembare lesdoelen, lesdoelen en kernbegrippen uit tekst) | 2 | geslaagd |

## Harde eisen die bij elke les worden gecontroleerd

1. De les telt exact op tot de lesduur.
2. Geen werkvorm met een telefoon.
3. Geen plein in een lokaal zonder deelplein.
4. Nooit meer leerlingen in een ruimte dan er passen (M-lokaal 26, plein 40, stilteruimte 8, L-lokaal 32).
5. Minstens één aandachtrichter.
6. Een relevantie-haak.
7. Een check op begrip met als-dan.
8. Minstens één expliciete differentiatievorm.
9. Zowel individueel als samenwerkend leren.
10. Elk onderdeel heeft een werkvorm.
11. Een afsluiting.
12. Aaneengesloten instructie maximaal 15 minuten in een M-lokaal (20 elders).
13. Uiterlijk na 25 minuten een wissel of beweegmoment.
14. Blokuur (70 of 100 min): minstens één beweegmoment.

## Wat moest blijken, en wat bleek

| # | Situatie | Moet blijken | Uitkomst |
|---|---|---|---|
| 1 | Economie havo 3, 50 min, M-lokaal, 30 lln, geen assistent, stand 2 | Splitsplanner start automatisch; geldige verdeling lokaal/plein | ✓ 4 leerlingen te veel → "Startcheck bepaalt de route": iedereen start op het plein, daarna max 24 in het lokaal, 6 op het plein |
| 2 | Nederlands vmbo-k 2, 70 min, L-lokaal, 22 lln, 4 dyslexie, 2 NT2 | Dyslexievriendelijk materiaal en vaktaalkaart; hoeken in plaats van plein; beweegmoment | ✓ materiaaladvies dyslexievriendelijk + vaktaalkaart; "Hoeken of zones in het L-lokaal"; beweegmoment na 45 min |
| 3 | Wiskunde vwo 5 gym, 100 min, M-lokaal, 18 lln, 6 verdieping | Compacten en verrijken; verdieping op het plein | ✓ groep C (6) werkt op het plein met "Compacten en verrijken", daarna "Keuzebord" |
| 4 | O&O havo 1, 100 min, L-lokaal, 28 lln, assistent | Ontwerpopdracht in groepjes met rolkaarten; assistent heeft eigen kaart | ✓ ontwerpopdracht in twee werkblokken, rolkaarten als routine, assistent begeleidt groep B met eigen kaart |
| 5 | Duits mavo 3, 35 min, M-lokaal, 24 lln, laatste uur, onrustig | Korte, gestructureerde opzet met energizer; weinig wissels | ✓ energizer na de check, iedereen blijft in het lokaal, rustige werkvormen |
| 6 | Geschiedenis havo 4, 50 min, stand 1, "legt graag zelf uit" | Les blijft herkenbaar klassikaal met één kleine differentiatiestap | ✓ directe instructie, hele klas samen, één element: instructietafel |
| 7 | Biologie vwo 2, 50 min, "weet ik niet" bij verdeling | Startcheck bepaalt de routes | ✓ startcheck na het lesdoel; verdeling in de les is gemarkeerd als geschat |

Testcases 8 (OCR) en 9 (AI-brug) horen bij fase 4.

## Bugs die de tests vonden en die zijn opgelost

- Een les van 20 minuten kon niet worden opgebouwd (te weinig ruimte in het sjabloon).
- Zonder leerlingen in de steun- of verdiepingsgroep had een les geen differentiatievorm. Nu komt er altijd een instructietafel of pluskaart in.
- Bij stand 1 met stilteruimte raakten de werkvormen op en werd dezelfde werkvorm te lang herhaald.
- De carrousel had in een blokuur geen beweegmoment, en de tweede groep kreeg een ander instructiemodel dan de eerste.
- De startcheck op het plein had geen werkvorm, omdat die werkvorm niet als plein-geschikt stond gemarkeerd.
- Korte tussenblokken op het plein (2-4 min) vonden geen werkvorm. Nu loopt de vorige werkvorm door, of komt er een korte zelfcheck.
- "Je kunt twee oorzaken uitleggen" werd als *analyseren* herkend. De herkenning kijkt nu naar het werkwoord.

## De gegenereerde lessen

### Testcase 1 · Economie havo 3, 50 min, M, 30 lln, geen OA, stand 2

**Opzet:** Een stap verder · Startcheck bepaalt de route. **Groepen:** Groep A · steun (8), Groep B · basis (16), Groep C · verdieping (plein) (6). **Controles:** alle 14 in orde.

| Tijd | Fase | Wie, waar, wat |
|---|---|---|
| 0–7 | Startcheck | A+B+C plein: Startcheck bepaalt de route |
| 7–9 | Opening en aandachtrichter | A+B lokaal: Foto of voorwerp zonder context; C plein: Sorteeropdracht |
| 9–11 | Lesdoel en waarom we dit leren | A+B lokaal: lesdoel + relevantie-haak; C plein: Sorteeropdracht (loopt door) |
| 11–21 | Kern-instructie | A+B lokaal: Directe instructie; C plein: Sorteeropdracht (loopt door) |
| 21–24 | Check op begrip | A+B lokaal: Wisbordjes; C plein: Sorteeropdracht (loopt door) |
| 24–45 | Verwerken in routes | A lokaal: Instructietafel; B lokaal: Binnen-buitenkring; C plein: Casus |
| 45–50 | Afsluiting en vooruitblik | A+B lokaal: 3-2-1; C plein: Exit ticket |

*Differentiatie:* Startcheck bepaalt de route, Instructietafel.  *Routines:* pleinafspraken, overgangsscript-lokaal-plein, signaalkaarten, eerst-drie-dan-ik, rolkaarten, timer-geluidsniveau.

### Testcase 2 · Nederlands vmbo-k 2, 70 min, L, 22 lln, 4 dyslexie, 2 NT2

**Opzet:** Een stap verder · Routes vanuit het lokaal. **Groepen:** Groep A · steun (6), Groep B · basis (12), Groep C · verdieping (4). **Controles:** alle 15 in orde.

| Tijd | Fase | Wie, waar, wat |
|---|---|---|
| 0–4 | Opening en aandachtrichter | A+B+C lokaal: Foto of voorwerp zonder context |
| 4–7 | Lesdoel en waarom we dit leren | A+B+C lokaal: lesdoel + relevantie-haak |
| 7–12 | Startcheck | A+B+C lokaal: Startcheck bepaalt de route |
| 12–24 | Kern-instructie | A+B+C lokaal: Directe instructie |
| 24–27 | Check op begrip | A+B+C lokaal: Wisbordjes |
| 27–45 | Verwerken in routes | A lokaal: Instructietafel; B lokaal: Binnen-buitenkring; C lokaal: Sorteeropdracht |
| 45–48 | Beweegmoment | A+B+C lokaal: Staande ophaaloefening |
| 48–64 | Verwerken in routes | A lokaal: Verlengde instructie; B lokaal: Peer tutoring: leren door uitleggen; C lokaal: Drie sporen: basis, plus en verdieping |
| 64–70 | Afsluiting en vooruitblik | A+B+C lokaal: 3-2-1 |

*Differentiatie:* Startcheck bepaalt de route, Instructietafel, Verlengde instructie, Drie sporen: basis, plus en verdieping, Hoeken of zones in het L-lokaal.  *Routines:* signaalkaarten, eerst-drie-dan-ik, rolkaarten, timer-geluidsniveau.

### Testcase 3 · Wiskunde vwo 5 gym, 100 min, M, 18 lln, 6 verdieping

**Opzet:** Een stap verder · Routes vanuit het lokaal. **Groepen:** Groep A · steun (4), Groep B · basis (8), Groep C · verdieping (6). **Controles:** alle 15 in orde.

| Tijd | Fase | Wie, waar, wat |
|---|---|---|
| 0–6 | Opening en aandachtrichter | A+B+C lokaal: Voorspellen |
| 6–9 | Lesdoel en waarom we dit leren | A+B+C lokaal: lesdoel + relevantie-haak |
| 9–16 | Voorkennis activeren | A+B+C lokaal: Binnen-buitenkring |
| 16–28 | Kern-instructie | A+B+C lokaal: Directe instructie |
| 28–32 | Check op begrip | A+B+C lokaal: Wisbordjes |
| 32–56 | Verwerken in routes | A lokaal: Hintkaarten; B lokaal: Casus; C plein: Compacten en verrijken |
| 56–59 | Beweegmoment | A+B lokaal: Staande ophaaloefening; C plein: beweeg-zelf |
| 59–65 | Tussentijdse check | A+B lokaal: Stoplichtkaart; C plein: Exit ticket |
| 65–89 | Verwerken in routes | A lokaal: Instructietafel; B lokaal: Tweetal-coach; C plein: Keuzebord of menukaart |
| 89–92 | Beweegmoment | A+B lokaal: Opstaan als je…; C plein: beweeg-zelf |
| 92–100 | Afsluiting en vooruitblik | A+B+C lokaal: 3-2-1 |

*Differentiatie:* Hintkaarten, Compacten en verrijken, Instructietafel, Keuzebord of menukaart.  *Routines:* pleinafspraken, overgangsscript-lokaal-plein, signaalkaarten, eerst-drie-dan-ik, rolkaarten, timer-geluidsniveau.

### Testcase 4 · O&O havo 1, 100 min, L, 28 lln, OA aanwezig

**Opzet:** Een stap verder · Routes vanuit het lokaal. **Groepen:** Groep A · steun (7), Groep B · basis (15), Groep C · verdieping (6). **Controles:** alle 15 in orde.

| Tijd | Fase | Wie, waar, wat |
|---|---|---|
| 0–6 | Opening en aandachtrichter | A+B+C lokaal: Nieuwsitem uit de regio |
| 6–9 | Lesdoel en waarom we dit leren | A+B+C lokaal: lesdoel + relevantie-haak |
| 9–16 | Startcheck | A+B+C lokaal: Startcheck bepaalt de route |
| 16–28 | Kern-instructie | A+B+C lokaal: Directe instructie |
| 28–32 | Check op begrip | A+B+C lokaal: 3-2-1 |
| 32–56 | Verwerken in routes | A lokaal: Hintkaarten; B lokaal: Onderzoeks- of ontwerpopdracht; C lokaal: Compacten en verrijken |
| 56–59 | Beweegmoment | A+B+C lokaal: Stellingenlijn |
| 59–65 | Tussentijdse check | A+B+C lokaal: Succescriteria en zelfcheck |
| 65–89 | Verwerken in routes | A lokaal: Instructietafel; B lokaal: Onderzoeks- of ontwerpopdracht; C lokaal: Keuzebord of menukaart |
| 89–92 | Beweegmoment | A+B+C lokaal: Vier hoeken |
| 92–100 | Afsluiting en vooruitblik | A+B+C lokaal: Samenvatten in zes woorden |

*Differentiatie:* Startcheck bepaalt de route, Hintkaarten, Compacten en verrijken, Instructietafel, Keuzebord of menukaart, Hoeken of zones in het L-lokaal. *Onderwijsassistent:* Begeleidt groep B tijdens het verwerken met een eigen kaart; jij zit aan de instructietafel. *Routines:* signaalkaarten, eerst-drie-dan-ik, rolkaarten, timer-geluidsniveau.

### Testcase 5 · Duits mavo 3, 35 min, M, 24 lln, laatste uur, onrustig

**Opzet:** Een stap verder · Routes vanuit het lokaal. **Groepen:** Groep A · steun (6), Groep B · basis (13), Groep C · verdieping (5). **Controles:** alle 14 in orde.

| Tijd | Fase | Wie, waar, wat |
|---|---|---|
| 0–3 | Opening en aandachtrichter | A+B+C lokaal: Voorspellen |
| 3–5 | Lesdoel en waarom we dit leren | A+B+C lokaal: lesdoel + relevantie-haak |
| 5–9 | Startcheck | A+B+C lokaal: Startcheck bepaalt de route |
| 9–17 | Kern-instructie | A+B+C lokaal: Directe instructie |
| 17–20 | Check op begrip | A+B+C lokaal: Wisbordjes |
| 20–22 | Beweegmoment | A+B+C lokaal: Staande ophaaloefening |
| 22–31 | Verwerken in routes | A lokaal: Hintkaarten; B lokaal: Tweetal-coach; C lokaal: Sorteeropdracht |
| 31–35 | Afsluiting en vooruitblik | A+B+C lokaal: Exit ticket |

*Differentiatie:* Startcheck bepaalt de route, Hintkaarten.  *Routines:* rolkaarten, timer-geluidsniveau.

### Testcase 6 · Geschiedenis havo 4, 50 min, stand 1, legt graag uit

**Opzet:** Klassikaal-plus · Klassikaal-plus. **Groepen:** Hele klas (27). **Controles:** alle 14 in orde.

| Tijd | Fase | Wie, waar, wat |
|---|---|---|
| 0–3 | Opening en aandachtrichter | lokaal: Nieuwsitem uit de regio |
| 3–5 | Lesdoel en waarom we dit leren | lokaal: lesdoel + relevantie-haak |
| 5–9 | Voorkennis activeren | lokaal: Denken-delen-uitwisselen |
| 9–19 | Kern-instructie | lokaal: Directe instructie |
| 19–22 | Check op begrip | lokaal: Wisbordjes |
| 22–45 | Verwerken in routes | lokaal: Tweekolommen- en Cornell-notities · element: Instructietafel |
| 45–50 | Afsluiting en vooruitblik | lokaal: Exit ticket |

*Differentiatie:* Instructietafel.  *Routines:* signaalkaarten, eerst-drie-dan-ik.

### Testcase 7 · Biologie vwo 2, 50 min, verdeling onbekend

**Opzet:** Een stap verder · Routes vanuit het lokaal. **Groepen:** Groep A · steun (6), Groep B · basis (13), Groep C · verdieping (5). **Controles:** alle 14 in orde.

| Tijd | Fase | Wie, waar, wat |
|---|---|---|
| 0–3 | Opening en aandachtrichter | A+B+C lokaal: Nieuwsitem uit de regio |
| 3–5 | Lesdoel en waarom we dit leren | A+B+C lokaal: lesdoel + relevantie-haak |
| 5–9 | Startcheck | A+B+C lokaal: Startcheck bepaalt de route |
| 9–19 | Kern-instructie | A+B+C lokaal: Directe instructie |
| 19–22 | Check op begrip | A+B+C lokaal: Wisbordjes |
| 22–45 | Verwerken in routes | A lokaal: Instructietafel; B lokaal: Binnen-buitenkring; C plein: Casus |
| 45–50 | Afsluiting en vooruitblik | A+B+C lokaal: 3-2-1 |

*Differentiatie:* Startcheck bepaalt de route, Instructietafel.  *Routines:* pleinafspraken, overgangsscript-lokaal-plein, signaalkaarten, eerst-drie-dan-ik, rolkaarten, timer-geluidsniveau.

