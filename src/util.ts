import type { Hass } from './types';

/* ------------------------------------------------------------------ *
 * Shared helpers: chore lanes, time windows, change detection, sound, speech.
 * ------------------------------------------------------------------ */

export type Lane = 'routine' | 'job' | 'grow';
export type Slot = 'am' | 'after' | 'bed' | 'any';
export interface Chore { uid: string; summary: string; status: 'needs_action' | 'completed'; description?: string }
export interface ParsedChore extends Chore { lane: Lane; slot: Slot; pts: number; minutes: number; /** a picture chosen for this job: an emoji at the start of its name, or @icon:🦷 in its description */ pic?: string; /** @song: a timed job that plays music until its time is up */ song?: boolean }

const LEAD_PIC = /^\s*((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u200D\p{Extended_Pictographic}|\p{Emoji_Modifier})*)\s+(?=\S)/u;
/** Description tokens: "+10 @job @after", "@routine @am", "@grow @bed". Untagged items with points are jobs. */
export const parseChore = (c: Chore): ParsedChore => {
  const d = c.description ?? '';
  const m = /\+(\d+)/.exec(d) ?? /^(\d+)$/.exec(d.trim());
  const pts = m ? Number(m[1]) : 0;
  const lane: Lane = /@grow/.test(d) ? 'grow' : /@routine/.test(d) ? 'routine' : /@job/.test(d) || pts ? 'job' : 'routine';
  const slot: Slot = /@am/.test(d) ? 'am' : /@after/.test(d) ? 'after' : /@bed/.test(d) ? 'bed' : 'any';
  const mins = /(\d+)\s*min/i.exec(`${c.summary} ${d}`);
  const lead = LEAD_PIC.exec(c.summary), tagged = /@icon[:=]\s*(\S+)/.exec(d);
  return { ...c, summary: lead ? c.summary.slice(lead[0].length) : c.summary, pic: tagged?.[1] ?? lead?.[1], song: /@song/.test(d), lane, slot, pts: lane === 'grow' ? 0 : pts, minutes: mins ? Number(mins[1]) : 0 };
};

