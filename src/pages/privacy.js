// Privacy in gewone taal: wat Uniekind wel en niet doet.
import { html } from '../util/html.js';

export default {
  async render({ profiel: p }) {
    const ai = p.ai ?? {};
    return {
      titel: 'Privacy',
      html: html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Privacy</p>
          <h1>Wat Uniekind wel en niet doet</h1>
          <p class="lead">Kort gezegd: Uniekind werkt in je eigen browser, vraagt nooit naar leerlingen en stuurt niets naar een server.</p>
        </div></section>
        <main class="wrap">
          <section class="sectie">
            <div class="pijlers">
              <div class="pijler"><h3>Geen leerlinggegevens</h3><p>Je vult alleen aantallen in: hoeveel leerlingen, hoeveel met dyslexie, hoeveel klaar voor verdieping. Nooit namen, cijfers of andere gegevens.</p></div>
              <div class="pijler"><h3>Geen accounts</h3><p>Je hoeft niet in te loggen. Er is geen database en geen server die iets van jou bewaart.</p></div>
              <div class="pijler"><h3>Geen volgen</h3><p>Geen trackers, geen statistieken, geen advertenties en geen cookies waarvoor je toestemming moet geven.</p></div>
            </div>
          </section>

          <section class="sectie lees">
            <h2>Wat blijft er op jouw computer?</h2>
            <p>Uniekind onthoudt een paar dingen in de opslag van je browser (localStorage), alleen op deze computer en alleen voor jou:</p>
            <ul>
              <li>je docentprofiel: vakken, afdelingen, hoe je lesgeeft en je kracht in één zin;</li>
              <li>de les waar je het laatst aan werkte;</li>
              <li>je lessen met je eigen reflectie (onderwerp, vak, lesduur, werkvormen en je duimen);</li>
              <li>kleine voorkeuren, zoals het geluidsniveau in de digibordmodus.</li>
            </ul>
            <p>Je ziet en wist dit in <a href="#mijn-profiel">Mijn profiel</a>. Werk je op een gedeelde computer, wis het dan na gebruik, of gebruik een privévenster: dan onthoudt Uniekind niets.</p>

            <h2>Namen in de digibordmodus</h2>
            <p>Voor de namenkiezer of de groepjesmaker kun je tijdelijk namen invullen. Die blijven alleen zolang het venster openstaat en worden nergens bewaard, ook niet in een lesbestand. Groepen heten in alles wat je opslaat A, B en C.</p>

            <h2>Foto van een paragraaf</h2>
            <p>De tekstherkenning draait in je eigen browser. De foto verlaat je computer niet en wordt na het lezen weggegooid. Alleen het Nederlandse taalpakket wordt de eerste keer van deze website geladen.</p>

            <h2>De AI-brug</h2>
            <p>Uniekind praat zelf niet met een AI. Kies je voor "Maak af met AI", dan maakt Uniekind een tekst die jij kopieert naar ${ai.tool ?? 'de AI-tool van school'}. Die tekst bevat alleen lesinhoud (vak, niveau, onderwerp, lesdoelen, begrippen en de tekst van de paragraaf), nooit gegevens over je klas. Gebruik de AI-tool die de school toestaat, met je schoolaccount. Wat je daar invoert, valt onder de afspraken van die tool.</p>

            <h2>Links naar andere websites</h2>
            <p>Zoeklinks (bijvoorbeeld naar Schooltv of Wikiwijs) openen pas als je erop klikt. Uniekind laat geen video's of andere inhoud van buiten automatisch zien. Een link komt pas in je materiaal als jij hem aanvinkt.</p>

            <h2>Lesbestanden</h2>
            <p>Een lesbestand (.uniekind) bevat je invoer, je aanpassingen en de gekozen werkvormen. Geen namen. Je bepaalt zelf waar je het bewaart en met wie je het deelt.</p>

            <h2>De website zelf</h2>
            <p>Uniekind is een gewone website zonder eigen server-logica. Zoals bij elke website kan de partij die de site host technische logboeken bijhouden (zoals het tijdstip van een bezoek), los van Uniekind.${p.uniekind.noindex ? ' Deze versie wordt niet opgenomen door zoekmachines.' : ''}</p>
            ${p.uniekind.toegangscode ? html`<p>Bij je eerste bezoek vraagt de site een schoolwoord. Dat is een drempel, geen beveiliging: zet er nooit iets vertrouwelijks achter.</p>` : ''}

            <h2>Later: automatische AI</h2>
            <p>${ai.apiBeschikbaar ? 'De automatische koppeling met een taalmodel staat aan. Ook dan gaan er alleen lesinhoud en nooit leerlinggegevens mee.' : 'Een automatische koppeling met een taalmodel staat uit. Die komt er alleen na akkoord van de school en de functionaris gegevensbescherming, met een verwerkersovereenkomst. Ook dan gaan er nooit leerlinggegevens mee.'}</p>
          </section>
        </main>`
    };
  }
};
