import { html, svg, nothing, unsafeCSS, type ReactiveController, type ReactiveControllerHost, type TemplateResult } from 'lit';
import { loadFonts } from './fonts';
import { getShape, onShape } from './util';

/* ------------------------------------------------------------------ *
 * Looks: whole design languages, one level above themes.
 * "glass" is the original (themes pick its photo and colours); the others
 * bring their own background, type and shapes.
 *
 * How looks stay linked to the base interface:
 *  1. Every component carries a `data-look` host attribute (LookController).
 *  2. A look is tokens (`vars`, plus `evening` overrides) + rules bound to the
 *     HOOKS below + optional drawings (`art`) + optional switches (`options`).
 *     The base templates never name a look.
 *  3. HOOKS is the contract. "Roles" are shared building blocks (row, check,
 *     content, meter, quick…): anything new in the base that is built from
 *     them is styled by every look automatically. "Parts" are the named
 *     regions a look may also dress, owned by one component each so a rule
 *     for one page can never leak onto another.
 *  4. `npm run check:looks` (part of the build) fails if a look styles a
 *     class that is not in HOOKS, mixes components, selects by position, or
 *     if a hook no longer exists in the base.
 *
 * State the base exposes on the root `.fh` for looks to react to:
 *   data-tod="day|eve|night"   time of day (evening tokens apply to eve + night)
 *   data-calm                  calm mode: no looping motion, no tilt
 *   data-opt-<id>              a look option the family switched on
 * ------------------------------------------------------------------ */

export type LookId = 'glass' | 'fridge' | 'orbit';
export interface DialArc { start: Date; end: Date; allDay: boolean; colour: string }
/** Places in the base where a look may add a drawing of its own. */
export type ArtSlot = 'clock' | 'day' | 'timer' | 'dayview' | 'night' | 'player';
export interface ArtCtx { now?: Date; arcs?: DialArc[]; frac?: number; size?: number; /** cover art and whether it is playing, for the music player */ img?: string; playing?: boolean }
/** A switch a look offers. With `off`/`on` labels it is drawn as a two-way toggle (e.g. Print | Handwriting). */
export interface LookOption { id: string; label: string; hint?: string; off?: string; on?: string; onStyle?: string }
export interface LookDef {
  id: LookId; name: string; tagline: string; swatch: string; /** families from fonts.ts this look needs */ fonts?: string[];
  /** true = colours and background come from the photo themes (the original look) */
  themed?: boolean;
  vars?: Record<string, string>;
  /** token overrides from early evening until morning (calmer, dimmer) */
  evening?: Record<string, string>;
  art?: Partial<Record<ArtSlot, (c: ArtCtx) => TemplateResult>>;
  options?: LookOption[];
  /** how the look pictures itself in the look picker; drawn with the look's own tokens */
  preview?: () => TemplateResult;
}

/** The contract between the base interface and the looks (see the note at the top). */
export const HOOKS: { roles: string[]; parts: Record<string, string[]> } = {
  // shared building blocks: styled once per look, wherever they appear
  roles: ['fh', 'glass', 'card', 'sheet', 'scrim', 'toast', 'label', 'muted', 'display', 'pill', 'round', 'primary', 'lead', 'tap', 'quick', 'avatar',
    'row', 'check', 'content', 'done', 'now', 'big', 'past', 'next', 'meter', 'tab', 'tabs', 'field', 'key', 'today', 'away', 'playing', 'on', 'hot', 'i'],
  // named regions, by the component that owns them
  parts: {
    'family-hub-card': ['clock', 'hm', 'cap', 'weather', 'badge', 'presence', 'right', 'planner', 'seg', 'legend', 'week', 'col', 'dayhead', 'num', 'ev', 't', 'w', 'more',
      'cell', 'out', 'dayrow', 'np', 'np-row', 'art', 'timerrow', 'hint', 'rem', 'dock', 'item', 'kidbtn', 'sep', 'tcard',
      // drawings a look adds through art
      'aclock', 'dial', 'nowdot', 'tface', 'dayview', 'dayart', 'ddial', 'night', 'nart'],
    'fh-kid': ['hero', 'name', 'rank', 'stat', 'dots', 'g', 't', 'nextup', 'jobs', 'sec', 'plus', 'play', 'later', 'side', 'rw', 'n', 'save', 'pic', 'wk'],
    'fh-groceries': ['list', 'items', 'tag', 'who'],
    'fh-music': ['stage', 'deck', 'spk', 'focus', 'inmix', 'join', 'hit', 'st', 'pickrow', 'banner', 'mini', 'tog', 'mroom', 'mzone', 'mstairs', 'pool', 'puck', 'mshelf', 'wholeh',
      // other ways of seeing the rooms (musicviews.ts)
      'viewbtn', 'vcard', 'dplate', 'dtrack', 'dknob', 'dcover', 'desk', 'strip', 'sname', 'lamp', 'fcap', 'slot', 'cab', 'sock', 'cdisc', 'cbox', 'ttable', 'tkey', 'ctab', 'jog', 'mpad', 'dart', 'sshelf', 'dcard', 'tuner', 'vscene', 'aname', 'ahull', 'aline', 'bigdial', 'rig'],
    'fh-home': ['room', 'lit', 'rh', 'dev', 'dicon', 'toggle', 'scene'],
    'fh-doodle': ['easel', 'pad', 'ink', 'gallery', 'snaps', 'snap', 'by'],
    'fh-studio': ['mirror', 'tile'],
    'fh-chat': ['thread', 'bubble', 'asker', 'starter', 'talk'],
    'fh-morning': ['board', 'kcol', 'khead', 'nextstep', 'set', 'lchip', 'soon', 'leave'],
    'fh-weather': ['wnow', 'wtemp', 'wtip', 'wfact', 'wwarn', 'wcomp', 'whours', 'wweek', 'wday', 'wbar', 'wmaps', 'sky', 'hchart', 'mbox', 'disc', 'moon', 'rays', 'bolt', 'drop', 'cloud', 'area', 'line']
  }
};

export const LOOK_KEY = 'family-hub-look';
export const LOOK_OPTS_KEY = 'family-hub-look-options';

/* ---------------- little drawings the looks add ---------------- */

/** Fridge: a kitchen wall clock (no second hand: nothing on the panel should tick for no reason). */
export const wallClock = (now: Date, size = 62): TemplateResult => {
  const h = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5, m = now.getMinutes() * 6;
  return html`<svg class="aclock" aria-hidden="true" width=${size} height=${size} viewBox="0 0 116 116">${svg`
    <circle cx="58" cy="58" r="53" fill="var(--paper)" stroke="var(--ink)" stroke-width="6"></circle>
    ${Array.from({ length: 12 }, (_, i) => svg`<rect x="56.5" y="11" width="3" height=${i % 3 ? 6 : 11} fill="var(--ink)" transform="rotate(${i * 30} 58 58)"></rect>`)}
    <rect x="55" y="30" width="6" height="30" rx="3" fill="var(--ink)" transform="rotate(${h} 58 58)"></rect>
    <rect x="56.25" y="17" width="3.5" height="43" rx="1.75" fill="var(--ink)" transform="rotate(${m} 58 58)"></rect>
    <circle cx="58" cy="58" r="4.5" fill="var(--danger)"></circle>`}</svg>`;
};

/**
 * Orbit: an ordinary 12-hour clock face, so it reads the way children are taught.
 * Anything on in the next 12 hours is an arc on the rim, in its person's colour,
 * sitting where the hour hand will be when it happens.
 */
export const ringClock = (arcs: DialArc[], now: Date, size = 76): TemplateResult => {
  const r = 43, C = 2 * Math.PI * r, t0 = now.getTime(), horizon = t0 + 12 * 3_600_000;
  const deg = (ms: number): number => { const d = new Date(ms); return ((d.getHours() % 12) + d.getMinutes() / 60) * 30; };
  const soon = arcs.filter((a) => !a.allDay && a.end.getTime() > t0 && a.start.getTime() < horizon);
  const hh = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5, mm = now.getMinutes() * 6;
  return html`<svg class="dial" aria-hidden="true" width=${size} height=${size} viewBox="0 0 100 100" fill="none">${svg`
    <circle cx="50" cy="50" r=${r} stroke="var(--track)" stroke-width="8"></circle>
    ${soon.map((a) => {
      const s = Math.max(a.start.getTime(), t0), e = Math.min(a.end.getTime(), horizon);
      const span = Math.max(8, ((e - s) / 3_600_000) * 30);
      return svg`<circle cx="50" cy="50" r=${r} stroke=${a.colour} stroke-width="8" stroke-dasharray="${(span / 360) * C} ${C}" transform="rotate(${deg(s) - 90} 50 50)"></circle>`;
    })}
    ${[0, 3, 6, 9].map((i) => svg`<rect x="49" y="13" width="2" height="6" rx="1" fill="var(--ink2)" transform="rotate(${i * 30} 50 50)"></rect>`)}
    <rect x="48" y="27" width="4" height="25" rx="2" fill="var(--ink)" transform="rotate(${hh} 50 50)"></rect>
    <rect x="48.75" y="17" width="2.5" height="35" rx="1.25" fill="var(--ink)" transform="rotate(${mm} 50 50)"></rect>
    <circle class="nowdot" cx="50" cy="50" r="3.5" fill="var(--accent)"></circle>`}</svg>`;
};

