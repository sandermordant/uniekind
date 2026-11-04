// Hulp: veelgestelde vragen, de vormen van differentiatie uitgelegd, en "30 leerlingen in een M-lokaal".
// Feiten over de school komen uit het schoolprofiel, niet uit deze pagina.
import { html } from '../util/html.js';
import { laadIndex } from '../data/laden.js';
import { DIFFERENTIATIE } from '../data/labels.js';
import { STAND } from '../wizard/stappen.js';
import { OPZETTEN } from '../engine/splitsplanner.js';
import { termen } from '../data/termen.js';

const DIFF_UITLEG = {
  niveau: ['Iedereen werkt aan hetzelfde doel, maar de opdracht verschilt in moeilijkheid: steun, basis en verdieping.', 'Werkblad op drie niveaus, of een pluskaart voor wie klaar is.'],
  tempo: ['Leerlingen gaan sneller of langzamer door dezelfde stof. Wie klaar is, gaat verder; wie meer tijd nodig heeft, krijgt die.', 'Een ankeropdracht of een weektaak.'],
  ondersteuning: ['Hoeveel hulp een leerling krijgt, verschilt: extra uitleg, hintkaarten of een uitgewerkt voorbeeld, en die hulp bouw je af.', 'De instructietafel of verlengde instructie.'],
  'keuze-aanpak': ['Leerlingen kiezen hoe ze werken of laten zien wat ze kunnen: schrijven, tekenen, uitleggen, een schema. Het doel blijft hetzelfde. In het schoolplan heet dit ‘leerstijl’; Uniekind spreekt van keuze in aanpak en verwerking.', 'Een keuzebord of menukaart.'],
  interesse: ['Hetzelfde doel, maar in een context die de leerling zelf kiest: sport, muziek, dieren, de eigen omgeving.', 'Keuze in context.'],
  groepering: ['Je kiest bewust hoe leerlingen samenwerken: alleen, in tweetallen, in groepjes, en wie bij wie. Flexibel, dus niet steeds dezelfde groepen.', 'Flexibele groepen na een check, of de legkaart.'],
  leeromgeving: ['Waar een leerling werkt, verschilt: aan de instructietafel, op het plein, in een stille hoek of de stilteruimte.', 'Routes vanuit het lokaal, of hoeken in een L-lokaal.']
};

