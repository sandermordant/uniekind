// Digibordmodus: één scherm per lesfase, groot en met veel contrast, leesbaar achterin het lokaal.
// Toetsen: ← → vorige/volgende fase · spatie timer · 1 2 3 geluidsniveau · R routeschema · K kiezer · G groepjes · F volledig scherm · Esc terug
import { html, raw, $, escape } from '../util/html.js';
import { laadAlleWerkvormen } from '../data/laden.js';
import { genereerLes, herbereken } from '../engine/opbouw.js';
import { laadDocent, laadConcept, pasAanpassingenToe } from '../wizard/staat.js';
import * as opslag from '../opslag/opslag.js';

const VOOR_LEERLING = {
  opening: 'Kijk naar het bord en denk na.', doel: 'Luister mee: dit ga je vandaag leren.', voorkennis: 'Wat weet je nog?', startcheck: 'Maak de startcheck. Alleen, zonder overleg.',
  instructie: 'Luister en doe mee. Schrijf de stappen op.', check: 'Schrijf je antwoord op. Nog niet laten zien!', steun: 'Schuif aan bij de instructietafel.',
  basis: 'Werk aan het werkblad basis.', verdieping: 'Werk aan het werkblad verdieping.', zelfstandig: 'Werk zelfstandig aan je opdracht.',
  zelfinstructie: 'Lees het uitgewerkte voorbeeld en maak de aanvulopdracht.', clip: 'Kijk de kennisclip en maak de controlevragen.',
  startopdracht: 'Begin meteen met de startopdracht.', voorbereiding: 'Herhaal de stof van vorige les.', beweeg: 'Sta op!', 'beweeg-zelf': 'Korte pauze: sta even op en kijk je werk na.',
  afsluiting: 'Maak je exit ticket.', stilte: 'Werk in stilte aan je opdracht.', zelfcheck: 'Kijk je werk na met de antwoordkaart.'
};
const PLEK = { lokaal: 'in het lokaal', plein: 'op het plein', stilte: 'in de stilteruimte' };
const GELUID = [['stil', 'Stil', '🤫'], ['fluisteren', 'Fluisteren', '💬'], ['overleggen', 'Overleggen', '🗣️']];

const mmss = (s) => `${s < 0 ? '+' : ''}${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, '0')}`;

