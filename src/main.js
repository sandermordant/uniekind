// Uniekind – start van de app: profiel laden, huisstijl toepassen, kop en voet tekenen, routeren.
import './stijl/lettertypen.css';
import './stijl/basis.css';
import './stijl/wizard.css';
import './stijl/materiaal.css';
import './stijl/digibord.css';
import './stijl/paginas.css';
import './stijl/print.css';

import { html, escape } from './util/html.js';
import { laadProfiel } from './data/laden.js';

import home from './pages/home.js';
import bibliotheek from './pages/bibliotheek.js';
import werkvorm from './pages/werkvorm.js';
import beginHier from './pages/begin-hier.js';
import visie from './pages/visie.js';
import invulformulier from './pages/invulformulier.js';
import lesMaken from './pages/les-maken.js';
import lesOpenen from './pages/les-openen.js';
import digibord from './pages/digibord.js';
import hulp from './pages/hulp.js';
import mijnProfiel from './pages/mijn-profiel.js';
import privacy from './pages/privacy.js';
import schoolprofiel from './pages/schoolprofiel.js';
import examenstof from './pages/examenstof.js';
import examenopgave from './pages/examenopgave.js';
import { zetTermen } from './data/termen.js';

const NAV = [
  { hash: 'les-maken', label: 'Maak een les' },
  { hash: 'bibliotheek', label: 'Werkvormen' },
  { hash: 'examenstof', label: 'Examenstof' },
  { hash: 'begin-hier', label: 'Begin hier' },
  { hash: 'les-openen', label: 'Les openen' },
  { hash: 'visie', label: 'Visie' },
  { hash: 'mijn-profiel', label: 'Mijn profiel' },
  { hash: 'hulp', label: 'Hulp' }
];

// Routes: plain hash-namen (#bibliotheek, #werkvorm-wisbordjes), zodat links ook in previews werken.
function kiesPagina(hash) {
  if (!hash) return { pagina: home, nav: '' };
  if (hash.startsWith('werkvorm-')) return { pagina: werkvorm, arg: hash.slice('werkvorm-'.length), nav: 'bibliotheek' };
  const routes = {
    'bibliotheek': bibliotheek,
    'begin-hier': beginHier,
    'visie': visie,
    'invulformulier': invulformulier,
    'les-maken': lesMaken,
    'les-openen': lesOpenen,
    'digibord': digibord,
    'hulp': hulp,
    'mijn-profiel': mijnProfiel,
    'privacy': privacy,
    'schoolprofiel': schoolprofiel,
    'examenstof': examenstof,
    'examenopgave': examenopgave
  };
  return { pagina: routes[hash] ?? home, nav: hash === 'examenopgave' ? 'examenstof' : routes[hash] ? hash : '' };
}

function pasHuisstijlToe(profiel) {
  const r = document.documentElement.style;
  for (const [naam, kleur] of Object.entries(profiel.huisstijl.kleuren)) r.setProperty(`--huis-${naam}`, kleur);
  if (profiel.huisstijl.motief) r.setProperty('--motief', `url("${new URL(profiel.huisstijl.motief, document.baseURI).href}")`);
}

function shell(profiel) {
  const logo = profiel.huisstijl.logo
    ? html`<span class="logo-plaat"><img src="${profiel.huisstijl.logo}" alt="${profiel.huisstijl.logoAlt ?? profiel.school.naam}" width="146" height="34"></span>`
    : '';
  return html`
    <button type="button" class="overslaan" id="overslaan">Naar de inhoud</button>
    <header class="kop">
      <div class="wrap">
        <a class="merk" href="#" aria-label="${profiel.uniekind.titel}, naar de startpagina">
          ${logo}
          <span><span class="merk-naam">${profiel.uniekind.titel}</span><span class="merk-sub">${profiel.uniekind.ondertitel}</span></span>
        </a>
        <nav class="nav" aria-label="Hoofdmenu">
          ${[...NAV, ...(profiel.uniekind.eigenProfiel ? [{ hash: 'schoolprofiel', label: 'Schoolprofiel' }] : [])].map((n) => html`<a href="#${n.hash}" data-nav="${n.hash}">${n.label}</a>`)}
        </nav>
      </div>
      <div class="kleurbalk" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
    </header>
    <div id="inhoud" tabindex="-1"></div>
    <p id="paginaMelding" class="visueel-verborgen" aria-live="polite"></p>
    <footer class="voet">
      <div class="wrap">
        <span>${profiel.uniekind.titel} voor ${profiel.school.naam}. Alles draait in je browser; er worden geen leerlinggegevens opgeslagen.</span>
        <span class="voetlinks"><a href="#hulp">Hulp</a> <a href="#privacy">Privacy</a> <a href="#mijn-profiel">Mijn gegevens</a> <a href="#invulformulier">Werkvorm toevoegen</a> <a href="#schoolprofiel">Schoolprofiel</a></span>
      </div>
    </footer>`;
}

