// De lesgenerator-wizard. Zeven stappen, of de snelle modus.
import { html, $, $$ } from '../util/html.js';
import { laadAlleWerkvormen, laadTaxonomie, laadBronnenPerVak } from '../data/laden.js';
import { leesAntwoord } from '../ai/import.js';
import { genereerLes, genereerVarianten, herbereken } from '../engine/opbouw.js';
import { vindLesdoelen, vindKernbegrippen } from '../engine/tekst.js';
import * as opslag from '../opslag/opslag.js';
import { legVast, nieuwId } from '../opslag/logboek.js';
import { laadDocent, bewaarDocent, laadConcept, bewaarConcept, nieuwConcept, lees, zet, pasAanpassingenToe, generatorInvoer } from '../wizard/staat.js';
import { stapProfiel, stapContext, stapInhoud, stapKlas, stapSnel, standKiezer, doelCheck, capaciteitMelding } from '../wizard/stappen.js';
import { varianten, lesplan } from '../wizard/lesplan.js';
import { materiaalStap, exporteer, printAlles } from '../wizard/materiaalstap.js';
import { eindtermenVeld, regelBijSleutel } from '../wizard/eindtermen.js';
import { laadKaderIndex, laadKader, kadersVoor, alsLesdoel } from '../data/kaders.js';

const STAPPEN = {
  uitgebreid: [['profiel', 'Mijn profiel'], ['context', 'Lescontext'], ['inhoud', 'Inhoud'], ['klas', 'Klasbeeld'], ['varianten', 'Genereren'], ['aanpassen', 'Aanpassen'], ['materiaal', 'Materiaal']],
  snel: [['snel', 'Snel invullen'], ['varianten', 'Genereren'], ['aanpassen', 'Aanpassen'], ['materiaal', 'Materiaal']]
};
const UITLEG = {
  profiel: 'Vertel kort hoe jij lesgeeft. Uniekind bouwt daarop voort.',
  context: 'Waar en wanneer geef je de les, en aan wie?',
  inhoud: 'Wat ga je behandelen? Lesdoelen en kernbegrippen bepalen welke werkvormen passen.',
  klas: 'Hoe ziet de klas eruit? Alleen aantallen.',
  varianten: 'Drie varianten van dezelfde les, van vertrouwd tot volledig gedifferentieerd. Kies er één om aan te passen.',
  aanpassen: 'Je les staat klaar. Wil je iets anders? Klik bij dat onderdeel op Wijzig.',
  materiaal: 'Het materiaalpakket bij je les.',
  snel: 'Een les in drie minuten.'
};

