/* ------------------------------------------------------------------ *
 * Interaction sounds. Every look (and every Glass theme) has its own
 * palette: the same events, the same grammar, a different material.
 *
 *   - Synthesised with the Web Audio API: oscillators, one shared noise
 *     buffer, filters and envelopes. No audio files, no samples.
 *   - Transients only: nothing loops, nothing plays under the page.
 *   - Tuned for the wall panel's small speakers: the energy sits between
 *     about 400 Hz and 6 kHz, attacks are 2 to 5 ms, every envelope starts
 *     and ends at zero.
 *   - These sounds leave by the browser's own audio output and nowhere
 *     else: nothing here calls Home Assistant.
 *
 * The same `build()` draws a sound on the live AudioContext and on an
 * OfflineAudioContext, which is how scripts/tests/sounds.mjs measures
 * every palette and how src/soundtrim.ts (the level of each sound) is made.
 * ------------------------------------------------------------------ */
import { TRIM } from './soundtrim';

/* ---------------- the vocabulary ---------------- */
/** What each look answers in its own material. */
const LOOK_EVENTS = ['key', 'space', 'del', 'send', 'tap', 'nav', 'open', 'close', 'on', 'off', 'tick', 'untick', 'coin', 'jar', 'done', 'unlock', 'locked', 'error', 'undo',
  'pin', 'pinok', 'pinno', 'slide', 'set', 'step', 'timer', 'alarm', 'look', 'listen', 'heard', 'answer', 'poke'] as const;
/** The sounds of things drawn on the screen: a record is a record in every look (under water it is only muffled). */
const THING_EVENTS = ['sleeve', 'needle', 'slot', 'tune', 'static', 'pad', 'stamp', 'rub', 'stick'] as const;
/** The boys' own signature sounds: theirs, not the look's. */
const OWN_EVENTS = ['clarinet', 'trumpet', 'roar'] as const;
export const EVENTS = [...LOOK_EVENTS, ...THING_EVENTS, ...OWN_EVENTS] as const;
export type Sfx = typeof EVENTS[number];
type LookSfx = typeof LOOK_EVENTS[number];
type ThingSfx = typeof THING_EVENTS[number];

export const PALETTES = ['sea', 'sunset', 'reef', 'bush', 'space', 'fridge', 'orbit', 'sports'] as const;
export type PaletteId = typeof PALETTES[number];

/** Each sound belongs to a class: how long it may be and how loud (`cap` = highest peak, `rms` = the level it is trimmed to, both in dBFS at full volume). */
export type SoundClass = 'key' | 'step' | 'tap' | 'mid' | 'sheet' | 'error' | 'reward' | 'done' | 'alarm' | 'own';
export const LIMITS: Record<SoundClass, { max: number; cap: number; rms: number }> = {
  key: { max: 0.06, cap: -22, rms: -31 }, step: { max: 0.04, cap: -22, rms: -31 }, tap: { max: 0.06, cap: -18, rms: -27 }, mid: { max: 0.15, cap: -16, rms: -25 }, sheet: { max: 0.18, cap: -18, rms: -28 },
  error: { max: 0.25, cap: -17, rms: -26 }, reward: { max: 0.4, cap: -15, rms: -24 }, done: { max: 0.6, cap: -12, rms: -20 }, alarm: { max: 1.5, cap: -8, rms: -15 }, own: { max: 0.85, cap: -14, rms: -22 }
};
export const CLASS: Record<Sfx, SoundClass> = {
  key: 'key', space: 'key', del: 'key', slide: 'step', step: 'step', tune: 'step', tap: 'tap', pin: 'tap', set: 'tap', pad: 'tap', rub: 'tap',
  send: 'mid', nav: 'mid', on: 'mid', off: 'mid', tick: 'mid', untick: 'mid', undo: 'mid', timer: 'mid', locked: 'mid', listen: 'mid', heard: 'mid', static: 'mid', sleeve: 'mid', needle: 'mid', stamp: 'mid', stick: 'mid',
  open: 'sheet', close: 'sheet', error: 'error', pinno: 'error', coin: 'reward', jar: 'reward', pinok: 'reward', answer: 'reward', look: 'reward', poke: 'reward', slot: 'reward',
  done: 'done', unlock: 'done', alarm: 'alarm', clarinet: 'own', trumpet: 'own', roar: 'own'
};

/* ---------------- a sound is a list of voices ---------------- */
/** One oscillator or one burst of noise, with its envelope. Times in seconds, `g` relative (the trim sets the real level). */
export interface Voice {
  /** wave, or 'noise' (always through a filter) */ w: OscillatorType | 'noise';
  /** pitch in Hz, and where it glides to over `gd` seconds (the whole voice unless given) */ f: number; to?: number; gd?: number;
  /** start, length, level */ t: number; d: number; g: number;
  /** attack (3 ms unless given) and how long it holds before it dies away */ a?: number; h?: number;
  /** filter: type, frequency, where the frequency sweeps to, Q */ ft?: BiquadFilterType; ff?: number; fto?: number; q?: number;
  /** vibrato: rate in Hz, depth in Hz */ vib?: [number, number];
  /** noise only: nothing above this (7 kHz unless given), so no burst is ever piercing */ cut?: number;
}
const osc = (w: OscillatorType, f: number, t: number, d: number, g: number, x: Partial<Voice> = {}): Voice => ({ w, f, t, d, g, ...x });
const nz = (ft: BiquadFilterType, ff: number, t: number, d: number, g: number, x: Partial<Voice> = {}): Voice => ({ w: 'noise', f: 0, ft, ff, t, d, g, ...x });
/** nothing a small speaker cannot play: pitches stay above this */
const lo = (f: number): number => Math.max(270, f);
const lengthOf = (vs: Voice[]): number => vs.reduce((m, v) => Math.max(m, v.t + v.d), 0);
const again = (vs: Voice[], times: number, every: number): Voice[] => Array.from({ length: times }, (_, i) => vs.map((v) => ({ ...v, t: v.t + i * every }))).flat();
/** Heard through water (or a closed door): nothing above `lp`. */
const tint = (vs: Voice[], lp: number): Voice[] => vs.map((v) => {
  if (v.w !== 'noise') return v.ft ? { ...v, ff: Math.min(v.ff ?? lp, lp) } : { ...v, ft: 'lowpass' as const, ff: lp };
  const cut = (f?: number): number | undefined => (f === undefined ? undefined : Math.min(f, lp * 0.8));
  return { ...v, ft: v.ft === 'highpass' ? 'bandpass' as const : v.ft, ff: cut(v.ff), fto: cut(v.fto), cut: lp };
});

