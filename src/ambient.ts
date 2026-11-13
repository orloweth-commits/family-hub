import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { bush } from './scenes/bush';
import { fridge } from './scenes/fridge';
import { reef } from './scenes/reef';
import { sea } from './scenes/sea';
import { space } from './scenes/space';
import { sports } from './scenes/sports';
import type { Ctx, Lay, Scene, Visitor } from './scenes/types';

/**
 * Quiet life behind the page: a layer under everything that never takes a touch.
 * Each look has a little that is always there (stars that twinkle, glints on the water, bubbles)
 * and a few surprises that wander through now and then (a shooting star, a flying saucer, a gull, an ant).
 * Calm mode and "reduce motion" switch the whole layer off.
 */

// the notes on the fridge door can only jiggle together if their tilt is a number the browser can animate
try { (CSS as unknown as { registerProperty?: (d: object) => void }).registerProperty?.({ name: '--tilt', syntax: '<number>', inherits: true, initialValue: '1' }); } catch { /* already registered */ }


/** Which world plays behind each look and photo theme. Sunset shares the sea's world; Orbit shares space's. */
const SCENES: Record<string, Scene> = { sea, sunset: sea, reef, bush, space, orbit: space, fridge, sports };
/** looks with a world of their own; every other look takes the world of its photo theme */
const OWN = new Set(['fridge', 'orbit', 'sports']);
/** the preview's `&scene=<id>` shows one world whatever the look is */
const forced = (): string => { try { return String((globalThis as { __fhScene?: string }).__fhScene ?? ''); } catch { return ''; } };
interface Guest { v: Visitor; id: number; y: number; x: number; flip: boolean; out?: boolean }

/* What the two layers of a `solo` world share: who is connected, who came last, and when the rare visitors came. */
const live = new Set<FhAmbient>();
const memo: { last: string; log: Map<string, number>; rare: number[] } = { last: '', log: new Map(), rare: [] };
const sameDay = (a: number, b: number): boolean => new Date(a).toDateString() === new Date(b).toDateString();
const weightOf = (v: Visitor, c: Ctx): number => (typeof v.weight === 'function' ? v.weight(c) : v.weight ?? 1);

