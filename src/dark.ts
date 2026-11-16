/**
 * Dark mode for the Glass look (every photo theme but Space, which is dark already).
 *
 * It is a second set of the theme's own variables (themes.ts: `dark`), so every page follows without being named.
 * The choice is kept per screen, like the look: Light, Dark or Auto. Auto is dark from sunset to sunrise (`sun.sun`)
 * and, where the screen has a room-light reading in lux, dark in a dim room by day as well, with a margin between
 * "dim" and "bright again" so it never flickers between the two.
 *
 * Two things live here, and neither names a page:
 *   the MODE the family chose (`getDarkMode`), and
 *   whether dark glass is ON the screen right now (`glassDark`), which the card works out and every component follows
 *   through its `data-dark` host attribute (LookController).
 */
export type DarkMode = 'light' | 'dark' | 'auto';
export const DARK_KEY = 'family-hub-dark';
export const DARK_MODES: [DarkMode, string][] = [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto']];
const isMode = (v: unknown): v is DarkMode => v === 'light' || v === 'dark' || v === 'auto';

let mode: DarkMode = 'light', on = false, fading = false;
const modeSubs = new Set<() => void>(), onSubs = new Set<() => void>();

/** The choice for this screen: what was saved here, else the house's default (`dark:` in the card), else Light. */
export const initDarkMode = (fallback?: unknown): DarkMode => {
  let saved: string | null = null;
  try { saved = localStorage.getItem(DARK_KEY); } catch { /* storage unavailable */ }
  mode = isMode(saved) ? saved : isMode(fallback) ? fallback : 'light';
  return mode;
};
export const getDarkMode = (): DarkMode => mode;
export const setDarkMode = (m: DarkMode): void => {
  if (!isMode(m) || m === mode) return;
  mode = m;
  try { localStorage.setItem(DARK_KEY, m); } catch { /* ignore */ }
  modeSubs.forEach((f) => f());
};
export const onDarkMode = (f: () => void): (() => void) => { modeSubs.add(f); return () => { modeSubs.delete(f); }; };

/** Is dark glass on the screen now? (Space is not counted: it is its own theme, dark by day as well.) */
export const glassDark = (): boolean => on;
/** Is the slow fade between the two running? */
export const glassFading = (): boolean => fading;
export const setGlassDark = (v: boolean, fade = false): void => {
  if (v === on && fade === fading) return;
  on = v; fading = fade;
  onSubs.forEach((f) => f());
};
export const onGlassDark = (f: () => void): (() => void) => { onSubs.add(f); return () => { onSubs.delete(f); }; };

/** A dim room: below LUX_DARK it goes dark; it is light again only above LUX_LIGHT (about a lamp-lit room). */
export const LUX_DARK = 10, LUX_LIGHT = 30;
/** How long Auto's wish must stand before the screen changes (a shadow over the sensor, a light flicked on and off). */
export const AUTO_HOLD_MS = 30_000;
/** The slow fade from one to the other. */
export const DARK_FADE_MS = 1600;

export interface AutoIn {
  /** Home Assistant's sun: 'above_horizon' | 'below_horizon'; undefined when there is no sun entity */
  sun?: string;
  /** the room's light in lux, when the screen has a reading */
  lux?: number;
  /** the hour of the day (0 to 23), used only when there is no sun entity */
  hour: number;
  /** what Auto last said, so the room's margin can hold */
  was: boolean;
}
/** Should Auto be dark? Pure, so it can be tested without a house. */
export const autoDark = (i: AutoIn): boolean => {
  const sunDown = i.sun === 'below_horizon' ? true : i.sun === 'above_horizon' ? false : i.hour >= 19 || i.hour < 6;
  if (sunDown) return true;
  const lux = Number.isFinite(i.lux) && (i.lux as number) >= 0 ? (i.lux as number) : undefined;
  if (lux === undefined) return false;
  return i.was ? lux < LUX_LIGHT : lux < LUX_DARK;
};
