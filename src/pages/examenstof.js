// Examenstof: alle kerndoelen, leerdoelenkaarten, examenprogramma's en syllabi van SLO doorzoeken en bekijken,
// voor vmbo, mavo, havo en vwo. Vanuit hier koppel je een eindterm aan een les of maak je er een opgave op niveau bij.
import { html, raw } from '../util/html.js';
import { laadKaderIndex, laadVak, vlak, SOORT_NAAM } from '../data/kaders.js';
import { laadDocent, laadConcept, bewaarConcept } from '../wizard/staat.js';
import * as opslag from '../opslag/opslag.js';
import { laadIndex } from '../data/laden.js';
import { laadKlas, klasInfo } from '../data/klas.js';
import { kinderenVan } from '../data/stof.js';
import { maakMateriaalBeheer, laadSectieMateriaal } from '../examen/materiaalpaneel.js';

const NIVEAUS = [['', 'Alle niveaus'], ['onderbouw', 'Onderbouw (kerndoelen)'], ['vmbo-bb', 'vmbo basis'], ['vmbo-kb', 'vmbo kader'], ['vmbo-gltl', 'vmbo gl/tl (mavo)'], ['havo', 'havo'], ['vwo', 'vwo']];
const NIVEAU_NAAM = Object.fromEntries(NIVEAUS);
const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const MAX_TREFFERS = 150;

/** Zoekt in de regels van één kader; alle zoekwoorden moeten voorkomen (in tekst, toelichting of vakbegrippen). */
export function zoekInKader(kader, info, woorden) {
  if (!woorden.length) return [];
  return vlak(kader).filter((r) => {
    const t = norm([r.code, r.tekst, r.d, ...r.toel, ...r.begrippen].join(' '));
    return woorden.every((w) => t.includes(w));
  }).map((r) => ({ ...r, info }));
}

