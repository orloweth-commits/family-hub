import { LitElement, css, html, nothing, svg, type TemplateResult } from 'lit';

/**
 * Quiet life behind the page: a layer under everything that never takes a touch.
 * Each look has a little that is always there (stars that twinkle, glints on the water, bubbles)
 * and a few surprises that wander through now and then (a shooting star, a flying saucer, a gull, an ant).
 * Calm mode and "reduce motion" switch the whole layer off.
 */

// the notes on the fridge door can only jiggle together if their tilt is a number the browser can animate
try { (CSS as unknown as { registerProperty?: (d: object) => void }).registerProperty?.({ name: '--tilt', syntax: '<number>', inherits: true, initialValue: '1' }); } catch { /* already registered */ }

/** The same "random" every time, so the sky does not reshuffle on each render. */
const rnd = (seed: number): (() => number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const field = (n: number, seed: number, colour: string): string => { const r = rnd(seed); return Array.from({ length: n }, () => `${(r() * 100).toFixed(2)}vw ${(r() * 100).toFixed(2)}vh 0 ${r() < 0.2 ? 1 : 0}px ${colour}`).join(','); };
const spots = (n: number, seed: number, y0: number, y1: number): { x: number; y: number; d: number; s: number }[] => { const r = rnd(seed); return Array.from({ length: n }, () => ({ x: r() * 100, y: y0 + r() * (y1 - y0), d: r() * 8, s: 0.6 + r() * 0.8 })); };

const STARS = [field(46, 7, '#fff'), field(38, 91, '#dfe6ff'), field(30, 333, '#fff6d6')];
const GLINTS = spots(12, 21, 58, 90), BUBBLES = spots(9, 77, 0, 100), FLIES = spots(7, 5, 30, 85), LEAVES = spots(4, 404, 0, 100);

type Kind = 'shoot' | 'saucer' | 'rocket' | 'comet' | 'gulls' | 'fish' | 'turtle' | 'leaf' | 'butterfly' | 'ant' | 'fly' | 'gecko' | 'balloon';
interface Guest { kind: Kind; id: number; y: number; flip: boolean }

/** Who may wander through each scene, most likely first (repeats make a guest more likely). */
const CAST: Record<string, Kind[]> = {
  orbit: ['shoot', 'shoot', 'shoot', 'saucer', 'comet', 'rocket'],
  space: ['shoot', 'shoot', 'shoot', 'rocket', 'saucer', 'comet'],
  sea: ['gulls', 'gulls', 'balloon'],
  sunset: ['gulls', 'gulls', 'balloon'],
  reef: ['fish', 'fish', 'turtle'],
  bush: ['leaf', 'butterfly', 'butterfly'],
  fridge: ['ant', 'fly', 'gecko'],
};
const LASTS: Record<Kind, number> = { shoot: 1400, saucer: 16000, rocket: 11000, comet: 7000, gulls: 20000, fish: 18000, turtle: 30000, leaf: 14000, butterfly: 15000, ant: 26000, fly: 9000, gecko: 9000, balloon: 40000 };

const ART: Record<Kind, TemplateResult> = {
  shoot: svg`<svg viewBox="0 0 120 8" width="150"><defs><linearGradient id="sg"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient></defs><rect width="120" height="2" y="3" rx="1" fill="url(#sg)"/><circle cx="118" cy="4" r="2.4" fill="#fff"/></svg>`,
  saucer: svg`<svg viewBox="0 0 90 48" width="84"><ellipse cx="45" cy="20" rx="17" ry="13" fill="#bfe9ff" opacity=".85"/><circle cx="41" cy="17" r="4" fill="#9ae6b4"/><circle cx="39.5" cy="16" r="1" fill="#123"/><circle cx="42.5" cy="16" r="1" fill="#123"/><ellipse cx="45" cy="28" rx="40" ry="10" fill="#8d96b8"/><ellipse cx="45" cy="26" rx="40" ry="8" fill="#c7cde6"/><g class="blink"><circle cx="17" cy="28" r="2.6" fill="#ffd166"/><circle cx="35" cy="31" r="2.6" fill="#ff6b6b"/><circle cx="55" cy="31" r="2.6" fill="#7bdff2"/><circle cx="73" cy="28" r="2.6" fill="#ffd166"/></g></svg>`,
  rocket: svg`<svg viewBox="0 0 70 34" width="62"><path class="flame" d="M14 17l-13-6 5 6-5 6z" fill="#ffb703"/><path d="M12 9h30c12 0 22 5 26 8-4 3-14 8-26 8H12z" fill="#eef1fb"/><path d="M12 9l-8-7h14zM12 25l-8 7h14z" fill="#e63946"/><circle cx="44" cy="17" r="5" fill="#7bdff2" stroke="#34405e" stroke-width="2"/></svg>`,
  comet: svg`<svg viewBox="0 0 160 30" width="170"><defs><linearGradient id="cg"><stop offset="0" stop-color="#9bdcff" stop-opacity="0"/><stop offset="1" stop-color="#d9f3ff" stop-opacity=".9"/></linearGradient></defs><path d="M0 15L140 6v18z" fill="url(#cg)"/><circle cx="144" cy="15" r="8" fill="#eaf8ff"/></svg>`,
  gulls: svg`<svg viewBox="0 0 90 40" width="86" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path class="flap" d="M6 16q9-10 16 0q7-10 16 0"/><path class="flap late" d="M48 30q7-8 13 0q6-8 13 0"/></svg>`,
  fish: svg`<svg viewBox="0 0 70 36" width="58"><path d="M14 18L2 8v20z" fill="#ff9f1c"/><ellipse cx="38" cy="18" rx="26" ry="13" fill="#ffbf69"/><path d="M30 6q8 12 0 24M42 6q8 12 0 24" stroke="#fff" stroke-width="3" fill="none"/><circle cx="54" cy="15" r="2.6" fill="#123"/></svg>`,
  turtle: svg`<svg viewBox="0 0 90 50" width="78"><path class="paddle" d="M30 34l-12 12 16-4zM58 34l10 12-15-4z" fill="#5fa777"/><ellipse cx="44" cy="26" rx="26" ry="16" fill="#3d8b63"/><path d="M26 26h36M35 14l6 24M53 14l-6 24" stroke="#2c6b4a" stroke-width="2" fill="none"/><circle cx="76" cy="24" r="8" fill="#6fbf8b"/><circle cx="79" cy="22" r="1.6" fill="#123"/></svg>`,
  leaf: svg`<svg viewBox="0 0 40 24" width="34"><path d="M2 12Q14-4 38 12Q14 28 2 12z" fill="#8a9a5b"/><path d="M4 12h32" stroke="#5f6f3a" stroke-width="1.5"/></svg>`,
  butterfly: svg`<svg viewBox="0 0 44 36" width="36"><g class="wings"><path d="M22 18Q6-2 3 12t19 8z" fill="#f4a261"/><path d="M22 18Q38-2 41 12t-19 8z" fill="#e76f51"/><path d="M22 20Q10 34 8 24t14-4z" fill="#e9c46a"/><path d="M22 20Q34 34 36 24t-14-4z" fill="#f4a261"/></g><rect x="20.6" y="10" width="2.8" height="16" rx="1.4" fill="#3d2a18"/></svg>`,
  ant: svg`<svg viewBox="0 0 120 16" width="112" fill="#2b2118"><g class="march"><circle cx="8" cy="9" r="3"/><circle cx="14" cy="9" r="2.4"/><circle cx="20" cy="8.5" r="3.4"/></g><g class="march late"><circle cx="48" cy="9" r="3"/><circle cx="54" cy="9" r="2.4"/><circle cx="60" cy="8.5" r="3.4"/></g><g class="march"><circle cx="90" cy="9" r="3"/><circle cx="96" cy="9" r="2.4"/><circle cx="102" cy="8.5" r="3.4"/></g></svg>`,
  fly: svg`<svg viewBox="0 0 24 20" width="20"><g class="wings"><ellipse cx="8" cy="7" rx="6" ry="3.4" fill="#cfd8e6" opacity=".8"/><ellipse cx="16" cy="7" rx="6" ry="3.4" fill="#cfd8e6" opacity=".8"/></g><ellipse cx="12" cy="12" rx="4.2" ry="5.4" fill="#2b2b33"/></svg>`,
  gecko: svg`<svg viewBox="0 0 70 60" width="64"><path d="M70 30C52 22 40 14 26 16c-8 1-12 8-10 14s8 10 18 9c12-1 24-5 36-9z" fill="#7cb518"/><path d="M34 16l-6-10M46 20l-2-12M34 39l-6 12M48 36l0 12" stroke="#5c8a12" stroke-width="5" stroke-linecap="round"/><circle cx="22" cy="24" r="4" fill="#fff"/><circle cx="21" cy="24" r="2" fill="#123"/><circle cx="24" cy="34" r="4" fill="#fff"/><circle cx="23" cy="34" r="2" fill="#123"/></svg>`,
  balloon: svg`<svg viewBox="0 0 40 60" width="34"><path d="M20 2C8 2 3 12 3 20c0 10 10 18 13 22h8c3-4 13-12 13-22C37 12 32 2 20 2z" fill="#e63946"/><path d="M20 2c-5 6-5 34-2 40M20 2c5 6 5 34 2 40" stroke="#ffd166" stroke-width="3" fill="none"/><path d="M15 44l2 8h6l2-8" stroke="#6b4a2b" stroke-width="1.4" fill="none"/><rect x="15" y="51" width="10" height="7" rx="1.5" fill="#8a5a2b"/></svg>`,
};

export class FhAmbient extends LitElement {
  static styles = css`
    :host { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; contain: strict; }
    @media (prefers-reduced-motion: reduce) { :host { display: none; } }
    .layer { position: absolute; left: 0; top: 0; width: 1px; height: 1px; border-radius: 50%; animation: twinkle var(--t, 4s) ease-in-out infinite alternate; }
    @keyframes twinkle { from { opacity: .15; } to { opacity: .95; } }
    .dot { position: absolute; left: var(--x); top: var(--y); border-radius: 50%; }
    .glint { width: 5px; height: 5px; background: #fff; box-shadow: 0 0 8px 2px rgba(255,255,255,.8); scale: var(--s); opacity: 0; animation: glint 5s ease-in-out infinite; animation-delay: calc(var(--d) * -1s); }
    @keyframes glint { 0%, 70%, 100% { opacity: 0; transform: scale(.4); } 82% { opacity: .9; transform: scale(1.2) rotate(45deg); } }
    .bubble { top: auto; bottom: -24px; width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.7); scale: var(--s); animation: rise 13s linear infinite; animation-delay: calc(var(--d) * -1.6s); }
    @keyframes rise { from { transform: translate(0, 0); opacity: 0; } 12% { opacity: .8; } 50% { transform: translate(14px, -50vh); } to { transform: translate(-8px, -104vh); opacity: 0; } }
    .firefly { width: 5px; height: 5px; background: #fff3a8; box-shadow: 0 0 10px 3px rgba(255,243,168,.75); animation: glow 3.4s ease-in-out infinite alternate, drift 9s ease-in-out infinite alternate; animation-delay: calc(var(--d) * -1s); }
    @keyframes glow { from { opacity: .05; } to { opacity: .95; } } @keyframes drift { from { transform: translate(-14px, 8px); } to { transform: translate(16px, -12px); } }
    .mote { top: -30px; opacity: .55; animation: fall 26s linear infinite; animation-delay: calc(var(--d) * -3.2s); }
    @keyframes fall { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(-22vw, 112vh) rotate(540deg); } }

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
    .blink circle { animation: blink 1s steps(2, jump-none) infinite alternate; } .blink circle:nth-child(even) { animation-delay: -.5s; }
    @keyframes blink { to { opacity: .25; } }
    .flap { transform-box: fill-box; transform-origin: center; animation: flap .7s ease-in-out infinite alternate; } .flap.late { animation-delay: -.35s; }
    @keyframes flap { from { transform: scaleY(1); } to { transform: scaleY(.25); } }
    .wings { transform-box: fill-box; transform-origin: center; animation: wings .22s ease-in-out infinite alternate; }
    @keyframes wings { from { transform: scaleX(1); } to { transform: scaleX(.35); } }
    .flame { transform-box: fill-box; transform-origin: right center; animation: flame .16s linear infinite alternate; } @keyframes flame { to { transform: scaleX(.55); } }
    .paddle { transform-box: fill-box; transform-origin: top center; animation: paddle 1.4s ease-in-out infinite alternate; } @keyframes paddle { from { transform: rotate(-16deg); } to { transform: rotate(16deg); } }
    .march { animation: march .3s steps(2, jump-none) infinite alternate; } .march.late { animation-delay: -.15s; } @keyframes march { to { transform: translateY(-1.5px); } }
  `;
  static properties = { look: {}, theme: {}, tod: {}, calm: { type: Boolean }, demo: {}, _guest: { state: true } };
  look = 'glass'; theme = 'sea'; tod = 'day'; calm = false;
  /** show one guest straight away (the preview and the tests use this) */
  demo = '';
  private _guest: Guest | null = null;
  private _t = 0; private _n = 0;

  /** The scene in play: the look, or for Glass the photo theme. */
  private get _scene(): string { return this.look === 'fridge' || this.look === 'orbit' ? this.look : this.theme; }
  private get _still(): boolean { return this.calm || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); }

  connectedCallback(): void { super.connectedCallback(); this._plan(true); }
  disconnectedCallback(): void { super.disconnectedCallback(); clearTimeout(this._t); }
  updated(ch: Map<string, unknown>): void { if (ch.has('demo') && this.demo) this._show(this.demo as Kind); if (ch.has('calm') && this.calm) this._guest = null; }

  /** The next guest comes after a while: sooner the first time, then every minute or two. */
  private _plan(first = false): void {
    clearTimeout(this._t);
    this._t = window.setTimeout(() => { if (!this._still && !document.hidden && !this._guest) { const cast = CAST[this._scene] ?? []; if (cast.length) this._show(cast[Math.floor(Math.random() * cast.length)]); } this._plan(); }, (first ? 18_000 : 45_000) + Math.random() * (first ? 22_000 : 75_000));
  }
  private _show(kind: Kind): void {
    if (!ART[kind] || this._still) return;
    const id = ++this._n; this._guest = { kind, id, y: Math.random() * 30, flip: Math.random() < 0.5 };
    window.setTimeout(() => { if (this._guest?.id === id) this._guest = null; }, LASTS[kind] + 400);
  }

  private _always(): TemplateResult | typeof nothing {
    const s = this._scene, dot = (cls: string, p: { x: number; y: number; d: number; s: number }, inner: TemplateResult | typeof nothing = nothing): TemplateResult => html`<i class="dot ${cls}" style="--x:${p.x.toFixed(1)}%;--y:${p.y.toFixed(1)}%;--d:${p.d.toFixed(2)};--s:${p.s.toFixed(2)}">${inner}</i>`;
    if (s === 'orbit' || s === 'space') return html`${STARS.map((b, i) => html`<i class="layer" style="box-shadow:${b};--t:${[3.1, 4.7, 6.3][i]}s;animation-delay:${-i * 1.3}s"></i>`)}`;
    if (s === 'sea' || s === 'sunset') return html`${GLINTS.map((p) => dot('glint', p))}`;
    if (s === 'reef') return html`${BUBBLES.map((p) => dot('bubble', p))}`;
    if (s === 'bush') return this.tod === 'day' ? html`${LEAVES.map((p) => dot('mote', p, ART.leaf))}` : html`${FLIES.map((p) => dot('firefly', p))}`;
    return nothing;
  }
  private _visit(g: Guest): TemplateResult {
    const move: Record<Kind, string> = { shoot: 'streak', saucer: 'across wobble', rocket: 'across', comet: 'streak', gulls: 'across', fish: 'across bobbing', turtle: 'across bobbing', leaf: 'down', butterfly: 'flit', ant: 'across foot', fly: 'buzz', gecko: 'peek', balloon: 'up' };
    const y = g.kind === 'fish' || g.kind === 'turtle' ? 20 + g.y * 2 : g.kind === 'gecko' ? 20 + g.y * 1.5 : g.kind === 'butterfly' || g.kind === 'fly' ? 4 + g.y * 0.3 : 1 + g.y * 0.3;
    return html`<span class="guest ${move[g.kind]}" data-kind=${g.kind} ?data-flip=${g.flip && !['gecko', 'leaf', 'balloon', 'butterfly', 'fly'].includes(g.kind)} style="--y:${y.toFixed(1)}%;--x:${(8 + g.y * 2.6).toFixed(1)}%;--t:${LASTS[g.kind]}ms">${ART[g.kind]}</span>`;
  }
  render(): TemplateResult | typeof nothing {
    if (this._still) return nothing;
    return html`${this._always()}${this._guest ? this._visit(this._guest) : nothing}`;
  }
}
if (!customElements.get('fh-ambient')) customElements.define('fh-ambient', FhAmbient);