/**
 * Orbit's day view: one whole day on a clock face. The inner ring is the morning, the outer ring
 * the afternoon and evening, so nothing overlaps and each event sits at its hour. Hands show now.
 */
export const dayDial = (arcs: DialArc[], now: Date | undefined, size = 360): TemplateResult => {
  const ring = (r: number): number => 2 * Math.PI * r, AM = 62, PM = 84;
  const hours = (d: Date): number => d.getHours() + d.getMinutes() / 60;
  const seg = (a: DialArc, r: number, from: number, to: number) => {
    const s = Math.max(from, hours(a.start)), e = Math.min(to, a.end.getDate() !== a.start.getDate() ? 24 : hours(a.end));
    if (e <= s && !(hours(a.start) >= from && hours(a.start) < to)) return nothing;
    const span = Math.max(7, (Math.max(e, s) - s) * 30);
    return svg`<circle cx="100" cy="100" r=${r} stroke=${a.colour} stroke-width="15" stroke-dasharray="${(span / 360) * ring(r)} ${ring(r)}" transform="rotate(${(s % 12) * 30 - 90} 100 100)"></circle>`;
  };
  const timed = arcs.filter((a) => !a.allDay);
  const hh = now ? (now.getHours() % 12) * 30 + now.getMinutes() * 0.5 : 0, mm = now ? now.getMinutes() * 6 : 0;
  return html`<svg class="ddial" role="img" aria-label="The day as a clock: mornings on the inner ring, afternoons and evenings on the outer ring" width=${size} height=${size} viewBox="0 0 200 200" fill="none">${svg`
    <circle cx="100" cy="100" r=${PM} stroke="var(--track)" stroke-width="15" opacity=".55"></circle>
    <circle cx="100" cy="100" r=${AM} stroke="var(--track)" stroke-width="15" opacity=".55"></circle>
    ${timed.map((a) => seg(a, AM, 0, 12))}${timed.map((a) => seg(a, PM, 12, 24))}
    ${Array.from({ length: 12 }, (_, i) => svg`<rect x="99.4" y="6" width="1.2" height=${i % 3 ? 4 : 0} fill="var(--ink3)" transform="rotate(${i * 30} 100 100)"></rect>`)}
    ${[[12, 100, 13], [3, 190.5, 103.5], [6, 100, 194], [9, 9.5, 103.5]].map(([n, x, y]) => svg`<text x=${x} y=${y} text-anchor="middle" font-size="9" font-weight="600" fill="var(--ink2)">${n}</text>`)}
    <text x="100" y="41.5" text-anchor="middle" font-size="7" font-weight="700" letter-spacing=".08em" fill="var(--ink)" opacity=".85">AM</text>
    <text x="100" y="19.5" text-anchor="middle" font-size="7" font-weight="700" letter-spacing=".08em" fill="var(--ink)" opacity=".85">PM</text>
    ${now ? svg`<rect x="97.5" y="66" width="5" height="36" rx="2.5" fill="var(--ink)" transform="rotate(${hh} 100 100)"></rect>
      <rect x="98.4" y="52" width="3.2" height="50" rx="1.6" fill="var(--ink)" transform="rotate(${mm} 100 100)"></rect>
      <circle cx="100" cy=${100 - (now.getHours() < 12 ? AM : PM)} r="5" fill="var(--accent)" stroke="var(--ground, #000)" stroke-width="2" transform="rotate(${hh} 100 100)"></circle>
      <circle cx="100" cy="100" r="4.5" fill="var(--accent)"></circle>` : svg`<circle cx="100" cy="100" r="3" fill="var(--ink3)"></circle>`}`}</svg>`;
};

/** Fridge door's player: a record on a turntable. The cover is the label, the record turns while it plays. */
export const turntable = (img: string | undefined, playing: boolean, size = 230): TemplateResult => html`
  <svg class="vinyl" aria-hidden="true" width=${size} height=${size} viewBox="0 0 200 200">${svg`
    <rect x="4" y="4" width="192" height="192" rx="12" fill="#d9cdb4"></rect>
    <g class=${playing ? 'spin' : ''}>
      <circle cx="94" cy="104" r="80" fill="#17140f"></circle>
      ${[70, 60, 50, 42].map((r) => svg`<circle cx="94" cy="104" r=${r} fill="none" stroke="#3a342b" stroke-width="1.2"></circle>`)}
      <path d="M94 30 A74 74 0 0 1 160 80" fill="none" stroke="#5b5346" stroke-width="2" opacity=".6"></path>
      <clipPath id="fhlabel"><circle cx="94" cy="104" r="31"></circle></clipPath>
      <circle cx="94" cy="104" r="31" fill="#c2410c"></circle>
      ${img ? svg`<image href=${img} x="63" y="73" width="62" height="62" preserveAspectRatio="xMidYMid slice" clip-path="url(#fhlabel)"></image>` : nothing}
      <circle cx="94" cy="104" r="3.5" fill="#f4efe3"></circle>
    </g>
    <g transform="rotate(${playing ? 24 : 6} 176 30)"><rect x="173" y="26" width="6" height="92" rx="3" fill="#8b8477"></rect><rect x="168" y="112" width="16" height="22" rx="3" fill="#26272b"></rect></g>
    <circle cx="176" cy="30" r="11" fill="#26272b"></circle><circle cx="176" cy="30" r="4" fill="#8b8477"></circle>`}</svg>`;

/** Orbit's player: the cover as a disc, with a ring around it that fills as the track plays. */
export const ringPlayer = (img: string | undefined, frac: number, playing: boolean, size = 230): TemplateResult => {
  const r = 92, C = 2 * Math.PI * r, f = Math.max(0, Math.min(1, frac));
  return html`<svg class="pring" aria-hidden="true" width=${size} height=${size} viewBox="0 0 200 200" fill="none">${svg`
    <circle cx="100" cy="100" r=${r} stroke="rgba(255,255,255,.22)" stroke-width="6"></circle>
    <circle cx="100" cy="100" r=${r} stroke="var(--accent, #ffe08a)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${f * C} ${C}" transform="rotate(-90 100 100)" style="transition:stroke-dasharray 1s linear"></circle>
    <clipPath id="fhdisc"><circle cx="100" cy="100" r="78"></circle></clipPath>
    <circle cx="100" cy="100" r="78" fill="rgba(255,255,255,.08)"></circle>
    ${img ? svg`<image href=${img} x="22" y="22" width="156" height="156" preserveAspectRatio="xMidYMid slice" clip-path="url(#fhdisc)" opacity=${playing ? 1 : 0.6}></image>`
      : svg`<circle cx="100" cy="100" r="30" stroke="rgba(255,255,255,.3)" stroke-width="2"></circle><circle cx="100" cy="100" r="54" stroke="rgba(255,255,255,.16)" stroke-width="2"></circle>`}
    <circle cx="100" cy="100" r="5" fill="var(--ground, #0a0f1e)"></circle>`}</svg>`;
};

/** A countdown you can see: the coloured wedge is the time left and shrinks as it runs. */
export const timerFace = (frac: number, size = 56): TemplateResult => {
  const C = 2 * Math.PI * 22, f = Math.max(0, Math.min(1, frac));
  return html`<svg class="tface" aria-hidden="true" width=${size} height=${size} viewBox="0 0 100 100" fill="none">${svg`
    <circle cx="50" cy="50" r="46" fill="var(--timer-face, var(--chip-strong))" stroke="var(--timer-rim, var(--ink3))" stroke-width="4"></circle>
    <circle cx="50" cy="50" r="22" stroke="var(--timer, var(--accent))" stroke-width="44" stroke-dasharray="${f * C} ${C}" transform="rotate(-90 50 50)" style="transition:stroke-dasharray 1s linear"></circle>
    <circle cx="50" cy="50" r="3" fill="var(--timer-rim, var(--ink3))"></circle>`}</svg>`;
};

/* ---------------- the looks ---------------- */

const PEOPLE = { '--p-1': '#2563eb', '--p-2': '#db2777', '--p-3': '#0f766e', '--p-4': '#c2410c', '--p-5': '#7c3aed', '--p-family': '#475569', '--on-person': '#ffffff' };

