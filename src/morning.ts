import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './styles';
import { LookController, getLook, lookArt } from './looks';
import { confetti, fxCss } from './fx';
import { avatarCss, decodeLook, renderAvatar } from './avatar';
import { addDays, fmtTime, sameDay, startOfDay, whenOn } from './dates';
import { kidEntities, slotVar, type BringRule, type CalEvent, type Hass, type KidConfig } from './types';
import { changed, FitController, hm, inTime, minsNow, parseChore, say, sfx, SlowError, SLOW_SAY, type Chore, type ParsedChore } from './util';
import { picFor } from './kid';
import { spark } from './sparks';

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
/** Is this event on that day? The planner's own rule, so an event that began yesterday and is still running (a camp) shows here too. */
const onDay = (ev: CalEvent, d: Date): boolean => { const s = startOfDay(d), e = addDays(s, 1); return ev.start < e && ev.end > s && !(ev.allDay && ev.end.getTime() === s.getTime()); };
const tickSvg = html`<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path pathLength="1" d="M5 12.500l4.500 4.500L19 7.500"></path></svg>`;
/** A job ticked on the board stays on its card, shown as done, for this long: tapping it again in that time (but not in the first moment, which is a double tap) takes the tick back. */
const HOLD_MS = 5000, DOUBLE_MS = 1500;
/** How much later than the family's clock one child leaves, in the words on his card. */
export const laterWords = (mins: number): string => mins >= 60 && mins % 60 === 0 ? `${mins / 60} hour${mins === 60 ? '' : 's'} later` : `${mins} minute${mins === 1 ? '' : 's'} later`;
const isAm = (c: ParsedChore): boolean => c.lane === 'routine' && c.slot === 'am';

/** A picture for something to bring or wear, for a child who cannot read yet: the emoji already in its name, or one that fits the words. */
const TILE_PICS: [RegExp, string][] = [[/hat|cap/i, '🧢'], [/sunscreen|sun cream/i, '🧴'], [/library|book|reader/i, '📚'], [/swim|bathers|togs|towel/i, '🩱'], [/sport|uniform|shirt/i, '👕'], [/shoe|runner|boot/i, '👟'], [/jumper|jacket|coat|rain/i, '🧥'],
  [/lunch|sandwich/i, '🥪'], [/fruit|snack|crunch/i, '🍎'], [/water|drink|bottle/i, '🚰'], [/trumpet/i, '🎺'], [/clarinet|recorder|flute/i, '🎶'], [/violin|guitar/i, '🎻'], [/music|instrument|band/i, '🎵'], [/homework|note|form|slip/i, '📝'],
  [/tennis|racquet/i, '🎾'], [/ball|soccer|footy|netball/i, '⚽'], [/scooter|bike|helmet/i, '🛴'], [/toy|teddy|show/i, '🧸'], [/art|paint|smock/i, '🎨']];
/** A count of minutes in words, for the clock's spoken name. */
const minWords = (m: number): string => `${m} minute${m === 1 ? '' : 's'}`;
const NUM = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
/** A time of day in the words people say: "half past seven", "ten to eight". Other minutes are said plainly: "42 minutes past seven". */
export const clockWords = (mins: number): string => {
  const h = Math.floor(mins / 60) % 24, m = ((mins % 60) + 60) % 60, hr = NUM[h % 12], nx = NUM[(h + 1) % 12];
  if (m === 0) return `${hr} o’clock`;
  if (m === 15) return `quarter past ${hr}`; if (m === 30) return `half past ${hr}`; if (m === 45) return `quarter to ${nx}`;
  const W: Record<number, string> = { 5: 'five', 10: 'ten', 20: 'twenty', 25: 'twenty-five' };
  if (W[m]) return `${W[m]} past ${hr}`; if (W[60 - m]) return `${W[60 - m]} to ${nx}`;
  return `${m} minutes past ${hr}`;
};
export const tileOf = (item: string): [string, string] => {
  const m = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/u.exec(item);
  const name = item.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').trim() || item;
  return [m ? m[0] : TILE_PICS.find(([re]) => re.test(item))?.[1] ?? '🎒', name];
};
/**
 * "Out the door": the school-morning board, the one screen the morning can be run from.
 * Each child's card carries his current morning job as one big button he can tick from here (the next one follows), what is on
 * today and what to bring. The jobs still to do are shown once, for the family, as small faces: one face for each job. No card
 * has a bar, a score or a count of jobs. Time is shown once: one clock that empties towards the next time anyone leaves. A card
 * says a time only when its child leaves at a different one ("You leave 20 minutes later").
 */
