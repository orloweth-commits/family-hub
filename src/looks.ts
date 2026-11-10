import { html, svg, unsafeCSS, type ReactiveController, type ReactiveControllerHost, type TemplateResult } from 'lit';

/* ------------------------------------------------------------------ *
 * Looks: whole design languages, one level above themes.
 * "glass" is the original (themes pick its photo and colours); the others
 * bring their own background, type and shapes. Every component gets a
 * `data-look` attribute on its host, and the rules below key off it.
 * ------------------------------------------------------------------ */

export type LookId = 'glass' | 'fridge' | 'orbit';
export interface LookDef { id: LookId; name: string; tagline: string; swatch: string; fonts?: string; vars?: Record<string, string> }

export const LOOK_KEY = 'family-hub-look';

export const LOOKS: LookDef[] = [
  { id: 'glass', name: 'Glass', tagline: 'Frosted panels over a photo', swatch: 'linear-gradient(160deg,#8ecbf0,#f3e3c4)' },
  {
    id: 'fridge', name: 'Fridge door', tagline: 'Sticky notes and magnets', swatch: '#e4eaec',
    fonts: 'family=Caveat:wght@600;700&family=Fredoka:wght@500;600;700&family=Patrick+Hand',
    vars: {
      '--ink': '#2b2b2b', '--ink2': '#55524c', '--ink3': '#6f6b63', '--glass': '#ffffff', '--glass-line': 'transparent', '--shadow': '0 5px 8px rgba(0,0,0,.16)',
      '--chip': 'rgba(43,43,43,.07)', '--chip-strong': '#ffffff', '--chip-soft': 'rgba(43,43,43,.045)', '--chip-faint': 'rgba(43,43,43,.02)', '--track': 'rgba(43,43,43,.14)',
      '--primary': '#d8342b', '--on-primary': '#ffffff', '--accent': '#c25e00', '--ok': '#1f8a4c',
      '--p-1': '#2563eb', '--p-2': '#db2777', '--p-3': '#0d9488', '--p-4': '#ea580c', '--p-5': '#7c3aed', '--p-family': '#475569', '--on-person': '#ffffff', '--bg': 'none'
    }
  },
  {
    id: 'orbit', name: 'Orbit', tagline: 'Dark, calm, built from rings', swatch: '#0a0f1e',
    fonts: 'family=Outfit:wght@200;300;400;500;600',
    vars: {
      '--ink': '#eef1fa', '--ink2': '#a7b0cc', '--ink3': '#8791b3', '--glass': 'rgba(255,255,255,.045)', '--glass-line': 'rgba(255,255,255,.11)', '--shadow': 'none',
      '--chip': 'rgba(255,255,255,.08)', '--chip-strong': 'rgba(255,255,255,.16)', '--chip-soft': 'rgba(255,255,255,.04)', '--chip-faint': 'rgba(255,255,255,.02)', '--track': 'rgba(255,255,255,.14)',
      '--primary': '#ffe08a', '--on-primary': '#0a0f1e', '--accent': '#ffe08a', '--ok': '#6ee7c0',
      // same hue per person as every other look, lifted for a dark ground
      '--p-1': '#7cb7ff', '--p-2': '#ff8fb1', '--p-3': '#6ee7c0', '--p-4': '#ff9f6b', '--p-5': '#c9a7ff', '--p-family': '#cbd5e1', '--on-person': '#0a0f1e', '--bg': 'none'
    }
  }
];

export const lookById = (id: string | null | undefined): LookDef => LOOKS.find((l) => l.id === id) ?? LOOKS[0];
/** Inline custom properties for a look, or '' for glass (themes supply them). */
export const lookStyle = (l: LookDef): string => (l.vars ? Object.entries(l.vars).map(([k, v]) => `${k}:${v}`).join(';') : '');

