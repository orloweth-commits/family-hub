import { LitElement, html, css, nothing, type TemplateResult, type PropertyValues } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { addDays, fmtDow, startOfDay } from './dates';
import { slotVar, type CalEvent, type CalendarConfig, type Hass } from './types';
import { keyboard, keysCss, typeKey } from './keys';
import { getShape, shortNames, sfx } from './util';
import { DAY_LETTERS, DAY_NAMES, dow, fromRRule, presets, repeatWords, toRRule, type Freq, type Repeat } from './repeat';

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
    /* the same scrim as every sheet. It never overlaps the dock; it sits under the header when there is room for that (data-under) */
    :host { position: absolute; inset: 0; z-index: 25; display: flex; align-items: center; justify-content: center; padding: var(--pad-y, 12px) var(--pad-x, 12px) var(--bot, 122px); background: var(--scrim, rgba(6,16,28,.52)); }
    :host([data-under]) { padding-top: var(--top, 110px); }
    :host([data-phone]) { position: fixed; align-items: flex-start; padding: 12px 10px calc(84px + env(safe-area-inset-bottom, 0px)); }
    :host([data-phone]) .box { width: 100%; padding: 14px 14px 0; }
    :host([data-phone]) .keys, :host([data-keys='off']) .keys { display: none; }
    :host([data-phone]) .when { flex-direction: column; }
    :host([data-phone]) .dialbox { flex-wrap: wrap; justify-content: center; }
    :host([data-phone]) .side { flex: 1 1 100%; flex-direction: row; }
    :host([data-phone]) .durs { flex: 1; grid-template-columns: repeat(auto-fit, minmax(74px, 1fr)); }
    :host([data-phone]) .durs button { min-width: 0; font-size: var(--fs-1); padding: 0 2px; }
    :host([data-phone]) .sum { display: none; }
    :host([data-phone]) .afoot { position: sticky; bottom: 0; z-index: 4; display: flex; flex-direction: column; gap: 6px; margin: 0 -14px; padding: 10px 14px 14px; background: var(--foot-bg, var(--chip-strong)); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); box-shadow: 0 -8px 18px rgba(0,0,0,.14); }
    :host([data-phone]) .afoot .sum { display: block; text-align: left; white-space: normal; }
    .box { width: min(1000px, 100%); max-height: 100%; overflow-y: auto; overscroll-behavior: contain; border-radius: 30px; padding: 14px 20px 16px; display: flex; flex-direction: column; gap: 9px; animation: sheet var(--m-3, 240ms) var(--e-spring, ease) backwards; position: relative; }
    :host { animation: scrimin var(--m-2, 160ms) var(--e-out, ease) backwards; }
    :host([data-closing]) { animation: fhout var(--m-2, 160ms) var(--e-in, ease-in) forwards; pointer-events: none; }
    .box > * { flex-shrink: 0; }
    .sum { flex: 1; min-width: 0; text-align: right; font-size: var(--fs-2); font-weight: var(--w-semi, 600); color: var(--ink2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .err { color: var(--danger, #dc2626); font-size: var(--fs-2); font-weight: var(--w-semi, 600); } .err:empty { display: none; }
    /* the keyboard is as wide as the sheet (up to 900 px), so the keys are as big as the sheet allows */
    .box .keys { width: 100%; max-width: 900px; align-self: center; }
    .box .keys .key, .box .keys.compact .key { flex: 1 1 0; width: auto; min-width: 0; }
    .box .keys .key.wide, .box .keys.compact .key.wide { flex: 1.5 1 0; width: auto; }
    .box .keys .key.space, .box .keys.compact .key.space { flex: 0 1 62%; width: auto; }
    .field { flex: 1; min-width: 0; height: 54px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: var(--fs-5); font-weight: var(--w-semi, 600); color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--ink2) 30%, transparent); }
    .field { text-overflow: ellipsis; }
    .box .xbtn { margin-left: auto; }
    .field.on { box-shadow: inset 0 0 0 3px var(--primary); }
    .box .field:focus-visible { outline: none; }
    .field.where { height: 48px; font-size: var(--fs-4); }
    /* what and where share a row, with Add at its end */
    .what { display: flex; gap: 10px; align-items: center; }
    .what > .field { flex: 1.5 1 0; height: 60px; }
    .wherebox { position: relative; flex: 1 1 0; display: flex; align-items: center; gap: 6px; min-width: 0; }
    .wherebox .field.where { height: 60px; font-size: var(--fs-3); padding: 0 14px; }
    :host([data-phone]) .what { flex-direction: column; align-items: stretch; }
    :host([data-phone]) .what > .field, :host([data-phone]) .wherebox { flex: none; }
    .wherebox > .pin { line-height: 0; width: 30px; display: flex; justify-content: center; color: var(--accent); }
    .places { position: absolute; left: 0; right: 0; top: 64px; min-width: 320px; z-index: 5; border-radius: 16px; padding: 6px; display: flex; flex-direction: column; gap: 2px; background: var(--sheet-bg, var(--chip-strong)); box-shadow: 0 14px 34px rgba(0,0,0,.28); -webkit-backdrop-filter: blur(18px); backdrop-filter: blur(18px); }
    .places button { min-height: 44px; padding: 5px 12px; border-radius: 12px; text-align: left; display: flex; flex-direction: column; justify-content: center; font-size: var(--fs-3); font-weight: var(--w-bold, 700); }
    .places button small { font-size: var(--fs-1); font-weight: var(--w-semi, 600); color: var(--ink2); }
    .places .note { font-size: var(--fs-1); color: var(--ink2); padding: 2px 12px 4px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .chips button { height: 44px; padding: 0 13px; border-radius: 999px; background: var(--chip); font-size: var(--fs-2); font-weight: var(--w-semi, 600); display: inline-flex; align-items: center; gap: 6px; }
    .chips button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    /* each set of chips is one row: seven days in a grid, and the calendars side by side (a long name is cut, never wrapped under the others) */
    .chips.days { display: grid; grid-template-columns: 1.15fr 1.5fr repeat(5, 1fr); gap: 6px; }
    .chips.days button { min-width: 0; padding: 0 4px; justify-content: center; white-space: nowrap; overflow: hidden; }
    .chips.cals { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, auto); justify-content: start; gap: 6px; }
    .chips.cals button { min-width: 0; padding: 0 11px 0 9px; }
    .rowhead { display: flex; align-items: center; gap: 8px; min-height: 44px; }
    .rowhead .sub { flex: 1; }
    .rowhead .calbtn, .rowhead .farchip { height: 44px; padding: 0 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); white-space: nowrap; }
    .rowhead .calbtn { background: var(--chip-strong); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 45%, transparent); }
    .rowhead .farchip { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    :host([data-phone]) .chips.days, :host([data-phone]) .chips.cals { display: flex; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; padding: 3px; margin: -3px; }
    :host([data-phone]) .chips.days button, :host([data-phone]) .chips.cals button { flex: 0 0 auto; padding: 0 13px; }
    .when { display: flex; gap: 16px; align-items: stretch; }
    /* under 900 px wide the day chips keep the full width and the time dial sits below them, so every chip stays a whole target */
    :host([data-n3]:not([data-phone])) .when { flex-direction: column; gap: 10px; }
    :host([data-n3]:not([data-phone])) .dialbox { justify-content: center; }
    :host([data-n3]:not([data-phone])) .chips.cals { display: flex; flex-wrap: wrap; }
    .when > .left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; justify-content: center; }
    .sub { font-size: var(--fs-2); font-weight: var(--w-heavy, 800); letter-spacing: .06em; text-transform: uppercase; color: var(--ink2); }

    /* the time dial: two drums that spin, and am / pm beside them */
    .dialbox { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 22px; background: var(--chip); }
    .dialbox[data-off] .drums, .dialbox[data-off] .ampm, .dialbox[data-off] .durs { opacity: .3; pointer-events: none; }
    .drums { position: relative; display: flex; align-items: center; gap: 2px; height: ${ROW * 3}px; border-radius: 16px; background: var(--chip-strong); padding: 0 8px; box-shadow: inset 0 2px 8px rgba(0,0,0,.14); }
    .drums::before { content: ''; position: absolute; left: 6px; right: 6px; top: ${ROW}px; height: ${ROW}px; border-radius: 10px; background: color-mix(in srgb, var(--primary) 16%, transparent); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 55%, transparent); pointer-events: none; }
    .drum { position: relative; width: 64px; height: 100%; overflow-y: scroll; scroll-snap-type: y mandatory; scrollbar-width: none; overscroll-behavior: contain; touch-action: pan-y; -webkit-mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); mask-image: linear-gradient(transparent, #000 30%, #000 70%, transparent); outline: none; }
    .drum::-webkit-scrollbar { display: none; }
    .drum:focus-visible { box-shadow: inset 0 0 0 2px var(--primary); border-radius: 10px; }
    .drum i { display: flex; align-items: center; justify-content: center; height: ${ROW}px; scroll-snap-align: center; font-style: normal; font-size: var(--fs-6); font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; color: var(--ink2); }
    .drum i[data-on] { color: var(--ink); }
    .drum::before, .drum::after { content: ''; display: block; height: ${ROW}px; }
    .colon { font-size: var(--fs-6); font-weight: 800; padding-bottom: 4px; }
    .ampm { display: flex; flex-direction: column; gap: 6px; }
    .ampm button { width: 60px; height: 44px; border-radius: 12px; background: var(--chip-strong); font-size: var(--fs-3); font-weight: var(--w-bold, 700); }
    .ampm button[aria-pressed='true'], .allday[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .side { display: flex; flex-direction: column; gap: 6px; }
    .allday { height: 44px; padding: 0 14px; border-radius: 12px; background: var(--chip-strong); font-size: var(--fs-2); font-weight: var(--w-bold, 700); white-space: nowrap; }
    .durs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .durs button { height: 44px; min-width: 66px; border-radius: 12px; background: var(--chip-strong); font-size: var(--fs-2); font-weight: var(--w-semi, 600); white-space: nowrap; }
    .durs button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }

    /* the calendar that opens from the end of the day row */
    .month { position: absolute; z-index: 6; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 430px; max-width: 94%; border-radius: 24px; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: var(--sheet-bg, var(--chip-strong)); box-shadow: 0 20px 50px rgba(0,0,0,.35); -webkit-backdrop-filter: blur(22px); backdrop-filter: blur(22px); }
    .mnav { display: flex; align-items: center; gap: 6px; }
    .mnav b { flex: 1; text-align: center; font-size: var(--fs-4); font-weight: var(--w-heavy, 800); }
    .mnav button { width: 44px; height: 44px; border-radius: 50%; background: var(--chip); display: flex; align-items: center; justify-content: center; font-size: var(--fs-2); font-weight: 800; }
    .mgrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center; }
    .mgrid span { font-size: var(--fs-1); font-weight: 800; color: var(--ink2); padding: 2px 0; }
    .mgrid button { height: 44px; border-radius: 12px; font-size: var(--fs-3); font-weight: var(--w-semi, 600); font-variant-numeric: tabular-nums; }
    .mgrid button.td { box-shadow: inset 0 0 0 2px var(--accent); }
    .mgrid button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .mgrid button:disabled { opacity: .3; }
    .veil.top { z-index: 7; } .month.top { z-index: 8; }
    .month.rep { width: 600px; max-height: 96%; overflow-y: auto; gap: 12px; padding: 16px; }
    .rhead { display: flex; align-items: baseline; gap: 12px; } .rhead b { font-size: var(--fs-4); font-weight: var(--w-heavy, 800); } .rhead .muted { flex: 1; min-width: 0; font-size: var(--fs-2); text-align: right; }
    .rlist { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .rlist button, .rseg button { min-height: 44px; padding: 6px 12px; border-radius: 14px; background: var(--chip); font-size: var(--fs-2); font-weight: var(--w-semi, 600); line-height: 1.15; text-align: left; overflow-wrap: anywhere; }
    .rseg button { text-align: center; flex: 1 1 auto; } .rseg { display: flex; flex-wrap: wrap; gap: 6px; flex: 1 1 200px; }
    .rlist button[aria-checked='true'], .rseg button[aria-checked='true'], .rdays button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .rrow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; } .rrow > .sub { flex: 0 0 56px; } .rrow > .muted { font-size: var(--fs-2); }
    .rrow .calbtn { height: 44px; padding: 0 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); background: var(--chip-strong); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 45%, transparent); }
    .rstep { display: inline-flex; align-items: center; gap: 4px; } .rstep button { width: 44px; height: 44px; border-radius: 50%; background: var(--chip); font-size: var(--fs-4); font-weight: 800; } .rstep button:disabled { opacity: .35; } .rstep b { min-width: 34px; text-align: center; font-size: var(--fs-4); font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; }
    .rdays { display: flex; gap: 6px; flex-wrap: wrap; } .rdays button { width: 44px; height: 44px; border-radius: 50%; background: var(--chip); font-size: var(--fs-2); font-weight: var(--w-bold, 700); }
    .rfoot { display: flex; justify-content: flex-end; } .rfoot .lead { height: 48px; padding: 0 26px; font-size: var(--fs-3); }
    .rowhead .repbtn { min-width: 0; flex: 0 1 auto; } .rowhead .repbtn span { overflow: hidden; text-overflow: ellipsis; max-width: 200px; } .rowhead .repbtn[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); font-weight: var(--w-heavy, 800); }
    .what > .field.notes { flex: 1 1 0; font-size: var(--fs-3); padding: 0 14px; min-width: 0; }
    :host([data-phone]) .rlist { grid-template-columns: 1fr; } :host([data-phone]) .month.rep { width: 100%; }
    .veil { position: absolute; inset: 0; z-index: 5; border-radius: inherit; background: rgba(0,0,0,.18); }
  `];
  static properties = { hass: { attribute: false }, calendars: { attribute: false }, defaultCal: {}, edit: { attribute: false }, scope: {}, _rep: { state: true }, _repOpen: { state: true }, _custom: { state: true }, _notes: { state: true }, _pickFor: { state: true }, places: { type: Boolean }, _t: { state: true }, _loc: { state: true }, _in: { state: true }, _found: { state: true }, _date: { state: true }, _all: { state: true }, _h: { state: true }, _m: { state: true }, _pm: { state: true }, _dur: { state: true }, _cal: { state: true }, _busy: { state: true }, _err: { state: true }, _caps: { state: true }, _pick: { state: true }, _shown: { state: true } };
  hass?: Hass;
  calendars: CalendarConfig[] = [];
  defaultCal = '';
  /** look addresses up on the internet as they are typed (on unless turned off) */
  places = true;
  /** an event being changed: the sheet opens filled in with it, and Save replaces it */
  edit: CalEvent | null = null;
  private _span = 1;
  /** changing one of a repeating series: 'one' (just this one) or 'future' (this and all later ones) */
  scope: '' | 'one' | 'future' = '';
  private _rep: Repeat | null = null;
  /** a rule this sheet cannot show: kept as it is unless another choice is made */
  private _rawRule = '';
  private _repOpen = false;
  private _custom = false;
  private _pickFor: 'date' | 'until' = 'date';
  private _notes = '';
  private _notes0 = '';
  private _t = '';
  private _loc = '';
  private _in: 'what' | 'where' | 'notes' = 'what';
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
    const e = this.edit;
    if (e) {
      this._t = e.title; this._loc = e.location ?? ''; this._date = startOfDay(e.start); this._all = e.allDay; this._cal = e.entity ?? '';
      this._notes = this._notes0 = (e.description ?? '').replace(/<br\s*\/?>|<\/p>|<\/div>/gi, ' ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
      if (this.scope === 'future') { this._rep = fromRRule(e.rrule, this._date); if (!this._rep) this._rawRule = e.rrule ?? ''; else this._custom = !this._presetOf(this._rep); }
      this._span = Math.max(1, Math.round((e.end.getTime() - e.start.getTime()) / 86_400_000));
      if (!e.allDay) { const hh = e.start.getHours(); this._pm = hh >= 12; this._h = hh % 12 || 12; this._m = e.start.getMinutes() - (e.start.getMinutes() % 5); this._dur = Math.max(5, Math.round((e.end.getTime() - e.start.getTime()) / 60_000)); }
    }
  }
  /** which ready-made choice this is (how it ends does not count), or nothing for a custom one */
  private _presetOf(r: Repeat | null): Repeat | undefined { if (!r) return undefined; const k = toRRule({ ...r, end: 'never' }, this._date, true); return presets(this._date).find((x) => toRRule(x, this._date, true) === k); }
  private _rule(): string { return this.scope === 'one' ? '' : this._rep ? toRRule(this._rep, this._date, this._all) : this._rawRule; }
  private _repWords(): string { return this._rep ? repeatWords(this._rep, this._date) : this._rawRule ? 'Repeats as before' : 'Does not repeat'; }
  private _setRep(r: Repeat | null): void { sfx('tap'); this._rawRule = ''; this._rep = r ? { ...r, days: [...r.days] } : null; }
  private _durWord(m = this._dur): string { return m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60}` : `${m / 60} h`; }

  /** On a short screen with a mouse (a laptop) the on-screen keyboard is left out: there is a real one, and the sheet then fits. */
  private _hardKeys = false;
  protected firstUpdated(): void {
    // focus moves into the sheet (the card puts it back on the opener when the sheet closes)
    const first = this.renderRoot.querySelector<HTMLElement>(getShape() === 'phone' ? '.box' : 'input.field');
    first?.focus({ preventScroll: true });
  }
  private _onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this._pick) { e.preventDefault(); e.stopPropagation(); this._pick = false; this._pickFor = 'date'; }
    else if (e.key === 'Escape' && this._repOpen) { e.preventDefault(); e.stopPropagation(); this._repOpen = false; }
    else if (e.key === 'Tab') { // focus stays in the sheet while it is open
      const all = [...this.renderRoot.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]')].filter((x) => x.offsetParent !== null && !x.closest('.keys'));
      const at = all.indexOf((this.renderRoot as ShadowRoot).activeElement as HTMLElement);
      if (all.length && (e.shiftKey ? at <= 0 : at === all.length - 1)) { e.preventDefault(); all[e.shiftKey ? all.length - 1 : 0].focus(); }
    }
  };
  /** One line that says what will be added: "Dentist · Tue 17 Nov · 5:00 pm · 1 h · Charlie". */
  private _summary(): string {
    const cal = this._cal || this.defaultCal || this.calendars[0]?.entity, c = this.calendars.find((x) => x.entity === cal);
    const day = this._date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: this._date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' }).replace(/,/g, '');
    const dur = this._durWord();
    return [this._t.trim(), day, ...(this._all ? ['all day'] : [`${this._h}:${pad(this._m)} ${this._pm ? 'pm' : 'am'}`, dur]), c?.name ?? this.hass?.states[cal ?? '']?.attributes.friendly_name ?? '', this._rule() ? this._repWords() : '', this._loc.trim() ? `at ${this._loc.trim().split(',')[0]}` : ''].filter(Boolean).join(' · ');
  }

  private _key(k: string): void {
    this._err = '';
    if (this._in === 'notes') { [this._notes] = typeKey(this._notes, k, !this._notes.length || /[.!?]\s$/.test(this._notes)); return; }
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
    const was = which === 'h' ? this._h : this._m;
    if (which === 'h') this._h = HOURS[Math.max(0, Math.min(HOURS.length - 1, i))]; else this._m = MINS[Math.max(0, Math.min(MINS.length - 1, i))];
    if ((which === 'h' ? this._h : this._m) !== was) sfx('step');
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
    // sit under the header when the sheet fits there; hide the on-screen keyboard on a short screen that has a real one
    const box = this.renderRoot.querySelector<HTMLElement>('.box');
    if (box && getShape() !== 'phone') {
      const cs = getComputedStyle(this), top = parseFloat(cs.getPropertyValue('--top')) || 110, bot = parseFloat(cs.paddingBottom) || 0;
      const hard = this.clientHeight < 700 && typeof matchMedia === 'function' && matchMedia('(hover: hover) and (pointer: fine)').matches;
      if (hard !== this._hardKeys) { this._hardKeys = hard; this.setAttribute('data-keys', hard ? 'off' : 'on'); this.requestUpdate(); return; }
      this.toggleAttribute('data-under', box.scrollHeight <= this.clientHeight - top - bot + 1);
    }
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
    return html`<div class="drum" data-d=${which} tabindex="0" role="spinbutton" aria-label=${label} aria-valuenow=${v} aria-valuetext=${which === 'h' ? `${v} ${this._pm ? 'pm' : 'am'}` : `${pad(v)} minutes`} aria-valuemin=${list[0]} aria-valuemax=${list[list.length - 1]}
      @scroll=${(e: Event) => this._scrolled(which, e)} @keydown=${(e: KeyboardEvent) => { if (e.key === 'ArrowUp') this._nudge(which, -1, e); else if (e.key === 'ArrowDown') this._nudge(which, 1, e);
        // Page Up and Page Down move three places (three hours, a quarter of an hour); Home and End go to the first and the last
        else if (e.key === 'PageUp' || e.key === 'PageDown') { e.preventDefault(); this._setDrum(which, list.indexOf(v as never) + (e.key === 'PageUp' ? -3 : 3)); }
        else if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); this._setDrum(which, e.key === 'Home' ? 0 : list.length - 1); } }}>
      ${list.map((n, i) => html`<i ?data-on=${n === v} @click=${() => this._setDrum(which, i)}>${which === 'h' ? n : pad(n)}</i>`)}</div>`;
  }

  private _monthGrid(): TemplateResult {
    const today = startOfDay(new Date()), y = this._shown.getFullYear(), m = this._shown.getMonth();
    const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    const go = (dy: number, dm: number) => { this._shown = new Date(y + dy, m + dm, 1); };
    const until = this._pickFor === 'until', chosen = until && this._rep?.until ? new Date(`${this._rep.until}T00:00:00`) : this._date, floor = until ? this._date : today;
    const take = (d: Date): void => { sfx('tap'); if (until) { if (this._rep) this._rep = { ...this._rep, end: 'on', until: ymd(d) }; } else this._date = d; this._pick = false; this._pickFor = 'date'; };
    return html`<div class="veil top" @click=${() => { this._pick = false; this._pickFor = 'date'; }}></div>
      <div class="month top" role="dialog" aria-label=${until ? 'Pick the last day' : 'Pick a date'}>
        <div class="mnav">
          <button class="tap" aria-label="Year before" @click=${() => go(-1, 0)}>«</button><button class="tap" aria-label="Month before" @click=${() => go(0, -1)}>${icon('left', 18)}</button>
          <b aria-live="polite">${MONTHS[m]} ${y}</b>
          <button class="tap" aria-label="Month after" @click=${() => go(0, 1)}>${icon('right', 18)}</button><button class="tap" aria-label="Year after" @click=${() => go(1, 0)}>»</button>
        </div>
        <div class="mgrid">
          ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => html`<span aria-hidden="true">${d}</span>`)}
          ${Array.from({ length: lead }, () => html`<span></span>`)}
          ${Array.from({ length: days }, (_, i) => { const d = new Date(y, m, i + 1); return html`<button class="tap ${same(d, today) ? 'td' : ''}" ?disabled=${d < floor} aria-pressed=${String(same(d, chosen))} aria-label=${d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} @click=${() => take(d)}>${i + 1}</button>`; })}
        </div>
      </div>`;
  }

  /** How often: the ready-made choices, a custom one (every N days, weeks, months or years; which days), and how it ends. */
  private _repeatSheet(): TemplateResult {
    const d = this._date, r = this._rep, list = presets(d), cur = this._custom ? undefined : this._presetOf(r);
    const set = (c: Partial<Repeat>): void => { if (!this._rep) return; sfx('tap'); this._rep = { ...this._rep, ...c }; };
    const step = (label: string, v: number, min: number, max: number, on: (n: number) => void): TemplateResult => html`<span class="rstep" role="group" aria-label=${label}>
      <button class="tap" aria-label=${`${label}: fewer`} ?disabled=${v <= min} @click=${() => on(Math.max(min, v - 1))}>−</button><b aria-live="polite">${v}</b><button class="tap" aria-label=${`${label}: more`} ?disabled=${v >= max} @click=${() => on(Math.min(max, v + 1))}>+</button></span>`;
    const opt = (label: string, on: boolean, run: () => void, act = ''): TemplateResult => html`<button class="tap" role="radio" data-act=${act || nothing} aria-checked=${String(on)} @click=${run}>${label}</button>`;
    const units: [Freq, string][] = [['DAILY', 'day'], ['WEEKLY', 'week'], ['MONTHLY', 'month'], ['YEARLY', 'year']];
    const until = r?.until ? new Date(`${r.until}T00:00:00`) : null;
    return html`<div class="veil" @click=${() => { this._repOpen = false; }}></div>
      <div class="month rep scrolly" role="dialog" aria-label="How often">
        <div class="rhead"><b>Repeat</b><span class="muted" aria-live="polite">${this._repWords()}</span></div>
        <div class="rlist" role="radiogroup" aria-label="How often">
          ${opt('Does not repeat', !r && !this._rawRule, () => { this._custom = false; this._setRep(null); }, 'rep-none')}
          ${this._rawRule ? opt('Repeats as before', true, () => { /* stays */ }) : nothing}
          ${list.map((x, i) => opt(repeatWords(x, d), !!cur && toRRule(cur, d, true) === toRRule(x, d, true), () => { this._custom = false; this._setRep({ ...x, end: r?.end ?? 'never', until: r?.until, count: r?.count }); }, `rep-${i}`))}
          ${opt('Custom…', this._custom, () => { this._custom = true; this._setRep(r ?? list[1]); }, 'rep-custom')}
        </div>
        ${this._custom && r ? html`<div class="rrow"><span class="sub">Every</span>${step('How many', r.every, 1, 99, (n) => set({ every: n }))}
            <div class="rseg" role="radiogroup" aria-label="Days, weeks, months or years">${units.map(([f, w]) => opt(r.every > 1 ? `${w}s` : w, r.freq === f, () => set({ freq: f })))}</div></div>
          ${r.freq === 'WEEKLY' ? html`<div class="rrow"><span class="sub">On</span><div class="rdays" role="group" aria-label="Which days">${DAY_LETTERS.map((l, i) => html`<button class="tap" aria-label=${DAY_NAMES[i]} aria-pressed=${String(r.days.includes(i))} @click=${() => { const has = r.days.includes(i), days = has ? r.days.filter((x) => x !== i) : [...r.days, i]; set({ days: days.length ? days : [dow(d)] }); }}>${l}</button>`)}</div></div>` : nothing}
          ${r.freq === 'MONTHLY' ? html`<div class="rrow"><span class="sub">On</span><div class="rseg" role="radiogroup" aria-label="Which day of the month">${opt(repeatWords({ ...r, every: 1, end: 'never', monthBy: 'date' }, d).replace('Every month on ', ''), r.monthBy === 'date', () => set({ monthBy: 'date' }))}${opt(repeatWords({ ...r, every: 1, end: 'never', monthBy: 'weekday' }, d).replace('Every month on ', ''), r.monthBy === 'weekday', () => set({ monthBy: 'weekday' }))}</div></div>` : nothing}` : nothing}
        ${r ? html`<div class="rrow"><span class="sub">Ends</span><div class="rseg" role="radiogroup" aria-label="When it ends">
            ${opt('Never', r.end === 'never', () => set({ end: 'never' }), 'end-never')}${opt('On a date', r.end === 'on', () => { set({ end: 'on', until: r.until ?? ymd(addDays(d, 84)) }); }, 'end-on')}${opt('After', r.end === 'after', () => set({ end: 'after', count: r.count ?? 10 }), 'end-after')}</div>
            ${r.end === 'on' && until ? html`<button class="tap calbtn" data-act="end-date" aria-haspopup="dialog" @click=${() => { this._shown = until; this._pickFor = 'until'; this._pick = true; }}>${icon('calendar', 20)}<span>${until.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span></button>` : nothing}
            ${r.end === 'after' ? html`${step('How many times', r.count ?? 10, 1, 99, (n) => set({ count: n }))}<span class="muted">times</span>` : nothing}</div>` : nothing}
        <div class="rfoot"><button class="tap lead" data-act="rep-done" @click=${() => { sfx('tap'); this._repOpen = false; }}>Done</button></div>
      </div>`;
  }

  private async _save(): Promise<void> {
    // a second tap while the first is being saved must not add the event twice
    if (this._busy) return;
    const cal = this._cal || this.defaultCal || this.calendars[0]?.entity;
    if (!this._t.trim() || !cal || !this.hass) { this._err = 'Add a title first'; return; }
    const summary = this._summary();
    const d = this._date;
    const data: Record<string, unknown> = { summary: this._t.trim() };
    if (this._loc.trim()) data.location = this._loc.trim();
    const ed = this.edit;
    const notes = this._notes.trim(), rule = this._rule();
    if (notes) data.description = ed?.description && notes === this._notes0 ? ed.description : notes;
    if (this.scope === 'future' && !rule) { this._err = 'Choose how it repeats first'; this._repOpen = true; return; }
    if (this._all) { data.start_date = ymd(d); data.end_date = ymd(addDays(d, ed?.allDay ? this._span : 1)); }
    else {
      const s = new Date(d); s.setHours(this._hour24(), this._m, 0, 0);
      data.start_date_time = local(s); data.end_date_time = local(new Date(s.getTime() + this._dur * 60_000));
    }
    this._busy = true; this._err = '';
    // an answer that takes more than 15 s: say so and let Add be tapped again
    const gen = ++this._saveGen;
    const wait = window.setTimeout(() => { if (gen !== this._saveGen || !this._busy) return; this._busy = false; this._err = 'Still waiting. Try again?'; }, FhAddEvent.WAIT);
    const gone = (): boolean => !this.isConnected || this.hasAttribute('data-closing');
    try {
      let left = false;
      const T = (x: unknown): string => String(x).replace(' ', 'T');
      const event: Record<string, unknown> = { summary: data.summary, dtstart: T(data.start_date ?? data.start_date_time), dtend: T(data.end_date ?? data.end_date_time) };
      if (data.location) event.location = data.location; if (data.description) event.description = data.description; if (rule) event.rrule = rule;
      // the "add an event" service cannot say how an event repeats, so a repeating one goes through the calendar's own create
      const create = async (): Promise<void> => { if (rule) await this.hass!.callWS({ type: 'calendar/event/create', entity_id: cal, event }); else await this.hass!.callService('calendar', 'create_event', data, { entity_id: cal }); };
      if (ed?.uid && ed.entity) {
        const f = Number(this.hass.states[ed.entity]?.attributes.supported_features ?? 0);
        const which = ed.recurrenceId && this.scope ? { recurrence_id: ed.recurrenceId, ...(this.scope === 'future' ? { recurrence_range: 'THISANDFUTURE' } : {}) } : {};
        if (cal === ed.entity && f & 4) await this.hass.callWS({ type: 'calendar/event/update', entity_id: ed.entity, uid: ed.uid, ...which, event });
        else {
          // this calendar cannot change an event in place: the new one is added first, and only then is the old one removed, so nothing is lost if either step fails
          await create();
          try { await this.hass.callWS({ type: 'calendar/event/delete', entity_id: ed.entity, uid: ed.uid, ...which }); } catch { left = true; }
        }
      } else await create();
      clearTimeout(wait);
      if (gen !== this._saveGen) return; // a second try is on its way and will speak for itself
      // stays busy: the sheet closes on "saved", so there is nothing left to tap twice
      this._busy = true; this._err = '';
      this.dispatchEvent(new CustomEvent('saved', { detail: (left ? '!' : '') + summary }));
    } catch {
      clearTimeout(wait);
      if (gen !== this._saveGen) return;
      this._err = ed ? 'Couldn’t change it. Try again in a moment.' : 'Couldn’t add it. Try again in a moment.'; this._busy = false; sfx('error');
      // the sheet was closed while this was on its way: the card says it instead
      if (gone()) this.dispatchEvent(new CustomEvent('failed', { detail: this._t.trim() }));
    }
  }
  private _saveGen = 0;
  /** how long a save may take before the sheet says it is still waiting */
  static WAIT = 15_000;

  render(): TemplateResult {
    const today = startOfDay(new Date());
    const cal = this._cal || this.defaultCal || this.calendars[0]?.entity;
    const short = shortNames(this.calendars.map((c) => c.name ?? c.entity));
    const phone = getShape() === 'phone', far = !Array.from({ length: 7 }, (_, i) => addDays(today, i)).some((d) => same(d, this._date));
    const list = this._in === 'where' ? (this._found ?? (this._loc.trim().length < 3 ? this._zones() : [])) : [];
    const sum = this._summary(), soft = phone || this._hardKeys;
    const add = html`<button class="tap lead" style="height:60px;padding:0 26px;font-size:var(--fs-3)" ?disabled=${this._busy} @click=${() => this._save()}>${this._busy ? (this.edit ? 'Saving…' : 'Adding…') : this.edit ? 'Save' : 'Add'}</button>`;
    return html`<div class="glass sheet box" tabindex="-1" role="dialog" aria-modal="true" aria-label=${this.edit ? 'Change this event' : 'Add to the calendar'} @click=${(e: Event) => e.stopPropagation()} @keydown=${this._onKey}>
      <div style="display:flex;gap:12px;align-items:center">
        <h2 class="t-head" style="white-space:nowrap">${this.edit ? 'Change this event' : 'Add to the calendar'}</h2>
        <span class="sum" aria-live="polite">${this._t.trim() ? sum : `Add a title · ${sum}`}</span>
        <button class="round tap xbtn" aria-label="Close" @click=${() => this.dispatchEvent(new CustomEvent('close'))}>${icon('close', 20)}</button></div>
      <div class="what"><input class="field ${this._in === 'what' ? 'on' : ''}" inputmode=${soft ? 'text' : 'none'} aria-label="What’s on" aria-invalid=${this._err ? 'true' : 'false'} placeholder="What’s on? e.g. Swimming lesson" .value=${this._t} @focus=${() => { this._in = 'what'; }} @input=${(e: Event) => { this._t = (e.target as HTMLInputElement).value; this._err = ''; }}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') void this._save(); }}>
      <div class="wherebox"><span class="pin" aria-hidden="true">${icon('pin', 24)}</span>
        <input class="field where ${this._in === 'where' ? 'on' : ''}" inputmode=${soft ? 'text' : 'none'} aria-label="Where" placeholder="Where? (optional)" .value=${this._loc}
          @focus=${() => { this._in = 'where'; }} @input=${(e: Event) => { this._loc = (e.target as HTMLInputElement).value; this._lookUp(); }}>
        ${list.length ? html`<div class="places" role="listbox" aria-label="Places">
          ${list.map((p) => html`<button class="tap" role="option" aria-selected="false" @click=${() => this._choose(p)}>${p.name}${p.detail ? html`<small>${p.detail}</small>` : nothing}</button>`)}
          ${this._found ? html`<span class="note">Places: © OpenStreetMap contributors, found by Photon</span>` : nothing}
        </div>` : nothing}
      </div>
        <input class="field notes ${this._in === 'notes' ? 'on' : ''}" inputmode=${soft ? 'text' : 'none'} aria-label="Notes" placeholder="Notes (optional)" .value=${this._notes} @focus=${() => { this._in = 'notes'; }} @input=${(e: Event) => { this._notes = (e.target as HTMLInputElement).value; }}>
        ${phone ? nothing : add}</div>
      <span class="err" role="status" aria-live="polite">${this._err}</span>
      <div class="when">
        <div class="left">
          <div class="rowhead"><span class="sub" id="dayl">Which day</span>
            ${far ? html`<button class="tap farchip" aria-pressed="true" @click=${() => { this._shown = this._date; this._pick = true; }}>${this._date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: this._date.getFullYear() === today.getFullYear() ? undefined : 'numeric' })}</button>` : nothing}
            <button class="tap calbtn" aria-label="Pick another date" aria-haspopup="dialog" @click=${() => { this._shown = this._date; this._pick = true; }}>${icon('calendar', 22)}<span>Other date</span></button>
            ${this.scope === 'one' ? nothing : html`<button class="tap calbtn repbtn" data-act="repeat" aria-haspopup="dialog" aria-label=${`Repeat: ${this._repWords()}`} aria-pressed=${String(!!this._rule())} @click=${() => { sfx('tap'); this._repOpen = true; }}>${icon('repeat', 22)}<span>${this._rule() ? this._repWords() : 'Repeat'}</span></button>`}</div>
          <div class="chips days" role="group" aria-label="Which day">
            ${Array.from({ length: 7 }, (_, i) => { const d = addDays(today, i); return html`<button class="tap" aria-pressed=${String(same(d, this._date))} @click=${() => { this._date = d; }}>${i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${fmtDow(d)} ${d.getDate()}`}</button>`; })}
          </div>
          <div class="chips cals" role="group" aria-label="Whose calendar" style="--n:${this.calendars.length}">${this.calendars.map((c) => html`<button class="tap" aria-pressed=${String(cal === c.entity)} @click=${() => { this._cal = c.entity; }}><span class="init" style="--c:${slotVar(c.colour)}" aria-hidden="true">${short[c.name ?? c.entity] ?? ''}</span><span class="ell">${c.name ?? c.entity}</span></button>`)}</div>
        </div>
        <div class="dialbox" ?data-off=${this._all} role="group" aria-label="What time">
          <div class="drums">${this._drum('h')}<span class="colon" aria-hidden="true">:</span>${this._drum('m')}</div>
          <div class="ampm" role="group" aria-label="Morning or afternoon">
            <button class="tap" aria-pressed=${String(!this._pm)} @click=${() => { sfx('tap'); this._pm = false; }}>am</button>
            <button class="tap" aria-pressed=${String(this._pm)} @click=${() => { sfx('tap'); this._pm = true; }}>pm</button>
          </div>
          <div class="side">
            <button class="tap allday" aria-pressed=${String(this._all)} @click=${() => { sfx('tap'); this._all = !this._all; }}>All day</button>
            <div class="durs" role="group" aria-label="How long">${[...new Set([30, 60, 90, 120, this._dur])].sort((a, b) => a - b).map((m) => html`<button class="tap" aria-pressed=${String(this._dur === m)} @click=${() => { this._dur = m; }}>${this._durWord(m)}</button>`)}</div>
          </div>
        </div>
      </div>
      ${keyboard((k) => this._key(k), this._in === 'where' ? !this._loc.length || /\s$/.test(this._loc) : this._in === 'notes' ? !this._notes.length || /[.!?]\s$/.test(this._notes) : this._caps, () => { this._caps = !this._caps; }, true, true)}
      ${phone ? html`<div class="afoot"><span class="sum">${this._t.trim() ? sum : `Add a title · ${sum}`}</span>${add}</div>` : nothing}
      ${this._repOpen ? this._repeatSheet() : nothing}
      ${this._pick ? this._monthGrid() : nothing}
    </div>`;
  }
}
if (!customElements.get('fh-add-event')) customElements.define('fh-add-event', FhAddEvent);
