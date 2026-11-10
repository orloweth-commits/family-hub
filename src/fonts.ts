/* ------------------------------------------------------------------ *
 * Fonts ship with the card (dist/fonts, see public/fonts/LICENSES.md) and load
 * from wherever the card itself was loaded. Nothing is fetched from a font service.
 * A look names the families it needs; each is added once, the first time it is used.
 * ------------------------------------------------------------------ */

const here = import.meta.url;
const base = (): string => { try { return new URL('fonts/', here).href; } catch { return 'fonts/'; } };

/** family → [file, weight range] */
const FACES: Record<string, [string, string]> = {
  'Inter': ['inter.woff2', '100 900'],
  'Bricolage Grotesque': ['bricolage-grotesque.woff2', '200 800'],
  'Caveat': ['caveat.woff2', '400 700'],
  'Fredoka': ['fredoka.woff2', '300 700'],
  'Outfit': ['outfit.woff2', '100 900']
};
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const loaded = new Set<string>();

export const loadFonts = (...families: string[]): void => {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('family-hub-fonts') as HTMLStyleElement | null;
  if (!el) { el = document.createElement('style'); el.id = 'family-hub-fonts'; document.head.appendChild(el); loaded.clear(); }
  for (const f of families) {
    const face = FACES[f];
    if (!face || loaded.has(f)) continue;
    loaded.add(f);
    el.appendChild(document.createTextNode(`@font-face{font-family:'${f}';font-style:normal;font-display:swap;font-weight:${face[1]};src:url(${base()}${face[0]}) format('woff2');unicode-range:${LATIN}}`));
  }
};
