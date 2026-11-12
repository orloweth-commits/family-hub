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
/** Quiet hours mute everything except sounds marked `always` (the kitchen timer's alarm: someone set it on purpose). */
const ac = (force = false): AudioContext | null => {
  if (muted && !force) return null;
  try { ctx = ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch { return null; }
};
const tone = (f: number, t0: number, dur: number, type: OscillatorType = 'sine', vol = 0.18, glide?: number, always = false): void => {
  if (!always) { if (level <= 0) return; vol *= level; }
  const a = ac(always); if (!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, a.currentTime + t0);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, a.currentTime + t0 + dur);
  g.gain.setValueAtTime(0.0001, a.currentTime + t0);
  g.gain.exponentialRampToValueAtTime(vol, a.currentTime + t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t0 + dur);
  o.connect(g).connect(a.destination); o.start(a.currentTime + t0); o.stop(a.currentTime + t0 + dur + 0.05);
};
/* A look may have its own voice for the sounds. `looks.ts` says which look is on screen; nothing here imports the looks. */
let soundLook = '';
/** the preview's `&scene=sports` plays the Sports sounds whatever the look is */
const forcedSound = ((): string => { try { return String((globalThis as { __fhScene?: string }).__fhScene ?? ''); } catch { return ''; } })();
/** Call when a look is applied (its id): the sounds follow the look on screen. */
export const setSoundLook = (id: string): void => { soundLook = id; };
/** One shared 0.2 s of white noise: the thud of a boot, the pock of a racquet, the swish of a net. */
let hiss: AudioBuffer | null = null;
/** A burst of that noise through one filter. The same gates as `tone` (quiet hours, sounds off); the soft level leaves the noise out. */
const noise = (t0: number, dur: number, vol: number, type: BiquadFilterType, freq: number, q = 0.7, sweep?: number): void => {
  if (level < 1) return;
  const a = ac(); if (!a) return;
  if (!hiss || hiss.sampleRate !== a.sampleRate) { hiss = a.createBuffer(1, Math.round(a.sampleRate * 0.2), a.sampleRate); const d = hiss.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const n = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime + t0;
  n.buffer = hiss; n.loop = dur > 0.19;
  f.type = type; f.Q.value = q; f.frequency.setValueAtTime(freq, t); if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.003, dur / 2)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(a.destination); n.start(t); n.stop(t + dur + 0.02);
};
/** A pea whistle: two sines a few hertz apart (the beat is the pea) with a quick vibrato, held for `hold` seconds, through an optional low-pass. `fall` lets the pitch sag at the end. */
const whistle = (f1: number, f2: number, t0: number, hold: number, vol: number, vib: [rate: number, depth: number], o: { attack?: number; fall?: number; lp?: number; always?: boolean } = {}): void => {
  if (!o.always) { if (level <= 0) return; vol *= level; }
  const a = ac(o.always); if (!a) return;
  const t = a.currentTime + t0, up = o.attack ?? 0.01, end = t + up + hold, g = a.createGain(), lfo = a.createOscillator(), depth = a.createGain();
  lfo.type = 'sine'; lfo.frequency.value = vib[0]; depth.gain.value = vib[1]; lfo.connect(depth);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol / 2, t + up); g.gain.setValueAtTime(vol / 2, end); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.05);
  for (const f of [f1, f2]) { const o2 = a.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(f, t); if (o.fall) { o2.frequency.setValueAtTime(f, end - 0.08); o2.frequency.exponentialRampToValueAtTime(f * (1 - o.fall), end + 0.05); } depth.connect(o2.frequency); o2.connect(g); o2.start(t); o2.stop(end + 0.08); }
  if (o.lp) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f).connect(a.destination); } else g.connect(a.destination);
  lfo.start(t); lfo.stop(end + 0.08);
};
/** Home Ground's sounds (the Sports look). Each is under a second and no louder than the plain one it replaces. False = this look has no form of its own. */
const sportsSfx = (s: Sfx): boolean => {
  switch (s) {
    /* boot on turf */
    case 'tap': noise(0, 0.006, 0.03, 'bandpass', 1800, 1.2); tone(220, 0, 0.05, 'sine', 0.05, 160); return true;
    /* racquet, there and back: pock, and a fifth up, pock */
    case 'tick': noise(0, 0.008, 0.04, 'bandpass', 2200, 1.2); tone(440, 0, 0.06, 'triangle', 0.1); noise(0.09, 0.008, 0.04, 'bandpass', 2200, 1.2); tone(660, 0.09, 0.06, 'triangle', 0.1); return true;
    /* the ball rolled back */
    case 'untick': tone(330, 0, 0.14, 'sine', 0.06, 220); noise(0, 0.08, 0.02, 'lowpass', 600); return true;
    /* a short two-note pea whistle */
    case 'done': whistle(2093, 2110, 0, 0.08, 0.05, [28, 30], { lp: 5000 }); whistle(2637, 2655, 0.13, 0.21, 0.05, [28, 30], { lp: 5000 }); return true;
    /* over the bar: the flight, the net, two notes */
    case 'unlock': tone(300, 0, 0.35, 'sine', 0.07, 900); noise(0.35, 0.25, 0.05, 'bandpass', 3000, 1, 1200); tone(784, 0.6, 0.15, 'triangle', 0.09); tone(1047, 0.75, 0.15, 'triangle', 0.09); return true;
    /* off the post, gently: a donk, not a buzzer */
    case 'locked': tone(196, 0, 0.12, 'sine', 0.04); tone(294, 0, 0.02, 'triangle', 0.02); return true;
    /* a ball coming to rest, then a ting */
    case 'coin': [[0, 0.06], [0.16, 0.048], [0.27, 0.036], [0.34, 0.025]].forEach(([t, v]) => tone(520, t, 0.06, 'sine', v, 380)); tone(1319, 0.42, 0.15, 'triangle', 0.05); return true;
    /* into the ball bag: the drop, then the net */
    case 'jar': noise(0, 0.04, 0.05, 'lowpass', 900); tone(180, 0, 0.08, 'sine', 0.07); noise(0.09, 0.09, 0.03, 'bandpass', 4000, 1); return true;
    /* the referee's long whistle, three times; in quiet hours once, softer, as if from indoors. Someone set the timer on purpose, so it always sounds. */
    case 'alarm': if (muted) whistle(2350, 2392, 0, 0.6, 0.06, [26, 40], { attack: 0.03, fall: 0.03, lp: 2500, always: true }); else for (let i = 0; i < 3; i++) whistle(2350, 2392, i * 1.08, 0.6, 0.1, [26, 40], { attack: 0.03, fall: 0.03, always: true }); return true;
    default: return false;
  }
};
export type Sfx = 'tick' | 'untick' | 'done' | 'unlock' | 'locked' | 'tap' | 'coin' | 'alarm' | 'jar' | 'clarinet' | 'trumpet' | 'roar';
export const sfx = (s: Sfx): void => {
  if ((forcedSound || soundLook) === 'sports' && sportsSfx(s)) return;
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

/* for the preview, the tests and trying things from the console */
try { (globalThis as { fhSfx?: typeof sfx }).fhSfx ??= sfx; } catch { /* no window */ }

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

/** Stops whatever `say` is reading out. */
export const hush = (): void => { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch { /* speech unavailable */ } };

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
/** One call to Home Assistant from a control: after 250 ms without an answer the control shows it is waiting (data-busy, aria-busy)
 *  until the answer comes. Resolves true when the call worked and false when it did not; it never throws, and never shows the error's own words. */
export async function watched(el: Element | null | undefined, p: Promise<unknown> | undefined): Promise<boolean> {
  const t = el ? window.setTimeout(() => { el.setAttribute('data-busy', ''); el.setAttribute('aria-busy', 'true'); }, 250) : 0;
  try { if (!p) throw new Error('not connected'); await p; return true; } catch { return false; }
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
