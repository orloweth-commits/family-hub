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

export const hm = (s: string): number => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
export const minsNow = (d = new Date()): number => d.getHours() * 60 + d.getMinutes();

/** Current part of the day for a child, given their bedtime ("19:30"). */
export const daySlot = (bedtime = '20:00', d = new Date()): Slot => {
  const n = minsNow(d);
  if (n < 12 * 60) return 'am';
  if (n >= hm(bedtime) - 60) return 'bed';
  return 'after';
};
/** Fri and Sat nights get an extra half hour. */
export const bedtimeFor = (base: string | undefined, d = new Date()): string => {
  const b = hm(base ?? '20:00') + ([5, 6].includes(d.getDay()) ? 30 : 0);
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

/* ---------------- sound: tiny Web Audio synth, no assets ---------------- */
let ctx: AudioContext | null = null;
let muted = false;
let level = 1;
/** 1 = full, lower = softer, 0 = interface sounds off. Alarms ignore this. */
export const setVolume = (v: number): void => { level = Math.max(0, Math.min(1, v)); };
export const setMuted = (m: boolean): void => { muted = m; };
const ac = (): AudioContext | null => {
  if (muted) return null;
  try { ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch { return null; }
};
const tone = (f: number, t0: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, glide?: number, always = false): void => {
  if (!always) { if (level <= 0) return; vol *= level; }
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, a.currentTime + t0);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, a.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(vol, a.currentTime + t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
};
export type Sfx = 'tick' | 'untick' | 'done' | 'unlock' | 'locked' | 'tap' | 'coin' | 'alarm' | 'jar' | 'clarinet' | 'trumpet' | 'roar';
export const sfx = (s: Sfx): void => {
  switch (s) {
    case 'tap': tone(660, 0, 0.06, 'triangle', 0.08); break;
    case 'tick': tone(880, 0, 0.09, 'triangle', 0.14); tone(1320, 0.07, 0.14, 'triangle', 0.12); break;
    case 'untick': tone(520, 0, 0.12, 'sine', 0.08, 380); break;
    case 'coin': tone(988, 0, 0.08, 'square', 0.06); tone(1319, 0.08, 0.2, 'square', 0.06); break;
    case 'locked': tone(180, 0, 0.18, 'sawtooth', 0.06, 120); break;
    case 'jar': tone(1200, 0, 0.05, 'sine', 0.12); tone(1600, 0.05, 0.08, 'sine', 0.1); tone(2100, 0.11, 0.12, 'sine', 0.07); break;
    case 'done': [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle', 0.13)); break;
    case 'unlock': [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle', 0.12)); tone(1568, 0.6, 0.6, 'sine', 0.1); break;
    case 'alarm': for (let i = 0; i < 6; i++) { tone(1046, i * 0.5, 0.18, 'square', 0.12, undefined, true); tone(1318, i * 0.5 + 0.2, 0.18, 'square', 0.12, undefined, true); } break;
    case 'clarinet': [587, 698, 880].forEach((f, i) => tone(f, i * 0.16, 0.3, 'square', 0.05)); break;
    case 'trumpet': [523, 523, 784].forEach((f, i) => tone(f, i * 0.14, i === 2 ? 0.5 : 0.12, 'sawtooth', 0.07)); break;
    case 'roar': tone(140, 0, 0.6, 'sawtooth', 0.12, 70); tone(210, 0.05, 0.5, 'square', 0.05, 90); break;
  }
};

/* ---------------- speech: on-device, Australian English where available ---------------- */
let voice: SpeechSynthesisVoice | null | undefined;
export const say = (text: string): void => {
  if (muted || !('speechSynthesis' in window)) return;
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
    speechSynthesis.speak(u);
  } catch { /* speech unavailable */ }
};

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
  const base: KidPrefs = { look: k.look_id ?? 'panel', font: k.font ?? 'print', calm: k.calm ?? true, sound: k.sound_level ?? 'full', focus: k.focus ?? k.mode !== 'text' };
  try { return { ...base, ...(JSON.parse(localStorage.getItem(prefKey(k.name)) || '{}') as Partial<KidPrefs>) }; } catch { return base; }
};
export const saveKidPrefs = (name: string, patch: Partial<KidPrefs>): void => {
  try { localStorage.setItem(prefKey(name), JSON.stringify({ ...(JSON.parse(localStorage.getItem(prefKey(name)) || '{}') as Partial<KidPrefs>), ...patch })); } catch { /* storage unavailable */ }
};