export class FhAmbient extends LitElement {
  static styles = [css`
    :host { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; contain: strict; }
    :host([front]) { z-index: 6; }
    @media (prefers-reduced-motion: reduce) { :host(:not([world])) { display: none; } }
    /* Visitors never pass behind (or in front of) the greeting, the clock and the date at the top left, or the dock along the bottom:
       they slip out of sight there, the way they would behind a panel. Two boxes, because each mask can only say "keep this OR that". */
    .cast, .keep, .lane { position: absolute; inset: 0; }
    .cast { -webkit-mask-image: linear-gradient(to bottom, transparent 100px, #000 124px), linear-gradient(to right, transparent min(390px, 70%), #000 calc(min(390px, 70%) + 36px)); mask-image: linear-gradient(to bottom, transparent 100px, #000 124px), linear-gradient(to right, transparent min(390px, 70%), #000 calc(min(390px, 70%) + 36px)); }
    .keep { -webkit-mask-image: linear-gradient(to top, transparent 104px, #000 128px), linear-gradient(to right, #000 calc(50% - 570px), transparent calc(50% - 534px), transparent calc(50% + 534px), #000 calc(50% + 570px)); mask-image: linear-gradient(to top, transparent 104px, #000 128px), linear-gradient(to right, #000 calc(50% - 570px), transparent calc(50% - 534px), transparent calc(50% + 534px), #000 calc(50% + 570px)); }
    .dot { position: absolute; left: var(--x); top: var(--y); border-radius: 50%; }
    .guest { position: absolute; left: 0; top: var(--y); will-change: transform; color: rgba(40,50,70,.55); }
    .guest[data-flip] svg { transform: scaleX(-1); }
    .guest[data-out] { opacity: 0; transition: opacity var(--m-2, 160ms) linear; }
    .across { animation: across var(--t) linear both; } .guest[data-flip].across { animation-name: back; }
    @keyframes across { from { transform: translateX(-200px); } to { transform: translateX(calc(100vw + 60px)); } }
    @keyframes back { from { transform: translateX(calc(100vw + 60px)); } to { transform: translateX(-200px); } }
    .bobbing > svg, .wobble > svg { animation: bob 2.4s ease-in-out infinite alternate; } .wobble > svg { animation-duration: 1.1s; }
    @keyframes bob { from { translate: 0 -7px; rotate: -4deg; } to { translate: 0 7px; rotate: 4deg; } }
    .streak { animation: streak var(--t) ease-in both; } .guest[data-flip].streak { animation-name: streakb; }
    @keyframes streak { from { transform: translate(-10vw, 0) rotate(18deg); opacity: 0; } 15% { opacity: 1; } to { transform: translate(70vw, 26vh) rotate(18deg); opacity: 0; } }
    @keyframes streakb { from { transform: translate(105vw, 0) rotate(-18deg); opacity: 0; } 15% { opacity: 1; } to { transform: translate(25vw, 26vh) rotate(-18deg); opacity: 0; } }
    .up { left: var(--x); top: auto; bottom: -70px; animation: up var(--t) linear both; }
    @keyframes up { from { transform: translate(0, 0); } 50% { transform: translate(5vw, -55vh); } to { transform: translate(-2vw, -112vh); } }
    .down { left: var(--x); top: -40px; animation: down var(--t) ease-in-out both; }
    @keyframes down { from { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(7vw, 26vh) rotate(80deg); } 50% { transform: translate(-3vw, 54vh) rotate(-40deg); } 75% { transform: translate(6vw, 82vh) rotate(60deg); } to { transform: translate(0, 112vh) rotate(0deg); } }
    .flit { animation: flit var(--t) ease-in-out both; }
    @keyframes flit { from { transform: translate(-60px, 20vh); } 20% { transform: translate(22vw, -6vh); } 40% { transform: translate(40vw, 12vh); } 60% { transform: translate(58vw, -10vh); } 80% { transform: translate(80vw, 8vh); } to { transform: translate(calc(100vw + 40px), -4vh); } }
    .buzz { animation: buzz var(--t) linear both; }
    @keyframes buzz { from { transform: translate(-30px, 10vh); } 12% { transform: translate(18vw, -4vh); } 22% { transform: translate(30vw, 9vh); } 34% { transform: translate(44vw, 2vh); } 40%, 62% { transform: translate(52vw, 6vh); } 72% { transform: translate(64vw, -8vh); } 86% { transform: translate(84vw, 5vh); } to { transform: translate(calc(100vw + 30px), -6vh); } }
    .peek { left: auto; right: 0; animation: peek var(--t) ease-in-out both; }
    @keyframes peek { from, to { transform: translateX(100%); } 18%, 80% { transform: translateX(34%); } 30%, 34% { transform: translateX(34%) rotate(-5deg); } }
    .foot { top: auto; bottom: 4px; }
  `, ...Object.values({ sea, reef, bush, space, fridge, sports }).map((s) => s.css)];
  static properties = { look: { reflect: true }, theme: { reflect: true }, tod: {}, calm: { type: Boolean }, hold: { type: Boolean }, demo: {}, front: { type: Boolean, reflect: true }, _guest: { state: true }, _lay: { state: true } };
  look = 'glass'; theme = 'sea'; tod: Ctx['tod'] = 'day'; calm = false;
  /** the card sets this while a sheet, the night screen or an alarm is up: a `solo` world then sends its visitor away and waits */
  hold = false;
  /** show one visitor straight away, by id (the preview and the tests use this) */
  demo = '';
  /** the layer in front of the page: it shows only visitors marked `front` */
  front = false;
  private _guest: Guest | null = null;
  private _lay: Lay | undefined;
  private _t = 0; private _n = 0; private _ro?: ResizeObserver;

