import { html, svg, nothing, unsafeCSS, type ReactiveController, type ReactiveControllerHost, type TemplateResult } from 'lit';
import { loadFonts } from './fonts';
import { getNarrow, getShape, onShape, setSoundLook } from './util';

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
 *  5. Glass has a few hook rules of its own too (GLASS): the pane behind the clock, the chosen-card ring and tick,
 *     past events told by ink instead of fading. They are checked like the other two.
 *  6. A rule's tag may carry host state or a width limit: `@O[data-phone] .dock` (phones), `@O<700 .dayview` (under 700 px).
 *
 * State the base exposes on the root `.fh` for looks to react to:
 *   data-tod="day|eve|night"   time of day (evening tokens apply to eve + night)
 *   data-calm                  calm mode: no looping motion, no tilt
 *   data-opt-<id>              a look option the family switched on
 *   data-dow="0…6"             the day of the week, Sunday first (Home Ground shows a different ball each day)
 * ------------------------------------------------------------------ */

export type LookId = 'glass' | 'fridge' | 'orbit' | 'sports';
export interface DialArc { start: Date; end: Date; allDay: boolean; colour: string }
/** Places in the base where a look may add a drawing of its own. */
export type ArtSlot = 'clock' | 'day' | 'timer' | 'dayview' | 'night' | 'player' | 'wx' | 'steps';
export interface ArtCtx { now?: Date; arcs?: DialArc[]; frac?: number; size?: number; /** cover art and whether it is playing, for the music player */ img?: string; playing?: boolean; /** today's weather, for a look that sums it up on the header chip */ wx?: { state: string; uv?: number; rain?: number; max?: number }; /** one person's own progress through a list: how many are done, out of how many */ done?: number; total?: number }
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
  /** false = the picker card does not repeat the look's clock drawing (it is not a self-contained picture) */
  previewClock?: boolean;
}

