// Stap 7: het materiaalpakket bekijken, aanvullen (AI-brug, bronnen), aanpassen (dyslexievriendelijk, rustig)
// en exporteren.
import { html, raw, inFrame } from '../util/html.js';
import { maakMateriaal, lesVoorLaag } from '../materiaal/maak.js';
import { rustig, tekstVan } from '../materiaal/model.js';
import { documentHtml, allesHtml } from '../materiaal/html.js';
import { bestandsnaam, download } from '../export/delen.js';
import { maakLesbestand } from '../export/lesbestand.js';
import { profielId } from '../data/laden.js';
import { PAKKETTEN, ONDERDELEN, nodigVoorMateriaal } from '../ai/formaat.js';
import { aiInstellingen, promptVoor } from '../ai/adapter.js';
import { sectieVoor } from '../data/sectie-accenten.js';
import { signalenLeerlinggegevens } from '../ocr/document-info.js';
import { MAX_TEKST } from '../ai/prompt.js';
import { eigenSectieAccenten } from './staat.js';

export function pakketVoor(les, data, staat, concept = {}) {
  const p = maakMateriaal(les, data, concept.ai ?? {}, concept.links ?? [], concept.aiLagen ?? {});
  if (staat.rustig) for (const lijst of [p.docent, p.leerling, p.alle]) lijst.forEach((d, i) => { lijst[i] = rustig(d); });
  // Eerst wat je voor deze les nodig hebt; de extra's (overzicht, kijkwijzer, reflectie) staan apart
  p.meer = p.alle.filter((d) => MEER.includes(d.id));
  p.nodig = p.alle.filter((d) => !MEER.includes(d.id));
  return p;
}

const MEER = ['differentiatie-overzicht', 'kijkwijzer', 'reflectiekaart'];
/** Hoeveel velden (tussen ⟦ en ⟧) in een document nog door de docent of met AI moeten worden ingevuld. */
export const openVelden = (d) => new Set(tekstVan(d).match(/⟦[^⟧]*⟧/g) ?? []).size; // dezelfde plek op elke kopie telt één keer

const zoekQ = (s) => encodeURIComponent(String(s ?? '').trim());
const naamVan = (id) => ONDERDELEN.find((o) => o.id === id)?.label ?? id;