/* ---------------- the materials ---------------- */
type Note = (f: number, t: number, g: number, d: number, to?: number) => Voice[];
type Hit = (t: number, g: number, p?: number) => Voice[];
interface Material {
  name: string; idea: string;
  /** the notes it plays: a root in Hz and eight steps in semitones */ root: number; scale: number[];
  /** its gait: 1 = unhurried, lower = quicker and drier (every time and length in the grammar is multiplied by it) */ pace: number;
  /** a pitched note of the material */ note: Note;
  /** the material struck, with no pitch to speak of (keys, the start of a tap) */ click: Hit;
  /** something moving: up for opening and going, down for closing and coming back */ air: (t: number, d: number, g: number, up: boolean) => Voice[];
  /** a soft low knock: "not that" */ knock: Hit;
  /** the look's signature and what a creature or room on the Music scene says when touched */ sig: (N: (i: number) => number) => Voice[]; poke: (N: (i: number) => number) => Voice[];
  /** everything on screen is heard through this (under water) */ lp?: number;
  /** where the look says something its own way */ over?: (N: (i: number) => number) => Partial<Record<LookSfx | 'alarm1', Voice[]>>;
}

/** A pea whistle: two sines a few hertz apart (the beat is the pea) with a quick vibrato. */
const whistle = (f: number, t: number, d: number, g: number): Voice[] => [0, 17].map((up) => osc('sine', f + up, t, d, g * 0.5, { a: 0.008, h: d - 0.05, vib: [28, 30], ft: 'lowpass', ff: 5000 }));