export const LOOKS: LookDef[] = [
  { id: 'glass', name: 'Glass', tagline: 'Frosted panels over a photo', swatch: 'linear-gradient(160deg,#8ecbf0,#f3e3c4)', themed: true,
    preview: () => html`<span class="lp-pane"><i></i><i></i><i></i></span>` },
  {
    id: 'fridge', name: 'Fridge door', tagline: 'Sticky notes and magnets', swatch: '#e4eaec',
    fonts: ['Caveat', 'Fredoka'],
    art: { clock: (c) => wallClock(c.now ?? new Date()), timer: (c) => timerFace(c.frac ?? 0, c.size), night: (c) => wallClock(c.now ?? new Date(), c.size ?? 230),
      player: (c) => turntable(c.img, !!c.playing, c.size) },
    preview: () => html`<span class="lp-note"></span><span class="lp-note lp-today"><i></i></span><span class="lp-note"></span>`,
    options: [{ id: 'hand', label: 'Writing on notes and lists', off: 'Print', on: 'Handwriting', onStyle: "font-family:'Caveat','Fredoka',sans-serif;font-size:21px;font-weight:700", hint: 'Print is easier to read from across the room.' }],
    vars: {
      ...PEOPLE,
      '--ink': '#26272b', '--ink2': '#4c4a45', '--ink3': '#66625b', '--ground': '#e4eaec', '--paper': '#ffffff', '--note': '#fff6c4', '--note-today': '#ffe45c',
      '--rule': '#b9d0e6', '--margin': '#f2a7a7', '--magnet': '#fbf8f0', '--danger': '#c62a22',
      '--glass': 'var(--paper)', '--glass-line': 'transparent', '--shadow': '0 5px 8px rgba(0,0,0,.16)',
      '--chip': 'rgba(38,39,43,.07)', '--chip-strong': 'var(--paper)', '--chip-soft': 'rgba(38,39,43,.045)', '--chip-faint': 'rgba(38,39,43,.02)', '--track': 'rgba(38,39,43,.16)',
      '--sel-bg': 'var(--ink)', '--sel-ink': 'var(--paper)', '--sel-ring': 'none', '--primary': '#24408e', '--on-primary': '#ffffff', '--primary-edge': '#162a63', '--accent': '#a85200', '--ok': '#17703d',
      '--timer': '#c62a22', '--timer-face': 'var(--paper)', '--timer-rim': 'var(--ink)',
      '--t-hero': '46px', '--t-title': '42px', '--t-head': '30px', '--t-sub': '26px', '--w-title': '700', '--w-sub': '700', '--w-heavy': '700', '--w-bold': '600', '--w-semi': '500',
      '--font-content': "'Fredoka', sans-serif", '--content-weight': '500', '--content-size': '17px', '--content-size-lg': '21px', '--content-ink': 'var(--ink)', '--bg': 'none'
    },
    evening: {
      '--ground': '#9d927b', '--paper': '#eadfc6', '--note': '#e3d39b', '--note-today': '#e7c651', '--rule': '#cbbe9f', '--margin': '#d6a391', '--magnet': '#e6dcc6',
      '--shadow': '0 5px 8px rgba(0,0,0,.2)'
    }
  },
  {
    id: 'orbit', name: 'Orbit', tagline: 'Dark, calm, built from rings', swatch: '#0a0f1e',
    fonts: ['Outfit'],
    art: { clock: (c) => ringClock(c.arcs ?? [], c.now ?? new Date()), timer: (c) => timerFace(c.frac ?? 0, c.size),
      dayview: (c) => dayDial(c.arcs ?? [], c.now, c.size), night: (c) => ringClock(c.arcs ?? [], c.now ?? new Date(), c.size ?? 250),
      player: (c) => ringPlayer(c.img, c.frac ?? 0, !!c.playing, c.size) },
    preview: () => html`<span class="lp-ring"></span><span class="lp-card"><i></i><i></i><i></i></span>`,
    vars: {
      // same hue per person as every other look, lifted for a dark ground
      '--p-1': '#7cb7ff', '--p-2': '#ff8fb1', '--p-3': '#6ee7c0', '--p-4': '#ff9f6b', '--p-5': '#c9a7ff', '--p-family': '#cbd5e1', '--on-person': '#0a0f1e',
      '--ink': '#e8ecf7', '--ink2': '#b4bcd6', '--ink3': '#98a2c2', '--ground': '#0a0f1e', '--danger': '#ff8a7a',
      '--glass': '#121a31', '--glass-line': 'rgba(255,255,255,.12)', '--shadow': 'none', '--ctl-line': 'rgba(255,255,255,.44)',
      '--chip': 'rgba(255,255,255,.09)', '--chip-strong': 'rgba(255,255,255,.17)', '--chip-soft': 'rgba(255,255,255,.05)', '--chip-faint': 'rgba(255,255,255,.025)', '--track': 'rgba(255,255,255,.28)', '--on-ok': '#0a0f1e',
      // ink-filled = an action; yellow = now / current; mint = done
      '--sel-bg': 'var(--accent)', '--sel-ink': '#0a0f1e', '--sel-ring': 'none', '--primary': '#e8ecf7', '--on-primary': '#0a0f1e', '--accent': '#ffe08a', '--ok': '#6ee7c0',
      '--timer': '#ffe08a', '--timer-face': 'rgba(255,255,255,.06)', '--timer-rim': 'rgba(255,255,255,.44)', '--bg': 'none',
      '--w-title': '400', '--w-sub': '500', '--w-heavy': '600', '--w-bold': '500', '--w-semi': '400'
    }
  }
];

export const lookById = (id: string | null | undefined): LookDef => LOOKS.find((l) => l.id === id) ?? LOOKS[0];
/** A look's drawing for a slot, or nothing. The base calls this without knowing which look is on. */
export const lookArt = (id: LookId, slot: ArtSlot, ctx: ArtCtx): TemplateResult | typeof nothing =>
  lookById(id).art?.[slot]?.(ctx) ?? (slot === 'timer' ? timerFace(ctx.frac ?? 0, ctx.size) : nothing); // every look shows time as a shrinking wedge

/**
 * The picture of a look in the picker. It carries the look's own tokens, so a look that changes its
 * colours changes its preview too; a themed look inherits the current theme from the panel.
 */
export const lookPreview = (l: LookDef, height = 120, theme = ''): TemplateResult => {
  const vars = l.vars ? Object.entries(l.vars).map(([k, v]) => `${k}:${v}`).join(';') : theme;
  return html`<span class="lookprev" data-prev=${l.id} style="height:${height}px;${vars};background:${l.themed ? 'var(--bg) center / cover' : 'var(--ground)'}">
    ${l.art?.clock ? html`<span class="lp-clock">${l.art.clock({ now: new Date(2000, 0, 1, 10, 10), arcs: [] })}</span>` : nothing}${l.preview?.() ?? nothing}
    <span class="lp-people">${[1, 2, 3, 4, 5].map((n) => html`<i style="background:var(--p-${n})"></i>`)}</span></span>`;
};

let current: LookId = 'glass';
const subs = new Set<() => void>();
export const getLook = (): LookId => current;
export const setLook = (id: LookId): void => {
  current = lookById(id).id;
  loadLookFonts(current);
  subs.forEach((f) => f());
};
function loadLookFonts(id: LookId): void { loadFonts(...(lookById(id).fonts ?? [])); }

/** Keeps a component's `data-look` host attribute in step with the chosen look. */
export class LookController implements ReactiveController {
  private _off?: () => void;
  private _shape = (): void => { const s = getShape(); this.host.setAttribute('data-shape', s === 'phone' ? 'tall' : s); this.host.toggleAttribute('data-phone', s === 'phone'); };
  private _on = (): void => { this.host.setAttribute('data-look', current); this._shape(); this.host.requestUpdate(); };
  constructor(private host: ReactiveControllerHost & HTMLElement) { host.addController(this); }
  hostConnected(): void { subs.add(this._on); this._off = onShape(this._on); this.host.setAttribute('data-look', current); this._shape(); }
  hostDisconnected(): void { subs.delete(this._on); this._off?.(); }
}

/* ---------------- look styles (shared by every component) ---------------- */

