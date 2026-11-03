// Kleine hulpfuncties om veilig HTML op te bouwen.
// Alles wat via ${...} in html`` komt, wordt ge-escaped, behalve waarden die met raw() zijn gemarkeerd
// of arrays van eerder gebouwde html``-fragmenten.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escape = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}
export const raw = (s) => new Raw(s);

function waarde(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(waarde).join('');
  return escape(v);
}

export function html(strings, ...vals) {
  let out = strings[0];
  for (let i = 0; i < vals.length; i++) out += waarde(vals[i]) + strings[i + 1];
  return new Raw(out);
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Draait in een iframe (bijvoorbeeld een preview)? Dan werken printen en downloaden niet altijd. */
export const inFrame = (() => { try { return window.self !== window.top; } catch { return true; } })();