const MATERIALS: Record<PaletteId, Material> = {
  /* Glass · Sea: drops into still water, a wash over sand */
  sea: {
    name: 'Glass · Sea', idea: 'Water drops and a wash over sand: round sines that plop, everything heard through water.', root: 698.46, scale: [0, 2, 5, 7, 9, 12, 14, 17], pace: 0.86, lp: 2800,
    note: (f, t, g, d, to) => [osc('sine', to ? f : f * 0.82, t, d, g, { to: to ?? f, gd: to ? d : 0.028 }), osc('sine', f * 2, t, d * 0.5, g * 0.14)],
    click: (t, g, p = 1) => [osc('sine', 880 * p, t, 0.026, g, { to: lo(540 * p) }), nz('bandpass', 720 * p, t, 0.012, g * 0.6, { q: 1 })],
    air: (t, d, g, up) => [nz('bandpass', up ? 520 : 1500, t, d, g, { fto: up ? 1500 : 520, q: 0.9, a: d * 0.35 })],
    knock: (t, g, p = 1) => [osc('sine', 370 * p, t, 0.075, g, { to: lo(300 * p) }), nz('bandpass', 560, t, 0.012, g * 0.4, { q: 1 })],
    sig: (N) => [...MATERIALS.sea.air(0, 0.12, 0.35, true), ...MATERIALS.sea.note(N(4), 0.04, 0.7, 0.1), ...MATERIALS.sea.note(N(2), 0.14, 0.7, 0.1), ...MATERIALS.sea.note(N(5), 0.24, 0.8, 0.15)],
    poke: () => [osc('sine', 520, 0, 0.06, 0.8, { to: 1050 }), osc('sine', 760, 0.075, 0.045, 0.6, { to: 1500 }), osc('sine', 980, 0.13, 0.03, 0.4, { to: 1800 })]
  },
  /* Glass · Sunset: a thumb piano on a warm evening */
  sunset: {
    name: 'Glass · Sunset', idea: 'Kalimba and marimba: warm plucked bars with a small thumb tick, a shaker for movement.', root: 392, scale: [0, 2, 4, 7, 9, 12, 14, 16], pace: 1,
    note: (f, t, g, d, to) => [osc('sine', f, t, d, g, { to }), osc('sine', f * 2, t, d * 0.55, g * 0.26, { to: to && to * 2 }), osc('sine', f * 5.4, t, Math.min(d, 0.022), g * 0.18)],
    click: (t, g, p = 1) => [osc('triangle', 950 * p, t, 0.016, g), nz('bandpass', 1900 * p, t, 0.01, g * 0.5, { q: 2 })],
    air: (t, d, g, up) => [nz('bandpass', up ? 700 : 1500, t, d, g * 0.8, { fto: up ? 1500 : 700, q: 0.9, a: d * 0.3, cut: 4000 })],
    knock: (t, g, p = 1) => [osc('sine', 330 * p, t, 0.08, g), osc('triangle', 660 * p, t, 0.016, g * 0.25)],
    sig: (N) => [0, 2, 4, 7].flatMap((n, i) => MATERIALS.sunset.note(N(n), i * 0.055, 0.6 + i * 0.1, i === 3 ? 0.2 : 0.09)),
    poke: (N) => [...MATERIALS.sunset.note(N(5), 0, 0.6, 0.06), ...MATERIALS.sunset.note(N(7), 0.035, 0.8, 0.14)]
  },
  /* Glass · Reef: bubbles */
  reef: {
    name: 'Glass · Reef', idea: 'Bubbles: every note is a small bloop that glides upward, movement is a string of bubbles, all under water.', root: 587.33, scale: [0, 2, 4, 7, 9, 12, 14, 16], pace: 0.8, lp: 3200,
    note: (f, t, g, d, to) => [osc('sine', to ? f : f * 0.62, t, d, g, { to: to ?? f * 1.12 })],
    click: (t, g, p = 1) => [osc('sine', 700 * p, t, 0.02, g, { to: 1300 * p })],
    air: (t, d, g, up) => [0, 1, 2].map((i) => { const f = [780, 1040, 1390][up ? i : 2 - i]; return osc('sine', f, t + (i * d) / 3, d / 3, g * (0.6 + 0.2 * i), { to: f * 1.35 }); }),
    knock: (t, g, p = 1) => [osc('sine', 600 * p, t, 0.075, g, { to: 420 * p })],
    sig: (N) => [0, 2, 4, 5, 7].flatMap((n, i) => MATERIALS.reef.note(N(n), i * 0.06, 0.55 + i * 0.1, i === 4 ? 0.12 : 0.05)),
    poke: () => [osc('sine', 600, 0, 0.05, 0.8, { to: 1150 }), osc('sine', 820, 0.06, 0.04, 0.7, { to: 1550 }), osc('sine', 1100, 0.115, 0.03, 0.45, { to: 2000 })]
  },
  /* Glass · Bush: wood block, seed-pod, sticks */
  bush: {
    name: 'Glass · Bush', idea: 'Dry wood: a hollow wood block for notes, clapping sticks for taps, a seed-pod rattle for movement.', root: 523.25, scale: [0, 3, 5, 7, 10, 12, 15, 17], pace: 0.7,
    note: (f, t, g, d, to) => [osc('triangle', f, t, d * 0.8, g, { to, a: 0.002 }), osc('sine', f * 2.7, t, Math.min(d, 0.03), g * 0.22, { a: 0.002 }), nz('bandpass', Math.min(5000, f * 3), t, 0.006, g * 0.4, { q: 3, a: 0.002 })],
    click: (t, g, p = 1) => [nz('bandpass', 2600 * p, t, 0.012, g, { q: 4, a: 0.002 }), osc('triangle', 1560 * p, t, 0.015, g * 0.5, { a: 0.002 })],
    air: (t, d, g, up) => [0, 1, 2, 3].map((i) => nz('bandpass', 3400, t + (i * d) / 4, Math.min(0.012, d / 4), g * (up ? 0.4 + 0.2 * i : 1 - 0.2 * i), { q: 2.5, a: 0.002, cut: 5500 })),
    knock: (t, g, p = 1) => [osc('triangle', 310 * p, t, 0.06, g, { ft: 'lowpass', ff: 900 }), nz('bandpass', 600, t, 0.008, g * 0.4, { q: 1 })],
    sig: (N) => [...MATERIALS.bush.click(0, 0.7), ...MATERIALS.bush.click(0.07, 0.8), ...MATERIALS.bush.note(N(2), 0.15, 0.8, 0.08), ...MATERIALS.bush.note(N(4), 0.24, 0.9, 0.12)],
    poke: (N) => [[0, 5, 1], [0.08, 3, 0.75], [0.14, 2, 0.55], [0.18, 0, 0.4]].flatMap(([t, n, g]) => MATERIALS.bush.note(N(n), t, g, 0.04))
  },
  /* Glass · Space: sonar */
  space: {
    name: 'Glass · Space', idea: 'Sonar: one pure ping and its faint echo, in open fourths and fifths. No noise at all.', root: 1046.5, scale: [0, 5, 7, 12, 14, 17, 19, 24], pace: 1,
    note: (f, t, g, d, to) => [osc('sine', f, t, d * 0.6, g, { to, a: 0.004 }), osc('sine', to ?? f, t + d * 0.42, d * 0.58, g * 0.3, { a: 0.004 })],
    click: (t, g, p = 1) => [osc('sine', 3900 * p, t, 0.015, g, { a: 0.002 })],
    air: (t, d, g, up) => [osc('sine', up ? 1568 : 2349, t, d * 0.5, g * 0.6, { a: 0.004 }), osc('sine', up ? 2349 : 1568, t + d * 0.5, d * 0.5, g * 0.5, { a: 0.004 })],
    knock: (t, g, p = 1) => [osc('sine', 392 * p, t, 0.06, g, { a: 0.004 }), osc('sine', 392 * p, t + 0.045, 0.045, g * 0.3, { a: 0.004 })],
    sig: (N) => [osc('sine', N(4), 0, 0.14, 1, { a: 0.004 }), osc('sine', N(4), 0.12, 0.12, 0.4, { a: 0.004 }), osc('sine', N(4), 0.24, 0.12, 0.16, { a: 0.004 })],
    poke: (N) => [...MATERIALS.space.note(N(5), 0, 0.8, 0.07), ...MATERIALS.space.note(N(5), 0.09, 0.6, 0.07)]
  },
  /* Fridge: magnets, paper, a pen, a tap on a jar */
  fridge: {
    name: 'Fridge', idea: 'The fridge door: a magnet clack for taps, a paper flick for movement, a pen tick for keys, a ting on a jar for notes.', root: 587.33, scale: [0, 4, 7, 12, 14, 16, 19, 24], pace: 0.84,
    note: (f, t, g, d, to) => [osc('triangle', f, t, d, g, { to }), osc('sine', f * 3.01, t, d * 0.4, g * 0.2), nz('bandpass', 4000, t, 0.005, g * 0.3, { q: 5, a: 0.002 })],
    click: (t, g, p = 1) => [nz('bandpass', 1700 * p, t, 0.009, g, { q: 1.5, a: 0.002 }), osc('sine', lo(430 * p), t, 0.028, g * 0.5, { to: lo(340 * p) })],
    air: (t, d, g, up) => [nz('bandpass', up ? 1800 : 3600, t, d, g * 0.7, { fto: up ? 3600 : 1800, q: 1.4, a: d * 0.3, cut: 5500 })],
    knock: (t, g, p = 1) => [osc('sine', 345 * p, t, 0.07, g, { to: lo(300 * p) }), nz('bandpass', 800, t, 0.01, g * 0.4, { q: 1 })],
    sig: (N) => [...MATERIALS.fridge.air(0, 0.05, 0.6, true), ...MATERIALS.fridge.click(0.055, 1), ...MATERIALS.fridge.note(N(4), 0.12, 0.8, 0.14)],
    poke: () => [nz('bandpass', 1200, 0, 0.05, 0.6, { fto: 2600, q: 2, a: 0.01 }), ...MATERIALS.fridge.click(0.055, 1)]
  },
  /* Orbit: glass and passing things */
  orbit: {
    name: 'Orbit', idea: 'Glassy sine blips that pass by: each note falls a hair in pitch, like something going past (a tiny Doppler glide).', root: 783.99, scale: [0, 2, 4, 6, 7, 9, 11, 12], pace: 1,
    note: (f, t, g, d, to) => [osc('sine', to ? f : f * 1.035, t, d, g, { to: to ?? f * 0.972 }), osc('sine', (to ? f : f * 1.035) * 2.005, t, d * 0.6, g * 0.2, { to: (to ?? f * 0.972) * 2.005 }), osc('sine', f * 1.006, t, d, g * 0.4, { to: to ? to * 1.006 : f * 0.978 })],
    click: (t, g, p = 1) => [osc('sine', 2300 * p, t, 0.015, g, { a: 0.002 }), osc('sine', 3450 * p, t, 0.009, g * 0.3, { a: 0.002 })],
    air: (t, d, g, up) => [osc('sine', up ? 620 : 1240, t, d, g * 0.7, { to: up ? 1240 : 620, a: d * 0.4 }), osc('sine', up ? 1240 : 2480, t, d, g * 0.15, { to: up ? 2480 : 1240, a: d * 0.4 })],
    knock: (t, g, p = 1) => [osc('sine', 415 * p, t, 0.07, g, { to: 370 * p }), osc('sine', 1245 * p, t, 0.03, g * 0.22)],
    sig: (N) => [osc('sine', N(4) * 1.09, 0, 0.26, 1, { to: N(4) * 0.92, a: 0.03 }), osc('sine', N(4) * 2.18, 0, 0.2, 0.2, { to: N(4) * 1.84, a: 0.03 }), ...MATERIALS.orbit.note(N(7), 0.26, 0.6, 0.09)],
    poke: (N) => [osc('sine', N(3) * 0.94, 0, 0.09, 0.8, { to: N(3) * 1.06 }), ...MATERIALS.orbit.click(0.1, 0.5)]
  },
  /* Sports ("Home Ground"): balls, a stick, the scoreboard, a pea whistle */
  sports: {
    name: 'Sports · Home Ground', idea: 'The ground before the crowd arrives: a boot on turf, a racquet pock, a hockey-stick click, the scoreboard’s flaps and a short pea whistle.', root: 440, scale: [0, 4, 7, 12, 16, 19, 24, 28], pace: 0.82,
    note: (f, t, g, d, to) => [osc('triangle', f, t, d, g, { to }), nz('bandpass', 2200, t, 0.008, g * 0.45, { q: 1.2, a: 0.002 })],
    click: (t, g, p = 1) => [nz('bandpass', 1800 * p, t, 0.007, g * 0.7, { q: 1.2, a: 0.002 }), osc('sine', lo(430 * p), t, 0.04, g, { to: lo(310 * p) })],
    air: (t, d, g, up) => [0, 1, 2].map((i) => nz('bandpass', [1900, 2400, 3000][up ? i : 2 - i], t + (i * d) / 3, 0.012, g * (0.6 + 0.2 * i), { q: 2.5, a: 0.002 })),
    knock: (t, g, p = 1) => [osc('sine', 466 * p, t, 0.09, g, { to: 440 * p }), osc('triangle', 932 * p, t, 0.02, g * 0.3), nz('bandpass', 1800, t, 0.006, g * 0.3, { q: 1.2, a: 0.002 })],
    sig: () => [...whistle(2093, 0, 0.08, 0.6), ...MATERIALS.sports.note(440, 0.12, 0.9, 0.06), ...MATERIALS.sports.note(660, 0.21, 0.9, 0.06)],
    poke: () => [[0, 1], [0.12, 0.7], [0.2, 0.5], [0.25, 0.35]].flatMap(([t, g]) => [osc('sine', 520, t, 0.05, g, { to: 380 }), nz('bandpass', 2000, t, 0.006, g * 0.4, { q: 1.2, a: 0.002 })]),
    over: () => { const m = MATERIALS.sports, stick = (t: number, f: number, g: number): Voice[] => [nz('bandpass', f, t, 0.02, g, { q: 5, a: 0.002 }), osc('triangle', f * 0.75, t, 0.024, g * 0.5, { a: 0.002 })];
      return {
        /* a hockey stick on the ball */
        key: stick(0, 2100, 0.8), space: stick(0, 1500, 0.8), del: [...stick(0, 2100, 0.7), ...stick(0.03, 1650, 0.6)],
        /* racquet, there and back: pock, and a fifth up, pock */
        tick: [...m.note(440, 0, 0.9, 0.06), ...m.note(660, 0.09, 0.9, 0.06)],
        /* the ball rolled back */
        untick: [osc('sine', 660, 0, 0.13, 0.8, { to: 440 }), nz('bandpass', 700, 0, 0.08, 0.3, { q: 0.8, a: 0.01 })],
        /* the ball let go: one light pock, an octave up */
        set: m.note(880, 0, 0.7, 0.05),
        /* the scoreboard's flaps */
        nav: m.air(0, 0.1, 1, true),
        /* a short two-note pea whistle */
        done: [...whistle(2093, 0, 0.09, 1), ...whistle(2637, 0.13, 0.25, 1)],
        /* over the bar: the flight, the net, two notes */
        unlock: [osc('sine', 400, 0, 0.24, 0.6, { to: 1000, a: 0.02 }), nz('bandpass', 3000, 0.22, 0.14, 0.5, { fto: 1200, q: 1, a: 0.02 }), ...m.note(784, 0.36, 0.8, 0.1), ...m.note(1047, 0.46, 0.9, 0.13)],
        /* a ball coming to rest, then a ting */
        coin: [...[[0, 1], [0.1, 0.75], [0.17, 0.55], [0.22, 0.4]].map(([t, g]) => osc('sine', 520, t, 0.05, g, { to: 380 })), osc('triangle', 1319, 0.27, 0.1, 0.6)],
        /* into the ball bag: the drop, then the net */
        jar: [nz('bandpass', 900, 0, 0.03, 0.8, { q: 1 }), osc('sine', 420, 0, 0.06, 0.8, { to: 300 }), nz('bandpass', 4000, 0.07, 0.08, 0.4, { q: 1, a: 0.01 })],
        /* the referee: pip, peep (three times for the timer) */
        alarm1: [...whistle(2350, 0, 0.12, 1), ...whistle(2350, 0.17, 0.22, 1)]
      }; }
  }
};

