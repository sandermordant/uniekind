// Toegankelijkheid op de telefoon (375 px): schuifvakken moeten met het toetsenbord bereikbaar zijn
// (axe: scrollable-region-focusable) en een lesblok mag niet breder worden dan het scherm.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

function jsBestanden(map) {
  return readdirSync(map, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? jsBestanden(join(map, d.name)) : d.name.endsWith('.js') ? [join(map, d.name)] : []);
}

describe('Schuifvakken zijn bereikbaar met het toetsenbord', () => {
  // Elk element met class tabelvak of mat-blad kan zijwaarts schuiven op een smal scherm.
  const vakken = jsBestanden('src').flatMap((pad) =>
    [...readFileSync(pad, 'utf8').matchAll(/<div class="(?:tabelvak|mat-blad)\b[^>]*>/g)].map((m) => ({ pad, tag: m[0] })));

  it('er zijn schuifvakken gevonden', () => {
    expect(vakken.length).toBeGreaterThanOrEqual(7);
  });
  it.each(vakken.map((v) => [v.pad, v.tag]))('%s: %s', (_pad, tag) => {
    expect(tag).toContain('tabindex="0"');
    expect(tag).toContain('role="region"');
    expect(tag).toMatch(/aria-label="[^"]+"/);
  });
});

describe('Een lesblok blijft binnen het scherm', () => {
  const css = readFileSync('src/stijl/wizard.css', 'utf8');
  it('de kolom van een lesblok mag krimpen', () => {
    expect(css).toMatch(/\.lesblok \{[^}]*grid-template-columns: minmax\(0, 1fr\)/);
  });
  it('lange labels in een lesblok lopen door naar de volgende regel', () => {
    expect(css).toMatch(/\.lesblok \.chip \{[^}]*white-space: normal/);
  });
});