export default {
  async render({ profiel }) {
    const [index, werkvormIndex, sectie] = await Promise.all([laadKaderIndex(), laadIndex(), laadSectieMateriaal()]);
    const docent = laadDocent(profiel);
    // Startvak en -niveau: die van je klas in de werkplek, anders je eerste vak dat SLO kent, anders Nederlands
    const klas = opslag.lees('klas', null) ? laadKlas(profiel, docent) : null;
    const startVak = index.vakken.find((v) => v.uniekind.includes(klas?.vak))?.naam ?? index.vakken.find((v) => v.uniekind.some((u) => (docent.vakken ?? []).includes(u)))?.naam ?? 'Nederlands';
    const startNiveau = klas ? (klasInfo(profiel, klas).niveau ?? '') : '';
    const staat = { vak: startVak, niveau: startNiveau, soort: '', concept: false, zoek: '', overal: false, open: new Set(), ...(opslag.lees('examenstof-staat', {}) ?? {}) };
    staat.open = new Set(staat.open ?? []);
    const vakCache = new Map();
    let laden = false;
    let overalTreffers = null;

    const vakInfo = () => index.vakken.find((v) => v.naam === staat.vak) ?? index.vakken[0];
    const passend = (k) => (!staat.niveau || k.niveaus.includes(staat.niveau) || k.niveaus.includes('alle'))
      && (!staat.soort || k.soort === staat.soort) && (staat.concept || k.status === 'geldend');
    const kadersVanVak = () => index.kaders.filter((k) => k.sloVak === staat.vak && passend(k));
    const woorden = () => norm(staat.zoek).split(/\s+/).filter((w) => w.length > 1);

    const beheer = maakMateriaalBeheer({
      profiel, werkvormen: werkvormIndex.items, sectie,
      context: (r) => {
        const info = r?.info;
        const niv = staat.niveau && info?.niveaus.includes(staat.niveau) ? staat.niveau : info?.niveaus.find((n) => NIVEAU_NAAM[n] && n !== 'onderbouw') ?? null;
        const vakId = index.vakken.find((x) => x.naam === info?.sloVak)?.uniekind.find((u) => profiel.vakken.some((p) => p.id === u)) ?? null;
        return { vakNaam: info?.sloVak ?? staat.vak, niveauNaam: niv ? NIVEAU_NAAM[niv] : info?.niveaus.includes('onderbouw') ? 'onderbouw' : '', niveau: niv, examen: ['examenprogramma', 'syllabus', 'keuzevakken'].includes(info?.soort), vakId, klas: null };
      }
    });
    const regel = (r, metKader = false) => html`<li class="es-regel" style="--d:${r.diepte ?? 0}">
      <div class="es-tekst">
        ${metKader ? html`<span class="hulp">${r.info.sloVak} · ${r.info.titel}</span>` : ''}
        <span>${r.code ? html`<b>${r.code}</b> ` : ''}${r.kop ? html`<i>${r.kop}.</i> ` : ''}${r.tekst}${r.ce ? html` <span class="et-tag">CE</span>` : ''}${r.se && !r.ce ? html` <span class="et-tag">SE</span>` : ''}${r.d ? html` <span class="hulp">(${r.d})</span>` : ''}</span>
        ${r.toel.length || r.begrippen.length ? html`<details class="et-extra"><summary>${[r.toel.length ? 'Toelichting' : '', r.begrippen.length ? 'vakbegrippen' : ''].filter(Boolean).join(' en ')}</summary>${r.toel.map((t) => html`<p>${t}</p>`)}${r.begrippen.length ? html`<p><b>Vakbegrippen:</b> ${r.begrippen.join(' · ')}</p>` : ''}</details>` : ''}
      </div>
      <span class="es-acties">
        <button type="button" class="knop ${beheer.isOpen(r.sleutel) ? '' : 'secundair'} klein" data-actie="es-materiaal" data-sleutel="${r.sleutel}" data-kader="${r.info.id}" aria-expanded="${beheer.isOpen(r.sleutel)}">Materiaal</button>
        ${!r.heeftKinderen ? html`<button type="button" class="knop secundair klein" data-actie="in-les" data-sleutel="${r.sleutel}" data-kader="${r.info.id}">In een les</button>
        <button type="button" class="knop secundair klein" data-actie="naar-opgave" data-sleutel="${r.sleutel}" data-kader="${r.info.id}">Opgave op niveau</button>` : ''}
      </span>
    </li>${beheer.isOpen(r.sleutel) ? html`<li class="ws-paneel-rij">${raw(String(beheer.html()))}</li>` : ''}`;

    const pagina = () => {
      const v = vakInfo();
      const bestand = vakCache.get(v.bestand);
      const kaders = kadersVanVak();
      const w = woorden();
      const filterTekst = [staat.niveau ? NIVEAU_NAAM[staat.niveau] : '', staat.soort ? SOORT_NAAM[staat.soort].toLowerCase() : ''].filter(Boolean).map((x) => ` (${x})`).join('');
      const treffers = bestand && w.length ? kaders.flatMap((k) => zoekInKader(bestand.kaders[k.id], k, w)) : [];
      return html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Stof en materiaal</p>
          <h1>Alle stof, alle vakken, alle niveaus</h1>
          <p class="lead">Alles wat SLO beschrijft voor vmbo, mavo, havo en vwo: ${index.kaders.length} kaders in ${index.vakken.length} vakken, van kerndoelen tot syllabi en beroepsgerichte keuzevakken. Bij elk onderwerp vind of maak je materiaal, maak je een les of een opgave op niveau.</p>
          <div class="inhoudsopgave"><a class="knop klein" href="#examenstof" aria-current="page">Zoeken en bekijken</a><a class="knop secundair klein" href="#examenopgave">Opgave op niveau</a><a class="knop secundair klein" href="#materiaal">Bewaard materiaal</a></div>
        </div></section>
        <main class="wrap examenstof">
          <form class="es-filters" id="esForm" role="search" aria-label="Zoek in de examenstof">
            <div class="veld"><label for="esVak">Vak</label><select id="esVak" data-es="vak">${index.vakken.map((x) => html`<option value="${x.naam}" ${x.naam === staat.vak ? 'selected' : ''}>${x.naam}</option>`)}</select></div>
            <div class="veld"><label for="esNiveau">Niveau</label><select id="esNiveau" data-es="niveau">${NIVEAUS.map(([k, n]) => html`<option value="${k}" ${k === staat.niveau ? 'selected' : ''}>${n}</option>`)}</select></div>
            <div class="veld"><label for="esSoort">Soort</label><select id="esSoort" data-es="soort">${[['', 'Alles'], ...Object.entries(SOORT_NAAM)].map(([k, n]) => html`<option value="${k}" ${k === staat.soort ? 'selected' : ''}>${n}</option>`)}</select></div>
            <div class="veld es-zoek"><label for="esZoek">Zoek</label><input type="search" id="esZoek" data-es="zoek" value="${staat.zoek}" placeholder="Bijvoorbeeld: inflatie, grafiek, bronnen"></div>
            <label class="schakel"><input type="checkbox" data-es="concept" ${staat.concept ? 'checked' : ''}> <span>Ook nieuwe en conceptprogramma's tonen</span></label>
          </form>

          ${w.length ? html`
            <section class="sectie" aria-live="polite">
              <h2>${treffers.length ? `${Math.min(treffers.length, MAX_TREFFERS)}${treffers.length > MAX_TREFFERS ? '+' : ''} treffers in ${staat.vak}${filterTekst}` : bestand ? `Niets gevonden in ${staat.vak}${filterTekst}` : 'Zoeken…'}</h2>
              ${!treffers.length && bestand && (staat.niveau || staat.soort || !staat.concept) ? html`<p class="hulp">Probeer "Alle niveaus" of zet de conceptprogramma's aan.</p>` : ''}
              ${treffers.length ? html`<ul class="es-lijst">${treffers.slice(0, MAX_TREFFERS).map((r) => regel({ ...r, diepte: 0 }, true))}</ul>` : ''}
              <div class="knoppen klein-boven"><button type="button" class="knop secundair klein" data-actie="overal" ${laden ? 'disabled' : ''}>${laden ? 'Alle vakken worden geladen…' : `Zoek in alle vakken${filterTekst}`}</button></div>
              ${overalTreffers ? html`<h3 class="klein-kop">${overalTreffers.length ? `In alle vakken${filterTekst}: ${Math.min(overalTreffers.length, MAX_TREFFERS)}${overalTreffers.length > MAX_TREFFERS ? '+' : ''} treffers` : `In alle vakken${filterTekst}: niets gevonden`}</h3>
                <ul class="es-lijst">${overalTreffers.slice(0, MAX_TREFFERS).map((r) => regel({ ...r, diepte: 0 }, true))}</ul>` : ''}
            </section>` : ''}

          <section class="sectie">
            <h2>${staat.vak}: ${kaders.length} ${kaders.length === 1 ? 'kader' : 'kaders'}</h2>
            ${!kaders.length ? html`<p class="lees">Geen kaders voor deze keuze. Kies een ander niveau of zet de conceptprogramma's aan.</p>` : ''}
            <div class="es-kaders">${kaders.map((k) => html`
              <details class="paneel" data-kader="${k.id}" ${staat.open.has(k.id) ? 'open' : ''}>
                <summary><span>${k.titel}</span>
                  <span class="chips"><span class="chip">${SOORT_NAAM[k.soort]}</span>${k.status !== 'geldend' ? html`<span class="chip concept">concept</span>` : ''}<span class="chip">${k.niveaus.map((n) => NIVEAU_NAAM[n] ?? (n === 'alle' ? 'alle niveaus' : n)).join(', ')}</span><span class="hulp">${k.aantal} regels</span></span></summary>
                <div class="paneel-inhoud">
                  ${staat.open.has(k.id) ? (bestand ? html`<ul class="es-lijst">${vlak(bestand.kaders[k.id]).map((r) => regel({ ...r, info: k }))}</ul>` : html`<p class="hulp">Wordt geladen…</p>`) : ''}
                  <p class="hulp et-bron">Bron: ${k.bron.naam}${k.bron.examenjaar ? `, examenjaar ${k.bron.examenjaar}` : ''}${k.bron.ingang ? `, ${k.bron.ingang}` : ''}. Open data van SLO (licentie MIT), versie ${k.bron.versie ?? 'onbekend'}.${k.bron.url ? html` <a href="${k.bron.url}" target="_blank" rel="noopener noreferrer">Officiële tekst</a>` : ''}</p>
                </div>
              </details>`)}</div>
          </section>
        </main>`;
    };

    return {
      titel: 'Stof en materiaal',
      html: pagina(),
      na(root) {
        const bewaar = () => opslag.schrijf('examenstof-staat', { ...staat, open: [...staat.open] });
        const teken = () => {
          const y = window.scrollY;
          const actief = document.activeElement?.id;
          root.innerHTML = String(pagina());
          window.scrollTo(0, y);
          if (actief) document.getElementById(actief)?.focus({ preventScroll: true });
          zorg();
        };
        // Het bestand van het gekozen vak laden zodra het nodig is
        const zorg = () => {
          const v = vakInfo();
          if (vakCache.has(v.bestand) || laden) return;
          if (!staat.open.size && !woorden().length) return;
          laadVak(v.bestand).then((f) => { vakCache.set(v.bestand, f); teken(); });
        };
        let timer;
        let laatst = null;
        root.addEventListener('input', (e) => {
          if (beheer.invoer(e.target)) return;
          if (e.target.dataset.es !== 'zoek') return;
          staat.zoek = e.target.value; overalTreffers = null;
          clearTimeout(timer); timer = setTimeout(() => { bewaar(); teken(); }, 300);
        });
        root.addEventListener('change', (e) => {
          const k = e.target.dataset.es;
          if (!k || k === 'zoek') return;
          staat[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
          overalTreffers = null;
          bewaar(); teken();
        });
        root.addEventListener('submit', (e) => e.preventDefault());
        root.addEventListener('toggle', (e) => {
          const d = e.target.closest?.('details[data-kader]');
          if (!d || e.target !== d) return;
          if (d.open) staat.open.add(d.dataset.kader); else staat.open.delete(d.dataset.kader);
          bewaar();
          if (d.open && !vakCache.has(vakInfo().bestand)) zorg();
          else if (d.open && !d.querySelector('.es-lijst')) teken();
        }, true);
        root.addEventListener('click', async (e) => {
          const k = e.target.closest('[data-actie]');
          if (!k) return;
          const a = k.dataset.actie;
          if (a.startsWith('om-')) {
            const sl = laatst;
            if (await beheer.actie(k, root)) teken();
            if (a === 'om-sluit') root.querySelector(`[data-actie="es-materiaal"][data-sleutel="${CSS.escape(sl ?? '')}"]`)?.focus();
            return;
          }
          if (a === 'es-materiaal') {
            if (beheer.isOpen(k.dataset.sleutel)) { beheer.sluit(); return teken(); }
            const info = index.kaders.find((x) => x.id === k.dataset.kader);
            const f = vakCache.get(info.bestand) ?? await laadVak(info.bestand).then((x) => { vakCache.set(info.bestand, x); return x; });
            const regels = vlak(f.kaders[info.id]).map((x) => ({ ...x, info }));
            const r = regels.find((x) => x.sleutel === k.dataset.sleutel);
            if (!r) return;
            beheer.open(r, kinderenVan(regels, r));
            laatst = r.sleutel;
            teken();
            { const el = root.querySelector('#omPaneel'); el?.focus({ preventScroll: true }); el?.scrollIntoView({ block: 'start' }); }
            return;
          }
          if (a === 'overal') {
            laden = true; teken();
            const w = woorden();
            const alle = [];
            for (const v of index.vakken) {
              const f = vakCache.get(v.bestand) ?? await laadVak(v.bestand).then((x) => { vakCache.set(v.bestand, x); return x; });
              for (const info of index.kaders.filter((x) => x.bestand === v.bestand && passend(x))) alle.push(...zoekInKader(f.kaders[info.id], info, w));
              if (alle.length > MAX_TREFFERS * 2) break;
            }
            overalTreffers = alle; laden = false; teken();
            return;
          }
          if (a === 'in-les' || a === 'naar-opgave') {
            const info = index.kaders.find((x) => x.id === k.dataset.kader);
            const f = vakCache.get(info.bestand) ?? await laadVak(info.bestand);
            const r = vlak(f.kaders[info.id]).find((x) => x.sleutel === k.dataset.sleutel);
            if (!r) return;
            const gekozen = { sleutel: r.sleutel, kader: info.id, kaderTitel: info.titel, code: r.code, tekst: r.tekst };
            if (a === 'naar-opgave') {
              opslag.schrijf('examenopgave', { ...(opslag.lees('examenopgave', {}) ?? {}), eindtermen: [gekozen], sloVak: info.sloVak });
              location.hash = 'examenopgave';
              return;
            }
            const concept = laadConcept(profiel, laadDocent(profiel));
            const inh = concept.invoer.inhoud;
            inh.eindtermen = [...(inh.eindtermen ?? []).filter((g) => g.sleutel !== gekozen.sleutel), gekozen];
            const vak = vakInfo().uniekind.find((u) => profiel.vakken.some((x) => x.id === u));
            if (vak) concept.invoer.context.vak = vak;
            concept.kader = { id: info.id, open: true };
            bewaarConcept(concept);
            location.hash = 'les-maken';
          }
        });
        zorg();
      }
    };
  }
};
