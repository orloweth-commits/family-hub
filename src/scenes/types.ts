import { type CSSResult, type TemplateResult, type nothing } from 'lit';

/**
 * A world behind the page. One file per world in this folder; `src/ambient.ts` shows whichever fits the look and theme.
 *
 * `always` is the slow life that is there the whole time (clouds, water, stars). `cast` is who wanders through, one at a time.
 * Everything is drawn as inline SVG or plain elements, animated with transform and opacity only, and never takes a touch.
 * Class names in `css` must start with the world's own prefix (`sea-`, `reef-`, `bush-`, `sp-`, `fr-`, `gd-`) so worlds cannot clash.
 */
export interface Ctx { look: string; theme: string; tod: 'day' | 'eve' | 'night'; /** minutes since midnight */ mins: number; /** 0 = Sunday */ weekday: number; month: number; date: number; /** where the page's furniture is (only for worlds that ask with `solo`) */ lay?: Lay; /** the weather entity says rain */ rainy?: boolean }
/** The page as the layer finds it, in the layer's own px: its size, the body's top and bottom, the dock's box, and the free lanes
 *  (`gutter` between body and dock, `strip` under the dock, `corner` beside it). On a phone the dock floats, so there are no lanes. */
export interface Lay { w: number; h: number; top: number; bottom: number; dl: number; dr: number; dt: number; db: number; gutter: number; strip: number; corner: number; phone: boolean }
export interface Visitor {
  id: string;
  /** how long the visit lasts, in ms (the element is removed after this) */
  ms: number;
  /** how it moves: built-in paths from ambient.ts (`across`, `streak`, `up`, `down`, `flit`, `buzz`, `peek`, with `bobbing`, `wobble`, `foot`) or the world's own class with its own keyframes. `--t` is the visit's duration, `--y` and `--x` its start in % */
  move: string;
  art: TemplateResult;
  /** more likely the higher (default 1); a function when it depends on the day */
  weight?: number | ((c: Ctx) => number);
  /** where it may start, in % of the height (default 1 to 10: the open band above the panels) */
  y?: [number, number];
  /** may come from either side (the art is mirrored when it comes from the right); default true */
  flip?: boolean;
  /** drawn in front of the page instead of behind it: only for small, quick visitors (at most 72 px, at most 12 s) that never stop over text */
  front?: boolean;
  /** only at certain times (evening only, Fridays, December…) */
  when?: (c: Ctx) => boolean;
  /** it keeps to the gutter above the dock, the strip under it or the corners beside it, so it is drawn outside the masks that hide visitors there */
  lane?: boolean;
  /** a rare surprise: at most once a day, or once an hour (kept in memory; it also counts towards the world's `rare` limits) */
  max?: 'day' | 'hour';
}
export interface Scene {
  css: CSSResult; always(c: Ctx): TemplateResult | typeof nothing; cast: Visitor[];
  /** the quiet gap between visitors, in ms, counted from when the last one has gone (default: 25 to 80 s from when it came) */
  gap?: [number, number];
  /** one visitor at a time over both layers, never the same one twice running, none while the card says `hold`, gone when the tab is hidden; the layer also measures the page (`Ctx.lay`) */
  solo?: boolean;
  /** `always` has nothing that moves, so it stays in calm mode and with reduce-motion */
  still?: boolean;
  /** limits for all visitors that have a `max`: at least `every` ms apart, at most `day` a day, none from `until` (minutes since midnight) */
  rare?: { every: number; day: number; until?: number };
}

/** The same "random" every time, so a sky does not reshuffle on each render. */
export const rnd = (seed: number): (() => number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
export const spots = (n: number, seed: number, y0: number, y1: number): { x: number; y: number; d: number; s: number }[] => { const r = rnd(seed); return Array.from({ length: n }, () => ({ x: r() * 100, y: y0 + r() * (y1 - y0), d: r() * 8, s: 0.6 + r() * 0.8 })); };
/** many tiny dots as one box-shadow (cheap: one element) */
export const field = (n: number, seed: number, colour: string): string => { const r = rnd(seed); return Array.from({ length: n }, () => `${(r() * 100).toFixed(2)}vw ${(r() * 100).toFixed(2)}vh 0 ${r() < 0.2 ? 1 : 0}px ${colour}`).join(','); };
export const dot = (cls: string, p: { x: number; y: number; d: number; s: number }): string => `--x:${p.x.toFixed(1)}%;--y:${p.y.toFixed(1)}%;--d:${p.d.toFixed(2)};--s:${p.s.toFixed(2)}`;
