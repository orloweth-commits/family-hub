import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import type { Hass, HassEntity } from './types';
import './pin';

const CONTROL = ['light', 'switch', 'fan', 'cover', 'lock', 'climate', 'media_player', 'input_boolean'];
const ON = new Set(['on', 'open', 'playing', 'unlocked', 'heat', 'cool', 'heat_cool', 'auto', 'dry', 'fan_only', 'paused', 'idle']);

interface Room { id: string; name: string; ents: HassEntity[] }

/** Home: rooms with their devices, scenes (scripts) and automations. */
export class FhHome extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .rooms { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
    .rgrid { flex: 1; min-height: 0; overflow: auto; columns: 3 250px; column-gap: 12px; }
    .room { break-inside: avoid; margin-bottom: 12px; border-radius: 22px; background: var(--chip); padding: 14px; display: flex; flex-direction: column; gap: 10px; transition: box-shadow .5s ease, background .5s ease; }
    .room.lit { background: color-mix(in srgb, #ffd166 22%, var(--chip)); box-shadow: 0 0 0 1px color-mix(in srgb, #ffb703 40%, transparent), 0 10px 30px -10px rgba(255,183,3,.55); }
    .rh { display: flex; align-items: center; gap: 8px; }
    .rh h2 { flex: 1; font-size: 19px; font-weight: 800; }
    .dev { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 14px; background: var(--chip-soft); width: 100%; text-align: left; }
    .dev .ic { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--track); color: var(--ink2); flex-shrink: 0; transition: all .3s; }
    .dev.on .ic { background: #ffd166; color: #7a4b00; box-shadow: 0 0 16px rgba(255,209,102,.8); }
    .dev .n { flex: 1; font-size: 14px; font-weight: 600; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .dev .s { font-size: 12px; color: var(--ink2); font-weight: 600; text-transform: capitalize; }
    .side { width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
    .scenes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .scene { height: 64px; border-radius: 16px; background: var(--chip); display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 0 12px; font-size: 14px; font-weight: 700; text-align: left; }
    .scene.go { animation: go .8s ease; }
    @keyframes go { 30% { background: var(--primary); color: var(--on-primary); transform: scale(1.04); } }
    .auto { display: flex; align-items: center; gap: 10px; padding: 8px 4px; font-size: 14px; font-weight: 600; }
    .sw { width: 50px; height: 30px; border-radius: 15px; background: var(--track); position: relative; flex-shrink: 0; transition: background .25s; }
    .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 24px; height: 24px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,.2); transition: transform .25s cubic-bezier(.2,1.4,.4,1); }
    .sw[aria-checked='true'] { background: var(--ok); }
    .sw[aria-checked='true']::after { transform: translateX(20px); }
    .alist { flex: 1; min-height: 0; overflow: auto; }
  `];

  static properties = { hass: { attribute: false }, pin: {}, hideScripts: { attribute: false }, hide: { attribute: false }, _unlocked: { state: true }, _askPin: { state: true }, _went: { state: true }, _all: { state: true } };
  hass?: Hass;
  pin = '';
  hideScripts: string[] = [];
  hide: string[] = [];
  private _all = false;
  private _unlocked = 0;
  private _askPin: (() => void) | null = null;
  private _went = '';

  private _rooms(): Room[] {
    const h = this.hass!;
    const areas = Object.values(h.areas ?? {}).sort((a, b) => a.name.localeCompare(b.name));
    const by = new Map<string, HassEntity[]>();
    for (const [id, reg] of Object.entries(h.entities ?? {})) {
      const dom = id.split('.')[0];
      if (!CONTROL.includes(dom) || reg.hidden || reg.entity_category || this.hide.includes(id)) continue;
      const st = h.states[id];
      if (!st || st.state === 'unavailable') continue;
      const area = reg.area_id ?? (reg.device_id ? h.devices?.[reg.device_id]?.area_id : null);
      if (!area) continue;
      by.set(area, [...(by.get(area) ?? []), st]);
    }
    return areas.map((a) => ({ id: a.area_id, name: a.name, ents: (by.get(a.area_id) ?? []).sort((x, y) => x.entity_id.localeCompare(y.entity_id)) })).filter((r) => r.ents.length);
  }

  private _toggle(e: HassEntity): void {
    const dom = e.entity_id.split('.')[0];
    if (dom === 'media_player') this.dispatchEvent(new CustomEvent('music', { detail: e.entity_id }));
    else if (dom === 'lock') this._guard(() => this.hass!.callService('lock', e.state === 'locked' ? 'unlock' : 'lock', { entity_id: e.entity_id }));
    else this.hass!.callService('homeassistant', 'toggle', { entity_id: e.entity_id });
  }
  private _room(r: Room, on: boolean): void {
    const ids = r.ents.filter((e) => e.entity_id.startsWith('light.')).map((e) => e.entity_id);
    if (ids.length) this.hass!.callService('light', on ? 'turn_on' : 'turn_off', { entity_id: ids });
  }
  private _guard(fn: () => void): void {
    if (!this.pin) { this.dispatchEvent(new CustomEvent('say', { detail: 'Set a parent PIN to change this from the panel.' })); return; }
    if (Date.now() < this._unlocked) { fn(); return; }
    this._askPin = fn;
  }

  private _name(e: HassEntity, room: string): string {
    const n: string = e.attributes.friendly_name ?? e.entity_id;
    const stripped = n.replace(new RegExp(`^${room.replace(/[^\w ]/g, '.')}\\s*`, 'i'), '');
    return stripped.length > 2 && !/^room\b/i.test(stripped) ? stripped : n;
  }
  private _ic(e: HassEntity): string {
    const d = e.entity_id.split('.')[0];
    return d === 'light' ? 'bulb' : d === 'media_player' ? 'music' : d === 'lock' ? 'home' : d === 'switch' ? 'bulb' : 'home';
  }

  render(): TemplateResult | typeof nothing {
    if (!this.hass) return nothing;
    const h = this.hass, rooms = this._rooms();
    const labelled = (id: string): boolean => !!h.entities?.[id]?.labels?.includes('family_hub');
    const scripts = Object.values(h.states).filter((s) => s.entity_id.startsWith('script.') && !this.hideScripts.includes(s.entity_id) && labelled(s.entity_id));
    const autos = Object.values(h.states).filter((s) => s.entity_id.startsWith('automation.') && (this._all || labelled(s.entity_id)));
    const litCount = rooms.reduce((n, r) => n + r.ents.filter((e) => e.entity_id.startsWith('light.') && e.state === 'on').length, 0);
    return html`
      <section class="glass rooms" aria-label="Rooms">
        <div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><h1 style="font-size:26px;font-weight:800">Home</h1>
          <span class="muted" style="font-size:13px">${litCount ? `${litCount} light${litCount > 1 ? 's' : ''} on` : 'All lights off'} · ${rooms.length} rooms</span></div></div>
        <div class="rgrid">
          ${rooms.map((r) => {
            const lights = r.ents.filter((e) => e.entity_id.startsWith('light.')), lit = lights.some((e) => e.state === 'on');
            return html`<div class="room ${lit ? 'lit' : ''}">
              <div class="rh"><h2>${r.name}</h2>${lights.length ? html`<button class="sw tap" role="switch" aria-label="${r.name} lights" aria-checked=${String(lit)} @click=${() => this._room(r, !lit)}></button>` : nothing}</div>
              ${r.ents.map((e) => {
                const on = ON.has(e.state), bri = e.attributes.brightness;
                return html`<button class="dev tap ${on && e.entity_id.startsWith('light.') ? 'on' : ''}" @click=${() => this._toggle(e)}>
                  <span class="ic">${icon(this._ic(e), 18)}</span><span class="n">${this._name(e, r.name)}</span>
                  <span class="s">${e.entity_id.startsWith('light.') && on && bri ? `${Math.round((bri / 255) * 100)}%` : e.state.replace(/_/g, ' ')}</span></button>`;
              })}
            </div>`;
          })}
        </div>
      </section>
      <div class="side">
        <section class="glass card" aria-label="Scenes">
          <span class="label">Scenes</span>
          <div class="scenes">
            <button class="scene tap ${this._went === 'on' ? 'go' : ''}" @click=${() => { this.hass!.callService('light', 'turn_on', { entity_id: 'all' }); this._went = 'on'; }}>${icon('bulb', 20)}All on</button>
            <button class="scene tap ${this._went === 'off' ? 'go' : ''}" @click=${() => { this.hass!.callService('light', 'turn_off', { entity_id: 'all' }); this._went = 'off'; }}>${icon('bulbOff', 20)}All off</button>
            ${scripts.map((s) => html`<button class="scene tap ${this._went === s.entity_id ? 'go' : ''}" @click=${() => { this.hass!.callService('script', 'turn_on', { entity_id: s.entity_id }); this._went = s.entity_id; }}>
              ${/movie|tv/i.test(s.entity_id) ? html`<span style="font-size:20px">🍿</span>` : /bed|night/i.test(s.entity_id) ? icon('moon', 20) : icon('star', 20)}${s.attributes.friendly_name ?? s.entity_id}</button>`)}
          </div>
        </section>
        <section class="glass card" style="flex:1;min-height:0" aria-label="Automations">
          <div style="display:flex;align-items:center"><span class="label" style="flex:1">Automations</span>
            <button class="pill tap" style="height:34px;font-size:13px" @click=${() => { if (this._all) { this._all = false; return; } this._guard(() => { this._all = true; }); }}>${this._all ? 'Hide' : '🔒 Grown-ups'}</button></div>
          <div class="alist">
            ${autos.length ? autos.map((a) => html`<div class="auto"><span style="flex:1">${a.attributes.friendly_name ?? a.entity_id}</span>
              <button class="sw tap" role="switch" aria-label=${a.attributes.friendly_name ?? a.entity_id} aria-checked=${String(a.state === 'on')}
                @click=${() => this._guard(() => this.hass!.callService('automation', a.state === 'on' ? 'turn_off' : 'turn_on', { entity_id: a.entity_id }))}></button></div>`)
              : html`<span class="muted" style="font-size:14px">Household automations are in the grown-ups section.</span>`}
          </div>
        </section>
      </div>
      ${this._askPin ? html`<fh-pin .pin=${String(this.pin)} @ok=${() => { const f = this._askPin!; this._askPin = null; this._unlocked = Date.now() + 5 * 60_000; f(); }} @cancel=${() => { this._askPin = null; }}></fh-pin>` : nothing}`;
  }
}
if (!customElements.get('fh-home')) customElements.define('fh-home', FhHome);
