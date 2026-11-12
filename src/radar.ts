import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { styles } from './styles';
import { icon, solid } from './icons';

interface Frame { time: number; path: string }

const TILE = 256, MIN_Z = 4, MAX_Z = 7; // the radar pictures stop at zoom 7
const FRAMES = 'https://api.rainviewer.com/public/weather-maps.json';
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services';
/** map pictures, bottom to top: by day a street map with place names; in the dark a grey one with its names laid over */
const BASE = { light: [`${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`], dark: [`${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`] };
const tx = (lon: number, z: number): number => ((lon + 180) / 360) * 2 ** z;
const ty = (lat: number, z: number): number => ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * 2 ** z;
const hhmm = (t: number): string => { const d = new Date(t * 1000), h = d.getHours(); return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };

/**
 * Rain radar: the last two hours of rain, played over a map of the region.
 * The map is plain tiles laid side by side (no map library), centred on the house; drag to look around.
 * Only tile numbers are ever requested, each covering a few hundred kilometres, so the address of the house is not sent anywhere.
 */
export class FhRadar extends LitElement {
  static styles = [styles, css`
    :host { position: absolute; inset: 0; display: block; overflow: hidden; touch-action: none; cursor: grab; user-select: none; -webkit-user-select: none; background: var(--chip-soft); }
    :host(:active) { cursor: grabbing; }
    .layer { position: absolute; inset: 0; }
    .layer img { position: absolute; width: ${TILE}px; height: ${TILE}px; max-width: none; pointer-events: none; }
    .names { z-index: 2; }
    .home, .bar, .zoom, .key { z-index: 3; }
    .rain { opacity: 0; transition: opacity var(--m-3, 240ms) linear; }
    .rain.on { opacity: .82; }
    /* home is a pin standing on the spot, so the town's name on the map beside it stays readable */
    .home { position: absolute; width: 22px; height: 22px; margin: -41px 0 0 -11px; border-radius: 50% 50% 50% 0; rotate: -45deg; background: var(--accent); box-shadow: 0 0 0 2.5px #fff, 0 2px 6px rgba(0,0,0,.4); pointer-events: none; }
    .home::after { content: ''; position: absolute; inset: 6px; border-radius: 50%; background: #fff; }
    .bar { position: absolute; left: 10px; right: 10px; bottom: 10px; display: flex; align-items: center; gap: 10px; padding: 6px 10px 6px 6px; border-radius: 999px; background: var(--rbar, rgba(255,255,255,.88)); color: var(--rink, #14202e); box-shadow: 0 4px 14px rgba(0,0,0,.22); cursor: default; }
    :host([dark]) .bar, :host([dark]) .zoom { --rbar: rgba(16,24,44,.86); --rink: #eef3ff; }
    .bar button, .zoom button { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: inherit; flex-shrink: 0; }
    .bar button { background: var(--primary); color: var(--on-primary); }
    .when { font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; min-width: 66px; }
    .ago { font-size: 13px; font-weight: 600; white-space: nowrap; }
    .ticks { flex: 1; display: flex; gap: 3px; align-items: center; min-width: 0; }
    .ticks i { flex: 1; height: 6px; border-radius: 3px; background: currentColor; opacity: .2; }
    .ticks i.seen { opacity: .55; }
    .ticks i.cur { opacity: 1; height: 10px; background: var(--accent); }
    .zoom { position: absolute; right: 10px; top: 10px; display: flex; flex-direction: column; border-radius: 22px; background: var(--rbar, rgba(255,255,255,.88)); color: var(--rink, #14202e); box-shadow: 0 4px 14px rgba(0,0,0,.22); cursor: default; }
    .zoom button:disabled { opacity: .3; }
    .zoom b { font-size: 24px; line-height: 1; font-weight: 600; }
    .key { position: absolute; left: 10px; top: 10px; display: flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: var(--rkey, #fff); color: var(--rink, #14202e); box-shadow: 0 1px 3px rgba(0,0,0,.3); font-size: 13px; font-weight: 700; pointer-events: none; }
    :host([dark]) .key { --rkey: #10182c; --rink: #eef3ff; }
    .key b { font-weight: inherit; }
    .key span { width: 74px; height: 8px; border-radius: 4px; background: linear-gradient(90deg, #9ad7f5, #3b8fe0, #1f4fc4, #f7e33c, #f39a1e, #e0261c, #a31278); }
    .msg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 24px; font-size: 15px; font-weight: 600; color: var(--ink2); pointer-events: none; }
  `];
  static properties = { lat: { type: Number }, lon: { type: Number }, zoom: { type: Number }, dark: { type: Boolean, reflect: true }, _z: { state: true }, _frames: { state: true }, _i: { state: true }, _play: { state: true }, _size: { state: true }, _pan: { state: true }, _err: { state: true } };
  lat = 0;
  lon = 0;
  zoom = 6;
  dark = false;
  private _z = 0;
  private _host = '';
  private _frames: Frame[] = [];
  private _i = 0;
  private _play = true;
  private _size: [number, number] = [0, 0];
  private _pan: [number, number] = [0, 0];
  private _err = false;
  private _ro?: ResizeObserver;
  private _tick?: number;
  private _poll?: number;
  private _drag?: { x: number; y: number; px: number; py: number };