const FRIDGE = `
  /* materials: paper = content (pinned, slightly tilted) · magnet = navigation · plastic key = input · dashed = "add" */
  @F .fh { font-family: 'Fredoka', 'Trebuchet MS', sans-serif; font-size: 16px; background: var(--ground) radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.5px) 0 0 / 14px 14px; transition: background-color 1.5s ease, color .45s ease; }
  @F .fh::before { display: none; }
  @F .fh:not([data-calm]) { animation: fjig 37s linear infinite; }
  @F .fh[data-opt-hand] { --font-content: 'Caveat', 'Fredoka', sans-serif; --content-weight: 700; --content-size: 24px; --content-size-lg: 27px; }
  @F h1, @F h2 { font-family: 'Caveat', 'Fredoka', sans-serif; letter-spacing: 0; }
  @F h1 { line-height: .95; }
  @F h2 { line-height: 1; }
  @F .display { font-family: 'Fredoka', sans-serif; letter-spacing: 0; font-variant-numeric: tabular-nums; }
  @F .glass { background: var(--glass); -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; border-radius: 4px; box-shadow: var(--shadow); transition: background-color 1.5s ease; }
  @F .glass.round { border-radius: 50%; }
  @F .label { letter-spacing: .05em; font-size: 13px; }
  @F .pill, @F .round { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); font-weight: 500; }
  @F .pill.primary, @F .primary { background: var(--primary); color: var(--on-primary); box-shadow: 0 4px 0 var(--primary-edge); }
  /* the lead action is a chunky plastic push-button; pressing any plastic button sends it down onto its edge */
  @F .lead { font-weight: 600; box-shadow: 0 5px 0 var(--primary-edge), 0 8px 8px rgba(0,0,0,.2); }
  @F .lead:active, @F .primary.tap:active { transform: translateY(calc(3px * var(--m-d, 1))); box-shadow: 0 1px 0 var(--primary-edge); opacity: 1; }
  @F .sheet { border-radius: 4px; }
  /* Ask: answers are notes of paper, the child's own words a card in the pen's blue; the pictures are dashed "add" buttons */
  @F .thread { background: transparent; box-shadow: inset 0 0 0 2px var(--track); border-radius: 6px; }
  @F .bubble { background: var(--note); color: #26272b; border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.16); font-family: var(--font-content, inherit); }
  @F .bubble.asker { background: var(--primary); color: var(--on-primary); border-radius: 3px; }
  @F .starter { background: transparent; border: 2px dashed var(--ink); border-radius: 18px; font-weight: 500; }
  @F .talk { box-shadow: 0 6px 0 var(--primary-edge), 0 9px 9px rgba(0,0,0,.2); }
  @F .talk:active { transform: translateY(calc(4px * var(--m-d, 1))); box-shadow: 0 2px 0 var(--primary-edge); opacity: 1; }

  /* header */
  @F .clock { display: grid; grid-template-columns: auto 1fr; column-gap: 14px; align-items: center; }
  @F .clock .aclock { grid-row: 1 / span 2; filter: drop-shadow(0 3px 4px rgba(0,0,0,.22)); }
  @F .clock .hm { font-weight: 700; font-size: 50px; }
  @F .cap { background: var(--paper); -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.18); rotate: calc(var(--tilt, 1) * -1.2deg); font-weight: 600; }
  @F .cap.hot { background: var(--danger); color: #fff; }
  @F .weather { border-radius: 4px; rotate: calc(var(--tilt, 1) * -1deg); }
  @F .presence { background: transparent; box-shadow: none; gap: 2px; padding: 0 4px; }
  @F .presence { gap: 10px; }
  @F .presence .avatar { background: transparent; color: var(--c); font-weight: 700; font-size: 34px; width: auto; min-width: 26px; height: 44px; border-radius: 0; letter-spacing: -.04em; text-shadow: 0 3px 0 rgba(0,0,0,.18); }
  @F .presence .avatar.away { color: transparent; -webkit-text-stroke: 2px var(--c); opacity: 1; rotate: 14deg; text-shadow: none; }
  @F .right > button.round { background: var(--magnet); color: var(--ink); box-shadow: 0 4px 5px rgba(0,0,0,.28), inset 0 -4px 0 rgba(0,0,0,.14); }
  @F .right > button.round[data-act='night'] { background: #33363b; color: #ffd75a; }

  /* planner: the panel disappears, each day is a sticky note */
  @F .planner { background: transparent; box-shadow: none; padding: 4px 0 0; animation: none; }
  @F .planner h1 { background: linear-gradient(transparent 62%, var(--note-today) 62%, var(--note-today) 92%, transparent 92%); align-self: flex-start; padding: 0 6px 0 2px; }
  @F .seg { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); border-radius: 26px; padding: 4px; }
  @F .seg button { border-radius: 22px; color: var(--ink); font-size: 16px; font-weight: 500; }
  @F .seg button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: none; font-weight: 600; }
  @F .legend { font-size: 15px; font-weight: 500; }
  @F .week { gap: 10px; padding: 4px 4px 8px; }
  @F .col { position: relative; border-radius: 2px; padding: 24px 8px 8px; background: var(--note); box-shadow: 0 6px 8px rgba(0,0,0,.18); rotate: calc(var(--tilt, 1) * -.7deg); transition: background-color 1.5s ease; }
  @F .col:nth-child(even) { rotate: calc(var(--tilt, 1) * .8deg); }
  @F .col:nth-child(3n) { rotate: calc(var(--tilt, 1) * -.3deg); }
  @F .col.today { background: var(--note-today); box-shadow: 0 9px 14px rgba(0,0,0,.24); rotate: calc(var(--tilt, 1) * -1deg); }
  @F .col::before { content: ''; position: absolute; top: 4px; left: 50%; margin-left: -9px; width: 18px; height: 18px; border-radius: 50%; background: #8b949a; box-shadow: 0 2px 3px rgba(0,0,0,.3), inset 0 -3px 0 rgba(0,0,0,.18); }
  @F .col.today::before { background: var(--danger); width: 22px; height: 22px; margin-left: -11px; top: 2px; }
  @F .num { font-weight: 700; }
  @F .today .num { background: var(--ink); color: var(--note-today); }
  @F .ev { background: transparent; border-left: 5px solid var(--c); border-radius: 0; padding: 1px 2px 3px 8px; gap: 1px; }
  @F .ev .t { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
  @F .ev .content { font-family: var(--font-content); font-weight: var(--content-weight); font-size: var(--content-size); line-height: 1.12; color: var(--content-ink); hyphens: none; -webkit-line-clamp: 2; }
  @F .ev .w { font-size: 13px; font-weight: 500; }
  @F .ev.next { box-shadow: none; }
  @F .ev.next .content { background: linear-gradient(transparent 55%, rgba(255,255,255,.75) 55%); }
  @F .more { background: transparent; text-decoration: underline; font-weight: 500; }
  @F .cell { border-radius: 2px; background: var(--note); box-shadow: 0 2px 3px rgba(0,0,0,.12); }
  @F .cell.out { background: color-mix(in srgb, var(--note) 45%, transparent); box-shadow: none; }
  @F .cell.today { background: var(--note-today); box-shadow: 0 0 0 2.5px var(--ink); }
  @F .dayrow { background: var(--note); border-left-width: 10px; border-radius: 2px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .dayrow .content { font-family: var(--font-content); font-weight: var(--content-weight); }

  /* side cards */
  @F .np { background: #2f2a26; border-radius: 10px; --ink: #fff; --ink2: #e2dbcf; color: #fff; box-shadow: 0 5px 8px rgba(0,0,0,.25); }
  @F .np .np-row { background: #fff6dc; color: #26272b; --ink2: #4c4a45; border-radius: 4px; padding: 6px 10px; }
  @F .np .primary { background: var(--paper); color: #26272b; box-shadow: 0 4px 0 #b9b2a2; }
  @F .art { border-radius: 50%; width: 46px; height: 46px; background: conic-gradient(#ede6d6 0 8%, #141210 8% 10%, #ede6d6 10% 33%, #141210 33% 35%, #ede6d6 35% 58%, #141210 58% 60%, #ede6d6 60% 83%, #141210 83% 85%, #ede6d6 85%); box-shadow: inset 0 0 0 5px #141210; }
  @F .playing .art { animation: fhSpin 4s linear infinite; animation-iteration-count: var(--loops, infinite); }
  @F .timerrow { align-items: center; }
  @F .timerrow.on .hint { display: none; }
  @F .quick { background: transparent; border: 2px dashed var(--ink); border-radius: 22px; min-height: 44px; font-size: 16px; font-weight: 500; }
  @F .rem { font-weight: 500; font-size: 16px; line-height: 1.15; }
  @F .rem .check { width: 20px; height: 20px; border-width: 2px; }
  @F .meter { border: 2px solid var(--ink); background: var(--paper); height: 12px; border-radius: 8px; }
  @F .meter > div { background: #f5b301; border-radius: 0; }

  /* dock: a row of fridge magnets */
  @F .dock { background: transparent; box-shadow: none; gap: 8px; padding: 0; animation: none; }
  @F .dock .item { font-weight: 600; font-size: 14px; height: 78px; gap: 3px; border-radius: 0; }
  @F .dock .item svg.i { width: 52px; height: 52px; padding: 13px; border-radius: 50%; background: var(--magnet); color: var(--ink); stroke-width: 2; box-shadow: 0 4px 5px rgba(0,0,0,.28), inset 0 -4px 0 rgba(0,0,0,.14); }
  @F .dock .item[data-nav='lights-on'] svg.i { background: #ffd75a; }
  @F .dock .item[data-nav='lights-off'] svg.i { background: #4a4f55; color: #fff; }
  @F .dock .item[data-nav='dinner'] svg.i { background: var(--danger); color: #fff; }
  @F .dock .item[aria-current='page'] { background: transparent; }
  @F .dock .item[aria-current='page'] svg.i { background: var(--ink); color: var(--paper); box-shadow: 0 0 0 4px var(--paper), 0 0 0 6.5px var(--ink), 0 6px 6px 4px rgba(0,0,0,.2); }
  @F .dock .kidbtn .avatar { box-shadow: 0 4px 5px rgba(0,0,0,.28); }
  @F .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @F .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 4px var(--paper), 0 0 0 6.5px var(--kidc), 0 6px 6px 4px rgba(0,0,0,.2); }
  @F .dock .sep { background: transparent; margin: 0 2px; }
  @F .tcard { border-radius: 4px; }

  /* lists: lined paper, a tick box you could draw, print by default */
  @F .row { background: transparent; border-radius: 0; border-bottom: 1.5px solid var(--rule); min-height: 52px; padding-top: 6px; padding-bottom: 6px; }
  @F .check { width: 32px; height: 32px; border-radius: 5px 9px 6px 10px; border: 2.5px solid var(--ink); background: var(--paper); }
  @F .done .check { background: var(--paper); border-color: var(--ink); color: var(--ok); transform: none; font-size: 34px; font-weight: 700; overflow: visible; }
  @F .done .check svg { width: 28px; height: 28px; stroke-width: 4; }
  @F .row .content { font-family: var(--font-content); font-weight: var(--content-weight); font-size: var(--content-size-lg); line-height: 1.1; }
  @F .row.now { background: linear-gradient(90deg, transparent 0 46px, var(--note) 46px); }
  @F .big .check { width: 48px; height: 48px; }
  @F .big.done .check { font-size: 50px; }
  @F .row.big .content { font-size: 30px; }
  @F .row.big { background: var(--note); padding-left: 12px; }
  @F .field { background: transparent; box-shadow: none; border-bottom: 3px dashed var(--ink); border-radius: 0; font-weight: 600; font-size: 28px; padding: 0 6px; }
  @F .key { font-weight: 600; background: #f7f4ec; color: #26272b; border-radius: 8px 8px 14px 14px; box-shadow: 0 4px 0 #b9b2a2, 0 6px 6px rgba(0,0,0,.2); }
  @F .key:active { transform: translateY(3px); box-shadow: 0 1px 0 #b9b2a2; background: #f7f4ec; }
  @F .tab { font-weight: 600; }

  /* kid page */
  @F .hero { overflow: visible; rotate: calc(var(--tilt, 1) * -.6deg); }
  @F .hero::before { inset: -10px auto auto 50%; width: 96px; height: 24px; margin-left: -48px; background: color-mix(in srgb, var(--kid) 50%, #fff); opacity: .85; transform: rotate(-3deg); }
  @F .name { font-family: 'Caveat', 'Fredoka', sans-serif; font-size: 46px; color: color-mix(in srgb, var(--kid) 72%, #000); }
  @F .rank { font-weight: 600; background: color-mix(in srgb, var(--kid) 72%, #000); }
  @F .stat { background: var(--chip-soft); border-radius: 8px; }
  @F .stat b { font-family: 'Fredoka', sans-serif; font-weight: 700; }
  @F .stat span { font-weight: 500; font-size: 14px; }
  @F .dots i.g { background: #f5b301; border-color: #8a5f00; }
  @F .nextup { background: var(--chip-soft); border-radius: 8px; }
  @F .jobs { background: linear-gradient(90deg, transparent 0 69px, var(--margin) 69px 71px, transparent 71px) 0 86px / 100% 100% no-repeat, var(--glass); }
  @F .sec h2 { font-size: 30px; line-height: 1; padding: 0 4px; }
  @F .sec span { font-weight: 500; font-size: 14px; }
  @F .plus { font-weight: 600; }
  @F .play { box-shadow: 0 3px 0 var(--primary-edge); }
  @F .later { background: var(--chip-soft); border-radius: 8px; font-weight: 500; }
  @F .side { border-radius: 0; overflow: visible; padding: 2px 4px; }
  @F .side > .card { rotate: calc(var(--tilt, 1) * .6deg); }
  @F .tabs { background: transparent; border-radius: 0; padding: 0; }
  @F .rw { background: var(--chip-soft); border-radius: 8px; }
  @F .rw .n { font-weight: 500; font-size: 16px; }
  @F .rw button { font-weight: 600; background: #f5b301; color: #26272b; box-shadow: 0 3px 0 #a87400; }
  @F .rw button.save { background: var(--chip); color: var(--ink2); box-shadow: none; }
  @F .pic { border-radius: 3px; background: var(--paper); box-shadow: 0 4px 6px rgba(0,0,0,.16); rotate: calc(var(--tilt, 1) * -1deg); }
  @F .pic:nth-child(even) { rotate: calc(var(--tilt, 1) * 1.2deg); }
  @F .pic.done { background: color-mix(in srgb, var(--ok) 24%, var(--paper)); }
  @F .wk { font-size: 15px; }

  /* groceries: a shopping-list pad and chunky keys */
  @F .list.glass { background: linear-gradient(90deg, transparent 0 63px, var(--margin) 63px 65px, transparent 65px) 0 66px / 100% 100% no-repeat, var(--glass); rotate: calc(var(--tilt, 1) * -.5deg); }
  @F .items { gap: 0; }
  /* lists that have tightened to fit keep their ruled lines, just closer together */
  @F .items[data-fit] .row { min-height: 38px; padding-top: 2px; padding-bottom: 2px; }
  @F .items[data-fit] .row .content { font-size: 17px; }
  @F .items[data-fit] .check { width: 24px; height: 24px; }
  @F .jobs [data-fit] .row { min-height: 44px; padding-top: 3px; padding-bottom: 3px; }
  @F .jobs [data-fit] .row .content { font-size: 18px; }
  @F .tag { font-weight: 600; font-size: 12px; }
  @F .who.glass { border-radius: 4px; }

  /* music: the player is a dark deck */
  @F .stage { background: #2f2a26; color: #fff; border-radius: 10px; box-shadow: 0 5px 8px rgba(0,0,0,.25); }
  @F .stage .glass { background: transparent; }
  @F .spk { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .spk.focus { background: var(--note-today); box-shadow: 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.2); }
  @F .spk.inmix { background: var(--note); box-shadow: 0 0 0 3px var(--ok); }
  @F .mroom { background: var(--paper); border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.14); }
  @F .mstairs { border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink); }
  @F .mzone[data-focus] { background: var(--note); box-shadow: inset 0 0 0 3px var(--ink); }
  @F .pool { background: repeating-linear-gradient(115deg, transparent 0 8px, color-mix(in srgb, var(--c) 34%, transparent) 8px 10px), color-mix(in srgb, var(--c) 30%, var(--paper)); }
  @F .mzone[data-playing] .pool { animation: scribble .7s steps(2, jump-none) infinite; animation-iteration-count: var(--loops, infinite); }
  @F .puck { border-color: var(--magnet); box-shadow: 0 4px 0 #b9b2a2, 0 6px 8px rgba(0,0,0,.25); }
  @F .mshelf { background: var(--note); border-radius: 4px; transform: rotate(.5deg); box-shadow: 0 5px 8px rgba(0,0,0,.16); }
  @F .wholeh { border-radius: 6px; border-color: var(--ink2); }
  @F .viewbtn { border-radius: 6px; background: var(--magnet); box-shadow: 0 3px 0 #b9b2a2, 0 4px 5px rgba(0,0,0,.18); }
  @F .vcard { border-radius: 4px; background: var(--note); box-shadow: 0 3px 5px rgba(0,0,0,.16); }
  @F .vcard[aria-pressed='true'] { background: var(--sel-bg); }
  @F .dplate { fill: var(--paper); stroke: var(--ink); stroke-width: 3; }
  @F .dtrack { stroke: color-mix(in srgb, var(--ink) 16%, var(--paper)); }
  @F .dknob { fill: var(--magnet); stroke: var(--ink); }
  @F .dcover { box-shadow: 0 0 0 4px var(--ink), 0 6px 0 rgba(0,0,0,.18); }
  @F .dcard { background: var(--note); border-radius: 3px; box-shadow: 0 5px 8px rgba(0,0,0,.16); }
  @F .tuner { background: var(--paper); border-radius: 6px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.14); }
  @F .desk { background: var(--paper); border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.14); }
  @F .strip[data-focus] { background: var(--note); }
  @F .sname { background: var(--note); border-radius: 2px; box-shadow: 0 2px 3px rgba(0,0,0,.18); font-family: var(--font-content); }
  @F .lamp { box-shadow: 0 3px 0 rgba(0,0,0,.3); }
  @F .fcap { border-radius: 4px; box-shadow: inset 0 0 0 2px var(--ink), 0 3px 0 rgba(0,0,0,.3); }
  @F .slot { background: var(--ink); width: 4px; left: 20px; }
  @F .jog { background: var(--magnet); box-shadow: inset 0 0 0 3px var(--ink), 0 6px 0 #b9b2a2; }
  @F .mpad { border-radius: 8px; box-shadow: inset 0 0 0 3px var(--ink), 0 6px 0 rgba(0,0,0,.28); }
  @F .dart { border-radius: 4px; box-shadow: 0 0 0 3px var(--ink), 0 5px 6px rgba(0,0,0,.2); }
  @F .cab { background: #2f2a26; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,.25); }
  @F .sock { background: var(--magnet); box-shadow: inset 0 0 0 3px var(--ink); }
  @F .sock[aria-pressed='true'] { background: var(--c); }
  @F .cdisc { box-shadow: 0 0 0 3px var(--ink), 0 6px 0 rgba(0,0,0,.2); }
  @F .cbox { background-color: #d9b98a; border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.2); }
  @F .ttable { background: var(--paper); border-radius: 6px; box-shadow: inset 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.16); }
  @F .tkey { border-radius: 8px; background: var(--magnet); box-shadow: 0 6px 0 #b9b2a2, 0 8px 8px rgba(0,0,0,.2); }
  @F .tkey[data-go] { background: var(--primary); color: var(--on-primary); box-shadow: 0 6px 0 var(--primary-edge), 0 8px 8px rgba(0,0,0,.2); }
  @F .ctab { border-radius: 4px 4px 0 0; }
  @F .vscene { background: var(--paper); border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.14); }
  @F .aname { background: var(--note); border-radius: 3px; box-shadow: 0 2px 3px rgba(0,0,0,.18); }
  @F .join { background: var(--magnet); box-shadow: 0 3px 0 #b9b2a2, 0 4px 5px rgba(0,0,0,.18); }
  @F .join[aria-pressed='true'] { background: var(--ok); color: #fff; box-shadow: 0 3px 0 #0d4a27; }
  @F .hit { background: transparent; border-radius: 0; border-bottom: 1.5px solid var(--rule); }
  @F .hit[aria-pressed='true'] { background: var(--note-today); box-shadow: none; border-bottom-color: var(--ink); }
  @F .st { background: #fff; border-radius: 2px; box-shadow: 0 5px 8px rgba(0,0,0,.22); font-family: var(--font-content); font-weight: var(--content-weight); color: #26272b; }
  @F .pickrow { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .banner { background: var(--note-today); border-radius: 2px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }

  /* home: every room is a note; a room with a light on is the bright one */
  @F .room { background: var(--note); border-radius: 2px; box-shadow: 0 4px 6px rgba(0,0,0,.16); rotate: calc(var(--tilt, 1) * -.5deg); }
  @F .room.lit { background: var(--note-today); box-shadow: 0 7px 10px rgba(0,0,0,.2); rotate: calc(var(--tilt, 1) * .5deg); }
  @F .rh h2 { font-size: 28px; line-height: 1; }
  @F .dev { background: transparent; border-radius: 0; border-bottom: 1.5px solid color-mix(in srgb, var(--ink) 18%, transparent); padding-left: 2px; padding-right: 2px; }
  @F .dicon { background: var(--magnet); color: var(--ink); box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 -2px 0 rgba(0,0,0,.12); }
  @F .dev.on .dicon { background: #ffd23f; color: #5b3a00; box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 -2px 0 rgba(0,0,0,.14), 0 0 0 4px rgba(255,210,63,.4); }
  @F .toggle { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); }
  @F .toggle[aria-checked='true'] { background: var(--ok); }
  @F .scene { background: var(--magnet); border-radius: 10px; box-shadow: 0 4px 0 #b9b2a2, 0 6px 6px rgba(0,0,0,.18); font-weight: 600; }

  /* doodle: paint-pot magnets, and finished pictures taped up as polaroids */
  @F .pad { border-radius: 2px; }
  @F .ink { box-shadow: 0 3px 0 rgba(0,0,0,.22), inset 0 -3px 0 rgba(0,0,0,.14); }
  @F .ink[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--paper), 0 0 0 6px var(--ink); }
  @F .gallery { background: transparent; box-shadow: none; padding: 8px 2px; }
  @F .snaps { gap: 26px 12px; padding: 12px 6px; }
  @F .snap { aspect-ratio: auto; height: 108px; border-radius: 2px; border: 7px solid #fff; border-bottom-width: 26px; background-color: #fff; box-shadow: 0 5px 8px rgba(0,0,0,.26); }
  @F .snap::before { top: -16px; width: 46px; height: 16px; margin-left: -23px; border-radius: 1px; background: color-mix(in srgb, var(--note-today) 82%, transparent); box-shadow: 0 1px 2px rgba(0,0,0,.12); rotate: -4deg; }
  @F .by { left: 0; right: 0; bottom: -25px; padding: 0; background: transparent; border-radius: 0; font-family: 'Caveat', 'Fredoka', sans-serif; font-size: 18px; font-weight: 700; line-height: 1.2; text-align: center; color: #26272b; }

  /* avatar studio: the mirror is a taped photo, the shelf is a sheet of stickers */
  @F .mirror { overflow: visible; rotate: calc(var(--tilt, 1) * -.5deg); }
  @F .mirror::before { inset: -10px auto auto 50%; width: 96px; height: 24px; margin-left: -48px; background: color-mix(in srgb, var(--kid) 50%, #fff); opacity: .85; transform: rotate(-3deg); }
  @F .tile { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.16); font-weight: 500; }
  @F .tile[aria-pressed='true'] { background: var(--note-today); box-shadow: 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.2); }

  /* morning board: one note per child under a magnet in their colour */
  @F .kcol { position: relative; overflow: visible; border-top: 0; border-radius: 2px; padding-top: 30px; background: var(--note); box-shadow: 0 6px 8px rgba(0,0,0,.18); }
  @F .kcol::before { content: ''; position: absolute; top: 6px; left: 50%; margin-left: -11px; width: 22px; height: 22px; border-radius: 50%; background: var(--kid); box-shadow: 0 2px 3px rgba(0,0,0,.3), inset 0 -3px 0 rgba(0,0,0,.18); }
  @F .khead h2 { font-size: 36px; }
  @F .nextstep { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.14); font-weight: 600; }
  @F .nextstep.set { background: color-mix(in srgb, var(--ok) 22%, var(--paper)); }
  @F .lchip { background: transparent; border-radius: 0; border-bottom: 2px dashed var(--ink); padding-left: 2px; padding-right: 2px; font-weight: 600; }
  @F .lchip.soon, @F .lchip.now { background: var(--note-today); border-radius: 3px; border-bottom-color: transparent; padding-left: 10px; padding-right: 10px; }
  @F .leave { font-family: 'Fredoka', sans-serif; font-weight: 700; }

  /* night: the kitchen clock keeps watch */
  @F .night .big { font-weight: 400; }
  /* weather: today is a note under a magnet, the week is a strip torn off a calendar, the maps are a photo taped to the door */
  @F .wnow, @F .wweek, @F .whours, @F .wmaps { background: var(--note, var(--paper)); border-radius: 3px; box-shadow: 0 6px 8px rgba(0,0,0,.18); }
  @F .wnow { rotate: calc(var(--tilt, 1) * -.6deg); }
  @F .wweek { rotate: calc(var(--tilt, 1) * .5deg); background: var(--paper); }
  @F .wmaps { background: #fff; padding: 12px 12px 8px; }
  @F .wmaps .mbox { border-radius: 2px; }
  @F .wtemp { font-family: 'Caveat', 'Fredoka', sans-serif; font-size: 86px; font-weight: 700; }
  @F .wtip { background: transparent; box-shadow: inset 0 0 0 2px var(--ink); border-radius: 3px 14px 3px 12px; font-family: 'Caveat', 'Fredoka', sans-serif; font-size: 21px; font-weight: 700; line-height: 1.1; }
  @F .wfact { background: transparent; border-radius: 0; border-bottom: 2px dashed color-mix(in srgb, var(--ink) 28%, transparent); padding: 4px 2px 6px; }
  @F .wday { border-radius: 0; border-bottom: 2px dashed color-mix(in srgb, var(--ink) 22%, transparent); }
  @F .wday.today { background: transparent; box-shadow: inset 0 0 0 2.5px var(--primary); border-radius: 14px 18px 12px 20px; rotate: calc(var(--tilt, 1) * -.6deg); border-bottom-color: transparent; }
  @F .wbar { border-radius: 2px; box-shadow: 0 0 0 1.5px var(--ink); }
  @F .wwarn { border-radius: 3px; rotate: calc(var(--tilt, 1) * 1deg); }
  @F .sky .cloud { stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
  @F .sky .disc, @F .sky .moon, @F .sky .bolt { stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
  @F .sky .rays, @F .sky .drop { stroke-width: 4; }
  @F .hchart .line { stroke-dasharray: 1 7; stroke-width: 4.5; }
`;