/* ---------------- the grammar: one for every palette ---------------- *
 * tap = the material struck          key = the same, smaller and quieter
 * tick rises, untick falls           on = click + a high note, off = click + a low note
 * open goes up, close comes down     undo slides back down
 * error = two soft low knocks        locked = one
 * done = the longest and brightest   alarm = two pips, three times
 * ------------------------------------------------------------------ */
const grammar = (m: Material): Record<LookSfx | 'alarm1', Voice[]> => {
  const N = (i: number): number => m.root * 2 ** (m.scale[i] / 12), n = m.note, c = m.click, k = m.pace;
  const paced = (vs: Voice[]): Voice[] => vs.map((v) => ({ ...v, t: v.t * k, d: v.d < 0.02 ? v.d : Math.max(0.02, v.d * k), // a click stays a click: only what is long enough to shorten is shortened
    ...(v.h ? { h: v.h * k } : {}), ...(v.gd ? { gd: v.gd * k } : {}) }));
  const pip = (f: number, t: number, d: number): Voice[] => [...n(f, t, 0.8, d).map((v) => ({ ...v, h: v.d * 0.5 })), osc('sine', f, t, d, 0.5, { a: 0.006, h: d * 0.5 })];
  const own = m.over?.(N) ?? {};
  const alarm1 = own.alarm1 ?? paced([...pip(N(4), 0, 0.15), ...pip(N(6), 0.19, 0.19)]);
  const base: Record<string, Voice[]> = {
    key: c(0, 0.6), space: c(0, 0.6, 0.72), del: [...c(0, 0.5, 1.2), ...c(0.028, 0.5, 0.85)],
    send: [...n(N(2), 0, 0.6, 0.05), ...n(N(4), 0.05, 0.8, 0.08)],
    tap: [...c(0, 0.8), ...n(N(0), 0, 0.5, 0.05)],
    nav: [...m.air(0, 0.07, 0.4, true), ...n(N(1), 0.03, 0.7, 0.08)],
    open: [...m.air(0, 0.13, 0.5, true), ...n(N(2), 0.07, 0.5, 0.1)],
    close: [...m.air(0, 0.11, 0.5, false), ...n(N(0), 0.05, 0.5, 0.09)],
    on: [...c(0, 0.7), ...n(N(3), 0.012, 0.8, 0.1)], off: [...c(0, 0.7, 0.8), ...n(N(1), 0.012, 0.7, 0.09)],
    tick: [...n(N(2), 0, 0.8, 0.07), ...n(N(4), 0.065, 0.9, 0.085)], untick: [...n(N(3), 0, 0.7, 0.07), ...n(N(1), 0.065, 0.6, 0.08)],
    coin: [...n(N(4), 0, 0.8, 0.07), ...n(N(6), 0.07, 0.9, 0.2)],
    jar: [...c(0, 0.6), ...n(N(4), 0, 0.6, 0.06), ...n(N(5), 0.06, 0.6, 0.06), ...n(N(7), 0.12, 0.7, 0.12)],
    done: [...n(N(0), 0, 0.7, 0.12), ...n(N(2), 0.09, 0.75, 0.12), ...n(N(4), 0.18, 0.8, 0.14), ...n(N(7), 0.27, 1, 0.3), ...n(N(7) * 2, 0.27, 0.15, 0.2)],
    unlock: [...m.air(0, 0.12, 0.4, true), ...[0, 2, 4, 5, 7].flatMap((s, i) => n(N(s), 0.06 + i * 0.08, 0.7 + i * 0.07, i === 4 ? 0.2 : 0.1))],
    locked: [...m.knock(0, 0.8), ...c(0, 0.25)],
    error: [...m.knock(0, 0.8), ...m.knock(0.13, 0.65)],
    undo: [...m.air(0, 0.09, 0.4, false), ...n(N(3), 0.02, 0.7, 0.12, N(1))],
    pin: [...c(0, 0.7), ...n(N(2), 0, 0.4, 0.04)],
    pinok: [...n(N(2), 0, 0.7, 0.05), ...n(N(4), 0.05, 0.8, 0.05), ...n(N(5), 0.1, 0.9, 0.1)],
    pinno: [...m.knock(0, 0.8), ...m.knock(0.12, 0.6, 0.9)],
    slide: c(0, 0.4, 1.3), set: n(N(2), 0, 0.5, 0.055), step: c(0, 0.5, 1.1),
    timer: [...c(0, 0.8), ...c(0.09, 0.8, 0.8), ...n(N(4), 0.09, 0.4, 0.05)],
    look: m.sig(N), listen: n(N(2), 0, 0.6, 0.14, N(4)), heard: n(N(4), 0, 0.6, 0.13, N(2)),
    answer: [...n(N(3), 0, 0.5, 0.08), ...n(N(5), 0.08, 0.6, 0.16)],
    poke: m.poke(N)
  };
  for (const e of Object.keys(base)) base[e] = paced(base[e]);
  return { ...base, ...own, alarm1, alarm: again(alarm1, 3, 0.46) } as Record<LookSfx | 'alarm1', Voice[]>;
};

