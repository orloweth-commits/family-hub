import { LitElement, html, css, type TemplateResult } from 'lit';
import { styles } from './styles';
import { icon } from './icons';
import { addDays, fmtDow, startOfDay } from './dates';
import { slotVar, type CalendarConfig, type Hass } from './types';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const TIMES = ['All day', '07:00', '08:00', '09:00', '10:00', '12:00', '15:00', '15:30', '16:00', '17:00', '18:00', '19:00'];
const pad = (n: number): string => String(n).padStart(2, '0');
const local = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
const ymd = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Quick-add sheet: type a title, tap a day, a time and a calendar. */
export class FhAddEvent extends LitElement {
  static styles = [styles, css`
    :host { position: absolute; inset: 0; z-index: 25; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.3); }
    .box { width: min(1100px, 94%); max-height: 96%; overflow-y: auto; border-radius: 30px; padding: 16px 20px; display: flex; flex-direction: column; gap: 9px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
    .field { flex: 1; height: 54px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: 600; color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chips button { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
    .chips button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .row { display: flex; gap: 6px; justify-content: center; }
    .key { width: 56px; height: 48px; border-radius: 12px; background: var(--chip-strong); box-shadow: 0 2px 0 rgba(0,0,0,.12); font-size: 22px; font-weight: 500; }
    .key:active { transform: scale(.92); }
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

  private _key(k: string): void {
    if (k === 'del') { this._t = this._t.slice(0, -1); this._caps = !this._t.length; return; }
    if (k === ' ') { this._t += ' '; return; }
    this._t += this._caps ? k.toUpperCase() : k;
    this._caps = false;
  }

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
    return html`<div class="glass box" role="dialog" aria-label="Add to the calendar" @click=${(e: Event) => e.stopPropagation()}>
      <div style="display:flex;gap:10px;align-items:center">
        <h2 style="font-size:24px;font-weight:800">Add to the calendar</h2><span style="flex:1"></span>
        <button class="round tap" aria-label="Close" @click=${() => this.dispatchEvent(new CustomEvent('close'))}>${icon('close', 18)}</button></div>
      <div style="display:flex;gap:10px"><input class="field" inputmode="none" placeholder="What’s on? e.g. Swimming lesson" .value=${this._t} @input=${(e: Event) => { this._t = (e.target as HTMLInputElement).value; }}>
        <button class="pill tap primary" style="height:58px;padding:0 24px;font-size:17px" ?disabled=${this._busy} @click=${() => this._save()}>${this._busy ? 'Adding…' : 'Add'}</button></div>
      ${this._err ? html`<span style="color:#dc2626;font-weight:600">${this._err}</span>` : ''}
      <div class="chips">${Array.from({ length: 8 }, (_, i) => html`<button class="tap" aria-pressed=${String(this._day === i)} @click=${() => { this._day = i; }}>${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${fmtDow(addDays(today, i))} ${addDays(today, i).getDate()}`}</button>`)}</div>
      <div class="chips">${TIMES.map((t) => html`<button class="tap" aria-pressed=${String(this._time === t)} @click=${() => { this._time = t; }}>${t === 'All day' ? t : new Date(2000, 0, 1, Number(t.slice(0, 2)), Number(t.slice(3))).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase()}</button>`)}
        ${this._time !== 'All day' ? [30, 60, 90, 120].map((m) => html`<button class="tap" aria-pressed=${String(this._dur === m)} @click=${() => { this._dur = m; }}>${m < 60 ? `${m} min` : `${m / 60} hr`}</button>`) : ''}</div>
      <div class="chips">${this.calendars.map((c) => html`<button class="tap" aria-pressed=${String(cal === c.entity)} @click=${() => { this._cal = c.entity; }}><span class="dot" style="background:${slotVar(c.colour)}"></span>${c.name ?? c.entity}</button>`)}</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${ROWS.map((r, i) => html`<div class="row">${i === 2 ? html`<button class="key tap" style="width:84px;font-size:16px" @click=${() => { this._caps = !this._caps; }}>${this._caps ? '⇧ ABC' : '⇧ abc'}</button>` : ''}${[...r].map((k) => html`<button class="key tap" @click=${() => this._key(k)}>${this._caps ? k.toUpperCase() : k}</button>`)}${i === 2 ? html`<button class="key tap" style="width:84px" aria-label="Delete" @click=${() => this._key('del')}>⌫</button>` : ''}</div>`)}
        <div class="row"><button class="key tap" style="width:420px;font-size:16px" @click=${() => this._key(' ')}>space</button></div>
      </div>
    </div>`;
  }
}
if (!customElements.get('fh-add-event')) customElements.define('fh-add-event', FhAddEvent);