export const hm = (s: string | undefined): number => { const [h, m] = String(s ?? '').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
export const minsNow = (d = new Date()): number => d.getHours() * 60 + d.getMinutes();

/** Current part of the day for a child, given their bedtime ("19:30"). */
export const daySlot = (bedtime = '20:00', d = new Date()): Slot => {
  const n = minsNow(d);
  if (n < 12 * 60) return 'am';
  if (n >= hm(bedtime) - 60) return 'bed';
  return 'after';
};
/** Fri and Sat nights get an extra half hour, or whatever the family has set (the card's `bedtime_weekend_extra`). */
let weekendExtra = 30;
export const setWeekendExtra = (mins: number | undefined): void => { weekendExtra = Number.isFinite(mins) ? Math.max(0, Math.min(180, Number(mins))) : 30; };
export const bedtimeFor = (base: string | undefined, d = new Date()): string => {
  const b = hm(base ?? '20:00') + ([5, 6].includes(d.getDay()) ? weekendExtra : 0);
  return `${Math.floor(b / 60)}:${String(b % 60).padStart(2, '0')}`;
};
export const windDown = (bedtime: string | undefined, d = new Date()): boolean => {
  const n = minsNow(d), b = hm(bedtimeFor(bedtime, d));
  return n >= b - 60 || n < 5 * 60;
};

/** Did any of these entities change between two hass objects? */
export const changed = (a: Hass | undefined, b: Hass | undefined, ids: Iterable<string>): boolean => {
  if (!a || !b) return true;
  for (const id of ids) if (a.states[id] !== b.states[id]) return true;
  return false;
};

/** Shortest label that tells each name apart: "W", "H", and "Ju" / "Ja" when two start alike. */
export const shortNames = (names: string[]): Record<string, string> => {
  const out: Record<string, string> = {}, uniq = [...new Set(names.filter(Boolean))];
  for (const n of uniq) {
    let len = 1;
    while (len < Math.min(3, n.length) && uniq.some((o) => o !== n && o.slice(0, len).toLowerCase() === n.slice(0, len).toLowerCase())) len++;
    out[n] = n[0].toUpperCase() + n.slice(1, len).toLowerCase();
  }
  return out;
};

/* ---------------- fitting the screen ---------------- */

/** How the panel is arranged: wide (landscape tablets and wall displays), tall (portrait tablets), phone. */
export type Shape = 'wide' | 'tall' | 'phone';
let shape: Shape = 'wide';
const shapeSubs = new Set<() => void>();
export const getShape = (): Shape => shape;
export const setShape = (s: Shape): void => { if (s !== shape) { shape = s; shapeSubs.forEach((f) => f()); } };
/** How much narrower than the design canvas a tablet is: 0 (wide enough), 1 (under 1240 px), 2 (under 1100 px), 3 (under 900 px). Components carry data-n1…data-n3, cumulatively. */
let narrow = 0;
export const getNarrow = (): number => narrow;
export const setNarrow = (n: number): void => { if (n !== narrow) { narrow = n; shapeSubs.forEach((f) => f()); } };
export const onShape = (f: () => void): (() => void) => { shapeSubs.add(f); return () => shapeSubs.delete(f); };

/**
 * Tightens a box in steps until its contents fit: data-fit="1", "2", "3". What each step means is up to the
 * box's own CSS (smaller rows, then a second column…). Only if the last step still overflows does it scroll.
 */
export const fitBox = (el: Element, max = 3): void => {
  const e = el as HTMLElement;
  e.removeAttribute('data-fit');
  for (let i = 1; i <= max && (e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2); i++) e.setAttribute('data-fit', String(i));
};
/** Runs fitBox on every [data-fits] box (and refreshes scroll cues) after each render and whenever the component is resized. */
export class FitController {
  private _ro?: ResizeObserver;
  constructor(private host: HTMLElement & { addController(c: unknown): void; renderRoot: ParentNode }) { host.addController(this); }
  hostConnected(): void { if (typeof ResizeObserver !== 'undefined') { this._ro = new ResizeObserver(() => this.run()); this._ro.observe(this.host); } }
  hostDisconnected(): void { this._ro?.disconnect(); }
  hostUpdated(): void { this.run(); }
  run(): void {
    const root = this.host.renderRoot;
    if (!root?.querySelectorAll) return;
    root.querySelectorAll('[data-fits]').forEach((e) => fitBox(e));
    root.querySelectorAll('.scrolly').forEach(scrollCue);
  }
}

/** Marks a scrolling box with data-more while there is more below, so it can fade its bottom edge. */
export const scrollCue = (x: Event | Element): void => {
  const el = (x instanceof Event ? x.currentTarget : x) as HTMLElement | null;
  if (el) el.toggleAttribute('data-more', el.scrollHeight - el.scrollTop - el.clientHeight > 6);
};

export const pinOk = (pin: unknown, typed: string): boolean => pin !== undefined && pin !== null && String(pin) === typed;

/** WA-style school-day check from configured terms and public holidays. */
export const ymd = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const isSchoolDay = (d: Date, terms: [string, string][] = [], holidays: string[] = []): boolean => {
  const day = d.getDay(); if (day === 0 || day === 6) return false;
  const s = ymd(d);
  if (holidays.includes(s)) return false;
  return !terms.length || terms.some(([a, b]) => s >= a && s <= b);
};

export const isQuiet = (d = new Date(), start = '19:30', end = '07:00'): boolean => {
  const n = minsNow(d), a = hm(start), b = hm(end);
  return a <= b ? n >= a && n < b : n >= a || n < b;
};
/**
 * "After bedtime": the one test for everything that is a grown-up's call at night (Ask, All on, music in the whole house, calling a room).
 * True in the household's quiet hours, and from any child's bedtime until the quiet hours end (never before 5 am).
 */
export const afterBedtime = (kids: { bedtime?: string }[] = [], quiet: { start?: string; end?: string } = {}, d = new Date()): boolean => {
  const n = minsNow(d), wake = Math.max(5 * 60, hm(quiet.end ?? '06:30'));
  return isQuiet(d, quiet.start ?? '20:00', quiet.end ?? '06:30') || kids.some((k) => n >= hm(bedtimeFor(k.bedtime, d)) || n < wake);
};

/* ---------------- sound: the palettes live in sound.ts; this keeps the old imports working ---------------- */
import { isMuted } from './sound';
export { sfx, sfxAsked, setVolume, setMuted, setSounds, setSoundLook, setSoundTheme, type Sfx } from './sound';

/* ---------------- speech: on-device, Australian English where available ---------------- */
let voice: SpeechSynthesisVoice | null | undefined;
/** `by` is the read-aloud button that was pressed: it shows that it is speaking (data-speaking) until the words end or something else is read. */
let speaker: Element | null = null;
export const say = (text: string, by?: Element | null): void => {
  speaker?.removeAttribute('data-speaking'); speaker = null;
  if (isMuted() || !('speechSynthesis' in window)) return;
  try {
    if (voice === undefined) {
      const vs = speechSynthesis.getVoices();
      voice = vs.find((v) => v.lang === 'en-AU') ?? vs.find((v) => v.lang.startsWith('en-GB')) ?? vs.find((v) => v.lang.startsWith('en')) ?? null;
      if (!vs.length) voice = undefined;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'en-AU'; u.rate = 0.95; u.pitch = 1.1;
    if (by) { speaker = by; by.setAttribute('data-speaking', ''); const end = (): void => { if (speaker === by) { by.removeAttribute('data-speaking'); speaker = null; } }; u.onend = end; u.onerror = end; window.setTimeout(end, Math.max(4000, text.length * 110)); }
    speechSynthesis.speak(u);
  } catch { /* speech unavailable */ }
};

/** Stops whatever `say` is reading out. */
export const hush = (): void => { speaker?.removeAttribute('data-speaking'); speaker = null; try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch { /* speech unavailable */ } };

/** Read a JSON panel message from input_text.fh_panel_message. */
export interface PanelMsg { t: string; ttl?: number; ts?: number; alarm?: number; parent?: number }
export const panelMsg = (hass: Hass | undefined): PanelMsg | null => {
  const s = hass?.states['input_text.fh_panel_message']?.state;
  if (!s || !s.startsWith('{')) return null;
  try {
    const m = JSON.parse(s) as PanelMsg;
    if (m.ts && m.ttl && Date.now() / 1000 > m.ts + m.ttl) return null;
    return m;
  } catch { return null; }
};

/* ---------------- per-child settings: card config sets the defaults, a grown-up can change them on the panel ---------------- */
export interface KidPrefs {
  /** 'panel' follows whatever the panel is set to */
  look: string;
  font: 'print' | 'hand';
  calm: boolean;
  sound: 'full' | 'soft' | 'off';
  /** one job at a time: Now / Next / Later */
  focus: boolean;
}
const prefKey = (name: string): string => `family-hub-kid-${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
export const kidPrefs = (k: { name: string; mode?: string; look_id?: string; font?: 'print' | 'hand'; calm?: boolean; sound_level?: 'full' | 'soft' | 'off'; focus?: boolean }): KidPrefs => {
  const base: KidPrefs = { look: k.look_id ?? 'panel', font: k.font ?? 'print', calm: k.calm ?? true, sound: k.sound_level ?? 'full', focus: k.focus ?? true };
  try { return { ...base, ...(JSON.parse(localStorage.getItem(prefKey(k.name)) || '{}') as Partial<KidPrefs>) }; } catch { return base; }
};
export const saveKidPrefs = (name: string, patch: Partial<KidPrefs>): void => {
  try { localStorage.setItem(prefKey(name), JSON.stringify({ ...(JSON.parse(localStorage.getItem(prefKey(name)) || '{}') as Partial<KidPrefs>), ...patch })); } catch { /* storage unavailable */ }
};

// ---------- motion and feedback helpers ----------
const lingering = new WeakMap<object, Record<string, { last: unknown; until: number }>>();
/** Lets something fade out before it leaves: while `v` is set it is returned as is; for `ms` after it clears, the last value
 *  is returned with `true` (render it with data-closing), then the host renders again without it. Call it from render(). */
export function linger<T>(host: { requestUpdate(): void }, key: string, v: T, ms = 160): [T, boolean] {
  const m = lingering.get(host) ?? {}; lingering.set(host, m);
  const e = m[key] ?? (m[key] = { last: v, until: 0 });
  if (v) { e.last = v; e.until = 0; return [v, false]; }
  if (!e.last) return [v, false];
  if (!e.until) { e.until = Date.now() + ms; window.setTimeout(() => { if (e.until) { e.last = v; e.until = 0; host.requestUpdate(); } }, ms); }
  return [e.last as T, true];
}
/** A call that Home Assistant never answers is given up after twelve seconds, so nothing on the panel waits for ever. */
export const SLOW_MS = 12_000, SLOW_SAY = 'Home Assistant is slow. Try again.';
export class SlowError extends Error {}
export const inTime = <T>(p: Promise<T> | T, ms = SLOW_MS): Promise<T> => new Promise<T>((yes, no) => { const t = window.setTimeout(() => no(new SlowError('no answer')), ms); Promise.resolve(p).then((v) => { clearTimeout(t); yes(v); }, (e) => { clearTimeout(t); no(e); }); });
let slowLast = false;
/** True when the `watched` call that has just resolved false gave up waiting (rather than being refused). */
export const wasSlow = (): boolean => slowLast;
/** One call to Home Assistant from a control: after 250 ms without an answer the control shows it is waiting (data-busy, aria-busy)
 *  until the answer comes. Resolves true when the call worked and false when it did not; it never throws, and never shows the error's own words. */
export async function watched(el: Element | null | undefined, p: Promise<unknown> | undefined): Promise<boolean> {
  const t = el ? window.setTimeout(() => { el.setAttribute('data-busy', ''); el.setAttribute('aria-busy', 'true'); }, 250) : 0;
  try { if (!p) throw new Error('not connected'); await inTime(p); slowLast = false; return true; } catch (e) { slowLast = e instanceof SlowError; return false; }
  finally { clearTimeout(t); el?.removeAttribute('data-busy'); el?.removeAttribute('aria-busy'); }
}
/** A motion token of the panel in milliseconds (--m-1 … --m-5), and whether things may travel (calm mode and reduce-motion say no). */
export const motion = (el: Element, token = '--m-3'): { ms: number; travel: boolean } => {
  const cs = getComputedStyle(el), raw = cs.getPropertyValue(token).trim(), n = parseFloat(raw) || 0;
  return { ms: /ms$/.test(raw) ? n : n * 1000, travel: cs.getPropertyValue('--m-d').trim() !== '0' && !matchMedia('(prefers-reduced-motion: reduce)').matches };
};
/** Where the keyed children of a list are now, to hand to `flip` after the next render. */
export const places = (root: ParentNode, sel: string): Map<string, DOMRect> => new Map([...root.querySelectorAll<HTMLElement>(sel)].map((e) => [e.dataset.key ?? '', e.getBoundingClientRect()]));
/** Rows that changed place since `before` travel there over --m-3 instead of jumping (nothing moves in calm mode). */
export const flip = (root: ParentNode, sel: string, before: Map<string, DOMRect>): void => {
  for (const e of root.querySelectorAll<HTMLElement>(sel)) {
    const was = before.get(e.dataset.key ?? ''); if (!was) continue;
    const now = e.getBoundingClientRect(), dx = was.left - now.left, dy = was.top - now.top; if (Math.abs(dx) < 2 && Math.abs(dy) < 2) continue;
    const m = motion(e); if (!m.travel) continue;
    e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: m.ms, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
};