/* The sounds of things on the screen. */
const THINGS: Record<ThingSfx, Voice[]> = {
  /* a record sleeve pulled from the crate: card sliding on card, and it stops */
  sleeve: [nz('bandpass', 1600, 0, 0.075, 0.7, { fto: 2800, q: 1.4, a: 0.02, cut: 5000 }), nz('bandpass', 900, 0.078, 0.012, 0.5, { q: 1, a: 0.002 })],
  /* the needle goes down: a soft thump, then two crackles (a moment, never a loop) */
  needle: [osc('sine', 340, 0, 0.035, 0.8, { to: 300 }), nz('bandpass', 1200, 0, 0.012, 0.6, { q: 1 }), nz('bandpass', 4200, 0.07, 0.004, 0.35, { q: 2, a: 0.001 }), nz('bandpass', 3300, 0.122, 0.005, 0.25, { q: 2, a: 0.001 })],
  /* a coin in the jukebox: the edge rings, it drops, it lands */
  slot: [osc('triangle', 2900, 0, 0.035, 0.6), osc('sine', 4350, 0, 0.025, 0.3), nz('bandpass', 1100, 0.09, 0.016, 0.8, { q: 1.5 }), osc('sine', 520, 0.09, 0.045, 0.7, { to: 400 })],
  /* the tuner's detent */
  tune: [nz('bandpass', 2600, 0, 0.01, 0.8, { q: 6, a: 0.002 }), osc('sine', 1500, 0, 0.015, 0.5, { a: 0.002 })],
  /* 60 ms of static between two stations */
  static: [nz('bandpass', 1500, 0, 0.06, 0.8, { fto: 3800, q: 3, a: 0.008 }), osc('sine', 1800, 0, 0.06, 0.12, { to: 2600, a: 0.01 })],
  /* a rubber pad on the mixing desk */
  pad: [osc('sine', 500, 0, 0.036, 0.9, { to: 380 }), nz('bandpass', 1500, 0, 0.008, 0.5, { q: 1 })],
  /* a rubber stamp: the thunk, the ink */
  stamp: [nz('bandpass', 700, 0, 0.018, 0.8, { q: 1 }), osc('sine', 380, 0, 0.05, 0.8, { to: 300 }), nz('bandpass', 2000, 0.02, 0.022, 0.25, { q: 1.5, a: 0.006 })],
  /* the eraser, once */
  rub: [nz('bandpass', 1400, 0, 0.04, 0.8, { fto: 1900, q: 1.2, a: 0.012, cut: 4500 })],
  /* stuck up on the fridge: the paper, then the magnet */
  stick: [nz('bandpass', 2000, 0, 0.04, 0.5, { fto: 3600, q: 1.4, a: 0.012, cut: 5500 }), nz('bandpass', 1700, 0.045, 0.009, 1, { q: 1.5, a: 0.002 }), osc('sine', 430, 0.045, 0.03, 0.5, { to: 340 })]
};
/* The boys' own: a clarinet's three notes, a trumpet call, a dinosaur. The same notes as ever. */
const OWN: Record<typeof OWN_EVENTS[number], Voice[]> = {
  clarinet: [587, 698, 880].map((f, i) => osc('square', f, i * 0.16, 0.3, 0.5, { a: 0.012 })),
  trumpet: [523, 523, 784].map((f, i) => osc('sawtooth', f, i * 0.14, i === 2 ? 0.5 : 0.12, 0.5, { a: 0.012 })),
  roar: [osc('sawtooth', 140, 0, 0.6, 1, { to: 70, a: 0.015 }), osc('square', 210, 0.05, 0.5, 0.4, { to: 90, a: 0.015 })]
};

