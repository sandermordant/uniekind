// Het antwoord van de AI-tool teruglezen in de vaste blokken.
// Robuust voor wat Copilot en andere chat-AI's vaak doen: markdown, vetgedrukte koppen, codeblokken, JSON.
import { IDS } from './formaat.js';

const norm = (s) => String(s).toUpperCase().replace(/[_\s]+/g, '-').replace(/[^A-Z0-9-]/g, '');

/** Markdown-opmaak weghalen, maar de regels en nummering laten staan. */
export function schoon(t) {
  return String(t ?? '')
    .replace(/\r/g, '')
    .replace(/```[a-z]*\n?/gi, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^\s*[-*•]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * @returns {{ blokken: Record<string,string>, onbekend: string[], herkend: string[] }}
 */
export function leesAntwoord(tekst, ids = IDS) {
  const ruw = String(tekst ?? '').trim();
  const blokken = {};
  const onbekend = [];

  // 1. JSON (eventueel in een codeblok)
  const jsonDeel = ruw.replace(/^```(json)?\s*/i, '').replace(/```\s*$/, '').trim();
  if (jsonDeel.startsWith('{')) {
    try {
      const obj = JSON.parse(jsonDeel);
      for (const [k, v] of Object.entries(obj)) {
        const id = norm(k);
        const tekstWaarde = Array.isArray(v) ? v.map((x, i) => (typeof x === 'string' ? `${i + 1}. ${x}` : JSON.stringify(x))).join('\n') : typeof v === 'string' ? v : JSON.stringify(v, null, 1);
        if (ids.includes(id)) blokken[id] = schoon(tekstWaarde);
        else onbekend.push(`${k}: ${tekstWaarde}`);
      }
      return { blokken, onbekend, herkend: Object.keys(blokken) };
    } catch { /* geen geldige JSON: lees als tekst */ }
  }

  // 2. Tekst met koppen. Herkent "### NAAM", "## NAAM", "**NAAM**", "NAAM:" en "Hintkaart 1" in elke schrijfwijze.
  const regels = ruw.replace(/\r/g, '').split('\n');
  const kopRe = /^\s*(?:#{1,6}\s*)?(?:\*\*|__)?\s*([A-Za-z][A-Za-z0-9 _-]{2,40}?)\s*(?:\*\*|__)?\s*:?\s*(?:\*\*|__)?\s*$/;
  let huidig = null;
  let buffer = [];
  const sluit = () => {
    const inhoud = schoon(buffer.join('\n'));
    if (huidig) blokken[huidig] = blokken[huidig] ? `${blokken[huidig]}\n${inhoud}` : inhoud;
    else if (inhoud) onbekend.push(inhoud);
    buffer = [];
  };
  for (const r of regels) {
    const m = r.match(kopRe);
    const id = m ? norm(m[1]) : null;
    const isKop = id && ids.includes(id);
    const andereKop = !isKop && /^\s*#{1,6}\s+\S/.test(r);
    if (isKop) { sluit(); huidig = id; continue; }
    if (andereKop) { sluit(); huidig = null; buffer.push(r.replace(/^\s*#+\s*/, '')); continue; }
    buffer.push(r);
  }
  sluit();
  // Afsluitende chat-zinnen ("Wil je dat ik …?", "Laat me weten …") horen niet bij het laatste blok
  const laatste = Object.keys(blokken).at(-1);
  if (laatste) {
    const r = blokken[laatste].split('\n');
    const staart = [];
    while (r.length && /^(wil je|laat (me|het) weten|zal ik|ik hoop|succes|veel succes|heb je nog|als je wilt|ik kan ook)/i.test(r.at(-1).trim())) staart.unshift(r.pop());
    if (staart.length) { blokken[laatste] = r.join('\n').trim(); onbekend.push(staart.join('\n')); }
  }
  for (const k of Object.keys(blokken)) if (!blokken[k]) delete blokken[k];
  return { blokken, onbekend: onbekend.filter((x) => x.trim()), herkend: Object.keys(blokken) };
}

/* ───── Blokken omzetten naar bruikbare onderdelen ───── */

/** Genummerde lijst → [{ tekst, label }]. Regels zonder nummer horen bij de vorige vraag. */
export function vragen(t) {
  const uit = [];
  for (const r of String(t ?? '').split('\n').map((x) => x.trim()).filter(Boolean)) {
    const m = r.match(/^(\d+)[.)]\s*(.+)$/);
    if (m) uit.push({ tekst: m[2] });
    else if (uit.length) uit[uit.length - 1].tekst += ` ${r.replace(/^-\s*/, '')}`;
  }
  return uit.map((v) => {
    const l = v.tekst.match(/\s*\[([^\]]{3,30})\]\s*$/);
    return l ? { tekst: v.tekst.slice(0, l.index).trim(), label: l[1] } : { tekst: v.tekst.trim(), label: '' };
  });
}

/** Regels met "Sleutel: waarde" → object (sleutels in kleine letters, zonder spaties). */
export function velden(t) {
  const uit = {};
  let laatste = null;
  for (const r of String(t ?? '').split('\n').map((x) => x.trim()).filter(Boolean)) {
    const m = r.match(/^-?\s*([A-Za-zÀ-ÿ0-9 ]{1,24}):\s*(.*)$/);
    if (m) { laatste = m[1].toLowerCase().replace(/\s+/g, ''); uit[laatste] = m[2]; }
    else if (laatste) uit[laatste] += ` ${r}`;
  }
  return uit;
}

export const hintkaart = (t) => { const v = velden(t); return { opgave: v.opgave ?? '', hint1: v.hint1 ?? '', hint2: v.hint2 ?? '', uitwerking: v.uitwerking ?? '' }; };
export const checkvraag = (t) => { const v = velden(t); return { vraag: v.vraag ?? '', a: v.a ?? '', b: v.b ?? '', c: v.c ?? '', d: v.d ?? '', goed: (v.goed ?? '').trim().charAt(0).toUpperCase(), misvattingen: v.misvattingen ?? '' }; };
export const exitTicket = (t) => { const v = velden(t); return { steun: v.steun ?? '', basis: v.basis ?? '', verdieping: v.verdieping ?? '' }; };
export function vaktaal(t) {
  return String(t ?? '').split('\n').map((r) => r.replace(/^-\s*|^\d+[.)]\s*/, '').trim()).filter((r) => r.includes('|'))
    .map((r) => { const [begrip, omschrijving, voorbeeld] = r.split('|').map((x) => x.trim()); return { begrip, omschrijving: omschrijving ?? '', voorbeeld: voorbeeld ?? '' }; });
}
export function startcheck(t) {
  const [vr, ...rest] = String(t ?? '').split(/^\s*Antwoorden\s*:/im);
  return { vragen: vragen(vr), antwoorden: rest.join('').trim() };
}
export const regelsVan = (t) => String(t ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