export default {
  async render({ profiel: p }) {
    const index = await laadIndex();
    const M = p.ruimtes.find((r) => r.id === 'M');
    const L = p.ruimtes.find((r) => r.id === 'L');
    const plein = p.ruimtes.find((r) => r.id === 'plein');
    const stilte = p.ruimtes.find((r) => r.id === 'stilte');
    const voorbeelden = (tag) => index.items
      .filter((i) => i.differentiatie.includes(tag) && ['differentiatievorm', 'activerende-werkvorm', 'leerstrategie', 'instructiemodel'].includes(i.categorie))
      .sort((a, b) => a.instapniveau - b.instapniveau || a.naam.localeCompare(b.naam, 'nl'))
      .slice(0, 5);
    const opzet = (id) => OPZETTEN[id] ? html`<li><b>${OPZETTEN[id].naam}.</b> ${OPZETTEN[id].kort}</li>` : '';

    return {
      titel: 'Hulp',
      html: html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Hulp</p>
          <h1>Vragen van collega's</h1>
          <p class="lead">Korte antwoorden op wat je tegenkomt als je met Uniekind werkt. Staat je vraag er niet bij? Spreek de collega aan die Uniekind op school beheert.</p>
          <div class="inhoudsopgave" role="navigation" aria-label="Op deze pagina">
            <button type="button" class="knop secundair klein" data-naar="kop-start">Aan de slag</button>
            <button type="button" class="knop secundair klein" data-naar="kop-ruimte">Lokalen en grote klassen</button>
            <button type="button" class="knop secundair klein" data-naar="kop-diff">Vormen van differentiatie</button>
            <button type="button" class="knop secundair klein" data-naar="kop-materiaal">Materiaal, foto en AI</button>
            <button type="button" class="knop secundair klein" data-naar="kop-privacy">Privacy en bronnen</button>
          </div>
        </div></section>
        <main class="wrap">
          <section class="sectie" aria-labelledby="kop-start">
            <h2 id="kop-start" tabindex="-1">Aan de slag</h2>
            <div class="faq">
              <details open><summary>Hoe maak ik een les in drie minuten?</summary>
                <ol>
                  <li>Ga naar <a href="#les-maken">Maak een les</a> en blijf in de modus <b>Snel</b>.</li>
                  <li>Vul je lesdoelen in (één of meer), en afdeling, leerjaar, vak, lesduur, lokaal en het aantal leerlingen. Een foto van de paragraaf mag ook (bij Alle zeven stappen).</li>
                  <li>Kies hoe ver je wilt gaan en klik op <b>Genereer de les</b>. Je krijgt drie varianten; kies er één.</li>
                  <li>Pas aan wat je wilt (volgorde, minuten, een andere werkvorm) en ga naar <b>Materiaal</b>. Print of exporteer.</li>
                </ol>
                <p>Wil je meer sturen, kies dan <b>Alle zeven stappen</b>. Dan vul je ook je profiel en het klasbeeld in.</p>
              </details>
              <details><summary>Wat betekenen de drie standen?</summary>
                <ul>${STAND.map(([k, n, t]) => html`<li><b>${n}</b>: ${t}</li>`)}</ul>
                <p>Begin gerust bij ${STAND[0][1]}. Je hoeft niet opnieuw te leren lesgeven; elke stand is een stap verder vanuit hoe je nu werkt.</p>
              </details>
              <details><summary>Hoe koppel ik mijn les aan de kerndoelen of eindtermen?</summary>
                <p>Kies afdeling, leerjaar en vak en open <b>Kerndoelen en eindtermen (SLO)</b>. In de onderbouw staan de kerndoelen bovenaan, in de bovenbouw het examenprogramma en de syllabus van jouw niveau. Zoek, vink aan, en kies eventueel <b>Gebruik als lesdoel</b>; pas dat lesdoel daarna aan in je eigen woorden.</p>
                <p>De koppeling staat in je lesplan en gaat mee in de AI-opdracht. In <a href="#mijn-profiel">Mijn profiel</a> zie je per kader wat al aan bod kwam en wat nog niet.</p>
                <p>De teksten komen uit de open data van SLO. Kaders met "concept" zijn nieuwe kerndoelen of examenprogramma's die nog niet wettelijk gelden.</p>
              </details>
              <details><summary>Ik zie mijn vak niet in de lijst</summary>
                <p>De vakkenlijst hangt af van de afdeling. Latijn en Grieks staan bijvoorbeeld bij vwo gymnasium, T&T bij vmbo-tl/mavo. Mis je een vak helemaal, vraag de beheerder het toe te voegen in het schoolprofiel.</p>
              </details>
              <details><summary>Waarom kiest Uniekind deze werkvorm?</summary>
                <p>Bij elke werkvorm in je lesplan staat <b>Waarom deze?</b>. Uniekind kijkt naar je lesdoel (welk denkniveau), de lesfase, je profiel, je klas (aantallen en ondersteuning), de visie van de school en de harde eisen: de totale tijd klopt, nooit een telefoon, nooit boven de capaciteit van een ruimte.</p>
                <p>Daarnaast weegt licht mee: werkvormen met een voorbeeld uit jouw vak, je duimen uit eerdere reflecties, en afwisseling met je vorige lessen van dit vak.</p>
              </details>
              <details><summary>Ik wil een andere werkvorm</summary>
                <p>Klik in de stap <b>Aanpassen</b> op <b>Andere suggestie</b> bij die werkvorm, of kies er een uit de lijst <b>Ook passend…</b>. Met <b>Zet vast</b> blijft je keuze staan als je verder iets verandert.</p>
              </details>
              <details><summary>Wat gebeurt er met mijn reflectie na de les?</summary>
                <p>Elke les die je tot het materiaal maakt, staat in <a href="#mijn-profiel">Mijn profiel</a>. Geef daar na de les per werkvorm een duim omhoog of omlaag. Uniekind kiest werkvormen die bij jou werken daarna iets vaker. Het blijft op jouw computer.</p>
              </details>
              <details><summary>Hoe werkt de digibordmodus?</summary>
                <p>Vanuit het materiaal open je de <a href="#digibord">digibordmodus</a>: per fase een groot scherm met timer, routeschema, geluidsniveau, een namenkiezer en een groepjesmaker. Met het toetsenbord:</p>
                <div class="toetsen">
                  <span><kbd>→</kbd> <kbd>←</kbd></span><span>Volgende of vorige fase</span>
                  <span><kbd>spatie</kbd></span><span>Timer starten of pauzeren</span>
                  <span><kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd></span><span>Geluidsniveau kiezen</span>
                  <span><kbd>R</kbd></span><span>Routeschema</span>
                  <span><kbd>K</kbd></span><span>Namenkiezer (namen worden nergens bewaard)</span>
                  <span><kbd>G</kbd></span><span>Groepjes maken</span>
                  <span><kbd>F</kbd></span><span>Volledig scherm</span>
                  <span><kbd>Esc</kbd></span><span>Terug</span>
                </div>
              </details>
              <details><summary>Ik mis een werkvorm</summary>
                <p>Via <a href="#invulformulier">Werkvorm toevoegen</a> vul je een formulier in. Je krijgt een stukje tekst dat je naar de beheerder stuurt; die zet het in de kennisbank. Programmeren is niet nodig.</p>
              </details>
            </div>
          </section>

          <section class="sectie" aria-labelledby="kop-ruimte">
            <h2 id="kop-ruimte" tabindex="-1">Lokalen en grote klassen</h2>
            <div class="faq">
              ${M ? html`<details open><summary>Wat doe ik met 30 leerlingen in een ${M.kort}?</summary>
                <p>In een ${M.kort} passen ${M.capaciteit} leerlingen. Met 30 leerlingen moeten er dus minstens ${Math.max(0, 30 - M.capaciteit)} tegelijk ergens anders werken. Uniekind start de les dan meteen gesplitst en laat je kiezen hoe:</p>
                <ul>${['gespreide-start', 'startcheck', 'carrousel', 'flipped', 'oa', 'stilte'].map(opzet)}</ul>
                ${plein ? html`<p><b>Het ${termen.plein}.</b> ${plein.omschrijving} ${p.regels?.pleinToezichtDoorDocent ? `Uniekind gaat ervan uit dat jij vanuit het ${termen.M} toezicht houdt op het eigen ${termen.plein}. Twijfel je of dat in jouw situatie mag, vraag het dan na bij je teamleider.` : 'Uniekind zet alleen een groep op het plein als er een onderwijsassistent bij is.'}</p>` : ''}
                ${stilte ? html`<p><b>De stilteruimte.</b> Uniekind rekent met ${stilte.capaciteit} plekken.${stilte.aanname ? ' Dat is een voorzichtige standaard; de beheerder van Uniekind kan het aanpassen.' : ''}</p>` : ''}
                <p>Ook als iedereen wel past, is lang zitten op krukken onprettig. Daarom houdt Uniekind aaneengesloten instructie in een ${M.kort} op hooguit ${M.maxInstructieAaneengesloten} minuten.</p>
              </details>` : ''}
              ${L ? html`<details><summary>Ik geef les in een L-lokaal. Hoe differentieer ik zonder plein?</summary>
                <p>Een ${L.kort} heeft geen eigen plein. Uniekind gebruikt dan het lokaal zelf: een instructietafel voor wie meer uitleg nodig heeft, hoeken of zones voor basis en verdieping, en eventueel de stilteruimte. Het plein komt in een ${L.kort} nooit in je lesplan.</p>
              </details>` : ''}
              <details><summary>En in een blokuur?</summary>
                <p>In een blokuur zorgt Uniekind voor minstens elke 25 minuten een wisseling of een beweegmoment, zoals een energizer of een werkvorm waarbij leerlingen opstaan.</p>
              </details>
              ${p.regels?.telefoon ? html`<details><summary>Waarom stelt Uniekind nooit iets voor met een telefoon?</summary>
                <p>“${p.regels.telefoon.motto}.” ${p.regels.telefoon.uitleg}</p>
              </details>` : ''}
            </div>
          </section>

          <section class="sectie" aria-labelledby="kop-diff">
            <h2 id="kop-diff" tabindex="-1">Vormen van differentiatie</h2>
            <p class="lees">Differentiëren betekent niet dat je dertig lessen tegelijk geeft. Meestal verander je één ding, zodat meer leerlingen het doel halen. Dit zijn de zeven knoppen waaraan je kunt draaien, met werkvormen uit de kennisbank die erbij passen.</p>
            <div class="diffvormen">
              ${Object.entries(DIFFERENTIATIE).map(([k, naam]) => {
                const [uitleg, vb] = DIFF_UITLEG[k] ?? ['', ''];
                const lijst = voorbeelden(k);
                return html`<div class="pijler">
                  <h3>${naam}</h3>
                  <p>${uitleg}</p>
                  ${vb ? html`<p class="doet"><b>Bijvoorbeeld:</b> ${vb}</p>` : ''}
                  ${lijst.length ? html`<ul>${lijst.map((i) => html`<li><a href="#werkvorm-${i.id}">${i.naam}</a></li>`)}</ul>` : ''}
                </div>`;
              })}
            </div>
            <p class="lees klein-boven">Convergent of divergent? Bij <b>convergent</b> differentiëren werkt iedereen aan hetzelfde doel, met meer of minder hulp. Bij <b>divergent</b> gaan sommige leerlingen verder dan het doel. Uniekind kiest standaard convergent, met verdieping voor wie klaar is.</p>
          </section>

          <section class="sectie" aria-labelledby="kop-materiaal">
            <h2 id="kop-materiaal" tabindex="-1">Materiaal, foto en AI</h2>
            <div class="faq">
              <details><summary>Wat zit er in het materiaalpakket?</summary>
                <p>Voor jou: het lesplan, een differentiatie-overzicht, een voorbereidingslijst, een antwoordkaart, een reflectiekaart en een kijkwijzer voor collegiaal lesbezoek. Voor de leerlingen: werkbladen op drie niveaus, opdrachtkaarten, checks en wat de werkvormen nodig hebben, met het juiste aantal per niveau. Velden die jij invult zijn gemarkeerd.</p>
                <p>Alles kan als PDF, Word of PowerPoint, of in één keer geprint. Zet <b>Dyslexievriendelijk</b> aan voor een groter lettertype en meer regelafstand.</p>
              </details>
              <details><summary>Hoe werkt de foto van de paragraaf?</summary>
                <p>Maak met de laptop een foto of scan van de paragraaf en kies hem bij Inhoud. Uniekind leest de tekst in je browser en zoekt lesdoelen en kernbegrippen. De foto verlaat je computer niet en wordt nergens bewaard. De eerste keer duurt het iets langer, omdat het Nederlandse taalpakket wordt geladen.</p>
              </details>
              <details><summary>Wat is de AI-brug?</summary>
                <p>Uniekind maakt de structuur en het materiaal zelf, zonder AI. Voor vakinhoud (vragen, voorbeelden, een casus) kun je een kant-en-klare opdracht kopiëren naar ${p.ai?.tool ?? 'de AI-tool van school'}, en het antwoord terugplakken. Uniekind zet het dan op de goede plek in het materiaal.</p>
                <p>In die opdracht staan nooit gegevens over je klas of leerlingen, alleen het vak, het niveau, het onderwerp en de lesdoelen. Lees wat de AI maakt altijd na voordat je het gebruikt.</p>
              </details>
              <details><summary>Kan ik een les bewaren en later weer openen?</summary>
                <p>Ja. Kies bij Materiaal <b>Lesbestand bewaren</b>. Je krijgt een klein bestand dat je via <a href="#les-openen">Les openen</a> weer inleest, ook op een andere computer of bij een collega.</p>
              </details>
            </div>
          </section>

          <section class="sectie" aria-labelledby="kop-privacy">
            <h2 id="kop-privacy" tabindex="-1">Privacy en bronnen</h2>
            <div class="faq">
              <details open><summary>Worden er gegevens van leerlingen opgeslagen?</summary>
                <p>Nee. Je vult alleen aantallen in. Een groepslijst met namen voor het printen of de namenkiezer blijft alleen zolang de pagina openstaat en wordt nergens bewaard.</p>
                <p>In je browser bewaart Uniekind alleen: je docentprofiel, je laatste lesconcept en je eigen lessen met reflecties. Dat zie en wis je in <a href="#mijn-profiel">Mijn profiel</a>. Er zijn geen accounts, geen trackers, geen statistieken en geen cookies waarvoor toestemming nodig is.</p>
                <p>Alles op een rij in gewone taal: <a href="#privacy">Privacy</a>.</p>
              </details>
              <details><summary>Wat betekent “bron nog controleren”?</summary>
                <p>Elke werkvorm heeft een eerlijke onderbouwing: sterk, redelijk, beperkt onderzoek, of praktijkervaring. Bronnen zijn echte publicaties. Staat er “bron nog controleren”, dan moet een detail (jaar, druk of link) nog worden nagelopen. Uniekind noemt bewust geen effectgroottes.</p>
              </details>
            </div>
          </section>
        </main>`,
      na(root) {
        root.addEventListener('click', (e) => {
          const k = e.target.closest('[data-naar]');
          if (!k) return;
          const doel = root.querySelector(`#${k.dataset.naar}`);
          doel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          doel?.focus({ preventScroll: true });
        });
      }
    };
  }
};
