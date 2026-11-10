import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { FitController } from './util';
import { icon } from './icons';
import type { Hass } from './types';

const INKS = ['#1d1d1f', '#e63946', '#f77f00', '#fcbf49', '#2a9d8f', '#118ab2', '#7b2cbf', '#ff70a6', '#8d5a3b', '#ffffff'];
const SIZES = [4, 10, 22];
const LOCAL_KEY = 'family-hub-fridge';
const ROOT = 'media-source://media_source/local/.';

interface Pic { title: string; url: string; id?: string }
interface Stroke { ink: string; size: number; erase: boolean; hue: number; pts: [number, number, number, number, number][]; stamp?: string }
const STAMPS = ['🦖', '🐉', '🚚', '⭐', '❤️', '🌈', '🏄', '🎺'];

/** Doodle pad with undo, rainbow brush, chalkboard mode and a shared "fridge" gallery. */
export class FhDoodle extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .brushes { width: 132px; flex-shrink: 0; border-radius: 28px; padding: 14px 10px; display: grid; grid-template-columns: 1fr 1fr; justify-items: center; align-content: start; gap: 10px 6px; overflow: auto; }
    .brushes[data-fit='1'] { width: 190px; grid-template-columns: repeat(3, 1fr); }
    .brushes[data-fit='2'], .brushes[data-fit='3'] { width: 248px; grid-template-columns: repeat(4, 1fr); }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .brushes { width: auto !important; grid-template-columns: repeat(auto-fill, minmax(50px, 1fr)) !important; flex-shrink: 0; }
    :host([data-shape='tall']) .brushes .rule { display: none; }
    :host([data-shape='tall']) .gallery { width: auto; max-height: 260px; }
    :host([data-shape='tall']) .snaps { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .easel { min-height: 440px; }
    :host([data-phone]) .hint { font-size: 22px; text-align: center; padding: 0 20px; }
    :host([data-phone]) .acts { flex-wrap: wrap; }
    :host([data-phone]) .view { position: fixed; border-radius: 0; }
    .brushes .rule { grid-column: 1 / -1; height: 1px; width: 90px; background: var(--track); }
    .ink { width: 44px; height: 44px; border-radius: 50%; box-shadow: inset 0 0 0 2px rgba(0,0,0,.12); transition: transform .2s cubic-bezier(.2,1.4,.4,1); flex-shrink: 0; }
    .ink[aria-pressed='true'] { transform: scale(1.18); box-shadow: 0 0 0 3px var(--chip-strong), 0 0 0 6px var(--ink); }
    .rainbow { background: conic-gradient(#e63946, #fcbf49, #2a9d8f, #118ab2, #7b2cbf, #e63946); }
    .size { width: 50px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .size[aria-pressed='true'] { background: var(--chip-strong); }
    .size i { border-radius: 50%; background: var(--ink); display: block; }
    .easel { flex: 1; min-width: 0; border-radius: 28px; padding: 10px; display: flex; flex-direction: column; gap: 10px; }
    .pad { flex: 1; min-height: 0; border-radius: 20px; overflow: hidden; position: relative; background: #fffdf7; box-shadow: inset 0 0 0 1px rgba(0,0,0,.06); transition: background .4s; }
    .pad.chalk { background: #23332b; }
    canvas { position: absolute; inset: 0; touch-action: none; cursor: crosshair; }
    .hint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: var(--w-bold, 700); color: rgba(0,0,0,.12); }
    .chalk .hint { color: rgba(255,255,255,.18); }
    .acts { display: flex; gap: 8px; align-items: center; }
    .gallery { width: 250px; flex-shrink: 0; border-radius: 28px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    .snaps { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-content: start; }
    .snap { aspect-ratio: 4/3; border-radius: 10px; background: #fff center / cover; box-shadow: 0 6px 14px -6px rgba(0,0,0,.35); position: relative; }
    .snap:nth-child(odd) { transform: rotate(-2.5deg); } .snap:nth-child(even) { transform: rotate(2deg); }
    .snap::before { content: ''; position: absolute; top: -6px; left: 50%; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: var(--accent); box-shadow: 0 2px 3px rgba(0,0,0,.3); }
    .snap .by { position: absolute; bottom: -8px; right: -4px; background: var(--chip-strong); border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: var(--w-heavy, 800); text-transform: capitalize; }
    .stick { animation: stick .9s cubic-bezier(.2,1.3,.4,1); }
    @keyframes stick { 0% { transform: scale(1); } 40% { transform: scale(.4) translate(60%, -10%) rotate(8deg); opacity: .6; } 100% { transform: scale(1); opacity: 1; } }
    .view { position: absolute; inset: 0; z-index: 30; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; border-radius: 28px; }
    .view img { max-width: 92%; max-height: 92%; border-radius: 16px; background: #fff; box-shadow: 0 20px 60px rgba(0,0,0,.5); animation: sheet .4s cubic-bezier(.2,1.2,.3,1); }
  `];

  static properties = { hass: { attribute: false }, artists: { attribute: false }, _stamp: { state: true }, _artist: { state: true }, _ink: { state: true }, _size: { state: true }, _erase: { state: true }, _chalk: { state: true },
    _blank: { state: true }, _pics: { state: true }, _view: { state: true }, _msg: { state: true }, _stick: { state: true } };
  hass?: Hass;
  private _ink = INKS[0];
  private _size = 10;
  artists: string[] = [];
  private _stamp = '';
  private _artist = '';
  private _erase = false;
  private _chalk = false;
  private _blank = true;
  private _pics: Pic[] = [];
  private _view = '';
  private _msg = '';
  private _stick = false;
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
  disconnectedCallback(): void { super.disconnectedCallback(); this._ro?.disconnect(); }

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
      this._strokes.push(st); this._drawStamp(st); this._blank = false; this._last = null; return;
    }
    this._cur = { ink: this._ink, size: this._size, erase: this._erase, hue: this._hue, pts: [] };
    this._strokes.push(this._cur);
    if (this._strokes.length > 400) this._strokes.splice(0, this._strokes.length - 400);
    this._seg(this._cur, this._last, this._last, e.pressure);
    this._blank = false;
  }
  private _move(e: PointerEvent): void {
    if (!this._last || !this._cur) return;
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

  private _undoOne(): void {
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

  private async _toFridge(): Promise<void> {
    if (this._blank) { this._say('Draw something first!'); return; }
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
      } catch { this._say('The fridge is full – clear a few doodles'); return; }
    }
    this._say(shared ? 'Stuck on the fridge!' : 'Stuck on this panel’s fridge');
    this._clear(); this._strokes = [];
    this._loadFridge();
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

  render(): TemplateResult {
    return html`
      <section class="glass brushes" data-fits aria-label="Brushes">
        ${INKS.map((c) => html`<button class="ink tap" style="background:${c}" aria-label="Colour" aria-pressed=${String(!this._erase && !this._stamp && this._ink === c)} @click=${() => { this._ink = c; this._erase = false; this._stamp = ''; }}></button>`)}
        <button class="ink tap rainbow" aria-label="Rainbow" aria-pressed=${String(!this._erase && !this._stamp && this._ink === 'rainbow')} @click=${() => { this._ink = 'rainbow'; this._erase = false; this._stamp = ''; }}></button>
        <span class="rule"></span>
        ${STAMPS.map((st) => html`<button class="size tap" style="font-size:26px" aria-label="Stamp" aria-pressed=${String(this._stamp === st)} @click=${() => { this._stamp = this._stamp === st ? '' : st; this._erase = false; }}>${st}</button>`)}
        <span class="rule"></span>
        ${SIZES.map((s) => html`<button class="size tap" aria-label="Brush ${s}" aria-pressed=${String(this._size === s)} @click=${() => { this._size = s; }}><i style="width:${Math.min(s, 22)}px;height:${Math.min(s, 22)}px"></i></button>`)}
        <button class="size tap" aria-label="Eraser" aria-pressed=${String(this._erase)} @click=${() => { this._erase = !this._erase; }} style="font-size:22px">🧽</button>
      </section>
      <section class="glass easel ${this._stick ? 'stick' : ''}">
        <div class="pad ${this._chalk ? 'chalk' : ''}">
          <canvas @pointerdown=${this._down} @pointermove=${this._move} @pointerup=${this._up} @pointercancel=${this._up} @pointerleave=${this._up}></canvas>
          ${this._blank ? html`<div class="hint">Draw something brilliant</div>` : nothing}
        </div>
        <div class="acts">
          <button class="pill tap" @click=${() => this._undoOne()}>${icon('left', 18)}Undo</button>
          <button class="pill tap" @click=${() => this._clear()}>${icon('close', 18)}Clear</button>
          <button class="pill tap" @click=${() => { this._chalk = !this._chalk; if (this._chalk && this._ink === INKS[0]) this._ink = '#ffffff'; else if (!this._chalk && this._ink === '#ffffff') this._ink = INKS[0]; }}>${icon(this._chalk ? 'sun' : 'moon', 18)}${this._chalk ? 'Paper' : 'Chalkboard'}</button>
          <span style="flex:1"></span>
          ${this.artists.length ? html`<span class="muted" style="font-size:13px;font-weight:var(--w-bold, 700)">Artist</span>${this.artists.map((a) => html`<button class="pill tap" style=${this._artist === a ? 'background:var(--primary);color:var(--on-primary)' : ''} @click=${() => { this._artist = this._artist === a ? '' : a; }}>${a}</button>`)}` : ''}
          <button class="pill tap primary" style="height:48px;padding:0 20px;font-size:16px" @click=${() => this._toFridge()}>${icon('star', 18)}Stick it on the fridge</button>
        </div>
      </section>
      <section class="glass gallery" aria-label="The fridge">
        <span class="label">The fridge</span>
        ${this._pics.length ? html`<div class="snaps">${this._pics.map((p) => { const by = /-(\d{6})-([a-z]+)/.exec(p.title)?.[2]; return html`<button class="snap tap" aria-label="View doodle" style="background-image:url('${p.url}')" @click=${() => { this._view = p.url; }}>${by ? html`<span class="by">${by}</span>` : ''}</button>`; })}</div>`
          : html`<span class="muted" style="font-size:14px">Nothing on the fridge yet. Your best doodles go here for everyone to see.</span>`}
      </section>
      ${this._view ? html`<button class="view" aria-label="Close" @click=${() => { this._view = ''; }}><img src=${this._view} alt="Doodle"></button>` : nothing}
      ${this._msg ? html`<div class="toast" role="status">${this._msg}</div>` : nothing}`;
  }
}
if (!customElements.get('fh-doodle')) customElements.define('fh-doodle', FhDoodle);
