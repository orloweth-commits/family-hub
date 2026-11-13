import type { FamilyHubConfig, Hass } from './types';
import { inTime, type Chore } from './util';
import { configError, isPin, isTime } from './validate';

/* ------------------------------------------------------------------ *
 * Settings: everything that is not on the screen.
 *  - where the card's configuration lives (the Lovelace dashboard that hosts the card) and how it is read and saved
 *  - the safety net: earlier versions kept before every save
 *  - the short PIN window, and what survives the dashboard drawing the card again after a save
 *  - job lists (Home Assistant to-do lists): their tag syntax as form fields
 * ------------------------------------------------------------------ */

/** The card configuration with the options other parts of the card add (kept loose so Settings can edit them without owning their types). */
export type Cfg = FamilyHubConfig & { keep_on?: string[] };
export const CARD_TYPE = 'custom:family-hub-card';
/** Where the previous version of the card is kept inside the dashboard: a top-level key of the dashboard, beside `views`. Home Assistant ignores top-level keys it does not know. */
export const PREVIOUS_KEY = 'family_hub_previous';
const HISTORY_KEY = 'family-hub-settings-history', HISTORY_MAX = 5;

type Dash = Record<string, unknown> & { views?: unknown[] };
type Path = (string | number)[];
export const clone = <T>(v: T): T => (v === undefined ? v : JSON.parse(JSON.stringify(v)) as T);
/** The same text for the same contents, whatever order the keys were written in. */
export const stable = (v: unknown): string => JSON.stringify(v, (_k, x: unknown) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) : x));
export const same = (a: unknown, b: unknown): boolean => stable(a) === stable(b);
/** A copy without the PIN: earlier versions are kept without it, so the PIN is never written anywhere new. */
export const noPin = (c: Cfg): Cfg => { const { parent_pin: _p, ...rest } = c; return clone(rest) as Cfg; };

/* ---------------- the dashboard ---------------- */

type HassX = Hass & { panelUrl?: string; panels?: Record<string, { config?: { mode?: string } | null; title?: string | null }> };
/** The dashboard this card is shown on: null is Home Assistant's own name for the default dashboard. */
export const dashPath = (hass: Hass): string | null => {
  const p = (hass as HassX).panelUrl ?? location.pathname.split('/').filter(Boolean)[0] ?? '';
  return !p || p === 'lovelace' ? null : p;
};
const yamlMode = (hass: Hass): boolean => (hass as HassX).panels?.[dashPath(hass) ?? 'lovelace']?.config?.mode === 'yaml';
/** Every Family Hub card in a dashboard, however deep (views, sections, stacks, conditional cards), with the way to it. */
export const findCards = (dash: Dash): { path: Path; card: Cfg }[] => {
  const out: { path: Path; card: Cfg }[] = [];
  const walk = (v: unknown, path: Path): void => {
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, [...path, i])); return; }
    if (!v || typeof v !== 'object') return;
    if ((v as { type?: unknown }).type === CARD_TYPE) { out.push({ path, card: v as Cfg }); return; }
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (x && typeof x === 'object') walk(x, [...path, k]);
  };
  walk(dash.views ?? [], ['views']);
  return out;
};
const setIn = (root: unknown, path: Path, value: unknown): unknown => {
  if (!path.length) return value;
  const [k, ...rest] = path;
  if (Array.isArray(root)) { const a = [...root]; a[k as number] = setIn(a[k as number], rest, value); return a; }
  const o = { ...(root as Record<string, unknown>) }; o[k as string] = setIn(o[k as string], rest, value); return o;
};

/** Why Settings can only be read: each has its own plain explanation on the page. */
export type Blocked = 'admin' | 'yaml' | 'nocard' | 'many' | 'offline';
export interface Access { ok: boolean; why?: Blocked; /** the card as the dashboard has it, when that is not what this screen is running */ latest?: Cfg; previous?: Version | null }
export interface Version { t: string; what: string; config: Cfg; from: 'screen' | 'dashboard' }
export class StaleError extends Error { constructor(public latest: Cfg) { super('the dashboard has changed'); } }
export class BlockedError extends Error { constructor(public why: Blocked) { super(why); } }

