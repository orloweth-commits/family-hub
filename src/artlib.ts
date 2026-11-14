import type { FamilyHubConfig, Hass } from './types';
import { cropJpeg, dropMedia, keepMedia, mediaUrl } from './media';

/* ------------------------------------------------------------------ *
 * The record of every picture the panel has had painted: the nightly
 * artwork and the looks the children make in the studio. It is a
 * Home Assistant to-do list, so every screen and Home Assistant's own
 * automations see the same record, and nothing about the family is kept
 * in the repository.
 *   item name    the picture's file in local media
 *   description  a line of JSON: date, kind, who is in it, theme, …
 *   ticked off   hidden by a parent (kept, but never shown)
 * ------------------------------------------------------------------ */

/** The screensaver, the artwork and the painted characters: the card's `art` option. Everything here can be changed in Settings. */
export interface ArtConfig {
  /** minutes without a touch (or anyone near) before the artwork comes up; 0 turns the screensaver off. Default 3. */
  idle_minutes?: number;
  /** minutes each picture stays. Default 5. */
  interval_minutes?: number;
  /** how the panel knows someone is there: none (touch only), sensor (a binary_sensor) or camera (this screen's own camera, watched in the browser) */
  presence?: 'none' | 'sensor' | 'camera';
  presence_entity?: string;
  /** camera: how little movement counts (1 to 10, default 5), and how much of each edge of the picture to ignore (per cent, default 10) */
  camera_sensitivity?: number; camera_margin?: number;
  /** a light or number entity that sets the screen's brightness, and the brightness (per cent) while the artwork shows and at night */
  backlight?: string; backlight_art?: number; backlight_night?: number;
  /** while the hub is in use the brightness follows the sun's height and, when `backlight_room` names an illuminance sensor (lux), the room's light: between `backlight_min` (default 30) and `backlight_max` (default 100). `backlight_auto: false` keeps it at the maximum. */
  backlight_auto?: boolean; backlight_min?: number; backlight_max?: number; backlight_room?: string;
  /** the to-do list that records the pictures (default todo.family_hub_art) and the AI Task entity that paints them (default: the first there is) */
  list?: string; painter?: string;
  /** stop painting when this month's estimated spend reaches this many US dollars (default 40); what one picture is reckoned to cost (default 0.30) */
  cap?: number; cost?: number;
  /** new looks each child may have painted in a day (default 3; 0 = none) */
  looks_per_day?: number;
  /** the nightly artwork: in the look of the panel (default) or in the house style */
  style?: 'look' | 'house';
}
export const artOf = (c: FamilyHubConfig | undefined): ArtConfig => (c as { art?: ArtConfig } | undefined)?.art ?? {};
export const artListOf = (c: FamilyHubConfig | undefined): string => artOf(c).list || 'todo.family_hub_art';
export const ART_DEFAULTS = { idle: 3, interval: 5, cap: 40, cost: 0.3, looks: 3, sensitivity: 5, margin: 10, dimArt: 70, dimNight: 12, brightFloor: 30 };

export interface ArtItem {
  uid: string; file: string; hidden: boolean;
  /** the day it was made (YYYY-MM-DD) */
  d: string;
  kind: 'art' | 'look';
  /** who is in it: the children's names */
  who: string[];
  theme?: string; event?: string; look?: string; fav?: boolean;
  /** the words it was painted from */
  p?: string;
}
type Raw = { uid: string; summary: string; status?: string; description?: string | null };
const parse = (r: Raw): ArtItem => {
  let m: Partial<ArtItem> = {};
  try { const j = JSON.parse(r.description || '{}') as Partial<ArtItem>; if (j && typeof j === 'object') m = j; } catch { /* a line someone typed by hand */ }
  const d = typeof m.d === 'string' ? m.d : (/(20\d\d)-?(\d\d)-?(\d\d)/.exec(r.summary)?.slice(1).join('-') ?? '');
  return { uid: r.uid, file: r.summary, hidden: r.status === 'completed', d, kind: m.kind === 'look' || /^fhlook-/.test(r.summary) ? 'look' : 'art', who: Array.isArray(m.who) ? m.who.map(String) : [], theme: m.theme, event: m.event, look: m.look, fav: !!m.fav, p: m.p };
};
const meta = (i: Partial<ArtItem>): string => JSON.stringify({ d: i.d, kind: i.kind, who: i.who, theme: i.theme, event: i.event, look: i.look, fav: i.fav || undefined, p: i.p });
export const ymdOf = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The record. Null when the list does not exist (nothing has been set up yet) or cannot be read. */
export const loadArt = async (hass: Hass | undefined, list: string): Promise<ArtItem[] | null> => {
  if (!hass?.states[list]) return null;
  try { const r = await hass.callWS<{ items: Raw[] }>({ type: 'todo/item/list', entity_id: list }); return (r.items ?? []).filter((x) => /\.(jpe?g|png|webp)$/i.test(x.summary) || x.summary.startsWith('media-source:')).map(parse); } catch { return null; }
};
export const logArt = async (hass: Hass, list: string, file: string, i: Partial<ArtItem>): Promise<boolean> => {
  if (!hass.states[list]) return false;
  try { await hass.callService('todo', 'add_item', { item: file, description: meta({ d: ymdOf(new Date()), ...i }) }, { entity_id: list }); return true; } catch { return false; }
};
/** Favourite or hide a picture. */
export const markArt = async (hass: Hass, list: string, it: ArtItem, change: { fav?: boolean; hidden?: boolean }): Promise<boolean> => {
  const next = { ...it, ...change };
  try { await hass.callService('todo', 'update_item', { item: it.uid, description: meta(next), status: next.hidden ? 'completed' : 'needs_action' }, { entity_id: list }); return true; } catch { return false; }
};
/** Delete a picture for good: its line in the record, then the file. */
export const deleteArt = async (hass: Hass, list: string, it: ArtItem): Promise<boolean> => {
  try { await hass.callService('todo', 'remove_item', { item: it.uid }, { entity_id: list }); } catch { return false; }
  if (!it.file.startsWith('media-source:')) void dropMedia(hass, it.file);
  return true;
};

