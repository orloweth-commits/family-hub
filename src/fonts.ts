/* ------------------------------------------------------------------ *
 * Fonts ship with the card (dist/fonts, see public/fonts/LICENSES.md) and load
 * from wherever the card itself was loaded. Nothing is fetched from a font service.
 * A look names the families it needs; each is added once, the first time it is used.
 * ------------------------------------------------------------------ */

const here = import.meta.url;
const base = (): string => { try { return new URL('fonts/', here).href; } catch { return 'fonts/'; } };

/** family → [file, weight range, and the characters it is for when they are not Latin] */
const FACES: Record<string, [string, string, string?]> = {
  'Inter': ['inter.woff2', '100 900'],
  'Bricolage Grotesque': ['bricolage-grotesque.woff2', '200 800'],
  'Caveat': ['caveat.woff2', '400 700'],
  'Fredoka': ['fredoka.woff2', '300 700'],
  'Outfit': ['outfit.woff2', '100 900'],
  'Jost': ['jost.woff2', '100 900'],
  'Cormorant Garamond': ['cormorant-garamond.woff2', '300 700'],
  // Emoji as fine line drawings in the colour of the words, for a look with no cartoons (Obsidian). A look puts it after its
  // text family; it answers only for emoji and pictographs, so letters, digits and spaces never come from it.
  'Noto Emoji': ['noto-emoji.woff2', '300', 'U+200D,U+203C,U+2049,U+20E3,U+2139,U+2194-21AA,U+231A-23FF,U+24C2,U+25AA-25FE,U+2600-27BF,U+2934-2935,U+2B05-2B55,U+3030,U+303D,U+3297,U+3299,U+FE0E-FE0F,U+1F000-1FAFF,U+E0020-E007F']
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
    el.appendChild(document.createTextNode(`@font-face{font-family:'${f}';font-style:normal;font-display:swap;font-weight:${face[1]};src:url(${base()}${face[0]}) format('woff2');unicode-range:${face[2] ?? LATIN}}`));
  }
};