export default {
  async render({ profiel }) {
    const [items, taxonomie, bronnenPerVak, kaderIndex] = await Promise.all([laadAlleWerkvormen(), laadTaxonomie(), laadBronnenPerVak().catch(() => null), laadKaderIndex().catch(() => null)]);
    const kaderCache = new Map();
    const itemMap = new Map(items.map((i) => [i.id, i]));
    const data = { profiel, items };
    let docent = laadDocent(profiel);
    let concept = laadConcept(profiel, docent);

    const inv = () => concept.invoer;
    const invoerVoorGenerator = () => generatorInvoer(concept);
    const stappen = () => STAPPEN[concept.modus] ?? STAPPEN.snel;
    // Welke wijzigpanelen in stap 3 open staan (alleen voor dit scherm, niet bewaard)
    const openWijzig = new Set();
    const matStaat = () => (concept.materiaal ??= { doc: 'lesplan', dyslexie: false, rustig: false });
    const huidigeLes = () => {
      const les = genereerLes({ ...invoerVoorGenerator(), stand: concept.gekozenStand ?? inv().stand }, data);
      return herbereken(pasAanpassingenToe(les, concept.aanpassingen), items);
    };

    function inhoudStap() {
      const s = concept.stap;
      const ctx = { profiel, concept, taxonomie, kaders: { index: kaderIndex, cache: kaderCache } };
      if (s === 'profiel') return stapProfiel(ctx);
      if (s === 'context') return stapContext(ctx);
      if (s === 'inhoud') return stapInhoud(ctx);
      if (s === 'klas') return html`${stapKlas(ctx)}${standKiezer('stand', inv().stand, 'Hoe ver wil je gaan in deze les?')}`;
      if (s === 'snel') return html`${stapSnel(ctx)}${standKiezer('stand', inv().stand, 'Hoe ver wil je gaan?')}`;
      if (s === 'varianten') return varianten(genereerVarianten(invoerVoorGenerator(), data));
      if (s === 'aanpassen') return lesplan(huidigeLes(), itemMap, { profiel, open: openWijzig });
      if (s === 'materiaal') {
        const les = huidigeLes();
        if (!concept.logId) { concept.logId = nieuwId(); bewaarConcept(concept); }
        legVast(concept.logId, les, { vak: inv().context.vak, afdeling: inv().context.afdeling });
        return html`<p class="melding zacht niet-printen">Deze les staat nu in <a href="#mijn-profiel">Mijn lessen</a>, alleen op deze computer. Kijk na de les even terug: welke werkvormen werkten? Dan houdt Uniekind daar rekening mee.</p>
          ${materiaalStap(les, { ...data, itemMap }, matStaat(), concept, bronnenPerVak)}`;
      }
      return '';
    }

    function pagina() {
      const st = stappen();
      const i = Math.max(0, st.findIndex(([k]) => k === concept.stap));
      const volgende = st[i + 1]?.[0];
      const knopTekst = volgende === 'varianten' ? 'Genereer de les' : volgende === 'aanpassen' ? 'Kies de bovenste variant' : volgende ? 'Volgende' : '';
      return html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Lesgenerator</p>
          <h1>Maak een les</h1>
          <div class="modus" role="group" aria-label="Modus">
            <button type="button" class="knop klein ${concept.modus === 'snel' ? '' : 'secundair'}" data-actie="modus" data-modus="snel" aria-pressed="${concept.modus === 'snel'}">Snel</button>
            <button type="button" class="knop klein ${concept.modus === 'uitgebreid' ? '' : 'secundair'}" data-actie="modus" data-modus="uitgebreid" aria-pressed="${concept.modus === 'uitgebreid'}">Alle zeven stappen</button>
            <button type="button" class="knop klein secundair" data-actie="nieuw">Nieuwe les</button>
          </div>
        </div></section>
        <main class="wrap wizard">
          <nav class="stapper" aria-label="Stappen">
            <ol>${st.map(([k, l], n) => html`<li><button type="button" data-actie="stap" data-stap="${k}" ${k === concept.stap ? 'aria-current="step"' : ''} class="${n < i ? 'klaar' : ''}"><span class="nr">${n + 1}</span> ${l}</button></li>`)}</ol>
          </nav>
          <form id="wizard" class="stapvak formulier-breed" novalidate>
            <h2>${st[i][1]}</h2>
            <p class="stapuitleg">${UITLEG[concept.stap]}</p>
            <div id="stapinhoud">${inhoudStap()}</div>
            <div class="stapnav niet-printen">
              ${i > 0 ? html`<button type="button" class="knop secundair" data-actie="vorige">Vorige</button>` : html`<span></span>`}
              ${knopTekst ? html`<button type="button" class="knop" data-actie="volgende">${knopTekst} <span class="pijl" aria-hidden="true">→</span></button>` : ''}
            </div>
          </form>
        </main>`;
    }

    return {
      titel: 'Maak een les',
      html: pagina(),
      na(root) {
        const bewaar = () => bewaarConcept(concept);
        const teken = (scroll = false) => {
          const y = window.scrollY;
          // focus en cursor bewaren, bijvoorbeeld tijdens het zoeken in een kader
          const actief = document.activeElement?.id;
          const sel = actief ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
          root.innerHTML = String(pagina());
          koppelDoelchecks();
          koppelSlepen();
          if (!scroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
          if (actief && !scroll) { const el = document.getElementById(actief); if (el) { el.focus({ preventScroll: true }); try { if (sel?.[0] != null) el.setSelectionRange(sel[0], sel[1]); } catch { /* geen tekstveld */ } } }
          zorgKader();
        };
        // Het voorgestelde of gekozen kader laden zodra het in beeld komt
        const laadt = new Set();
        function zorgKader() {
          if (!kaderIndex || !$('[data-paneel="eindtermen"]', root)) return;
          const c = inv().context;
          const lijst = kadersVoor(kaderIndex, { vak: c.vak, afdeling: profiel.afdelingen.find((a) => a.id === c.afdeling), leerjaar: c.leerjaar });
          const k = lijst.find((x) => x.id === concept.kader?.id) ?? lijst[0];
          if (!k || kaderCache.has(k.id) || laadt.has(k.id)) return;
          laadt.add(k.id);
          laadKader(k).then((d) => { kaderCache.set(k.id, d); laadt.delete(k.id); teken(); }).catch(() => laadt.delete(k.id));
        }
        // Gekoppelde eindtermen uit eerdere kaders ook laden, zodat "ontkoppelen" en "gebruik als lesdoel" werken
        const zorgVoorSleutel = async (sleutel) => {
          const k = kaderIndex?.kaders.find((x) => x.id === sleutel.split(':')[0]);
          if (k && !kaderCache.has(k.id)) kaderCache.set(k.id, await laadKader(k));
        };
        const gaNaar = (stap) => { concept.stap = stap; bewaar(); teken(true); $('#wizard h2', root)?.focus?.(); };
        const tax = () => inv().docent.taxonomie;
        const rtti = Object.fromEntries(taxonomie.bloom.map((b) => [b.id, b.rtti]));
        function koppelDoelchecks() {
          for (const el of $$('[data-doel]', root)) {
            const vak = $(`#doelcheck-${el.dataset.doel}`, root);
            if (vak) vak.innerHTML = doelCheck(el.value, tax(), rtti);
          }
        }
        function koppelSlepen() {
          const lijst = $('#fasen', root);
          if (!lijst) return;
          let sleep = null;
          lijst.addEventListener('dragstart', (e) => { sleep = e.target.closest('.fase')?.dataset.fase; e.dataTransfer.effectAllowed = 'move'; });
          lijst.addEventListener('dragover', (e) => { if (sleep) e.preventDefault(); });
          lijst.addEventListener('drop', (e) => {
            e.preventDefault();
            const doel = e.target.closest('.fase')?.dataset.fase;
            if (!sleep || !doel || sleep === doel) return;
            const ids = $$('.fase', lijst).map((x) => x.dataset.fase);
            ids.splice(ids.indexOf(sleep), 1);
            ids.splice(ids.indexOf(doel), 0, sleep);
            concept.aanpassingen.volgorde = ids; bewaar(); teken();
          });
        }
        const herteken = () => teken();
        // Lesdoelen en kernbegrippen uit de tekst halen (na plakken of na foto-herkenning)
        const analyseer = () => {
          const tekst = inv().inhoud.tekst ?? '';
          const doelen = vindLesdoelen(tekst);
          const bestaand = (inv().inhoud.lesdoelen ?? []).filter((d) => d.tekst?.trim());
          if (doelen.length) inv().inhoud.lesdoelen = [...bestaand, ...doelen.filter((d) => !bestaand.some((b) => b.tekst === d)).map((t) => ({ tekst: t }))];
          concept.suggesties = { ...concept.suggesties, begrippen: vindKernbegrippen(tekst) };
          if (!inv().inhoud.onderwerp) inv().inhoud.onderwerp = tekst.split('\n').find((r) => r.trim())?.trim().slice(0, 80) ?? '';
          return doelen.length;
        };
        // Eigen materiaal inlezen (Word, PowerPoint, PDF, tekst, foto): alleen de tekst komt in de les
        const leesEigen = async (bestand) => {
          if (!bestand) return;
          const st = $('#docStatus', root);
          const toon = (f, t) => { if (st) st.innerHTML = `<div class="voortgang"><span style="width:${Math.round(f * 100)}%"></span></div><p class="hulp">${t}… ${Math.round(f * 100)}%</p>`; };
          if (st) st.innerHTML = '<p class="hulp">Bezig met lezen…</p>';
          try {
            const { leesDocument } = await import('../ocr/document.js');
            const d = await leesDocument(bestand, toon);
            if (!d.tekst?.trim()) throw new Error('In dit bestand vindt Uniekind geen tekst.');
            const oud = (inv().inhoud.tekst ?? '').trim();
            inv().inhoud.tekst = oud ? `${oud}\n\n--- ${d.naam} ---\n${d.tekst}` : d.tekst;
            const n = analyseer();
            // In de snelle modus staan geen kernbegrippen: neem de eerste suggesties over als er nog geen zijn
            if (!(inv().inhoud.begrippen ?? []).length && concept.suggesties?.begrippen?.length) inv().inhoud.begrippen = concept.suggesties.begrippen.slice(0, 5);
            const woorden = d.tekst.trim().split(/\s+/).length;
            concept.docMelding = `${d.soort === 'foto' ? 'Tekst herkend in' : 'Gelezen:'} ${d.naam} (${woorden} woorden). ${n ? `${n} lesdoel${n > 1 ? 'en' : ''} gevonden. ` : ''}${(inv().inhoud.begrippen ?? []).length ? `Kernbegrippen: ${inv().inhoud.begrippen.join(', ')}. ` : ''}Controleer of het klopt; bij Maak af met AI gaat je materiaal mee als basis.`;
            if (concept.bron === 'document') concept.bron = 'tekst';
            bewaar(); teken();
          } catch (err) {
            console.error(err);
            if (st) st.innerHTML = `<p class="melding fout">${String(err.message || err).replace(/[<>&]/g, '')}</p>`;
          }
        };
        // Foto van de paragraaf herkennen
        const herkenFoto = async (bestand) => {
          if (!bestand) return;
          const st = $('#ocrStatus', root);
          const toon = (f, t) => { if (st) st.innerHTML = `<div class="voortgang"><span style="width:${Math.round(f * 100)}%"></span></div><p class="hulp">${t}… ${Math.round(f * 100)}%</p>`; };
          try {
            const { herkenTekst } = await import('../ocr/ocr.js');
            const { tekst, zekerheid } = await herkenTekst(bestand, toon);
            if (!tekst) throw new Error('Er is geen tekst gevonden. Probeer een scherpere foto.');
            inv().inhoud.tekst = tekst;
            const n = analyseer();
            concept.bron = 'tekst';
            concept.ocrMelding = `Tekst herkend (zekerheid ${zekerheid}%). ${n ? `${n} lesdoel${n > 1 ? 'en' : ''} gevonden. ` : ''}Controleer de tekst, de lesdoelen en de kernbegrippen hieronder en verbeter wat niet klopt.`;
            bewaar(); teken();
          } catch (err) {
            console.error(err);
            if (st) st.innerHTML = `<p class="melding fout">${String(err.message || err).replace(/[<>&]/g, '')}</p>`;
          }
        };

        // Velden
        function verwerkVeld(el, isChange) {
          const pad = el.dataset.pad;
          if (!pad) return;
          let w = el.value;
          if (el.dataset.type === 'getal') w = w === '' ? '' : Number(w);
          if (el.dataset.type === 'bool') w = el.type === 'checkbox' ? el.checked : el.value === 'true';
          if (pad === 'lesduurKeuze') {
            if (w !== 'vrij') inv().context.lesduur = Number(w);
            else if (lees(inv(), 'context.lesduur') && [35, 50, 70, 100].includes(Number(inv().context.lesduur))) inv().context.lesduur = Number(inv().context.lesduur) + 10;
          } else if (el.dataset.type === 'lijst') {
            const lijst = new Set(lees(pad.startsWith('docent.') ? { docent } : inv(), pad) ?? []);
            el.checked ? lijst.add(el.value) : lijst.delete(el.value);
            if (pad.startsWith('docent.')) zet({ docent }, pad, [...lijst]);
            zet(inv(), pad, [...lijst]);
          } else if (pad === 'stand') {
            inv().stand = Number(w); concept.gekozenStand = null;
          } else {
            zet(inv(), pad, w);
            if (pad.startsWith('docent.')) zet({ docent }, pad, w);
          }
          if (pad === 'docent.stand') inv().stand = Number(w);
          if (pad === 'context.afdeling') {
            const afd = profiel.afdelingen.find((a) => a.id === w);
            inv().context.leerjaar = afd.leerjaren[0];
            inv().context.lesduur = afd.standaardLesduur;
            const vakken = profiel.vakken.filter((v) => v.afdelingen === 'alle' || v.afdelingen.includes(w)).map((v) => v.id);
            if (!vakken.includes(inv().context.vak)) inv().context.vak = vakken[0];
          }
          if (pad.startsWith('docent.') || pad === 'docent.stand') bewaarDocent(docent);
          if (pad.startsWith('context.') || pad.startsWith('klas.') || pad.startsWith('inhoud.')) { concept.aanpassingen = {}; delete inv().opties.gekozen; }
          bewaar();
          if (el.dataset.doel) koppelDoelchecks();
          const cap = $('#capaciteit', root);
          if (cap) { const m = capaciteitMelding(profiel, inv().context); cap.textContent = m; cap.hidden = !m; }
          if (isChange && el.hasAttribute('data-herteken')) herteken();
        }
        let zoekTimer;
        root.addEventListener('input', (e) => {
          if (e.target.dataset.actie === 'et-zoek') { (concept.kader ??= {}).zoek = e.target.value; concept.kader.open = true; clearTimeout(zoekTimer); zoekTimer = setTimeout(() => { bewaar(); teken(); }, 250); return; }
          if (e.target.matches('[data-pad]') && e.target.type !== 'radio') verwerkVeld(e.target, false);
        });
        root.addEventListener('change', (e) => {
          const t = e.target;
          if (t.matches('[data-pad]')) return verwerkVeld(t, true);
          if (t.dataset.actie === 'et-kader') { concept.kader = { id: t.value, zoek: '', open: true }; bewaar(); return teken(); }
          if (t.dataset.actie === 'et-vink') {
            const lijst = (inv().inhoud.eindtermen ??= []);
            if (t.checked) {
              const r = regelBijSleutel(kaderCache, kaderIndex, t.value);
              if (r && !lijst.some((g) => g.sleutel === r.sleutel)) lijst.push(r);
              // vakbegrippen uit de syllabus komen bij de voorgestelde kernbegrippen
              if (r?.begrippen?.length) concept.suggesties = { ...(concept.suggesties ?? {}), begrippen: [...new Set([...(concept.suggesties?.begrippen ?? []), ...r.begrippen])] };
            }
            else inv().inhoud.eindtermen = lijst.filter((g) => g.sleutel !== t.value);
            (concept.kader ??= {}).open = true;
            bewaar(); return teken();
          }
          if (t.dataset.actie === 'kies-alt' && t.value) { inv().opties.vastgezet[t.dataset.sleutel] = t.value; bewaar(); teken(); }
          if (t.dataset.actie === 'splitsing') { inv().opties.splitsing = t.value; concept.aanpassingen = {}; bewaar(); teken(); }
          if (t.id === 'ocrBestand') return herkenFoto(t.files?.[0]);
          if (t.id === 'docBestand') return leesEigen(t.files?.[0]);
          if (t.dataset.actie === 'ai-pakket') { matStaat().aiPakket = t.value; bewaar(); return teken(); }
          if (t.dataset.actie === 'ai-laag') { matStaat().aiLaag = t.value; matStaat().aiVoorstel = null; bewaar(); teken(); $('#aiLaag', root)?.focus(); return; }
          if (t.dataset.actie === 'link') {
            const l = { titel: t.dataset.titel, url: t.dataset.url };
            concept.links = (concept.links ?? []).filter((x) => x.url !== l.url);
            if (t.checked) concept.links.push(l);
            bewaar(); return teken();
          }
          if (t.dataset.actie === 'mat-optie') { matStaat()[t.dataset.optie] = t.checked; bewaar(); return teken(); }
          if (t.dataset.actie === 'duur') { concept.aanpassingen.duur = { ...concept.aanpassingen.duur, [t.dataset.fase]: Number(t.value) }; bewaar(); teken(); }
        });
        root.addEventListener('submit', (e) => e.preventDefault());

        // Knoppen
        root.addEventListener('click', (e) => {
          const k = e.target.closest('[data-actie]');
          if (!k || k.tagName === 'SELECT' || k.type === 'radio' || k.type === 'number') return;
          const a = k.dataset.actie;
          const st = stappen();
          const i = st.findIndex(([x]) => x === concept.stap);
          if (a === 'et-weg') { inv().inhoud.eindtermen = (inv().inhoud.eindtermen ?? []).filter((g) => g.sleutel !== k.dataset.sleutel); bewaar(); return teken(); }
          if (a === 'et-doel') {
            const g = (inv().inhoud.eindtermen ?? []).find((x) => x.sleutel === k.dataset.sleutel);
            if (!g) return;
            const doelen = (inv().inhoud.lesdoelen ?? []).filter((d) => d.tekst?.trim());
            doelen.push({ tekst: alsLesdoel(g.tekst) });
            inv().inhoud.lesdoelen = doelen;
            concept.aanpassingen = {};
            bewaar(); teken();
            $(`[data-doel="${doelen.length - 1}"]`, root)?.focus();
            return;
          }
          if (a === 'stap') return gaNaar(k.dataset.stap);
          if (a === 'volgende') {
            if (concept.stap === 'varianten') { concept.gekozenStand = inv().stand; }
            return gaNaar(st[i + 1][0]);
          }
          if (a === 'vorige') return gaNaar(st[i - 1][0]);
          if (a === 'modus') { concept.modus = k.dataset.modus; concept.stap = STAPPEN[concept.modus][0][0]; bewaar(); return teken(true); }
          if (a === 'nieuw') { concept = nieuwConcept(profiel, docent); concept.modus = 'snel'; bewaar(); return teken(true); }
          if (a === 'eigen-erbij') { docent.eigenStijl = [...(docent.eigenStijl ?? []), { tekst: '', waarde: 3 }]; inv().docent.eigenStijl = docent.eigenStijl; bewaarDocent(docent); bewaar(); return teken(); }
          if (a === 'eigen-weg') { docent.eigenStijl.splice(Number(k.dataset.i), 1); inv().docent.eigenStijl = docent.eigenStijl; bewaarDocent(docent); bewaar(); return teken(); }
          if (a === 'bron') { concept.bron = k.dataset.bron; bewaar(); return teken(); }
          if (a === 'analyseer') { analyseer(); concept.ocrMelding = ''; bewaar(); return teken(); }
          if (a === 'doel-erbij') { inv().inhoud.lesdoelen = [...(inv().inhoud.lesdoelen ?? []), { tekst: '' }]; bewaar(); return teken(); }
          if (a === 'doel-weg') { inv().inhoud.lesdoelen.splice(Number(k.dataset.i), 1); bewaar(); return teken(); }
          if (a === 'begrip-erbij') {
            const v = $('#nieuwBegrip', root)?.value.trim();
            if (v) { inv().inhoud.begrippen = [...new Set([...(inv().inhoud.begrippen ?? []), v])]; bewaar(); teken(); }
            return;
          }
          if (a === 'wijzig') {
            const id = k.dataset.wijzig;
            if (openWijzig.has(id)) openWijzig.delete(id); else openWijzig.add(id);
            teken();
            $(`[data-actie="wijzig"][data-wijzig="${id}"]`, root)?.focus({ preventScroll: true });
            return;
          }
          if (a === 'kies-variant') { openWijzig.clear(); concept.gekozenStand = Number(k.dataset.stand); inv().stand = concept.gekozenStand; concept.aanpassingen = {}; return gaNaar('aanpassen'); }
          if (a === 'andere') {
            const s = k.dataset.sleutel;
            inv().opties.overslaan = { ...inv().opties.overslaan, [s]: (Number(inv().opties.overslaan?.[s]) || 0) + 1 };
            delete inv().opties.vastgezet[s];
            bewaar(); return teken();
          }
          if (a === 'vastzetten') {
            const s = k.dataset.sleutel;
            if (inv().opties.vastgezet[s]) delete inv().opties.vastgezet[s];
            else inv().opties.vastgezet[s] = k.dataset.id;
            bewaar(); return teken();
          }
          if (a === 'ai-open') {
            (matStaat().open ??= {}).ai = true; bewaar(); teken();
            const s = $('details[data-paneel="ai"] > summary', root);
            s?.scrollIntoView({ block: 'start' }); s?.focus({ preventScroll: true });
            return;
          }
          if (a === 'ai-kopieer') {
            const veld = $('#aiPrompt', root);
            if (!veld) return;
            navigator.clipboard?.writeText(veld.value).then(() => { k.textContent = 'Gekopieerd'; }).catch(() => { veld.select(); k.textContent = 'Geselecteerd: kopieer met Ctrl+C'; });
            if (!navigator.clipboard) { veld.select(); k.textContent = 'Geselecteerd: kopieer met Ctrl+C'; }
            setTimeout(() => { k.textContent = 'Kopieer prompt'; }, 2500);
            return;
          }
          if (a === 'ai-lees') {
            const tekst = $('#aiAntwoord', root)?.value ?? '';
            matStaat().aiAntwoord = tekst;
            matStaat().aiVoorstel = leesAntwoord(tekst);
            bewaar(); return teken();
          }
          if (a === 'ai-toepassen') {
            const nieuw = matStaat().aiVoorstel?.blokken ?? {};
            const laag = huidigeLes().lagen && matStaat().aiLaag && matStaat().aiLaag !== 'A' ? matStaat().aiLaag : null;
            if (laag) concept.aiLagen = { ...(concept.aiLagen ?? {}), [laag]: { ...(concept.aiLagen?.[laag] ?? {}), ...nieuw } };
            else concept.ai = { ...(concept.ai ?? {}), ...nieuw };
            matStaat().aiVoorstel = null; matStaat().aiAntwoord = '';
            bewaar(); return teken();
          }
          if (a === 'ai-wis') { const laag = matStaat().aiLaag; if (laag && laag !== 'A' && concept.aiLagen) delete concept.aiLagen[laag]; else concept.ai = {}; bewaar(); return teken(); }
          if (a === 'link-erbij') {
            const titel = $('#linkTitel', root)?.value.trim();
            const url = $('#linkUrl', root)?.value.trim();
            if (!titel || !/^https?:\/\/\S+\.\S+/.test(url ?? '')) { $('#linkUrl', root)?.focus(); return; }
            concept.links = [...(concept.links ?? []).filter((x) => x.url !== url), { titel, url }];
            bewaar(); return teken();
          }
          if (a === 'link-weg') { concept.links.splice(Number(k.dataset.i), 1); bewaar(); return teken(); }
          if (a === 'voorstel') {
            const v = { vak: inv().context.vak, titel: $('#voorstelTitel', root)?.value.trim(), url: $('#voorstelUrl', root)?.value.trim(), omschrijving: $('#voorstelOmschrijving', root)?.value.trim() };
            const uit = $('#voorstelUit', root);
            if (!v.titel || !/^https?:\/\//.test(v.url ?? '')) { uit.hidden = false; uit.textContent = 'Vul een titel en een adres (https://…) in.'; return; }
            uit.hidden = false;
            uit.textContent = JSON.stringify({ titel: v.titel, url: v.url, omschrijving: v.omschrijving }, null, 2) + `\n\n(voor het vak: ${v.vak})`;
            navigator.clipboard?.writeText(uit.textContent).catch(() => {});
            return;
          }
          if (a === 'mat-doc') { matStaat().doc = k.dataset.doc; bewaar(); teken(); $('.mat-blad', root)?.scrollIntoView({ block: 'nearest' }); return; }
          if (a === 'print-alles') return printAlles(huidigeLes(), { ...data, itemMap }, matStaat(), concept);
          if (a === 'exp') {
            const oud = k.textContent;
            k.textContent = 'Bezig…'; k.setAttribute('aria-busy', 'true');
            exporteer(k.dataset.soort, huidigeLes(), { ...data, itemMap }, matStaat(), concept)
              .then(() => { k.textContent = 'Gedownload'; })
              .catch((err) => { console.error(err); k.textContent = 'Mislukt, probeer opnieuw'; })
              .finally(() => { k.removeAttribute('aria-busy'); setTimeout(() => { k.textContent = oud; }, 2500); });
            return;
          }
          if (a === 'omhoog' || a === 'omlaag') {
            const ids = $$('.fase', root).map((x) => x.dataset.fase);
            const j = ids.indexOf(k.dataset.fase);
            const n = a === 'omhoog' ? j - 1 : j + 1;
            if (n < 0 || n >= ids.length) return;
            [ids[j], ids[n]] = [ids[n], ids[j]];
            concept.aanpassingen.volgorde = ids; bewaar(); teken();
            $(`[data-actie="${a}"][data-fase="${k.dataset.fase}"]`, root)?.focus();
          }
        });
        koppelDoelchecks();
        koppelSlepen();
        root.addEventListener('toggle', (e) => { const d = e.target; if (d.matches?.('details.paneel')) { (matStaat().open ??= {})[d.dataset.paneel] = d.open; bewaar(); } }, true);
        root.addEventListener('dragover', (e) => { const v = e.target.closest('#ocrVak, #docVak'); if (v) { e.preventDefault(); v.classList.add('over'); } });
        root.addEventListener('drop', (e) => {
          const v = e.target.closest('#ocrVak, #docVak');
          if (!v) return;
          e.preventDefault(); v.classList.remove('over');
          if (v.id === 'docVak') leesEigen(e.dataTransfer.files?.[0]); else herkenFoto(e.dataTransfer.files?.[0]);
        });
      }
    };
  }
};