const ORBIT = `
  /* a ring always means time or progress · ink-filled = an action · yellow = now · mint = done */
  @O .fh { font-family: 'Outfit', 'Avenir Next', 'Segoe UI', sans-serif; font-weight: 400; background: var(--ground) repeating-radial-gradient(circle at 62px 68px, transparent 0 89px, rgba(255,255,255,.04) 89px 90px); }
  @O .fh::before { display: none; }
  /* a touch lights the line instead of shrinking the control; the lead action is a full moon with a halo */
  @O .tap:active { transform: none; opacity: 1; box-shadow: inset 0 0 0 2px var(--accent); }
  @O .lead { font-weight: 600; box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 22%, transparent); }
  @O .lead:active { transform: scale(calc(1 - .02 * var(--m-d, 1))); box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 22%, transparent); }
  @O h1, @O h2, @O .display { font-family: 'Outfit', sans-serif; letter-spacing: -.01em; }
  @O .glass { -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: none; }
  @O .label { font-weight: 500; letter-spacing: 0; text-transform: none; font-size: 14px; }
  @O .pill, @O .round { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); font-weight: 500; }
  @O .pill.primary, @O .primary { background: var(--primary); color: var(--on-primary); box-shadow: none; font-weight: 600; }
  @O .toast { background: var(--primary); color: var(--on-primary); font-weight: 500; }
  @O .sheet { background: #172039; }
  /* Ask: line-drawn bubbles; the child's own words are ink-filled; the microphone is a full moon with a halo */
  @O .thread { background: transparent; box-shadow: inset 0 0 0 1.5px var(--glass-line); }
  @O .bubble { background: var(--chip); box-shadow: inset 0 0 0 1.5px var(--ctl-line); font-weight: 400; }
  @O .bubble.asker { background: var(--primary); color: var(--on-primary); box-shadow: none; font-weight: 500; }
  @O .starter { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); font-weight: 500; }
  @O .talk { box-shadow: 0 0 0 6px color-mix(in srgb, var(--primary) 22%, transparent); }
  @O .scrim { background: rgba(3,5,12,.66); }

  /* header */
  @O .clock { display: grid; grid-template-columns: auto 1fr; column-gap: 14px; align-items: center; }
  @O .clock .dial { grid-row: 1 / span 2; }
  @O .clock .hm { font-weight: 400; font-size: 56px; letter-spacing: -.02em; }
  @O .cap { background: var(--glass); -webkit-backdrop-filter: none; backdrop-filter: none; font-weight: 500; }
  @O .cap.hot { background: var(--danger); color: #0a0f1e; border-color: var(--danger); }
  @O .badge { background: rgba(255,224,138,.18); font-weight: 600; }
  @O .presence { background: transparent; border-color: transparent; }
  @O .presence .avatar.away { background: transparent; color: var(--ink2); box-shadow: inset 0 0 0 1.5px var(--ctl-line); opacity: 1; }
  @O .right > button.round { background: transparent; }

  /* planner */
  @O .planner { background: transparent; border-color: transparent; padding: 6px 0 0; }
  @O .seg { border-radius: 999px; padding: 4px; background: rgba(255,255,255,.07); }
  @O .seg button { border-radius: 999px; font-weight: 400; color: var(--ink); }
  @O .seg button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: none; font-weight: 600; }
  @O .legend { font-weight: 400; }
  @O .col { background: var(--glass); border: 1px solid var(--glass-line); border-radius: 22px; padding: 10px 8px; }
  @O .col.today { background: color-mix(in srgb, var(--accent) 13%, var(--glass)); border: 2px solid var(--accent); }
  @O .dayhead { padding: 2px 4px 6px 6px; }
  @O .num { font-weight: 400; font-size: 22px; }
  @O .today .num { background: var(--accent); color: #0a0f1e; font-weight: 600; }
  @O .ev { background: color-mix(in srgb, var(--c) 15%, transparent); border-left: 4px solid var(--c); border-radius: 10px; padding: 8px 9px 8px 10px; }
  @O .ev .t { font-weight: 500; }
  @O .ev .content { font-weight: 500; }
  @O .ev .w { font-weight: 400; font-size: 13px; }
  @O .ev.next { box-shadow: 0 0 0 1.5px var(--accent); }
  @O .more { background: transparent; font-weight: 500; }
  @O .cell { border-radius: 14px; border: 1px solid var(--glass-line); background: var(--glass); }
  @O .cell.out { background: transparent; }
  @O .cell.today { background: color-mix(in srgb, var(--accent) 13%, var(--glass)); border: 2px solid var(--accent); }
  @O .dayrow { border-left-width: 4px; border-radius: 12px; }

  /* side cards */
  @O .art { border-radius: 50%; background: radial-gradient(circle, #05070f 0 5%, #7cb7ff 6% 30%, #05070f 31% 44%, #1a2036 45% 46%, #05070f 47% 62%, #1a2036 63% 64%, #05070f 65% 82%, #1a2036 83% 84%, #05070f 85%); box-shadow: 0 0 0 1px rgba(255,255,255,.3); }
  @O .playing .art { animation: fhSpin 6s linear infinite; animation-iteration-count: var(--loops, infinite); }
  @O .timerrow { align-items: center; gap: 12px; }
  @O .timerrow.on .hint { display: none; }
  @O .quick { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); border-radius: 999px; font-weight: 500; min-height: 44px; }
  @O .rem { font-weight: 400; }
  @O .meter { height: 6px; }
  @O .meter > div { background: var(--ok); }

  /* dock: a line of rings */
  @O .dock { background: transparent; border-color: transparent; gap: 6px; padding: 0; }
  @O .dock .item { font-size: 13px; font-weight: 500; color: var(--ink); height: 78px; gap: 5px; border-radius: 0; }
  @O .dock .item svg.i { width: 52px; height: 52px; padding: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--ctl-line); color: var(--ink); stroke-width: 1.6; }
  @O .dock .item[aria-current='page'] { background: transparent; color: var(--ink); font-weight: 600; }
  @O .dock .item[aria-current='page'] svg.i { background: var(--accent); color: #0a0f1e; box-shadow: none; }
  @O .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @O .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 3px #0a0f1e, 0 0 0 6px var(--kidc); }
  @O .dock .sep { background: rgba(255,255,255,.18); }

  /* lists */
  @O .row { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.14); }
  @O .check { border-width: 2.5px; border-color: var(--ink2); }
  @O .done .check { background: var(--ok); border-color: var(--ok); color: #0a0f1e; }
  @O .row .content { font-weight: 400; }
  @O .row.now { background: color-mix(in srgb, var(--accent) 9%, transparent); border-radius: 14px; }
  @O .row.big { background: color-mix(in srgb, var(--accent) 12%, transparent); border-radius: 22px; border-bottom: 0; }
  @O .field { background: transparent; box-shadow: none; border-bottom: 2px solid var(--ctl-line); border-radius: 0; font-weight: 400; font-size: 28px; padding: 0 4px; }
  @O .key { background: var(--chip); box-shadow: inset 0 0 0 1.5px var(--ctl-line); border-radius: 999px; font-weight: 400; }
  @O .key:active { background: var(--chip-strong); }
  @O .tabs { background: rgba(255,255,255,.07); }
  @O .tab { font-weight: 500; }
  @O .tab[aria-pressed='true'] { font-weight: 600; }

  /* kid page */
  @O .hero::before { inset: 0; height: auto; background: repeating-radial-gradient(circle at 50% 26%, transparent 0 43px, color-mix(in srgb, var(--kid) 34%, transparent) 43px 44px); -webkit-mask-image: radial-gradient(circle at 50% 26%, #000 22%, transparent 70%); mask-image: radial-gradient(circle at 50% 26%, #000 22%, transparent 70%); }
  @O .name { font-weight: 500; font-size: 38px; }
  @O .rank { background: color-mix(in srgb, var(--kid) 20%, transparent); color: var(--kid); font-weight: 600; }
  @O .stat { background: var(--chip-soft); }
  @O .stat b { font-family: 'Outfit', sans-serif; font-weight: 400; font-size: 34px; }
  @O .stat span { font-weight: 400; }
  @O .dots i.t { box-shadow: 0 0 0 2px #121a31, 0 0 0 4px var(--kid); }
  @O .nextup { background: var(--chip-soft); }
  @O .jobs .check { border-color: var(--kid); }
  @O .jobs .done .check { border-color: var(--ok); }
  @O .sec { margin-top: 12px; }
  @O .sec h2 { font-size: 17px; font-weight: 600; color: var(--kid); }
  @O .sec span { font-weight: 400; }
  @O .plus { background: color-mix(in srgb, var(--kid) 20%, transparent); color: var(--kid); font-weight: 600; }
  @O .later { background: var(--chip-soft); font-weight: 400; }
  @O .rw { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.14); padding-left: 2px; }
  @O .rw .n { font-weight: 400; }
  @O .rw button { font-weight: 600; }
  @O .rw button.save { background: var(--chip); color: var(--ink2); }
  @O .pic { background: var(--chip-soft); border: 2px solid color-mix(in srgb, var(--kid) 65%, transparent); border-radius: 28px; }
  @O .pic.done { background: color-mix(in srgb, var(--ok) 24%, transparent); border-color: var(--ok); }

  /* groceries */
  @O .items { gap: 0; }
  @O .jobs [data-fit] .row { min-height: 44px; padding-top: 3px; padding-bottom: 3px; }
  @O .tag { font-weight: 600; }
  @O .who.glass { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }

  /* home: rooms are outlined cells; a room with a light on carries the 'now' yellow */
  @O .room { background: transparent; border-radius: 26px; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .room.lit { background: color-mix(in srgb, var(--accent) 7%, transparent); box-shadow: inset 0 0 0 1.5px var(--accent); }
  @O .rh h2 { font-size: 20px; font-weight: 500; }
  @O .dev { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.12); padding-left: 2px; padding-right: 2px; }
  @O .dicon { background: transparent; color: var(--ink2); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .dev.on .dicon { background: var(--accent); color: #0a0f1e; box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) 22%, transparent); }
  @O .toggle { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .toggle[aria-checked='true'] { background: var(--ok); box-shadow: none; }
  @O .scene { background: transparent; border-radius: 20px; box-shadow: inset 0 0 0 1.5px var(--ctl-line); font-weight: 500; }

  /* doodle: the paper stays bright, the gallery is a row of framed portholes */
  @O .pad { border-radius: 24px; }
  @O .ink { box-shadow: none; }
  @O .ink[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--ground), 0 0 0 5px var(--ink); }
  @O .snap { border-radius: 18px; box-shadow: 0 0 0 1.5px var(--ctl-line); }
  @O .snap:nth-child(odd), @O .snap:nth-child(even) { transform: none; }
  @O .snap::before { display: none; }
  @O .by { background: var(--ground); color: var(--ink); box-shadow: inset 0 0 0 1px var(--ctl-line); font-weight: 500; }

  /* avatar studio */
  @O .tile { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); font-weight: 400; }
  @O .tile[aria-pressed='true'] { background: color-mix(in srgb, var(--accent) 9%, transparent); box-shadow: inset 0 0 0 2px var(--accent); }

  /* morning board */
  @O .kcol { border-top: 0; box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--kid) 60%, transparent); }
  @O .khead h2 { font-weight: 500; }
  @O .nextstep { background: color-mix(in srgb, var(--accent) 9%, transparent); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent); font-weight: 500; }
  @O .nextstep.set { background: color-mix(in srgb, var(--ok) 11%, transparent); box-shadow: inset 0 0 0 1.5px var(--ok); }
  @O .lchip { background: transparent; border-radius: 999px; box-shadow: inset 0 0 0 1px var(--glass-line); padding-left: 14px; padding-right: 14px; font-weight: 500; }
  @O .lchip.soon, @O .lchip.now { background: transparent; color: var(--accent); box-shadow: inset 0 0 0 1.5px var(--accent); }
  @O .leave { font-family: 'Outfit', sans-serif; font-weight: 400; }

  /* music: rooms are cells on the ring; the one you control carries the 'now' yellow */
  @O .spk { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .spk.focus { background: color-mix(in srgb, var(--accent) 8%, transparent); box-shadow: inset 0 0 0 2px var(--accent); }
  @O .spk.inmix { box-shadow: inset 0 0 0 2px var(--ok); }
  @O .mroom { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .mstairs { box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .mzone { --stream: var(--accent); }
  @O .mzone[data-focus] { box-shadow: inset 0 0 0 2px var(--accent); }
  @O .pool { background: color-mix(in srgb, var(--c) 20%, transparent); border-top: 2px solid var(--c); }
  @O .pool::before { display: none; }
  @O .mzone[data-playing] .pool { animation: breathe 3.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @O .puck { border: 1.5px solid var(--ink); box-shadow: none; }
  @O .mshelf { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .wholeh { border-width: 1.5px; border-color: var(--ctl-line); }
  @O .viewbtn { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .vcard { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .vcard[aria-pressed='true'] { background: var(--sel-bg); }
  @O .dplate { fill: transparent; stroke: var(--glass-line); stroke-width: 1.5; }
  @O .bigdial, @O .desk, @O .rig, @O .vscene { --stream: var(--accent); }
  @O .dtrack { stroke: rgba(255,255,255,.14); stroke-width: 10; }
  @O .dknob { fill: var(--ground); stroke-width: 3; }
  @O .dcover { box-shadow: 0 0 0 1.5px var(--ink); }
  @O .dcard, @O .tuner { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .desk { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .sname { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); font-weight: 500; }
  @O .lamp { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .lamp[aria-pressed='true'] { background: var(--ok); color: #0a0f1e; box-shadow: none; }
  @O .strip[data-live] .fcap { background: var(--c); box-shadow: none; }
  @O .fcap { background: var(--ground); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .slot { width: 2px; left: 21px; }
  @O .jog { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .mpad { box-shadow: none; }
  @O .cab { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .sock { background: var(--ground); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .sock[aria-pressed='true'] { background: var(--c); box-shadow: none; }
  @O .cdisc { box-shadow: 0 0 0 1.5px var(--ink); }
  @O .cbox { background-color: var(--glass); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .ttable { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .tkey { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .tkey[data-go] { background: var(--primary); color: var(--on-primary); box-shadow: none; }
  @O .vscene { box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .aname { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .join { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .join[aria-pressed='true'] { background: var(--ok); color: #0a0f1e; box-shadow: none; }
  @O .hit { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.12); }
  @O .hit[aria-pressed='true'] { background: color-mix(in srgb, var(--accent) 10%, transparent); box-shadow: none; border-radius: 12px; }
  @O .st { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); font-weight: 500; }
  @O .pickrow { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .banner { background: color-mix(in srgb, var(--accent) 12%, transparent); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent); }

  /* day view: the day as a dial, the list beside it */
  @O .dayview { gap: 28px; }
  @O .dayart { padding: 0 14px; }

  /* night: only the dial and the time */
  @O .night .big { font-weight: 300; }
  /* weather: instruments. The sky is drawn in line, temperature is a trace, the week is a set of gauges */
  @O .wtemp { font-weight: 300; font-size: 76px; letter-spacing: -.04em; }
  @O .wtip { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); border-radius: 999px; padding: 10px 16px; font-weight: 500; }
  @O .wfact { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); border-radius: 14px; }
  @O .wday.today { background: transparent; box-shadow: inset 0 0 0 1.5px var(--accent); }
  @O .wbar { box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 45%, transparent); }
  @O .wwarn { background: transparent; color: var(--danger); box-shadow: inset 0 0 0 2px var(--danger); }
  @O .wcomp circle { stroke: var(--accent); opacity: .8; stroke-dasharray: 2 5; }
  @O .sky .cloud { fill: none; stroke: var(--ink); stroke-width: 2.5; }
  @O .sky .disc, @O .sky .moon { fill: none; stroke: var(--accent); stroke-width: 2.5; }
  @O .sky .rays { stroke: var(--accent); stroke-width: 2.5; }
  @O .sky .bolt { fill: none; stroke: var(--accent); stroke-width: 2; }
  @O .hchart .area { opacity: .08; }
  @O .hchart .line { stroke-width: 2; }
  @O .mbox { border-radius: 14px; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
`;