/** The contract between the base interface and the looks (see the note at the top). */
export const HOOKS: { roles: string[]; parts: Record<string, string[]> } = {
  // shared building blocks: styled once per look, wherever they appear
  roles: ['fh', 'glass', 'card', 'sheet', 'scrim', 'toast', 'label', 'muted', 'display', 'pill', 'round', 'primary', 'lead', 'tap', 'quick', 'avatar',
    'row', 'check', 'content', 'done', 'now', 'big', 'past', 'next', 'meter', 'tab', 'tabs', 'field', 'key', 'today', 'away', 'playing', 'on', 'hot', 'i', 'seg', 'init', 'sm', 'verdict'],
  // named regions, by the component that owns them
  parts: {
    'family-hub-card': ['clock', 'hm', 'cap', 'weather', 'badge', 'presence', 'right', 'planner', 'legend', 'week', 'col', 'dayhead', 'num', 'ev', 't', 'w', 'more',
      'cell', 'out', 'dayrow', 'np', 'np-row', 'art', 'timerrow', 'hint', 'rem', 'dock', 'item', 'kidbtn', 'sep', 'tcard', 'capsule', 'mchip', 'med2', 'opt', 'sw',
      // drawings a look adds through art
      'aclock', 'dial', 'nowdot', 'tface', 'dayview', 'dayart', 'ddial', 'dh', 'dp', 'night', 'nart', 'sboard', 'dg', 'colon', 'dball', 'tmeter',
      // more of the base that Home Ground dresses
      // the screensaver (artmode.ts)
      'artm', 'aplate', 'atime', 'aampm', 'adate', 'ainfo', 'awords', 'ashade',
      'tmr', 'ok', 'called', 'mtop', 'breathe', 'tread', 'tcancel', 'jarpic', 'calfail', 'remfail', 'daylist', 'mpill', 'quiet', 'freeday', 'irow', 'sosbtn', 'themes', 'setrow'],
    'fh-kid': ['hero', 'name', 'rank', 'stat', 'dots', 'g', 't', 'nextup', 'jobs', 'sec', 'plus', 'play', 'later', 'side', 'rw', 'n', 'save', 'pic', 'wk', 'job', 'ring', 'going', 'e', 'pt', 'stars', 'small', 'cost', 'notyet', 'readme', 'seedone', 'studio'],
    'fh-groceries': ['list', 'items', 'tag', 'who', 'clear'],
    'fh-music': ['stage', 'deck', 'spk', 'focus', 'inmix', 'join', 'hit', 'st', 'pickrow', 'banner', 'mini', 'tog', 'mroom', 'mzone', 'mstairs', 'pool', 'puck', 'mshelf', 'wholeh',
      // other ways of seeing the rooms (musicviews.ts)
      'viewbtn', 'vcard', 'dplate', 'dtrack', 'dknob', 'dcover', 'desk', 'strip', 'sname', 'lamp', 'fcap', 'slot', 'cab', 'sock', 'cdisc', 'cbox', 'ttable', 'tkey', 'ctab', 'jog', 'mpad', 'dart', 'sshelf', 'dcard', 'tuner', 'vscene', 'aname', 'ahull', 'aline', 'bigdial', 'rig', 'crate', 'presets', 'suntx'],
    'fh-home': ['rooms', 'room', 'lit', 'rh', 'dev', 'dicon', 'toggle', 'scene'],
    'fh-doodle': ['easel', 'pad', 'ink', 'gallery', 'snaps', 'snap', 'by'],
    'fh-studio': ['mirror', 'tile'],
    'fh-pin': ['grid', 'what'],
    'fh-chat': ['thread', 'bubble', 'asker', 'starter', 'talk'],
    'fh-add-event': ['box', 'chips', 'durs', 'ampm', 'allday', 'dialbox', 'drums'],
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
    ${[[12, 100, 13], [3, 190.5, 103.5], [6, 100, 194], [9, 9.5, 103.5]].map(([n, x, y]) => svg`<text class="dh" x=${x} y=${y} text-anchor="middle" font-size="9" font-weight="600" fill="var(--ink2)">${n}</text>`)}
    <text class="dp" x="100" y="41.5" text-anchor="middle" font-size="7.2" font-weight="700" letter-spacing=".08em" fill="var(--ink)" opacity=".85">AM</text>
    <text class="dp" x="100" y="19.5" text-anchor="middle" font-size="7.2" font-weight="700" letter-spacing=".08em" fill="var(--ink)" opacity=".85">PM</text>
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
    <circle cx="100" cy="100" r=${r} stroke="var(--accent, #ffe08a)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${f * C} ${C}" transform="rotate(-90 100 100)" style="transition:stroke-dasharray var(--ring-t, calc(1s * var(--m-d, 1))) var(--ring-e, linear)"></circle>
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
    <circle cx="50" cy="50" r="22" stroke="var(--timer, var(--accent))" stroke-width="44" stroke-dasharray="${f * C} ${C}" transform="rotate(-90 50 50)" style="transition:stroke-dasharray var(--ring-t, calc(1s * var(--m-d, 1))) var(--ring-e, linear)"></circle>
    <circle cx="50" cy="50" r="3" fill="var(--timer-rim, var(--ink3))"></circle>`}</svg>`;
};

/* ---- Home Ground (sports): a scoreboard that only ever shows the time, a touchline meter, the ball of the day.
   Everything is a plain, generic object drawn here by hand: no club, league or brand marks. ---- */
const sv = (inner: string, vb = '0 0 24 24'): string => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${inner}</svg>`)}")`;
const ballG = (inner: string): string => `<g stroke="#14201A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
/** One code a day, Sunday first (as Date.getDay()): Sunday is free play, so it carries the whistle. */
export const DAY_BALL = ['whistle', 'soccer', 'tennis', 'hockey', 'floor', 'rugby', 'footy'];
const BALLS: Record<string, string> = {
  soccer: ballG('<circle cx="12" cy="12" r="9.7" fill="#fff"/><path d="M12 8.6l3.2 2.3-1.2 3.9h-4l-1.2-3.9z" fill="#14201A"/><path d="M12 8.6V3.5M15.2 10.900l4.5-1.5M14 14.800l2.800 4M10 14.800l-2.800 4M8.800 10.900L4.300 9.400" fill="none"/>'),
  tennis: ballG('<circle cx="12" cy="12" r="9.7" fill="#D4E157"/><path d="M4.600 6.500c4.200 2 4.200 9 0 11M19.400 6.500c-4.200 2-4.200 9 0 11" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="9.7" fill="none"/>'),
  hockey: ballG('<path d="M17 2.500L10.800 15.800Q9.300 19.200 6 18Q4 17 4.600 14.600" fill="none" stroke="#B7814A" stroke-width="3"/><circle cx="17.500" cy="17.500" r="3.7" fill="#fff"/>'),
  floor: ballG('<circle cx="12" cy="12" r="9.7" fill="#fff"/><g fill="#14201A" stroke="none"><circle cx="12" cy="6.600" r="1.7"/><circle cx="7.200" cy="10.300" r="1.7"/><circle cx="16.800" cy="10.300" r="1.7"/><circle cx="9" cy="16" r="1.7"/><circle cx="15" cy="16" r="1.7"/><circle cx="12" cy="11.600" r="1.3"/></g>'),
  rugby: ballG('<g transform="rotate(-35 12 12)"><ellipse cx="12" cy="12" rx="10.5" ry="6.800" fill="#fff"/><path d="M5.500 9.200c1.600 1.800 1.600 3.800 0 5.600M18.500 9.200c-1.600 1.800-1.600 3.800 0 5.600" fill="none" stroke="#B7814A" stroke-width="1.6"/><path d="M9 12h6M10.500 10.800v2.400M12 10.800v2.400M13.500 10.800v2.400" fill="none" stroke-width="1.2"/></g>'),
  footy: ballG('<g transform="rotate(-35 12 12)"><path d="M1.500 12Q12 3.200 22.500 12 12 20.800 1.500 12z" fill="#C8372D"/><path d="M9 10.300h6M10.200 9.300v2M12 9.300v2M13.800 9.300v2" fill="none" stroke="#fff" stroke-width="1.3"/></g>'),
  whistle: ballG('<circle cx="12" cy="12" r="9.7" fill="#fff"/><g fill="none" stroke-width="1.6"><circle cx="9.600" cy="13.400" r="3.900"/><path d="M12.200 10.400H18.600v2.900h-4.800M9.600 9.500V7M7 7.500l.9 1.200M12.200 7.500l-.9 1.200"/></g>')
};
const lineG = (inner: string, stroke: string, w = 2): string => `<g fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
const BIB = 'M5.500 1h3.200c0 2.600 1.200 3.800 3.300 3.800s3.300-1.200 3.300-3.800h3.200c0 3 1 5 3 6v15a1 1 0 0 1-1 1H3.500a1 1 0 0 1-1-1V7c2-1 3-3 3-6z';
const flag = (staff: string, fill: string): string => sv(`<path fill="${fill}" d="M6.500 3.500L19 8 6.500 12.500z" stroke="${staff}" stroke-width="1.8" stroke-linejoin="round"/><path d="M6 21.500V2.500" stroke="${staff}" stroke-width="2.4" stroke-linecap="round"/>`);
const WHISTLE = '<circle cx="9" cy="14.500" r="5.500"/><path d="M12.500 10H21v4h-6.500M9 9V5.500M5.500 6l1.200 1.600M12.500 6l-1.200 1.600"/>';
const CONE = '<path d="M10 4h4l4.500 15h-13zM3.500 20h17M8.400 11h7.200"/>';
/** The look's small pictures as tokens on the root, so rules (and the evening) can use them; kept out of `vars` so the picker card stays light. */
const sportsArt = (): string => {
  const root = ":host([data-look='sports']) .fh", eve = `${root}[data-tod='eve'], ${root}[data-tod='night']`;
  const day: string[] = Object.entries(BALLS).map(([k, v]) => `--s-${k}:${sv(v)}`);
  day.push(`--s-ball:var(--s-soccer)`, `--s-bib:${sv(`<path d="${BIB}"/>`)}`, `--s-lock:${sv(lineG('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', '#000'))}`,
    `--s-tick:${sv(lineG('<path d="M5 12.500l4.500 4.500L19 7.500"/>', '#000', 3))}`, `--s-flag:${flag('#14201A', '#14201A')}`, `--s-flag-ok:${flag('#14201A', '#17703A')}`,
    `--s-away:${sv(`<path d="${BIB}" fill="none" stroke="#5C6961" stroke-width="1.8" stroke-dasharray="3 2.5"/>`)}`,
    `--s-cone:${sv(lineG(CONE, '#B42318'))}`, `--s-pea:${sv(lineG(WHISTLE, '#14201A'))}`,
    `--s-clip:${sv('<rect x="1" y="-8" width="118" height="30" rx="8" fill="#9AA59D" stroke="#14201A" stroke-width="2"/><rect x="1" y="16" width="118" height="5" fill="rgba(0,0,0,.14)"/><circle cx="60" cy="9" r="6" fill="#fff" stroke="#14201A" stroke-width="2"/>', '0 0 120 24')}`,
    `--s-bag:${sv('<g stroke="#14201A" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"><path d="M7.500 7h9l3.300 8.500A4.500 4.500 0 0 1 15.600 22H8.400a4.500 4.500 0 0 1-4.200-6.500z" fill="#fff"/><circle cx="9.500" cy="17" r="2.6" fill="#D4E157"/><circle cx="14.800" cy="17.300" r="2.6" fill="#fff"/><circle cx="12" cy="12.300" r="2.4" fill="#C8372D"/><path d="M9 7c0-2.500 1.200-4 3-4s3 1.500 3 4" fill="none" stroke="#B7814A" stroke-width="2"/></g>')}`,
    `--s-goal:${sv(lineG('<path d="M2 20V5h28v15M2 10h28M2 15h28M9 5v15M16 5v15M23 5v15" stroke-width="1"/><path d="M2 20V5h28v15" stroke-width="2.2"/>', '#14201A'), '0 0 32 24')}`);
  const night = [`--s-flag:${flag('#F1F4EA', '#F1F4EA')}`, `--s-flag-ok:${flag('#F1F4EA', '#6FD896')}`, `--s-away:${sv(`<path d="${BIB}" fill="none" stroke="#93A097" stroke-width="1.8" stroke-dasharray="3 2.5"/>`)}`,
    `--s-cone:${sv(lineG(CONE, '#FF9485'))}`, `--s-goal:${sv(lineG('<path d="M2 20V5h28v15M2 10h28M2 15h28M9 5v15M16 5v15M23 5v15" stroke-width="1"/><path d="M2 20V5h28v15" stroke-width="2.2"/>', '#F1F4EA'), '0 0 32 24')}`];
  return `${root} {${day.join(';')}}\n${eve} {${night.join(';')}}\n${DAY_BALL.map((b, i) => `${root}[data-dow='${i}'] {--s-ball:var(--s-${b})}`).join('\n')}\n`;
};
/** The header clock: digit tiles on a charcoal board, each split by a hairline like a flap board, with a hi-vis colon and the ball of the day. */
export const scoreClock = (now: Date, size?: number): TemplateResult => {
  const h = String(now.getHours() % 12 || 12), m = String(now.getMinutes()).padStart(2, '0');
  return html`<span class="sboard" role="img" aria-label=${`${h}:${m}`} style=${size ? `--sz:${size}px` : ''}>${[...h].map((d) => html`<b class="dg">${d}</b>`)}<i class="colon"></i>${[...m].map((d) => html`<b class="dg">${d}</b>`)}<i class="dball" data-ball=${DAY_BALL[now.getDay()]}></i></span>`;
};
/** The ball of the day, for a day head on the planner. */
export const dayBall = (d: Date): TemplateResult => html`<i class="dball" data-ball=${DAY_BALL[d.getDay()]} aria-hidden="true"></i>`;
/** The match clock's touchline: time played fills from the left, a ball stands where the clock is up to, and a mark shows half-way. */
export const touchMeter = (frac: number, size = 120): TemplateResult => {
  const f = Math.max(0, Math.min(1, frac)), played = f > 0 ? 1 - f : 0, x = 12 + 216 * played;
  return html`<svg class="tmeter" aria-hidden="true" width=${size * 2} height=${Math.round(size * 2 * 0.117)} viewBox="0 0 240 28" fill="none">${svg`
    <rect x="12" y="11.5" width="216" height="5" rx="2.5" fill="var(--track)"></rect>
    <rect x="12" y="11.5" width=${216 * played} height="5" rx="2.5" fill="var(--ink)"></rect>
    <rect x="119" y="4" width="2" height="20" rx="1" fill="var(--ink3)"></rect>
    <g style="transform:translateX(${x}px);transition:transform var(--ring-t, calc(1s * var(--m-d, 1))) var(--ring-e, linear)"><circle cx="0" cy="14" r="9.5" fill="#fff" stroke="#14201A" stroke-width="2"></circle><path d="M0 10.6l3.200 2.300-1.200 3.800h-4l-1.200-3.800z" fill="#14201A"></path></g>`}</svg>`;
};
/**
 * One person's own jobs as a training drill: a marker for each, the done ones ticked, the pennant and the ball at the one to do now,
 * and a goal at the end. It only ever shows one list (never two people side by side). Drawn with inline styles, so it works in any component.
 */
export const drillLine = (done: number, total: number): TemplateResult => {
  const n = Math.max(1, Math.min(12, total)), d = Math.max(0, Math.min(n, Math.round((done / Math.max(1, total)) * n))), s = n > 8 ? 22 : 28;
  const line = (on: boolean): TemplateResult => html`<i style="flex:1;min-width:6px;height:0;border-top:3px ${on ? 'solid var(--ok)' : 'dashed var(--track)'}"></i>`;
  const tick = html`<i style="width:${s}px;height:${s}px;flex-shrink:0;border-radius:50%;background:var(--ok);display:grid;place-items:center"><svg viewBox="0 0 24 24" width=${s - 10} height=${s - 10} fill="none" stroke="var(--on-ok, #fff)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg></i>`;
  return html`<div aria-hidden="true" style="display:flex;align-items:center;height:40px;flex-shrink:0;padding:0 2px">
    ${Array.from({ length: n }, (_, i) => html`${i ? line(i <= d) : nothing}${i < d ? tick
      : i === d ? html`<i style="width:22px;height:26px;margin:0 -2px -6px 0;flex-shrink:0;align-self:flex-start;background:var(--s-flag) center / contain no-repeat"></i><i style="width:34px;height:34px;flex-shrink:0;background:var(--s-ball) center / contain no-repeat"></i>`
      : html`<i style="width:14px;height:14px;flex-shrink:0;border-radius:50%;box-shadow:inset 0 0 0 2.5px var(--ink3)"></i>`}`)}
    ${line(d >= n)}<i style="width:44px;height:33px;flex-shrink:0;background:var(--s-goal) center / contain no-repeat"></i></div>`;
};
export type Verdict = 'on' | 'hat' | 'wet';
/** The pitch report in one word or three, from what the weather entity already says: rain, storms or a wet forecast first, then sun strength. */
export const playVerdict = (state: string, uv = 0, rainMm = 0, max = 0): Verdict => (/rain|pour|storm|lightning|hail|snow/.test(state) || rainMm >= 5 ? 'wet' : uv >= 6 || max >= 30 ? 'hat' : 'on');
export const VERDICT: Record<Verdict, string> = { on: 'Play is on', hat: 'Take a hat', wet: 'Wet weather plan' };
/** The verdict as a square status tile (it tells; it is not pressed). */
export const verdictTile = (v: Verdict, big = false): TemplateResult => html`<span class="verdict" ?data-big=${big} data-v=${v}>${v === 'on' ? html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : nothing}${VERDICT[v]}</span>`;

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
      '--rule': '#b9d0e6', '--margin': '#f2a7a7', '--magnet': '#fbf8f0', '--danger': '#b8261f', '--ink-done': '#5c5852', '--wet': '#1f5f99',
      '--glass': 'var(--paper)', '--glass-line': 'transparent', '--shadow': '0 5px 8px rgba(0,0,0,.16)',
      '--chip': 'rgba(38,39,43,.07)', '--chip-strong': 'var(--paper)', '--chip-soft': 'rgba(38,39,43,.045)', '--chip-faint': 'rgba(38,39,43,.02)', '--track': 'rgba(38,39,43,.16)',
      '--sel-bg': 'var(--ink)', '--sel-ink': 'var(--paper)', '--sel-ring': 'none', '--primary': '#24408e', '--on-primary': '#ffffff', '--primary-edge': '#162a63', '--accent': '#a85200', '--ok': '#17703d',
      '--timer': '#c62a22', '--timer-face': 'var(--paper)', '--timer-rim': 'var(--ink)',
      '--t-hero': '46px', '--t-title': '42px', '--t-head': '30px', '--t-sub': '26px', '--w-title': '700', '--w-sub': '700', '--w-heavy': '700', '--w-bold': '600', '--w-semi': '500',
      '--font-content': "'Fredoka', sans-serif", '--content-weight': '500', '--content-size': '17px', '--content-size-lg': '21px', '--content-ink': 'var(--ink)', '--bg': 'none'
    },
    evening: {
      '--ground': '#9d927b', '--paper': '#eadfc6', '--note': '#e3d39b', '--note-today': '#e7c651', '--rule': '#cbbe9f', '--margin': '#d6a391', '--magnet': '#e6dcc6',
      '--shadow': '0 5px 8px rgba(0,0,0,.2)',
      // the evening ground is darker: the quiet inks go darker with it, so small words on the bare fridge keep 4.5:1
      '--ink2': '#2a2824', '--ink3': '#3d3a35', '--ink-done': '#3d3a35',
      // and the coloured words (Overdue, Due, a tick) darken too, so they keep 4.5:1 on the evening paper
      '--danger': '#8f1d18', '--ok': '#0f5a2f', '--accent': '#7a3c00'
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
      '--ink': '#e8ecf7', '--ink2': '#b4bcd6', '--ink3': '#98a2c2', '--ground': '#0a0f1e', '--danger': '#ff8a7a', '--ink-done': '#b9c1da', '--wet': '#8fcbff', '--on-danger': '#0a0f1e',
      '--glass': '#121a31', '--glass-line': 'rgba(255,255,255,.12)', '--shadow': 'none', '--ctl-line': 'rgba(255,255,255,.44)',
      '--chip': 'rgba(255,255,255,.09)', '--chip-strong': 'rgba(255,255,255,.17)', '--chip-soft': 'rgba(255,255,255,.05)', '--chip-faint': 'rgba(255,255,255,.025)', '--track': 'rgba(255,255,255,.28)', '--on-ok': '#0a0f1e',
      // ink-filled = an action; yellow = now / current; mint = done
      '--sel-bg': 'var(--accent)', '--sel-ink': '#0a0f1e', '--sel-ring': 'none', '--primary': '#e8ecf7', '--on-primary': '#0a0f1e', '--accent': '#ffe08a', '--ok': '#6ee7c0',
      '--timer': '#ffe08a', '--timer-face': 'rgba(255,255,255,.06)', '--timer-rim': 'rgba(255,255,255,.44)', '--bg': 'none',
      '--w-title': '400', '--w-sub': '500', '--w-heavy': '600', '--w-bold': '500', '--w-semi': '400'
    }
  },
  {
    id: 'sports', name: 'Home Ground', tagline: 'Turf, chalk lines and a scoreboard', swatch: '#2a7541',
    fonts: ['Bricolage Grotesque', 'Outfit', 'Inter'], previewClock: false,
    art: { clock: (c) => scoreClock(c.now ?? new Date(), c.size), day: (c) => (c.now ? dayBall(c.now) : html``), night: (c) => scoreClock(c.now ?? new Date(), 150),
      // the kitchen timer is a match clock on a touchline; a small timer (a child's practice, bedtime) stays a round stopwatch face
      timer: (c) => (c.size === undefined || c.size >= 100 ? touchMeter(c.frac ?? 0, c.size) : timerFace(c.frac ?? 0, c.size)),
      steps: (c) => (c.total ? drillLine(c.done ?? 0, c.total) : html``),
      wx: (c) => (c.wx ? verdictTile(playVerdict(c.wx.state, c.wx.uv, c.wx.rain, c.wx.max)) : html``) },
    preview: () => html`<span class="lp-lanes"><i></i><i class="lp-now"><b></b></i><i></i><i></i></span><span class="lp-turf"></span>`,
    vars: {
      ...PEOPLE, '--p-family': '#3f4b45',
      // match day: a pale clubhouse wall, white boards, charcoal ink. Hi-vis yellow is filled in for ACTION only (the one hero button on a page or sheet);
      // anything that is merely current or chosen (today, the room that is playing, the next job, a picked chip, this page in the dock) is marked in ink: a dark fill or a dark outline
      '--ink': '#14201a', '--ink2': '#44524a', '--ink3': '#5c6961', '--ink-done': '#44524a', '--ground': '#ecefe6', '--panel': '#ffffff', '--panel2': '#f2f5ec', '--line': '#c3cdbf', '--track': '#d3dbce',
      '--hi': '#ffd60a', '--wash': '#fff6c4', '--edge': '#14201a', '--sel': '#14201a', '--on-sel': '#ffffff',
      '--ok': '#17703a', '--ok-wash': '#ddf0e2', '--on-ok': '#ffffff', '--danger': '#b42318', '--danger-wash': '#fbe4e1', '--on-danger': '#ffffff', '--wet': '#1f5f99',
      '--turf': '#2a7541', '--turf2': '#25693a', '--mow1': '#e1ecd8', '--mow2': '#ebf2e4', '--chalk': '#ffffff', '--board': '#17211c', '--tile': '#0a100d', '--board-ink': '#f4f6ee', '--board-ink2': '#b9c4bb', '--board-line': 'transparent',
      '--bib-edge': 'transparent', '--evcard': '#ffffff', '--kid-mix': '100%', '--flood': 'none',
      '--glass': 'var(--panel)', '--glass-line': 'var(--line)', '--shadow': '0 1px 0 rgba(20,32,26,.06)',
      '--chip': 'var(--panel2)', '--chip-strong': 'var(--panel)', '--chip-soft': 'var(--panel2)', '--chip-faint': 'transparent',
      '--sel-bg': 'var(--sel)', '--sel-ink': 'var(--on-sel)', '--sel-ring': 'none', '--mark': 'var(--sel)', '--on-mark': 'var(--on-sel)', '--art-none': 'linear-gradient(135deg, #5c6961, #14201a)', '--primary': '#ffd60a', '--on-primary': '#14201a', '--accent': '#7a5e00',
      '--timer': '#14201a', '--timer-face': 'var(--panel)', '--timer-rim': 'var(--ink)', '--ring-halo': '#ffffff', '--scrim': 'rgba(9,18,13,.58)', '--bg': 'none'
    },
    // under lights: a dark ground with two soft pools of floodlight; the same marks, and bibs gain a chalk outline
    evening: {
      '--ink': '#f1f4ea', '--ink2': '#bac5bc', '--ink3': '#93a097', '--ink-done': '#bac5bc', '--ground': '#0d1411', '--panel': '#18231d', '--panel2': '#202d26', '--line': '#34443b', '--track': '#3a4a41',
      '--wash': '#3a3508', '--edge': '#000000', '--sel': '#f1f4ea', '--on-sel': '#14201a',
      '--ok': '#6fd896', '--ok-wash': '#17382a', '--on-ok': '#0d1411', '--danger': '#ff9485', '--danger-wash': '#43201c', '--on-danger': '#2a0d09', '--wet': '#8fcbff',
      '--turf': '#144226', '--turf2': '#113a21', '--mow1': '#15261c', '--mow2': '#192c21', '--chalk': 'rgba(255,255,255,.34)', '--board': '#070b09', '--tile': '#000000', '--board-line': 'var(--line)',
      '--p-family': '#55625a', '--bib-edge': 'rgba(255,255,255,.75)', '--evcard': '#223029', '--kid-mix': '42%', '--shadow': 'none', '--accent': '#ffd60a', '--timer': '#f1f4ea', '--ring-halo': '#0d1411',
      '--flood': 'radial-gradient(520px 300px at 0 0, rgba(255,244,190,.13), transparent 70%), radial-gradient(520px 300px at 100% 0, rgba(255,244,190,.13), transparent 70%)'
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
    ${l.art?.clock && l.previewClock !== false ? html`<span class="lp-clock">${l.art.clock({ now: new Date(2000, 0, 1, 10, 10), arcs: [] })}</span>` : nothing}${l.preview?.() ?? nothing}
    <span class="lp-people">${[1, 2, 3, 4, 5].map((n) => html`<i style="background:var(--p-${n})"></i>`)}</span></span>`;
};

let current: LookId = 'glass';
const subs = new Set<() => void>();
export const getLook = (): LookId => current;
export const setLook = (id: LookId): void => {
  current = lookById(id).id;
  setSoundLook(current);
  loadLookFonts(current);
  subs.forEach((f) => f());
};
function loadLookFonts(id: LookId): void { loadFonts(...(lookById(id).fonts ?? [])); }

/** Keeps a component's `data-look` host attribute in step with the chosen look, and its shape attributes in step with the screen.
 *  A page that sets `stackNarrow` takes its portrait arrangement (data-shape="tall", plus data-stack) on a landscape screen under 900 px wide. */
export class LookController implements ReactiveController {
  private _off?: () => void;
  private _shape = (): void => { const s = getShape(), stack = s === 'wide' && getNarrow() >= 3 && !!(this.host as { stackNarrow?: boolean }).stackNarrow; this.host.setAttribute('data-shape', s === 'phone' || stack ? 'tall' : s); this.host.toggleAttribute('data-stack', stack); this.host.toggleAttribute('data-phone', s === 'phone'); const n = getNarrow(); for (const i of [1, 2, 3]) this.host.toggleAttribute('data-n' + i, n >= i); };
  private _on = (): void => { this.host.setAttribute('data-look', current); this._shape(); this.host.requestUpdate(); };
  constructor(private host: ReactiveControllerHost & HTMLElement) { host.addController(this); }
  hostConnected(): void { subs.add(this._on); this._off = onShape(this._on); this.host.setAttribute('data-look', current); this._shape(); }
  hostDisconnected(): void { subs.delete(this._on); this._off?.(); }
}

/* ---------------- look styles (shared by every component) ---------------- */

const GLASS = `
  /* the clock sits on its own pane of glass, so the greeting, the time and the date read over any photo and whatever drifts behind it */
  @G .clock { margin: -8px 0 -8px -14px; padding: 8px 18px 8px 14px; border-radius: 26px; background: var(--glass); -webkit-backdrop-filter: blur(22px) saturate(160%); backdrop-filter: blur(22px) saturate(160%); box-shadow: inset 0 0 0 1px var(--glass-line); }
  @G[data-phone] .clock { margin: 0; padding: 6px 14px 8px; flex: 0 1 auto; }
  /* phone month: the glass card's padding left each day 43 px wide; the days take 3 px back from the gaps between them, so each is a full 44 px target */
  @G[data-phone] .cell { margin: 0 -1.5px; }
  /* the chosen look or background: a ring and a tick, never a fill */
  /* what is over is told by its ink, not by fading the whole card: the words stay readable */
  @G .ev.past, @G .dayrow.past { opacity: 1; border-left-color: color-mix(in srgb, var(--c) 45%, transparent); }
  @G .ev.past { background: color-mix(in srgb, var(--c) 10%, var(--chip-soft)); }
  @G .ev.past .t, @G .ev.past .w, @G .ev.past .content, @G .dayrow.past .content, @G .dayrow.past .muted { color: var(--ink-done); }
  /* an alert chip pulses with a ring inside its edge; the words keep their full contrast */
  @G .cap.hot { animation: fhHot 1.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  /* someone who is out keeps their letter at full strength inside a ring of their colour */
  @G .presence .avatar.away { opacity: 1; background: transparent; color: var(--ink); box-shadow: inset 0 0 0 2px var(--c); }
  /* a warning is the theme's danger colour with ink that reads on it (dark ink on Space's pale red) */
  @G .wwarn { color: var(--on-danger, #fff); }
  @G .field { min-width: 0; }
  @G .tcard { position: relative; }
  @G .tcard[aria-pressed='true'] { background: var(--chip); color: var(--ink); box-shadow: 0 0 0 3px var(--primary); }
  @G .tcard[aria-pressed='true']::after { content: '✓'; position: absolute; top: -9px; right: -9px; width: 30px; height: 30px; border-radius: 50%; background: var(--primary); color: var(--on-primary); font-size: 17px; font-weight: 800; line-height: 30px; text-align: center; box-shadow: 0 0 0 3px var(--chip-strong); }
`;

const FRIDGE = `
  /* materials: paper = content (pinned, slightly tilted) · magnet = navigation · plastic key = input · dashed = "add" */
  @F .fh { --pg-from: rotate(calc(.4deg * var(--m-d, 1))); font-family: 'Fredoka', 'Trebuchet MS', sans-serif; font-size: 16px; background: var(--ground) radial-gradient(rgba(255,255,255,.5) 1px, transparent 1.5px) 0 0 / 14px 14px; transition: background-color var(--m-5, 900ms) ease, color var(--m-4, 400ms) ease; }
  @F .fh::before { display: none; }
  @F .fh:not([data-calm]):not([data-tod='night']) { animation: fjig 37s linear infinite; }
  @F .fh[data-opt-hand] { --font-content: 'Caveat', 'Fredoka', sans-serif; --content-weight: 700; --content-size: 24px; --content-size-lg: 27px; }
  @F h1, @F h2 { font-family: 'Caveat', 'Fredoka', sans-serif; letter-spacing: 0; }
  @F h1 { line-height: .95; }
  @F h2 { line-height: 1; }
  @F .display { font-family: 'Fredoka', sans-serif; letter-spacing: 0; font-variant-numeric: tabular-nums; }
  @F .glass { background: var(--glass); -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; border-radius: 4px; box-shadow: var(--shadow); transition: background-color var(--m-5, 900ms) ease; }
  @F .glass.round { border-radius: 50%; }
  @F .label { letter-spacing: .05em; font-size: 14px; }
  @F .pill, @F .round { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); font-weight: 500; }
  @F .pill.primary, @F .primary { background: var(--primary); color: var(--on-primary); box-shadow: 0 4px 0 var(--primary-edge); }
  /* the lead action is a chunky plastic push-button; pressing any plastic button sends it down onto its edge */
  @F .lead { font-weight: 600; box-shadow: 0 5px 0 var(--primary-edge), 0 8px 8px rgba(0,0,0,.2); }
  @F .lead:active, @F .primary.tap:active { transform: translateY(calc(3px * var(--m-d, 1))); box-shadow: 0 1px 0 var(--primary-edge); opacity: 1; }
  /* Ask: answers are notes of paper, the child's own words a card in the pen's blue; the pictures are dashed "add" buttons */
  @F .thread { background: transparent; box-shadow: inset 0 0 0 2px var(--track); border-radius: 6px; }
  @F .bubble { background: var(--note); color: #26272b; border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.16); font-family: var(--font-content, inherit); }
  @F .bubble.asker { background: var(--primary); color: var(--on-primary); border-radius: 3px; }
  @F .starter { background: transparent; border: 2px dashed var(--ink); border-radius: 18px; font-weight: 500; }
  @F .talk { box-shadow: 0 6px 0 var(--primary-edge), 0 9px 9px rgba(0,0,0,.2); }
  @F .talk:active { transform: translateY(calc(4px * var(--m-d, 1))); box-shadow: 0 2px 0 var(--primary-edge); opacity: 1; }
  /* sheets: one large note taped to the door. The tilt is a hair, and calm mode takes it away */
  @F .sheet, @F .box { background: var(--note); border-radius: 3px; box-shadow: 0 16px 34px rgba(0,0,0,.32); rotate: calc(clamp(0, var(--tilt, 1), 1) * -.4deg); }
  @F .sheet::before, @F .box::before { content: ''; position: absolute; top: -13px; left: 50%; width: 124px; height: 28px; margin-left: -62px; background: rgba(176,200,216,.82); box-shadow: 0 1px 3px rgba(0,0,0,.18); rotate: -2deg; pointer-events: none; }
  @F[data-phone] .sheet::before, @F .box::before { top: 0; height: 16px; z-index: 1; }
  /* chips on a sheet are the dashed marker pill; the chosen one is inked in */
  @F .mchip, @F .chips button, @F .durs button, @F .ampm button, @F .allday { background: transparent; border: 2px dashed var(--ink); border-radius: 22px; box-shadow: none; font-weight: 500; }
  @F .mchip[aria-pressed='true'], @F .chips button[aria-pressed='true'], @F .durs button[aria-pressed='true'], @F .ampm button[aria-pressed='true'], @F .allday[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); border-style: solid; box-shadow: none; font-weight: 600; }
  @F .dialbox { background: rgba(38,39,43,.06); border-radius: 8px; }
  @F .drums { background: var(--paper); border-radius: 4px; box-shadow: inset 0 0 0 2px var(--ink); }
  /* medication: who gave it is a choice (an outline); adding to the record is the one filled action */

  /* header */
  @F .clock { display: grid; grid-template-columns: auto 1fr; column-gap: 14px; align-items: center; }
  @F .clock .aclock { grid-row: 1 / span 2; filter: drop-shadow(0 3px 4px rgba(0,0,0,.22)); }
  @F .clock .hm { font-weight: 700; font-size: 50px; }
  @F .cap { background: var(--paper); -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.18); rotate: calc(var(--tilt, 1) * -1.2deg); font-weight: 600; }
  @F .cap.hot { background: var(--danger); color: #fff; animation: fhHot 1.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @F .cap[data-warm] { background: #f5b301; color: #2a1a00; }
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
  @F .col { position: relative; border-radius: 2px; padding: 24px 8px 8px; background: var(--note); box-shadow: 0 6px 8px rgba(0,0,0,.18); rotate: calc(var(--tilt, 1) * -.7deg); transition: background-color var(--m-5, 900ms) ease; }
  @F .col:nth-child(even) { rotate: calc(var(--tilt, 1) * .8deg); }
  @F .col:nth-child(3n) { rotate: calc(var(--tilt, 1) * -.3deg); }
  @F .col.today { background: var(--note-today); box-shadow: 0 9px 14px rgba(0,0,0,.24); rotate: calc(var(--tilt, 1) * -1deg); }
  @F .col::before { content: ''; position: absolute; top: 4px; left: 50%; margin-left: -9px; width: 18px; height: 18px; border-radius: 50%; background: #8b949a; box-shadow: 0 2px 3px rgba(0,0,0,.3), inset 0 -3px 0 rgba(0,0,0,.18); }
  @F .col.today::before { background: var(--danger); width: 22px; height: 22px; margin-left: -11px; top: 2px; }
  @F .num { font-weight: 700; }
  @F .today .num { background: var(--ink); color: var(--note-today); }
  @F .ev { background: transparent; border-left: 5px solid var(--c); border-radius: 0; padding: 1px 2px 3px 8px; gap: 1px; }
  @F .ev .t { font-size: 14px; font-weight: 600; font-variant-numeric: tabular-nums; }
  @F .ev .content { font-family: var(--font-content); font-weight: var(--content-weight); font-size: var(--content-size); line-height: 1.12; color: var(--content-ink); hyphens: none; -webkit-line-clamp: 4; } @F .col[data-tight] .ev .content { -webkit-line-clamp: 2; }
  @F .ev .w { font-size: 14px; font-weight: 500; }
  @F .ev.next { box-shadow: none; }
  /* what is over is written in pencil: paler ink and a paler stripe, never a faded note */
  @F .ev.past, @F .dayrow.past { opacity: 1; border-left-color: color-mix(in srgb, var(--c) 45%, transparent); }
  @F .ev.past .t, @F .ev.past .w, @F .ev.past .content, @F .dayrow.past .content, @F .dayrow.past .muted { color: var(--ink-done); }
  /* highlighter: a stroke behind the words only, never out to the edge of the note */
  @F .ev.next .content { text-decoration: underline rgba(255,255,255,.8); text-decoration-thickness: .5em; text-underline-offset: -.34em; text-decoration-skip-ink: none; }
  @F .more { background: transparent; text-decoration: underline; font-weight: 500; }
  /* month: light paper squares, today the one bright note */
  @F .cell { border-radius: 2px; background: var(--paper); box-shadow: 0 1px 3px rgba(0,0,0,.16); }
  @F .cell.out { background: color-mix(in srgb, var(--paper) 50%, transparent); box-shadow: none; }
  @F .cell.today { background: var(--note-today); box-shadow: 0 0 0 2.5px var(--ink); }
  /* day view: every event is a note of its own under a pin */
  @F .dayrow { position: relative; background: var(--note); border-left-width: 10px; border-radius: 2px; box-shadow: 0 4px 6px rgba(0,0,0,.16); rotate: calc(var(--tilt, 1) * -.2deg); }
  @F .dayrow:nth-child(even) { rotate: calc(var(--tilt, 1) * .22deg); }
  @F .dayrow::before { content: ''; position: absolute; top: 5px; right: 14px; width: 14px; height: 14px; border-radius: 50%; background: #8b949a; box-shadow: 0 2px 3px rgba(0,0,0,.3), inset 0 -2px 0 rgba(0,0,0,.18); }
  @F .dayrow.now, @F .dayrow.next { background: var(--note-today); }
  @F .dayrow.now::before, @F .dayrow.next::before { background: var(--danger); }
  @F .dayrow .content { font-family: var(--font-content); font-weight: var(--content-weight); }

  /* side cards */
  @F .np { background: #2f2a26; border-radius: 10px; --ink: #fff; --ink2: #e2dbcf; color: #fff; box-shadow: 0 5px 8px rgba(0,0,0,.25); }
  @F .np .np-row { background: #fff6dc; color: #26272b; --ink2: #4c4a45; border-radius: 4px; padding: 6px 10px; }
  /* on a dark card a round button is the look's blue action with a white icon, never paper on paper */
  @F .np .round, @F .np .primary { background: var(--primary); color: var(--on-primary); box-shadow: 0 4px 0 var(--primary-edge); }
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
  @F .dock .item { font-weight: 600; font-size: 15px; height: 80px; gap: 7px; border-radius: 0; }
  @F .dock .item svg.i { width: 52px; height: 52px; padding: 13px; border-radius: 50%; background: var(--magnet); color: var(--ink); stroke-width: 2; box-shadow: 0 4px 5px rgba(0,0,0,.28), inset 0 -4px 0 rgba(0,0,0,.14); }
  @F .dock .item[data-nav='lights-on'] svg.i { background: #ffd75a; }
  @F .dock .item[data-nav='lights-off'] svg.i { background: #4a4f55; color: #fff; }
  @F .dock .item[data-nav='dinner'] svg.i { background: var(--danger); color: #fff; }
  @F .dock .item[aria-current='page'] { background: transparent; }
  @F .dock .item[aria-current='page'] svg.i { background: var(--ink); color: var(--paper); box-shadow: 0 0 0 3px var(--paper), 0 0 0 5.5px var(--ink); }
  @F .dock .kidbtn .avatar { box-shadow: 0 4px 5px rgba(0,0,0,.28); }
  @F .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @F .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 2px var(--paper), 0 0 0 4.5px var(--kidc), 0 -3px 6px 3px rgba(0,0,0,.14); }
  @F .dock .sep { background: transparent; margin: 0 2px; }
  /* a portrait tablet with all thirteen magnets (the morning): smaller words and tighter gaps, so the row fits and no two labels touch */
  @F[data-n3] .dock { gap: 4px; }
  @F[data-n3] .dock .item { font-size: 14px; }
  @F .tcard { position: relative; border-radius: 4px; background: var(--paper); box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  /* the chosen look: a ring and a tick, never a fill */
  @F .tcard[aria-pressed='true'] { background: var(--paper); color: var(--ink); box-shadow: 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.2); }
  @F .tcard[aria-pressed='true']::after { content: '✓'; position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; border-radius: 50%; background: var(--ink); color: var(--paper); font-size: 17px; font-weight: 700; line-height: 30px; text-align: center; box-shadow: 0 0 0 3px var(--paper); }

  /* lists: lined paper, a tick box you could draw, print by default */
  @F .row { background: transparent; border-radius: 0; border-bottom: 1.5px solid var(--rule); min-height: 52px; padding-top: 6px; padding-bottom: 6px; }
  @F .check { width: 32px; height: 32px; border-radius: 5px 9px 6px 10px; border: 2.5px solid var(--ink); background: var(--paper); }
  @F .done .check { background: var(--paper); border-color: var(--ink); color: var(--ok); transform: none; font-size: 34px; font-weight: 700; overflow: visible; }
  @F .done .check svg { width: 28px; height: 28px; stroke-width: 4; }
  @F .row .content { font-family: var(--font-content); font-weight: var(--content-weight); font-size: var(--content-size-lg); line-height: 1.1; }
  @F .row.now { background: transparent; }
  @F .row.now .content { text-decoration: underline var(--note-today); text-decoration-thickness: .5em; text-underline-offset: -.34em; text-decoration-skip-ink: none; }
  @F .big .check { width: 48px; height: 48px; }
  @F .big.done .check { font-size: 50px; }
  @F .row.big .content { font-size: 30px; }
  @F .row.big { background: var(--note); padding-left: 12px; }
  @F .field { background: transparent; box-shadow: none; border-bottom: 3px dashed var(--ink); border-radius: 0; font-weight: 600; font-size: 28px; padding: 0 6px; min-width: 0; }
  /* a text field with the keyboard's focus shows the ring every other control has (the look's underline has no shadow to carry it) */
  @F .field:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
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
  /* the red margin runs down the edge of the page, clear of every word */
  @F .jobs { background: linear-gradient(90deg, transparent 0 8px, var(--margin) 8px 10px, transparent 10px) 0 0 / 100% 100% no-repeat, var(--glass); }
  @F .sec h2 { font-size: 30px; line-height: 1; padding: 0 4px; }
  @F .sec span { font-weight: 500; font-size: 14px; }
  @F .plus { font-weight: 600; }
  @F .play { box-shadow: 0 3px 0 var(--primary-edge); }
  @F .later { background: var(--chip-soft); border-radius: 8px; font-weight: 500; }
  @F .side { border-radius: 0; overflow: visible; padding: 2px 4px; }
  @F .side > .card { rotate: calc(var(--tilt, 1) * .6deg); }
  @F .tabs { background: transparent; border-radius: 0; padding: 0; }
  @F .rw { background: var(--chip-soft); color: var(--ink); border-radius: 8px; }
  @F .rw .n { font-weight: 500; font-size: 16px; }
  @F .rw button { font-weight: 600; background: #f5b301; color: #26272b; box-shadow: 0 3px 0 #a87400; }
  @F .rw button.save { background: var(--chip); color: var(--ink2); box-shadow: none; }
  @F .pic { border-radius: 3px; background: var(--paper); box-shadow: 0 4px 6px rgba(0,0,0,.16); rotate: calc(var(--tilt, 1) * -1deg); }
  @F .pic:nth-child(even) { rotate: calc(var(--tilt, 1) * 1.2deg); }
  @F .pic.done { background: color-mix(in srgb, var(--ok) 24%, var(--paper)); }
  @F .wk { font-size: 15px; }

  /* groceries: a shopping-list pad and chunky keys */
  @F .list.glass { background: linear-gradient(90deg, transparent 0 10px, var(--margin) 10px 12px, transparent 12px) 0 0 / 100% 100% no-repeat, var(--glass); rotate: calc(var(--tilt, 1) * -.5deg); }
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
  @F .stage .round, @F .stage .pill { background: var(--paper); color: #26272b; }
  @F .spk { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .spk.focus { background: var(--note-today); box-shadow: 0 0 0 3px var(--ink), 0 5px 8px rgba(0,0,0,.2); }
  @F .spk.inmix { background: var(--note); box-shadow: 0 0 0 3px var(--ok); }
  /* the house: every room is a square of paper with a marker line drawn round it */
  @F .mroom { background: var(--paper); border-radius: 3px 10px 4px 12px; box-shadow: inset 0 0 0 3px var(--ink), 0 5px 7px rgba(0,0,0,.18); }
  @F .mstairs { border-radius: 5px; box-shadow: inset 0 0 0 3px var(--ink); }
  @F .mzone[data-focus] { background: var(--note); box-shadow: inset 0 0 0 3px var(--ink); }
  @F .pool { left: 3px; right: 3px; bottom: 3px; border-radius: 0 0 8px 2px; background: repeating-linear-gradient(115deg, transparent 0 8px, color-mix(in srgb, var(--c) 34%, transparent) 8px 10px), color-mix(in srgb, var(--c) 30%, var(--paper)); }
  @F .mzone[data-playing] .pool { animation: scribble .7s steps(2, jump-none) infinite; animation-iteration-count: var(--loops, infinite); }
  @F .puck { border-color: var(--magnet); box-shadow: 0 4px 0 #b9b2a2, 0 6px 8px rgba(0,0,0,.25); }
  @F .mshelf { background: var(--note); border-radius: 4px; transform: rotate(.5deg); box-shadow: 0 5px 8px rgba(0,0,0,.16); }
  @F .wholeh { border-radius: 6px; border-color: var(--ink2); }
  @F .viewbtn { border-radius: 6px; background: var(--magnet); box-shadow: 0 3px 0 #b9b2a2, 0 4px 5px rgba(0,0,0,.18); }
  @F .vcard { border-radius: 4px; background: var(--note); box-shadow: 0 3px 5px rgba(0,0,0,.16); }
  @F .vcard[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); }
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
  @F .slot { background: var(--ink); --rail-w: 4px; } /* music polish: the rail's thickness is a token now (one slider family), not a width and an offset */
  @F .jog { background: var(--magnet); box-shadow: inset 0 0 0 3px var(--ink), 0 6px 0 #b9b2a2; }
  @F .mpad { border-radius: 8px; box-shadow: inset 0 0 0 3px var(--ink), 0 6px 0 rgba(0,0,0,.28); }
  @F .dart { border-radius: 4px; box-shadow: 0 0 0 3px var(--ink), 0 5px 6px rgba(0,0,0,.2); }
  @F .cab { background: var(--paper); border-radius: 6px; box-shadow: inset 0 0 0 3px var(--ink), 0 4px 6px rgba(0,0,0,.2); } /* music polish: speaker tiles are the look's own paper, with ink text (was a dark slab with white text) */
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
  @F .st { padding: 5px 6px 7px; padding-right: max(6px, var(--st-pr, 0px)); background: #fff; border-radius: 2px; box-shadow: 0 5px 8px rgba(0,0,0,.22); font-family: var(--font-content); font-weight: var(--content-weight); color: #26272b; }
  @F .pickrow { background: var(--paper); border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .banner { background: var(--note-today); border-radius: 2px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }

  /* home: every room is a note; a room with a light on is the bright one. The notes sit straight on the door, with no slab behind them */
  @F .rooms { background: transparent; box-shadow: none; padding-left: 4px; padding-right: 4px; }
  @F .room { background: var(--note); border-radius: 2px; box-shadow: 0 4px 6px rgba(0,0,0,.16); rotate: calc(var(--tilt, 1) * -.5deg); }
  @F .room.lit { background: var(--note-today); box-shadow: 0 7px 10px rgba(0,0,0,.2); rotate: calc(var(--tilt, 1) * .5deg); }
  @F .rh h2 { font-size: 28px; line-height: 1; }
  @F .dev { background: transparent; border-radius: 0; border-bottom: 1.5px solid color-mix(in srgb, var(--ink) 18%, transparent); padding-left: 2px; padding-right: 2px; }
  @F .dicon { background: var(--magnet); color: var(--ink); box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 -2px 0 rgba(0,0,0,.12); }
  @F .dev.on .dicon { background: #ffd23f; color: #5b3a00; box-shadow: 0 2px 3px rgba(0,0,0,.25), inset 0 -2px 0 rgba(0,0,0,.14), 0 0 0 4px rgba(255,210,63,.4); }
  @F .toggle { background: var(--paper); box-shadow: inset 0 0 0 2px var(--ink); }
  @F .toggle[aria-checked='true'], @F [aria-checked='true'] > .toggle { background: var(--ok); }
  @F .scene { background: var(--magnet); border-radius: 10px; box-shadow: 0 4px 0 #b9b2a2, 0 6px 6px rgba(0,0,0,.18); font-weight: 600; }

  /* doodle: paint-pot magnets, and finished pictures taped up as polaroids */
  @F .pad { border-radius: 2px; }
  @F .ink { box-shadow: 0 3px 0 rgba(0,0,0,.22), inset 0 -3px 0 rgba(0,0,0,.14), inset 0 0 0 1.5px rgba(0,0,0,.5); }
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
  @F .leave { font-family: 'Fredoka', sans-serif; font-weight: 700; }

  /* night: the kitchen clock keeps watch */
  @F .night .big { font-weight: 400; }
  /* the screensaver: the time is a note under a magnet, a little crooked */
  @F .artm:not([data-night]) { --ink: #23262b; --ink2: #4a4f57; --ink3: #7a808a; --track: rgba(35,38,43,.2); --accent: #d6453d; }
  @F .artm:not([data-night]) .aplate { background: #fffdf6; color: #23262b; border: 0; border-radius: 5px; -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: 0 12px 22px rgba(0,0,0,.34); rotate: -1.4deg; }
  @F .artm .atime .big { font-weight: 600; }
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

  /* phone: the dock is a strip of paper along the bottom of the door; the page ends above it, and the strip fades at the right while there is more to slide to */
  @F[data-phone] .fh { padding-bottom: calc(108px + env(safe-area-inset-bottom, 0px)); }
  @F[data-phone] .dock { left: 0; right: 0; bottom: 0; gap: 4px; padding: 8px 34px calc(8px + env(safe-area-inset-bottom, 0px)) 10px; border-radius: 0; background: var(--paper); border-top: 2px solid var(--ink); box-shadow: 0 -6px 14px rgba(0,0,0,.14); }
  @F[data-phone] .dock::after { content: ''; position: fixed; right: 0; bottom: 0; width: 40px; height: calc(84px + env(safe-area-inset-bottom, 0px)); background: linear-gradient(to right, transparent, var(--paper) 85%); pointer-events: none; }
  @F[data-phone] .dock .item { min-width: 64px; height: 68px; font-size: 14px; }
  @F[data-phone] .dock .item svg.i { width: 44px; height: 44px; padding: 10px; }
`;

const ORBIT = `
  /* a ring always means time or progress · ink-filled = an action · yellow = now · mint = done */
  @O .fh { --ring-halo: #0a0f1e; --pg-from: scale(calc(1 - .01 * var(--m-d, 1))); font-family: 'Outfit', 'Avenir Next', 'Segoe UI', sans-serif; font-weight: 400; background: var(--ground) repeating-radial-gradient(circle at 62px 68px, transparent 0 89px, rgba(255,255,255,.04) 89px 90px); }
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
  @O .clock .hm { font-weight: 400; font-size: 52px; letter-spacing: -.02em; }
  /* the header is drawn a little tighter than the base (smaller rings, closer avatars) so an alert chip has room for all of its words */
  @O .cap { background: var(--glass); -webkit-backdrop-filter: none; backdrop-filter: none; font-weight: 500; max-width: 100%; }
  @O .cap.hot { background: var(--danger); color: #0a0f1e; border-color: var(--danger); animation: fhHot 1.2s ease-in-out infinite; animation-iteration-count: var(--loops, infinite); }
  @O .cap[data-warm] { background: #f5b301; color: #2a1a00; border-color: #f5b301; }
  @O .badge { background: rgba(255,224,138,.18); font-weight: 600; }
  @O .presence { background: transparent; border-color: transparent; gap: 2px; padding: 7px 0; }
  @O .right { gap: 6px; }
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
  @O .today .num { background: var(--accent); color: #0a0f1e; font-weight: 600; font-size: 15px; }
  @O .ev { background: color-mix(in srgb, var(--c) 15%, transparent); border-left: 4px solid var(--c); border-radius: 10px; padding: 8px 9px 8px 10px; }
  @O .ev .t { font-weight: 500; }
  @O .ev .content { font-weight: 500; }
  @O .ev .w { font-weight: 400; font-size: 14px; }
  @O .ev.next { box-shadow: 0 0 0 1.5px var(--accent); }
  /* what is over keeps its outline and loses its fill; the words stay readable */
  @O .ev.past, @O .dayrow.past { opacity: 1; background: transparent; border-left-color: color-mix(in srgb, var(--c) 50%, transparent); }
  @O .ev.past { box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .ev.past .t, @O .ev.past .w, @O .ev.past .content, @O .dayrow.past .content, @O .dayrow.past .muted { color: var(--ink-done); }
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
  @O .meter > div { background: var(--accent); }

  /* dock: a line of rings */
  @O .dock { background: transparent; border-color: transparent; gap: 6px; padding: 0; }
  @O .dock .item { font-size: 15px; font-weight: 500; color: var(--ink); height: 78px; gap: 5px; border-radius: 0; }
  @O .dock .item svg.i { width: 52px; height: 52px; padding: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--ctl-line); color: var(--ink); stroke-width: 1.6; }
  @O .dock .item[aria-current='page'] { background: transparent; color: var(--ink); font-weight: 600; }
  @O .dock .item[aria-current='page'] svg.i { background: var(--accent); color: #0a0f1e; box-shadow: none; }
  @O .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @O .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 2px #0a0f1e, 0 0 0 4.5px var(--accent); }
  @O .dock .sep { background: rgba(255,255,255,.18); }
  @O[data-n3] .dock { gap: 4px; }
  @O[data-n3] .dock .item { font-size: 14px; }

  /* lists */
  @O .row { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.14); }
  @O .check { border-width: 2.5px; border-color: var(--ink2); }
  @O .done .check { background: var(--ok); border-color: var(--ok); color: #0a0f1e; }
  @O .row .content { font-weight: 400; }
  @O .row.now { background: color-mix(in srgb, var(--accent) 9%, transparent); border-radius: 14px; box-shadow: inset 0 0 0 2px var(--accent); }
  @O .row.big { background: color-mix(in srgb, var(--accent) 12%, transparent); border-radius: 22px; border-bottom: 0; }
  @O .field { background: transparent; box-shadow: none; border-bottom: 2px solid var(--ctl-line); border-radius: 0; font-weight: 400; font-size: 28px; padding: 0 4px; min-width: 0; }
  /* a text field with the keyboard's focus shows the ring every other control has (the look's underline has no shadow to carry it) */
  @O .field:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  @O .key { background: var(--chip); box-shadow: inset 0 0 0 1.5px var(--ctl-line); border-radius: 999px; font-weight: 400; }
  /* outlined controls light their line when pressed; they never shrink. Shift is a ring, and yellow only while it is latched */
  @O .key:active { background: var(--chip-strong); transform: none; box-shadow: inset 0 0 0 2px var(--accent); }
  @O .key[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: none; font-weight: 600; }
  @O .tabs { background: transparent; }
  @O .ctab { background: var(--ground, #0a0f1e); color: var(--ink); box-shadow: inset 0 0 0 2px var(--c); }
  @O .ctab[aria-pressed='true'] { background: color-mix(in srgb, var(--c) 22%, var(--ground, #0a0f1e)); box-shadow: inset 0 0 0 3px var(--c); }
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
  @O .jobs .done .check { border-color: var(--ok); }
  @O .pic.now { box-shadow: 0 0 0 3px var(--accent); }
  @O .sec { margin-top: 12px; }
  @O .sec h2 { font-size: 17px; font-weight: 600; color: var(--ink); }
  @O .sec span { font-weight: 400; }
  @O .plus { background: var(--track); color: var(--ink); box-shadow: none; font-weight: 600; }
  @O .later { background: var(--chip-soft); font-weight: 400; }
  @O .rw { background: transparent; color: var(--ink); border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.14); padding-left: 2px; }
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
  @O .toggle[aria-checked='true'], @O [aria-checked='true'] > .toggle { background: var(--accent); box-shadow: none; }
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
  @O .leave { font-family: 'Outfit', sans-serif; font-weight: 400; }

  /* music: rooms are cells on the ring; the one you control carries the 'now' yellow */
  @O .spk { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .spk.focus { background: color-mix(in srgb, var(--accent) 8%, transparent); box-shadow: inset 0 0 0 2px var(--accent); }
  @O .spk.inmix { box-shadow: inset 0 0 0 2px var(--accent); }
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
  @O .vcard[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: none; }
  @O .dplate { fill: transparent; stroke: var(--glass-line); stroke-width: 1.5; }
  @O .bigdial, @O .desk, @O .rig, @O .vscene { --stream: var(--accent); }
  @O .dtrack { stroke: rgba(255,255,255,.14); stroke-width: 10; }
  @O .dknob { fill: var(--ground); stroke-width: 3; }
  @O .dcover { box-shadow: 0 0 0 1.5px var(--ink); }
  @O .dcard, @O .tuner { background: transparent; box-shadow: inset 0 0 0 1px var(--ctl-line); }
  @O .desk { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .sname { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); font-weight: 500; }
  @O .lamp { background: transparent; color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .lamp[aria-pressed='true'] { background: var(--accent); color: #0a0f1e; box-shadow: none; }
  @O .strip[data-live] .fcap { background: var(--c); box-shadow: none; }
  @O .fcap { background: var(--ground); box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .slot { --rail-w: 2px; } /* music polish: as above */
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
  @O .aname { background: var(--ground); box-shadow: inset 0 0 0 1px var(--glass-line); } /* music polish: opaque, so an orbit never runs through a room's name */
  @O .join { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); }
  @O .join[aria-pressed='true'] { background: var(--accent); color: #0a0f1e; box-shadow: none; }
  @O .hit { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.12); }
  @O .hit[aria-pressed='true'] { background: color-mix(in srgb, var(--accent) 10%, transparent); box-shadow: none; border-radius: 12px; }
  @O .st { padding: 5px 6px 7px; padding-right: max(6px, var(--st-pr, 0px)); background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); font-weight: 500; }
  @O .st.on { box-shadow: inset 0 0 0 2px var(--accent); }
  @O .pickrow { background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .banner { background: color-mix(in srgb, var(--accent) 12%, transparent); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--accent) 50%, transparent); }

  /* day view: the day as a dial, the list beside it */
  @O .dayview { gap: 28px; }
  @O .dayart { padding: 0 14px; }

  /* night: only the dial and the time */
  @O .night .big { font-weight: 300; }
  /* the screensaver: an instrument panel, thin and exact */
  @O .artm .aplate { border-radius: 26px; background: rgba(6,10,20,.5); border-color: rgba(255,255,255,.28); }
  @O .artm .atime .big { font-weight: 300; }
  /* weather: instruments. The sky is drawn in line, temperature is a trace, the week is a set of gauges */
  @O .wtemp { font-weight: 300; font-size: 76px; letter-spacing: -.04em; }
  @O .wtip { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); border-radius: 999px; padding: 10px 16px; font-weight: 500; }
  @O .wfact { background: transparent; }
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

  /* switches: on is yellow (mint is kept for things that are done) */
  @O .opt[aria-checked='true'] .sw { background: var(--accent); }
  /* the chosen look: a ring and a tick, never a fill */
  @O .tcard { position: relative; background: transparent; box-shadow: inset 0 0 0 1px var(--glass-line); }
  @O .tcard[aria-pressed='true'] { background: transparent; color: var(--ink); box-shadow: 0 0 0 3px var(--accent); }
  @O .tcard[aria-pressed='true']::after { content: '✓'; position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; border-radius: 50%; background: var(--accent); color: #0a0f1e; font-size: 17px; font-weight: 700; line-height: 30px; text-align: center; box-shadow: 0 0 0 3px #172039; }
  /* sheets: chips are rings, the chosen one is yellow; who gave a medicine is a ring too, so adding to the record is the one filled action */
  @O .mchip, @O .chips button, @O .durs button, @O .ampm button, @O .allday { background: transparent; box-shadow: inset 0 0 0 1.5px var(--ctl-line); font-weight: 500; }
  @O .mchip[aria-pressed='true'], @O .chips button[aria-pressed='true'], @O .durs button[aria-pressed='true'], @O .ampm button[aria-pressed='true'], @O .allday[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: none; font-weight: 600; }

  /* phone, and anything narrower than 700 px: the day ring sits above the list instead of beside it */
  @O[data-phone] .dayview, @O<700 .dayview { flex-direction: column; align-items: stretch; gap: 16px; }
  @O[data-phone] .dayart, @O<700 .dayart { min-width: 0; padding: 0; align-self: center; }
  @O[data-phone] .dayview .ddial, @O<700 .dayview .ddial { width: min(calc(72vw / var(--z, 1)), 300px); height: auto; }
  @O[data-phone] .dayview .dh, @O<700 .dayview .dh { font-size: 10.5px; }
  @O[data-phone] .dayview .dp, @O<700 .dayview .dp { font-size: 9.5px; translate: 0 2.5px; }
  @O[data-phone] .dayview .dayrow, @O<700 .dayview .dayrow { min-width: 0; }
  /* phone: the dock is a solid bar along the bottom; the page ends above it, and the bar fades at the right while there is more to slide to */
  @O[data-phone] .fh { padding-bottom: calc(108px + env(safe-area-inset-bottom, 0px)); }
  @O[data-phone] .dock { left: 0; right: 0; bottom: 0; gap: 4px; padding: 8px 34px calc(8px + env(safe-area-inset-bottom, 0px)) 10px; border-radius: 0; background: rgba(10,15,30,.92); border: 0; border-top: 1px solid var(--glass-line); }
  @O[data-phone] .dock::after { content: ''; position: fixed; right: 0; bottom: 0; width: 40px; height: calc(84px + env(safe-area-inset-bottom, 0px)); background: linear-gradient(to right, transparent, #0a0f1e 85%); pointer-events: none; }
  @O[data-phone] .dock .item { min-width: 64px; height: 68px; font-size: 14px; }
  @O[data-phone] .dock .item svg.i { width: 44px; height: 44px; padding: 11px; }
`;

const SPORTS = `
  /* Home Ground. Round things can be pressed; square things only tell you something.
     hero = hi-vis fill on a 4 px step · action = chalk pill, 2 px edge and step · choice = flat · selected = inverted with a hi-vis bar · now = pennant and heavy edge · done = green tick */
  @S .fh { font-family: 'Inter', system-ui, sans-serif; font-weight: 500; background: var(--flood), var(--ground); transition: background-color var(--m-5, 900ms) ease, color var(--m-4, 400ms) ease; }
  @S .fh::before { display: none; }
  /* calm mode: the mown stripes lose their contrast, for the plainest possible calendar */
  @S .fh[data-calm] { --mow1: var(--mow2); }
  @S h1, @S h2 { font-family: 'Bricolage Grotesque', 'Inter', sans-serif; letter-spacing: -.015em; }
  @S .display { font-family: 'Outfit', 'Inter', sans-serif; letter-spacing: 0; font-variant-numeric: tabular-nums; }
  @S .label { font-family: 'Bricolage Grotesque', 'Inter', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: .09em; color: var(--ink2); }
  /* windows: boards on the clubhouse wall, with one chalk corner arc */
  @S .glass { background: radial-gradient(circle at 100% 100%, transparent 0 21px, var(--track) 21.5px 23.5px, transparent 24px) right bottom / 26px 26px no-repeat, var(--panel); -webkit-backdrop-filter: none; backdrop-filter: none; border: 1.5px solid var(--line); border-radius: 14px; box-shadow: var(--shadow); }
  @S .card { border-radius: 14px; }
  /* actions */
  @S .pill, @S .round, @S .quick { background: var(--panel); color: var(--ink); border: 0; box-shadow: inset 0 0 0 2px var(--ink), 0 2px 0 var(--ink); font-weight: 700; font-size: 16px; }
  @S .round { border-radius: 50%; }
  @S .quick { border-radius: 999px; min-height: 44px; font-size: 15px; white-space: nowrap; }
  @S .pill.primary, @S .primary, @S .lead { background: var(--primary); color: var(--on-primary); box-shadow: inset 0 0 0 2px var(--edge), 0 4px 0 var(--edge); font-weight: 800; }
  @S .lead { font-size: 18px; padding: 0 24px; }
  @S .tap:active { opacity: 1; }
  @S .pill.tap:active, @S .round.tap:active, @S .quick.tap:active { transform: translateY(calc(2px * var(--m-d, 1))); box-shadow: inset 0 0 0 2px var(--ink); }
  @S .lead.tap:active, @S .primary.tap:active { transform: translateY(calc(4px * var(--m-d, 1))) scale(calc(1 + .02 * var(--m-d, 1)), calc(1 - .04 * var(--m-d, 1))); box-shadow: inset 0 0 0 2px var(--edge); opacity: 1; }
  /* disabled: dashed, no step, a padlock; the reason stays in words beside it */
  @S .pill[disabled], @S .lead[disabled], @S .quick[disabled], @S .mchip[disabled] { opacity: 1; background: transparent; color: var(--ink3); outline: 2px dashed var(--ink3); outline-offset: -2px; }
  @S .pill[disabled]::before, @S .lead[disabled]::before { content: ''; width: 16px; height: 16px; flex-shrink: 0; background: currentColor; -webkit-mask: var(--s-lock) center / contain no-repeat; mask: var(--s-lock) center / contain no-repeat; }
  /* busy: a diagonal hatch while Home Assistant answers */
  @S [data-busy] { opacity: 1; background-image: repeating-linear-gradient(135deg, var(--panel2) 0 8px, var(--panel) 8px 16px); }
  /* failed: a training cone and a red edge, with the way out in words */
  @S .calfail, @S .remfail { color: var(--danger); }
  @S .remfail { padding: 8px 10px 8px 38px; border-radius: 10px; background: var(--s-cone) 9px 9px / 22px 22px no-repeat, var(--danger-wash); box-shadow: inset 0 0 0 2px var(--danger); }
  /* choices: flat, no step; the chosen one is inverted with a hi-vis bar */
  @S .seg { height: 52px; padding: 3px; border-radius: 28px; background: var(--panel); box-shadow: inset 0 0 0 2px var(--ink); gap: 2px; }
  @S .seg button { height: 46px; border-radius: 24px; font-weight: 600; font-size: 16px; color: var(--ink); }
  @S .seg button[aria-pressed='true'] { background: var(--sel); color: var(--on-sel); box-shadow: none; font-weight: 700; }
  @S .mchip, @S .chips button, @S .durs button, @S .ampm button, @S .allday { background: var(--panel2); box-shadow: inset 0 0 0 1.5px var(--line); font-weight: 600; font-size: 16px; }
  @S .mchip[aria-pressed='true'], @S .chips button[aria-pressed='true'], @S .durs button[aria-pressed='true'], @S .ampm button[aria-pressed='true'], @S .allday[aria-pressed='true'] { background: var(--sel); color: var(--on-sel); box-shadow: none; font-weight: 700; }
  @S .tabs { background: transparent; border-radius: 0; gap: 8px; padding: 0; }
  @S .tab { border-radius: 10px 10px 4px 4px; background: var(--panel2); box-shadow: inset 0 0 0 1.5px var(--line); font-weight: 600; font-size: 16px; }
  @S .tab[aria-pressed='true'], @S .tab[aria-selected='true'] { background: var(--sel); color: var(--on-sel); box-shadow: none; font-weight: 700; }
  /* lists: a tick box; done is green and struck through; the current row carries the pennant */
  @S .row { border-radius: 10px; }
  @S .check { border-radius: 8px; border: 2px solid var(--ink); background: var(--panel); }
  @S .done .check { background: var(--ok); border-color: var(--ok); color: var(--on-ok); }
  @S .field { background: transparent; box-shadow: none; border-radius: 0; border-bottom: 2.5px solid var(--ink); font-weight: 700; min-width: 0; }
  /* a text field with the keyboard's focus shows the ring every other control has (the look's underline has no shadow to carry it) */
  @S .field:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
  /* keys: bench-seat tiles that sink when pressed */
  @S .key { background: var(--panel2); border-radius: 8px; box-shadow: inset 0 0 0 1.5px var(--line), inset 0 -3.5px 0 var(--ink3); font-weight: 700; }
  @S .key:active { transform: translateY(calc(2px * var(--m-d, 1))); box-shadow: inset 0 0 0 1.5px var(--line); background: var(--panel); }
  @S .key[aria-pressed='true'] { background: var(--sel); color: var(--on-sel); box-shadow: none; }
  /* meters: a ball on the touchline */
  @S .meter { height: 5px; border-radius: 3px; background: var(--track); overflow: visible; }
  @S .meter > div { position: relative; height: 5px; min-width: 1px; background: var(--ink); border-radius: 3px; }
  @S .meter > div::after { content: ''; position: absolute; right: -10px; top: -8px; width: 20px; height: 20px; background: var(--s-ball) center / contain no-repeat; }
  /* bibs: a person's colour is always worn with their initial; under lights the bib gets a chalk outline */
  @S .init:not(.avatar) { position: relative; z-index: 0; min-width: 22px; width: 22px; height: 22px; padding: 0 0 2px; align-items: flex-end; border-radius: 0; background: transparent; font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 800;
    filter: drop-shadow(.8px 0 0 var(--bib-edge)) drop-shadow(-.8px 0 0 var(--bib-edge)) drop-shadow(0 .8px 0 var(--bib-edge)) drop-shadow(0 -.8px 0 var(--bib-edge)); }
  @S .init:not(.avatar)::before { content: ''; position: absolute; inset: 0; z-index: -1; background: var(--c, var(--p-family)); -webkit-mask: var(--s-bib) center / contain no-repeat; mask: var(--s-bib) center / contain no-repeat; }
  /* the small bib is the full 22 px one: its initial is never under 12 px */
  @S .init.sm:not(.avatar) { min-width: 22px; width: 22px; height: 22px; padding: 0 0 2px; font-size: 12px; }
  @S .presence .avatar { position: relative; z-index: 0; width: 28px; height: 28px; padding: 0 0 2px; align-items: flex-end; border-radius: 0; background: transparent; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 800;
    filter: drop-shadow(.8px 0 0 var(--bib-edge)) drop-shadow(-.8px 0 0 var(--bib-edge)) drop-shadow(0 .8px 0 var(--bib-edge)) drop-shadow(0 -.8px 0 var(--bib-edge)); }
  @S .presence .avatar::before { content: ''; position: absolute; inset: 0; z-index: -1; background: var(--c, var(--p-family)); -webkit-mask: var(--s-bib) center / contain no-repeat; mask: var(--s-bib) center / contain no-repeat; }
  @S .presence .avatar.away { background: var(--s-away) center / contain no-repeat; color: var(--ink); filter: none; outline: 0; opacity: 1; }
  @S .presence .avatar.away::before { display: none; }

  /* header: the scoreboard only ever shows the time */
  @S .clock { display: grid; grid-template-columns: auto 1fr; column-gap: 12px; align-items: center; align-content: center; }
  @S .clock .sboard { grid-row: 1 / span 2; }
  @S .clock .hm { display: none; }
  @S .sboard { --u: var(--sz, 46px); display: inline-flex; align-items: center; gap: calc(var(--u) * .075); height: calc(var(--u) * 1.36); padding: 0 calc(var(--u) * .2); border-radius: calc(var(--u) * .22); background: var(--board); color: var(--board-ink); box-shadow: 0 0 0 1.5px var(--board-line); flex-shrink: 0; line-height: 1; }
  @S .dg { position: relative; width: calc(var(--u) * .667); height: var(--u); border-radius: calc(var(--u) * .11); background: var(--tile); box-shadow: inset 0 0 0 1px rgba(255,255,255,.1); font-family: 'Outfit', sans-serif; font-weight: 700; font-size: calc(var(--u) * .78); line-height: var(--u); text-align: center; font-variant-numeric: tabular-nums; }
  @S .dg::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 1.5px; background: rgba(0,0,0,.55); box-shadow: 0 1px 0 rgba(255,255,255,.07); }
  @S .colon { width: calc(var(--u) * .2); height: calc(var(--u) * .5); background: radial-gradient(circle at 50% 14%, var(--board-ink) 0 calc(var(--u) * .058), transparent calc(var(--u) * .07)), radial-gradient(circle at 50% 86%, var(--board-ink) 0 calc(var(--u) * .058), transparent calc(var(--u) * .07)); }
  @S .dball { display: inline-block; width: 22px; height: 22px; flex-shrink: 0; background: center / contain no-repeat; }
  @S .dball[data-ball='soccer'] { background-image: var(--s-soccer); }
  @S .dball[data-ball='tennis'] { background-image: var(--s-tennis); }
  @S .dball[data-ball='hockey'] { background-image: var(--s-hockey); }
  @S .dball[data-ball='floor'] { background-image: var(--s-floor); }
  @S .dball[data-ball='rugby'] { background-image: var(--s-rugby); }
  @S .dball[data-ball='footy'] { background-image: var(--s-footy); }
  @S .dball[data-ball='whistle'] { background-image: var(--s-whistle); }
  @S .sboard .dball { width: calc(var(--u) * .5); height: calc(var(--u) * .5); margin-left: calc(var(--u) * .12); }
  @S .fh[data-compact] .sboard { --u: 38px; }
  /* status chips: square scoreboard tiles (they tell; an urgent one is the danger colour) */
  @S .cap { border-radius: 8px; background: var(--board); color: var(--board-ink); border: 0; box-shadow: 0 0 0 1.5px var(--board-line); -webkit-backdrop-filter: none; backdrop-filter: none; font-family: 'Outfit', 'Inter', sans-serif; font-weight: 700; letter-spacing: .01em; }
  @S .cap.hot { background: var(--danger); color: var(--on-danger); }
  @S .cap[data-warm] { background: #f5b301; color: #2a1a00; box-shadow: none; }
  @S .cap.ok { background: var(--ok-wash); color: var(--ok); }
  /* the weather chip is the pitch report */
  @S .weather { border-radius: 12px; height: 56px; padding: 0 12px; gap: 10px; background: var(--panel); }
  @S .badge { border-radius: 6px; background: var(--panel2); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--ink); font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 15px; }
  @S .badge.hot { background: var(--danger); color: var(--on-danger); box-shadow: none; }
  @S .verdict { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 9px; border-radius: 6px; background: var(--ok-wash); color: var(--ok); font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 15px; letter-spacing: .02em; white-space: nowrap; flex-shrink: 0; }
  @S .verdict[data-v='hat'] { background: var(--panel2); color: var(--ink); box-shadow: inset 0 0 0 1.5px var(--ink); }
  @S .verdict[data-v='wet'] { background: var(--board); color: var(--board-ink); box-shadow: 0 0 0 1.5px var(--board-line); }
  @S .presence { background: transparent; border: 0; box-shadow: none; gap: 5px; padding: 0 2px; }
  @S .right { gap: 10px; }
  @S .right > button.round { background: var(--panel); }

  /* planner: the week is seven mown lanes with chalk between them */
  @S .planner { background: transparent; border: 0; box-shadow: none; border-radius: 0; padding: 0; gap: 10px; }
  @S .legend { font-size: 15px; font-weight: 600; color: var(--ink); gap: 16px; }
  @S .week { gap: 0; border-radius: 14px; border: 1.5px solid var(--line); background: var(--mow2); overflow: hidden; }
  @S .col { border-radius: 0; background: transparent; border-left: 2px solid var(--chalk); padding: 0 6px 6px; box-shadow: none; }
  @S .col:nth-child(odd) { background: var(--mow1); }
  @S .col:first-child { border-left: 0; }
  @S .col.today { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .dayhead { height: 46px; flex-shrink: 0; margin: 0 -6px; padding: 0 8px; gap: 4px; border-bottom: 2px solid var(--chalk); }
  @S .dayhead .dball { margin-left: auto; }
  @S .num { font-family: 'Outfit', sans-serif; font-size: 21px; font-weight: 700; }
  @S .today .num { width: auto; height: 28px; padding: 0 6px; border-radius: 6px; background: var(--sel); color: var(--on-sel); box-shadow: none; font-size: 19px; }
  @S .col.today .dayhead::before { content: ''; width: 20px; height: 20px; flex-shrink: 0; background: var(--s-flag) center / contain no-repeat; }
  /* events are fixture cards: the person's colour down the edge, the time on the scoreboard face */
  @S .ev { background: var(--evcard); border: 1px solid var(--line); border-left: 6px solid var(--c); border-radius: 8px; padding: 6px 5px 7px 7px; }
  @S .ev .t { font-family: 'Outfit', sans-serif; font-weight: 600; font-size: 15px; color: var(--ink2); }
  @S .ev .content { font-size: 16px; font-weight: 600; }
  /* who it is for: their bib in the corner of the card, with their initial (the name itself stays for screen readers) */
  @S .ev { position: relative; }
  @S .ev .t { padding-right: 26px; }
  @S .ev .w { position: absolute; right: 5px; top: 5px; width: 22px; height: 22px; padding-top: 8px; overflow: hidden; background: var(--c, var(--p-family)); -webkit-mask: var(--s-bib) center / contain no-repeat; mask: var(--s-bib) center / contain no-repeat; color: var(--on-person); font-family: 'Outfit', sans-serif; font-size: 0; font-weight: 800; line-height: 12px; text-align: center; overflow-wrap: normal; white-space: nowrap; }
  @S .ev .w::first-letter { font-size: 12px; }
  @S .col.today .ev.past .w { display: block; }
  @S .ev.next { box-shadow: 0 0 0 2px var(--ink); border-color: var(--ink); border-left-color: var(--c); background: var(--s-flag) right 30px top 6px / 18px 18px no-repeat, var(--evcard); }
  @S .ev.past, @S .dayrow.past { opacity: 1; background: transparent; border-style: dashed; border-left-style: solid; border-left-color: color-mix(in srgb, var(--c) 55%, transparent); }
  @S .ev.past .t, @S .ev.past .content, @S .dayrow.past .content, @S .dayrow.past .muted { color: var(--ink-done); font-weight: 500; }
  @S .col.today .ev.past .t::after { content: ''; display: inline-block; width: 14px; height: 14px; margin-left: 5px; vertical-align: -2px; background: var(--ok); -webkit-mask: var(--s-tick) center / contain no-repeat; mask: var(--s-tick) center / contain no-repeat; }
  @S .more { background: transparent; }
  /* month: the season fixture, a grid of small tiles */
  @S .cell { border-radius: 8px; background: var(--evcard); border: 1px solid var(--line); }
  @S .cell.out { background: transparent; border-style: dashed; color: var(--ink3); }
  @S .cell.today { background: var(--panel); border: 3px solid var(--ink); }
  @S .cell.today .mtop > span:first-child { font-weight: 800; text-decoration: underline; text-decoration-color: var(--ink); text-decoration-thickness: 3px; text-underline-offset: 3px; }
  @S .cell .mtop { font-family: 'Outfit', sans-serif; font-size: 15px; }
  /* day: the match-day programme, one lane */
  @S .dayrow { background: var(--evcard); border: 1px solid var(--line); border-left: 6px solid var(--c, var(--line)); border-radius: 8px; }
  @S .daylist { background: var(--mow1); border: 1.5px solid var(--line); border-radius: 14px; padding: 10px; }
  @S .dayrow.next { box-shadow: 0 0 0 2px var(--ink); border-color: var(--ink); border-left-color: var(--c); background: var(--s-flag) right 10px top 10px / 22px 22px no-repeat, var(--evcard); }

  /* a free day: the ball of the day resting on the line */
  @S .freeday > span:first-child { width: 150px; height: 60px; border-bottom: 3px solid var(--ink); background: var(--s-ball) center bottom / 54px 54px no-repeat; }
  @S .freeday > span:first-child svg { display: none; }
  @S .freeday h2 { font-size: 0; }
  @S .freeday h2::after { content: 'No fixtures today'; font-size: var(--t-sub, 22px); }
  /* the rail: now playing sits on a scoreboard; the kitchen timer is the match clock; the family jar is the ball bag */
  @S .np { background: var(--board); color: var(--board-ink); border-color: var(--board-line); }
  @S .np .muted { color: var(--board-ink2); }
  @S .np .art { border-radius: 50%; box-shadow: 0 0 0 2px var(--board-ink); }
  @S .np .round { background: var(--board-ink); color: #14201a; box-shadow: none; }
  @S .timerrow { flex-wrap: wrap; row-gap: 6px; }
  @S .timerrow .tmeter { order: 3; flex: 0 0 100%; width: 100%; height: auto; }
  @S .tmeter { max-width: 100%; }
  @S .tread { margin: 0; padding: 0 12px; border-radius: 8px; background: var(--board); color: var(--board-ink); box-shadow: 0 0 0 1.5px var(--board-line); font-size: 30px; font-weight: 700; }
  @S .timerrow .tcancel { color: var(--ink2); text-decoration: underline dotted; text-decoration-thickness: 2px; text-underline-offset: 5px; }
  @S .timerrow.on .hint { display: none; }
  @S .jarpic { width: 34px; height: 34px; flex-shrink: 0; background: var(--s-bag) center / contain no-repeat; }
  @S .jarpic svg { display: none; }
  @S .rem { font-weight: 500; font-size: 16px; }

  /* dock: the touchline. Mown turf with a chalk line; places to go are white balls standing on it */
  @S .dock { align-self: stretch; margin: 0 calc(-1 * var(--pad-x)) calc(-1 * var(--pad-y)); padding: 9px 12px 9px; gap: 10px; justify-content: center; border: 0; border-top: 3px solid var(--chalk); border-radius: 0; box-shadow: none; background: repeating-linear-gradient(90deg, var(--turf) 0 80px, var(--turf2) 80px 160px); }
  @S .dock .item { min-width: 78px; height: 84px; gap: 6px; padding: 0 2px; border-radius: 12px; color: #fff; font-size: 15px; font-weight: 700; }
  @S .dock .item svg.i { width: 54px; height: 54px; padding: 14px; border-radius: 50%; background: #fff; color: #14201a; box-shadow: inset 0 0 0 2px #14201a, 0 3px 0 rgba(8,24,14,.55); stroke-width: 2; }
  @S .dock .item.tap:active svg.i { transform: translateY(calc(3px * var(--m-d, 1))); box-shadow: inset 0 0 0 2px #14201a; }
  @S .dock .item.tap:active { transform: none; }
  @S .dock .item[aria-current='page'] { background: transparent; font-weight: 800; text-decoration: underline; text-decoration-color: #fff; text-decoration-thickness: 3px; text-underline-offset: 5px; }
  @S .dock .item[aria-current='page'] svg.i { background: #14201a; color: #fff; box-shadow: 0 0 0 3px #fff; }
  @S .dock .kidbtn .avatar { scale: 1.2; margin: 5px 0 4px; box-shadow: 0 0 0 2px #fff, 0 3px 0 2px rgba(8,24,14,.45); }
  @S .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @S .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 2px #14201a, 0 0 0 5px #fff; }
  @S .dock .sep { width: 2px; height: 54px; margin: 0 6px 22px; border-radius: 1px; background: rgba(255,255,255,.55); }
  /* Dinner is the whistle */
  @S .dock .item[data-nav='dinner'] svg.i { background: var(--s-pea) center / 28px 28px no-repeat, #fff; }
  @S .dock .item[data-nav='dinner'] svg.i > * { display: none; }
  @S .dock .called { color: #fff; }
  @S .dock .item > span { display: inline-flex; }

  /* sheets: the team sheet on a clipboard */
  @S .sheet { background: var(--s-clip) center top -1px / 120px 24px no-repeat, var(--panel); border: 2px solid var(--ink); border-radius: 18px; box-shadow: 0 10px 0 rgba(9,18,13,.35); padding-top: 30px; }
  /* the kitchen timer's sheet: the time left on the scoreboard */
  @S .sheet [role='timer'] { padding: 16px 24px; border-radius: 12px; background: var(--board); color: var(--board-ink); box-shadow: 0 0 0 1.5px var(--board-line); }
  /* the PIN pad: a scoreboard keypad. Lamps fill as you type, with the count in words beside them */
  @S .grid button { border-radius: 8px; background: var(--panel2); box-shadow: inset 0 0 0 1.5px var(--line), inset 0 -3.5px 0 var(--ink3); font-family: 'Outfit', sans-serif; font-weight: 700; }
  @S .grid button:active { transform: translateY(calc(2px * var(--m-d, 1))); box-shadow: inset 0 0 0 1.5px var(--line); background: var(--panel); opacity: 1; }
  @S .what ~ [role='img'] { align-items: center; height: 24px; gap: 10px; }
  @S .what ~ [role='img'] span { width: 18px; height: 18px; border: 2px solid var(--ink); background: var(--panel); }
  @S .what ~ [role='img'] span.on { background: var(--ink); border-color: var(--ink); }
  @S .what ~ [role='img']::after { content: attr(aria-label); margin-left: 4px; font-size: 15px; font-weight: 600; color: var(--ink2); white-space: nowrap; }
  /* toasts: the linesman's flag */
  @S .toast { background: var(--panel); color: var(--ink); border-radius: 12px; box-shadow: inset 0 0 0 2px var(--ink), 0 4px 0 rgba(20,32,26,.18); text-align: left; padding: 12px 18px 12px 14px; gap: 10px; }
  @S .toast::before { content: ''; width: 22px; height: 22px; flex-shrink: 0; background: var(--s-flag) center / contain no-repeat; transform-origin: 25% 90%; animation: sFlag var(--mt-4, 400ms) var(--e-spring, ease) both; }
  @S .toast button { background: transparent; color: var(--ink2); text-decoration: underline dotted; text-decoration-thickness: 2px; text-underline-offset: 5px; }
  @S .toast button:focus-visible { outline-color: var(--ink); }
  /* the look picker: the chosen card is a ring and a tick, never a fill */
  @S .tcard { position: relative; background: var(--panel2); box-shadow: inset 0 0 0 1.5px var(--line); border-radius: 14px; }
  @S .tcard[aria-pressed='true'] { background: var(--panel2); color: var(--ink); box-shadow: 0 0 0 3px var(--ink); }
  @S .tcard[aria-pressed='true']::after { content: '✓'; position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; border-radius: 8px; background: var(--sel); color: var(--on-sel); font-size: 17px; font-weight: 800; line-height: 27px; text-align: center; box-shadow: 0 0 0 3px var(--panel); }
  /* the floodlight switch, with its word */
  @S .opt { gap: 8px; font-weight: 700; font-size: 16px; }
  @S .opt::after { content: 'Off'; min-width: 28px; text-align: left; }
  @S .opt[aria-checked='true']::after { content: 'On'; }
  @S .opt .sw { width: 68px; height: 36px; border-radius: 18px; background: var(--panel2); box-shadow: inset 0 0 0 2px var(--ink3); }
  @S .opt .sw::after { top: 4px; left: 4px; width: 28px; height: 28px; background: var(--panel); box-shadow: inset 0 0 0 2px var(--ink); }
  @S .opt .sw::before { content: ''; position: absolute; left: 10px; top: 10px; width: 16px; height: 16px; background: var(--on-ok); -webkit-mask: var(--s-tick) center / contain no-repeat; mask: var(--s-tick) center / contain no-repeat; opacity: 0; }
  @S .opt[aria-checked='true'] .sw { background: var(--ok); box-shadow: none; }
  @S .opt[aria-checked='true'] .sw::before { opacity: 1; }
  @S .opt[aria-checked='true'] .sw::after { transform: translateX(32px); background: #fff; box-shadow: inset 0 0 0 2px #14201a; }

  /* a child's page: his peg in the change room. Only his own progress is ever shown */
  @S .hero::before { display: none; }
  /* the name is as big as its length allows (--nl, its letters, comes from the page), so a seven-letter name stays on one line beside the rank and is never broken mid-word */
  @S .name { font-size: clamp(30px, calc(300px / var(--nl, 6)), 44px); font-weight: 800; color: color-mix(in srgb, var(--kid) var(--kid-mix, 100%), var(--ink)); }
  @S .rank { border-radius: 6px; background: var(--board); color: var(--board-ink); box-shadow: 0 0 0 1.5px var(--board-line); font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 15px; }
  @S .stat { background: var(--panel2); border-radius: 10px; }
  @S .stat b { font-family: 'Outfit', sans-serif; font-weight: 700; }
  @S .dots i.g { background: var(--ok); border-color: var(--ok); }
  @S .nextup { background: var(--panel2); border-radius: 10px; }
  /* room for the ball above and below the bar: at the start of the bar it sat on the label */
  @S .nextup .meter { margin: 8px 0 6px; }
  @S .jobs .ring { width: auto; height: 36px; padding: 0 10px; border-radius: 8px; background: var(--board); box-shadow: 0 0 0 1.5px var(--board-line); display: flex; align-items: center; }
  @S .jobs .ring svg { display: none; }
  @S .jobs .ring b { position: static; color: var(--board-ink); font-family: 'Outfit', sans-serif; font-size: 17px; font-weight: 700; }
  @S .job { border-radius: 10px; background: var(--panel2); }
  @S .row.now { padding-left: 38px; background: var(--s-flag) 10px center / 22px 22px no-repeat, var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .job.done .check { background: var(--ok); border-color: var(--ok); }
  @S .plus { border-radius: 6px; background: var(--panel); box-shadow: inset 0 0 0 1.5px var(--line); font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 15px; }
  @S .play { background: var(--panel); color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink), 0 2px 0 var(--ink); font-size: 16px; }
  @S .now .play { background: var(--primary); color: var(--on-primary); box-shadow: inset 0 0 0 2px var(--edge), 0 4px 0 var(--edge); font-weight: 800; }
  @S .play.going { background: var(--panel); color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink); }
  @S .later { background: var(--panel2); border-radius: 10px; }
  @S .rw { background: var(--panel2); color: var(--ink); border-radius: 10px; min-height: 52px; }
  @S .side { gap: 10px; border-radius: 14px; }
  @S .rw button { background: var(--panel); box-shadow: inset 0 0 0 2px var(--ink), 0 2px 0 var(--ink); }
  @S .rw button.save { background: transparent; color: var(--ink2); box-shadow: none; text-decoration: underline dotted; text-decoration-thickness: 2px; text-underline-offset: 5px; }
  @S .rw .cost { border-radius: 6px; font-family: 'Outfit', sans-serif; background: var(--panel); }
  @S .rw .notyet { box-shadow: none; outline: 1.5px dashed var(--ink3); outline-offset: -1.5px; background: transparent; }
  /* the picture job: a card with a heavy edge; the one to do now carries the pennant and the big hi-vis button */
  @S .pic { background: var(--panel); border: 2px solid var(--ink); border-radius: 12px; }
  @S .pic.now { box-shadow: none; background: var(--s-flag) 10px 10px / 26px 26px no-repeat, var(--panel); }
  @S .pic.done { background: var(--ok-wash); border-color: var(--ok); }
  /* the one to do now: picture on the left, its name and the 60 px button on the right, so the button never covers the picture however short the card is */
  @S .pic.big { display: grid; grid-template-columns: auto minmax(0, 1fr); grid-template-rows: auto auto auto; align-content: center; align-items: center; justify-items: start; column-gap: 22px; row-gap: 6px; padding: 12px 100px 16px 26px; text-align: left; }
  @S .pic.big .e { grid-area: 1 / 1 / 4 / 2; font-size: 112px; line-height: 1.05; }
  /* on a short panel the kid page sets --fit: the Now card tightens (button 48 px, smaller picture) so its name is never pushed out of the card */
  @S .pic.big { padding-top: calc(12px - 6px * var(--fit, 0)); padding-bottom: calc(16px - 8px * var(--fit, 0)); row-gap: calc(6px - 4px * var(--fit, 0)); }
  @S .pic.big .e { font-size: calc(112px - 28px * var(--fit, 0)); }
  @S .pic.big .pt { font-size: calc(32px - 6px * var(--fit, 0)); }
  @S .pic.big .pt { grid-area: 1 / 2; font-family: 'Bricolage Grotesque', sans-serif; font-size: 32px; font-weight: 800; line-height: 1.05; text-align: left; }
  @S .pic.big .stars { grid-area: 2 / 2; justify-content: flex-start; }
  @S .pic.big::after { content: '✓  I did it!'; grid-area: 3 / 2; justify-self: stretch; height: calc(60px - 12px * var(--fit, 0)); margin-top: 4px; border-radius: 30px; background: var(--primary); color: var(--on-primary); box-shadow: inset 0 0 0 2px var(--edge), 0 4px 0 var(--edge); font-size: 22px; font-weight: 800; line-height: calc(60px - 12px * var(--fit, 0)); text-align: center; white-space: nowrap; transition: transform var(--m-1, 80ms) ease, box-shadow var(--m-1, 80ms) ease; }
  @S .pic.big:active::after { transform: translateY(calc(4px * var(--m-d, 1))); box-shadow: inset 0 0 0 2px var(--edge); }
  @S .pic.small .e { font-size: 48px; }
  @S .pic.small { flex-basis: 76px; opacity: 1; border-style: dashed; border-color: var(--ink3); }
  @S .pic.big.done::after { display: none; }
  @S .readme, @S .seedone { background: var(--panel); color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink), 0 3px 0 var(--ink); }
  @S .studio[data-locked] { background: transparent; color: var(--ink3); box-shadow: none; outline: 2px dashed var(--ink3); outline-offset: -2px; }
  @S .sec h2 { font-size: 18px; }
  @S .wk { font-size: 15px; }

  /* groceries: the canteen docket */
  /* the dark docket bar is painted inside the card, so the card's own corners clip it */
  @S .list.glass { border-radius: 14px; padding-top: 26px; background: linear-gradient(var(--board), var(--board)) top / 100% 6px no-repeat, radial-gradient(circle at 100% 100%, transparent 0 21px, var(--track) 21.5px 23.5px, transparent 24px) right bottom / 26px 26px no-repeat, var(--panel); }
  @S .clear { background: var(--panel); color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink), 0 2px 0 var(--ink); }
  @S .items .row { background: transparent; border-radius: 0; border-bottom: 1.5px dashed var(--line); }
  @S .tag { border-radius: 6px; font-family: 'Outfit', sans-serif; font-weight: 700; }
  @S .who.glass { border-radius: 12px; background: var(--panel); }

  /* home: ground controls. Each room is a board; a room with a light on is floodlit */
  @S .rooms { background: transparent; border: 0; box-shadow: none; }
  @S .room { background: var(--panel); border-radius: 14px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .room.lit { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .dev { background: var(--panel2); border-radius: 10px; }
  @S .room.lit .dev { background: var(--panel); }
  @S .dicon { background: var(--panel); color: var(--ink2); box-shadow: inset 0 0 0 1.5px var(--ink3); }
  @S .dev.on .dicon { background: var(--sel); color: var(--on-sel); box-shadow: none; }
  @S .toggle { width: 64px; height: 36px; border-radius: 18px; background: var(--panel2); box-shadow: inset 0 0 0 2px var(--ink3); }
  @S .toggle::after { top: 4px; left: 4px; width: 28px; height: 28px; background: var(--panel); box-shadow: inset 0 0 0 2px var(--ink); }
  @S .toggle::before { content: ''; position: absolute; left: 9px; top: 10px; width: 16px; height: 16px; background: var(--on-ok); -webkit-mask: var(--s-tick) center / contain no-repeat; mask: var(--s-tick) center / contain no-repeat; opacity: 0; }
  @S [aria-checked='true'] > .toggle { background: var(--ok); box-shadow: none; }
  @S [aria-checked='true'] > .toggle::before { opacity: 1; }
  @S [aria-checked='true'] > .toggle::after { transform: translateX(28px); background: #fff; box-shadow: inset 0 0 0 2px #14201a; }
  @S .scene { background: var(--panel); border-radius: 22px; box-shadow: inset 0 0 0 2px var(--ink), 0 2px 0 var(--ink); }

  /* doodle: the tactics board */
  @S .pad { border-radius: 10px; box-shadow: 0 0 0 2px var(--ink), 0 5px 0 var(--track); }
  @S .ink { box-shadow: inset 0 0 0 2px rgba(20,32,26,.55); }
  @S .ink[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--panel), 0 0 0 6px var(--ink); }
  @S .snap { border-radius: 8px; box-shadow: 0 0 0 1.5px var(--line); }
  /* who drew it: a caption under the tile, so it never covers the drawing or hangs off the corner */
  @S .snaps { row-gap: 30px; padding-bottom: 32px; }
  @S .by { top: calc(100% + 3px); bottom: auto; left: 0; right: 0; padding: 0 2px; border-radius: 0; background: transparent; color: var(--ink); box-shadow: none; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: 'Caveat', 'Inter', sans-serif; font-size: 18px; line-height: 1.2; font-weight: 700; }

  /* style studio: kit laid out on the bench */
  @S .tile { background: var(--panel2); border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--line); font-weight: 600; }
  @S .tile[aria-pressed='true'] { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink), inset 0 -8px 0 var(--ink); }

  /* morning board: each boy has his own column; columns never show totals or an order */
  @S .kcol { border-top: 6px solid var(--kid); border-radius: 14px; }
  @S .khead h2 { font-weight: 800; }
  @S .nextstep { border-radius: 8px; background: var(--panel2); box-shadow: inset 0 0 0 1.5px var(--ink); }
  @S .nextstep.set { background: var(--ok-wash); color: var(--ok); box-shadow: none; }
  @S .lchip { border-radius: 6px; background: var(--board); color: var(--board-ink); box-shadow: 0 0 0 1.5px var(--board-line); font-family: 'Outfit', sans-serif; font-weight: 700; }
  @S .leave { font-family: 'Outfit', sans-serif; font-weight: 700; }

  /* weather: the pitch report. The verdict comes first, then the readings */
  @S .verdict[data-big] { height: 44px; padding: 0 14px; border-radius: 8px; font-size: 20px; gap: 8px; align-self: flex-start; flex-shrink: 0; }
  @S .wnow[data-fit] .verdict[data-big] { height: 36px; font-size: 17px; }
  @S .wtemp { font-family: 'Outfit', sans-serif; font-weight: 700; }
  @S .wtip { background: var(--panel2); border-radius: 10px; }
  @S .wfact { background: var(--panel2); border-radius: 10px; padding: 6px 10px; }
  @S .wday { border-radius: 8px; }
  @S .wday.today { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .wbar { border-radius: 3px; }
  @S .wwarn { border-radius: 8px; background: var(--danger); color: var(--on-danger); }
  @S .sky .cloud { stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
  @S .sky .disc, @S .sky .moon, @S .sky .bolt { stroke: var(--ink); stroke-width: 2.5; stroke-linejoin: round; }
  @S .mbox { border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--line); }

  /* Ask: the coach's corner. Your words are a slip on the right; answers sit on the board */
  @S .thread { background: var(--panel2); border-radius: 12px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .bubble { background: var(--panel); border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .bubble.asker { background: var(--sel); color: var(--on-sel); box-shadow: none; }
  @S .starter { background: var(--panel2); box-shadow: inset 0 0 0 1.5px var(--line); font-weight: 600; }
  @S .talk { box-shadow: inset 0 0 0 2px var(--edge), 0 4px 0 var(--edge); }

  /* add an event: the time is picked on a scoreboard drum */
  @S .chips button { font-size: 15px; gap: 5px; }
  @S .chips .init:not(.avatar) { min-width: 20px; width: 20px; height: 20px; padding: 0 0 2px; font-size: 12px; }
  @S .dialbox { border-radius: 12px; background: var(--panel2); }
  @S .drums { --ink: var(--board-ink); --ink2: #8a978f; color: var(--board-ink); border-radius: 12px; background: var(--board); box-shadow: 0 0 0 1.5px var(--board-line); font-family: 'Outfit', sans-serif; }
  @S .drums::before { left: 0; right: 0; border-radius: 0; background: rgba(255,255,255,.09); box-shadow: inset 5px 0 0 var(--board-ink), inset -5px 0 0 var(--board-ink); }

  /* music */
  @S .stage { background: var(--board); color: var(--board-ink); border-color: var(--board-line); }
  @S .stage .glass { background: transparent; border-color: transparent; box-shadow: none; }
  @S .stage .muted { color: var(--board-ink2); }
  @S .stage .round, @S .stage .pill { background: var(--board-ink); color: #14201a; box-shadow: none; }
  @S .spk { background: var(--panel); border-radius: 12px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .spk.focus { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .spk.inmix { box-shadow: inset 0 0 0 2px var(--ok); }
  @S .mroom { background: var(--panel); border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--ink3); }
  @S .mstairs { border-radius: 8px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .mzone { --stream: var(--ink); }
  @S .mzone[data-focus] { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .pool { background: repeating-linear-gradient(90deg, color-mix(in srgb, var(--c) 30%, var(--panel)) 0 14px, color-mix(in srgb, var(--c) 22%, var(--panel)) 14px 28px); border-top: 2px solid var(--c); }
  @S .pool::before { display: none; }
  @S .puck { border: 2px solid var(--ink); box-shadow: 0 3px 0 rgba(8,24,14,.4); }
  @S .mshelf { background: var(--panel2); border-radius: 12px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .wholeh { border-radius: 10px; border-color: var(--ink3); }
  @S .viewbtn { background: var(--panel); box-shadow: inset 0 0 0 2px var(--ink), 0 2px 0 var(--ink); }
  @S .vcard { background: var(--panel2); border-radius: 12px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .vcard[aria-pressed='true'] { background: var(--sel); color: var(--on-sel); box-shadow: none; }
  @S .bigdial, @S .desk, @S .rig, @S .vscene { --stream: var(--ink); }
  @S .dplate { fill: var(--panel); stroke: var(--ink); stroke-width: 2; }
  @S .dtrack { stroke: var(--track); }
  @S .dknob { fill: #fff; stroke: #14201a; stroke-width: 3; }
  @S .dcover { box-shadow: 0 0 0 3px var(--ink); }
  @S .dcard, @S .tuner { background: var(--panel); border-radius: 12px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .desk { background: var(--panel); border-radius: 14px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .strip[data-focus] { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .sname { background: var(--board); color: var(--board-ink); border-radius: 6px; box-shadow: 0 0 0 1.5px var(--board-line); font-weight: 700; }
  @S .lamp { background: var(--panel); color: var(--ink); box-shadow: inset 0 0 0 2px var(--ink), 0 2px 0 var(--ink); }
  @S .lamp[aria-pressed='true'] { background: var(--sel); color: var(--on-sel); box-shadow: none; }
  @S .lamp[data-other] { font-size: 15px; padding: 0 7px; }
  @S .fcap { background: var(--s-ball) center / 100% 100% no-repeat; box-shadow: none; }
  @S .slot { --rail-w: 5px; }
  @S .jog { background: var(--panel); box-shadow: inset 0 0 0 2px var(--ink), 0 4px 0 var(--ink); }
  @S .mpad { border-radius: 10px; box-shadow: inset 0 0 0 2px var(--ink), 0 3px 0 var(--ink); }
  @S .dart { border-radius: 8px; box-shadow: 0 0 0 2px var(--ink); }
  @S .cab { background: var(--panel); color: var(--ink); border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--ink3); }
  @S .sock { background: var(--panel2); box-shadow: inset 0 0 0 2px var(--ink); }
  @S .sock[aria-pressed='true'] { background: var(--c); }
  @S .cdisc { box-shadow: 0 0 0 2px var(--ink); }
  @S .cbox { background-color: var(--panel2); border-radius: 10px; box-shadow: inset 0 0 0 2px var(--ink); }
  @S .ttable { background: var(--panel); border-radius: 12px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .tkey { border-radius: 8px; background: var(--panel2); box-shadow: inset 0 0 0 1.5px var(--line), inset 0 -3.5px 0 var(--ink3); }
  @S .tkey[data-go] { background: var(--primary); color: var(--on-primary); box-shadow: inset 0 0 0 2px var(--edge), 0 4px 0 var(--edge); }
  @S .ctab { border-radius: 10px 10px 4px 4px; }
  /* the Scene view is a training ground: mown stripes, rooms as players, a dotted pass line between rooms that share */
  @S .vscene { background: repeating-linear-gradient(90deg, var(--mow1) 0 88px, var(--mow2) 88px 176px); border-radius: 14px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .aname { background: var(--panel); border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .suntx { padding: 5px 10px 7px; border-radius: 10px; background: var(--panel); box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .join { background: var(--panel); box-shadow: inset 0 0 0 2px var(--ink), 0 2px 0 var(--ink); }
  @S .join[aria-pressed='true'] { background: var(--ok); color: var(--on-ok); box-shadow: none; }
  @S .hit { background: transparent; border-radius: 0; border-bottom: 1.5px solid var(--line); }
  @S .hit[aria-pressed='true'] { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .st { background: var(--panel2); border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--line); font-weight: 700; }
  @S .st.on { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .crate .st, @S .presets .st { background: transparent; box-shadow: none; }
  @S .presets .st.on { background: var(--sel); color: var(--on-sel); box-shadow: none; }
  @S .pickrow { background: var(--panel2); border-radius: 10px; box-shadow: inset 0 0 0 1.5px var(--line); }
  @S .pickrow[data-next] { background: var(--panel); box-shadow: inset 0 0 0 3px var(--ink); }
  @S .banner { background: var(--panel2); border-radius: 8px; box-shadow: inset 0 0 0 1.5px var(--ink); }

  /* night: the ground after dark. Near-black, the scoreboard dimmed to tan, one floodlight on low; nothing moves */
  @S .night { --board: #060908; --tile: #000; --board-ink: #b89b72; --hi: #6e5f1f; --board-line: rgba(255,178,107,.16); background: radial-gradient(520px 320px at 0 0, rgba(255,214,150,.05), transparent 70%), #020403; }
  @S .night .big { display: none; }
  /* the screensaver: the scoreboard keeps the time, so the digits beside it are not said twice */
  @S .artm .atime { display: none; }
  @S .artm .aplate { border-radius: 22px; }
  @S .artm .adate { margin-top: 0; text-transform: uppercase; letter-spacing: .04em; font-size: 26px; }
  @S .night .nart { opacity: 1; }
  @S .night .dball { opacity: .4; }
  @S .night .breathe { animation: none; opacity: .7; }

  /* portrait tablets: the same touchline, with the balls closer together so every place still fits */
  @S[data-shape='tall'] .dock { gap: 0; padding-left: 6px; padding-right: 6px; max-width: none; }
  @S[data-shape='tall'] .dock .item { min-width: 62px; }
  @S[data-shape='tall'] .dock .sep { margin: 0 4px 22px; }
  /* small landscape tablets (under 1100 px): the touchline keeps its full width, and the balls stand closer so the first and last are never off the ground */
  @S[data-n2] .dock { gap: 0; padding-left: 6px; padding-right: 6px; max-width: none; }
  @S[data-n2] .dock .item { min-width: 62px; padding: 0 6px; flex-shrink: 0; }
  @S[data-n2] .dock .sep { margin: 0 4px 22px; }
  /* the kitchen timer's quick pills in the narrow rail (under 1240 px): “+10 min” stays on one line at the full 15 px, drawn a touch tighter and in a slightly wider pill, so the words keep 6 px clear of the pill's ring */
  @S[data-n1] .tmr .quick { white-space: nowrap; padding: 0; margin: 0 -3px; letter-spacing: -.04em; word-spacing: -.03em; }
  /* a compact screen (1024 x 768) drops the other looks' timer pills to 14 px; these keep the look's 15 px, which the tighter drawing above leaves room for */
  @S .fh[data-compact] .tmr .quick:not(.lead) { font-size: 15px; }
  /* a choice of several on a phone wraps to as many rows as its words need */
  @S[data-phone] .seg { height: auto; border-radius: 26px; }
  /* under 900 px: smaller balls, each place as wide as its own word, so a morning's extra place still fits and no two labels touch */
  @S[data-n3] .dock { overflow-x: auto; scrollbar-width: none; justify-content: safe center; }
  @S[data-n3] .dock .item { min-width: 48px; padding: 0 3px; font-size: 14px; }
  @S[data-n3] .dock .item svg.i { width: 46px; height: 46px; padding: 11px; }
  @S[data-n3] .dock .sep { margin: 0 2px 20px; }
  @S[data-n3] .dock .kidbtn .avatar { scale: 1.08; }
  /* phone: the scoreboard shrinks; the dock is the touchline along the bottom */
  @S[data-phone] .sboard { --u: 34px; }
  @S[data-phone] .weather .verdict { display: none; }
  @S[data-phone] .night .sboard { --u: 84px; }
  @S[data-phone] .fh { padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px)); }
  @S[data-phone] .dock { left: 0; right: 0; bottom: 0; margin: 0; gap: 2px; justify-content: flex-start; padding: 7px 30px calc(6px + env(safe-area-inset-bottom, 0px)) 8px; border-radius: 0; }
  @S[data-phone] .dock .item { min-width: 64px; height: 74px; padding: 0 2px; font-size: 14px; gap: 5px; }
  @S[data-phone] .dock .item svg.i { width: 46px; height: 46px; padding: 11px; }
  @S[data-phone] .dock .sep { height: 44px; margin: 0 4px 20px; }
  @S[data-phone] .dock .kidbtn .avatar { scale: 1.25; margin: 5px 0 6px; }
  @S[data-phone] .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 2px #14201a, 0 0 0 4px #fff; }
  /* the bar fades into turf at the right while there is more to slide to (the words never fade over the page) */
  @S[data-phone] .dock[data-more] { -webkit-mask-image: none; mask-image: none; }
  @S[data-phone] .dock::after { content: ''; position: fixed; right: 0; bottom: 0; width: 36px; height: calc(86px + env(safe-area-inset-bottom, 0px)); background: linear-gradient(to right, transparent, var(--turf2) 85%); pointer-events: none; }
  @S[data-phone] .week { overflow-x: auto; }
  /* phone: the picture job stacks, and its button runs along the bottom beside the speaker */
  @S[data-phone] .pic.big { grid-template-columns: minmax(0, 1fr); justify-items: center; padding: 14px 14px 16px; text-align: center; }
  @S[data-phone] .pic.big .e { grid-area: auto; font-size: 96px; }
  @S[data-phone] .pic.big .pt { grid-area: auto; text-align: center; font-size: 28px; }
  @S[data-phone] .pic.big .stars { grid-area: auto; justify-content: center; }
  @S[data-phone] .pic.big::after { grid-area: auto; margin: 6px 86px 0 0; }
  @S[data-phone] .planner { padding: 0; }
  @S[data-phone] .sheet { padding-top: 30px; }
`;

const KEYFRAMES = `
  /* the fridge door gets a bump now and then: every note jiggles on its pin (needs --tilt registered as a number, see ambient.ts) */
  @keyframes fjig { 0%, 93%, 100% { --tilt: 1; } 94.5% { --tilt: 2.3; } 96% { --tilt: -.2; } 97.5% { --tilt: 1.6; } 99% { --tilt: .7; } }
  @keyframes fhSpin { to { transform: rotate(360deg); } }
  @keyframes fhHot { 50% { box-shadow: inset 0 0 0 3px rgba(255,255,255,.6); } }
  .vinyl .spin { transform-box: fill-box; transform-origin: center; animation: fhSpin 5s linear infinite; animation-iteration-count: var(--loops, infinite); }
  .vinyl, .pring { max-width: 100%; max-height: 100%; height: auto; }
  /* Home Ground: the linesman's flag tips up once as a toast arrives (it stands still in calm mode) */
  @keyframes sFlag { from { transform: rotate(calc(20deg * var(--m-d, 1))); } }
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
  .lookprev .lp-lanes { position: absolute; inset: 10px 10px 30px; display: flex; border-radius: 8px; overflow: hidden; border: 1.5px solid var(--line); background: var(--mow2); }
  .lookprev .lp-lanes i { flex: 1; border-left: 2px solid var(--chalk); }
  .lookprev .lp-lanes i:nth-child(odd) { background: var(--mow1); }
  .lookprev .lp-lanes i:first-child { border-left: 0; }
  .lookprev .lp-lanes .lp-now { background: var(--panel); box-shadow: inset 0 0 0 2px var(--ink); display: flex; align-items: center; justify-content: center; }
  .lookprev .lp-lanes b { width: 70%; height: 12px; border-radius: 6px; background: var(--primary); box-shadow: inset 0 0 0 1.5px var(--edge), 0 2px 0 var(--edge); }
  .lookprev .lp-turf { position: absolute; left: 0; right: 0; bottom: 0; height: 24px; border-top: 2px solid var(--chalk); background: repeating-linear-gradient(90deg, var(--turf) 0 26px, var(--turf2) 26px 52px); }
  .lookprev[data-prev='sports'] .lp-people { z-index: 1; }
  .lookprev[data-prev='sports'] .lp-people i { box-shadow: 0 0 0 1.5px #fff; }
  .lookprev .lp-ring { width: 56px; height: 56px; border-radius: 50%; border: 8px solid var(--track); border-top-color: var(--accent); border-right-color: var(--p-1); flex-shrink: 0; }
`;

const OWNER = new Map<string, string[]>();
for (const [tag, names] of Object.entries(HOOKS.parts)) for (const n of names) OWNER.set(n, [...(OWNER.get(n) ?? []), tag]);

/**
 * Expand a look's rules: role rules apply in every component, part rules only inside the component that owns the part.
 * The look's tag may carry host state and a width limit: `@O[data-phone] .dock` applies on phones only,
 * `@O<700 .dayview` on any screen narrower than 700 px.
 */
const scope = (css: string, id: LookId): string => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/([^{}]+)\{([^{}]*)\}/g, (_m, sels: string, body: string) => {
  const byWidth = new Map<string, string[]>();
  for (const sel of sels.split(',')) {
    let owners: string[] | null = null;
    for (const m of sel.replace(/\[[^\]]*\]/g, '').matchAll(/\.([a-zA-Z][\w-]*)/g)) {
      const o = OWNER.get(m[1]);
      if (o && !HOOKS.roles.includes(m[1])) owners = owners ? owners.filter((x) => o.includes(x)) : o;
    }
    const tag = /^@[A-Z](?:<(\d+))?((?:\[[^\]]+\])*)/.exec(sel.trim());
    const host = `:host(${owners?.length === 1 ? owners[0] : ''}[data-look='${id}']${tag?.[2] ?? ''})`;
    const max = tag?.[1] ?? '';
    byWidth.set(max, [...(byWidth.get(max) ?? []), sel.trim().replace(/^@[A-Z](?:<\d+)?(?:\[[^\]]+\])*/, host)]);
  }
  return [...byWidth].map(([max, list]) => (max ? `@media (max-width: ${Number(max) - 1}px) { ${list.join(', ')} {${body}} }\n` : `${list.join(', ')} {${body}}\n`)).join('');
});

/** A look's tokens as rules on the root, so evening (and any later state) can override them in CSS. */
const tokens = (l: LookDef): string => {
  if (!l.vars) return '';
  const decl = (v: Record<string, string>): string => Object.entries(v).map(([k, x]) => `${k}:${x}`).join(';');
  const root = `:host([data-look='${l.id}']) .fh`;
  return `${root} {${decl(l.vars)}}\n${l.evening ? `${root}[data-tod='eve'], ${root}[data-tod='night'] {${decl(l.evening)}}\n` : ''}`;
};

export const lookCss = unsafeCSS(KEYFRAMES + PREVIEW + LOOKS.map(tokens).join('') + scope(GLASS, 'glass') + scope(FRIDGE, 'fridge') + scope(ORBIT, 'orbit') + sportsArt() + scope(SPORTS, 'sports'));
