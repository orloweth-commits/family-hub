import { LitElement, html, css, nothing, type TemplateResult, type PropertyValues } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { addDays, fmtDow, startOfDay } from './dates';
import { slotVar, type CalendarConfig, type Hass } from './types';
import { keyboard, keysCss, typeKey } from './keys';
import { getShape, shortNames, sfx } from './util';

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], ROW = 44;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const STATES: Record<string, string> = { 'Western Australia': 'WA', 'New South Wales': 'NSW', Victoria: 'VIC', Queensland: 'QLD', 'South Australia': 'SA', Tasmania: 'TAS', 'Northern Territory': 'NT', 'Australian Capital Territory': 'ACT' };
const pad = (n: number): string => String(n).padStart(2, '0');
const local = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const ymd = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const same = (a: Date, b: Date): boolean => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface Place { name: string; detail: string }

/** Add to the calendar: what, where, which day, what time, whose calendar. */
export class FhAddEvent extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, keysCss, css`
    :host { position: absolute; inset: 0; z-index: 25; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); }
    :host([data-phone]) { position: fixed; align-items: flex-start; padding-top: 12px; }
    :host([data-phone]) .box { width: 96%; max-height: 88vh; padding: 14px; }
    :host([data-phone]) .keys { display: none; }
    :host([data-phone]) .when { flex-direction: column; }
    .box { width: min(1100px, 94%); max-height: 96%; overflow-y: auto; border-radius: 30px; padding: 16px 20px; display: flex; flex-direction: column; gap: 9px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; position: relative; }
    .field { flex: 1; min-width: 0; height: 54px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: var(--w-semi, 600); color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--ink2) 30%, transparent); }
    .field.on { box-shadow: inset 0 0 0 3px var(--primary); }
    .field.where { height: 48px; font-size: 19px; }
    .wherebox { position: relative; display: flex; align-items: center; gap: 8px; min-width: 0; }
    .wherebox > .pin { font-size: 24px; line-height: 1; width: 30px; text-align: center; }
    .places { position: absolute; left: 38px; right: 0; top: 52px; z-index: 5; border-radius: 16px; padding: 6px; display: flex; flex-direction: column; gap: 2px; background: var(--sheet-bg, var(--chip-strong)); box-shadow: 0 14px 34px rgba(0,0,0,.28); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); }
    .places button { min-height: 44px; padding: 5px 12px; border-radius: 12px; text-align: left; display: flex; flex-direction: column; justify-content: center; font-size: 16px; font-weight: var(--w-bold, 700); }
    .places button small { font-size: 13px; font-weight: var(--w-semi, 600); color: var(--ink2); }
    .places .note { font-size: 12px; color: var(--ink2); padding: 2px 12px 4px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .chips button { height: 44px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); display: inline-flex; align-items: center; gap: 6px; }
    .chips button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .chips button.calbtn { width: 48px; padding: 0; justify-content: center; background: var(--chip-strong); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 45%, transparent); }
    .when { display: flex; gap: 16px; align-items: stretch; }
    .when > .left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 9px; justify-content: center; }
    .sub { font-size: 12px; font-weight: var(--w-heavy, 800); letter-spacing: .06em; text-transform: uppercase; color: var(--ink2); }

    /* the time dial: two drums that spin, and am / pm beside them */
    .dialbox { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 22px; background: var(--chip); }
    .dialbox[data-off] .drums, .dialbox[data-off] .ampm, .dialbox[data-off] .durs { opacity: .3; pointer-events: none; }
    .drums { position: relative; display: flex; align-items: center; gap: 2px; height: ${ROW * 3}px; border-radius: 16px; background: var(--chip-strong); padding: 0 8px; box-shadow: inset 0 2px 8px rgba(0,0,0,.14); }
    .drums::before { content: ''; position: absolute; left: 6px; right: 6px; top: ${ROW}px; height: ${ROW}px; border-radius: 10px; background: color-mix(in srgb, var(--primary) 16%, transparent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 55%, transparent); pointer-events: none; }
    .drum { position: relative; width: 64px; height: 100%; overflow-y: scroll; scroll-snap-type: y mandatory; scrollbar-width: none; overscroll-behavior: contain; touch-action: pan-y; -webkit-mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); outline: none; }
    .drum::-webkit-scrollbar { display: none; }
    .drum:focus-visible { box-shadow: inset 0 0 0 2px var(--primary); border-radius: 10px; }
    .drum i { display: flex; align-items: center; justify-content: center; height: ${ROW}px; scroll-snap-align: center; font-style: normal; font-size: 30px; font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; color: var(--ink2); }
    .drum i[data-on] { color: var(--ink); }
    .drum::before, .drum::after { content: ''; display: block; height: ${ROW}px; }
    .colon { font-size: 30px; font-weight: 800; padding-bottom: 4px; }
    .ampm { display: flex; flex-direction: column; gap: 6px; }
    .ampm button { width: 60px; height: 44px; border-radius: 12px; background: var(--chip-strong); font-size: 16px; font-weight: var(--w-bold, 700); }
    .ampm button[aria-pressed='true'], .allday[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .side { display: flex; flex-direction: column; gap: 6px; }
    .allday { height: 44px; padding: 0 14px; border-radius: 12px; background: var(--chip-strong); font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; }
    .durs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .durs button { height: 40px; min-width: 62px; border-radius: 10px; background: var(--chip-strong); font-size: 14px; font-weight: var(--w-semi, 600); }
    .durs button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }

    /* the calendar that opens from the end of the day row */
    .month { position: absolute; z-index: 6; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 430px; max-width: 94%; border-radius: 24px; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: var(--sheet-bg, var(--chip-strong)); box-shadow: 0 20px 50px rgba(0,0,0,.35); -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px); }
    .mnav { display: flex; align-items: center; gap: 6px; }
    .mnav b { flex: 1; text-align: center; font-size: 19px; font-weight: var(--w-heavy, 800); }
    .mnav button { width: 44px; height: 44px; border-radius: 50%; background: var(--chip); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; }
    .mgrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
    .mgrid span { font-size: 12px; font-weight: 800; color: var(--ink2); padding: 2px 0; }
    .mgrid button { height: 44px; border-radius: 12px; font-size: 16px; font-weight: var(--w-semi, 600); font-variant-numeric: tabular-nums; }
    .mgrid button.td { box-shadow: inset 0 0 0 2px var(--accent); }
    .mgrid button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .mgrid button:disabled { opacity: .3; }
    .veil { position: absolute; inset: 0; z-index: 5; border-radius: inherit; background: rgba(0,0,0,.18); }
  `];
  static properties = { hass: { attribute: false }, calendars: { attribute: false }, defaultCal: {}, places: { type: Boolean }, _t: { state: true }, _loc: { state: true }, _in: { state: true }, _found: { state: true }, _date: { state: true }, _all: { state: true }, _h: { state: true }, _m: { state: true }, _pm: { state: true }, _dur: { state: true }, _cal: { state: true }, _busy: { state: true }, _err: { state: true }, _caps: { state: true }, _pick: { state: true }, _shown: { state: true } };
  hass?: Hass;
  calendars: CalendarConfig[] = [];
  defaultCal = '';
  /** look addresses up on the internet as they are typed (on unless turned off) */
  places = true;
  private _t = '';
  private _loc = '';
  private _in: 'what' | 'where' = 'what';
  private _found: Place[] | null = null;
  private _date = startOfDay(new Date());
  private _all = false;
  private _h = 9;
  private _m = 0;
  private _pm = false;
  private _dur = 60;
  private _cal = '';
  private _busy = false;
  private _err = '';
  private _caps = true;
  private _pick = false;
  private _shown = new Date();
  private _seek?: number;
  private _seekGen = 0;
  private _spin: Record<string, number> = {};

  connectedCallback(): void {
    super.connectedCallback();
    // start at the next whole hour: the likeliest time for something being added now
    const n = new Date(), h = (n.getHours() + 1) % 24;
    this._pm = h >= 12; this._h = h % 12 || 12; this._m = 0;
    if (h === 0) this._date = addDays(startOfDay(n), 1);
  }

  private _key(k: string): void {
    if (this._in === 'where') { [this._loc] = typeKey(this._loc, k, !this._loc.length || /\s$/.test(this._loc) ? true : false); this._lookUp(); }
    else [this._t, this._caps] = typeKey(this._t, k, this._caps);
  }

  /* ---------------- where ---------------- */

  /** Places Home Assistant already knows (zones such as school or work): offered before anything is typed. */
  private _zones(): Place[] {
    return Object.values(this.hass?.states ?? {}).filter((e) => e.entity_id.startsWith('zone.') && e.entity_id !== 'zone.home' && e.attributes.friendly_name && !e.attributes.passive)
      .map((e) => ({ name: String(e.attributes.friendly_name), detail: 'Saved place' })).slice(0, 5);
  }
  private _lookUp(): void {
    clearTimeout(this._seek);
    const q = this._loc.trim(), gen = ++this._seekGen;
    if (!this.places || q.length < 3) { this._found = null; return; }
    this._seek = window.setTimeout(async () => {
      try {
        // Australia only, nearest first. The centre is rounded to a tenth of a degree so the address of the house is not sent.
        const lat = this.hass?.config?.latitude, lon = this.hass?.config?.longitude;
        const u = new URLSearchParams({ q, limit: '5', lang: 'en', bbox: '112,-44,154,-10' });
        if (lat !== undefined && lon !== undefined) { u.set('lat', String(Math.round(lat * 10) / 10)); u.set('lon', String(Math.round(lon * 10) / 10)); }
        const j = await (await fetch(`https://photon.komoot.io/api/?${u}`)).json();
        if (gen !== this._seekGen) return;
        const seen = new Set<string>();
        this._found = ((j?.features ?? []) as { properties: Record<string, string> }[]).map(({ properties: p }) => {
          const street = [p.housenumber, p.street].filter(Boolean).join(' ');
          const name = p.name || street || p.city || '';
          const rest = [p.name && street ? street : '', p.district || p.locality || p.city, [STATES[p.state] ?? p.state, p.postcode].filter(Boolean).join(' ')].filter((x) => x && x !== name);
          return { name, detail: [...new Set(rest)].join(', ') };
        }).filter((x) => x.name && !seen.has(`${x.name}|${x.detail}`) && seen.add(`${x.name}|${x.detail}`));
      } catch { if (gen === this._seekGen) this._found = null; }
    }, 380);
  }
  private _choose(p: Place): void {
    sfx('tap');
    this._loc = p.detail && p.detail !== 'Saved place' ? `${p.name}, ${p.detail}` : p.name;
    this._found = null; this._seekGen++; this._in = 'what';
  }

  /* ---------------- when ---------------- */

  private _hour24(): number { return (this._h % 12) + (this._pm ? 12 : 0); }
  private _setDrum(which: 'h' | 'm', i: number): void {
    if (which === 'h') this._h = HOURS[Math.max(0, Math.min(HOURS.length - 1, i))]; else this._m = MINS[Math.max(0, Math.min(MINS.length - 1, i))];
  }
  private _scrolled(which: 'h' | 'm', e: Event): void {
    const el = e.currentTarget as HTMLElement;
    clearTimeout(this._spin[which]);
    this._spin[which] = window.setTimeout(() => { this._spin[which] = 0; this._setDrum(which, Math.round(el.scrollTop / ROW)); }, 90);
  }
  private _nudge(which: 'h' | 'm', d: number, e?: KeyboardEvent): void {
    e?.preventDefault();
    const list = which === 'h' ? HOURS : MINS, cur = list.indexOf(which === 'h' ? this._h : this._m);
    this._setDrum(which, (cur + d + list.length) % list.length);
  }
  protected updated(_ch: PropertyValues): void {
    // keep each drum resting on its value (unless a finger is spinning it)
    for (const [which, list, v] of [['h', HOURS, this._h], ['m', MINS, this._m]] as const) {
      const el = this.renderRoot.querySelector<HTMLElement>(`.drum[data-d='${which}']`);
      if (!el || this._spin[which]) continue;
      const top = list.indexOf(v as never) * ROW;
      if (Math.abs(el.scrollTop - top) > 1) el.scrollTo({ top, behavior: el.dataset.set ? 'smooth' : 'auto' });
      el.dataset.set = '1';
    }
  }
  private _drum(which: 'h' | 'm'): TemplateResult {
    const list = which === 'h' ? HOURS : MINS, v = which === 'h' ? this._h : this._m, label = which === 'h' ? 'Hour' : 'Minutes';
    return html`<div class="drum" data-d=${which} tabindex="0" role="spinbutton" aria-label=${label} aria-valuenow=${v} aria-valuetext=${which === 'h' ? String(v) : pad(v)} aria-valuemin=${list[0]} aria-valuemax=${list[list.length - 1]}
      @scroll=${(e: Event) => this._scrolled(which, e)} @keydown=${(e: KeyboardEvent) => { if (e.key === 'ArrowUp') this._nudge(which, -1, e); else if (e.key === 'ArrowDown') this._nudge(which, 1, e); }}>
      ${list.map((n, i) => html`<i ?data-on=${n === v} @click=${() => { sfx('tap'); this._setDrum(which, i); }}>${which === 'h' ? n : pad(n)}</i>`)}</div>`;
  }

  private _monthGrid(): TemplateResult {
    const today = startOfDay(new Date()), y = this._shown.getFullYear(), m = this._shown.getMonth();
    const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    const go = (dy: number, dm: number) => { this._shown = new Date(y + dy, m + dm, 1); };
    return html`<div class="veil" @click=${() => { this._pick = false; }}></div>
      <div class="month" role="dialog" aria-label="Pick a date">
        <div class="mnav">
          <button class="tap" aria-label="Year before" @click=${() => go(-1, 0)}>«</button><button class="tap" aria-label="Month before" @click=${() => go(0, -1)}>${icon('left', 18)}</button>
          <b aria-live="polite">${MONTHS[m]} ${y}</b>
          <button class="tap" aria-label="Month after" @click=${() => go(0, 1)}>${icon('right', 18)}</button><button class="tap" aria-label="Year after" @click=${() => go(1, 0)}>»</button>
        </div>
        <div class="mgrid">
          ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => html`<span aria-hidden="true">${d}</span>`)}
          ${Array.from({ length: lead }, () => html`<span></span>`)}
          ${Array.from({ length: days }, (_, i) => { const d = new Date(y, m, i + 1); return html`<button class="tap ${same(d, today) ? 'td' : ''}" ?disabled=${d < today} aria-pressed=${String(same(d, this._date))} aria-label=${d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} @click=${() => { sfx('tap'); this._date = d; this._pick = false; }}>${i + 1}</button>`; })}
        </div>
      </div>`;
  }

  private async _save(): Promise<void> {
    const cal = this._cal || this.defaultCal || this.calendars[0]?.entity;
    if (!this._t.trim() || !cal || !this.hass) { this._err = 'Add a title first'; return; }
    const d = this._date;
    const data: Record<string, unknown> = { summary: this._t.trim() };
    if (this._loc.trim()) data.location = this._loc.trim();
    if (this._all) { data.start_date = ymd(d); data.end_date = ymd(addDays(d, 1)); }
    else {
      const s = new Date(d); s.setHours(this._hour24(), this._m, 0, 0);
      data.start_date_time = local(s); data.end_date_time = local(new Date(s.getTime() + this._dur * 60_000));
    }
    this._busy = true; this._err = '';
    try {
      await this.hass.callService('calendar', 'create_event', data, { entity_id: cal });
      this.dispatchEvent(new CustomEvent('saved', { detail: this._t.trim() }));
    } catch (e: any) { this._err = `Couldn’t add it: ${e?.message ?? 'error'}`; }
    finally { this._busy = false; }
  }

  render(): TemplateResult {
    const today = startOfDay(new Date());
    const cal = this._cal || this.defaultCal || this.calendars[0]?.entity;
    const short = shortNames(this.calendars.map((c) => c.name ?? c.entity));
    const phone = getShape() === 'phone', far = !Array.from({ length: 7 }, (_, i) => addDays(today, i)).some((d) => same(d, this._date));
    const list = this._in === 'where' ? (this._found ?? (this._loc.trim().length < 3 ? this._zones() : [])) : [];
    return html`<div class="glass box" role="dialog" aria-label="Add to the calendar" @click=${(e: Event) => e.stopPropagation()}>
      <div style="display:flex;gap:10px;align-items:center">
        <h2 class="t-head">Add to the calendar</h2><span style="flex:1"></span>
        <button class="round tap" aria-label="Close" @click=${() => this.dispatchEvent(new CustomEvent('close'))}>${icon('close', 18)}</button></div>
      <div style="display:flex;gap:10px"><input class="field ${this._in === 'what' ? 'on' : ''}" inputmode=${phone ? 'text' : 'none'} aria-label="What’s on" placeholder="What’s on? e.g. Swimming lesson" .value=${this._t} @focus=${() => { this._in = 'what'; }} @input=${(e: Event) => { this._t = (e.target as HTMLInputElement).value; }}>
        <button class="tap lead" style="height:60px;padding:0 26px;font-size:18px" ?disabled=${this._busy} @click=${() => this._save()}>${this._busy ? 'Adding…' : 'Add'}</button></div>
      ${this._err ? html`<span style="color:var(--danger, #dc2626);font-weight:var(--w-semi, 600)">${this._err}</span>` : ''}
      <div class="wherebox"><span class="pin" aria-hidden="true">📍</span>
        <input class="field where ${this._in === 'where' ? 'on' : ''}" inputmode=${phone ? 'text' : 'none'} aria-label="Where" placeholder="Where? Type a place or an address (optional)" .value=${this._loc}
          @focus=${() => { this._in = 'where'; }} @input=${(e: Event) => { this._loc = (e.target as HTMLInputElement).value; this._lookUp(); }}>
        ${list.length ? html`<div class="places" role="listbox" aria-label="Places">
          ${list.map((p) => html`<button class="tap" role="option" aria-selected="false" @click=${() => this._choose(p)}>${p.name}${p.detail ? html`<small>${p.detail}</small>` : nothing}</button>`)}
          ${this._found ? html`<span class="note">Places: © OpenStreetMap contributors, found by Photon</span>` : nothing}
        </div>` : nothing}
      </div>
      <div class="when">
        <div class="left">
          <span class="sub">Which day</span>
          <div class="chips days">
            ${Array.from({ length: 7 }, (_, i) => { const d = addDays(today, i); return html`<button class="tap" aria-pressed=${String(same(d, this._date))} @click=${() => { this._date = d; }}>${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${fmtDow(d)} ${d.getDate()}`}</button>`; })}
            ${far ? html`<button class="tap" aria-pressed="true" @click=${() => { this._shown = this._date; this._pick = true; }}>${this._date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: this._date.getFullYear() === today.getFullYear() ? undefined : 'numeric' })}</button>` : nothing}
            <button class="tap calbtn" aria-label="Pick another date" aria-haspopup="dialog" @click=${() => { this._shown = this._date; this._pick = true; }}>${icon('calendar', 22)}</button>
          </div>
          <span class="sub">Whose calendar</span>
          <div class="chips">${this.calendars.map((c) => html`<button class="tap" aria-pressed=${String(cal === c.entity)} @click=${() => { this._cal = c.entity; }}><span class="init" style="--c:${slotVar(c.colour)}" aria-hidden="true">${short[c.name ?? c.entity] ?? ''}</span>${c.name ?? c.entity}</button>`)}</div>
        </div>
        <div class="dialbox" ?data-off=${this._all} role="group" aria-label="What time">
          <div class="drums">${this._drum('h')}<span class="colon" aria-hidden="true">:</span>${this._drum('m')}</div>
          <div class="ampm" role="group" aria-label="Morning or afternoon">
            <button class="tap" aria-pressed=${String(!this._pm)} @click=${() => { sfx('tap'); this._pm = false; }}>am</button>
            <button class="tap" aria-pressed=${String(this._pm)} @click=${() => { sfx('tap'); this._pm = true; }}>pm</button>
          </div>
          <div class="side">
            <button class="tap allday" aria-pressed=${String(this._all)} @click=${() => { sfx('tap'); this._all = !this._all; }}>All day</button>
            <div class="durs" role="group" aria-label="How long">${[30, 60, 90, 120].map((m) => html`<button class="tap" aria-pressed=${String(this._dur === m)} @click=${() => { this._dur = m; }}>${m < 60 ? `${m} min` : `${m / 60} hr`}</button>`)}</div>
          </div>
        </div>
      </div>
      ${keyboard((k) => this._key(k), this._in === 'where' ? !this._loc.length || /\s$/.test(this._loc) : this._caps, () => { this._caps = !this._caps; }, true, true)}
      ${this._pick ? this._monthGrid() : nothing}
    </div>`;
  }
}
if (!customElements.get('fh-add-event')) customElements.define('fh-add-event', FhAddEvent);