/** How many pictures were painted this month, and what that is reckoned to have cost. */
export const monthSpend = (items: ArtItem[], cost = ART_DEFAULTS.cost, now = new Date()): { n: number; usd: number } => {
  const m = ymdOf(now).slice(0, 7), n = items.filter((i) => i.d.startsWith(m)).length;
  return { n, usd: Math.round(n * cost * 100) / 100 };
};
/** New looks a child has had painted today. */
export const looksToday = (items: ArtItem[], who: string, now = new Date()): number => items.filter((i) => i.kind === 'look' && i.d === ymdOf(now) && i.who.includes(who)).length;

/**
 * The order the screensaver shows the artwork in: the newest night's pictures first, then pictures that suit today
 * (their event or theme is named in one of today's events, or they are favourites), then the rest, shuffled the same way all day.
 */
export const orderArt = (items: ArtItem[], now = new Date(), todays: string[] = []): ArtItem[] => {
  const art = items.filter((i) => i.kind === 'art' && !i.hidden);
  if (!art.length) return [];
  const newest = art.reduce((m, i) => (i.d > m ? i.d : m), ''), words = todays.map((t) => t.toLowerCase());
  const suits = (i: ArtItem): boolean => [i.event, i.theme].some((x) => !!x && words.some((t) => t.includes(x.toLowerCase()) || x.toLowerCase().includes(t)));
  // a shuffle that stays put for the day, so every screen shows the same run
  const seed = Number(ymdOf(now).replace(/-/g, '')), rank = (s: string): number => { let h = seed; for (let k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 0x45d9f3b); return (h >>> 0) / 4294967296; };
  const tier = (i: ArtItem): number => (i.d === newest ? 0 : suits(i) ? 1 : i.fav ? 2 : 3);
  return [...art].sort((a, b) => tier(a) - tier(b) || rank(a.file) - rank(b.file));
};

let adopting = false;
/**
 * The nightly pictures arrive in Home Assistant's AI Task folder at the painter's own size. A screen that is on brings each one
 * into local media as a 1920 x 1080 JPEG and points the record at it. Until then (or if this cannot be done) the original is shown.
 */
export const adoptArt = async (hass: Hass | undefined, list: string, items: ArtItem[]): Promise<number> => {
  if (!hass?.user?.is_admin || adopting) return 0;
  adopting = true; let n = 0;
  try {
    for (const it of items.filter((i) => i.kind === 'art' && i.file.startsWith('media-source://ai_task/')).slice(0, 6)) {
      const url = await mediaUrl(it.file, hass); if (!url) continue;
      const jpg = await cropJpeg(await (await fetch(url)).blob(), 1920, 16 / 9, 0.45);
      // named from the original's own name, which is different for every picture (the record's ids can end alike)
      let hsh = 0x811c9dc5; for (let k = 0; k < it.file.length; k++) hsh = Math.imul(hsh ^ it.file.charCodeAt(k), 0x01000193);
      const name = `fhart-${it.d.replace(/-/g, '')}-${(hsh >>> 0).toString(36)}.jpg`;
      if (!await keepMedia(hass, name, jpg)) break;
      await hass.callService('todo', 'update_item', { item: it.uid, rename: name }, { entity_id: list }); n++;
    }
  } catch { /* best effort: the originals still show */ } finally { adopting = false; }
  return n;
};
