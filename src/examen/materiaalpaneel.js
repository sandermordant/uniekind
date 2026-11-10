// Het materiaalpaneel bij een onderwerp, gedeeld door de werkplek en Stof en materiaal.
// Maken (zonder AI), uitwerken met AI, zoeken, en de links die jij en je sectie bewaarden.
import { html, raw, inFrame } from '../util/html.js';
import { documentHtml } from '../materiaal/html.js';
import { download, bestandsnaam } from '../export/delen.js';
import { leesAntwoord } from '../ai/import.js';
import { laadDocent, nieuwConcept, bewaarConcept } from '../wizard/staat.js';
import { isDoelzin, alsLesdoel, korteBegrippen } from '../data/kaders.js';
import { ONDERWERP_IDS, onderwerpNaam, zoekterm, zoekLinks, werkvormIdsVoor, veiligeUrl, maakOnderwerpMateriaal, onderwerpPrompt, begrippenVan } from './onderwerp.js';
import * as opslag from '../opslag/opslag.js';

/* ── Bewaard materiaal: per onderwerp een paar links. Alleen in deze browser; delen gaat met een bestand. ── */
const SLEUTEL = 'materiaal';
export const mijnMateriaal = () => opslag.lees(SLEUTEL, []) ?? [];
const bewaarMijn = (lijst) => opslag.schrijf(SLEUTEL, lijst);

export function voegLinkToe(item) {
  const url = veiligeUrl(item.url);
  if (!url) return false;
  const lijst = mijnMateriaal().filter((x) => !(x.sleutel === item.sleutel && x.url === url));
  lijst.push({ sleutel: item.sleutel, kader: item.kader, code: item.code ?? '', onderwerp: String(item.onderwerp ?? '').slice(0, 200), vak: item.vak ?? '', titel: String(item.titel || url).slice(0, 160), url, datum: new Date().toISOString().slice(0, 10) });
  bewaarMijn(lijst);
  return true;
}
export const verwijderLink = (sleutel, url) => bewaarMijn(mijnMateriaal().filter((x) => !(x.sleutel === sleutel && x.url === url)));

export const materiaalBestand = (lijst = mijnMateriaal()) => ({ soort: 'uniekind-materiaal', versie: 1, gemaakt: new Date().toISOString().slice(0, 10), items: lijst });

/** Leest een gedeeld materiaalbestand; neemt alleen geldige http(s)-links over. */
export function leesMateriaalBestand(obj) {
  if (!obj || obj.soort !== 'uniekind-materiaal' || !Array.isArray(obj.items)) throw new Error('Dit is geen materiaalbestand van Uniekind.');
  return obj.items.filter((x) => x && typeof x.sleutel === 'string' && veiligeUrl(x.url)).map((x) => ({
    sleutel: x.sleutel, kader: String(x.kader ?? ''), code: String(x.code ?? ''), onderwerp: String(x.onderwerp ?? '').slice(0, 200),
    vak: String(x.vak ?? ''), titel: String(x.titel ?? x.url).slice(0, 160), url: veiligeUrl(x.url), datum: String(x.datum ?? '')
  }));
}
export function importeerMateriaal(obj) {
  const nieuw = leesMateriaalBestand(obj);
  const lijst = mijnMateriaal();
  let n = 0;
  for (const x of nieuw) if (!lijst.some((y) => y.sleutel === x.sleutel && y.url === x.url)) { lijst.push(x); n++; }
  bewaarMijn(lijst);
  return n;
}

let sectieCache = null;
/** Materiaal dat de sectie of school in public/data/materiaal-sectie.json heeft gezet (mag leeg zijn). */
export async function laadSectieMateriaal() {
  if (!sectieCache) sectieCache = fetch('./data/materiaal-sectie.json').then((r) => (r.ok ? r.json() : { items: [] })).then((d) => { try { return leesMateriaalBestand({ soort: 'uniekind-materiaal', items: d.items ?? [] }); } catch { return []; } }).catch(() => []);
  return sectieCache;
}

/* ── AI-tekst per onderwerp, zodat hij er na het herladen nog staat (hooguit 30 onderwerpen) ── */
const leesAi = (sleutel) => (opslag.lees('onderwerp-ai', {}) ?? {})[sleutel] ?? {};
function bewaarAi(sleutel, blokken) {
  const alles = opslag.lees('onderwerp-ai', {}) ?? {};
  delete alles[sleutel];
  if (Object.keys(blokken).length) alles[sleutel] = blokken;
  const sleutels = Object.keys(alles);
  for (const k of sleutels.slice(0, Math.max(0, sleutels.length - 30))) delete alles[k];
  opslag.schrijf('onderwerp-ai', alles);
}

