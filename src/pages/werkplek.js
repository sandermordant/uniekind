// De werkplek: één plek per soort klas. Eindexamenklas (vmbo 4, havo 5, vwo 6) of een andere klas.
// Kies één keer afdeling, leerjaar en vak; daarna zie je alle stof voor die klas (examenprogramma met syllabus,
// keuzevakken, kerndoelen, leerdoelenkaart), wat al in je lessen zat, en bij elk onderwerp het materiaal.
import { html, raw } from '../util/html.js';
import { laadKaderIndex, laadVak, SOORT_NAAM } from '../data/kaders.js';
import { laadIndex } from '../data/laden.js';
import { laadDocent, nieuwConcept, bewaarConcept } from '../wizard/staat.js';
import { MODUS, laadKlas, bewaarKlas, leerjarenVoor, vakkenVoor, klasInfo, examenjaar } from '../data/klas.js';
import { onderdelenVoor, stofRegels, kinderenVan, isOnderwerp } from '../data/stof.js';
import { dekking } from '../opslag/logboek.js';
import { NIVEAU_NAAM } from '../examen/opgave.js';
import { maakMateriaalBeheer, laadSectieMateriaal, mijnMateriaal } from '../examen/materiaalpaneel.js';
import * as opslag from '../opslag/opslag.js';

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const MAX_FILTER = 200;