export default {
  async render({ profiel }) {
    const items = await laadAlleWerkvormen();
    const docent = laadDocent(profiel);
    const concept = laadConcept(profiel, docent);
    const data = { profiel, items };
    const les = herbereken(pasAanpassingenToe(genereerLes({ ...concept.invoer, opties: { ...concept.invoer.opties, duimen: opslag.lees('duimen', {}) }, stand: concept.gekozenStand ?? concept.invoer.stand }, data), concept.aanpassingen), items);
    const doel = les.doel.lesdoelen[0]?.tekst ?? '';
    const groepNaam = (id) => les.groepen.find((g) => g.id === id)?.naam.split(' · ')[0] ?? id;
    const staat = { i: 0, rest: les.fases[0].duur * 60, loopt: false, geluid: opslag.lees('digibord-geluid', 'fluisteren'), laag: null, kiezerGehad: [], geluidAan: false };

    function faseHtml() {
      const f = les.fases[staat.i];
      const blokken = f.blokken.filter((b) => !(b.vervolg && f.blokken.length === 1) || true);
      return `
        <div class="db-fase">
          <p class="db-stap">Fase ${staat.i + 1} van ${les.fases.length} · minuut ${f.start}–${f.start + f.duur}</p>
          <h1>${escape(f.titel)}</h1>
          ${f.type === 'doel' ? `<div class="db-doel">${les.doel.lesdoelen.map((d) => `<p>${escape(d.tekst)}</p>`).join('')}<p class="db-vraag">${escape(les.doel.relevantie.vraag)}</p></div>` : ''}
          <div class="db-blokken n${Math.min(blokken.length, 3)}">
            ${blokken.filter((b) => !(f.type === 'doel' && b.rol === 'doel')).map((b) => `
              <div class="db-blok" data-plek="${b.plek}">
                ${les.groepen.length > 1 ? `<p class="db-wie">${b.groepen.map(groepNaam).map(escape).join(' + ')} · ${PLEK[b.plek]}</p>` : ''}
                <p class="db-wat">${escape(VOOR_LEERLING[b.rol] ?? '')}</p>
                ${b.werkvorm ? `<p class="db-werkvorm">${escape(b.werkvorm.naam)}</p>` : ''}
              </div>`).join('')}
          </div>
        </div>`;
    }

    function laagHtml() {
      if (staat.laag === 'route') {
        const plekken = [...new Set(les.fases.flatMap((f) => f.blokken.map((b) => b.plek)))];
        return `<div class="db-laag" role="dialog" aria-label="Routeschema"><h2>Wie is waar?</h2>
          <table><thead><tr><th>Minuut</th>${plekken.map((p) => `<th>${PLEK[p].replace('in het ', '').replace('op het ', '').replace('in de ', '')}</th>`).join('')}</tr></thead>
          <tbody>${les.fases.map((f, i) => `<tr class="${i === staat.i ? 'nu' : ''}"><td>${f.start}–${f.start + f.duur}</td>${plekken.map((p) => `<td>${f.blokken.filter((b) => b.plek === p).map((b) => `${b.groepen.map(groepNaam).map(escape).join(' + ')}`).join('<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>
          <p class="db-hint">Druk op R of Esc om te sluiten.</p></div>`;
      }
      if (staat.laag === 'kiezer') {
        const groepen = les.groepen.length > 1 ? les.groepen.map((g) => g.id) : null;
        return `<div class="db-laag" role="dialog" aria-label="Willekeurige kiezer"><h2>Willekeurige kiezer</h2>
          <div class="db-kiezer"><output id="dbKeuze" aria-live="assertive">?</output></div>
          <div class="db-knoppen">
            <button type="button" data-db="kies-nummer">Kies een nummer (1–${les.aantal})</button>
            ${groepen ? `<button type="button" data-db="kies-groep">Kies een groep</button>` : ''}
            <button type="button" data-db="kies-reset">Opnieuw beginnen</button>
          </div>
          <p class="db-hint">Elk nummer komt één keer aan de beurt. K of Esc sluit.</p></div>`;
      }
      if (staat.laag === 'groepjes') {
        return `<div class="db-laag" role="dialog" aria-label="Groepjesmaker"><h2>Groepjes maken</h2>
          <div class="db-knoppen">
            ${[2, 3, 4, 5].map((n) => `<button type="button" data-db="groepjes" data-n="${n}">Groepjes van ${n}</button>`).join('')}
          </div>
          <details class="db-namen"><summary>Namen gebruiken (optioneel)</summary>
            <label for="dbNamen">Eén naam per regel. Deze namen worden nergens bewaard en verdwijnen als je dit venster sluit.</label>
            <textarea id="dbNamen" rows="5" autocomplete="off"></textarea>
          </details>
          <div id="dbGroepjes" class="db-groepjes"></div>
          <p class="db-hint">G of Esc sluit.</p></div>`;
      }
      return '';
    }

    const pagina = () => `
      <div class="db" tabindex="-1" id="db">
        <header class="db-kop">
          <p class="db-lesdoel">${doel ? `Lesdoel: ${escape(doel)}` : escape(les.doel.onderwerp || '')}</p>
          <div class="db-geluid" role="group" aria-label="Geluidsniveau">
            ${GELUID.map(([k, l, i]) => `<button type="button" data-db="geluid" data-geluid="${k}" aria-pressed="${staat.geluid === k}" class="g-${k}"><span aria-hidden="true">${i}</span> ${l}</button>`).join('')}
          </div>
        </header>
        <main class="db-midden">
          <div id="dbFase">${faseHtml()}</div>
          <aside class="db-timer">
            <output id="dbTijd" class="${staat.rest < 0 ? 'over' : ''}" aria-live="off">${mmss(staat.rest)}</output>
            <div class="db-balk"><span id="dbBalk" style="width:${Math.max(0, Math.min(100, (staat.rest / (les.fases[staat.i].duur * 60)) * 100))}%"></span></div>
            <button type="button" data-db="timer" class="db-groot">${staat.loopt ? 'Pauze' : 'Start'}</button>
            <button type="button" data-db="timer-reset">Opnieuw</button>
          </aside>
        </main>
        <footer class="db-voet">
          <button type="button" data-db="vorige" ${staat.i === 0 ? 'disabled' : ''} aria-label="Vorige fase">←</button>
          <button type="button" data-db="volgende" ${staat.i === les.fases.length - 1 ? 'disabled' : ''} aria-label="Volgende fase">→</button>
          <button type="button" data-db="route">Wie is waar (R)</button>
          <button type="button" data-db="kiezer">Kiezer (K)</button>
          <button type="button" data-db="groepjes-open">Groepjes (G)</button>
          <button type="button" data-db="scherm">Volledig scherm (F)</button>
          <a href="#les-maken" class="db-sluit">Sluiten (Esc)</a>
        </footer>
        ${laagHtml()}
      </div>`;

    return {
      titel: 'Digibord',
      html: html`${raw(pagina())}`,
      na(root) {
        let klok = null;
        let ctx = null;
        const piep = () => {
          if (!staat.geluidAan) return;
          try {
            ctx ??= new (window.AudioContext || window.webkitAudioContext)();
            [0, 0.35].forEach((t, i) => {
              const o = ctx.createOscillator(); const g = ctx.createGain();
              o.type = 'sine'; o.frequency.value = i ? 660 : 880;
              g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
              g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + t + 0.03);
              g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.6);
              o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.65);
            });
          } catch { /* geen geluid mogelijk */ }
        };
        const werkTimerBij = () => {
          const t = $('#dbTijd', root); if (!t) return;
          t.textContent = mmss(staat.rest);
          t.classList.toggle('over', staat.rest < 0);
          const b = $('#dbBalk', root);
          if (b) b.style.width = `${Math.max(0, Math.min(100, (staat.rest / (les.fases[staat.i].duur * 60)) * 100))}%`;
        };
        const teken = () => { root.innerHTML = pagina(); $('#db', root).focus({ preventScroll: true }); };
        const stopKlok = () => { clearInterval(klok); klok = null; staat.loopt = false; };
        const startKlok = () => {
          staat.loopt = true; staat.geluidAan = true;
          klok = setInterval(() => {
            staat.rest--;
            if (staat.rest === 0) piep();
            werkTimerBij();
            if (!document.getElementById('db')) clearInterval(klok); // pagina verlaten
          }, 1000);
        };
        const naarFase = (i) => { stopKlok(); staat.i = Math.max(0, Math.min(les.fases.length - 1, i)); staat.rest = les.fases[staat.i].duur * 60; teken(); };
        const laag = (naam) => { staat.laag = staat.laag === naam ? null : naam; teken(); };
        const scherm = () => {
          const el = document.documentElement;
          if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
          else el.requestFullscreen?.().catch(() => {});
        };
        const kiesNummer = () => {
          const alle = Array.from({ length: les.aantal }, (_, i) => i + 1).filter((n) => !staat.kiezerGehad.includes(n));
          if (!alle.length) { staat.kiezerGehad = []; return kiesNummer(); }
          const n = alle[Math.floor(Math.random() * alle.length)];
          staat.kiezerGehad.push(n);
          $('#dbKeuze', root).textContent = String(n);
        };
        const kiesGroep = () => {
          const g = les.groepen[Math.floor(Math.random() * les.groepen.length)];
          $('#dbKeuze', root).textContent = g.naam.split(' · ')[0];
        };
        const maakGroepjes = (n) => {
          const namen = ($('#dbNamen', root)?.value ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
          const lijst = namen.length ? [...namen] : Array.from({ length: les.aantal }, (_, i) => String(i + 1));
          for (let i = lijst.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [lijst[i], lijst[j]] = [lijst[j], lijst[i]]; }
          const aantal = Math.max(1, Math.round(lijst.length / n));
          const groepen = Array.from({ length: aantal }, () => []);
          lijst.forEach((x, i) => groepen[i % aantal].push(x));
          $('#dbGroepjes', root).innerHTML = groepen.map((g, i) => `<div><b>Groepje ${i + 1}</b><span>${g.map(escape).join(', ')}</span></div>`).join('');
        };

        root.addEventListener('click', (e) => {
          const k = e.target.closest('[data-db]'); if (!k) return;
          const a = k.dataset.db;
          if (a === 'volgende') naarFase(staat.i + 1);
          else if (a === 'vorige') naarFase(staat.i - 1);
          else if (a === 'timer') { staat.loopt ? stopKlok() : startKlok(); k.textContent = staat.loopt ? 'Pauze' : 'Start'; }
          else if (a === 'timer-reset') { stopKlok(); staat.rest = les.fases[staat.i].duur * 60; teken(); }
          else if (a === 'geluid') { staat.geluid = k.dataset.geluid; opslag.schrijf('digibord-geluid', staat.geluid); for (const b of root.querySelectorAll('[data-db="geluid"]')) b.setAttribute('aria-pressed', String(b === k)); }
          else if (a === 'route') laag('route');
          else if (a === 'kiezer') laag('kiezer');
          else if (a === 'groepjes-open') laag('groepjes');
          else if (a === 'scherm') scherm();
          else if (a === 'kies-nummer') kiesNummer();
          else if (a === 'kies-groep') kiesGroep();
          else if (a === 'kies-reset') { staat.kiezerGehad = []; $('#dbKeuze', root).textContent = '?'; }
          else if (a === 'groepjes') maakGroepjes(Number(k.dataset.n));
        });
        const toets = (e) => {
          if (!document.getElementById('db')) { window.removeEventListener('keydown', toets); stopKlok(); return; }
          if (e.target.matches('textarea, input')) { if (e.key === 'Escape') e.target.blur(); return; }
          const k = e.key.toLowerCase();
          if (k === 'arrowright' || k === 'pagedown') { e.preventDefault(); naarFase(staat.i + 1); }
          else if (k === 'arrowleft' || k === 'pageup') { e.preventDefault(); naarFase(staat.i - 1); }
          else if (k === ' ') { e.preventDefault(); staat.loopt ? stopKlok() : startKlok(); const b = root.querySelector('[data-db="timer"]'); if (b) b.textContent = staat.loopt ? 'Pauze' : 'Start'; }
          else if (k === '1' || k === '2' || k === '3') { const b = root.querySelector(`[data-geluid="${GELUID[Number(k) - 1][0]}"]`); b?.click(); }
          else if (k === 'r') laag('route');
          else if (k === 'k') laag('kiezer');
          else if (k === 'g') laag('groepjes');
          else if (k === 'f') scherm();
          else if (k === 'escape') { if (staat.laag) laag(staat.laag); else { stopKlok(); location.hash = 'les-maken'; } }
        };
        window.addEventListener('keydown', toets);
        $('#db', root).focus({ preventScroll: true });
      }
    };
  }
};
