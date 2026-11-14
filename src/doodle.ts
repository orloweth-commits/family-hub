import { LitElement, html, css, svg, nothing, unsafeCSS, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { FitController, linger, sfx } from './util';
import { icon } from './icons';
import { kidEntities, slotVar, type Hass, type KidConfig } from './types';
import { avatarCss, decodeLook, renderAvatar } from './avatar';
import './pin';

const INKS = ['#1d1d1f', '#e63946', '#f77f00', '#fcbf49', '#2a9d8f', '#118ab2', '#7b2cbf', '#ff70a6', '#8d5a3b', '#ffffff'];
const SIZES = [4, 10, 22];
const LOCAL_KEY = 'family-hub-fridge';
const ROOT = 'media-source://media_source/local/.';

interface Pic { title: string; url: string; id?: string }
interface Stroke { ink: string; size: number; erase: boolean; hue: number; pts: [number, number, number, number, number][]; stamp?: string }
/** Stamps: [what is stamped, its spoken name]. 'clarinet' has no emoji, so it is drawn. */
const STAMPS: [string, string][] = [['🦖', 'Dinosaur'], ['🐉', 'Dragon'], ['🚚', 'Truck'], ['⭐', 'Star'], ['❤️', 'Heart'], ['🌈', 'Rainbow'], ['🏄', 'Surfer'], ['🎺', 'Trumpet'],
  ['🛴', 'Scooter'], ['🎾', 'Tennis ball'], ['clarinet', 'Clarinet'], ['🏊', 'Swimmer'], ['📖', 'Book']];
const INK_NAMES = ['Black', 'Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Brown', 'White'];
/** A clarinet, drawn in a 48 box: on the stamp button (SVG) and on the paper (the same shapes on the canvas). */
const clarinetSvg = (s = 30): TemplateResult => html`<svg viewBox="0 0 48 48" width=${s} height=${s} aria-hidden="true"><g transform="rotate(40 24 24)"><rect x="21" y="3" width="6" height="7" rx="2" fill="#8d5a3b"></rect><rect x="20" y="9" width="8" height="27" rx="2" fill="#1d1d1f"></rect><path d="M20 35 h8 l4 9 h-16 z" fill="#1d1d1f"></path><rect x="19.500" y="15" width="9" height="2" fill="#d4d4d8"></rect><rect x="19.500" y="29" width="9" height="2" fill="#d4d4d8"></rect><circle cx="24" cy="20" r="1.600" fill="#d4d4d8"></circle><circle cx="24" cy="24.500" r="1.600" fill="#d4d4d8"></circle></g></svg>`;
const drawClarinet = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void => {
  const k = size / 48; ctx.save(); ctx.translate(x, y); ctx.rotate((40 * Math.PI) / 180); ctx.scale(k, k); ctx.translate(-24, -24);
  ctx.fillStyle = '#8d5a3b'; ctx.fillRect(21, 3, 6, 7); ctx.fillStyle = '#1d1d1f'; ctx.fillRect(20, 9, 8, 27);
  ctx.beginPath(); ctx.moveTo(20, 35); ctx.lineTo(28, 35); ctx.lineTo(32, 44); ctx.lineTo(16, 44); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d4d4d8'; ctx.fillRect(19.5, 15, 9, 2); ctx.fillRect(19.5, 29, 9, 2);
  for (const cy of [20, 24.5]) { ctx.beginPath(); ctx.arc(24, cy, 1.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
};
/* drawn icons: a block eraser, a chalkboard on its stand, a sheet of paper and a horseshoe magnet */
const eraserIcon = svg`<svg class="i" viewBox="0 0 24 24" style="--s:24px" aria-hidden="true"><path d="M4.500 15.500 13 7l5.500 5.500L11 20H7.500z"></path><path d="M9.500 10.500 15 16"></path><path d="M11 20h9"></path></svg>`;
const boardIcon = svg`<svg class="i" viewBox="0 0 24 24" style="--s:20px" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1.500"></rect><path d="M8 20l2-4M16 20l-2-4M7 9.500c1.500-1.500 3 1.500 4.500 0s3 1.500 4.500 0"></path></svg>`;
const paperIcon = svg`<svg class="i" viewBox="0 0 24 24" style="--s:20px" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"></path><path d="M14 3v4h4M9 12h6M9 16h6"></path></svg>`;
const magnetIcon = svg`<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 3h5v9a3 3 0 0 0 6 0V3h5v9a8 8 0 0 1-16 0z" fill="currentColor"></path><path d="M4 3h5v4H4zM15 3h5v4h-5z" fill="#fff" stroke="currentColor" stroke-width="1.500" stroke-linejoin="round"></path></svg>`;

/** Doodle pad with undo, rainbow brush, chalkboard mode and a shared "fridge" gallery. */
export class FhDoodle extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, css`
    ${unsafeCSS(avatarCss)}
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .brushes { width: 132px; flex-shrink: 0; border-radius: 28px; padding: 14px 10px; display: grid; grid-template-columns: 1fr 1fr; justify-items: center; align-content: start; gap: 10px 6px; overflow: auto; }
    .brushes[data-fit='1'] { width: 190px; grid-template-columns: repeat(3, 1fr); }
    .brushes[data-fit='2'], .brushes[data-fit='3'] { width: 248px; grid-template-columns: repeat(4, 1fr); }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .brushes { width: auto !important; grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)) !important; flex-shrink: 0; }
    :host([data-shape='tall']) .brushes .rule { display: none; }
    :host([data-shape='tall']) .gallery { width: auto; max-height: 260px; }
    :host([data-shape='tall']) .snaps { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
    /* tablets narrower than the canvas: the fridge narrows; under 900 px it drops below the easel and the page scrolls to it */
    :host([data-shape='wide'][data-n2]) .gallery { width: 190px; padding: 12px; }
    :host([data-shape='wide'][data-n2]) .snaps { grid-template-columns: 1fr; }
    :host([data-shape='wide'][data-n3]) { flex-wrap: wrap; overflow-y: auto; align-content: flex-start; gap: 12px; scrollbar-width: none; }
    :host([data-shape='wide'][data-n3]) .brushes, :host([data-shape='wide'][data-n3]) .easel { height: 100%; }
    :host([data-shape='wide'][data-n3]) .gallery { width: auto; flex: 1 1 100%; }
    :host([data-shape='wide'][data-n3]) .snaps { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); overflow: visible; }
    /* opened from the page of a child who cannot read: the colours, stamps and brushes run along the bottom edge, where he can reach */
    :host([low]:not([data-phone])) { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: minmax(0, 1fr) auto; overflow: visible; }
    :host([low]:not([data-phone])) .easel { grid-area: 1 / 1; height: auto; }
    :host([low]:not([data-phone])) .gallery { grid-area: 1 / 2; }
    :host([low]:not([data-phone])) .brushes { grid-area: 2 / 1 / 3 / 3; width: auto !important; height: auto; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)) !important; overflow: visible; padding: 10px 14px; }
    :host([low]:not([data-phone])) .brushes .rule { display: none; }
    :host([low][data-shape='tall']:not([data-phone])), :host([low][data-n3]:not([data-phone])) { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(280px, 1fr) auto auto; overflow-y: auto; }
    :host([low][data-shape='tall']:not([data-phone])) .gallery, :host([low][data-n3]:not([data-phone])) .gallery { grid-area: 2 / 1; width: auto; max-height: 200px; flex: none; }
    :host([low][data-shape='tall']:not([data-phone])) .brushes, :host([low][data-n3]:not([data-phone])) .brushes { grid-area: 3 / 1; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .easel { min-height: 440px; }
    :host([data-phone]) .hint { font-size: var(--fs-4); text-align: center; padding: 0 20px; }
    :host([data-phone]) .acts { flex-wrap: wrap; }
    :host([data-phone]) .view { position: fixed; border-radius: 0; }
    .brushes .rule { grid-column: 1 / -1; height: 1px; width: 90px; background: var(--track); }
    .ink { width: 44px; height: 44px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(0,0,0,.12); transition: transform var(--mt-2, 160ms) cubic-bezier(.2,1.4,.4,1); flex-shrink: 0; }
    .ink[aria-pressed='true'] { transform: scale(1.18); box-shadow: 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--ink); }
    .rainbow { background: conic-gradient(#e63946, #fcbf49, #2a9d8f, #118ab2, #7b2cbf, #e63946); }
    .size { width: 50px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    /* the chosen brush, stamp or eraser wears the look's selected style (a white chip on a white card showed nothing) */
    .size[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    /* Glass: the tinted fill was within a whisker of the card in the light themes, so the chosen one is a solid block of ink there (the halo tone is ink's opposite in every theme) */
    :host([data-look='glass']) .size[aria-pressed='true'] { background: var(--ink); color: var(--ring-halo, #fff); box-shadow: none; }
    .size i { border-radius: 50%; background: currentColor; display: block; }
    /* the three sizes draw what they will make: dots for a brush, the chosen stamp small to large, blocks for the eraser */
    .size i.rub { border-radius: 3px; background: transparent; box-shadow: inset 0 0 0 2.5px currentColor; }
    .size .sz { line-height: 1; display: flex; align-items: center; justify-content: center; }
    .easel { flex: 1; min-width: 0; border-radius: 28px; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
    .pad { flex: 1; min-height: 0; border-radius: 20px; overflow: hidden; position: relative; background: #fffdf7; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06); transition: background var(--m-4, 400ms); }
    .pad.chalk { background: #23332b; }
    canvas { position: absolute; inset: 0; touch-action: none; cursor: crosshair; }
    .hint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; font-family: 'Bricolage Grotesque', sans-serif; font-size: var(--fs-6); font-weight: var(--w-bold, 700); color: #6b6a66; }
    .chalk .hint { color: #c9d3cd; }
    /* the bar wraps rather than squeezing anything: the hero keeps its words on one line */
    .acts { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .acts .pill { font-size: var(--fs-2); white-space: nowrap; }
    /* who drew it and the hero travel together: on a narrow easel they drop to a second row, still at the right */
    .sign { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px 14px; margin-left: auto; }
    .artists { display: flex; align-items: center; gap: 6px; }
    .artists > .muted { font-size: var(--fs-2); font-weight: var(--w-bold, 700); margin-right: 2px; }
    .artist { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 68px; padding: 4px 6px 5px; border-radius: 18px; font-size: var(--fs-2); font-weight: var(--w-bold, 700); line-height: 1.15; }
    .artist .avatar { width: 56px; height: 56px; overflow: hidden; font-size: var(--fs-5); }
    .artist[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    .stickup { height: 52px; /* token */ padding: 0 22px; font-size: var(--fs-3); white-space: nowrap; flex-shrink: 0; }
    .stampbtn { font-size: var(--fs-5); }
    .gallery { width: 250px; flex-shrink: 0; border-radius: 28px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .snaps { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-content: start; }
    .ghead { display: flex; align-items: center; gap: 8px; }
    .tidy { height: 44px; padding: 0 14px; font-size: var(--fs-2); }
    .gallery .label { font-size: var(--fs-1); }
    .clearall { font-size: var(--fs-2); }
    .tidy[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    .clearall { height: 44px; background: var(--danger, #dc2626); color: var(--on-danger, #fff); justify-content: center; }
    .snapbox { position: relative; display: block; }
    .snapbox .snap { width: 100%; display: block; }
    .down { position: absolute; top: -6px; right: -6px; width: 44px; height: 44px; border-radius: 50%; background: var(--danger, #dc2626); color: var(--on-danger, #fff); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 3px #fff, 0 4px 10px rgba(0,0,0,.35); }
    .snaps { padding: 14px 14px 16px 12px; }
    .snap { aspect-ratio: 4/3; border-radius: 10px; background: #fff center / cover; box-shadow: 0 6px 14px -6px rgba(0,0,0,.35); position: relative; }
    .snap:nth-child(odd) { transform: rotate(-2.5deg); } .snap:nth-child(even) { transform: rotate(2deg); }
    .snap::before { content: ''; position: absolute; top: -6px; left: 50%; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: var(--accent); box-shadow: 0 2px 3px rgba(0,0,0,.3); }
    .snap .by { position: absolute; bottom: -8px; right: -4px; background: #fff; color: #1d1d1f; box-shadow: 0 1px 3px rgba(0,0,0,.3); border-radius: 999px; padding: 2px 8px; font-size: var(--fs-1); font-weight: var(--w-heavy, 800); text-transform: capitalize; }
    .stick { animation: stick var(--m-5, 900ms) cubic-bezier(.2,1.3,.4,1); }
    @keyframes stick { 40% { transform: scale(calc(1 - .6 * var(--m-d, 1))) translate(calc(60% * var(--m-d, 1)), calc(-10% * var(--m-d, 1))) rotate(calc(8deg * var(--m-d, 1))); opacity: .6; } }
    .view { position: absolute; inset: 0; z-index: 30; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; border-radius: 28px; }
    .whobox { width: min(560px, 92%); border-radius: 28px; padding: 20px; display: flex; flex-direction: column; gap: 14px; text-align: center; }
    .whofaces { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
    .whofaces .artist { min-width: 84px; min-height: 84px; background: var(--chip); }
    .view img { max-width: 92%; max-height: 92%; border-radius: 16px; background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.5); animation: sheet var(--m-4, 400ms) cubic-bezier(.2,1.2,.3,1); }
  `];

  static properties = { hass: { attribute: false }, artists: { attribute: false }, kids: { attribute: false }, pin: {}, _tidy: { state: true }, _askPin: { state: true }, _stamp: { state: true }, _artist: { state: true }, _ink: { state: true }, _size: { state: true }, _erase: { state: true }, _chalk: { state: true },
    _blank: { state: true }, _pics: { state: true }, _view: { state: true }, _msg: { state: true }, _stick: { state: true }, _askWho: { state: true } };
  hass?: Hass;
  private _ink = INKS[0];
  private _size = 10;
  artists: string[] = [];
  /** the children, for their faces on the artist buttons (a non-reader signs with his picture) */
  kids: KidConfig[] = [];
  pin = '';
  private _tidy = false;
  private _askPin = false;
  private _stamp = '';
  private _artist = '';
  private _erase = false;
  private _chalk = false;
  private _blank = true;
  private _pics: Pic[] = [];
  private _view = '';
  private _msg = '';
  private _stick = false;
  /** "Who drew it?": asked when a doodle is stuck up with no artist chosen */
  private _askWho = false;
  private _esc = (e: KeyboardEvent): void => { if (e.key !== 'Escape' || (!this._view && !this._askWho)) return; e.stopPropagation(); this._view = ''; this._askWho = false; };
  connectedCallback(): void { super.connectedCallback(); window.addEventListener('keydown', this._esc, true); }
  private _strokes: (Stroke | null)[] = [];
  private _cur: Stroke | null = null;
  private _ctx?: CanvasRenderingContext2D;
  private _canvas?: HTMLCanvasElement;
  private _ro?: ResizeObserver;
  private _last: { x: number; y: number } | null = null;
  private _hue = 0;
  private _t?: number;

  private _say(m: string): void { this._msg = m; clearTimeout(this._t); this._t = window.setTimeout(() => { this._msg = ''; }, 2400); }

  firstUpdated(): void {
    this._canvas = this.renderRoot.querySelector('canvas')!;
    this._ctx = this._canvas.getContext('2d')!;
    const wrap = this.renderRoot.querySelector('.pad') as HTMLElement;
    this._ro = new ResizeObserver(() => this._fit(wrap));
    this._ro.observe(wrap);
    this._loadFridge();
  }
  disconnectedCallback(): void { super.disconnectedCallback(); this._ro?.disconnect(); window.removeEventListener('keydown', this._esc, true); }

  private _fit(wrap: HTMLElement): void {
    const c = this._canvas!, dpr = window.devicePixelRatio || 1, w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h || (c.width === Math.round(w * dpr) && c.height === Math.round(h * dpr))) return;
    const old = c.width ? this._ctx!.getImageData(0, 0, c.width, c.height) : null;
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = `${w}px`; c.style.height = `${h}px`;
    if (old) this._ctx!.putImageData(old, 0, 0);
  }

  private _pt(e: PointerEvent): { x: number; y: number } {
    const c = this._canvas!, r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }
  private _down(e: PointerEvent): void {
    this._canvas!.setPointerCapture(e.pointerId);
    this._last = this._pt(e);
    if (this._stamp) {
      const st: Stroke = { ink: '', size: this._size, erase: false, hue: 0, pts: [[this._last.x, this._last.y, 0, 0, 0]], stamp: this._stamp };
      this._strokes.push(st); this._drawStamp(st); this._blank = false; this._last = null; sfx('stamp'); return;
    }
    this._cur = { ink: this._ink, size: this._size, erase: this._erase, hue: this._hue, pts: [] };
    this._strokes.push(this._cur);
    if (this._strokes.length > 400) this._strokes.splice(0, this._strokes.length - 400);
    this._seg(this._cur, this._last, this._last, e.pressure);
    this._blank = false;
    if (this._erase) { sfx('rub'); this._rubAt = Date.now(); }
  }
  private _move(e: PointerEvent): void {
    if (!this._last || !this._cur) return;
    // the eraser ticks now and then while it rubs (a tick for a movement, never a loop)
    if (this._cur.erase && Date.now() - this._rubAt > 240) { sfx('rub'); this._rubAt = Date.now(); }
    const evs = (e as any).getCoalescedEvents?.() as PointerEvent[] | undefined;
    for (const ev of evs?.length ? evs : [e]) { const p = this._pt(ev); this._seg(this._cur, this._last!, p, ev.pressure); this._last = p; }
  }
  private _up(): void { this._last = null; this._cur = null; }

  /** Draw one segment and record it, so undo can replay strokes instead of keeping bitmaps. */
  private _seg(st: Stroke, a: { x: number; y: number }, b: { x: number; y: number }, pressure: number): void {
    st.pts.push([a.x, a.y, b.x, b.y, pressure]);
    this._draw(st, a.x, a.y, b.x, b.y, pressure, st.pts.length);
  }
  private _draw(st: Stroke, ax: number, ay: number, bx: number, by: number, pressure: number, n: number): void {
    const ctx = this._ctx!, dpr = window.devicePixelRatio || 1;
    const p = pressure > 0 && pressure !== 0.5 ? 0.6 + pressure : 1;
    ctx.globalCompositeOperation = st.erase ? 'destination-out' : 'source-over';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = (st.erase ? st.size * 2.4 : st.size) * dpr * p;
    if (st.ink === 'rainbow' && !st.erase) { const h = (st.hue + n * 4) % 360; this._hue = h; ctx.strokeStyle = `hsl(${h} 90% 55%)`; }
    else ctx.strokeStyle = st.ink === 'rainbow' ? '#000' : st.ink;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx + 0.01, by); ctx.stroke();
  }
  private _drawStamp(st: Stroke): void {
    const ctx = this._ctx!, dpr = window.devicePixelRatio || 1, [x, y] = st.pts[0];
    ctx.globalCompositeOperation = 'source-over';
    if (st.stamp === 'clarinet') { drawClarinet(ctx, x, y, (38 + st.size * 3.6) * dpr); return; }
    ctx.font = `${(30 + st.size * 3) * dpr}px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(st.stamp!, x, y);
  }
  private _redraw(): void {
    const c = this._canvas!, ctx = this._ctx!;
    ctx.clearRect(0, 0, c.width, c.height);
    const from = this._strokes.lastIndexOf(null) + 1;
    for (const st of this._strokes.slice(from)) if (st) { if (st.stamp) this._drawStamp(st); else st.pts.forEach((q, i) => this._draw(st, q[0], q[1], q[2], q[3], q[4], i + 1)); }
    this._blank = !this._strokes.slice(from).length;
  }

  private _rubAt = 0;
  private _undoOne(): void {
    if (this._strokes.length) sfx('undo');
    this._strokes.pop();
    this._redraw();
  }
  private _clear(): void {
    if (!this._blank) this._strokes.push(null);
    this._ctx!.clearRect(0, 0, this._canvas!.width, this._canvas!.height);
    this._blank = true;
  }

  /** Flatten onto the paper colour and return a PNG blob. */
  private _png(): Promise<Blob | null> {
    const c = this._canvas!, out = document.createElement('canvas');
    const scale = Math.min(1, 1600 / c.width);
    out.width = Math.round(c.width * scale); out.height = Math.round(c.height * scale);
    const x = out.getContext('2d')!;
    x.fillStyle = this._chalk ? '#23332b' : '#fffdf7'; x.fillRect(0, 0, out.width, out.height);
    x.drawImage(c, 0, 0, out.width, out.height);
    return new Promise((r) => out.toBlob(r, 'image/png'));
  }

  private async _toFridge(asked = false): Promise<void> {
    if (this._blank) { this._say('Draw something first!'); return; }
    // no artist chosen: ask, faces first, so the picture carries a name (it can still go up without one)
    if (!asked && !this._artist && this.artists.length) { this._askWho = true; return; }
    this._askWho = false;
    const blob = await this._png();
    if (!blob) return;
    const d = new Date(), stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}${String(d.getSeconds()).padStart(2, '0')}`;
    this._stick = true; setTimeout(() => { this._stick = false; }, 900);
    let shared = false;
    if (this.hass?.fetchWithAuth) {
      try {
        const fd = new FormData();
        fd.append('media_content_id', ROOT);
        fd.append('file', new File([blob], `doodle-${stamp}${this._artist ? `-${this._artist.toLowerCase()}` : ''}.png`, { type: 'image/png' }));
        const r = await this.hass.fetchWithAuth('/api/media_source/local_source/upload', { method: 'POST', body: fd });
        shared = r.ok;
      } catch { shared = false; }
    }
    if (!shared) {
      const url = await new Promise<string>((res) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.readAsDataURL(blob); });
      try {
        const list: Pic[] = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]');
        list.unshift({ title: `doodle-${stamp}${this._artist ? `-${this._artist.toLowerCase()}` : ''}`, url });
        localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, 8)));
      } catch { sfx('error'); this._say('The fridge is full – clear a few doodles'); return; }
    }
    sfx('stick'); this._say(shared ? 'Stuck on the fridge!' : 'Stuck on this panel’s fridge');
    this._clear(); this._strokes = [];
    this._loadFridge();
  }

  /** Taking drawings down is a grown-up's job: the PIN first, then each drawing shows a cross, and there is one button for the lot. */
  private _tidyStart(): void {
    if (this._tidy) { this._tidy = false; return; }
    if (this.pin) this._askPin = true; else this._tidy = true;
  }
  private async _takeDown(list: Pic[]): Promise<void> {
    let failed = 0;
    for (const p of list) {
      if (p.id) {
        try { await this.hass!.callWS({ type: 'media_source/local_source/remove', media_content_id: p.id }); } catch { failed++; }
      } else {
        try { const keep = (JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]') as Pic[]).filter((x) => x.title !== p.title); localStorage.setItem(LOCAL_KEY, JSON.stringify(keep)); } catch { failed++; }
      }
    }
    await this._loadFridge();
    if (!this._pics.length) this._tidy = false;
    this._say(failed ? 'Some drawings could not be taken down. Sign in to Home Assistant as an administrator and try again.' : list.length > 1 ? 'The fridge is clear' : 'Taken down');
  }

  private async _loadFridge(): Promise<void> {
    let pics: Pic[] = [];
    try { pics = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'); } catch { /* */ }
    if (this.hass) {
      try {
        const r = await this.hass.callWS<{ children: { title: string; media_content_id: string }[] }>({ type: 'media_source/browse_media', media_content_id: ROOT });
        const mine = r.children.filter((c) => /^doodle-/.test(c.title)).sort((a, b) => b.title.localeCompare(a.title)).slice(0, 12);
        const res = await Promise.all(mine.map(async (c) => {
          try { const u = await this.hass!.callWS<{ url: string }>({ type: 'media_source/resolve_media', media_content_id: c.media_content_id }); return { title: c.title, url: u.url, id: c.media_content_id }; } catch { return null; }
        }));
        pics = [...res.filter((x): x is { title: string; url: string; id: string } => !!x), ...pics].sort((a, b) => b.title.localeCompare(a.title));
      } catch { /* local media not available */ }
    }
    this._pics = pics;
  }

  /** The child's own avatar head (as the dock draws it), or their initial when there is no look to draw. */
  private _face(name: string): TemplateResult {
    const k = this.kids.find((x) => x.name === name);
    if (!k) return html`<span class="avatar" style="background:var(--p-family)">${name[0]}</span>`;
    const raw = this.hass?.states[kidEntities(k).avatar]?.state, look = raw || k.look ? decodeLook(raw, k.look ? decodeLook(k.look) : {}) : null;
    return html`<span class="avatar" aria-hidden="true" style="background:${slotVar(k.colour)}">${look ? renderAvatar(look, { size: 56, crop: 'head', still: true, label: k.name, age: k.age, ring: slotVar(k.colour) }) : k.name[0]}</span>`;
  }

  render(): TemplateResult {
    const [msg, msgOut] = linger(this, 'msg', this._msg);
    return html`
      <section class="glass brushes" data-fits aria-label="Brushes">
        ${INKS.map((c, i) => html`<button class="ink tap" style="background:${c}" aria-label=${INK_NAMES[i] ?? 'Colour'} aria-pressed=${String(!this._erase && !this._stamp && this._ink === c)} @click=${() => { this._ink = c; this._erase = false; this._stamp = ''; }}></button>`)}
        <button class="ink tap rainbow" aria-label="Rainbow" aria-pressed=${String(!this._erase && !this._stamp && this._ink === 'rainbow')} @click=${() => { this._ink = 'rainbow'; this._erase = false; this._stamp = ''; }}></button>
        <span class="rule"></span>
        ${STAMPS.map(([st, name]) => html`<button class="size stampbtn tap" aria-label="${name} stamp" aria-pressed=${String(this._stamp === st)} @click=${() => { this._stamp = this._stamp === st ? '' : st; this._erase = false; }}>${st === 'clarinet' ? clarinetSvg() : st}</button>`)}
        <span class="rule"></span>
        ${SIZES.map((s, n) => { const st = this._stamp, d = Math.min(s, 22), name = ['small', 'medium', 'big'][n] ?? String(s);
          return html`<button class="size tap" aria-label=${st ? `Stamp size: ${name}` : this._erase ? `Eraser size: ${name}` : `Brush ${s}`} aria-pressed=${String(this._size === s)} @click=${() => { this._size = s; }}>${st ? html`<span class="sz" style="font-size:${14 + n * 7}px" aria-hidden="true">${st === 'clarinet' ? clarinetSvg(16 + n * 9) : st}</span>` : this._erase ? html`<i class="rub" style="width:${10 + n * 8}px;height:${10 + n * 8}px"></i>` : html`<i style="width:${d}px;height:${d}px"></i>`}</button>`; })}
        <button class="size tap" aria-label="Eraser" aria-pressed=${String(this._erase)} @click=${() => { this._erase = !this._erase; if (this._erase) this._stamp = ''; }}>${eraserIcon}</button>
      </section>
      <section class="glass easel ${this._stick ? 'stick' : ''}">
        <div class="pad ${this._chalk ? 'chalk' : ''}">
          <canvas @pointerdown=${this._down} @pointermove=${this._move} @pointerup=${this._up} @pointercancel=${this._up} @pointerleave=${this._up}></canvas>
          ${this._blank ? html`<div class="hint">Draw something brilliant</div>` : nothing}
        </div>
        <div class="acts">
          <button class="pill tap" @click=${() => this._undoOne()}>${icon('left', 18)}Undo</button>
          <button class="pill tap" @click=${() => this._clear()}>${icon('close', 18)}Clear</button>
          <button class="pill tap" @click=${() => { this._chalk = !this._chalk; if (this._chalk && this._ink === INKS[0]) this._ink = '#ffffff'; else if (!this._chalk && this._ink === '#ffffff') this._ink = INKS[0]; }}>${this._chalk ? paperIcon : boardIcon}${this._chalk ? 'Paper' : 'Chalkboard'}</button>
          <div class="sign">
          ${this.artists.length ? html`<div class="artists" role="group" aria-label="Who drew it"><span class="muted">Artist</span>${this.artists.map((a) => html`<button class="artist tap" aria-pressed=${String(this._artist === a)} @click=${() => { this._artist = this._artist === a ? '' : a; }}>${this._face(a)}<span>${a}</span></button>`)}</div>` : ''}
          <button class="lead stickup tap" aria-label="Stick it up on the fridge" @click=${() => this._toFridge()}>${magnetIcon}Stick it up</button>
          </div>
        </div>
      </section>
      <section class="glass gallery" aria-label="The fridge">
        <div class="ghead"><span class="label" style="flex:1">The fridge</span>
          ${this._pics.length ? html`<button class="pill tap tidy" aria-pressed=${String(this._tidy)} @click=${() => this._tidyStart()}>${this._tidy ? 'Done' : 'Tidy up'}</button>` : nothing}</div>
        ${this._tidy ? html`<button class="pill tap clearall" @click=${() => this._takeDown(this._pics)}>${icon('close', 16)}Take them all down</button>` : nothing}
        ${this._pics.length ? html`<div class="snaps">${this._pics.map((p) => { const by = /-(\d{6})-([a-z]+)/.exec(p.title)?.[2]; return html`<span class="snapbox"><button class="snap tap" aria-label="View doodle${by ? ` by ${by}` : ''}" style="background-image:url('${p.url}')" @click=${() => { this._view = p.url; }}>${by ? html`<span class="by">${by}</span>` : ''}</button>${this._tidy ? html`<button class="down tap" aria-label="Take this doodle down" @click=${() => this._takeDown([p])}>${icon('close', 18)}</button>` : nothing}</span>`; })}</div>`
          : html`<span class="muted" style="font-size:var(--fs-2);line-height:1.35">Nothing on the fridge yet. Your best doodles go here for everyone to see.</span>`}
      </section>
      ${this._askPin ? html`<fh-pin .pin=${String(this.pin)} @ok=${() => { this._askPin = false; this._tidy = true; }} @cancel=${() => { this._askPin = false; }}></fh-pin>` : nothing}
      ${this._askWho ? html`<div class="view" @click=${(e: Event) => { if (e.target === e.currentTarget) this._askWho = false; }}><section class="glass sheet whobox" role="dialog" aria-modal="true" aria-label="Who drew it?">
        <h2 class="t-head">Who drew it?</h2>
        <div class="whofaces">${this.artists.map((a) => html`<button class="artist tap" @click=${() => { this._artist = a; void this._toFridge(true); }}>${this._face(a)}<span>${a}</span></button>`)}</div>
        <div style="display:flex;gap:10px;justify-content:center"><button class="pill tap" style="height:52px;padding:0 20px" @click=${() => { this._askWho = false; }}>Not yet</button><button class="pill tap" style="height:52px;padding:0 20px" @click=${() => void this._toFridge(true)}>No name</button></div></section></div>` : nothing}
      ${this._view ? html`<button class="view" aria-label="Close" @click=${() => { this._view = ''; }}><img src=${this._view} alt="Doodle"></button>` : nothing}
      ${msg ? html`<div class="toast" role="status" ?data-closing=${msgOut}>${msg}</div>` : nothing}`;
  }
}
if (!customElements.get('fh-doodle')) customElements.define('fh-doodle', FhDoodle);
