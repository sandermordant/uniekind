// Stap 7: het materiaalpakket bekijken, aanpassen (dyslexievriendelijk, rustig) en exporteren.
import { html, raw, inFrame } from '../util/html.js';
import { maakMateriaal } from '../materiaal/maak.js';
import { rustig } from '../materiaal/model.js';
import { documentHtml, allesHtml } from '../materiaal/html.js';
import { bestandsnaam, download } from '../export/delen.js';
import { maakLesbestand } from '../export/lesbestand.js';
import { profielId } from '../data/laden.js';

export function pakketVoor(les, data, staat) {
  const p = maakMateriaal(les, data);
  if (staat.rustig) for (const lijst of [p.docent, p.leerling, p.alle]) lijst.forEach((d, i) => { lijst[i] = rustig(d); });
  return p;
}

export function materiaalStap(les, data, staat) {
  const p = pakketVoor(les, data, staat);
  const huidig = p.alle.find((d) => d.id === staat.doc) ?? p.docent[0];
  const opties = { dyslexie: staat.dyslexie, schoolnaam: data.profiel.school.naam };
  const knop = (id, l) => html`<li><button type="button" data-actie="mat-doc" data-doc="${id.id}" aria-current="${id.id === huidig.id}"><span>${id.titel.split(':')[0]}</span><span class="n">${id.aantal ? `${id.aantal}×` : ''}</span></button></li>`;
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
    <div class="mat-opties niet-printen">
      <label class="schakel"><input type="checkbox" data-actie="mat-optie" data-optie="dyslexie" ${staat.dyslexie ? 'checked' : ''}> <span>Dyslexievriendelijk leerlingmateriaal</span></label>
      <label class="schakel"><input type="checkbox" data-actie="mat-optie" data-optie="rustig" ${staat.rustig ? 'checked' : ''}> <span>Rustige versie (minder tegelijk op een blad)</span></label>
    </div>
    ${p.advies.dyslexievriendelijk && !staat.dyslexie ? html`<p class="melding">Er zitten leerlingen met dyslexie in deze klas. Zet "Dyslexievriendelijk" aan voor hun exemplaren.</p>` : ''}
    <div class="mat">
      <nav class="mat-lijst" aria-label="Documenten">
        <div><h3>Voor jou</h3><ul>${p.docent.map(knop)}</ul></div>
        <div><h3>Voor de leerlingen</h3><ul>${p.leerling.map(knop)}</ul></div>
        ${p.aantallen.geschat ? html`<p class="hulp">Aantallen per niveau zijn geschat.</p>` : ''}
      </nav>
      <div>
        <div class="mat-acties niet-printen" style="margin-bottom:.75rem">
          <button type="button" class="knop secundair klein" data-actie="exp" data-soort="pdf">Dit document als PDF</button>
          <button type="button" class="knop secundair klein" data-actie="exp" data-soort="docx">Dit document als Word</button>
          ${huidig.aantal ? html`<span class="hulp">Print ${huidig.aantal}×${huidig.aantalUitleg ? `: ${huidig.aantalUitleg}` : ''}</span>` : ''}
        </div>
        <div class="mat-blad">${raw(documentHtml(huidig, opties))}</div>
      </div>
    </div>`;
}

/** Voert een export uit. Geeft een korte melding terug. */
export async function exporteer(soort, les, data, staat, concept) {
  const p = pakketVoor(les, data, staat);
  const huidig = p.alle.find((d) => d.id === staat.doc) ?? p.docent[0];
  const o = { kleur: data.profiel.huisstijl.kleuren.hoofd, dyslexie: staat.dyslexie, schoolnaam: data.profiel.school.naam, titel: `Uniekind: ${les.doel.onderwerp || 'les'}` };
  const naam = les.doel.onderwerp || 'les';
  if (soort === 'pdf' || soort === 'alle-pdf') {
    const { naarPdf } = await import('../export/pdf.js');
    const docs = soort === 'pdf' ? [huidig] : p.alle;
    download(await naarPdf(docs, { ...o, toonAantal: soort !== 'pdf' }), bestandsnaam(soort === 'pdf' ? `${huidig.id}-${naam}` : `materiaal-${naam}`, 'pdf'));
  } else if (soort === 'docx' || soort === 'alle-docx') {
    const { naarDocx } = await import('../export/docx.js');
    const docs = soort === 'docx' ? [huidig] : p.alle;
    download(await naarDocx(docs, { ...o, toonAantal: soort !== 'docx' }), bestandsnaam(soort === 'docx' ? `${huidig.id}-${naam}` : `materiaal-${naam}`, 'docx'));
  } else if (soort === 'pptx') {
    const { naarPptx } = await import('../export/pptx.js');
    download(await naarPptx(les, data), bestandsnaam(`presentatie-${naam}`, 'pptx'));
  } else if (soort === 'les') {
    download(new Blob([maakLesbestand(concept, les, profielId)], { type: 'application/json' }), bestandsnaam(naam, 'uniekind'));
  }
  return 'Klaar. Het bestand staat in je downloads.';
}

/** Alles printen: het hele pakket in een printvak zetten en het printvenster openen. */
export function printAlles(les, data, staat) {
  const p = pakketVoor(les, data, staat);
  let vak = document.getElementById('printvak');
  if (!vak) { vak = document.createElement('div'); vak.id = 'printvak'; document.body.appendChild(vak); }
  vak.innerHTML = allesHtml(p, { dyslexie: staat.dyslexie, schoolnaam: data.profiel.school.naam });
  document.body.classList.add('print-alles');
  const klaar = () => { document.body.classList.remove('print-alles'); vak.innerHTML = ''; window.removeEventListener('afterprint', klaar); };
  window.addEventListener('afterprint', klaar);
  window.print();
}
