import { LitElement, html, css, svg, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import type { Hass, HassEntity } from './types';
import { FitController, getShape } from './util';
import './pin';

const CONTROL = ['light', 'switch', 'fan', 'cover', 'lock', 'climate', 'media_player', 'input_boolean'];
const ON = new Set(['on', 'open', 'playing', 'unlocked', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only', 'paused', 'idle']);

interface Room { id: string; name: string; ents: HassEntity[] }
/** domains a tap switches on and off (drawn with a switch); the rest open something or need a grown-up */
const SWITCHED = ['light', 'switch', 'fan', 'input_boolean', 'climate'];
const dom = (e: HassEntity | string): string => (typeof e === 'string' ? e : e.entity_id).split('.')[0];
const gone = (e: HassEntity): boolean => e.state === 'unavailable' || e.state === 'unknown';

/* drawn icons for the things that are not lights */
const ic = (body: TemplateResult): TemplateResult => svg`<svg class="i" viewBox="0 0 24 24" style="--s:20px" aria-hidden="true">${body}</svg>`;
const DRAWN: Record<string, TemplateResult> = {
  fan: ic(svg`<circle cx="12" cy="12" r="1.800"></circle><path d="M12 10.200C10.500 6 12.500 3 15 3.500c2 .400 2 3.500-1.200 6.900M13.800 12.600c4.200-1.500 7.200.500 6.700 3-.400 2-3.500 2-6.900-1.200M10.700 13.600C9.200 17.800 6 18.800 4.500 17c-1.300-1.600.200-4.300 4.700-5.400"></path>`),
  locked: ic(svg`<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3M12 14.500v2"></path>`),
  unlocked: ic(svg`<rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 7.500-2M12 14.500v2"></path>`),
  garage: ic(svg`<path d="M3 20V9.500L12 4l9 5.500V20"></path><path d="M6.500 20v-8h11v8M6.500 14.700h11M6.500 17.400h11"></path>`),
  garageOpen: ic(svg`<path d="M3 20V9.500L12 4l9 5.500V20"></path><path d="M6.500 20v-8h11v8M6.500 13.500h11"></path>`),
  tv: ic(svg`<rect x="3" y="5" width="18" height="12" rx="2"></rect><path d="M8 20.500h8M12 17v3.500"></path>`),
  speaker: ic(svg`<rect x="6.500" y="3" width="11" height="18" rx="2.500"></rect><circle cx="12" cy="14.500" r="3"></circle><circle cx="12" cy="7.500" r=".800"></circle>`),
  plug: ic(svg`<path d="M9 3v5M15 3v5M6.500 8h11v3.500a5.500 5.500 0 0 1-11 0zM12 17v4"></path>`),
  heat: ic(svg`<path d="M10 4a2 2 0 0 1 4 0v9.500a4 4 0 1 1-4 0z"></path><path d="M12 9v7"></path>`)
};

/** Home: rooms with their devices, scenes (scripts) and automations. */
export class FhHome extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .rooms { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
    /* rooms are dealt into columns of even height (tallest first), so no column ends with a hole beside it */
    .rgrid { flex: 1; min-height: 0; overflow: auto; display: flex; align-items: flex-start; gap: 12px; padding: 4px; margin: -4px; }
    .rcol { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
    .rgrid[data-fit] { gap: 10px; }
    .rgrid[data-fit] .rcol { gap: 10px; }
    .rgrid[data-fit] .room { padding: 10px; gap: 4px; border-radius: 18px; }
    .rgrid[data-fit] .rh h2 { font-size: 17px; }
    .rgrid[data-fit='2'] .dev, .rgrid[data-fit='3'] .dev { padding: 2px 8px; }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .side { width: auto; flex-direction: row; flex-shrink: 0; }
    :host([data-shape='tall']) .side > section { flex: 1 1 0; min-width: 0; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .rooms { padding: 14px; border-radius: 22px; }
    :host([data-phone]) .rgrid { overflow: visible; flex: none; flex-direction: column; align-items: stretch; }
    :host([data-phone]) .rcol { flex: none; }
    :host([data-phone]) .side { flex-direction: column; }
    .room { border-radius: 22px; background: var(--chip); padding: 14px; display: flex; flex-direction: column; gap: 8px; transition: box-shadow var(--m-4, 400ms) ease, background var(--m-4, 400ms) ease; }
    /* a lit room glows at its edge; its background stays the theme's own, so the words on it keep their contrast in dark themes too */
    .room.lit { box-shadow: 0 0 0 2px color-mix(in srgb, #ffb703 75%, transparent), 0 10px 30px -10px rgba(255,183,3,.55); }
    .rh { display: flex; align-items: center; gap: 8px; min-height: 44px; }
    .rh h2 { flex: 1; min-width: 0; font-size: 19px; font-weight: var(--w-heavy, 800); overflow-wrap: anywhere; }
    .dev { display: flex; align-items: center; gap: 10px; min-height: 52px; /* token */ padding: 4px 10px; border-radius: 14px; background: var(--chip-soft); width: 100%; text-align: left; }
    .dev .dicon { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--track); color: var(--ink2); flex-shrink: 0; transition: background-color var(--m-3, 240ms), color var(--m-3, 240ms), box-shadow var(--m-3, 240ms); }
    .dev.on .dicon { background: #ffd166; color: #7a4b00; box-shadow: 0 0 16px rgba(255,209,102,.8); }
    .dev .nm { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
    .dev .n { font-size: 15px; font-weight: var(--w-semi, 600); overflow-wrap: anywhere; }
    .dev .s { font-size: 13px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .dev.gone { cursor: default; }
    .dev.gone .dicon { opacity: .55; }
    .dev .pinned { color: var(--ink2); display: flex; flex-shrink: 0; }
    /* a call that takes a while: the tile says so after a quarter of a second, instead of looking dead */
    [data-busy] .dicon, .scene[data-busy] { animation: busy 1s ease-in-out infinite; }
    @keyframes busy { 50% { opacity: .35; } }
    .side { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
    .side .label { font-size: 13px; }
    .scenes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .scene { min-height: 64px; border-radius: 16px; background: var(--chip); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px; padding: 8px 12px; font-size: 15px; font-weight: var(--w-bold, 700); text-align: left; line-height: 1.2; }
    .scene.go { animation: go var(--m-5, 900ms) ease; }
    @keyframes go { 30% { background: var(--primary); color: var(--on-primary); transform: scale(calc(1 + .04 * var(--m-d, 1))); } }
    .auto { display: flex; align-items: center; gap: 10px; width: 100%; min-height: 48px; padding: 4px; border-radius: 12px; font-size: 15px; font-weight: var(--w-semi, 600); text-align: left; line-height: 1.25; }
    .auto > span:first-child { flex: 1; min-width: 0; }
    /* the switch: a 56 by 32 track inside a control at least 44 high (the row, or the room's "Lights" button) */
    .sw { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; /* token */ padding: 0 2px 0 8px; border-radius: 999px; font-size: 15px; font-weight: var(--w-semi, 600); color: var(--ink); flex-shrink: 0; }
    .toggle { display: block; width: 56px; height: 32px; border-radius: 16px; background: var(--track); position: relative; flex-shrink: 0; transition: background-color var(--m-3, 240ms); }
    .toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,.3); transition: transform var(--mt-3, 240ms) cubic-bezier(.2,1.4,.4,1); }
    [aria-checked='true'] > .toggle { background: var(--ok); }
    [aria-checked='true'] > .toggle::after { transform: translateX(24px); }
    .alist { flex: 1; min-height: 0; overflow: auto; padding: 6px; margin: -6px; }
    .grown { height: 44px; /* token */ font-size: 15px; }
    /* while the PIN window is open the page says so, counts it down and offers to close it */
    .unl { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; padding: 4px 4px 4px 14px; border-radius: 999px; background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-size: 15px; font-weight: var(--w-semi, 600); }
    .unl .ut { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; line-height: 1; }
    .unl b { font-variant-numeric: tabular-nums; font-weight: var(--w-heavy, 800); }
    .unl .pill { height: 44px; /* token */ font-size: 15px; white-space: nowrap; }
    :host([data-phone]) .unl .ut > span { white-space: normal; }
    .none { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; text-align: center; padding: 24px; color: var(--ink2); }
    .none b { font-size: 22px; font-weight: var(--w-heavy, 800); color: var(--ink); }
    .none span { font-size: 16px; line-height: 1.4; max-width: 460px; }
    .tipline { font-size: 15px; line-height: 1.35; }
  `];

  static properties = { hass: { attribute: false }, pin: {}, hideScripts: { attribute: false }, hide: { attribute: false }, _unlocked: { state: true }, _askPin: { state: true }, _went: { state: true }, _all: { state: true }, _busy: { state: true }, _opt: { state: true }, _tick: { state: true } };
  hass?: Hass;
  pin = '';
  hideScripts: string[] = [];
  hide: string[] = [];
  private _all = false;
  private _unlocked = 0;
  /** the door or cover the window was opened for ('' when it was opened for something else): only that one may be used again without the PIN */
  private _unlockedFor = '';
  private _askFor = '';
  private _tick = 0;
  private _tickT?: number;
  static WINDOW = 60_000;
  private _open(forId: string): void {
    this._unlocked = Date.now() + FhHome.WINDOW; this._unlockedFor = forId;
    clearInterval(this._tickT);
    this._tickT = window.setInterval(() => { this._tick++; if (Date.now() >= this._unlocked) this._lockNow(); }, 1000);
  }
  private _lockNow(): void { clearInterval(this._tickT); this._tickT = undefined; this._unlocked = 0; this._unlockedFor = ''; this._all = false; }
  disconnectedCallback(): void { super.disconnectedCallback(); this._lockNow(); }
  private _askPin: (() => void) | null = null;
  private _went = '';
  /** entities whose call has been running for more than a quarter of a second */
  private _busy: string[] = [];

  private _rooms(): Room[] {
    const h = this.hass!;
    const areas = Object.values(h.areas ?? {}).sort((a, b) => a.name.localeCompare(b.name));
    const by = new Map<string, HassEntity[]>();
    for (const [id, reg] of Object.entries(h.entities ?? {})) {
      if (!CONTROL.includes(dom(id)) || reg.hidden || reg.entity_category || this.hide.includes(id)) continue;
      // a device that has dropped off stays in its room, marked "Not responding", rather than vanishing
      const st = h.states[id];
      if (!st) continue;
      const area = reg.area_id ?? (reg.device_id ? h.devices?.[reg.device_id]?.area_id : null);
      if (!area) continue;
      by.set(area, [...(by.get(area) ?? []), st]);
    }
    return areas.map((a) => ({ id: a.area_id, name: a.name, ents: (by.get(a.area_id) ?? []).sort((x, y) => x.entity_id.localeCompare(y.entity_id)) })).filter((r) => r.ents.length);
  }
  /** Deal the rooms into n columns of even height: tallest first, each into the shortest column so far. */
  private _columns(rooms: Room[], n: number): Room[][] {
    const cols: { h: number; rooms: Room[] }[] = Array.from({ length: Math.max(1, Math.min(n, rooms.length)) }, () => ({ h: 0, rooms: [] }));
    for (const r of [...rooms].sort((a, b) => b.ents.length - a.ents.length || a.name.localeCompare(b.name))) {
      const c = cols.reduce((m, x) => (x.h < m.h ? x : m), cols[0]);
      c.rooms.push(r); c.h += 80 + r.ents.length * 60;
    }
    return cols.map((c) => c.rooms);
  }

  private _tell(m: string): void { this.dispatchEvent(new CustomEvent('say', { detail: m })); }
  /** One call to Home Assistant for a tile: shows it as busy if it takes a while, says what happened, and says so if it failed. */
  private async _call(id: string, name: string, run: () => Promise<unknown>, done?: string, hold?: Record<string, boolean>): Promise<void> {
    const t = window.setTimeout(() => { this._busy = [...this._busy, id]; }, 250);
    // a switch shows where it is going straight away and holds that until Home Assistant has answered; a failure puts it back
    if (hold) this._opt = { ...this._opt, ...hold };
    const release = (ids: string[]): void => { const o = { ...this._opt }; for (const k of ids) if (hold && o[k] === hold[k]) delete o[k]; this._opt = o; };
    try { await run(); if (done) this._tell(done); if (hold) window.setTimeout(() => release(Object.keys(hold)), 1500); }
    catch { if (hold) release(Object.keys(hold)); this._tell(`${name} didn’t respond. Try again`); }
    finally { clearTimeout(t); this._busy = this._busy.filter((x) => x !== id); }
  }
  /** what a switch shows: where a touch has sent it, until Home Assistant catches up */
  private _opt: Record<string, boolean> = {};
  private _on(e: HassEntity): boolean { return this._opt[e.entity_id] ?? ON.has(e.state); }
  protected willUpdate(c: PropertyValues): void {
    // Home Assistant has caught up with a touch: let go of the held state
    if (c.has('hass') && this.hass) { const o = Object.entries(this._opt).filter(([id, on]) => ON.has(this.hass!.states[id]?.state ?? '') !== on); if (o.length !== Object.keys(this._opt).length) this._opt = Object.fromEntries(o); }
  }

  private _toggle(e: HassEntity, room: string): void {
    const d = dom(e), id = e.entity_id, name = this._name(e, room);
    if (gone(e)) { this._tell(`${name} is not responding`); return; }
    if (d === 'media_player') this.dispatchEvent(new CustomEvent('music', { detail: id }));
    // doors are a grown-up's job: the lock and the garage (any cover) both ask for the PIN
    else if (d === 'lock') { const un = e.state === 'locked'; this._guard(() => { void this._call(id, name, () => this.hass!.callService('lock', un ? 'unlock' : 'lock', { entity_id: id }), `${name} ${un ? 'unlocked' : 'locked'}`); }, id, `${un ? 'Unlock' : 'Lock'} ${name}?`); }
    else if (d === 'cover') { const shut = e.state === 'closed' || e.state === 'closing'; this._guard(() => { void this._call(id, name, () => this.hass!.callService('cover', shut ? 'open_cover' : 'close_cover', { entity_id: id }), `${name} ${shut ? 'opening' : 'closing'}`); }, id, `${shut ? 'Open' : 'Close'} ${name}?`); }
    else { const to = !this._on(e); void this._call(id, name, () => this.hass!.callService('homeassistant', 'toggle', { entity_id: id }), undefined, SWITCHED.includes(d) ? { [id]: to } : undefined); }
  }
  private _room(r: Room, on: boolean): void {
    const ids = r.ents.filter((e) => e.entity_id.startsWith('light.') && !gone(e)).map((e) => e.entity_id);
    if (ids.length) void this._call(`room:${r.id}`, `${r.name} lights`, () => this.hass!.callService('light', on ? 'turn_on' : 'turn_off', { entity_id: ids }), undefined, Object.fromEntries(ids.map((id) => [id, on])));
  }
  private _scene(s: HassEntity): void {
    const name: string = s.attributes.friendly_name ?? s.entity_id;
    this._went = ''; requestAnimationFrame(() => { this._went = s.entity_id; });
    void this._call(s.entity_id, name, () => this.hass!.callService('script', 'turn_on', { entity_id: s.entity_id }), `${name} started`);
  }
  /** Grown-ups only. One PIN opens a short window for the quiet things (automations); a door or a cover always asks again unless the window was opened for that same one. */
  private _askWhy = '';
  private _guard(fn: () => void, device = '', why = ''): void {
    if (!this.pin) { this._tell('Set a parent PIN to change this from the panel.'); return; }
    if (Date.now() < this._unlocked && (!device || this._unlockedFor === device)) { fn(); return; }
    this._askFor = device; this._askWhy = why; this._askPin = fn;
  }

  private _name(e: HassEntity, room: string): string {
    const n: string = e.attributes.friendly_name ?? e.entity_id;
    const stripped = n.replace(new RegExp(`^${room.replace(/[^\w ]/g, '.')}\\s*`, 'i'), '');
    return stripped.length > 2 && !/^room\b/i.test(stripped) ? stripped[0].toUpperCase() + stripped.slice(1) : n;
  }
  private _ic(e: HassEntity): TemplateResult {
    const d = dom(e), n = `${e.entity_id} ${e.attributes.friendly_name ?? ''} ${e.attributes.device_class ?? ''}`;
    if (d === 'light') return icon('bulb', 18);
    if (d === 'fan' || /\bfan\b/i.test(n)) return DRAWN.fan;
    if (d === 'lock') return e.state === 'locked' ? DRAWN.locked : DRAWN.unlocked;
    if (d === 'cover') return e.state === 'closed' ? DRAWN.garage : DRAWN.garageOpen;
    if (d === 'media_player') return /tv|television/i.test(n) ? DRAWN.tv : DRAWN.speaker;
    if (d === 'climate') return DRAWN.heat;
    return /light|lamp/i.test(n) ? icon('bulb', 18) : DRAWN.plug;
  }
  private _state(e: HassEntity, on: boolean): string {
    if (gone(e)) return 'Not responding';
    const bri = e.attributes.brightness;
    if (dom(e) === 'light' && on && bri) return `On · ${Math.round((bri / 255) * 100)}%`;
    const s = e.state.replace(/_/g, ' ');
    return s[0].toUpperCase() + s.slice(1);
  }

  private _dev(e: HassEntity, room: string): TemplateResult {
    const d = dom(e), on = this._on(e), off = gone(e), name = this._name(e, room), sw = SWITCHED.includes(d) && !off, pinned = d === 'lock' || d === 'cover';
    return html`<button class="dev tap ${on && d === 'light' ? 'on' : ''} ${off ? 'gone' : ''}" role=${sw ? 'switch' : nothing} aria-checked=${sw ? String(on) : nothing} aria-disabled=${off ? 'true' : nothing}
      aria-label=${sw ? name : `${name}: ${this._state(e, on)}${pinned && !off ? '. Needs the grown-ups’ PIN' : ''}`} ?data-busy=${this._busy.includes(e.entity_id)} aria-busy=${this._busy.includes(e.entity_id) ? 'true' : nothing} @click=${() => this._toggle(e, room)}>
      <span class="dicon">${this._ic(e)}</span><span class="nm"><span class="n">${name}</span><span class="s">${this._state(e, on)}</span></span>
      ${sw ? html`<span class="toggle"></span>` : pinned && !off ? html`<span class="pinned">${DRAWN.locked}</span>` : nothing}</button>`;
  }

  render(): TemplateResult | typeof nothing {
    if (!this.hass) return nothing;
    const h = this.hass, rooms = this._rooms(), shape = getShape();
    const labelled = (id: string): boolean => !!h.entities?.[id]?.labels?.includes('family_hub');
    const scripts = Object.values(h.states).filter((s) => s.entity_id.startsWith('script.') && !this.hideScripts.includes(s.entity_id) && labelled(s.entity_id));
    const autos = Object.values(h.states).filter((s) => s.entity_id.startsWith('automation.') && (this._all || labelled(s.entity_id)));
    const litCount = rooms.reduce((n, r) => n + r.ents.filter((e) => e.entity_id.startsWith('light.') && e.state === 'on').length, 0);
    const lost = rooms.reduce((n, r) => n + r.ents.filter(gone).length, 0);
    const left = Math.max(0, Math.ceil((this._unlocked - Date.now()) / 1000));
    const cols = this._columns(rooms, shape === 'phone' ? 1 : rooms.length > 9 ? 4 : 3);
    return html`
      <section class="glass rooms" aria-label="Rooms">
        <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><h1 class="t-title">Home</h1>
          ${rooms.length ? html`<span class="muted" style="font-size:15px">${litCount ? `${litCount} light${litCount > 1 ? 's' : ''} on` : 'All lights off'} · ${rooms.length} room${rooms.length === 1 ? '' : 's'}${lost ? ` · ${lost} not responding` : ''}</span>` : nothing}</div>
          ${left > 0 ? html`<div class="unl" role="group" aria-label="Unlocked for grown-ups"><span class="ut">${DRAWN.unlocked}<span>Unlocked for grown-ups · <b aria-hidden="true">${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}</b></span></span><button class="pill tap" @click=${() => this._lockNow()}>Lock now</button></div>` : nothing}</div>
        ${rooms.length ? html`<div class="rgrid" data-fits>
          ${cols.map((col) => html`<div class="rcol">${col.map((r) => {
            const lights = r.ents.filter((e) => e.entity_id.startsWith('light.') && !gone(e)), lit = lights.some((e) => this._on(e));
            return html`<div class="room ${lit ? 'lit' : ''}">
              <div class="rh"><h2>${r.name}</h2>${lights.length > 1 ? html`<button class="sw tap" role="switch" aria-label="${r.name} lights" aria-checked=${String(lit)} ?data-busy=${this._busy.includes(`room:${r.id}`)} @click=${() => this._room(r, !lit)}><span>Lights</span><span class="toggle"></span></button>` : nothing}</div>
              ${r.ents.map((e) => this._dev(e, r.name))}
            </div>`; })}</div>`)}
        </div>` : html`<div class="none"><span style="color:var(--accent)">${icon('home', 44)}</span><b>No rooms to show yet</b>
          <span>In Home Assistant, give your lights, switches and other devices an area (Settings, then Areas). Each area with a device in it appears here as a room.</span></div>`}
      </section>
      <div class="side">
        <section class="glass card" aria-label="Scenes">
          <span class="label">Scenes</span>
          ${scripts.length ? html`<div class="scenes">
            ${scripts.map((s) => html`<button class="scene tap ${this._went === s.entity_id ? 'go' : ''}" ?data-busy=${this._busy.includes(s.entity_id)} @click=${() => this._scene(s)}>
              ${/movie|tv/i.test(s.entity_id) ? DRAWN.tv : /bed|night/i.test(s.entity_id) ? icon('moon', 20) : icon('star', 20)}${s.attributes.friendly_name ?? s.entity_id}</button>`)}
          </div>` : html`<span class="muted tipline">No scenes yet. Give a script the label “family_hub” in Home Assistant and it appears here as a button.</span>`}
        </section>
        <section class="glass card" style="flex:1;min-height:0" aria-label="Automations">
          <div style="display:flex;align-items:center"><span class="label" style="flex:1">Automations</span>
            <button class="pill tap grown" @click=${() => { if (this._all) { this._all = false; return; } this._guard(() => { this._all = true; }); }}>${this._all ? 'Hide' : html`${DRAWN.locked}Grown-ups`}</button></div>
          <div class="alist">
            ${autos.length ? autos.map((a) => { const name: string = a.attributes.friendly_name ?? a.entity_id, on = a.state === 'on'; return html`<button class="auto tap" role="switch" aria-checked=${String(on)} ?data-busy=${this._busy.includes(a.entity_id)}
                @click=${() => this._guard(() => { void this._call(a.entity_id, name, () => this.hass!.callService('automation', on ? 'turn_off' : 'turn_on', { entity_id: a.entity_id }), `${name} ${on ? 'off' : 'on'}`); })}><span>${name}</span><span class="toggle"></span></button>`; })
              : html`<span class="muted tipline">Household automations are in the grown-ups section.</span>`}
          </div>
        </section>
      </div>
      ${this._askPin ? html`<fh-pin .pin=${String(this.pin)} reason=${this._askWhy || 'Grown-ups only'} @ok=${() => { const f = this._askPin!; this._askPin = null; this._open(this._askFor); f(); }} @cancel=${() => { this._askPin = null; }}></fh-pin>` : nothing}`;
  }
}
if (!customElements.get('fh-home')) customElements.define('fh-home', FhHome);