  connectedCallback(): void {
    super.connectedCallback();
    this._ro = new ResizeObserver(() => { this._size = [this.clientWidth, this.clientHeight]; });
    this._ro.observe(this);
    // calm mode and "reduce motion" start with the newest picture, still; pressing play is a choice
    if (getComputedStyle(this).getPropertyValue('--m-d').trim() === '0') this._play = false;
    this._load();
    this._poll = window.setInterval(() => this._load(), 5 * 60000);
    this._run();
    this.addEventListener('pointerdown', this._down);
    this.addEventListener('pointermove', this._move);
    this.addEventListener('pointerup', this._up);
    this.addEventListener('pointercancel', this._up);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._ro?.disconnect(); clearTimeout(this._tick); clearInterval(this._poll);
    this.removeEventListener('pointerdown', this._down); this.removeEventListener('pointermove', this._move);
    this.removeEventListener('pointerup', this._up); this.removeEventListener('pointercancel', this._up);
  }

  private async _load(): Promise<void> {
    try {
      const j = await (await fetch(FRAMES)).json();
      const frames: Frame[] = (j?.radar?.past ?? []).slice(-12);
      if (!frames.length) throw new Error('no frames');
      const fresh = frames[frames.length - 1].time !== this._frames[this._frames.length - 1]?.time;
      this._host = j.host; this._frames = frames; this._err = false;
      if (fresh && (!this._play || this._i >= frames.length)) this._i = frames.length - 1;
    } catch (e) { this._err = !this._frames.length; console.warn('Family Hub: radar pictures could not be loaded', e); }
  }
  private _run(): void {
    clearTimeout(this._tick);
    const n = this._frames.length, last = this._i >= n - 1;
    this._tick = window.setTimeout(() => {
      if (this._play && n > 1 && this.isConnected && !document.hidden) this._i = last ? 0 : this._i + 1;
      this._run();
    }, last ? 2200 : 520);
  }

  private _down = (e: PointerEvent): void => {
    if ((e.target as Element)?.closest?.('button') || e.composedPath().some((n) => (n as Element).classList?.contains('bar') || (n as Element).classList?.contains('zoom'))) return;
    this._drag = { x: e.clientX, y: e.clientY, px: this._pan[0], py: this._pan[1] };
    this.setPointerCapture(e.pointerId);
  };
  private _move = (e: PointerEvent): void => {
    if (!this._drag) return;
    const s = this.getBoundingClientRect().width / (this.offsetWidth || 1) || 1; // the card may be scaled
    const lim = TILE * 2.5;
    this._pan = [Math.max(-lim, Math.min(lim, this._drag.px + (e.clientX - this._drag.x) / s)), Math.max(-lim, Math.min(lim, this._drag.py + (e.clientY - this._drag.y) / s))];
  };
  private _up = (): void => { this._drag = undefined; };
  private _zoomBy(d: number): void {
    const z = Math.max(MIN_Z, Math.min(MAX_Z, this._zNow + d));
    if (z === this._zNow) return;
    const f = 2 ** (z - this._zNow);
    this._pan = [this._pan[0] * f, this._pan[1] * f];
    this._z = z;
  }
  private get _zNow(): number { return this._z || Math.max(MIN_Z, Math.min(MAX_Z, Math.round(this.zoom))); }