function aiPaneel(les, data, staat, concept, p) {
  const inst = aiInstellingen(data.profiel);
  // Combinatieklas met twee lagen: de AI-opdracht gaat over één laag tegelijk
  const laagId = les.lagen ? (les.lagen.some((l) => l.id === staat.aiLaag) ? staat.aiLaag : 'A') : null;
  const lesAi = laagId ? lesVoorLaag(les, laagId) : les;
  const docsAi = laagId ? p.alle.filter((d) => !d.laag || d.laag === laagId) : p.alle;
  const nodig = nodigVoorMateriaal(docsAi.map((d) => d.id), lesAi.doel.lesdoelen.length > 0);
  const pakketten = PAKKETTEN.filter((x) => x.ids.some((id) => nodig.includes(id)));
  const pakket = pakketten.some((x) => x.id === staat.aiPakket) ? staat.aiPakket : 'alles';
  let prompt = '';
  let fout = '';
  try { prompt = promptVoor(lesAi, data.profiel, pakket, nodig); } catch (e) { fout = e.message; }
  const v = staat.aiVoorstel;
  const huidig = Object.keys((laagId && laagId !== 'A' ? concept.aiLagen?.[laagId] : concept.ai) ?? {});
  const eigen = String(lesAi.invoer?.inhoud?.tekst ?? '').trim();
  const signalen = signalenLeerlinggegevens(eigen);
  return html`
    <details class="paneel" data-paneel="ai" ${staat.open?.ai ? 'open' : ''}>
      <summary>Maak af met AI ${huidig.length ? html`<span class="chip">${huidig.length} onderdelen ingevuld</span>` : ''}</summary>
      <div class="paneel-inhoud">
        <p class="melding">Gebruik de AI-tool die de school toestaat, met je schoolaccount (${inst.tool}). De prompt bevat alleen lesinhoud: geen namen en geen gegevens over je klas.</p>
        ${eigen ? html`<p class="melding ok">Je eigen materiaal (${eigen.split(/\s+/).length} woorden) gaat mee als basis${eigen.length > MAX_TEKST ? `; het is lang, dus de eerste ${MAX_TEKST.toLocaleString('nl-NL')} tekens` : ''}. De werkbladen, vragen en uitlegdia's worden daarop gebouwd.</p>` : html`<p class="hulp">Heb je eigen materiaal? Voeg het toe bij de eerste stap (Eigen materiaal of lesstof); dan bouwt AI daarop.</p>`}
        ${signalen.length ? html`<p class="melding let-op">In je eigen materiaal staan woorden als "${signalen.join('", "')}". Haal gegevens over leerlingen eruit voordat je de opdracht kopieert.</p>` : ''}
        <p class="melding let-op"><b>Lees AI-materiaal altijd na op juistheid en niveau.</b> AI helpt bij het voorbereiden; jij blijft de vakexpert. Een AI-tool kan fouten maken die overtuigend klinken. Gebruik AI als hulp, niet als vervanging van je eigen voorbereiding, zodat je er niet afhankelijk van wordt.</p>
        ${laagId ? html`<div class="veld"><label for="aiLaag"><b>Voor welke laag?</b></label>
          <select id="aiLaag" data-actie="ai-laag">${les.lagen.map((l) => html`<option value="${l.id}" ${l.id === laagId ? 'selected' : ''}>Laag ${l.code}${l.onderwerp ? `: ${l.onderwerp}` : ''}</option>`)}</select>
          <span class="hulp">Doe dit voor elke laag: het antwoord vult het materiaal van die laag.</span></div>` : ''}
        <ol class="ai-stappen">
          <li>
            <label for="aiPakket"><b>Wat wil je laten maken?</b></label>
            <select id="aiPakket" data-actie="ai-pakket">${pakketten.map((x) => html`<option value="${x.id}" ${x.id === pakket ? 'selected' : ''}>${x.label}</option>`)}</select>
          </li>
          <li>
            <b>Kopieer de prompt en plak hem in ${inst.tool}.</b>
            ${fout ? html`<p class="melding fout">${fout}</p>` : html`<textarea id="aiPrompt" readonly rows="8" aria-label="Prompt voor de AI-tool">${prompt}</textarea>`}
            <div class="knoppen klein-boven">
              <button type="button" class="knop klein" data-actie="ai-kopieer">Kopieer prompt</button>
              ${inst.toolAdres ? html`<a class="knop secundair klein" href="${inst.toolAdres}" target="_blank" rel="noopener noreferrer">Open ${inst.tool.split(' met ')[0]}</a>` : ''}
            </div>
          </li>
          <li>
            <label for="aiAntwoord"><b>Plak het antwoord hier terug.</b></label>
            <textarea id="aiAntwoord" rows="8" placeholder="Plak hier het hele antwoord van de AI-tool.">${staat.aiAntwoord ?? ''}</textarea>
            <div class="knoppen klein-boven"><button type="button" class="knop klein" data-actie="ai-lees">Lees het antwoord in</button></div>
          </li>
        </ol>
        ${v ? html`
          <div class="ai-voorstel">
            ${v.herkend.length ? html`<h4>Herkend (${v.herkend.length})</h4>
              <ul class="ai-herkend">${v.herkend.map((k) => html`<li><b>${naamVan(k)}</b><span>${String(v.blokken[k]).slice(0, 160)}${String(v.blokken[k]).length > 160 ? '…' : ''}</span></li>`)}</ul>
              <div class="knoppen klein-boven"><button type="button" class="knop klein" data-actie="ai-toepassen">Zet in het materiaal</button></div>` : html`<p class="melding fout">Uniekind herkent in dit antwoord geen onderdelen. Controleer of de koppen er staan, zoals "### VRAGEN-BASIS".</p>`}
            ${v.onbekend.length ? html`<h4>Niet herkend</h4><p class="hulp">Dit stuk kon Uniekind niet plaatsen. Gebruik je het, zet het dan zelf in de Word-versie van je materiaal.</p>${v.onbekend.map((x) => html`<pre class="ai-onbekend">${x}</pre>`)}` : ''}
          </div>` : ''}
        ${huidig.length ? html`<p class="hulp">In het materiaal: ${huidig.map(naamVan).join(', ')}. <button type="button" class="knop secundair klein" data-actie="ai-wis">AI-inhoud verwijderen</button></p>` : ''}
      </div>
    </details>`;
}

function bronnenPaneel(les, data, staat, concept, bronnenPerVak) {
  const c = les.invoer?.context ?? {};
  const vak = data.profiel.vakken.find((v) => v.id === c.vak);
  const onderwerp = (les.doel.onderwerp || vak?.naam || '').replace(/^\s*[\d.]+\s+/, '');
  const zoek = (data.profiel.bronnenZoeken ?? []).map((z) => ({ naam: z.naam, url: z.url.replace('{q}', zoekQ(onderwerp)) }));
  const methode = sectieVoor(data.profiel, c.vak, eigenSectieAccenten()).methodesite;
  const curatie = [...(bronnenPerVak?.perVak?.[c.vak] ?? []), ...(bronnenPerVak?.algemeen ?? [])];
  const gekozen = concept.links ?? [];
  const isGekozen = (url) => gekozen.some((l) => l.url === url);
  return html`
    <details class="paneel" data-paneel="bronnen" ${staat.open?.bronnen ? 'open' : ''}>
      <summary>Bronnen en media ${gekozen.length ? html`<span class="chip">${gekozen.length} gekozen</span>` : ''}</summary>
      <div class="paneel-inhoud">
        <p class="hulp">Een link komt pas in je lesplan als je hem aanvinkt of zelf toevoegt. Uniekind toont of speelt nooit automatisch een video af.</p>
        <h4>Zoeken op "${onderwerp}"</h4>
        <p class="zoeklinks">${zoek.map((z) => html`<a href="${z.url}" target="_blank" rel="noopener noreferrer">${z.naam}</a>`)}${methode ? html`<a href="${methode}" target="_blank" rel="noopener noreferrer">Methodewebsite</a>` : ''}</p>
        <h4>Betrouwbare bronnen${vak ? ` voor ${vak.naam.toLowerCase()}` : ''}</h4>
        <div class="vinkjes kolom">${curatie.map((b) => html`<label><input type="checkbox" data-actie="link" data-titel="${b.titel}" data-url="${b.url}" ${isGekozen(b.url) ? 'checked' : ''}> <span><b>${b.titel}</b> · ${b.omschrijving} <a href="${b.url}" target="_blank" rel="noopener noreferrer">bekijk</a></span></label>`)}</div>
        <h4>Eigen link toevoegen</h4>
        <p class="hulp">Een video of artikel gevonden dat je hebt bekeken en goed vindt? Voeg het hier toe.</p>
        <div class="veldrij link-rij">
          <input type="text" id="linkTitel" aria-label="Titel van de link" placeholder="Titel, bijvoorbeeld: Schooltv – Wat is inflatie?">
          <input type="url" id="linkUrl" aria-label="Adres van de link" placeholder="https://…">
          <button type="button" class="knop secundair klein" data-actie="link-erbij">Toevoegen</button>
        </div>
        ${gekozen.length ? html`<h4>In je lesplan</h4><ul class="gekozen">${gekozen.map((l, i) => html`<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.titel}</a> <button type="button" class="knop secundair klein" data-actie="link-weg" data-i="${i}">Weghalen</button></li>`)}</ul>` : ''}
        <details class="uitleg voorstel">
          <summary>Stel een bron voor aan je sectie</summary>
          <p>Vul de bron in. Je krijgt een stukje tekst dat je naar de beheerder van Uniekind stuurt; die zet het in de lijst voor het vak.</p>
          <div class="veldrij">
            <input type="text" id="voorstelTitel" aria-label="Titel" placeholder="Titel">
            <input type="url" id="voorstelUrl" aria-label="Adres" placeholder="https://…">
          </div>
          <input type="text" id="voorstelOmschrijving" aria-label="Omschrijving" placeholder="Wat vind je er, in één zin?">
          <div class="knoppen klein-boven"><button type="button" class="knop secundair klein" data-actie="voorstel">Maak voorstel</button></div>
          <pre id="voorstelUit" class="ai-onbekend" hidden></pre>
        </details>
      </div>
    </details>`;
}

export function materiaalStap(les, data, staat, concept = {}, bronnenPerVak = null) {
  const p = pakketVoor(les, data, staat, concept);
  const huidig = p.alle.find((d) => d.id === staat.doc) ?? p.docent[0];
  const opties = { dyslexie: staat.dyslexie, schoolnaam: data.profiel.school.naam };
  const knop = (d) => { const o = openVelden(d); return html`<li><button type="button" data-actie="mat-doc" data-doc="${d.id}" aria-current="${d.id === huidig.id}"><span>${d.titel.split(':')[0]}${o ? html` <span class="open-velden" aria-label="${o} ${o === 1 ? 'veld' : 'velden'} nog invullen">${o} open</span>` : ''}</span><span class="n">${d.aantal ? `${d.aantal}×` : ''}</span></button></li>`; };
  const nodigDocent = p.nodig.filter((d) => d.voor === 'docent');
  const nodigLeerling = p.nodig.filter((d) => d.voor !== 'docent');
  const totaalOpen = p.nodig.reduce((n, d) => n + openVelden(d), 0);
  const docsOpen = p.nodig.filter((d) => openVelden(d) > 0).length;
  const huidigOpen = openVelden(huidig);
  return html`
    <div class="mat-acties niet-printen">
      <button type="button" class="knop klein" data-actie="print-alles">Alles printen</button>
      <button type="button" class="knop secundair klein" data-actie="exp" data-soort="alle-pdf">Alles als PDF</button>
      <button type="button" class="knop secundair klein" data-actie="exp" data-soort="alle-docx">Alles als Word</button>
      <button type="button" class="knop secundair klein" data-actie="exp" data-soort="pptx">Presentatie (.pptx)</button>
      <button type="button" class="knop secundair klein" data-actie="exp" data-soort="les">Lesbestand bewaren</button>
      <a class="knop secundair klein" href="#digibord">Digibordmodus</a>
    </div>
    ${inFrame ? html`<p class="export-melding">In deze ingebedde preview kan de browser downloaden en printen tegenhouden. Op de echte website werkt het gewoon.</p>` : ''}
    <div class="panelen niet-printen">
      ${aiPaneel(les, data, staat, concept, p)}
      ${bronnenPaneel(les, data, staat, concept, bronnenPerVak)}
    </div>
    <div class="mat-opties niet-printen">
      <label class="schakel"><input type="checkbox" data-actie="mat-optie" data-optie="dyslexie" ${staat.dyslexie ? 'checked' : ''}> <span>Dyslexievriendelijk leerlingmateriaal</span></label>
      <label class="schakel"><input type="checkbox" data-actie="mat-optie" data-optie="rustig" ${staat.rustig ? 'checked' : ''}> <span>Rustige versie (minder tegelijk op een blad)</span></label>
    </div>
    ${totaalOpen ? html`<p class="melding open-samenvatting niet-printen">Nog <b>${totaalOpen} ${totaalOpen === 1 ? 'veld' : 'velden'}</b> in te vullen in ${docsOpen} ${docsOpen === 1 ? 'document' : 'documenten'} (gemarkeerd met een gele stippellijn). Vul ze zelf in in Word, of laat ze vullen met <button type="button" class="knop-link" data-actie="ai-open">Maak af met AI</button>.${!les.doel.lesdoelen.length || !les.doel.begrippen?.length ? ' Tip: vul bij de eerste stap ook een lesdoel en een paar kernbegrippen in; dan vult Uniekind een groot deel zelf.' : ''}</p>`
      : html`<p class="melding ok niet-printen">Alles is ingevuld. Lees het materiaal nog even na op juistheid en niveau.</p>`}
    ${p.advies.dyslexievriendelijk && !staat.dyslexie ? html`<p class="melding">Er zitten leerlingen met dyslexie in deze klas. Zet "Dyslexievriendelijk" aan voor hun exemplaren.</p>` : ''}
    <div class="mat">
      <nav class="mat-lijst" aria-label="Documenten">
        <h3 class="mat-groep">Nodig voor deze les</h3>
        <div><h4>Voor jou</h4><ul>${nodigDocent.map(knop)}</ul></div>
        ${les.lagen
          ? html`<div><h4>Voor de leerlingen, samen</h4><ul>${nodigLeerling.filter((d) => !d.laag).map(knop)}</ul></div>
            ${les.lagen.map((l) => html`<div><h4>Laag ${l.code}${l.onderwerp ? ` · ${l.onderwerp}` : ''}</h4><ul>${nodigLeerling.filter((d) => d.laag === l.id).map(knop)}</ul></div>`)}`
          : html`<div><h4>Voor de leerlingen</h4><ul>${nodigLeerling.map(knop)}</ul></div>`}
        ${p.meer.length ? html`<details class="mat-meer" ${p.meer.some((d) => d.id === huidig.id) ? 'open' : ''}><summary>Meer materiaal (${p.meer.length})</summary><ul>${p.meer.map(knop)}</ul></details>` : ''}
        ${p.aantallen.geschat ? html`<p class="hulp">Aantallen per niveau zijn geschat.</p>` : ''}
      </nav>
      <div>
        <div class="mat-acties niet-printen" style="margin-bottom:.75rem">
          <button type="button" class="knop secundair klein" data-actie="exp" data-soort="pdf">Dit document als PDF</button>
          <button type="button" class="knop secundair klein" data-actie="exp" data-soort="docx">Dit document als Word</button>
          ${huidig.aantal ? html`<span class="hulp">Print ${huidig.aantal}×${huidig.aantalUitleg ? `: ${huidig.aantalUitleg}` : ''}</span>` : ''}
          ${huidigOpen ? html`<span class="hulp"><b>${huidigOpen} ${huidigOpen === 1 ? 'veld' : 'velden'} nog invullen.</b> <button type="button" class="knop-link" data-actie="ai-open">Maak af met AI</button></span>` : ''}
        </div>
        <div class="mat-blad" tabindex="0" role="region" aria-label="Voorbeeld: ${huidig.titel}">${raw(documentHtml(huidig, opties))}</div>
      </div>
    </div>`;
}

/** Voert een export uit. */
export async function exporteer(soort, les, data, staat, concept) {
  const p = pakketVoor(les, data, staat, concept);
  const huidig = p.alle.find((d) => d.id === staat.doc) ?? p.docent[0];
  const o = { kleur: data.profiel.huisstijl.kleuren.hoofd, dyslexie: staat.dyslexie, schoolnaam: data.profiel.school.naam, titel: `Uniekind: ${les.doel.onderwerp || 'les'}` };
  const naam = les.doel.onderwerp || 'les';
  if (soort === 'pdf' || soort === 'alle-pdf') {
    const { naarPdf } = await import('../export/pdf.js');
    const docs = soort === 'pdf' ? [huidig] : p.nodig;
    download(await naarPdf(docs, { ...o, toonAantal: soort !== 'pdf' }), bestandsnaam(soort === 'pdf' ? `${huidig.id}-${naam}` : `materiaal-${naam}`, 'pdf'));
  } else if (soort === 'docx' || soort === 'alle-docx') {
    const { naarDocx } = await import('../export/docx.js');
    const docs = soort === 'docx' ? [huidig] : p.nodig;
    download(await naarDocx(docs, { ...o, toonAantal: soort !== 'docx' }), bestandsnaam(soort === 'docx' ? `${huidig.id}-${naam}` : `materiaal-${naam}`, 'docx'));
  } else if (soort === 'pptx') {
    const { naarPptx } = await import('../export/pptx.js');
    download(await naarPptx(les, { ...data, ai: concept.ai ?? {}, aiLagen: concept.aiLagen ?? {} }), bestandsnaam(`presentatie-${naam}`, 'pptx'));
  } else if (soort === 'les') {
    download(new Blob([maakLesbestand(concept, les, profielId)], { type: 'application/json' }), bestandsnaam(naam, 'uniekind'));
  }
}

/** Alles printen: het hele pakket in een printvak zetten en het printvenster openen. */
export function printAlles(les, data, staat, concept) {
  const p = pakketVoor(les, data, staat, concept);
  let vak = document.getElementById('printvak');
  if (!vak) { vak = document.createElement('div'); vak.id = 'printvak'; document.body.appendChild(vak); }
  vak.innerHTML = allesHtml({ ...p, alle: p.nodig }, { dyslexie: staat.dyslexie, schoolnaam: data.profiel.school.naam });
  document.body.classList.add('print-alles');
  const klaar = () => { document.body.classList.remove('print-alles'); vak.innerHTML = ''; window.removeEventListener('afterprint', klaar); };
  window.addEventListener('afterprint', klaar);
  window.print();
}
