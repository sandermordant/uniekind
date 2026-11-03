// Uniekind – start van de app: profiel laden, huisstijl toepassen, kop en voet tekenen, routeren.
import './stijl/lettertypen.css';
import './stijl/basis.css';
import './stijl/print.css';

import { html, escape } from './util/html.js';
import { laadProfiel } from './data/laden.js';

import home from './pages/home.js';
import bibliotheek from './pages/bibliotheek.js';
import werkvorm from './pages/werkvorm.js';
import beginHier from './pages/begin-hier.js';
import visie from './pages/visie.js';
import invulformulier from './pages/invulformulier.js';
import binnenkort from './pages/binnenkort.js';

const NAV = [
  { hash: 'les-maken', label: 'Maak een les' },
  { hash: 'bibliotheek', label: 'Werkvormen' },
  { hash: 'begin-hier', label: 'Begin hier' },
  { hash: 'visie', label: 'Visie' }
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
    'les-maken': binnenkort
  };
  return { pagina: routes[hash] ?? home, nav: routes[hash] ? hash : '' };
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
    <header class="kop">
      <div class="wrap">
        <a class="merk" href="#" aria-label="${profiel.uniekind.titel}, naar de startpagina">
          ${logo}
          <span><span class="merk-naam">${profiel.uniekind.titel}</span><span class="merk-sub">${profiel.uniekind.ondertitel}</span></span>
        </a>
        <nav class="nav" aria-label="Hoofdmenu">
          ${NAV.map((n) => html`<a href="#${n.hash}" data-nav="${n.hash}">${n.label}</a>`)}
        </nav>
      </div>
      <div class="kleurbalk" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span></div>
    </header>
    <div id="inhoud" tabindex="-1"></div>
    <footer class="voet">
      <div class="wrap">
        <span>${profiel.uniekind.titel} voor ${profiel.school.naam}. Alles draait in je browser; er worden geen leerlinggegevens opgeslagen.</span>
        <span><a href="#invulformulier">Werkvorm toevoegen</a></span>
      </div>
    </footer>`;
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
  app.innerHTML = String(shell(profiel));
  const inhoud = document.getElementById('inhoud');
  const ctx = { profiel };

  let teller = 0;
  async function toon() {
    const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
    const { pagina, arg, nav } = kiesPagina(hash);
    for (const a of document.querySelectorAll('[data-nav]')) {
      if (a.dataset.nav === nav) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
    const mijn = ++teller;
    try {
      const resultaat = await pagina.render(ctx, arg);
      if (mijn !== teller) return; // inmiddels naar een andere pagina genavigeerd
      inhoud.innerHTML = String(resultaat.html);
      document.title = `${resultaat.titel ? resultaat.titel + ' · ' : ''}${profiel.uniekind.titel} – ${profiel.school.naam}`;
      resultaat.na?.(inhoud);
      window.scrollTo(0, 0);
      if (hash) inhoud.focus({ preventScroll: true });
    } catch (e) {
      console.error(e);
      inhoud.innerHTML = `<main class="wrap"><p class="leeg">Er ging iets mis bij het laden van deze pagina: ${escape(e.message)}</p></main>`;
    }
  }
  window.addEventListener('hashchange', toon);
  toon();
}

start();