  /** Every tile that shows, with where it sits. */
  private _tiles(): { x: number; y: number; left: number; top: number }[] {
    const [w, h] = this._size, z = this._zNow, n = 2 ** z;
    if (!w || !h) return [];
    const cx = tx(this.lon, z) * TILE - this._pan[0], cy = ty(this.lat, z) * TILE - this._pan[1];
    const out = [];
    for (let x = Math.floor((cx - w / 2) / TILE); x <= Math.floor((cx + w / 2) / TILE); x++)
      for (let y = Math.floor((cy - h / 2) / TILE); y <= Math.floor((cy + h / 2) / TILE); y++)
        if (y >= 0 && y < n) out.push({ x: ((x % n) + n) % n, y, left: Math.round(x * TILE - cx + w / 2), top: Math.round(y * TILE - cy + h / 2) });
    return out;
  }

  protected render(): TemplateResult {
    const tiles = this._tiles(), z = this._zNow, [w, h] = this._size, fr = this._frames, cur = fr[Math.min(this._i, fr.length - 1)];
    const base = BASE[this.dark ? 'dark' : 'light'];
    const mins = cur ? Math.max(0, Math.round((Date.now() / 1000 - cur.time) / 60)) : 0;
    return html`
      ${base.map((u, k) => html`<div class="layer ${k ? 'names' : 'map'}">${tiles.map((t) => html`<img alt="" draggable="false" style="left:${t.left}px;top:${t.top}px" src=${u.replace('{z}', String(z)).replace('{x}', String(t.x)).replace('{y}', String(t.y))}>`)}</div>`)}
      ${fr.map((f, i) => Math.abs(i - this._i) <= 1 || (this._i === fr.length - 1 && i === 0) || this._play ? html`<div class="layer rain ${f === cur ? 'on' : ''}">${tiles.map((t) => html`<img alt="" draggable="false" @error=${(e: Event) => { (e.target as HTMLElement).style.visibility = 'hidden'; }} @load=${(e: Event) => { (e.target as HTMLElement).style.visibility = ''; }} style="left:${t.left}px;top:${t.top}px" src="${this._host}${f.path}/${TILE}/${z}/${t.x}/${t.y}/2/1_1.png">`)}</div>` : nothing)}
      ${w ? html`<span class="home" style="left:${w / 2 + this._pan[0]}px;top:${h / 2 + this._pan[1]}px" aria-hidden="true"></span>` : nothing}
      ${this._err ? html`<p class="msg">The radar pictures could not be loaded. It will try again in a few minutes.</p>` : nothing}
      <div class="key" aria-hidden="true"><b>Light</b><span></span><b>Heavy</b></div>
      <div class="zoom">
        <button class="tap" aria-label="Closer" ?disabled=${z >= MAX_Z} @click=${() => this._zoomBy(1)}><b>+</b></button>
        <button class="tap" aria-label="Further away" ?disabled=${z <= MIN_Z} @click=${() => this._zoomBy(-1)}><b>−</b></button>
        ${this._pan[0] || this._pan[1] ? html`<button class="tap" aria-label="Back to home" @click=${() => { this._pan = [0, 0]; }}>${icon('home', 20)}</button>` : nothing}
      </div>
      ${cur ? html`<div class="bar">
        <button class="tap" aria-label=${this._play ? 'Pause the radar' : 'Play the radar'} @click=${() => { this._play = !this._play; if (!this._play) this._i = fr.length - 1; }}>${solid(this._play ? 'pause' : 'play', 20)}</button>
        <span><span class="when" aria-live="off">${hhmm(cur.time)}</span><br><span class="ago">${mins < 8 ? 'now' : mins < 60 ? `${mins} min ago` : `${Math.floor(mins / 60)} h ${mins % 60} min ago`}</span></span>
        <span class="ticks" aria-hidden="true">${fr.map((_, i) => html`<i class=${i === this._i ? 'cur' : i < this._i ? 'seen' : ''}></i>`)}</span>
      </div>` : nothing}`;
  }
}
if (!customElements.get('fh-radar')) customElements.define('fh-radar', FhRadar);
