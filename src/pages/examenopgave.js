// Opgave op niveau: een examenopgave plakken of fotograferen, koppelen aan eindtermen, en in drie versies
// aanbieden (steun, basis, verdieping) of laten herschrijven naar een ander niveau via de AI-brug.
// Uniekind bevat zelf geen examenopgaven: die komen van het CvTE (Examenblad). De docent plakt ze.
import { html, raw, $, inFrame } from '../util/html.js';
import { laadKaderIndex, laadVak, vlak, sloNiveau } from '../data/kaders.js';
import { laadDocent, laadConcept, bewaarConcept } from '../wizard/staat.js';
import { documentHtml } from '../materiaal/html.js';
import { leesAntwoord } from '../ai/import.js';
import { NIVEAU_NAAM, OPGAVE_IDS, splitsOpgave, vraagwoord, zoekEindtermen, maakVersies, maakOpgavePrompt } from '../examen/opgave.js';
import { download, bestandsnaam } from '../export/delen.js';
import * as opslag from '../opslag/opslag.js';

const NIVEAUS = Object.entries(NIVEAU_NAAM);

export default {
  async render({ profiel }) {
    const index = await laadKaderIndex();
    const docent = laadDocent(profiel);
    const opgeslagen = opslag.lees('examenopgave', {}) ?? {};
    // Zonder eerdere opgave: de klas uit de werkplek, anders het docentprofiel
    const klas = opslag.lees('klas', null);
    const klasAfd = klas && profiel.afdelingen.find((a) => a.id === klas.afdeling);
    const startVak = opgeslagen.sloVak ?? index.vakken.find((v) => v.uniekind.includes(klas?.vak))?.naam ?? index.vakken.find((v) => v.uniekind.some((u) => (docent.vakken ?? []).includes(u)))?.naam ?? 'Nederlands';
    const startNiveau = opgeslagen.niveau ?? sloNiveau(klasAfd) ?? sloNiveau(profiel.afdelingen.find((a) => (docent.afdelingen ?? []).includes(a.id))) ?? 'havo';
    const s = { sloVak: startVak, niveau: startNiveau, bronNiveau: startNiveau, opgave: '', antwoord: '', eindtermen: [], ai: {}, doc: 'opgave-steun', ...opgeslagen };
    const vakCache = new Map();
    let voorstellen = null;
    let aiInvoer = '';
    let aiUitslag = null;
    let melding = '';

    const bewaar = () => opslag.schrijf('examenopgave', s);
    const vakInfo = () => index.vakken.find((v) => v.naam === s.sloVak) ?? index.vakken[0];
    // Kandidaat-kaders: examenprogramma en syllabus van dit vak en niveau (geldend)
    const kandidaten = () => index.kaders.filter((k) => k.sloVak === s.sloVak && ['examenprogramma', 'syllabus'].includes(k.soort) && k.status === 'geldend' && k.niveaus.includes(s.niveau));
    const versies = () => maakVersies({ vak: s.sloVak, niveau: s.niveau, bronNiveau: s.bronNiveau, opgave: s.opgave, antwoord: s.antwoord, eindtermen: s.eindtermen, ai: s.ai });
    const knop = (d) => html`<li><button type="button" data-actie="doc" data-doc="${d.id}" aria-current="${d.id === s.doc}"><span>${d.titel.split(':')[0]}</span></button></li>`;

    const pagina = () => {
      const docs = versies();
      const huidig = docs.find((d) => d.id === s.doc) ?? docs[1];
      const { vragen } = splitsOpgave(s.opgave);
      const k = kandidaten();
      const zoekVak = encodeURIComponent(`site:examenblad.nl ${s.sloVak} ${NIVEAU_NAAM[s.niveau] ?? s.niveau} examen`);
      return html`
        <section class="band band-klein"><div class="wrap">
          <p class="eyebrow">Stof en materiaal</p>
          <h1>Opgave op niveau</h1>
          <p class="lead">Plak een examenopgave, koppel hem aan de eindtermen en bied hem aan in drie versies: met steun, op niveau en met verdieping. Of laat hem herschrijven naar een ander niveau.</p>
          <div class="inhoudsopgave"><a class="knop secundair klein" href="#examenstof">Zoeken en bekijken</a><a class="knop klein" href="#examenopgave" aria-current="page">Opgave op niveau</a><a class="knop secundair klein" href="#materiaal">Bewaard materiaal</a></div>
        </div></section>
        <main class="wrap examenopgave">
          <section class="sectie">
            <h2>1. De opgave</h2>
            <div class="veldrij">
              <div class="veld"><label for="eoVak">Vak</label><select id="eoVak" data-eo="sloVak">${index.vakken.map((v) => html`<option value="${v.naam}" ${v.naam === s.sloVak ? 'selected' : ''}>${v.naam}</option>`)}</select></div>
              <div class="veld"><label for="eoNiveau">Niveau van je klas</label><select id="eoNiveau" data-eo="niveau">${NIVEAUS.map(([n, t]) => html`<option value="${n}" ${n === s.niveau ? 'selected' : ''}>${t}</option>`)}</select></div>
              <div class="veld"><label for="eoBron">De opgave komt van</label><select id="eoBron" data-eo="bronNiveau">${NIVEAUS.map(([n, t]) => html`<option value="${n}" ${n === s.bronNiveau ? 'selected' : ''}>${t}</option>`)}</select>
                <span class="hulp">${s.bronNiveau !== s.niveau ? `Herschrijven van ${NIVEAU_NAAM[s.bronNiveau]} naar ${NIVEAU_NAAM[s.niveau]}: dat doet de AI-brug (stap 3).` : 'Kies een ander niveau om de opgave te laten herschrijven.'}</span></div>
            </div>
            <div class="veld"><label for="eoOpgave">Plak de opgave: bron of context en de vragen, met nummers</label>
              <textarea id="eoOpgave" data-eo="opgave" rows="10" placeholder="Bijvoorbeeld:&#10;Tekst 2 Duurdere boodschappen&#10;In 2022 stegen de prijzen in de supermarkt met gemiddeld 12 procent.&#10;2p 5 Leg uit wat er gebeurt met de koopkracht van een gezin waarvan het inkomen gelijk blijft.&#10;1p 6 Bereken de prijs van een boodschappenmand die eerst 80 euro kostte.">${s.opgave}</textarea>
              <span class="hulp">${vragen.length ? `Uniekind ziet ${vragen.length} ${vragen.length === 1 ? 'vraag' : 'vragen'}: ${vragen.map((v) => `${v.nr} (${vraagwoord(v.tekst).soort})`).join(', ')}.` : 'Begin elke vraag met het nummer, zoals in het examen.'}</span></div>
            <div class="knoppen">
              <label class="knop secundair klein bestandknop">Foto van de opgave<input type="file" accept="image/*" data-actie="foto" class="visueel-verborgen"></label>
              <a class="knop secundair klein" href="https://www.google.com/search?q=${zoekVak}" target="_blank" rel="noopener noreferrer">Zoek examens op Examenblad</a>
            </div>
            <div id="eoOcr" aria-live="polite"></div>
            <details class="klein-boven"><summary>Antwoordmodel of correctievoorschrift (optioneel)</summary>
              <textarea id="eoAntwoord" data-eo="antwoord" rows="5" aria-label="Antwoordmodel">${s.antwoord}</textarea></details>
            <p class="hulp">Examenopgaven zijn van het CvTE. Uniekind haalt ze niet zelf op en stuurt ze nergens heen; je opgave blijft in deze browser.</p>
          </section>

          <section class="sectie">
            <h2>2. Welke eindterm toetst deze opgave?</h2>
            ${s.eindtermen.length ? html`<ul class="et-gekozen">${s.eindtermen.map((g) => html`<li><span>${g.code ? html`<b>${g.code}</b> ` : ''}${g.tekst}<span class="hulp">${g.kaderTitel}</span></span><span class="knoppen-klein"><button type="button" class="knop secundair klein" data-actie="et-weg" data-sleutel="${g.sleutel}" aria-label="Ontkoppel ${g.code || 'deze eindterm'}">×</button></span></li>`)}</ul>` : ''}
            <div class="knoppen"><button type="button" class="knop secundair klein" data-actie="zoek-et" ${s.opgave.trim() && k.length ? '' : 'disabled'}>Zoek passende eindtermen in ${k.length ? k.length === 1 ? 'het examenprogramma' : 'het examenprogramma en de syllabus' : 'de syllabus'}</button>
              <a class="knop secundair klein" href="#examenstof">Zelf kiezen bij Stof en materiaal</a></div>
            ${!k.length ? html`<p class="hulp">Voor ${s.sloVak} op ${NIVEAU_NAAM[s.niveau]} is er geen geldend examenprogramma in de gegevens van SLO.</p>` : ''}
            ${voorstellen ? (voorstellen.length ? html`<p class="hulp">Voorstellen op basis van de woorden in de opgave. Vink aan wat klopt.</p>
              <ul class="es-lijst">${voorstellen.map((r) => html`<li class="es-regel"><label class="et-voorstel"><input type="checkbox" data-actie="et-kies" value="${r.sleutel}" ${s.eindtermen.some((g) => g.sleutel === r.sleutel) ? 'checked' : ''}>
                <span>${r.code ? html`<b>${r.code}</b> ` : ''}${r.tekst}${r.ce ? html` <span class="et-tag">CE</span>` : ''} <span class="hulp">${r.info.titel}</span></span></label></li>`)}</ul>` : html`<p class="hulp">Geen duidelijke match gevonden. Kies de eindterm zelf bij Stof en materiaal.</p>`) : ''}
          </section>

          <section class="sectie">
            <h2>3. Drie versies</h2>
            <p class="lees">Zonder AI krijg je de opgave met vaste hulp: vaktaal, een stappenplan per vraagwoord en hintkaarten bij steun, een nakijkcheck bij basis, en extra denkvragen bij verdieping. Met de AI-brug laat je de opgave echt herschrijven${s.bronNiveau !== s.niveau ? `, van ${NIVEAU_NAAM[s.bronNiveau]} naar ${NIVEAU_NAAM[s.niveau]}` : ''}.</p>
            <details class="paneel" ${Object.keys(s.ai).length || aiUitslag ? 'open' : ''}>
              <summary>Herschrijven met AI ${Object.keys(s.ai).length ? html`<span class="chip">${Object.keys(s.ai).length} onderdelen ingevuld</span>` : ''}</summary>
              <div class="paneel-inhoud">
                <p class="melding">Gebruik de AI-tool die de school toestaat, met je schoolaccount${profiel.ai?.tool ? ` (${profiel.ai.tool})` : ''}. De opdracht bevat alleen de opgave en de eindtermen, geen gegevens over je klas.</p>
                <ol class="ai-stappen"><li>Kopieer de opdracht en plak hem in de AI-tool.</li><li>Plak het antwoord hieronder en klik op Lees het antwoord.</li><li>Lees alles na op juistheid en niveau.</li></ol>
                <div class="knoppen"><button type="button" class="knop klein" data-actie="ai-kopieer" ${s.opgave.trim() ? '' : 'disabled'}>Kopieer de opdracht</button></div>
                <textarea id="eoPrompt" rows="4" readonly aria-label="De opdracht voor de AI-tool" class="${s.opgave.trim() ? '' : 'visueel-verborgen'}">${s.opgave.trim() ? maakOpgavePrompt({ vak: s.sloVak, ...s }) : ''}</textarea>
                <label for="eoAi" class="label">Antwoord van de AI-tool</label>
                <textarea id="eoAi" rows="5" data-eo-ai>${aiInvoer}</textarea>
                <div class="knoppen"><button type="button" class="knop secundair klein" data-actie="ai-lees">Lees het antwoord</button>${Object.keys(s.ai).length ? html`<button type="button" class="knop secundair klein" data-actie="ai-wis">AI-tekst weghalen</button>` : ''}</div>
                ${aiUitslag ? html`<p class="melding ${aiUitslag.herkend.length ? 'ok' : 'fout'}">${aiUitslag.herkend.length ? `Herkend: ${aiUitslag.herkend.join(', ')}.` : 'Uniekind herkent geen onderdelen. Staan de kopjes erin, zoals "### OPGAVE-STEUN"?'}${aiUitslag.onbekend.length ? ' Een deel werd niet herkend; dat staat hieronder.' : ''}</p>
                  ${aiUitslag.onbekend.length ? html`<pre class="ai-onbekend">${aiUitslag.onbekend.join('\n\n')}</pre>` : ''}` : ''}
              </div>
            </details>
            ${melding ? html`<p class="melding" role="status">${melding}</p>` : ''}
            <div class="mat-acties">
              <button type="button" class="knop secundair klein" data-actie="exp" data-soort="pdf">Alles als PDF</button>
              <button type="button" class="knop secundair klein" data-actie="exp" data-soort="docx">Alles als Word</button>
              <button type="button" class="knop secundair klein" data-actie="naar-les" ${s.opgave.trim() ? '' : 'disabled'}>Maak een les bij deze opgave</button>
            </div>
            ${inFrame ? html`<p class="export-melding">In deze ingebedde preview kan de browser downloaden tegenhouden. Op de echte website werkt het gewoon.</p>` : ''}
            <div class="mat">
              <nav class="mat-lijst" aria-label="Versies"><ul>${docs.map(knop)}</ul></nav>
              <div class="mat-blad" tabindex="0" role="region" aria-label="Voorbeeld: ${huidig.titel}">${raw(documentHtml(huidig, { schoolnaam: profiel.school.naam }))}</div>
            </div>
          </section>
        </main>`;
    };

    return {
      titel: 'Opgave op niveau',
      html: pagina(),
      na(root) {
        const teken = () => {
          const y = window.scrollY;
          const actief = document.activeElement?.id;
          const sel = actief ? [document.activeElement.selectionStart, document.activeElement.selectionEnd] : null;
          root.innerHTML = String(pagina());
          window.scrollTo(0, y);
          if (actief) { const el = document.getElementById(actief); el?.focus({ preventScroll: true }); try { if (sel?.[0] != null) el.setSelectionRange(sel[0], sel[1]); } catch { /* geen tekstveld */ } }
        };
        const vakBestand = async (info) => vakCache.get(info.bestand) ?? laadVak(info.bestand).then((f) => { vakCache.set(info.bestand, f); return f; });
        let timer;
        root.addEventListener('input', (e) => {
          const t = e.target;
          if (t.matches('[data-eo-ai]')) { aiInvoer = t.value; return; }
          const k = t.dataset.eo;
          if (!k || t.tagName === 'SELECT') return;
          s[k] = t.value; bewaar();
          clearTimeout(timer); timer = setTimeout(teken, 600);
        });
        root.addEventListener('change', async (e) => {
          const t = e.target;
          if (t.tagName === 'SELECT' && t.dataset.eo) {
            const vorige = s.niveau;
            s[t.dataset.eo] = t.value;
            // Zolang bron en klas hetzelfde niveau hadden, gaan ze samen mee
            if (t.dataset.eo === 'niveau' && s.bronNiveau === vorige) s.bronNiveau = t.value;
            if (t.dataset.eo === 'sloVak') { s.eindtermen = []; voorstellen = null; }
            bewaar(); return teken();
          }
          if (t.dataset.actie === 'et-kies') {
            const r = voorstellen.find((x) => x.sleutel === t.value);
            if (t.checked && r) s.eindtermen = [...s.eindtermen, { sleutel: r.sleutel, kader: r.info.id, kaderTitel: r.info.titel, code: r.code, tekst: r.tekst, begrippen: r.begrippen.slice(0, 20), toel: r.toel.slice(0, 3) }];
            else s.eindtermen = s.eindtermen.filter((g) => g.sleutel !== t.value);
            bewaar(); return teken();
          }
          if (t.dataset.actie === 'foto' && t.files?.[0]) {
            const vak = $('#eoOcr', root);
            vak.innerHTML = '<p class="hulp">Tekst herkennen…</p>';
            try {
              const { herkenTekst } = await import('../ocr/ocr.js');
              const r = await herkenTekst(t.files[0], (f, st) => { vak.innerHTML = `<div class="voortgang"><span style="width:${Math.round(f * 100)}%"></span></div><p class="hulp">${st}… ${Math.round(f * 100)}%</p>`; });
              s.opgave = [s.opgave.trim(), r.tekst].filter(Boolean).join('\n\n'); bewaar();
              melding = `Tekst herkend (zekerheid ${r.zekerheid}%). Controleer de tekst en de nummers van de vragen.`;
              teken();
            } catch (err) { vak.innerHTML = `<p class="melding fout">${String(err.message || err).replace(/[<>&]/g, '')}</p>`; }
          }
        });
        root.addEventListener('click', async (e) => {
          const k = e.target.closest('[data-actie]');
          if (!k || k.tagName === 'INPUT') return;
          const a = k.dataset.actie;
          if (a === 'doc') { s.doc = k.dataset.doc; bewaar(); return teken(); }
          if (a === 'et-weg') { s.eindtermen = s.eindtermen.filter((g) => g.sleutel !== k.dataset.sleutel); bewaar(); return teken(); }
          if (a === 'zoek-et') {
            k.disabled = true; k.textContent = 'Zoeken…';
            const regels = [];
            for (const info of kandidaten()) {
              const f = await vakBestand(info);
              regels.push(...vlak(f.kaders[info.id]).map((r) => ({ ...r, info })));
            }
            voorstellen = zoekEindtermen(s.opgave, regels, 8);
            return teken();
          }
          if (a === 'ai-kopieer') {
            const tekst = maakOpgavePrompt({ vak: s.sloVak, ...s });
            try { await navigator.clipboard.writeText(tekst); melding = 'De opdracht staat op je klembord. Plak hem in de AI-tool.'; } catch { $('#eoPrompt', root)?.select(); melding = 'Kopiëren lukte niet automatisch; de opdracht is geselecteerd.'; }
            return teken();
          }
          if (a === 'ai-lees') {
            aiUitslag = leesAntwoord(aiInvoer, OPGAVE_IDS);
            if (aiUitslag.herkend.length) { s.ai = { ...s.ai, ...aiUitslag.blokken }; bewaar(); }
            return teken();
          }
          if (a === 'ai-wis') { s.ai = {}; aiUitslag = null; bewaar(); return teken(); }
          if (a === 'exp') {
            const docs = versies();
            const o = { kleur: profiel.huisstijl.kleuren.hoofd, schoolnaam: profiel.school.naam, titel: `Uniekind: opgave ${s.sloVak}` };
            if (k.dataset.soort === 'pdf') { const { naarPdf } = await import('../export/pdf.js'); download(await naarPdf(docs, o), bestandsnaam(`opgave-op-niveau-${s.sloVak}`, 'pdf')); }
            else { const { naarDocx } = await import('../export/docx.js'); download(await naarDocx(docs, o), bestandsnaam(`opgave-op-niveau-${s.sloVak}`, 'docx')); }
            return;
          }
          if (a === 'naar-les') {
            const concept = laadConcept(profiel, docent);
            const inh = concept.invoer.inhoud;
            const eersteRegel = s.opgave.split('\n').map((r) => r.trim()).find(Boolean) ?? '';
            inh.onderwerp = inh.onderwerp || eersteRegel.slice(0, 80);
            inh.tekst = s.opgave;
            inh.eindtermen = s.eindtermen.map(({ sleutel, kader, kaderTitel, code, tekst }) => ({ sleutel, kader, kaderTitel, code, tekst }));
            const vak = vakInfo().uniekind.find((u) => profiel.vakken.some((x) => x.id === u));
            if (vak) concept.invoer.context.vak = vak;
            concept.invoer.context.reeks = 'toets';
            concept.aanpassingen = {};
            bewaarConcept(concept);
            location.hash = 'les-maken';
          }
        });
      }
    };
  }
};
