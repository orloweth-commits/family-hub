import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { bush } from './scenes/bush';
import { fridge } from './scenes/fridge';
import { reef } from './scenes/reef';
import { sea } from './scenes/sea';
import { space } from './scenes/space';
import type { Ctx, Scene, Visitor } from './scenes/types';

/**
 * Quiet life behind the page: a layer under everything that never takes a touch.
 * Each look has a little that is always there (stars that twinkle, glints on the water, bubbles)
 * and a few surprises that wander through now and then (a shooting star, a flying saucer, a gull, an ant).
 * Calm mode and "reduce motion" switch the whole layer off.
 */

// the notes on the fridge door can only jiggle together if their tilt is a number the browser can animate
try { (CSS as unknown as { registerProperty?: (d: object) => void }).registerProperty?.({ name: '--tilt', syntax: '<number>', inherits: true, initialValue: '1' }); } catch { /* already registered */ }


/** Which world plays behind each look and photo theme. Sunset shares the sea's world; Orbit shares space's. */
const SCENES: Record<string, Scene> = { sea, sunset: sea, reef, bush, space, orbit: space, fridge };
interface Guest { v: Visitor; id: number; y: number; x: number; flip: boolean }

export class FhAmbient extends LitElement {
  static styles = [css`
    :host { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; contain: strict; }
    :host([front]) { z-index: 6; }
    @media (prefers-reduced-motion: reduce) { :host { display: none; } }
    .dot { position: absolute; left: var(--x); top: var(--y); border-radius: 50%; }
    .guest { position: absolute; left: 0; top: var(--y); will-change: transform; color: rgba(40,50,70,.55); }
    .guest[data-flip] svg { transform: scaleX(-1); }
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
  `, ...Object.values({ sea, reef, bush, space, fridge }).map((s) => s.css)];
  static properties = { look: {}, theme: {}, tod: {}, calm: { type: Boolean }, demo: {}, front: { type: Boolean, reflect: true }, _guest: { state: true } };
  look = 'glass'; theme = 'sea'; tod: Ctx['tod'] = 'day'; calm = false;
  /** show one visitor straight away, by id (the preview and the tests use this) */
  demo = '';
  /** the layer in front of the page: it shows only visitors marked `front` */
  front = false;
  private _guest: Guest | null = null;
  private _t = 0; private _n = 0;

  private get _scene(): Scene | undefined { return SCENES[this.look === 'fridge' || this.look === 'orbit' ? this.look : this.theme]; }
  private get _ctx(): Ctx { const d = new Date(); return { look: this.look, theme: this.theme, tod: this.tod, mins: d.getHours() * 60 + d.getMinutes(), weekday: d.getDay(), month: d.getMonth() + 1, date: d.getDate() }; }
  private get _still(): boolean { return this.calm || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  private get _cast(): Visitor[] { const c = this._ctx; return (this._scene?.cast ?? []).filter((v) => !!v.front === this.front && (!v.when || v.when(c))); }

  connectedCallback(): void { super.connectedCallback(); this._plan(true); }
  disconnectedCallback(): void { super.disconnectedCallback(); clearTimeout(this._t); }
  updated(ch: Map<string, unknown>): void { if (ch.has('demo') && this.demo) { const v = (this._scene?.cast ?? []).find((x) => x.id === this.demo && !!x.front === this.front); if (v) this._show(v); } if (ch.has('calm') && this.calm) this._guest = null; }

  /** The next visitor comes after a while: sooner the first time, then every half-minute to a minute and a half. */
  private _plan(first = false): void {
    clearTimeout(this._t);
    this._t = window.setTimeout(() => {
      if (!this._still && !document.hidden && !this._guest) { const cast = this._cast, total = cast.reduce((n, v) => n + (v.weight ?? 1), 0); let pick = Math.random() * total; const v = cast.find((x) => (pick -= x.weight ?? 1) < 0); if (v) this._show(v); }
      this._plan();
    }, (first ? 12_000 : 25_000) + Math.random() * (first ? 14_000 : 55_000) + (this.front ? 20_000 : 0));
  }
  private _show(v: Visitor): void {
    if (this._still) return;
    const id = ++this._n, [y0, y1] = v.y ?? [1, 10];
    this._guest = { v, id, y: y0 + Math.random() * (y1 - y0), x: 6 + Math.random() * 80, flip: v.flip !== false && Math.random() < 0.5 };
    window.setTimeout(() => { if (this._guest?.id === id) this._guest = null; }, v.ms + 400);
  }
  render(): TemplateResult | typeof nothing {
    if (this._still || !this._scene) return nothing;
    const g = this._guest;
    return html`${this.front ? nothing : this._scene.always(this._ctx)}${g ? html`<span class="guest ${g.v.move}" data-kind=${g.v.id} ?data-flip=${g.flip} style="--y:${g.y.toFixed(1)}%;--x:${g.x.toFixed(1)}%;--t:${g.v.ms}ms">${g.v.art}</span>` : nothing}`;
  }
}
if (!customElements.get('fh-ambient')) customElements.define('fh-ambient', FhAmbient);
