import { html, nothing, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import type { FamilyHubConfig, Hass } from './types';
import { ART_DEFAULTS, adoptArt, artListOf, artOf, loadArt, orderArt, type ArtItem } from './artlib';
import { mediaUrl } from './media';
import { CameraWatch, type CamFault } from './presence';
import { hm, minsNow, bedtimeFor } from './util';

/* ------------------------------------------------------------------ *
 * Art mode: the panel's screensaver. After a while with nobody using it
 * the page fades (slowly) into tonight's artwork with a clock; a touch,
 * or someone walking up, brings the hub straight back. After the
 * youngest child's bedtime the artwork gives way to a dim clock.
 *
 * The screen itself never sleeps: art mode is a state of the page, so a
 * kiosk never loses its display. Dimming the backlight is optional, and
 * only through an entity Home Assistant already has.
 * ------------------------------------------------------------------ */

/** From the earliest bedtime among the children until the household's morning (the end of quiet hours, never before 5 am): the artwork rests and a dim clock keeps watch. */
export const artNight = (kids: { bedtime?: string }[] = [], quiet: { start?: string; end?: string } = {}, d = new Date()): boolean => {
  if (!kids.length) return false;
  const n = minsNow(d), wake = Math.max(5 * 60, hm(quiet.end ?? '06:30'));
  return n < wake || kids.some((k) => n >= hm(bedtimeFor(k.bedtime, d)));
};

/** Where the clock sits (0 to 1 across, 0 to 1 down): a slow wander that takes hours to repeat, so no pixel rests. */
export const drift = (d: Date): [number, number] => {
  const t = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  return [0.5 + 0.5 * Math.sin(t / 9), 0.5 + 0.5 * Math.cos(t / 14)];
};

interface Shown { url: string; n: number; file: string }
export interface ArtHost { hass?: Hass; requestUpdate(): void }

export class ArtMode {
  /** the artwork is up */
  on = false;
  /** it came up by itself this many ms ago (0 = it is not up) */
  since = 0;
  cur: Shown | null = null; prev: Shown | null = null;
  items: ArtItem[] = [];
  /** why the camera cannot watch, if it cannot */
  camFault: CamFault = '';
  private _order: ArtItem[] = []; private _i = 0; private _n = 0; private _shownAt = 0; private _loadedAt = 0; private _loading = false;
  private _cam: CameraWatch | null = null; private _level = -1;
  constructor(private host: ArtHost, private cfg: () => FamilyHubConfig | undefined, private touched: () => void) {}

  private get a() { return artOf(this.cfg()); }
  get idleMs(): number { const m = Number(this.a.idle_minutes ?? ART_DEFAULTS.idle); return Number.isFinite(m) && m > 0 ? m * 60_000 : 0; }
  get intervalMs(): number { const m = Number(this.a.interval_minutes ?? ART_DEFAULTS.interval); return Math.max(0.25, Number.isFinite(m) && m > 0 ? m : ART_DEFAULTS.interval) * 60_000; }

  /**
   * Once a second. `idleFor` is how long since the last touch or presence; `blocked` is true while something must not be covered
   * (a timer, an alarm, a call, a sheet, a keyboard, a music session); `todays` are today's event titles, for choosing pictures.
   */
  tick(idleFor: number, blocked: boolean, todays: string[] = []): void {
    if (this._presence()) return;
    if (this.on && blocked) { this.wake(); return; }
    if (!this.on && this.idleMs && idleFor >= this.idleMs && !blocked && !document.hidden) this.enter(todays);
    if (this.on && Date.now() - this._shownAt >= this.intervalMs) void this._next();
    if (this.on && Date.now() - this._loadedAt > 10 * 60_000) void this._load(todays);
  }
  enter(todays: string[] = []): void {
    if (this.on) return;
    this.on = true; this.since = Date.now(); this._shownAt = Date.now();
    void this._load(todays).then(() => { if (this.on && !this.cur) void this._next(); });
    this.host.requestUpdate();
  }
  wake(): void {
    if (!this.on) return;
    this.on = false; this.since = 0; this.prev = null;
    this.host.requestUpdate();
  }

  /** Someone is there: a sensor says so, or the camera saw movement. Either counts as a touch, and wakes the panel. */
  private _presence(): boolean {
    const a = this.a, src = a.presence ?? 'none'; let here = false;
    if (src === 'sensor' && a.presence_entity) {
      const st = this.host.hass?.states[a.presence_entity]?.state ?? '';
      if (st === 'on') { here = true; this.touched(); if (this.on) this.wake(); }
    }
    if (src === 'camera') {
      if (!this._cam) {
        this._cam = new CameraWatch(() => ({ sensitivity: this.a.camera_sensitivity, margin: this.a.camera_margin }), () => { this.touched(); if (this.on) this.wake(); }, () => { this.camFault = this._cam?.fault ?? ''; });
        void this._cam.start();
      }
    } else if (this._cam) { this._cam.stop(); this._cam = null; this.camFault = ''; }
    return here;
  }

  private async _load(todays: string[]): Promise<void> {
    if (this._loading) return; this._loading = true;
    try {
      const items = await loadArt(this.host.hass, artListOf(this.cfg()));
      this._loadedAt = Date.now();
      if (items) void adoptArt(this.host.hass, artListOf(this.cfg()), items).then((n) => { if (n) this._loadedAt = 0; });
      if (items) { this.items = items; const was = this._order[this._i]?.file; this._order = orderArt(items, new Date(), todays); const at = this._order.findIndex((x) => x.file === was); this._i = at >= 0 ? at : -1; }
    } finally { this._loading = false; }
  }
  /** The next picture: found, fetched and ready before it is shown, so the cross-fade never shows half a picture. One that cannot be fetched is skipped. */
  private async _next(): Promise<void> {
    this._shownAt = Date.now();
    for (let tries = 0; tries < Math.min(6, this._order.length); tries++) {
      this._i = (this._i + 1) % this._order.length;
      const it = this._order[this._i]; if (it.file === this.cur?.file && this._order.length > 1) continue;
      const url = await mediaUrl(it.file, this.host.hass);
      if (!url || !await new Promise<boolean>((yes) => { const im = new Image(); im.onload = () => yes(true); im.onerror = () => yes(false); im.src = url; })) continue;
      if (!this.on) return;
      if (it.file === this.cur?.file) return;
      this.prev = this.cur; this.cur = { url, n: ++this._n, file: it.file }; this._shownAt = Date.now();
      this.host.requestUpdate();
      return;
    }
  }

  /**
   * The screen's brightness, when the family has named an entity for it: full while the hub is in use, lower while the artwork shows,
   * lowest at night. Does nothing at all when the entity is not there (the kiosk PC that provides it may not be installed yet).
   */
  backlight(state: 'hub' | 'art' | 'night'): void {
    const a = this.a, id = a.backlight, h = this.host.hass, st = id ? h?.states[id] : undefined;
    const pct = Math.max(1, Math.min(100, state === 'hub' ? 100 : state === 'art' ? a.backlight_art ?? ART_DEFAULTS.dimArt : a.backlight_night ?? ART_DEFAULTS.dimNight));
    if (!id || !h || !st || st.state === 'unavailable' || pct === this._level) { if (!id) this._level = -1; return; }
    this._level = pct;
    const dom = id.split('.')[0];
    try {
      if (dom === 'light') void Promise.resolve(h.callService('light', 'turn_on', { brightness_pct: pct }, { entity_id: id })).catch(() => {});
      else if (dom === 'number' || dom === 'input_number') { const lo = Number(st.attributes.min ?? 0), hi = Number(st.attributes.max ?? 100); void Promise.resolve(h.callService(dom, 'set_value', { value: Math.round(lo + ((hi - lo) * pct) / 100) }, { entity_id: id })).catch(() => {}); }
    } catch { /* never let the backlight stop the panel */ }
  }
  dispose(): void { this._cam?.stop(); this._cam = null; }
}

export interface ArtView {
  now: Date; hm: string; ampm: string; date: string;
  /** the look's own clock drawing, if it has one */
  art: unknown;
  lines: string[]; night: boolean; closing: boolean; calm: boolean;
  look: string; theme: string; tod: string;
  onWake: (e: Event) => void;
}
/** The artwork, its clock and a line or two of news. Drawn by the card, inside its frame, so every look can dress it. */
export const artView = (m: ArtMode, v: ArtView): TemplateResult => {
  const [fx, fy] = drift(v.now), at = `left:${(fx * 100).toFixed(2)}%;top:${(fy * 100).toFixed(2)}%;transform:translate(${(-fx * 100).toFixed(2)}%, ${(-fy * 100).toFixed(2)}%)`;
  const pic = (s: Shown, out: boolean): TemplateResult => html`<img class="aimg" alt="" draggable="false" ?data-out=${out} data-kb=${s.n % 4} src=${s.url} style="--kb:${Math.round(m.intervalMs / 1000) + 4}s">`;
  const pics = !v.night && m.cur;
  return html`<div class="artm" role="button" tabindex="0" aria-label="Screensaver. Touch to use the panel" ?data-night=${v.night} ?data-closing=${v.closing} ?data-bare=${!pics}
      @pointerdown=${v.onWake} @keydown=${v.onWake}>
    ${v.night ? nothing : pics ? html`${m.prev ? keyed(m.prev.n, pic(m.prev, true)) : nothing}${keyed(m.cur!.n, pic(m.cur!, false))}<span class="ashade" aria-hidden="true"></span>`
      : html`<fh-ambient .look=${v.look} .theme=${v.theme} .tod=${v.tod} .calm=${v.calm}></fh-ambient>`}
    <div class="adrift"><div class="aplate" style=${at}>
      ${v.art && v.art !== nothing ? html`<span class="nart">${v.art}</span>` : nothing}
      <div class="awords"><span class="atime"><span class="display big">${v.hm}</span><span class="aampm">${v.ampm}</span></span>
        <span class="adate">${v.date}</span>
        ${v.night ? nothing : v.lines.map((l) => html`<span class="ainfo">${l}</span>`)}</div>
    </div></div>
  </div>`;
};

export const artCss = `
  .artm { position: absolute; inset: 0; z-index: 38; overflow: hidden; isolation: isolate; background: #0b0d12; color: #fff; cursor: pointer; animation: afade 2.5s linear backwards; touch-action: none;
    --ink: #fff; --ink2: rgba(255,255,255,.82); --ink3: rgba(255,255,255,.6); --paper: transparent; --track: rgba(255,255,255,.26); --accent: #fff; --danger: #fff; --ground: transparent; }
  .artm:focus-visible { outline: none; }
  /* back to the hub: fast, and the layer keeps taking the touch until it has gone, so the touch that wakes the panel never reaches what is under it */
  .artm[data-closing] { animation: fhout var(--m-3, 240ms) var(--e-in, ease-in) forwards; }
  @keyframes afade { from { opacity: 0; } }
  /* no artwork yet (or none that can be fetched): the look's own wallpaper and the life behind the page, with the clock */
  .artm[data-bare]:not([data-night]) { background: inherit; }
  .artm[data-bare]:not([data-night])::after { content: ''; position: absolute; inset: 0; z-index: 0; background: rgba(8,10,16,.18); pointer-events: none; }
  .adrift { z-index: 1; }
  .artm fh-ambient { z-index: 0; }
  .aimg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; animation: afade 2.5s linear backwards, akb0 var(--kb, 300s) linear both; will-change: transform, opacity; }
  .aimg[data-kb='1'] { animation-name: afade, akb1; } .aimg[data-kb='2'] { animation-name: afade, akb2; } .aimg[data-kb='3'] { animation-name: afade, akb3; }
  .fh[data-calm] .aimg { animation: afade 2.5s linear backwards; }
  @media (prefers-reduced-motion: reduce) { .aimg { animation: afade 2.5s linear backwards; } }
  @keyframes akb0 { from { transform: scale(1.03) translate(-1%, -0.6%); } to { transform: scale(1.13) translate(1.6%, 1%); } }
  @keyframes akb1 { from { transform: scale(1.13) translate(1.6%, -1%); } to { transform: scale(1.03) translate(-1%, 0.6%); } }
  @keyframes akb2 { from { transform: scale(1.04) translate(1.2%, 1%); } to { transform: scale(1.12) translate(-1.6%, -1%); } }
  @keyframes akb3 { from { transform: scale(1.12) translate(-1.4%, 1%); } to { transform: scale(1.04) translate(0.8%, -0.8%); } }
  .ashade { position: absolute; inset: 0; background: radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,.34)); pointer-events: none; }
  .adrift { position: absolute; inset: 44px 52px; pointer-events: none; }
  .aplate { position: absolute; display: flex; align-items: center; gap: 28px; padding: 24px 34px 26px; border-radius: 40px; max-width: 100%;
    background: rgba(12,14,20,.42); -webkit-backdrop-filter: blur(22px) saturate(1.2); backdrop-filter: blur(22px) saturate(1.2); border: 1px solid rgba(255,255,255,.16); box-shadow: 0 18px 50px rgba(0,0,0,.28);
    transition: left calc(15s * var(--m-d, 1)) linear, top calc(15s * var(--m-d, 1)) linear, transform calc(15s * var(--m-d, 1)) linear; }
  .aplate .nart { line-height: 0; flex-shrink: 0; }
  .awords { display: flex; flex-direction: column; min-width: 0; }
  .atime { display: flex; align-items: baseline; gap: 12px; white-space: nowrap; }
  .atime .big { font-size: 148px; font-weight: 500; line-height: .92; font-variant-numeric: tabular-nums; letter-spacing: -.03em; }
  .aampm { font-size: var(--fs-d1); font-weight: 600; opacity: .85; }
  .adate { font-size: var(--fs-6); font-weight: 600; margin-top: 8px; opacity: .92; }
  .ainfo { font-size: var(--fs-5); font-weight: 600; margin-top: 10px; opacity: .95; max-width: 20em; text-wrap: balance; }
  .ainfo + .ainfo { margin-top: 4px; opacity: .8; }
  /* night: the artwork rests; a dim amber clock, as on the night screen */
  .artm[data-night] { background: #000; --ink: #ffb26b; --ink2: rgba(255,178,107,.75); --ink3: rgba(255,178,107,.5); --track: rgba(255,178,107,.2); --accent: #ffb26b; --danger: #ffb26b; --ground: #000; color: #ffb26b; }
  .artm[data-night] .aplate { background: none; -webkit-backdrop-filter: none; backdrop-filter: none; border-color: transparent; box-shadow: none; opacity: .72; }
  .artm[data-night] .atime .big { font-weight: 300; }
  :host([data-phone]) .artm { position: fixed; }
  :host([data-phone]) .adrift { inset: 24px 18px; }
  :host([data-phone]) .aplate { flex-direction: column; align-items: flex-start; gap: 12px; padding: 18px 20px; border-radius: 28px; }
  :host([data-phone]) .aplate .nart { display: none; }
  :host([data-phone]) .atime .big { font-size: var(--fs-d5); } :host([data-phone]) .aampm { font-size: var(--fs-5); }
  :host([data-phone]) .adate { font-size: var(--fs-4); } :host([data-phone]) .ainfo { font-size: var(--fs-3); }
`;
