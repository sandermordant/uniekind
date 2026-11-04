// Gedeelde hulpjes voor de exports.

/** Splits tekst in stukken, waarbij ⟦invulvelden⟧ gemarkeerd worden. */
export function segmenten(s) {
  const uit = [];
  const re = /⟦([^⟧]*)⟧/g;
  let i = 0;
  let m;
  const t = String(s ?? '');
  while ((m = re.exec(t))) {
    if (m.index > i) uit.push({ tekst: t.slice(i, m.index), invul: false });
    uit.push({ tekst: m[1], invul: true });
    i = m.index + m[0].length;
  }
  if (i < t.length) uit.push({ tekst: t.slice(i), invul: false });
  return uit.length ? uit : [{ tekst: '', invul: false }];
}

export const hex = (kleur) => String(kleur ?? '#00489a').replace('#', '').toUpperCase();

/** Bestandsnaam zonder rare tekens. */
export function bestandsnaam(basis, ext) {
  const n = String(basis || 'uniekind').normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase().slice(0, 60);
  return `${n || 'uniekind'}.${ext}`;
}

/** Bestand aanbieden als download (werkt op de echte site; in een ingebedde preview kan de browser het blokkeren). */
export function download(blob, naam) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = naam;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