let current: LookId = 'glass';
const subs = new Set<() => void>();
export const getLook = (): LookId => current;
export const setLook = (id: LookId): void => {
  current = lookById(id).id;
  loadLookFonts(current);
  subs.forEach((f) => f());
};
function loadLookFonts(id: LookId): void {
  const f = lookById(id).fonts, key = `family-hub-fonts-${id}`;
  if (!f || document.getElementById(key)) return;
  const l = document.createElement('link');
  l.id = key; l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?${f}&display=swap`;
  document.head.appendChild(l);
}

/** Keeps a component's `look` host attribute in step with the chosen look. */
export class LookController implements ReactiveController {
  private _on = (): void => { this.host.setAttribute('data-look', current); this.host.requestUpdate(); };
  constructor(private host: ReactiveControllerHost & HTMLElement) { host.addController(this); }
  hostConnected(): void { subs.add(this._on); this.host.setAttribute('data-look', current); }
  hostDisconnected(): void { subs.delete(this._on); }
}

/* ---------------- little drawings the looks add ---------------- */

/** Fridge: a kitchen wall clock. */
export const wallClock = (now: Date, size = 62): TemplateResult => {
  const h = (now.getHours() % 12) * 30 + now.getMinutes() * 0.5, m = now.getMinutes() * 6;
  return html`<svg class="aclock" role="img" aria-label="Clock" width=${size} height=${size} viewBox="0 0 116 116">${svg`
    <circle cx="58" cy="58" r="53" fill="#fff" stroke="#2b2b2b" stroke-width="6"></circle>
    ${Array.from({ length: 12 }, (_, i) => svg`<rect x="56.5" y="11" width="3" height=${i % 3 ? 6 : 11} fill="#2b2b2b" transform="rotate(${i * 30} 58 58)"></rect>`)}
    <rect x="55" y="30" width="6" height="30" rx="3" fill="#2b2b2b" transform="rotate(${h} 58 58)"></rect>
    <rect x="56.25" y="17" width="3.5" height="43" rx="1.75" fill="#2b2b2b" transform="rotate(${m} 58 58)"></rect>
    <rect class="sec" x="57.2" y="15" width="1.6" height="50" fill="#d8342b"></rect>
    <circle cx="58" cy="58" r="4.5" fill="#d8342b"></circle>`}</svg>`;
};

export interface DialArc { start: Date; end: Date; allDay: boolean; colour: string }
/**
 * Orbit: a day as a 24-hour ring, midday at the top. Events are arcs in their
 * person's colour; pass `now` to draw the hand for the current time.
 */
export const dayDial = (arcs: DialArc[], size: number, now?: Date, cls = 'dial'): TemplateResult => {
  const r = 40, C = 2 * Math.PI * r, sw = size >= 60 ? 9 : 12;
  const deg = (d: Date): number => ((d.getHours() + d.getMinutes() / 60 - 12) / 24) * 360;
  const timed = arcs.filter((a) => !a.allDay), all = arcs.filter((a) => a.allDay);
  return html`<svg class=${cls} aria-hidden="true" width=${size} height=${size} viewBox="0 0 100 100" fill="none">${svg`
    <circle cx="50" cy="50" r=${r} stroke="var(--track)" stroke-width=${sw}></circle>
    ${all.slice(0, 1).map((a) => svg`<circle cx="50" cy="50" r=${r - sw / 2 - 2.5} stroke=${a.colour} stroke-width="2.5"></circle>`)}
    ${timed.map((a) => {
      const mins = Math.max(45, Math.min(24 * 60, (a.end.getTime() - a.start.getTime()) / 60000));
      return svg`<circle cx="50" cy="50" r=${r} stroke=${a.colour} stroke-width=${sw} stroke-dasharray="${(mins / 1440) * C} ${C}" transform="rotate(${deg(a.start) - 90} 50 50)"></circle>`;
    })}
    ${now ? svg`<g transform="rotate(${deg(now)} 50 50)"><line x1="50" y1="22" x2="50" y2="2" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"></line><circle class="nowdot" cx="50" cy="10" r="4.5" fill="var(--accent)"></circle></g>` : svg``}`}</svg>`;
};

/** Orbit: countdown ring for the kitchen timer. */
export const timerRing = (frac: number, size = 84): TemplateResult => {
  const C = 2 * Math.PI * 44;
  return html`<svg class="tring" aria-hidden="true" width=${size} height=${size} viewBox="0 0 100 100" fill="none">${svg`
    <circle cx="50" cy="50" r="44" stroke="var(--track)" stroke-width="6"></circle>
    <circle cx="50" cy="50" r="44" stroke="var(--p-4)" stroke-width="6" stroke-linecap="round" stroke-dasharray="${Math.max(0, Math.min(1, frac)) * C} ${C}" transform="rotate(-90 50 50)" style="transition:stroke-dasharray 1s linear"></circle>`}</svg>`;
};

/* ---------------- look styles (shared by every component) ---------------- */

const FRIDGE = `
  @F .fh { font-family: 'Patrick Hand', 'Comic Sans MS', cursive; font-size: 17px; background: #e4eaec radial-gradient(rgba(255,255,255,.75) 1px, transparent 1.5px) 0 0 / 14px 14px; }
  @F .fh::before { display: none; }
  @F h1, @F h2, @F .display { font-family: 'Caveat', 'Patrick Hand', cursive; letter-spacing: 0; }
  @F h1 { font-size: 42px !important; line-height: .95; }
  @F .glass { background: #fff; -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; border-radius: 4px; box-shadow: var(--shadow); }
  @F .glass.round { border-radius: 50%; }
  @F .label { font-family: 'Fredoka', sans-serif; letter-spacing: .06em; }
  @F .pill, @F .round { background: #fff; box-shadow: inset 0 0 0 2px #2b2b2b; font-family: 'Fredoka', sans-serif; font-weight: 600; }
  @F .pill.primary, @F .primary { background: var(--primary); color: #fff; box-shadow: 0 4px 0 #8f1f18; }
  @F .toast { font-family: 'Fredoka', sans-serif; }

  /* header */
  @F .clock { display: grid; grid-template-columns: auto 1fr; column-gap: 14px; align-items: center; }
  @F .clock .aclock { grid-row: 1 / span 2; filter: drop-shadow(0 3px 4px rgba(0,0,0,.22)); }
  @F .clock .aclock .sec { transform-origin: 58px 58px; animation: fhSec 60s steps(60) infinite; }
  @keyframes fhSec { to { transform: rotate(360deg); } }
  @F .clock .hm { font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 50px; }
  @F .cap { background: #fff; -webkit-backdrop-filter: none; backdrop-filter: none; border: 0; border-radius: 3px; box-shadow: 0 3px 5px rgba(0,0,0,.18); transform: rotate(-1.2deg); font-family: 'Fredoka', sans-serif; font-weight: 600; }
  @F .cap:nth-child(even) { transform: rotate(1deg); }
  @F .cap.hot { background: #d8342b; color: #fff; }
  @F .weather { border-radius: 4px; transform: rotate(-1deg); position: relative; }
  @F .weather::after { content: ''; position: absolute; top: -8px; left: 22px; width: 18px; height: 18px; border-radius: 50%; background: #2f6fd0; box-shadow: 0 2px 3px rgba(0,0,0,.3), inset 0 -3px 0 rgba(0,0,0,.18); }
  @F .presence { background: transparent; box-shadow: none; gap: 2px; padding: 0 4px; }
  @F .presence .avatar { background: transparent !important; color: var(--c); font-family: 'Fredoka', sans-serif; font-weight: 700; font-size: 34px !important; width: 30px !important; height: 44px !important; border-radius: 0; text-shadow: 0 3px 0 rgba(0,0,0,.18); }
  @F .presence .avatar.away { color: #5b6468; opacity: .75 !important; transform: rotate(16deg) translateY(4px); text-shadow: none; }
  @F header .right > button.round { box-shadow: 0 4px 5px rgba(0,0,0,.28), inset 0 -4px 0 rgba(0,0,0,.18); color: #fff; background: #7b4bc9; }
  @F header .right > button.round:nth-last-child(1) { background: #2b2b2b; color: #ffd75a; }
  @F header .right > button.round:nth-last-child(2) { background: #1f8a4c; }

  /* planner: the panel disappears, each day is a sticky note */
  @F .planner { background: transparent; box-shadow: none; padding: 4px 0 0; animation: none; }
  @F .planner h1 { background: linear-gradient(transparent 62%, #ffe27a 62%, #ffe27a 92%, transparent 92%); align-self: flex-start; padding: 0 6px 0 2px; }
  @F .seg { background: transparent; padding: 0; gap: 4px; align-items: flex-end; border-radius: 0; }
  @F .seg button { height: 36px; border-radius: 10px 10px 0 0; background: #cfd8db; color: var(--ink); font-size: 17px; font-weight: 400; }
  @F .seg button[aria-pressed='true'] { height: 42px; background: #fff; box-shadow: 0 -2px 4px rgba(0,0,0,.12); font-weight: 400; }
  @F .legend { font-size: 15px; font-weight: 400; }
  @F .week { gap: 10px; padding: 4px 4px 8px; }
  @F .col { position: relative; border-radius: 2px; padding: 24px 8px 8px; background: #cfe8ff; box-shadow: 0 6px 8px rgba(0,0,0,.18); transform: rotate(-.7deg); }
  @F .col:nth-child(7n+2) { background: #ffd3dc; transform: rotate(.9deg); }
  @F .col:nth-child(7n+3) { background: #d5f2c4; transform: rotate(-.4deg); }
  @F .col:nth-child(7n+4) { background: #ffddb5; transform: rotate(1.2deg); }
  @F .col:nth-child(7n+5) { background: #e6d8ff; transform: rotate(-1deg); }
  @F .col:nth-child(7n+6) { background: #c9f0e4; transform: rotate(.6deg); }
  @F .col.today { background: #fff2a1; box-shadow: 0 9px 14px rgba(0,0,0,.24); transform: rotate(-1.1deg) scale(1.015); }
  @F .col::before { content: ''; position: absolute; top: 4px; left: 50%; margin-left: -9px; width: 18px; height: 18px; border-radius: 50%; background: #2f6fd0; box-shadow: 0 2px 3px rgba(0,0,0,.3), inset 0 -3px 0 rgba(0,0,0,.18); }
  @F .col:nth-child(3n)::before { background: #1f8a4c; }
  @F .col:nth-child(3n+2)::before { background: #7b4bc9; }
  @F .col.today::before { background: #d8342b; width: 22px; height: 22px; margin-left: -11px; top: 2px; }
  @F .dayhead { font-family: 'Fredoka', sans-serif; }
  @F .num { font-weight: 700; }
  @F .ev { background: transparent; border-left: 0; border-radius: 0; padding: 2px 4px 6px; border-bottom: 1.5px dashed rgba(43,43,43,.2); gap: 0; }
  @F .ev .t { font-size: 14px; font-weight: 400; }
  @F .ev .n { font-family: 'Caveat', cursive; font-weight: 700; font-size: 24px; line-height: .98; color: color-mix(in srgb, var(--c) 70%, #000); hyphens: none; }
  @F .today .ev .n { font-size: 29px; }
  @F .ev .w { font-size: 13px; font-weight: 400; }
  @F .more { background: transparent; text-decoration: underline; font-weight: 400; font-size: 15px; }
  @F .cell { border-radius: 2px; background: #fff; box-shadow: 0 2px 3px rgba(0,0,0,.12); }
  @F .cell.out { background: rgba(255,255,255,.45); box-shadow: none; }
  @F .cell.today { background: #fff2a1; }
  @F .dayrow { background: #fff !important; border-left-width: 10px !important; border-radius: 2px; box-shadow: 0 3px 5px rgba(0,0,0,.14); }
  @F .dayrow span span:first-child { font-family: 'Caveat', cursive; font-size: 28px !important; line-height: 1; }

  /* side cards */
  @F aside { gap: 14px; }
  @F aside .card { border-radius: 4px; transform: rotate(.5deg); padding: 12px 14px; gap: 8px; }
  @F aside .card:last-child { overflow: hidden; }
  @F .timerrow .display { font-size: 40px !important; line-height: .9; }
  @F aside .card:nth-child(even) { transform: rotate(-.7deg); }
  @F aside .np { background: #2f2a26; border-radius: 10px; --ink: #fff; --ink2: #d9d2c5; color: #fff; box-shadow: 0 5px 8px rgba(0,0,0,.25); }
  @F aside .np .np-row { background: #fff6dc; color: #2b2b2b; --ink2: #55524c; border-radius: 4px; padding: 6px 10px; }
  @F aside .np .np-row span:first-child { font-family: 'Caveat', cursive; font-size: 24px !important; line-height: 1; }
  @F .art { border-radius: 50%; width: 46px; height: 46px; background: radial-gradient(circle, #141210 0 16%, #ede6d6 17% 100%) !important; box-shadow: inset 0 0 0 5px #141210; }
  @F .playing .art { animation: fhSpin 3s linear infinite; background: conic-gradient(#ede6d6 0 8%, #141210 8% 10%, #ede6d6 10% 33%, #141210 33% 35%, #ede6d6 35% 58%, #141210 58% 60%, #ede6d6 60% 83%, #141210 83% 85%, #ede6d6 85%) !important; }
  @keyframes fhSpin { to { transform: rotate(360deg); } }
  @F .grid3 button { background: transparent; border: 2px dashed #2b2b2b; border-radius: 22px; height: 44px; font-size: 17px; font-weight: 400; }
  @F .rem { font-weight: 400; font-size: 17px; line-height: 1.1; }
  @F .rem .ring { border-radius: 5px 8px 6px 9px; border: 2px solid #2b2b2b; width: 20px; height: 20px; }
  @F .xpbar, @F .xp { border: 2px solid #2b2b2b; background: #fff; height: 12px; border-radius: 8px; }
  @F .xpbar > div, @F .xp > div { background: #f5b301; border-radius: 0; }

  /* dock: a row of fridge magnets */
  @F nav.dock { background: transparent; box-shadow: none; gap: 8px; padding: 0; animation: none; }
  @F .dock .item { font-family: 'Fredoka', sans-serif; font-weight: 600; font-size: 13px; height: 76px; gap: 3px; border-radius: 0; }
  @F .dock .item svg.i { width: 52px !important; height: 52px !important; padding: 13px; border-radius: 50%; background: #2f6fd0; color: #fff; stroke-width: 2; box-shadow: 0 4px 5px rgba(0,0,0,.28), inset 0 -4px 0 rgba(0,0,0,.18); }
  @F .dock .item:nth-last-child(9) svg.i { background: #d8342b; }
  @F .dock .item:nth-last-child(8) svg.i { background: #1f8a4c; }
  @F .dock .item:nth-last-child(7) svg.i { background: #f5b301; color: #2b2b2b; }
  @F .dock .item:nth-last-child(6) svg.i { background: #7b4bc9; }
  @F .dock .item:nth-last-child(3) svg.i { background: #ffd75a; color: #2b2b2b; }
  @F .dock .item:nth-last-child(2) svg.i { background: #2b2b2b; }
  @F .dock .item:nth-last-child(1) svg.i { background: #d8342b; }
  @F .dock .item[aria-current='page'] { background: transparent; }
  @F .dock .item[aria-current='page'] svg.i { box-shadow: 0 0 0 4px #fff, 0 0 0 6.5px #2b2b2b, 0 6px 6px 4px rgba(0,0,0,.2); }
  @F .dock .kidbtn .avatar { box-shadow: 0 4px 5px rgba(0,0,0,.28); }
  @F .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @F .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 4px #fff, 0 0 0 6.5px var(--kidc), 0 6px 6px 4px rgba(0,0,0,.2); }
  @F .dock .sep { background: transparent; margin: 0 2px; }
  @F .sheet { border-radius: 4px; }
  @F .tcard { border-radius: 4px; }

  /* kid page */
  @F .hero { overflow: visible; transform: rotate(-.6deg); }
  @F .hero::before { inset: -10px auto auto 50%; width: 96px; height: 24px; margin-left: -48px; background: color-mix(in srgb, var(--kid) 50%, #fff); opacity: .85; transform: rotate(-3deg); }
  @F .name { font-family: 'Caveat', cursive; font-size: 46px; color: color-mix(in srgb, var(--kid) 75%, #000); }
  @F .rank { font-family: 'Fredoka', sans-serif; font-weight: 600; }
  @F .stat { background: transparent; border: 2px dashed #7c898e; border-radius: 10px; }
  @F .stat b { font-family: 'Fredoka', sans-serif; font-weight: 700; }
  @F .stat span { font-weight: 400; font-size: 15px; }
  @F .dots button { border-color: #7c898e; }
  @F .dots button.g { background: #f5b301; border-color: #b97f00; }
  @F .next { background: transparent; border: 2px dashed #7c898e; border-radius: 10px; }
  @F .jobs { background: linear-gradient(90deg, transparent 0 69px, #f2a7a7 69px 71px, transparent 71px), #fff; }
  @F .sec h2 { font-size: 30px; line-height: 1; background: linear-gradient(transparent 60%, #ffe27a 60%, #ffe27a 92%, transparent 92%); padding: 0 4px; }
  @F .sec span { font-weight: 400; font-size: 15px; }
  @F .job { background: transparent; border-radius: 0; border-bottom: 1.5px solid #bfd6ea; min-height: 50px; padding-top: 6px; padding-bottom: 6px; }
  @F .job .box, @F .items .item .box { width: 30px; height: 30px; border-radius: 5px 9px 6px 10px; border: 2.5px solid #2b2b2b; }
  @F .job.done .box, @F .items .done .box { background: transparent; border-color: #2b2b2b; color: #d8342b; transform: none; font-family: 'Caveat', cursive; font-size: 38px; overflow: visible; }
  @F .done .box svg { width: 30px; height: 30px; stroke-width: 3.5; margin: -8px -8px 0 0; }
  @F .job .t, @F .items .txt { font-family: 'Caveat', cursive; font-weight: 700; font-size: 27px; line-height: 1; }
  @F .plus { font-family: 'Fredoka', sans-serif; font-weight: 600; }
  @F .play { font-family: 'Fredoka', sans-serif; box-shadow: 0 3px 0 #8f1f18; }
  @F .later { background: transparent; border: 2px dashed #7c898e; border-radius: 10px; font-weight: 400; }
  @F .side { border-radius: 0; overflow: visible; padding: 2px 4px; }
  @F .side > .card { transform: rotate(.6deg); }
  @F .side > .card:nth-child(even) { transform: rotate(-.8deg); }
  @F .tabs { background: transparent; border-radius: 0; padding: 0; }
  @F .tab { font-family: 'Fredoka', sans-serif; font-weight: 600; border-radius: 22px; }
  @F .tab[aria-pressed='true'] { box-shadow: 0 3px 0 #8f1f18; }
  @F .rw { background: transparent; border: 2px dashed #7c898e; border-radius: 8px; }
  @F .rw .n { font-weight: 400; font-size: 17px; }
  @F .rw button { font-family: 'Fredoka', sans-serif; font-weight: 600; }
  @F .pic { border-radius: 3px; background: #fff; box-shadow: 0 4px 6px rgba(0,0,0,.16); transform: rotate(-1deg); }
  @F .pic:nth-child(even) { transform: rotate(1.2deg); }
  @F .wk { font-size: 16px; }

  /* groceries: a shopping-list pad and chunky keys */
  @F .list.glass { background: linear-gradient(90deg, transparent 0 63px, #f2a7a7 63px 65px, transparent 65px), #fff; transform: rotate(-.5deg); }
  @F .items .item { background: transparent; border-radius: 0; border-bottom: 1.5px solid #bfd6ea; padding: 7px 6px; }
  @F .items { gap: 0; }
  @F .tag { font-family: 'Fredoka', sans-serif; font-weight: 500; }
  @F .field { background: transparent; box-shadow: none; border-bottom: 3px dashed #2b2b2b; border-radius: 0; font-family: 'Caveat', cursive; font-weight: 700; font-size: 36px; padding: 0 6px; }
  @F .key { font-family: 'Fredoka', sans-serif; font-weight: 600; background: #f7f4ec; border-radius: 8px 8px 14px 14px; box-shadow: 0 4px 0 #b9b2a2, 0 6px 6px rgba(0,0,0,.2); }
  @F .key:active { transform: translateY(3px); box-shadow: 0 1px 0 #b9b2a2; background: #f7f4ec; }
  @F .chip { background: transparent; border: 2px dashed #2b2b2b; font-size: 16px; font-weight: 400; }
  @F .who.glass { border-radius: 4px; transform: rotate(-1.5deg); }
`;

const ORBIT = `
  @O .fh { font-family: 'Outfit', 'Avenir Next', 'Segoe UI', sans-serif; background: #0a0f1e repeating-radial-gradient(circle at 30% 44%, transparent 0 89px, rgba(255,255,255,.04) 89px 90px); }
  @O .fh::before { display: none; }
  @O h1, @O h2, @O .display { font-family: 'Outfit', sans-serif; letter-spacing: -.01em; }
  @O h1 { font-weight: 300 !important; }
  @O h2 { font-weight: 400 !important; }
  @O .glass { -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: none; }
  @O .label { font-weight: 400; letter-spacing: .1em; }
  @O .pill, @O .round { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); font-weight: 400; }
  @O .pill.primary, @O .primary { background: var(--primary); color: var(--on-primary); box-shadow: none; font-weight: 500; }
  @O .toast { background: #eef1fa; color: #0a0f1e; font-weight: 500; }

  /* header */
  @O .clock { display: grid; grid-template-columns: auto 1fr; column-gap: 14px; align-items: center; }
  @O .clock .dial { grid-row: 1 / span 2; }
  @O .dial .nowdot { transform-box: fill-box; transform-origin: center; animation: fhPulse 2.4s ease-in-out infinite; }
  @keyframes fhPulse { 50% { transform: scale(1.5); } }
  @O .clock .hm { font-weight: 200; font-size: 62px; letter-spacing: -.03em; }
  @O .clock span { font-weight: 300 !important; }
  @O .cap { background: rgba(255,255,255,.06); -webkit-backdrop-filter: none; backdrop-filter: none; font-weight: 400; }
  @O .cap b { font-weight: 500; }
  @O .cap.hot { background: #ff8a7a; color: #0a0f1e; border-color: #ff8a7a; }
  @O .weather span { font-weight: 400 !important; }
  @O .badge { background: rgba(255,224,138,.16); font-weight: 500; }
  @O .presence { background: transparent; border-color: transparent; }
  @O .presence .avatar { font-weight: 600; }
  @O .presence .avatar.away { background: transparent !important; color: var(--ink2); box-shadow: inset 0 0 0 1.5px var(--ink3); opacity: 1 !important; }
  @O header .right > button.round { background: transparent; }

  /* planner */
  @O .planner { background: transparent; border-color: transparent; padding: 6px 0 0; }
  @O .seg { border-radius: 999px; padding: 4px; background: rgba(255,255,255,.06); }
  @O .seg button { border-radius: 999px; height: 36px; font-weight: 400; }
  @O .seg button[aria-pressed='true'] { background: #eef1fa; color: #0a0f1e; font-weight: 500; box-shadow: none; }
  @O .legend { font-weight: 400; }
  @O .col { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.09); border-radius: 26px; padding: 10px 8px; }
  @O .col.today { background: rgba(255,224,138,.06); border-color: rgba(255,224,138,.6); box-shadow: 0 0 44px rgba(255,224,138,.1); }
  @O .dayhead { padding: 2px 4px 6px 6px; }
  @O .dayhead .mini { margin-left: auto; }
  @O .dayhead .pchip { margin-left: 0; }
  @O .dayhead span { font-weight: 400 !important; }
  @O .num { font-weight: 300; font-size: 22px; }
  @O .today .num { font-weight: 500; }
  @O .ev { background: color-mix(in srgb, var(--c) 13%, transparent); border-left: 0; border-radius: 18px; padding: 9px 10px 9px 12px; }
  @O .ev .t { color: var(--c); font-weight: 500; display: flex; align-items: center; gap: 6px; }
  @O .ev .t::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--c); flex-shrink: 0; }
  @O .ev .n { font-weight: 500; }
  @O .ev .w { font-weight: 300; }
  @O .more { background: transparent; font-weight: 400; }
  @O .cell { border-radius: 16px; border: 1px solid rgba(255,255,255,.07); }
  @O .cell.today { background: rgba(255,224,138,.1); border-color: rgba(255,224,138,.6); }
  @O .dayrow { border-left-width: 0 !important; border-radius: 22px; }

  /* side cards */
  @O aside .card { border-radius: 28px; }
  @O aside { gap: 14px; }
  @O .art { border-radius: 50%; background: radial-gradient(circle, #05070f 0 5%, #7cb7ff 6% 30%, #05070f 31% 44%, #1a2036 45% 46%, #05070f 47% 62%, #1a2036 63% 64%, #05070f 65% 82%, #1a2036 83% 84%, #05070f 85%) !important; box-shadow: 0 0 0 1px rgba(255,255,255,.25); position: relative; }
  @O .art::after { content: ''; position: absolute; inset: 4px; border-radius: 50%; border-top: 2px solid rgba(255,255,255,.5); }
  @O .playing .art { animation: fhSpin 4s linear infinite; }
  @keyframes fhSpin { to { transform: rotate(360deg); } }
  @O aside .card { padding: 14px 16px; gap: 10px; }
  @O aside .card:last-child { overflow: hidden; }
  @O .timerrow { align-items: center !important; gap: 12px !important; }
  @O .timerrow.on .hint { display: none; }
  @O .timerrow .display { font-weight: 300 !important; font-size: 30px !important; }
  @O .grid3 button { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); border-radius: 999px; font-weight: 400; height: 44px; }
  @O .rem { font-weight: 400; }
  @O .rem .ring { border-width: 1.5px; border-color: var(--ink2); }
  @O .xpbar, @O .xp { height: 4px; }
  @O .xpbar > div, @O .xp > div { background: var(--primary); }
  @O .progress > div { background: var(--p-1); }

  /* dock: a line of rings */
  @O nav.dock { background: transparent; border-color: transparent; gap: 6px; padding: 0; }
  @O .dock .item { font-size: 12px; font-weight: 400; color: var(--ink2); height: 78px; gap: 5px; border-radius: 0; }
  @O .dock .item svg.i { width: 52px !important; height: 52px !important; padding: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(255,255,255,.22); color: var(--ink); stroke-width: 1.5; }
  @O .dock .item[aria-current='page'] { background: transparent; color: var(--ink); font-weight: 500; }
  @O .dock .item[aria-current='page'] svg.i { background: var(--primary); color: var(--on-primary); box-shadow: 0 0 24px rgba(255,224,138,.35); }
  @O .dock .kidbtn[aria-current='page'] { box-shadow: none; }
  @O .dock .kidbtn[aria-current='page'] .avatar { box-shadow: 0 0 0 3px #0a0f1e, 0 0 0 5px var(--kidc), 0 0 24px var(--kidc); }
  @O .dock .sep { background: rgba(255,255,255,.14); }
  @O .sheet { background: #131a2e; }
  @O .scrim { background: rgba(3,5,12,.6); }

  /* kid page */
  @O .hero::before { inset: 0; height: auto; background: repeating-radial-gradient(circle at 50% 26%, transparent 0 43px, color-mix(in srgb, var(--kid) 38%, transparent) 43px 44px); -webkit-mask-image: radial-gradient(circle at 50% 26%, #000 22%, transparent 74%); mask-image: radial-gradient(circle at 50% 26%, #000 22%, transparent 74%); }
  @O .name { font-weight: 300; font-size: 40px; }
  @O .rank { background: transparent; color: var(--kid); box-shadow: inset 0 0 0 1px var(--kid); font-weight: 500; }
  @O .stat { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,.11); }
  @O .stat b { font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 36px; }
  @O .stat span { font-weight: 400; }
  @O .dots button { border-width: 1.5px; }
  @O .dots button.t { box-shadow: 0 0 0 2px #0a0f1e, 0 0 0 3.5px var(--kid); }
  @O .next { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,.11); }
  @O .sec { margin-top: 12px; }
  @O .sec h2 { font-size: 13px; font-weight: 500 !important; text-transform: uppercase; letter-spacing: .12em; color: var(--kid); }
  @O .sec span { font-weight: 300; }
  @O .job { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.09); }
  @O .job .box, @O .items .item .box { border-width: 1.5px; border-color: var(--ink2); }
  @O .job.done .box, @O .items .done .box { background: var(--primary); border-color: var(--primary); color: var(--on-primary); }
  @O .job .t, @O .items .txt { font-weight: 400; }
  @O .plus { background: transparent; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--kid) 70%, transparent); color: var(--kid); font-weight: 500; }
  @O .later { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,.11); font-weight: 400; }
  @O .tabs { background: rgba(255,255,255,.06); }
  @O .tab { font-weight: 400; }
  @O .tab[aria-pressed='true'] { font-weight: 500; }
  @O .rw { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.09); padding-left: 2px; }
  @O .rw .n { font-weight: 400; }
  @O .rw button { font-weight: 500; }
  @O .rw button.save { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); }
  @O .pic { background: rgba(255,255,255,.04); box-shadow: inset 0 0 0 1px rgba(255,255,255,.11); border-radius: 50%; aspect-ratio: 1; }

  /* groceries */
  @O .items .item { background: transparent; border-radius: 0; border-bottom: 1px solid rgba(255,255,255,.09); padding: 10px 4px; }
  @O .items { gap: 0; }
  @O .tag { font-weight: 500; }
  @O .field { background: transparent; box-shadow: none; border-bottom: 1px solid rgba(255,255,255,.35); border-radius: 0; font-weight: 300; font-size: 30px; padding: 0 4px; }
  @O .key { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); border-radius: 999px; font-weight: 300; }
  @O .key:active { background: rgba(255,255,255,.14); }
  @O .chip { background: transparent; box-shadow: inset 0 0 0 1px rgba(255,255,255,.2); font-weight: 400; }
  @O .who.glass { background: transparent; }
`;

export const lookCss = unsafeCSS(FRIDGE.replaceAll('@F', ":host([data-look='fridge'])") + ORBIT.replaceAll('@O', ":host([data-look='orbit'])"));