export class FhMorning extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fit = new FitController(this);
  static styles = [styles, css`
    :host { display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; position: relative; }
    .board { border-radius: 26px; padding: 12px 20px; display: flex; align-items: center; gap: 18px; }
    .team { flex: 1.4; display: flex; flex-direction: column; gap: 4px; align-items: center; }
    /* the jobs still to do, as faces: one for each job, whoever's it is (more than twelve: one face a child, with how many) */
    .faces { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 4px 6px; min-height: 36px; }
    .faces .fc { position: relative; display: inline-flex; line-height: 0; border-radius: 50%; }
    .faces .fc b { position: absolute; right: -8px; bottom: -4px; min-width: 20px; height: 20px; padding: 0 4px; border-radius: 10px; background: var(--chip-strong); box-shadow: 0 0 0 1.5px var(--ink3); font-size: 13px; line-height: 20px; font-weight: var(--w-heavy, 800); text-align: center; }
    .faces .fc[data-n] { margin-right: 8px; }
    .label { font-size: 14px; }
    /* the one clock for the whole family: a face that empties as leaving time comes (for someone who cannot read), the minutes left, and the time on the clock in words and numerals */
    .goclock { display: flex; align-items: center; gap: 16px; justify-content: flex-end; flex: 1.2; min-width: 0; }
    .goclock .face { position: relative; flex-shrink: 0; line-height: 0; border-radius: 50%; }
    .goclock .face > b { position: absolute; right: -6px; bottom: -6px; width: 40px; height: 40px; border-radius: 50%; background: var(--chip-strong); box-shadow: 0 0 0 2px var(--ink3); display: flex; align-items: center; justify-content: center; font-size: 22px; line-height: 1; }
    .goclock.soon .face { box-shadow: 0 0 0 4px var(--accent); }
    .goclock .words { display: flex; flex-direction: column; gap: 4px; text-align: right; min-width: 0; }
    .goclock .at { font-size: 20px; font-weight: var(--w-bold, 700); } .goclock .at b { font-weight: var(--w-heavy, 800); white-space: nowrap; }
    .goclock .who { font-size: 15px; font-weight: var(--w-semi, 600); color: var(--ink2); }
    .leave { font-family: 'Bricolage Grotesque', sans-serif; font-size: 44px; font-weight: var(--w-heavy, 800); line-height: 1; font-variant-numeric: tabular-nums; white-space: nowrap; }
    :host([data-n3]) .leave, :host([data-phone]) .leave { font-size: 36px; }
    /* the words (not the countdown) may take two lines and never run off the card */
    .leave.say { font-size: 34px; white-space: normal; text-wrap: balance; } :host([data-n3]) .leave.say, :host([data-phone]) .leave.say { font-size: 28px; }
    :host([data-phone]) .goclock .words { text-align: left; }
    .leave.go { animation: hop var(--m-5, 900ms) cubic-bezier(.3,1.5,.5,1) 3; }
    @keyframes hop { 40% { transform: translateY(calc(-10px * var(--m-d, 1))) rotate(calc(-2deg * var(--m-d, 1))); } 70% { transform: rotate(calc(1deg * var(--m-d, 1))); } }
    .kcols { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 14px; }
    :host([data-shape='tall']) .board { flex-wrap: wrap; }
    :host([data-phone]) .kcols { grid-template-columns: 1fr; }
    /* a tablet narrower than the canvas: the columns keep their pictures at full size and the board scrolls */
    :host([data-n3]) { overflow-y: auto; gap: 12px; scrollbar-width: none; }
    :host([data-n3]) .kcols { flex: 1 0 auto; gap: 10px; }
    :host([data-n3]) .kcol { padding: 12px; overflow: visible; }
    :host([data-n3]) .board { padding: 10px 14px; gap: 12px; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .kcols { flex: none; }
    :host([data-phone]) .board > div { flex: 1 1 100% !important; justify-content: flex-start !important; }
    .kcol { border-radius: 26px; padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: hidden; text-align: left; border-top: 6px solid var(--kid); }
    .khead { display: flex; align-items: center; gap: 12px; text-align: left; border-radius: 18px; min-height: 60px; min-width: 0; }
    .khead h2 { font-size: 24px; font-weight: var(--w-heavy, 800); flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .khead .go { flex-shrink: 0; line-height: 0; color: var(--ink2); }
    /* his current morning job: one big button, a picture, the words and a circle to tick. It is the only thing on the board a child presses in the morning */
    .jobbtn { display: flex; align-items: center; gap: 12px; min-height: 96px; padding: 10px 14px; border-radius: 22px; text-align: left; background: color-mix(in srgb, var(--kid) 16%, var(--chip)); box-shadow: inset 0 0 0 2.5px var(--kid); flex-shrink: 0; }
    .jobbtn .jpic { font-size: 48px; line-height: 1; flex-shrink: 0; }
    .jobbtn .jtx { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
    .jobbtn .jname { font-size: 24px; font-weight: var(--w-bold, 700); line-height: 1.15; overflow-wrap: anywhere; }
    .jobbtn .jundo { font-size: 14px; font-weight: var(--w-semi, 600); color: var(--ink2); }
    .jobbtn .check { width: 52px; height: 52px; border-radius: 50%; border: 3px solid var(--ink2); display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--on-ok, #fff); box-sizing: border-box; }
    .jobbtn.done { background: color-mix(in srgb, var(--ok) 16%, var(--chip)); box-shadow: inset 0 0 0 2.5px var(--ok); }
    .jobbtn.done .check { background: var(--ok); border-color: var(--ok); }
    .jobbtn.done .jname { text-decoration: line-through; text-decoration-thickness: 2px; }
    .jobbtn.done .jpic { filter: grayscale(1); opacity: .6; }
    .jobbtn[aria-busy] { opacity: .7; }
    .jobsdone { display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 8px 14px; border-radius: 18px; background: color-mix(in srgb, var(--ok) 16%, var(--chip)); font-size: 17px; font-weight: var(--w-bold, 700); flex-shrink: 0; }
    .jobsdone svg { color: var(--ok); flex-shrink: 0; }
    /* a card that is too short for everything tightens in steps, so the pictures of what to bring are never cut: the "Today" heading goes, then the job and the pictures shrink a little, then the day's events go (they are on the planner and on his page) */
    .kcol[data-fit] { gap: 8px; } .kcol[data-fit] > .label { display: none; } .kcol[data-fit] .klow { padding-top: 0; gap: 8px; }
    .kcol[data-fit='2'] .jobbtn, .kcol[data-fit='3'] .jobbtn { min-height: 80px; padding-top: 6px; padding-bottom: 6px; } .kcol[data-fit='2'] .jpic, .kcol[data-fit='3'] .jpic { font-size: 40px; }
    .kcol[data-fit='2'] .tile, .kcol[data-fit='3'] .tile { min-height: 72px; } .kcol[data-fit='2'] .te, .kcol[data-fit='3'] .te { font-size: 32px; }
    .kcol[data-fit='3'] { padding: 10px 12px; overflow-y: auto; scrollbar-width: none; } .kcol[data-fit='3'] .mev2, .kcol[data-fit='3'] > .muted { display: none; }
    .kcol[data-fit='3'] .tile { min-height: 60px; min-width: 64px; padding: 4px; } .kcol[data-fit='3'] .te { font-size: 26px; } .kcol[data-fit='3'] .khead { min-height: 52px; }
    .jmsg { font-size: 14px; font-weight: var(--w-semi, 600); color: var(--danger); }
    :host([data-n3]) .jobbtn, :host([data-phone]) .jobbtn { min-height: 76px; gap: 10px; padding: 8px 10px; }
    :host([data-n3]) .jobbtn .jpic, :host([data-phone]) .jobbtn .jpic { font-size: 36px; }
    :host([data-n3]) .jobbtn .jname, :host([data-phone]) .jobbtn .jname { font-size: 20px; }
    :host([data-n3]) .jobbtn .check, :host([data-phone]) .jobbtn .check { width: 44px; height: 44px; }
    /* the one line about jobs on this board, pooled for the whole family */
    .nextstep { padding: 6px 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-bold, 700); text-align: center; }
    .nextstep.set { background: color-mix(in srgb, var(--ok) 20%, var(--chip)); }
    .bring { display: flex; flex-wrap: wrap; gap: 8px; }
    .bring span { padding: 7px 12px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 18%, var(--chip)); font-size: 15px; font-weight: var(--w-bold, 700); }
    /* a card says a time only when its child does not leave with the clock above: how much later, in plain words, then the time */
    .lchip { font-size: 15px; font-weight: var(--w-heavy, 800); padding: 8px 12px; border-radius: 12px; background: var(--chip); display: flex; flex-wrap: wrap; gap: 2px 8px; align-items: baseline; }
    .lchip .lt { font-weight: var(--w-semi, 600); color: var(--ink2); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    /* what the whole family has on is said once, across the top, not in every column */
    .fam { border-radius: 22px; padding: 8px 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; flex-shrink: 0; }
    .fam .fev { display: inline-flex; align-items: baseline; gap: 8px; padding: 7px 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-bold, 700); }
    .fam .fev .mt { color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; }
    /* the lower half of each column is for someone who cannot read yet: a picture for each thing to bring or wear. (The time left is on the one clock above, never in a column.) */
    .klow { margin-top: auto; display: flex; flex-direction: column; gap: 10px; padding-top: 8px; }
    .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(76px, 1fr)); gap: 8px; }
    .tile { min-width: 76px; min-height: 84px; border-radius: 18px; background: color-mix(in srgb, var(--accent) 18%, var(--chip)); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 6px 4px; }
    .tile .te { font-size: 40px; line-height: 1.1; }
    .tile .tl { font-size: 14px; font-weight: var(--w-bold, 700); line-height: 1.15; text-align: center; overflow-wrap: anywhere; }
    .mev2 { display: flex; gap: 10px; font-size: 15px; font-weight: var(--w-semi, 600); }
    .mev2 .mt { width: 76px; color: var(--ink2); flex-shrink: 0; }
    ${unsafeCSS(avatarCss)}
    ${unsafeCSS(fxCss)}
  `];
  static properties = { hass: { attribute: false }, kids: { attribute: false }, events: { attribute: false }, leaveBy: {}, rules: { attribute: false },
    privateWords: { attribute: false }, uv: { type: Number }, termLabel: {}, travel: { type: Number }, _items: { state: true }, _now: { state: true }, _cheer: { state: true }, _just: { state: true }, _msg: { state: true } };
  hass?: Hass;
  kids: KidConfig[] = [];
  events: CalEvent[] = [];
  leaveBy = '08:15';
  rules: BringRule[] = [];
  privateWords: string[] = [];
  uv = 0;
  termLabel = '';
  travel = 15;
  private _items: Record<string, ParsedChore[]> = {};
  private _now = new Date();
  /** bumps when the whole team finishes, to set off the celebration */
  private _cheer = 0;
  private _wasReady = true;
  /** the job each child has just ticked here: it stays on his card, done, for a few seconds so a slip can be taken back */
  private _just: Record<string, { uid: string; at: number }> = {};
  private _justT: Record<string, number> = {};
  /** a line under a child's job when a tick could not be saved */
  private _msg: Record<string, string> = {};
  private _busy = new Set<string>();
  /** ticks on their way to Home Assistant: the list it sends meanwhile does not undo them */
  private _pending = new Map<string, Chore['status']>();
  private _unsubs: (() => void)[] = [];
  private _t?: number;

  /** a font that arrives after the first drawing changes how tall a card's words are: the cards are fitted again */
  private _refit = (): void => { this.fit.run(); };
  connectedCallback(): void { super.connectedCallback(); this._t = window.setInterval(() => { this._now = new Date(); }, 15_000); this._sub(); try { document.fonts?.addEventListener('loadingdone', this._refit); } catch { /* no font events here */ } }
  disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this._t); try { document.fonts?.removeEventListener('loadingdone', this._refit); } catch { /* no font events here */ } Object.values(this._justT).forEach((t) => clearTimeout(t)); this._unsubs.forEach((u) => u()); this._unsubs = []; this._subKey = ''; }
  protected shouldUpdate(ch: PropertyValues): boolean {
    if (ch.size === 1 && ch.has('hass')) return changed(ch.get('hass') as Hass | undefined, this.hass, this.kids.map((k) => kidEntities(k).avatar));
    return true;
  }
  /** Follows each child's job list. The lists are kept by entity, so a child renamed in Settings keeps his jobs; when the children change, the lists are followed afresh. */
  private _subKey = '';
  private async _sub(): Promise<void> {
    if (!this.hass?.connection) { setTimeout(() => this._sub(), 500); return; }
    const ids = this.kids.map((k) => kidEntities(k).chores), key = ids.join('|');
    if (key === this._subKey) return;
    this._subKey = key; this._unsubs.forEach((u) => u()); this._unsubs = [];
    for (const id of ids) {
      try {
        const u = await this.hass.connection.subscribeMessage<{ items: Chore[] }>((m) => { this._items = { ...this._items, [id]: m.items.map(parseChore).map((c) => this._pending.has(c.uid) ? { ...c, status: this._pending.get(c.uid)! } : c) }; }, { type: 'todo/item/subscribe', entity_id: id });
        if (this.isConnected && this._subKey === key) this._unsubs.push(u); else u();
      } catch { /* list missing */ }
    }
  }
  private _list(k: KidConfig): ParsedChore[] { return this._items[kidEntities(k).chores] ?? []; }
  protected willUpdate(ch: PropertyValues): void { if (ch.has('kids') && this._subKey) void this._sub(); }

  private _bring(k: KidConfig, evs: CalEvent[]): string[] {
    const out = new Set<string>(k.bring?.[DOW[this._now.getDay()]] ?? []);
    // family events only count when they mention this child by name
    const text = evs.filter((e) => e.who === k.name || e.title.toLowerCase().includes(k.name.toLowerCase())).map((e) => e.title.toLowerCase()).join(' | ');
    for (const r of this.rules) {
      if (r.kid && r.kid !== k.name) continue;
      if (new RegExp(r.match, 'i').test(text)) out.add(r.item);
    }
    if (this.uv >= 3) out.add('Hat 🧢');
    return [...out];
  }

  /** A child's own events today (their calendar, or family events that name them). */
  private _own(k: KidConfig): CalEvent[] {
    const n = k.name.toLowerCase();
    const priv = this.privateWords.map((w) => w.toLowerCase());
    return this.events.filter((ev) => onDay(ev, this._now) && !priv.some((w) => ev.title.toLowerCase().includes(w)) && (ev.who === k.name || ev.title.toLowerCase().includes(n)));
  }
  /** Leave time in minutes since midnight: first own event before 10am minus travel, else the default. */
  private _leave(k: KidConfig): { at: number; why: string } {
    const first = this._own(k).filter((e) => !e.allDay && sameDay(e.start, this._now) && e.start.getHours() < 10).sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    const usual = hm(k.leave_by ?? this.leaveBy);
    // An early activity pulls the leave time earlier; anything after the usual time happens once they're already out.
    const early = first ? first.start.getHours() * 60 + first.start.getMinutes() - this.travel : Infinity;
    return early < usual ? { at: early, why: first!.title } : { at: usual, why: 'school' };
  }

  /** Everyone's morning steps, pooled. */
  private _team(): { done: number; total: number } {
    let done = 0, total = 0;
    for (const k of this.kids) for (const c of this._list(k)) if (isAm(c)) { total++; if (c.status === 'completed') done++; }
    return { done, total };
  }
  /** A child's morning job for his card: the one he has just ticked (for a few seconds), else the first not done yet. */
  private _job(k: KidConfig): { c?: ParsedChore; total: number } {
    const am = this._list(k).filter(isAm), j = this._just[k.name];
    return { c: (j && am.find((c) => c.uid === j.uid && c.status === 'completed')) ?? am.find((c) => c.status !== 'completed'), total: am.length };
  }
  private _setStatus(k: KidConfig, uid: string, status: Chore['status']): void { const id = kidEntities(k).chores; this._items = { ...this._items, [id]: (this._items[id] ?? []).map((x) => x.uid === uid ? { ...x, status } : x) }; }
  private _unhold(kid: string, uid?: string): void { if (uid && this._just[kid]?.uid !== uid) return; clearTimeout(this._justT[kid]); const { [kid]: _gone, ...rest } = this._just; this._just = rest; }
  /** Ticks a child's morning job from the board (or, within a few seconds, takes the tick back), exactly as his own page does: the list in Home Assistant, then his points. */
  private async _tick(k: KidConfig, c: ParsedChore, ev: Event): Promise<void> {
    if (!this.hass || this._busy.has(c.uid)) return;
    const el = ev.currentTarget as HTMLElement, done = c.status === 'completed', j = this._just[k.name];
    if (done && (!j || j.uid !== c.uid || Date.now() - j.at < DOUBLE_MS)) return;
    this._busy.add(c.uid);
    const to: Chore['status'] = done ? 'needs_action' : 'completed', e = kidEntities(k);
    this._pending.set(c.uid, to); this._setStatus(k, c.uid, to);
    if (this._msg[k.name]) this._msg = { ...this._msg, [k.name]: '' };
    if (done) this._unhold(k.name);
    else { clearTimeout(this._justT[k.name]); this._just = { ...this._just, [k.name]: { uid: c.uid, at: Date.now() } }; this._justT[k.name] = window.setTimeout(() => this._unhold(k.name, c.uid), HOLD_MS); spark('tick', el.querySelector('.check') ?? el); }
    sfx(done ? 'untick' : 'tick');
    const slow = window.setTimeout(() => { el.setAttribute('aria-busy', 'true'); }, 250);
    try {
      await inTime(this.hass.callService('todo', 'update_item', { item: c.uid, status: to }, { entity_id: e.chores }));
      this._pending.delete(c.uid);
      if (c.pts) await inTime(this.hass.callService('script', 'fh_add_points', { kid: e.slug, points: (done ? -1 : 1) * c.pts, lifetime: true, jar: 0, grow: 0, reason: `${done ? 'un-ticked ' : ''}${c.summary}` }));
      // his own page reads this to know how fresh a tick is (a fresh one can be undone there without a grown-up)
      try { const ticks = JSON.parse(localStorage.getItem('fh-ticks') || '{}') as Record<string, number>; if (done) delete ticks[c.uid]; else ticks[c.uid] = Date.now(); localStorage.setItem('fh-ticks', JSON.stringify(ticks)); } catch { /* storage unavailable */ }
      if (!done && k.mode === 'picture') say(`${c.summary}. Done!`);
    } catch (err) {
      console.warn('Family Hub: chore update failed', err);
      if (this._pending.delete(c.uid)) { this._setStatus(k, c.uid, c.status); this._unhold(k.name, c.uid); }
      this._msg = { ...this._msg, [k.name]: err instanceof SlowError ? SLOW_SAY : 'Couldn’t save that one – try again' };
      window.setTimeout(() => { this._msg = { ...this._msg, [k.name]: '' }; }, 4000);
    } finally { this._busy.delete(c.uid); clearTimeout(slow); el.removeAttribute('aria-busy'); }
  }
  protected updated(): void {
    const { done, total } = this._team(), ready = total > 0 && done === total;
    if (ready && !this._wasReady) { this._cheer++; sfx('done'); }
    if (Object.keys(this._items).length) this._wasReady = ready;
  }

  render(): TemplateResult | typeof nothing {
    if (!this.hass) return nothing;
    const nowM = minsNow(this._now);
    const legs = this.kids.map((k) => ({ k, ...this._leave(k) }));
    const next = legs.filter((l) => l.at - nowM > -5).sort((a, b) => a.at - b.at)[0];
    const left = next ? next.at - nowM : -99;
    const t12 = (m: number): string => fmtTime(new Date(new Date(this._now).setHours(Math.floor(m / 60), m % 60, 0, 0)));
    const first = next ? legs.filter((l) => l.at === next.at) : [];
    const who = !next ? '' : first.length === legs.length ? 'everyone leaves' : first.length > 1 ? `${first.map((l) => l.k.name).join(' & ')} leave` : `${first[0].k.name} leaves`;
    const today = this._now;
    const priv = this.privateWords.map((w) => w.toLowerCase());
    const team = this._team(), ready = team.total > 0 && team.done === team.total;
    const lookOf = (k: KidConfig) => decodeLook(this.hass!.states[kidEntities(k).avatar]?.state, k.look ? decodeLook(k.look) : {});
    const face = (k: KidConfig): TemplateResult => renderAvatar(lookOf(k), { size: 36, crop: 'head', still: true, age: k.age, ring: slotVar(k.colour) });
    // whose the jobs to go are: a face for each one, in the children's own order
    const togo = this.kids.map((k) => ({ k, n: this._list(k).filter((c) => isAm(c) && c.status !== 'completed').length })).filter((g) => g.n > 0);
    // what the whole family has on (the family calendar, not naming one child) is said once across the top
    const fam = this.events.filter((ev) => onDay(ev, today) && ev.colour === 'family' && !priv.some((w) => ev.title.toLowerCase().includes(w)) && !this.kids.some((k) => ev.who === k.name || ev.title.toLowerCase().includes(k.name.toLowerCase())))
      .map((ev, i) => ({ ev, i, k: whenOn(ev, today).sort })).sort((x, y) => x.k - y.k || x.i - y.i).map((x) => x.ev);
    return html`
      <section class="glass board">
        <div style="flex:1"><h1 class="t-title">Out the door</h1>
          <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600)">${this.termLabel}${this.uv >= 3 ? ` · UV ${Math.round(this.uv)} – hats and sunscreen` : ''}</span></div>
        ${team.total ? html`<div class="team" data-part="team" role="img" aria-label=${ready ? 'Morning jobs: all done' : `Morning jobs to go: ${togo.map((g) => `${g.k.name} ${g.n}`).join(', ')}`}>
          ${ready ? nothing : html`<div class="faces" aria-hidden="true">${team.total - team.done <= 12
            ? togo.flatMap((g) => Array.from({ length: g.n }, () => html`<span class="fc" data-who=${g.k.name}>${face(g.k)}</span>`))
            : togo.map((g) => html`<span class="fc" data-who=${g.k.name} data-n=${g.n}>${face(g.k)}<b>${g.n}</b></span>`)}</div>`}
          <span class="nextstep ${ready ? 'set' : ''}">${ready ? 'Morning jobs: all done. Go team! 🎉' : `Morning jobs: ${team.total - team.done} to go between us`}</span></div>` : nothing}
        <div class="goclock ${left > 0 && left <= 10 ? 'soon' : ''}" data-part="goclock" role="timer" aria-label=${left > 0 ? `Time to leave: ${minWords(left)} until ${who} at ${t12(next!.at)}` : left > -5 ? 'Time to go' : 'Everyone has left'}>
          <span class="face" aria-hidden="true">${lookArt(getLook(), 'timer', { frac: left > 0 ? Math.min(1, left / 60) : 0, size: 96 })}<b>${left > -5 ? '🚪' : '👋'}</b></span>
          <div class="words"><div class="leave ${left <= 0 && left > -5 ? 'go' : ''} ${left > 0 ? '' : 'say'}">${left > 0 ? `${left} min` : left > -5 ? 'Time to go!' : 'Have a great day'}</div>
            ${next && left > 0 ? html`<span class="at">Leave at <b>${t12(next.at)}</b></span><span class="who">${clockWords(next.at)} · ${who}</span>` : nothing}</div></div>
      </section>
      ${fam.length ? html`<section class="glass fam" aria-label="Everyone today"><span class="label">Everyone today</span>${fam.slice(0, 4).map((ev) => html`<span class="fev"><span class="mt">${whenOn(ev, today).label}</span><span>${ev.title}</span></span>`)}</section>` : nothing}
      <div class="kcols" style="--n:${this.kids.length}">
        ${this.kids.map((k) => {
          const look = lookOf(k);
          const evs = this._own(k);
          const bring = this._bring(k, evs);
          const lv = legs.find((l) => l.k === k)!, kl = lv.at - nowM, gone = kl <= -5, differs = !gone && !!next && lv.at !== next.at;
          const job = this._job(k), c = job.c, done = c?.status === 'completed', msg = this._msg[k.name];
          return html`<section class="glass kcol" data-fits data-kid=${k.name} style="--kid:${slotVar(k.colour)}" aria-label=${k.name}>
            <button class="khead tap" data-act="open" aria-label=${`${k.name}: ${gone ? 'has left' : `leaves at ${t12(lv.at)}`}${bring.length ? `. Bring and wear: ${bring.map((x) => tileOf(x)[1]).join(', ')}` : ''}. Opens ${k.name}’s page`} @click=${() => this.dispatchEvent(new CustomEvent('open-kid', { detail: k.name }))}>
              ${renderAvatar(look, { size: 60, crop: 'head', jump: this._cheer, age: k.age, ring: slotVar(k.colour) })}<h2>${k.name}</h2><span class="go" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.500" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"></path></svg></span></button>
            ${c ? html`<button class="jobbtn big tap ${done ? 'done' : ''}" data-part="job" data-uid=${c.uid} aria-pressed=${done ? 'true' : 'false'} aria-label=${done ? `${k.name}: ${c.summary}, done. Tap to undo` : `${k.name}, now: ${c.summary}. Tap when it is done`} @click=${(ev: Event) => { void this._tick(k, c, ev); }}>
                ${k.older ? nothing : html`<span class="jpic" aria-hidden="true">${picFor(c)}</span>`}
                <span class="jtx"><span class="label">${done ? 'Done' : 'Now'}</span><span class="jname">${c.summary}</span>${done ? html`<span class="jundo">Tap to undo</span>` : nothing}</span>
                <span class="check" aria-hidden="true">${done ? tickSvg : nothing}</span></button>`
              : job.total ? html`<div class="jobsdone" data-part="job">${tickSvg}<span>Morning jobs done</span></div>` : nothing}
            ${msg ? html`<span class="jmsg" role="status">${msg}</span>` : nothing}
            <span class="label">Today</span>
            ${evs.length ? evs.slice(0, 3).map((ev) => html`<div class="mev2"><span class="mt">${whenOn(ev, today).label}</span><span>${ev.title}</span></div>`)
              : html`<span class="muted" style="font-size:15px">Just school today</span>`}
            <div class="klow">
              ${gone ? html`<div class="lchip" data-part="leaves"><span>Left</span></div>`
                : differs ? html`<div class="lchip" data-part="leaves"><span>You leave ${laterWords(lv.at - next!.at)}</span><span class="lt">${t12(lv.at)}${lv.why !== 'school' ? ` · ${lv.why}` : ''}</span></div>` : nothing}
              ${bring.length ? html`<div class="tiles" data-part="bring">${bring.map((x) => { const [pic, name] = tileOf(x); return html`<span class="tile"><span class="te" aria-hidden="true">${pic}</span><span class="tl">${name}</span></span>`; })}</div>` : nothing}
            </div>
          </section>`;
        })}
      </div>
      ${this._cheer ? keyed(this._cheer, confetti(this._cheer)) : nothing}`;
  }
}
if (!customElements.get('fh-morning')) customElements.define('fh-morning', FhMorning);