const KEYFRAMES = `
  /* the fridge door gets a bump now and then: every note jiggles on its pin (needs --tilt registered as a number, see ambient.ts) */
  @keyframes fjig { 0%, 93%, 100% { --tilt: 1; } 94.5% { --tilt: 2.3; } 96% { --tilt: -.2; } 97.5% { --tilt: 1.6; } 99% { --tilt: .7; } }
  @keyframes fhSpin { to { transform: rotate(360deg); } }
  .vinyl .spin { transform-box: fill-box; transform-origin: center; animation: fhSpin 5s linear infinite; animation-iteration-count: var(--loops, infinite); }
  .vinyl, .pring { max-width: 100%; max-height: 100%; height: auto; }
`;

/* The look picker's little pictures. They are built from each look's tokens, never from fixed colours. */
const PREVIEW = `
  .lookprev { position: relative; display: flex; align-items: center; justify-content: center; gap: 9px; border-radius: 16px; overflow: hidden; padding: 10px; color: var(--ink); }
  .lookprev .lp-clock { position: absolute; top: 8px; right: 10px; line-height: 0; }
  .lookprev .lp-clock svg { width: 30px; height: 30px; }
  .lookprev .lp-people { position: absolute; left: 10px; bottom: 8px; display: flex; gap: 4px; }
  .lookprev .lp-people i { width: 10px; height: 10px; border-radius: 50%; box-shadow: 0 0 0 1.5px var(--glass, #fff); }
  .lookprev .lp-pane, .lookprev .lp-card { display: flex; flex-direction: column; justify-content: center; gap: 6px; padding: 10px; background: var(--glass); border: 1px solid var(--glass-line); }
  .lookprev .lp-pane { width: 62%; height: 56%; border-radius: 14px; -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: var(--shadow); }
  .lookprev .lp-card { width: 42%; height: 56%; border-radius: 14px; }
  .lookprev .lp-pane i, .lookprev .lp-card i { height: 6px; border-radius: 3px; background: var(--ink); opacity: .6; }
  .lookprev .lp-pane i:nth-child(2), .lookprev .lp-card i:nth-child(2) { width: 68%; }
  .lookprev .lp-pane i:nth-child(3), .lookprev .lp-card i:nth-child(3) { width: 42%; background: var(--primary); opacity: 1; }
  .lookprev .lp-note { position: relative; width: 21%; height: 52%; border-radius: 2px; background: var(--note); box-shadow: 0 4px 5px rgba(0,0,0,.18); rotate: -3deg; }
  .lookprev .lp-note:last-of-type { rotate: 2deg; }
  .lookprev .lp-note.lp-today { height: 64%; background: var(--note-today); rotate: 1deg; }
  .lookprev .lp-note::before { content: ''; position: absolute; top: -4px; left: 50%; margin-left: -5px; width: 10px; height: 10px; border-radius: 50%; background: var(--ink3); box-shadow: 0 1px 2px rgba(0,0,0,.3); }
  .lookprev .lp-note.lp-today::before { background: var(--danger); }
  .lookprev .lp-ring { width: 56px; height: 56px; border-radius: 50%; border: 8px solid var(--track); border-top-color: var(--accent); border-right-color: var(--p-1); flex-shrink: 0; }
`;

