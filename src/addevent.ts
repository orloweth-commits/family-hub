import { LitElement, html, css, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { addDays, fmtDow, startOfDay } from './dates';
import { slotVar, type CalendarConfig, type Hass } from './types';
import { keyboard, keysCss, typeKey } from './keys';
import { getShape, shortNames } from './util';

const TIMES = ['All day', '07:00', '08:00', '09:00', '10:00', '12:00', '15:00', '15:30', '16:00', '17:00', '18:00', '19:00'];
const pad = (n: number): string => String(n).padStart(2, '0');
const local = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const ymd = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Quick-add sheet: type a title, tap a day, a time and a calendar. */
export class FhAddEvent extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, keysCss, css`
    :host { position: absolute; inset: 0; z-index: 25; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); }
    :host([data-phone]) { position: fixed; align-items: flex-start; padding-top: 12px; }
    :host([data-phone]) .box { width: 96%; max-height: 88vh; padding: 14px; }
    :host([data-phone]) .keys { display: none; }
    .box { width: min(1100px, 94%); max-height: 96%; overflow-y: auto; border-radius: 30px; padding: 16px 20px; display: flex; flex-direction: column; gap: 9px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
    .field { flex: 1; height: 54px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: var(--w-semi, 600); color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chips button { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); display: inline-flex; align-items: center; gap: 6px; }
    .chips button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
  `];
  static properties = { hass: { attribute: false }, calendars: { attribute: false }, defaultCal: {}, _t: { state: true }, _day: { state: true }, _time: { state: true }, _dur: { state: true }, _cal: { state: true }, _busy: { state: true }, _err: { state: true }, _caps: { state: true } };
  hass?: Hass;
  calendars: CalendarConfig[] = [];
  defaultCal = '';
  private _t = '';
  private _day = 0;
  private _time = 'All day';
  private _dur = 60;
  private _cal = '';
  private _busy = false;
  private _err = '';
  private _caps = true;

  private _key(k: string): void { [this._t, this._caps] = typeKey(this._t, k, this._caps); }

  private async _save(): Promise<void> {
    const cal = this._cal || this.defaultCal || this.calendars[0]?.entity;
    if (!this._t.trim() || !cal || !this.hass) { this._err = 'Add a title first'; return; }
    const d = addDays(startOfDay(new Date()), this._day);
    const data: Record<string, unknown> = { summary: this._t.trim() };
    if (this._time === 'All day') { data.start_date = ymd(d); data.end_date = ymd(addDays(d, 1)); }
    else {
      const [h, m] = this._time.split(':').map(Number);
      const s = new Date(d); s.setHours(h, m, 0, 0);
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
    return html`<div class="glass box" role="dialog" aria-label="Add to the calendar" @click=${(e: Event) => e.stopPropagation()}>
      <div style="display:flex;gap:10px;align-items:center">
        <h2 class="t-head">Add to the calendar</h2><span style="flex:1"></span>
        <button class="round tap" aria-label="Close" @click=${() => this.dispatchEvent(new CustomEvent('close'))}>${icon('close', 18)}</button></div>
      <div style="display:flex;gap:10px"><input class="field" inputmode=${getShape() === 'phone' ? 'text' : 'none'} aria-label="What’s on" placeholder="What’s on? e.g. Swimming lesson" .value=${this._t} @input=${(e: Event) => { this._t = (e.target as HTMLInputElement).value; }}>
        <button class="pill tap primary" style="height:58px;padding:0 24px;font-size:17px" ?disabled=${this._busy} @click=${() => this._save()}>${this._busy ? 'Adding…' : 'Add'}</button></div>
      ${this._err ? html`<span style="color:#dc2626;font-weight:var(--w-semi, 600)">${this._err}</span>` : ''}
      <div class="chips">${Array.from({ length: 8 }, (_, i) => html`<button class="tap" aria-pressed=${String(this._day === i)} @click=${() => { this._day = i; }}>${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${fmtDow(addDays(today, i))} ${addDays(today, i).getDate()}`}</button>`)}</div>
      <div class="chips">${TIMES.map((t) => html`<button class="tap" aria-pressed=${String(this._time === t)} @click=${() => { this._time = t; }}>${t === 'All day' ? t : new Date(2000, 0, 1, Number(t.slice(0, 2)), Number(t.slice(3))).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase()}</button>`)}
        ${this._time !== 'All day' ? [30, 60, 90, 120].map((m) => html`<button class="tap" aria-pressed=${String(this._dur === m)} @click=${() => { this._dur = m; }}>${m < 60 ? `${m} min` : `${m / 60} hr`}</button>`) : ''}</div>
      <div class="chips">${this.calendars.map((c) => html`<button class="tap" aria-pressed=${String(cal === c.entity)} @click=${() => { this._cal = c.entity; }}><span class="init" style="--c:${slotVar(c.colour)}" aria-hidden="true">${short[c.name ?? c.entity] ?? ''}</span>${c.name ?? c.entity}</button>`)}</div>
      ${keyboard((k) => this._key(k), this._caps, () => { this._caps = !this._caps; }, true)}
    </div>`;
  }
}
if (!customElements.get('fh-add-event')) customElements.define('fh-add-event', FhAddEvent);