const made: Partial<Record<PaletteId, Record<string, Voice[]>>> = {};
const book = (p: PaletteId): Record<string, Voice[]> => (made[p] ??= ((): Record<string, Voice[]> => {
  const m = MATERIALS[p], things = Object.fromEntries(Object.entries(THINGS).map(([k, v]) => [k, m.lp ? tint(v, m.lp) : v]));
  const look = Object.fromEntries(Object.entries(grammar(m)).map(([k, v]) => [k, m.lp ? tint(v, m.lp) : v]));
  return { ...look, ...things, ...OWN };
})());
/** The voices of one sound in one palette. */
export const recipe = (p: PaletteId, s: Sfx): Voice[] => book(p)[s] ?? [];
export const paletteInfo = (p: PaletteId): { name: string; idea: string } => ({ name: MATERIALS[p].name, idea: MATERIALS[p].idea });
const trimOf = (p: PaletteId, s: Sfx): number => TRIM[p]?.[EVENTS.indexOf(s)] ?? 0.08;

/* ---------------- drawing a sound on a context (live or offline) ---------------- */
const hiss: Record<number, AudioBuffer> = {};
/** One shared 0.3 s of noise per sample rate, the same every time (so a measurement can be repeated). */
const noiseFor = (ac: BaseAudioContext): AudioBuffer => (hiss[ac.sampleRate] ??= ((): AudioBuffer => {
  const b = ac.createBuffer(1, Math.round(ac.sampleRate * 0.3), ac.sampleRate), d = b.getChannelData(0); let s = 0x2f6e2b1;
  for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) | 0; d[i] = (s >>> 8) / 8388608 - 1; }
  return b;
})());
/** Build the voices on `ac`, into `out`, starting at `at`. Every envelope starts at zero and ends at zero, and the filter sits before the envelope so nothing rings on after it. */
export const build = (ac: BaseAudioContext, out: AudioNode, vs: Voice[], at: number, gain = 1): void => {
  for (const v of vs) {
    const t = at + v.t, end = t + v.d, r = Math.min(0.004, v.d * 0.3), a = Math.min(v.a ?? 0.003, v.d * 0.4), h = Math.max(0, Math.min(v.h ?? 0, v.d - a - r - 0.004)), peak = v.g * gain;
    if (!(peak > 0) || !(v.d > 0)) continue;
    const g = ac.createGain(); g.gain.value = 0;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a);
    if (h) g.gain.setValueAtTime(peak, t + a + h);
    g.gain.exponentialRampToValueAtTime(peak * 0.02, end - r); g.gain.linearRampToValueAtTime(0, end);
    let src: AudioScheduledSourceNode;
    if (v.w === 'noise') { const n = ac.createBufferSource(); n.buffer = noiseFor(ac); n.start(t, ((v.ff ?? 1000) * 0.000013 + v.t * 0.37) % 0.08); src = n; }
    else {
      const o = ac.createOscillator(); o.type = v.w; o.frequency.setValueAtTime(v.f, t);
      if (v.to) o.frequency.exponentialRampToValueAtTime(v.to, t + Math.min(v.gd ?? v.d, v.d));
      if (v.vib) { const l = ac.createOscillator(), dp = ac.createGain(); l.frequency.value = v.vib[0]; dp.gain.value = v.vib[1]; l.connect(dp).connect(o.frequency); l.start(t); l.stop(end + 0.01); }
      o.start(t); src = o;
    }
    src.stop(end + 0.01);
    let last: AudioNode = src;
    if (v.ft) { const f = ac.createBiquadFilter(); f.type = v.ft; f.Q.value = v.q ?? 0.7; f.frequency.setValueAtTime(v.ff ?? 1000, t); if (v.fto) f.frequency.exponentialRampToValueAtTime(v.fto, end); last = last.connect(f); }
    if (v.w === 'noise') { const c = ac.createBiquadFilter(); c.type = 'lowpass'; c.Q.value = 0.6; c.frequency.value = v.cut ?? 7000; last = last.connect(c); }
    last.connect(g);
    g.connect(out);
  }
};
/** What plays: the palette's voices and their level. In quiet hours the alarm is one round, softer, as if from the next room. */
const plan = (p: PaletteId, s: Sfx, indoors = false, raw = false): { vs: Voice[]; gain: number } => {
  const gain = raw ? 1 : trimOf(p, s);
  if (s === 'alarm' && indoors) return { vs: tint(book(p).alarm1, 2500), gain: gain * 0.6 };
  return { vs: recipe(p, s), gain };
};
/** Render one sound off line, exactly as it would play at full volume (`raw`: before its trim; `indoors`: the quiet-hours alarm). Mono samples at `rate`. */
export const render = async (p: PaletteId, s: Sfx, o: { raw?: boolean; indoors?: boolean; rate?: number } = {}): Promise<Float32Array> => {
  const { vs, gain } = plan(p, s, o.indoors, o.raw), rate = o.rate ?? 48000;
  const Off: typeof OfflineAudioContext = (globalThis as any).OfflineAudioContext || (globalThis as any).webkitOfflineAudioContext;
  const ac = new Off(1, Math.ceil(rate * (lengthOf(vs) + 0.05)), rate);
  build(ac, ac.destination, vs, 0, gain);
  return (await ac.startRendering()).getChannelData(0);
};