const loadDash = async (hass: Hass): Promise<Dash> => inTime(hass.callWS<Dash>({ type: 'lovelace/config', url_path: dashPath(hass), force: false }));
/** Which card in the dashboard is this one: the one that reads the same as the running configuration, or the only one there is. */
const locate = (dash: Dash, running: Cfg): { path: Path; card: Cfg; stale: boolean } => {
  if (!dash || typeof dash !== 'object' || !Array.isArray(dash.views)) throw new BlockedError('nocard');
  const all = findCards(dash), exact = all.find((c) => same(c.card, running));
  if (exact) return { ...exact, stale: false };
  if (all.length === 1) return { ...all[0], stale: true };
  throw new BlockedError(all.length ? 'many' : 'nocard');
};
const previousOf = (dash: Dash): Version | null => {
  const p = dash[PREVIOUS_KEY] as { saved?: string; card?: Cfg } | undefined;
  return p?.card && typeof p.card === 'object' && p.saved ? { t: p.saved, what: 'Kept in the dashboard', config: p.card, from: 'dashboard' } : null;
};
/** Can this person change the card from here? Never throws. */
export const checkAccess = async (hass: Hass | undefined, running: Cfg): Promise<Access> => {
  if (!hass) return { ok: false, why: 'offline' };
  if (!hass.user?.is_admin) return { ok: false, why: 'admin' };
  if (yamlMode(hass)) return { ok: false, why: 'yaml' };
  try {
    const dash = await loadDash(hass), at = locate(dash, running);
    return { ok: true, latest: at.stale ? at.card : undefined, previous: previousOf(dash) };
  } catch (e) { return { ok: false, why: e instanceof BlockedError ? e.why : 'offline' }; }
};
/**
 * Saves `next` in place of the running card. The dashboard is read again first, so nothing else that changed in it is lost; if the
 * card itself was changed somewhere else since this screen loaded it, nothing is written (StaleError carries what the dashboard has).
 * The version being replaced is kept: in this screen's list of earlier versions and, as the single previous version, in the dashboard.
 */
export const saveCard = async (hass: Hass, running: Cfg, next: Cfg, what: string): Promise<void> => {
  const bad = configError(next); if (bad) throw new Error(bad);
  const dash = await loadDash(hass), at = locate(dash, running);
  if (at.stale) throw new StaleError(at.card);
  const out = setIn(dash, at.path, next) as Dash;
  out[PREVIOUS_KEY] = { saved: new Date().toISOString(), note: 'The Family Hub card as it was before the last change made in its Settings (without the PIN). Safe to delete.', card: noPin(running) };
  await inTime(hass.callWS({ type: 'lovelace/config/save', url_path: dashPath(hass), config: out }));
  keep(running, what);
};

/* ---------------- earlier versions (this screen) ---------------- */

export const history = (): Version[] => {
  try { const a = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as Version[]; return Array.isArray(a) ? a.filter((v) => v && v.t && v.config).map((v) => ({ ...v, from: 'screen' as const })) : []; } catch { return []; }
};
const keep = (config: Cfg, what: string): void => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify([{ t: new Date().toISOString(), what, config: noPin(config) }, ...history().map(({ t, what: w, config: c }) => ({ t, what: w, config: c }))].slice(0, HISTORY_MAX))); } catch { /* storage unavailable: the dashboard still keeps the previous version */ }
};

/* ---------------- what outlives one drawing of the card ---------------- */

/** One correct PIN opens Settings for a minute: closing it and coming straight back does not ask again. */
const PIN_WINDOW = 60_000;
let pinUntil = 0;
export const pinFresh = (): boolean => Date.now() < pinUntil;
export const pinMark = (): void => { pinUntil = Date.now() + PIN_WINDOW; };
export const pinForget = (): void => { pinUntil = 0; };

/** The pane to open on (the preview and the tests set it; a save sets it so the same pane comes back). */
let pane = '';
export const paneWanted = (): string => pane;
export const wantPane = (p: string): void => { pane = p; };
/** After a save Home Assistant may draw the dashboard again, which makes a new card: Settings comes back open if it was open a moment ago. */
let resumeUntil = 0;
export const resumeSoon = (ms = 8000): void => { resumeUntil = Date.now() + ms; };
export const resumeNow = (): boolean => { const yes = Date.now() < resumeUntil; resumeUntil = 0; return yes; };
/** The message that follows a save (with its Undo) is kept here for the same reason. */
export interface Note { msg: string; until: number; undo?: { back: Cfg; from: Cfg } | null; bad?: boolean }
let note: Note | null = null;
export const getNote = (): Note | null => (note && Date.now() < note.until ? note : null);
export const setNote = (n: Note | null): void => { note = n; };