  private get _scene(): Scene | undefined { return SCENES[forced() || (OWN.has(this.look) ? this.look : this.theme)]; }
  private get _ctx(): Ctx { const d = new Date(); return { look: this.look, theme: this.theme, tod: this.tod, mins: d.getHours() * 60 + d.getMinutes(), weekday: d.getDay(), month: d.getMonth() + 1, date: d.getDate(), lay: this._lay, rainy: !!this.parentElement?.classList.contains('rainy') }; }
  private get _still(): boolean { return this.calm || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  /** who may come now. A `solo` world is cast as one over both layers, leaves out whoever came last and keeps the rare ones rare. */
  private get _cast(): Visitor[] {
    const c = this._ctx, sc = this._scene;
    if (!sc?.solo) return (sc?.cast ?? []).filter((v) => !!v.front === this.front && (!v.when || v.when(c)));
    const all = sc.cast.filter((v) => this._due(v, sc, c) && (!v.when || v.when(c))), fresh = all.filter((v) => v.id !== memo.last);
    return fresh.length ? fresh : all;
  }
  private _due(v: Visitor, sc: Scene, c: Ctx): boolean {
    if (!v.max) return true;
    const now = Date.now(), r = sc.rare, t = memo.log.get(v.id);
    if (r) { const today = memo.rare.filter((x) => sameDay(x, now)); if ((r.until != null && c.mins >= r.until) || today.length >= r.day || today.some((x) => now - x < r.every)) return false; }
    return t == null || (v.max === 'hour' ? now - t >= 3_600_000 : !sameDay(t, now));
  }
  /** the other layer of the same card */
  private get _peers(): FhAmbient[] { return [...live].filter((p) => p !== this && p.parentNode === this.parentNode); }
  /** where the page's furniture is, for worlds whose visitors keep to the free lanes around it */
  private _measure(): Lay | undefined {
    const fh = this.parentElement, w = this.offsetWidth, h = this.offsetHeight;
    if (!fh || !w || !h) return undefined;
    const body = fh.querySelector<HTMLElement>(':scope > .body'), dock = fh.querySelector<HTMLElement>(':scope > nav'), cs = getComputedStyle(fh), px = (n: string, d: number): number => parseFloat(cs.getPropertyValue(n)) || d;
    const top = body ? body.offsetTop : px('--top', 110), bottom = body ? body.offsetTop + body.offsetHeight : h - px('--bot', 122);
    if (!dock || getComputedStyle(dock).position === 'fixed') return { w, h, top, bottom, dl: 0, dr: w, dt: h, db: h, gutter: 0, strip: 0, corner: 0, phone: true };
    const dl = dock.offsetLeft, dr = dl + dock.offsetWidth, dt = dock.offsetTop, db = dt + dock.offsetHeight;
    return { w, h, top, bottom, dl, dr, dt, db, gutter: Math.max(0, dt - bottom), strip: Math.max(0, h - db), corner: Math.max(0, Math.min(dl, w - dr)), phone: false };
  }
  private _remeasure(): void { if (!this._scene?.solo) return; const l = this._measure(), o = this._lay; if (l && (!o || (Object.keys(l) as (keyof Lay)[]).some((k) => l[k] !== o[k]))) this._lay = l; }
  private _vis = (): void => { if (!this._scene?.solo) return; if (document.hidden) { clearTimeout(this._t); this._guest = null; } else this._plan(); };

  connectedCallback(): void {
    super.connectedCallback(); live.add(this); this._plan(true); document.addEventListener('visibilitychange', this._vis);
    if (typeof ResizeObserver === 'function') { this._ro = new ResizeObserver(() => this._remeasure()); this._ro.observe(this); }
  }
  disconnectedCallback(): void { super.disconnectedCallback(); live.delete(this); clearTimeout(this._t); document.removeEventListener('visibilitychange', this._vis); this._ro?.disconnect(); }
  updated(ch: Map<string, unknown>): void {
    const sc = this._scene;
    this.toggleAttribute('world', !!sc?.still);
    if (ch.has('look') || ch.has('theme')) this._remeasure();
    if (ch.has('demo') && this.demo) { const v = (sc?.cast ?? []).find((x) => x.id === this.demo && !!x.front === this.front); if (v) this._show(v, true); }
    if (ch.has('calm') && this.calm) this._guest = null;
    if (ch.has('hold') && this.hold && sc?.solo) this._leave();
  }

  /** The next visitor comes after a while: sooner the first time, then every half-minute to a minute and a half.
   *  A `solo` world is run from the back layer alone, and its gap is counted from when the last visitor has gone. */
  private _plan(first = false): void {
    clearTimeout(this._t);
    const gap = this._scene?.solo ? this._scene.gap : undefined;
    this._t = window.setTimeout(() => {
      const sc = this._scene;
      if (sc?.solo) { if (!this.front && !this._turn()) this._plan(); return; }
      if (!this._still && !document.hidden && !this._guest) { const c = this._ctx, cast = this._cast, total = cast.reduce((n, v) => n + weightOf(v, c), 0); let pick = Math.random() * total; const v = cast.find((x) => (pick -= weightOf(x, c)) < 0); if (v) this._show(v); }
      this._plan();
    }, gap ? (first ? gap[0] + Math.random() * 6000 : gap[0] + Math.random() * (gap[1] - gap[0])) : (first ? 12_000 : 25_000) + Math.random() * (first ? 14_000 : 55_000) + (this.front ? 20_000 : 0));
  }
  /** a `solo` world's turn: one visitor, on whichever layer it belongs to. False when nobody came (the wait starts again). */
  private _turn(): boolean {
    if (this._still || this.hold || document.hidden || this._guest || this._peers.some((p) => p._guest)) return false;
    const c = this._ctx, cast = this._cast, total = cast.reduce((n, v) => n + weightOf(v, c), 0); let pick = Math.random() * total;
    const v = cast.find((x) => (pick -= weightOf(x, c)) < 0), on = v && (!!v.front === this.front ? this : this._peers.find((p) => p.front === !!v.front));
    if (!v || !on) return false;
    if (v.max) { const now = Date.now(); memo.log.set(v.id, now); memo.rare = [...memo.rare.filter((x) => sameDay(x, now)), now]; }
    return on._show(v);
  }
  private _show(v: Visitor, demo = false): boolean {
    if (this._still) return false;
    const solo = !!this._scene?.solo;
    if (solo) { if (this.hold || (document.hidden && !demo)) return false; for (const p of this._peers) p._guest = null; memo.last = v.id; this._lay = this._measure() ?? this._lay; }
    const id = ++this._n, [y0, y1] = v.y ?? [1, 10];
    this._guest = { v, id, y: y0 + Math.random() * (y1 - y0), x: 6 + Math.random() * 80, flip: v.flip !== false && Math.random() < 0.5 };
    window.setTimeout(() => { if (this._guest?.id === id) this._gone(); }, v.ms + (solo ? 120 : 400));
    return true;
  }
  /** the visitor has left; a `solo` world starts its quiet gap now */
  private _gone(): void { this._guest = null; if (this._scene?.solo) for (const p of [this, ...this._peers]) if (!p.front) p._plan(); }
  /** sent away early: it fades over --m-2, then goes */
  private _leave(): void { const g = this._guest; if (!g || g.out) return; this._guest = { ...g, out: true }; window.setTimeout(() => { if (this._guest?.id === g.id) this._gone(); }, 200); }
  render(): TemplateResult | typeof nothing {
    const sc = this._scene, still = this._still;
    if (!sc || (still && !sc.still)) return nothing;
    const g = still ? null : this._guest, l = sc.solo ? this._lay : undefined;
    /* a `solo` world's visitors are given the page's furniture as lengths, so their paths can be written against it */
    const lay = l ? `;--aw:${l.w}px;--ah:${l.h}px;--at:${l.top}px;--ab:${l.bottom}px;--dl:${l.dl}px;--dr:${l.dr}px;--dt:${l.dt}px;--db:${l.db}px;--sy:${(l.strip >= 10 ? (l.db + l.h) / 2 : l.dt - 4).toFixed(1)}px;--gk:${Math.max(0.5, Math.min(1, (l.gutter + 12) / 28)).toFixed(2)}` : '';
    const guest = g ? html`<span class="guest ${g.v.move}" data-kind=${g.v.id} ?data-flip=${g.flip} ?data-out=${!!g.out} style="--y:${g.y.toFixed(1)}%;--x:${g.x.toFixed(1)}%;--t:${g.v.ms}ms${lay}">${g.v.art}</span>` : nothing;
    /* each visitor of a `solo` world gets an element of its own, so one that takes another's place starts its animations afresh */
    const fresh = g && sc.solo ? keyed(g.id, guest) : guest;
    return html`${this.front ? nothing : sc.always(this._ctx)}${g ? (g.v.lane ? html`<div class="lane">${fresh}</div>` : html`<div class="cast"><div class="keep">${fresh}</div></div>`) : nothing}`;
  }
}
if (!customElements.get('fh-ambient')) customElements.define('fh-ambient', FhAmbient);
