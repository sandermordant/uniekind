// Foto van een paragraaf → tekst, volledig in de browser met Tesseract.js en het Nederlandse taalpakket.
// De foto verlaat de computer niet en wordt nergens opgeslagen. Alleen het taalpakket wordt (van de eigen site)
// geladen en door de browser in zijn cache bewaard, zodat de tweede keer sneller gaat.

const MAX_ZIJDE = 2200; // grote telefoonfoto's verkleinen: sneller en vaak nauwkeuriger

/** Afbeelding inlezen, verkleinen en omzetten naar grijs, via een canvas. */
async function voorbereiden(bestand) {
  const url = URL.createObjectURL(bestand);
  try {
    const img = await new Promise((ok, fout) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fout(new Error('Deze afbeelding kan niet worden geopend.')); i.src = url; });
    const f = Math.min(1, MAX_ZIJDE / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * f);
    c.height = Math.round(img.naturalHeight * f);
    const g = c.getContext('2d', { willReadFrequently: true });
    g.filter = 'grayscale(1) contrast(1.15)';
    g.drawImage(img, 0, 0, c.width, c.height);
    return c;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Opgeschoonde tekst: afgebroken woorden aan elkaar, losse regels binnen een alinea samen. */
export function schoonOcrTekst(t) {
  return String(t ?? '')
    .replace(/\r/g, '')
    .replace(/(\w)-\n(\w)/g, '$1$2') // woordafbreking
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((r) => r.trim())
    .join('\n')
    .trim();
}

/**
 * Herkent de tekst op een foto.
 * @param {File|Blob} bestand
 * @param {(fractie:number, status:string)=>void} voortgang
 */
export async function herkenTekst(bestand, voortgang = () => {}) {
  const basis = new URL('./ocr/', document.baseURI).href;
  voortgang(0, 'Foto voorbereiden');
  const canvas = await voorbereiden(bestand);
  voortgang(0.05, 'Herkenning laden');
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('nld', 1, {
    workerPath: `${basis}worker.js`,
    corePath: `${basis}core`,
    langPath: `${basis}lang`,
    gzip: true,
    workerBlobURL: false,
    logger: (m) => {
      if (m.status === 'recognizing text') voortgang(0.15 + 0.85 * (m.progress ?? 0), 'Tekst herkennen');
      else if (/loading|initializ/.test(m.status ?? '')) voortgang(0.05 + 0.1 * (m.progress ?? 0), 'Taalpakket laden');
    }
  });
  try {
    const { data } = await worker.recognize(canvas);
    voortgang(1, 'Klaar');
    return { tekst: schoonOcrTekst(data.text), zekerheid: Math.round(data.confidence ?? 0) };
  } finally {
    await worker.terminate();
    canvas.width = canvas.height = 0; // geheugen vrijgeven; de foto wordt niet bewaard
  }
}