/**
 * Beheer van één open paneel. De pagina geeft mee hoe de klas eruitziet en hoe hij opnieuw tekent.
 * @param {object} o { profiel, context: () => ({ vakNaam, niveauNaam, examen, vakId, klas }), werkvormen: index-items, sectie: [] , teken }
 */
export function maakMateriaalBeheer(o) {
  let open = null; // { regel, kinderen, doc, aiInvoer, uitslag, melding }

  const info = () => o.context(open?.regel);
  const docs = () => {
    const c = info();
    const r = open.regel;
    const ids = werkvormIdsVoor({ examen: c.examen, metBegrippen: begrippenVan([r, ...open.kinderen]).length > 0 });
    const werkvormen = ids.map((id) => o.werkvormen?.find((w) => w.id === id)).filter(Boolean);
    const links = [...mijnMateriaal(), ...(o.sectie ?? [])].filter((x) => x.sleutel === r.sleutel);
    return maakOnderwerpMateriaal({ regel: r, kinderen: open.kinderen, vakNaam: c.vakNaam, niveauNaam: c.niveauNaam, examen: c.examen, bron: r.info?.titel, ai: leesAi(r.sleutel), links, werkvormen });
  };

  function paneel() {
    if (!open) return '';
    const r = open.regel;
    const c = info();
    const naam = onderwerpNaam(r);
    const term = zoekterm(r) || naam;
    const lijst = docs();
    const huidig = lijst.find((d) => d.id === open.doc) ?? lijst[1] ?? lijst[0];
    const eigen = mijnMateriaal().filter((x) => x.sleutel === r.sleutel);
    const sectie = (o.sectie ?? []).filter((x) => x.sleutel === r.sleutel);
    const ids = werkvormIdsVoor({ examen: c.examen, metBegrippen: begrippenVan([r, ...open.kinderen]).length > 0 });
    const werkvormen = ids.map((id) => o.werkvormen?.find((w) => w.id === id)).filter(Boolean);
    const aiAantal = Object.keys(leesAi(r.sleutel)).length;
    return html`
      <section class="om-paneel" id="omPaneel" aria-labelledby="omKop" tabindex="-1">
        <div class="om-kop">
          <h3 id="omKop">Materiaal bij: ${naam}</h3>
          <button type="button" class="knop secundair klein" data-actie="om-sluit">Sluiten</button>
        </div>
        <p class="hulp">${[c.vakNaam, c.niveauNaam].filter(Boolean).join(', ')}${open.kinderen.filter((x) => !x.kopje && !x.heeftKinderen).length ? `. Met de ${open.kinderen.filter((x) => !x.kopje && !x.heeftKinderen).length} eindtermen eronder.` : '.'}</p>
        <div class="om-acties">
          <button type="button" class="knop klein" data-actie="om-les">Nieuwe les over dit onderwerp</button>
          ${c.examen && !r.heeftKinderen ? html`<button type="button" class="knop secundair klein" data-actie="om-opgave">Opgave op niveau</button>` : ''}
        </div>

        <div class="om-blokken">
          <div class="om-blok">
            <h4>1. Direct klaar, zonder AI</h4>
            <p class="hulp">Gemaakt uit de eindtermen, toelichting en vakbegrippen van SLO. Pas aan in Word als je wilt.</p>
            <div class="mat om-mat">
              <nav class="mat-lijst" aria-label="Documenten bij dit onderwerp"><ul>${lijst.map((d) => html`<li><button type="button" data-actie="om-doc" data-doc="${d.id}" aria-current="${d.id === huidig.id}"><span>${d.titel.split(':')[0]}</span></button></li>`)}</ul></nav>
              <div class="mat-blad" tabindex="0" role="region" aria-label="Voorbeeld: ${huidig.titel}">${raw(documentHtml(huidig, { schoolnaam: o.profiel.school.naam }))}</div>
            </div>
            <div class="mat-acties">
              <button type="button" class="knop secundair klein" data-actie="om-exp" data-soort="pdf">Alles als PDF</button>
              <button type="button" class="knop secundair klein" data-actie="om-exp" data-soort="docx">Alles als Word</button>
            </div>
            ${inFrame ? html`<p class="export-melding">In deze ingebedde preview kan de browser downloaden tegenhouden. Op de echte website werkt het gewoon.</p>` : ''}
          </div>

          <div class="om-blok">
            <h4>2. Uitleg en oefenvragen laten schrijven met AI ${aiAantal ? html`<span class="chip">${aiAantal} onderdelen ingevuld</span>` : ''}</h4>
            <p class="hulp">Kopieer de opdracht naar de AI-tool van school${o.profiel.ai?.tool ? ` (${o.profiel.ai.tool})` : ''}. Er staan alleen de eindtermen en begrippen in, niets over je klas. Plak het antwoord terug: de leerkaart, het oefenblad en de antwoorden vullen zich. Lees alles na op juistheid en niveau.</p>
            <div class="knoppen"><button type="button" class="knop secundair klein" data-actie="om-ai-kopieer">Kopieer de opdracht</button></div>
            <details class="et-extra" ${open.toonPrompt ? 'open' : ''}><summary>Bekijk de opdracht</summary><textarea id="omPrompt" rows="6" readonly aria-label="Opdracht voor de AI-tool">${onderwerpPrompt({ regel: r, kinderen: open.kinderen, ...c })}</textarea></details>
            <label for="omAi" class="label">Antwoord van de AI-tool</label>
            <textarea id="omAi" rows="4" data-om-ai>${open.aiInvoer ?? ''}</textarea>
            <div class="knoppen"><button type="button" class="knop secundair klein" data-actie="om-ai-lees">Lees het antwoord</button>${aiAantal ? html`<button type="button" class="knop secundair klein" data-actie="om-ai-wis">AI-tekst weghalen</button>` : ''}</div>
          </div>

          <div class="om-blok">
            <h4>3. Zoek bestaand materiaal over "${term}"</h4>
            <p class="zoeklinks">${zoekLinks(o.profiel, { term, vakNaam: c.vakNaam, niveauNaam: c.niveauNaam, examen: c.examen, vakId: c.vakId }).map((z) => html`<a href="${z.url}" target="_blank" rel="noopener noreferrer">${z.naam}</a>`)}</p>
            <p class="hulp">Je verlaat Uniekind. Bekijk wat je vindt eerst zelf; goed materiaal bewaar je hieronder bij dit onderwerp.</p>
          </div>

          <div class="om-blok">
            <h4>4. Bewaard bij dit onderwerp</h4>
            ${sectie.length ? html`<p class="hulp">Van je sectie:</p><ul class="om-links">${sectie.map((l) => html`<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.titel}</a></li>`)}</ul>` : ''}
            ${eigen.length ? html`<ul class="om-links">${eigen.map((l) => html`<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.titel}</a> <button type="button" class="knop secundair klein" data-actie="om-link-weg" data-url="${l.url}" aria-label="Verwijder ${l.titel}">×</button></li>`)}</ul>` : !sectie.length ? html`<p class="hulp">Nog niets bewaard. Vond je een goede video, site of opgave? Zet hem hier, dan vind je hem de volgende keer meteen terug.</p>` : ''}
            <div class="veldrij link-rij">
              <input type="text" id="omTitel" aria-label="Titel van het materiaal" placeholder="Titel, bijvoorbeeld: Schooltv – koopkracht">
              <input type="url" id="omUrl" aria-label="Adres (https://…)" placeholder="https://…">
              <button type="button" class="knop secundair klein" data-actie="om-link">Bewaar</button>
            </div>
            <p class="hulp">Delen met je sectie: bij <a href="#materiaal">Bewaard materiaal</a> zet je alles in één bestand.</p>
          </div>

          ${werkvormen.length ? html`<div class="om-blok">
            <h4>5. Werkvormen om de stof te laten beklijven</h4>
            <ul class="om-links">${werkvormen.map((w) => html`<li><a href="#werkvorm-${w.id}">${w.naam}</a> <span class="hulp">${w.kort ?? ''}</span></li>`)}</ul>
          </div>` : ''}
        </div>
        ${open.melding ? html`<p class="melding" role="status">${open.melding}</p>` : ''}
      </section>`;
  }

  /** Een nieuw lesconcept over dit onderwerp, voor de klas van de werkplek. */
  function maakLes() {
    const r = open.regel;
    const c = info();
    const docent = laadDocent(o.profiel);
    const concept = nieuwConcept(o.profiel, docent);
    const k = c.klas;
    if (k) {
      const afd = o.profiel.afdelingen.find((a) => a.id === k.afdeling);
      Object.assign(concept.invoer.context, { afdeling: k.afdeling, leerjaar: k.leerjaar, ...(k.vak ? { vak: k.vak } : {}), ...(afd ? { lesduur: afd.standaardLesduur } : {}) });
    } else if (c.vakId) concept.invoer.context.vak = c.vakId;
    const termen = [r, ...open.kinderen].filter((x) => !x.kopje && !x.heeftKinderen && x.info).slice(0, 6);
    const inh = concept.invoer.inhoud;
    inh.onderwerp = onderwerpNaam(r).slice(0, 80);
    inh.eindtermen = termen.map((x) => ({ sleutel: x.sleutel, kader: x.info.id, kaderTitel: x.info.titel, code: x.code, tekst: x.tekst }));
    const doelen = termen.filter((x) => isDoelzin(x.tekst)).slice(0, 3).map((x) => ({ tekst: alsLesdoel(x.tekst) }));
    inh.lesdoelen = doelen.length ? doelen : [{ tekst: '' }];
    const begr = korteBegrippen(termen.flatMap((x) => x.begrippen ?? [])).slice(0, 12);
    if (begr.length) concept.suggesties = { begrippen: begr };
    if (c.examen) concept.invoer.context.reeks = concept.invoer.context.reeks ?? 'toets';
    concept.kader = { id: termen[0]?.info.id ?? r.info?.id, open: true };
    bewaarConcept(concept);
    location.hash = 'les-maken';
  }

  return {
    isOpen: (sleutel) => open?.regel.sleutel === sleutel,
    open(regel, kinderen) { open = { regel, kinderen: kinderen ?? [], doc: 'onderwerp-leerkaart', aiInvoer: '', melding: '' }; },
    sluit() { open = null; },
    html: paneel,
    /** Afhandelen van input-events; true als het voor het paneel was. */
    invoer(t) { if (open && t.matches?.('[data-om-ai]')) { open.aiInvoer = t.value; return true; } return false; },
    /** Afhandelen van een klik op [data-actie^="om-"]. Geeft true terug als de pagina opnieuw moet tekenen. */
    async actie(k, root) {
      const a = k.dataset.actie;
      if (!open || !a?.startsWith('om-')) return false;
      const r = open.regel;
      const c = info();
      open.melding = '';
      if (a === 'om-sluit') { open = null; return true; }
      if (a === 'om-doc') { open.doc = k.dataset.doc; return true; }
      if (a === 'om-les') { maakLes(); return false; }
      if (a === 'om-opgave') {
        opslag.schrijf('examenopgave', { ...(opslag.lees('examenopgave', {}) ?? {}), eindtermen: [{ sleutel: r.sleutel, kader: r.info.id, kaderTitel: r.info.titel, code: r.code, tekst: r.tekst, begrippen: (r.begrippen ?? []).slice(0, 20), toel: (r.toel ?? []).slice(0, 3) }], sloVak: r.info.sloVak, ...(c.niveau ? { niveau: c.niveau, bronNiveau: c.niveau } : {}) });
        location.hash = 'examenopgave';
        return false;
      }
      if (a === 'om-exp') {
        const lijst = docs();
        const opties = { kleur: o.profiel.huisstijl.kleuren.hoofd, schoolnaam: o.profiel.school.naam, titel: `Uniekind: ${onderwerpNaam(r)}` };
        const naam = bestandsnaam(`materiaal-${onderwerpNaam(r).slice(0, 40)}`, k.dataset.soort === 'pdf' ? 'pdf' : 'docx');
        if (k.dataset.soort === 'pdf') { const { naarPdf } = await import('../export/pdf.js'); download(await naarPdf(lijst, opties), naam); }
        else { const { naarDocx } = await import('../export/docx.js'); download(await naarDocx(lijst, opties), naam); }
        return false;
      }
      if (a === 'om-ai-kopieer') {
        const tekst = onderwerpPrompt({ regel: r, kinderen: open.kinderen, ...c });
        try { await navigator.clipboard.writeText(tekst); open.melding = 'De opdracht staat op je klembord. Plak hem in de AI-tool.'; } catch { open.toonPrompt = true; open.melding = 'Kopiëren lukte niet automatisch. Open "Bekijk de opdracht", selecteer de tekst en kopieer hem zelf.'; }
        return true;
      }
      if (a === 'om-ai-lees') {
        const u = leesAntwoord(open.aiInvoer, ONDERWERP_IDS);
        if (u.herkend.length) { bewaarAi(r.sleutel, { ...leesAi(r.sleutel), ...u.blokken }); open.aiInvoer = ''; open.melding = `Herkend: ${u.herkend.join(', ')}. Het staat nu in de leerkaart, het oefenblad en het docentblad.`; }
        else open.melding = 'Uniekind herkent geen onderdelen. Staan de kopjes erin, zoals "### UITLEG"?';
        return true;
      }
      if (a === 'om-ai-wis') { bewaarAi(r.sleutel, {}); return true; }
      if (a === 'om-link') {
        const titel = root.querySelector('#omTitel')?.value.trim();
        const url = root.querySelector('#omUrl')?.value.trim();
        if (!voegLinkToe({ sleutel: r.sleutel, kader: r.info?.id, code: r.code, onderwerp: onderwerpNaam(r), vak: c.vakNaam, titel, url })) open.melding = 'Vul een geldig adres in dat begint met https://';
        else open.melding = 'Bewaard bij dit onderwerp.';
        return true;
      }
      if (a === 'om-link-weg') { verwijderLink(r.sleutel, k.dataset.url); return true; }
      return false;
    }
  };
}