const OWNER = new Map<string, string[]>();
for (const [tag, names] of Object.entries(HOOKS.parts)) for (const n of names) OWNER.set(n, [...(OWNER.get(n) ?? []), tag]);

/** Expand a look's rules: role rules apply in every component, part rules only inside the component that owns the part. */
const scope = (css: string, id: LookId): string => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/([^{}]+)\{([^{}]*)\}/g, (_m, sels: string, body: string) => {
  const out = sels.split(',').map((sel) => {
    let owners: string[] | null = null;
    for (const m of sel.replace(/\[[^\]]*\]/g, '').matchAll(/\.([a-zA-Z][\w-]*)/g)) {
      const o = OWNER.get(m[1]);
      if (o && !HOOKS.roles.includes(m[1])) owners = owners ? owners.filter((x) => o.includes(x)) : o;
    }
    const host = owners?.length === 1 ? `:host(${owners[0]}[data-look='${id}'])` : `:host([data-look='${id}'])`;
    return sel.trim().replace(/^@[A-Z]/, host);
  });
  return `${out.join(', ')} {${body}}\n`;
});

/** A look's tokens as rules on the root, so evening (and any later state) can override them in CSS. */
const tokens = (l: LookDef): string => {
  if (!l.vars) return '';
  const decl = (v: Record<string, string>): string => Object.entries(v).map(([k, x]) => `${k}:${x}`).join(';');
  const root = `:host([data-look='${l.id}']) .fh`;
  return `${root} {${decl(l.vars)}}\n${l.evening ? `${root}[data-tod='eve'], ${root}[data-tod='night'] {${decl(l.evening)}}\n` : ''}`;
};

export const lookCss = unsafeCSS(KEYFRAMES + PREVIEW + LOOKS.map(tokens).join('') + scope(FRIDGE, 'fridge') + scope(ORBIT, 'orbit'));