/* ---------------- the live side: one context, one master gain, the quiet rules ---------------- */
let ctx: AudioContext | null = null, master: GainNode | null = null, masterLevel = 1;
let muted = false, level = 1, mode: 'on' | 'quiet' | 'off' = 'on';
let soundLook = '', soundTheme = 'sea';
const lastAt: Partial<Record<Sfx, number>> = {};
let asks = 0;
const nowMs = (): number => { try { return performance.now(); } catch { return Date.now(); } };
/** how soon the same sound may come again, so quick taps never machine-gun */
const GAP: Record<SoundClass, number> = { key: 35, step: 35, tap: 45, mid: 90, sheet: 120, error: 250, reward: 150, done: 400, alarm: 1200, own: 300 };
/** the preview's `&scene=sports` (or any palette id) plays that palette whatever the look is */
const forced = (): string => { try { return String((globalThis as { __fhScene?: string }).__fhScene ?? ''); } catch { return ''; } };
const isPalette = (x: string): x is PaletteId => (PALETTES as readonly string[]).includes(x);

/** A child's own setting: 1 = full, lower = softer, 0 = off. Alarms ignore this. */
export const setVolume = (v: number): void => { level = Math.max(0, Math.min(1, Number(v) || 0)); };
/** Quiet hours mute everything except the kitchen timer's alarm (someone set it on purpose). */
export const setMuted = (m: boolean): void => { muted = !!m; };
export const isMuted = (): boolean => muted;
/** The panel's own setting: true, 'quiet' (softer) or false (off; the timer still sounds). */
export const setSounds = (m: boolean | 'quiet' | undefined): void => { mode = m === false ? 'off' : m === 'quiet' ? 'quiet' : 'on'; };
/** Call when a look is applied (its id), and when the Glass theme changes: the sounds follow what is on the screen. */
export const setSoundLook = (id: string): void => { soundLook = id; };
export const setSoundTheme = (id: string): void => { soundTheme = id; };
/** The palette in use: a Glass theme's own, or the look's. */
export const soundPalette = (): PaletteId => { const f = forced(); if (isPalette(f)) return f; const l = soundLook || 'glass'; return isPalette(l) ? l : isPalette(soundTheme) ? soundTheme : 'sea'; };
/** How many sounds have been asked for so far (whether or not they were allowed to play): lets the card add a plain tap only where nothing else spoke. */
export const sfxAsked = (): number => asks;
/** The audition page's volume. The card leaves it at 1. */
export const setMaster = (v: number): void => { masterLevel = Math.max(0, Math.min(4, Number(v) || 0)); if (master && ctx) master.gain.setTargetAtTime(masterLevel, ctx.currentTime, 0.01); };