// Toegangscode: een drempel bij het eerste bezoek, géén beveiliging (het woord staat in het profiel en is dus
// voor iedereen te lezen). Leeg of null in het profiel betekent: geen drempel.
const normaal = (w) => String(w ?? '').trim().toLowerCase();
function toegangOk(profiel, app) {
  const code = profiel.uniekind.toegangscode;
  if (!code) return true;
  try { if (localStorage.getItem('uniekind:toegang') === normaal(code)) return true; } catch { /* geen opslag: elke keer vragen */ }
  return new Promise((klaar) => {
    app.innerHTML = String(html`
      <main class="wrap toegang">
        <h1>${profiel.uniekind.titel}</h1>
        <p class="lead">${profiel.uniekind.ondertitel}</p>
        <form id="toegangForm" class="toegang-form">
          <label for="toegangCode">Vul het schoolwoord in dat je van je collega's hebt gekregen.</label>
          <div class="veldrij"><input id="toegangCode" type="text" autocomplete="off" autocapitalize="off" required>
          <button type="submit" class="knop">Verder</button></div>
          <p id="toegangFout" class="melding fout" role="alert" hidden>Dat woord klopt niet. Probeer het nog eens.</p>
        </form>
      </main>`);
    const f = document.getElementById('toegangForm');
    document.getElementById('toegangCode').focus();
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (normaal(f.toegangCode.value) === normaal(code)) {
        try { localStorage.setItem('uniekind:toegang', normaal(code)); } catch { /* niets */ }
        klaar(true);
      } else document.getElementById('toegangFout').hidden = false;
    });
  });
}

async function start() {
  const app = document.getElementById('app');
  let profiel;
  try {
    profiel = await laadProfiel();
  } catch (e) {
    app.innerHTML = `<p class="laden">Het schoolprofiel kon niet worden geladen. ${escape(e.message)}</p>`;
    return;
  }
  pasHuisstijlToe(profiel);
  zetTermen(profiel);
  if (!(await toegangOk(profiel, app))) return;
  app.innerHTML = String(shell(profiel));
  let inhoud = document.getElementById('inhoud');
  const ctx = { profiel };

  let teller = 0;
  async function toon() {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    const { pagina, arg, nav } = kiesPagina(hash);
    document.body.classList.toggle('digibord', hash === 'digibord');
    for (const a of document.querySelectorAll('[data-nav]')) {
      if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    const mijn = ++teller;
    try {
      const resultaat = await pagina.render(ctx, arg);
      if (mijn !== teller) return; // inmiddels naar een andere pagina genavigeerd
      // Verse container, zodat event-listeners van de vorige pagina niet blijven hangen
      const nieuw = inhoud.cloneNode(false);
      inhoud.replaceWith(nieuw);
      inhoud = nieuw;
      inhoud.innerHTML = String(resultaat.html);
      document.title = `${resultaat.titel ? resultaat.titel + ' · ' : ''}${profiel.uniekind.titel} – ${profiel.school.naam}`;
      const m = document.getElementById('paginaMelding');
      if (m) m.textContent = `${resultaat.titel || 'Startpagina'} geladen`;
      resultaat.na?.(inhoud);
      window.scrollTo(0, 0);
      if (hash) inhoud.focus({ preventScroll: true });
    } catch (e) {
      console.error(e);
      inhoud.innerHTML = `<main class="wrap"><p class="leeg">Er ging iets mis bij het laden van deze pagina: ${escape(e.message)}</p></main>`;
    }
  }
  document.getElementById('overslaan').addEventListener('click', () => { const h = inhoud.querySelector('h1, h2'); (h ?? inhoud).setAttribute('tabindex', '-1'); (h ?? inhoud).focus(); });
  window.addEventListener('hashchange', toon);
  toon();
}

start();
