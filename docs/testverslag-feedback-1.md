# Testverslag: feedback na de oplevering

**Automatische tests: 154 van 154 geslaagd** (`npm test`), waarvan 7 nieuw voor de SLO-kaders. Kennisbank, profielen en 184 kaders geldig (`npm run valideer`). Toegankelijkheid (axe-core, WCAG 2.1 AA): 0 overtredingen, ook met het nieuwe paneel open.

| Feedback | Wat er veranderd is |
|---|---|
| Je kunt het jaar niet invullen | De snelle modus vraagt nu ook het leerjaar, met de afdeling erin ("havo 4", "vwo gymnasium 3"). In de uitgebreide modus stond het al. Het leerjaar staat ook bij je lessen in Mijn profiel. |
| Ik mis vakken | Toegevoegd: Muziek, CKV en Digitale geletterdheid. Kunst heet nu Kunst (beeldend). Filosofie staat alleen bij vwo. T&T heet Technologie & Toepassen, O&O Onderzoeken & Ontwerpen, M&M Mens & Maatschappij (alleen vmbo basis en kader). Latijn en Grieks stonden er al, alleen bij vwo gymnasium; onder het vakveld staat nu waar zulke vakken te vinden zijn. |
| Eindtermen en syllabi van SLO importeren, stof eraan koppelen | Uit de open data van SLO (licentie MIT) geïmporteerd: de 58 kerndoelen onderbouw, de geldende examenprogramma's met domeinen, subdomeinen en eindtermen, de nieuwste syllabi per niveau en vmbo-leerweg, de nieuwe kerndoelen (concept, onder meer digitale geletterdheid en burgerschap) en de praktijkgerichte programma's (onder meer T&T). In de wizard kies je het kader, zoek je en vink je aan; een eindterm kan een eerste lesdoel worden. De koppeling staat in het lesplan, het lesplandocument, de AI-opdracht, het lesbestand en Mijn lessen. Mijn profiel toont per kader wat al aan bod kwam en wat nog niet. |
| Je kunt maar één lesdoel opgeven | De snelle modus heeft nu dezelfde lijst als de uitgebreide: meerdere lesdoelen, elk met de controle op waarneembaarheid en denkniveau. |

## Controle in de browser

Snelle modus, havo 4 economie: twee lesdoelen, gezocht op "schaarste" in het examenprogramma, eindterm aangevinkt, een tweede kader gekozen (concept-kerndoelen), een kerndoel als lesdoel gebruikt, les gemaakt. Het lesplan en het lesplandocument tonen "Sluit aan bij". In Mijn profiel: de les staat er met "havo 4", de dekking toont het kader en "nog niet gekoppeld (14)". Mavo 1 T&T krijgt de kerndoelen Techniek en het programma Technologie en Toepassing. Op telefoonbreedte (375) geen horizontaal scrollen. De zoekfocus blijft in het zoekveld tijdens het typen.

## Om te weten

- Voor het beroepsgerichte profielvak heeft SLO geen open data; daarvoor is geen kader.
- Voor Duits en Frans in de onderbouw bestaan geen geldende kerndoelen; Uniekind toont daar de nieuwe conceptkerndoelen moderne vreemde talen, duidelijk gemarkeerd als concept.
- Bijwerken: zie README, *Kerndoelen, examenprogramma's en syllabi*.