const live = (): AudioContext | null => {
  try {
    if (!ctx) { const AC: typeof AudioContext = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext; if (!AC) return null; ctx = new AC({ latencyHint: 'interactive' }); master = ctx.createGain(); master.gain.value = masterLevel; master.connect(ctx.destination); noiseFor(ctx); }
    return ctx;
  } catch { return null; }
};
/** Start (or wake) the context on the first touch or key, so the first sound is not late. */
const wake = (): void => { try { const a = live(); if (a && a.state === 'suspended') void a.resume().catch(() => { /* still asleep */ }); } catch { /* no audio */ } };
try { for (const ev of ['pointerdown', 'keydown'] as const) globalThis.addEventListener?.(ev, wake, { capture: true, passive: true }); } catch { /* no window */ }

const start = (p: PaletteId, s: Sfx, scale: number, indoors: boolean): void => {
  const a = live(); if (!a || !master) return;
  const go = (): void => { try { const { vs, gain } = plan(p, s, indoors); build(a, master!, vs, a.currentTime + 0.004, gain * scale); } catch { /* never throw for a sound */ } };
  if (a.state === 'running') { go(); return; }
  // asleep (no touch yet, or the tab was put away): wake it, and play only if it wakes at once, so stale sounds never arrive in a bunch
  const t = nowMs(); a.resume().then(() => { if (nowMs() - t < 250) go(); }, () => { /* not allowed yet */ });
};
/** Play an interaction sound in the palette on screen. Never throws; silent where the quiet rules say so. */
export const sfx = (s: Sfx): void => {
  try {
    asks++; const asked = nowMs();
    const cls = CLASS[s]; if (!cls) return;
    const always = s === 'alarm';
    if (!always && (muted || mode === 'off' || level <= 0)) return;
    const was = lastAt[s]; if (was !== undefined && asked - was < GAP[cls]) return;
    lastAt[s] = asked; stats.played++; stats.last = s;
    start(soundPalette(), s, always ? 1 : level * (mode === 'quiet' ? 0.4 : 1), always && muted);
  } catch { /* audio is a nicety */ }
};
/** For the audition page: any palette, any sound, no quiet rules. */
export const audition = (p: PaletteId, s: Sfx, indoors = false): void => { try { start(p, s, 1, indoors); } catch { /* no audio */ } };
const stats = { played: 0, last: '' };

/* for the preview, the audition page, the tests and trying things from the console */
try {
  const g = globalThis as { fhSfx?: typeof sfx; fhSound?: unknown };
  g.fhSfx ??= sfx;
  g.fhSound ??= { EVENTS, PALETTES, CLASS, LIMITS, recipe, render, build, audition, paletteInfo, setMaster, setSounds, setMuted, setVolume, soundPalette, stats, state: () => ({ muted, level, mode, palette: soundPalette(), context: ctx?.state ?? 'none' }) };
} catch { /* no window */ }