export default {
  async render({ profiel }, modusArg) {
    const modus = modusArg === 'examen' ? 'examen' : 'regulier';
    const M = MODUS[modus];
    const docent = laadDocent(profiel);
    const opgeslagen = opslag.lees('klas', null);
    let klas = laadKlas(profiel, docent, { ...(opgeslagen ?? {}), modus });
    bewaarKlas(klas);
    const [index, werkvormIndex, sectie] = await Promise.all([laadKaderIndex(), laadIndex(), laadSectieMateriaal()]);
    const vakCache = new Map();
    const v = { onderdeel: opgeslagen?.onderdeel ?? null, zoek: '', nogNiet: false, open: new Set(opslag.lees('werkplek-open', []) ?? []) };

    const info = () => klasInfo(profiel, klas);
    const onderdelen = () => { const i = info(); return onderdelenVoor(index, { vak: klas.vak, afdeling: i.afd, leerjaar: klas.leerjaar, modus }); };
    const huidigOnderdeel = () => { const l = onderdelen(); return l.find((o) => o.id === v.onderdeel) ?? l[0] ?? null; };
    const kaderVan = (k) => vakCache.get(k.bestand)?.kaders?.[k.id];
    const geladen = (o) => o.kaders.every((k) => vakCache.has(k.bestand));
    const behandeld = () => new Set(dekking().flatMap((k) => k.regels.map((r) => r.sleutel)));

    const beheer = maakMateriaalBeheer({
      profiel, werkvormen: werkvormIndex.items, sectie,
      context: () => { const i = info(); return { vakNaam: i.vakNaam, niveauNaam: i.niveau ? `${NIVEAU_NAAM[i.niveau] ?? i.niveau}, leerjaar ${klas.leerjaar}` : i.naam, niveau: i.niveau, examen: modus === 'examen', vakId: klas.vak, klas }; }
    });

    const regelHtml = (r, gedaan, regels) => {
      if (r.kopje) return html`<li class="ws-kopje" style="--d:${r.diepte}">${r.tekst}</li>`;
      const aan = beheer.isOpen(r.sleutel);
      const nOnder = r.heeftKinderen ? kinderenVan(regels, r).filter(isOnderwerp).length : 0;
      return html`<li class="es-regel ${gedaan.has(r.sleutel) ? 'ws-gedaan' : ''}" style="--d:${r.diepte}" data-regel="${r.sleutel}">
        <div class="es-tekst">
          <span>${r.code ? html`<b>${r.code}</b> ` : ''}${r.kop ? html`<i>${r.kop}.</i> ` : ''}${r.tekst}${r.ce ? html` <span class="et-tag">CE</span>` : ''}${r.se && !r.ce ? html` <span class="et-tag">SE</span>` : ''}${r.d ? html` <span class="hulp">(${r.d})</span>` : ''}${gedaan.has(r.sleutel) ? html` <span class="ws-vink">in een les</span>` : ''}</span>
          ${r.toel.length || r.begrippen.length ? html`<details class="et-extra"><summary>${[r.toel.length ? 'Toelichting' : '', r.begrippen.length ? 'vakbegrippen' : ''].filter(Boolean).join(' en ')}</summary>${r.toel.map((t) => html`<p>${t}</p>`)}${r.begrippen.length ? html`<p><b>Vakbegrippen:</b> ${r.begrippen.join(' · ')}</p>` : ''}</details>` : ''}
        </div>
        <span class="es-acties"><button type="button" class="knop ${aan ? '' : 'secundair'} klein" data-actie="ws-materiaal" data-sleutel="${r.sleutel}" aria-expanded="${aan}">${r.heeftKinderen ? `Materiaal (${nOnder})` : 'Materiaal'}</button></span>
      </li>${aan ? html`<li class="ws-paneel-rij">${raw(String(beheer.html()))}</li>` : ''}`;
    };

    const stofHtml = (o, regels) => {
      const gedaan = behandeld();
      const onderwerpen = regels.filter(isOnderwerp);
      const klaar = onderwerpen.filter((r) => gedaan.has(r.sleutel)).length;
      const w = norm(v.zoek).split(/\s+/).filter((x) => x.length > 1);
      const pct = onderwerpen.length ? Math.round((klaar / onderwerpen.length) * 100) : 0;
      const voortgang = html`<div class="ws-voortgang"><div class="voortgang" role="img" aria-label="${klaar} van ${onderwerpen.length} onderwerpen kwamen al in een les"><span style="width:${pct}%"></span></div>
        <p class="hulp">${onderwerpen.length} onderwerpen${klaar ? `, waarvan ${klaar} al in je lessen` : ''}. Een onderwerp telt mee zodra je het koppelt aan een les die je maakt.</p></div>`;
      if (w.length || v.nogNiet) {
        const treffers = regels.filter((r) => !r.kopje && (!v.nogNiet || (isOnderwerp(r) && !gedaan.has(r.sleutel)))
          && w.every((x) => norm([r.code, r.tekst, r.d, ...r.toel, ...r.begrippen].join(' ')).includes(x)));
        return html`${voortgang}<h3 class="klein-kop" aria-live="polite">${treffers.length ? `${Math.min(treffers.length, MAX_FILTER)}${treffers.length > MAX_FILTER ? '+' : ''} ${treffers.length === 1 ? 'onderwerp' : 'onderwerpen'}` : 'Niets gevonden'}${w.length ? ` met "${v.zoek.trim()}"` : ''}${v.nogNiet ? ' dat nog niet in een les zat' : ''}</h3>
          <ul class="es-lijst">${treffers.slice(0, MAX_FILTER).map((r) => regelHtml({ ...r, diepte: 0 }, gedaan, regels))}</ul>`;
      }
      // Per domein inklapbaar; de rest van de regels hangt eronder
      const groepen = [];
      for (const r of regels) {
        if (r.diepte === 0) groepen.push({ kop: r, rest: [] });
        else if (groepen.length) groepen.at(-1).rest.push(r);
        else groepen.push({ kop: null, rest: [r] });
      }
      return html`${voortgang}<div class="ws-domeinen">${groepen.map((g) => {
        const sl = g.kop?.sleutel ?? 'los';
        const ow = [g.kop, ...g.rest].filter((r) => r && isOnderwerp(r));
        const n = ow.filter((r) => gedaan.has(r.sleutel)).length;
        const isOpen = v.open.has(sl) || g.rest.some((r) => beheer.isOpen(r.sleutel)) || (g.kop && beheer.isOpen(g.kop.sleutel));
        if (!g.rest.length && g.kop && !g.kop.kopje) return html`<ul class="es-lijst ws-los">${regelHtml(g.kop, gedaan, regels)}</ul>`;
        return html`<details class="paneel ws-domein" data-groep="${sl}" ${isOpen ? 'open' : ''}>
          <summary><span>${g.kop ? html`${g.kop.code ? html`<b>${g.kop.code}</b> ` : ''}${g.kop.tekst}` : 'Overig'}</span><span class="hulp">${ow.length} ${ow.length === 1 ? 'onderwerp' : 'onderwerpen'}${n ? `, ${n} in je lessen` : ''}</span></summary>
          <div class="paneel-inhoud"><ul class="es-lijst">${g.kop && !g.kop.kopje ? regelHtml({ ...g.kop, tekst: `Het hele domein: ${g.kop.tekst.replace(/^Domein\s*[A-Z0-9]+\s*[:.]?\s*/i, '')}`, code: '', toel: [], begrippen: [], d: '' }, gedaan, regels) : ''}${g.rest.map((r) => regelHtml(r, gedaan, regels))}</ul></div>
        </details>`;
      })}</div>`;
    };

    const pagina = () => {
      const i = info();
      const jaren = leerjarenVoor(i.afd, modus);
      const lijst = onderdelen();
      const o = huidigOnderdeel();
      const regels = o && geladen(o) ? stofRegels(o, kaderVan) : null;
      const eigen = mijnMateriaal().length;
      return html`
        <section class="band band-klein ws-band"><div class="wrap">
          <p class="eyebrow">${M.naam}</p>
          <h1>${modus === 'examen' ? 'Je eindexamenklas' : 'Je klas'}${i.vakNaam ? `: ${i.vakNaam}, ${i.naam}` : ''}</h1>
          <p class="lead">${modus === 'examen'
            ? 'Alle examenstof op één plek: het examenprogramma met de syllabus van het centraal examen eronder, en wat je al hebt behandeld. Bij elk onderwerp maak je een les, een opgave op niveau of materiaal.'
            : 'Alle stof voor deze klas op één plek: de kerndoelen, de onderwerpen uit de leerdoelenkaart en, in de bovenbouw, het examenprogramma. Bij elk onderwerp maak je een les of materiaal.'}</p>
          <form class="ws-klas" aria-label="Kies je klas">
            <div class="veld"><label for="wsAfd">Afdeling</label><select id="wsAfd" data-klas="afdeling">${profiel.afdelingen.filter((a) => leerjarenVoor(a, modus).length).map((a) => html`<option value="${a.id}" ${a.id === klas.afdeling ? 'selected' : ''}>${a.naam}</option>`)}</select></div>
            ${modus === 'examen'
              ? html`<div class="veld"><span class="label" id="wsJaarLabel">Leerjaar</span><p class="ws-vast" aria-labelledby="wsJaarLabel">${i.afd.naam} ${examenjaar(i.afd)} (examenjaar)</p></div>`
              : html`<div class="veld"><label for="wsJaar">Leerjaar</label><select id="wsJaar" data-klas="leerjaar">${jaren.map((j) => html`<option value="${j}" ${j === klas.leerjaar ? 'selected' : ''}>${i.afd.naam} ${j}</option>`)}</select></div>`}
            <div class="veld"><label for="wsVak">Vak</label><select id="wsVak" data-klas="vak">${vakkenVoor(profiel, klas.afdeling).map((x) => html`<option value="${x.id}" ${x.id === klas.vak ? 'selected' : ''}>${x.naam}</option>`)}</select></div>
          </form>
          <div class="knoppen ws-knoppen">
            <button type="button" class="knop" data-actie="ws-les">Maak een les voor deze klas <span class="pijl" aria-hidden="true">→</span></button>
            ${modus === 'examen' ? html`<a class="knop secundair" href="#examenopgave" data-actie="ws-opgave">Opgave op niveau</a>` : html`<a class="knop secundair" href="#begin-hier">Begin hier: 10 werkvormen</a>`}
            <a class="knop secundair" href="#les-openen">Les openen</a>
          </div>
        </div></section>
        <main class="wrap werkplek">
          <section class="sectie">
            <h2>${modus === 'examen' ? 'Alle examenstof' : 'Alle stof'}</h2>
            ${!lijst.length ? html`<p class="lees">Voor ${i.vakNaam || 'dit vak'} heeft SLO geen kerndoelen, examenprogramma of syllabus in de open data. Je kunt gewoon <a href="#les-maken">een les maken</a> zonder koppeling, of <a href="#examenstof">zoeken in alle vakken</a>.</p>` : html`
              <div class="es-filters ws-filters">
                ${lijst.length > 1 ? html`<div class="veld"><label for="wsOnderdeel">Onderdeel</label><select id="wsOnderdeel" data-ws="onderdeel">${lijst.map((x) => html`<option value="${x.id}" ${x.id === o.id ? 'selected' : ''}>${x.titel}${x.kaders.length > 1 ? ' + syllabus' : ''} (${SOORT_NAAM[x.soort].split(' (')[0].toLowerCase()})</option>`)}</select></div>` : html`<p class="ws-vast"><b>${o.titel}</b>${o.kaders.length > 1 ? ' met de syllabus' : ''}</p>`}
                <div class="veld es-zoek"><label for="wsZoek">Zoek in deze stof</label><input type="search" id="wsZoek" data-ws="zoek" value="${v.zoek}" placeholder="Een woord of begrip"></div>
                <label class="schakel"><input type="checkbox" data-ws="nogNiet" ${v.nogNiet ? 'checked' : ''}> <span>Alleen wat nog niet in een les zat</span></label>
              </div>
              ${o.kaders.length > 1 ? html`<p class="hulp">${o.kaders.slice(1).map((k) => k.titel).join(' en ')} staat onder elk domein als "Uitwerking in de syllabus".</p>` : ''}
              ${regels ? stofHtml(o, regels) : html`<p class="hulp" aria-live="polite">De stof wordt geladen…</p>`}
              <p class="hulp et-bron">Bron: ${o.kaders.map((k) => `${k.bron.naam}${k.bron.examenjaar ? `, examenjaar ${k.bron.examenjaar}` : ''}`).join('; ')}. Open data van SLO (licentie MIT).${o.kaders[0].bron.url ? html` <a href="${o.kaders[0].bron.url}" target="_blank" rel="noopener noreferrer">Officiële tekst</a>` : ''}</p>`}
          </section>
          <section class="sectie ws-verder">
            <h2>Verder</h2>
            <div class="pijlers">
              <a class="pijler" href="#examenstof"><h3>Stof en materiaal</h3><p>Zoek in alle vakken en niveaus, ook buiten je eigen klas.</p></a>
              <a class="pijler" href="#materiaal"><h3>Bewaard materiaal</h3><p>${eigen ? `${eigen} links die je bewaarde.` : 'Links die jij en je sectie bij onderwerpen bewaren.'} Deel ze met je sectie.</p></a>
              <a class="pijler" href="#mijn-profiel"><h3>Wat al aan bod kwam</h3><p>Je lessen, je reflecties en de eindtermen die je behandelde.</p></a>
            </div>
          </section>
        </main>`;
    };

    return {
      titel: M.naam,
      html: pagina(),
      na(root) {
        const teken = (focusPaneel = false) => {
          const y = window.scrollY;
          const actief = document.activeElement?.id;
          root.innerHTML = String(pagina());
          window.scrollTo(0, y);
          if (focusPaneel) { const el = root.querySelector('#omPaneel'); el?.focus({ preventScroll: true }); el?.scrollIntoView({ block: 'start' }); }
          else if (actief) document.getElementById(actief)?.focus({ preventScroll: true });
          zorg();
        };
        const zorg = () => {
          const o = huidigOnderdeel();
          if (!o || geladen(o)) return;
          Promise.all(o.kaders.filter((k) => !vakCache.has(k.bestand)).map((k) => laadVak(k.bestand).then((f) => vakCache.set(k.bestand, f)))).then(() => teken());
        };
        const wisselKlas = () => { bewaarKlas({ ...klas, onderdeel: v.onderdeel }); beheer.sluit(); };
        let timer;
        let laatst = null;
        root.addEventListener('input', (e) => {
          if (beheer.invoer(e.target)) return;
          if (e.target.dataset.ws !== 'zoek') return;
          v.zoek = e.target.value;
          clearTimeout(timer); timer = setTimeout(() => teken(), 300);
        });
        root.addEventListener('change', (e) => {
          const t = e.target;
          if (t.dataset.klas) {
            klas = laadKlas(profiel, docent, { ...klas, [t.dataset.klas]: t.dataset.klas === 'leerjaar' ? Number(t.value) : t.value, modus });
            v.onderdeel = null; v.zoek = '';
            wisselKlas(); return teken();
          }
          if (t.dataset.ws === 'onderdeel') { v.onderdeel = t.value; wisselKlas(); return teken(); }
          if (t.dataset.ws === 'nogNiet') { v.nogNiet = t.checked; return teken(); }
        });
        root.addEventListener('submit', (e) => e.preventDefault());
        root.addEventListener('toggle', (e) => {
          const d = e.target;
          if (!d.matches?.('details[data-groep]')) return;
          if (d.open) v.open.add(d.dataset.groep); else v.open.delete(d.dataset.groep);
          opslag.schrijf('werkplek-open', [...v.open].slice(-40));
        }, true);
        root.addEventListener('click', async (e) => {
          const k = e.target.closest('[data-actie]');
          if (!k) return;
          const a = k.dataset.actie;
          if (a === 'ws-materiaal') {
            const o = huidigOnderdeel();
            const regels = stofRegels(o, kaderVan) ?? [];
            const r = regels.find((x) => x.sleutel === k.dataset.sleutel);
            if (!r) return;
            if (beheer.isOpen(r.sleutel)) { beheer.sluit(); return teken(); }
            beheer.open(r, kinderenVan(regels, r));
            laatst = r.sleutel;
            return teken(true);
          }
          if (a === 'ws-les') {
            const concept = nieuwConcept(profiel, docent);
            const afd = info().afd;
            Object.assign(concept.invoer.context, { afdeling: klas.afdeling, leerjaar: klas.leerjaar, vak: klas.vak, lesduur: afd.standaardLesduur });
            const o = huidigOnderdeel();
            if (o) concept.kader = { id: o.id, open: false };
            bewaarConcept(concept);
            location.hash = 'les-maken';
            return;
          }
          if (a === 'ws-opgave') {
            const i = info();
            const sloVak = index.vakken.find((x) => x.uniekind.includes(klas.vak))?.naam;
            const vorige = opslag.lees('examenopgave', {}) ?? {};
            opslag.schrijf('examenopgave', { ...vorige, ...(sloVak ? { sloVak } : {}), ...(sloVak && sloVak !== vorige.sloVak ? { eindtermen: [] } : {}), ...(i.niveau ? { niveau: i.niveau, bronNiveau: i.niveau } : {}) });
            return; // de link zelf navigeert
          }
          if (a.startsWith('om-')) {
            e.preventDefault();
            const opnieuw = await beheer.actie(k, root);
            if (opnieuw) teken();
            if (a === 'om-sluit') root.querySelector(`[data-actie="ws-materiaal"][data-sleutel="${CSS.escape(laatst ?? '')}"]`)?.focus();
          }
        });
        zorg();
      }
    };
  }
};