/* ---------------- checks Settings makes on top of the card's own ---------------- */

export const hm = (s: string | undefined): number => { const [h, m] = String(s ?? '').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
/** Everything wrong with a draft, each with the pane it belongs to. Empty when it can be saved. */
export const draftErrors = (c: Cfg): { pane: string; msg: string }[] => {
  const out: { pane: string; msg: string }[] = [], add = (p: string, msg: string): void => { out.push({ pane: p, msg }); };
  const names = new Set<string>();
  (c.kids ?? []).forEach((k, i) => {
    const n = (k.name ?? '').trim();
    if (!n) add('children', `Child ${i + 1} needs a name.`); else if (names.has(n.toLowerCase())) add('children', `Two children are called ${n}. Each needs a different name.`);
    names.add(n.toLowerCase());
    if (k.bedtime !== undefined && !isTime(k.bedtime)) add('children', `${n || 'A child'}’s bedtime is not a time. Use one like 19:30.`);
    if (k.leave_by !== undefined && !isTime(k.leave_by)) add('morning', `${n || 'A child'}’s leaving time is not a time. Use one like 07:50.`);
    (k.rewards ?? []).forEach((r) => { if (!(r.name ?? '').trim()) add('rewards', `One of ${n}’s rewards has no name.`); if (!Number.isFinite(r.cost) || r.cost < 0) add('rewards', `“${r.name}” needs a cost of 0 or more.`); });
    (k.rewards_draft ?? []).forEach((r) => { if (!(r.name ?? '').trim()) add('rewards', `One of ${n}’s drafted rewards has no name.`); if (!Number.isFinite(r.cost) || r.cost < 0) add('rewards', `“${r.name}” needs a cost of 0 or more.`); });
  });
  const art = (c as { art?: import('./artlib').ArtConfig }).art;
  if (art?.presence === 'sensor' && !art.presence_entity) add('pictures', 'Choose the sensor that tells the panel someone is there, or go back to touch only.');
    const m = c.morning ?? {};
  for (const [label, t] of [['start', m.start], ['end', m.end], ['leaving time', m.leave_by]] as const) if (t !== undefined && !isTime(t)) add('morning', `The morning board’s ${label} is not a time. Use one like 06:30.`);
  if (isTime(m.start ?? '06:30') && isTime(m.end ?? '08:45') && hm(m.end ?? '08:45') <= hm(m.start ?? '06:30')) add('morning', 'The morning board has to end after it starts.');
  for (const [a, b] of c.school_terms ?? []) if (!a || !b || a > b) add('morning', 'A school term needs a first day and a later last day.');
  const ids = new Set<string>();
  for (const d of c.meds ?? []) {
    if (!(d.label ?? '').trim()) add('medicines', 'Every medicine needs a name.');
    if (!isTime(d.time)) add('medicines', `${d.label || 'A medicine'} needs a time like 06:30.`);
    if (!/^[a-z0-9_]+$/.test(d.id ?? '')) add('medicines', `${d.label || 'A medicine'} has an id Home Assistant cannot use.`); else if (ids.has(d.id)) add('medicines', 'Two medicines share an id.');
    ids.add(d.id);
  }
  if (c.parent_pin !== undefined && !isPin(c.parent_pin)) add('pin', 'A PIN is 4 to 8 digits.');
  const n = c.night;
  if (n) { if (!isTime(n.start) || !isTime(n.end)) add('house', 'The night screen needs times like 21:00.'); else if (hm(n.start) === hm(n.end)) add('house', 'The night screen cannot start and end at the same time.'); }
  const q = c.quiet;
  if (q) for (const t of [q.start, q.end]) if (t !== undefined && !isTime(t)) add('house', 'Quiet hours need times like 20:00.');
  if (c.bins && !(Number.isInteger(c.bins.day) && c.bins.day >= 0 && c.bins.day <= 6)) add('house', 'Bin night needs a day of the week.');
  (c.music_moments ?? []).forEach((mo) => { if (!(mo.name ?? '').trim()) add('music', 'Every moment needs a name.'); else if (!(mo.find ?? '').trim() && !(mo.uri ?? '').trim()) add('music', `“${mo.name}” needs something to play.`); });
  for (const p of c.babysitter?.contacts ?? []) if (!(p.name ?? '').trim() || !(p.phone ?? '').trim()) add('people', 'Every contact needs a name and a number.');
  const base = configError(c); if (base && !out.length) add('advanced', base.replace(/^Family Hub: /, ''));
  return out;
};

/* ---------------- jobs: a to-do item's tags as form fields ---------------- */

export interface ChoreForm { name: string; lane: 'routine' | 'job' | 'grow'; slot: 'am' | 'after' | 'bed' | 'any'; pts: number; minutes: number; pic: string; song: boolean; /** anything else written in the description, kept as it is */ rest: string }
const PIC = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/u;
const LEAD = new RegExp(`^\\s*(${PIC.source})\\s+(?=\\S)`, 'u');
/** Reads a to-do item the way the child's page does (parseChore), keeping what it does not understand. */
export const choreForm = (c: Pick<Chore, 'summary' | 'description'>): ChoreForm => {
  const d = c.description ?? '', lead = LEAD.exec(c.summary), tagged = /@icon[:=]\s*(\S+)/.exec(d);
  const p = /\+(\d+)/.exec(d) ?? /^(\d+)$/.exec(d.trim()), pts = p ? Number(p[1]) : 0;
  const lane = /@grow/.test(d) ? 'grow' : /@routine/.test(d) ? 'routine' : /@job/.test(d) || pts ? 'job' : 'routine';
  const slot = /@am/.test(d) ? 'am' : /@after/.test(d) ? 'after' : /@bed/.test(d) ? 'bed' : 'any';
  const name = lead ? c.summary.slice(lead[0].length) : c.summary, inName = /(\d+)\s*min/i.exec(name), inDesc = /(\d+)\s*min\w*/i.exec(d);
  const rest = d.replace(/\+\d+/, '').replace(/^\s*\d+\s*$/, '').replace(/@(grow|routine|job|am|after|bed)\b/g, '').replace(/@icon[:=]\s*\S+/, '').replace(/@song\b(?![:=])/, '').replace(inName ? /$^/ : /\d+\s*min\w*/i, '').replace(/\s+/g, ' ').trim();
  return { name, lane, slot, pts: lane === 'grow' ? 0 : pts, minutes: Number((inName ?? inDesc)?.[1] ?? 0), pic: tagged?.[1] ?? lead?.[1] ?? '', song: /@song/.test(d), rest };
};
/** Writes the form back as a to-do item: the name, and the tags in its description. */
export const choreItem = (f: ChoreForm): { summary: string; description: string } => {
  // a timer length written in the name ("Practice 15 min") stays there; otherwise it goes in the description
  let name = f.name.trim().replace(/\s+/g, ' ');
  const inName = /(\d+)\s*min\w*/i.exec(name);
  if (inName && Number(inName[1]) !== f.minutes) name = f.minutes ? name.replace(/\d+(\s*min)/i, `${f.minutes}$1`) : name.replace(/\s*\d+\s*min\w*/i, '').trim();
  const mins = f.minutes && !/(\d+)\s*min/i.test(name) ? `${f.minutes} min` : '';
  const parts = [f.lane !== 'grow' && f.pts > 0 ? `+${f.pts}` : '', `@${f.lane}`, f.slot === 'any' ? '' : `@${f.slot}`, mins, f.pic ? `@icon:${f.pic}` : '', f.song && !/@song[:=]/.test(f.rest) ? '@song' : '', f.rest];
  return { summary: name, description: parts.filter(Boolean).join(' ') };
};
/** Only the first picture of whatever was typed. */
export const onePic = (s: string): string => PIC.exec(s)?.[0] ?? '';
/** A safe id for a new medicine: who it is for and what it is called, in the letters Home Assistant allows. */
export const medId = (who: string, label: string, taken: string[]): string => {
  const base = `${who} ${label}`.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'medicine';
  let id = base, n = 2; while (taken.includes(id)) id = `${base}_${n++}`;
  return id;
};
