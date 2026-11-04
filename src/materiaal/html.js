// Documentmodel → HTML, voor de preview op het scherm en voor printen.
import { escape } from '../util/html.js';

/** Tekst veilig maken en ⟦invulvelden⟧ markeren. */
export const tekstHtml = (s) => escape(s ?? '').replace(/⟦([^⟧]*)⟧/g, '<mark class="invul">$1</mark>');

function schemaHtml(b) {
  const it = b.items ?? [];
  if (b.soort === 'woordweb') {
    const rond = [...it.slice(1), '', '', '', '', '', ''].slice(0, 6);
    return `<div class="sch-woordweb"><div class="kern">${tekstHtml(it[0] ?? '')}</div>${rond.map((x, i) => `<div class="tak t${i}">${tekstHtml(x)}</div>`).join('')}</div>`;
  }
  if (b.soort === 'oorzaak-gevolg') {
    return `<div class="sch-og"><div class="vak"><b>Oorzaak</b></div><div class="pijl">→</div><div class="vak midden"><b>${tekstHtml(it[0] ?? '')}</b></div><div class="pijl">→</div><div class="vak"><b>Gevolg</b></div></div>`;
  }
  if (b.soort === 'tijdlijn') {
    return `<div class="sch-tijdlijn">${[...it, '', ''].slice(0, 5).map((x) => `<div class="punt"><span class="stip"></span><span class="jaar">Jaar: ____</span><span>${tekstHtml(x)}</span></div>`).join('')}</div>`;
  }
  const [a, c] = [it[0] ?? '⟦begrip 1⟧', it[1] ?? '⟦begrip 2⟧'];
  return `<table class="sch-vergelijk"><thead><tr><th></th><th>${tekstHtml(a)}</th><th>${tekstHtml(c)}</th></tr></thead><tbody>${['Wat is het?', 'Kenmerk', 'Voorbeeld', 'Overeenkomst of verschil'].map((r) => `<tr><th>${r}</th><td></td><td></td></tr>`).join('')}</tbody></table>`;
}

function blokHtml(b) {
  switch (b.t) {
    case 'kop': return `<h${b.niveau + 1} class="d-kop">${tekstHtml(b.tekst)}</h${b.niveau + 1}>`;
    case 'alinea': return `<p class="${b.klein ? 'klein' : ''} ${b.nadruk ? 'nadruk' : ''}">${tekstHtml(b.tekst)}</p>`;
    case 'lijst': return `<${b.genummerd ? 'ol' : 'ul'}>${b.items.map((x) => `<li>${tekstHtml(x)}</li>`).join('')}</${b.genummerd ? 'ol' : 'ul'}>`;
    case 'vink': return `<ul class="vink">${b.items.map((x) => `<li><span class="hokje"></span>${tekstHtml(x)}</li>`).join('')}</ul>`;
    case 'tabel': return `<table class="d-tabel">${b.kop?.some(Boolean) ? `<thead><tr>${b.kop.map((k, i) => `<th${b.breedtes ? ` style="width:${b.breedtes[i]}%"` : ''}>${tekstHtml(k)}</th>`).join('')}</tr></thead>` : ''}<tbody>${b.rijen.map((r) => `<tr>${r.map((c) => `<td>${tekstHtml(c) || '&nbsp;'}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'vraag': return `<div class="d-vraag"><p><span class="nr">${b.nr}</span> ${tekstHtml(b.tekst)}${b.label ? ` <span class="niv">${tekstHtml(b.label)}</span>` : ''}</p>${'<div class="regel"></div>'.repeat(b.regels)}</div>`;
    case 'regels': return '<div class="regel"></div>'.repeat(b.aantal);
    case 'invulveld': return `<div class="d-invul"><p><mark class="invul">${tekstHtml(b.tekst)}</mark></p>${b.voorbeeld ? `<p class="klein">${tekstHtml(b.voorbeeld)}</p>` : ''}</div>`;
    case 'kader': return `<section class="d-kader">${b.titel ? `<h4>${tekstHtml(b.titel)}</h4>` : ''}${b.blokken.map(blokHtml).join('')}</section>`;
    case 'schaal': return `<table class="d-schaal"><thead><tr><th></th>${b.kolommen.map((k) => `<th>${tekstHtml(k)}</th>`).join('')}</tr></thead><tbody>${b.items.map((x) => `<tr><td>${tekstHtml(x)}</td>${b.kolommen.map(() => '<td class="hk"><span class="hokje"></span></td>').join('')}</tr>`).join('')}</tbody></table>`;
    case 'schema': return `<div class="d-schema">${schemaHtml(b)}</div>`;
    case 'kaarten': return `<div class="d-kaarten per-${b.perPagina}">${b.kaarten.map((k) => `<article class="d-kaart" data-kleur="${k.kleur ?? ''}"><h4>${tekstHtml(k.titel)}</h4>${k.blokken.map(blokHtml).join('')}</article>`).join('')}</div>`;
    case 'pagina': return '<div class="d-pagina-einde"></div>';
    default: return '';
  }
}

export function documentHtml(doc, o = {}) {
  const klassen = ['d-doc', doc.voor, o.dyslexie && doc.voor === 'leerling' ? 'dyslexie' : '', doc.rustig ? 'rustig' : ''].join(' ');
  return `<article class="${klassen}" data-doc="${escape(doc.id)}">
    <header class="d-kopregel"><span>${escape(o.schoolnaam ?? '')}${o.schoolnaam ? ' · ' : ''}Uniekind</span>${o.toonAantal && doc.aantal ? `<span class="d-aantal">Print ${doc.aantal}×</span>` : ''}</header>
    <h2 class="d-titel">${tekstHtml(doc.titel)}</h2>
    ${doc.ondertitel ? `<p class="d-ondertitel">${tekstHtml(doc.ondertitel)}</p>` : ''}
    ${doc.blokken.map(blokHtml).join('')}
  </article>`;
}

/** Alles printen: een printlijst met aantallen en daarna elk document op een nieuwe pagina. */
export function allesHtml(pakket, o = {}) {
  const docs = pakket.alle;
  const lijstHtml = `<article class="d-doc docent"><h2 class="d-titel">Printlijst</h2><p>Print van elk document het aantal hieronder. Daarna volgt elk document één keer.</p>
    <table class="d-tabel"><thead><tr><th>Document</th><th>Aantal</th><th>Toelichting</th></tr></thead><tbody>
    ${docs.map((d) => `<tr><td>${tekstHtml(d.titel)}</td><td>${d.aantal}</td><td>${escape(d.aantalUitleg ?? '')}</td></tr>`).join('')}
    </tbody></table>${pakket.aantallen.geschat ? '<p class="klein">De aantallen per niveau zijn geschat; print er een paar extra.</p>' : ''}</article>`;
  return `<div class="d-alles">${lijstHtml}${docs.map((d) => documentHtml(d, { ...o, toonAantal: true })).join('')}</div>`;
}
