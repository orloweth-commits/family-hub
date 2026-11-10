import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './styles';
import { LookController, getLook, lookArt } from './looks';
import { confetti, fxCss } from './fx';
import { avatarCss, decodeLook, renderAvatar } from './avatar';
import { fmtTime, sameDay } from './dates';
import { kidEntities, slotVar, type BringRule, type CalEvent, type Hass, type KidConfig } from './types';
import { changed, hm, minsNow, parseChore, sfx, type Chore, type ParsedChore } from './util';
import { picFor } from './kid';

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * "Out the door": the school-morning board.
 * Progress is shown for the team as a whole (one row of stars everyone fills together), never child against child:
 * each column only says what that child does next, what to bring and when to leave.
 */
export class FhMorning extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, css`
    :host { display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; position: relative; }
    .board { border-radius: 26px; padding: 12px 20px; display: flex; align-items: center; gap: 18px; }
    .team { flex: 1.4; display: flex; flex-direction: column; gap: 4px; align-items: center; }
    .stars { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px 4px; font-size: 30px; line-height: 1; }
    .stars i { font-style: normal; color: var(--track); transition: color .3s; }
    .stars i.on { color: #f5b301; animation: starpop .6s cubic-bezier(.3,1.8,.5,1) both; }
    @keyframes starpop { from { transform: scale(.2) rotate(-40deg); } to { transform: none; } }
    .teambar { width: 100%; height: 14px; border-radius: 7px; background: var(--track); overflow: hidden; }
    .teambar > div { height: 100%; border-radius: 7px; background: #f5b301; transition: width .6s; }
    .leave { font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: var(--w-heavy, 800); line-height: 1; font-variant-numeric: tabular-nums; }
    .leave.go { animation: hop .7s cubic-bezier(.3,1.5,.5,1) 3; }
    @keyframes hop { 0%, 100% { transform: none; } 40% { transform: translateY(-10px) rotate(-2deg); } 70% { transform: translateY(0) rotate(1deg); } }
    .kcols { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 14px; }
    :host([data-shape='tall']) .board { flex-wrap: wrap; }
    :host([data-shape='tall']) .kcols { grid-template-columns: 1fr; }
    .kcol { border-radius: 26px; padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: hidden; text-align: left; border-top: 6px solid var(--kid); }
    .khead { display: flex; align-items: center; gap: 12px; }
    .khead h2 { font-size: 24px; font-weight: var(--w-heavy, 800); flex: 1; }
    .nextstep { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 18px; background: color-mix(in srgb, var(--kid) 16%, var(--chip)); font-size: 20px; font-weight: var(--w-bold, 700); min-height: 64px; }
    .nextstep .e { font-size: 38px; line-height: 1; }
    .nextstep small { display: block; font-size: 13px; font-weight: var(--w-bold, 700); color: var(--ink2); }
    .nextstep.set { background: color-mix(in srgb, var(--ok) 20%, var(--chip)); }
    .bring { display: flex; flex-wrap: wrap; gap: 8px; }
    .bring span { padding: 7px 12px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 18%, var(--chip)); font-size: 15px; font-weight: var(--w-bold, 700); }
    .lchip { font-size: 15px; font-weight: var(--w-heavy, 800); padding: 8px 12px; border-radius: 12px; background: var(--chip); display: flex; justify-content: space-between; }
    .lchip.soon { background: color-mix(in srgb, var(--accent) 32%, var(--chip)); }
    .lchip.now { background: color-mix(in srgb, var(--accent) 55%, var(--chip)); animation: hop .7s cubic-bezier(.3,1.5,.5,1) 3; }
    .mev2 { display: flex; gap: 10px; font-size: 15px; font-weight: var(--w-semi, 600); }
    .mev2 .mt { width: 72px; color: var(--ink2); flex-shrink: 0; }
    ${unsafeCSS(avatarCss)}
    ${unsafeCSS(fxCss)}
  `];
  static properties = { hass: { attribute: false }, kids: { attribute: false }, events: { attribute: false }, leaveBy: {}, rules: { attribute: false },
    privateWords: { attribute: false }, uv: { type: Number }, termLabel: {}, travel: { type: Number }, _items: { state: true }, _now: { state: true }, _cheer: { state: true } };
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
  private _unsubs: (() => void)[] = [];
  private _t?: number;

  connectedCallback(): void { super.connectedCallback(); this._t = window.setInterval(() => { this._now = new Date(); }, 15_000); this._sub(); }
  disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this._t); this._unsubs.forEach((u) => u()); this._unsubs = []; }
  protected shouldUpdate(ch: PropertyValues): boolean {
    if (ch.size === 1 && ch.has('hass')) return changed(ch.get('hass') as Hass | undefined, this.hass, this.kids.map((k) => kidEntities(k).avatar));
    return true;
  }
  private async _sub(): Promise<void> {
    if (!this.hass?.connection) { setTimeout(() => this._sub(), 500); return; }
    for (const k of this.kids) {
      const id = kidEntities(k).chores;
      try {
        const u = await this.hass.connection.subscribeMessage<{ items: Chore[] }>((m) => { this._items = { ...this._items, [k.name]: m.items.map(parseChore) }; }, { type: 'todo/item/subscribe', entity_id: id });
        if (this.isConnected) this._unsubs.push(u); else u();
      } catch { /* list missing */ }
    }
  }

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
    return this.events.filter((ev) => sameDay(ev.start, this._now) && !priv.some((w) => ev.title.toLowerCase().includes(w)) && (ev.who === k.name || ev.title.toLowerCase().includes(n)));
  }
  /** Leave time in minutes since midnight: first own event before 10am minus travel, else the default. */
  private _leave(k: KidConfig): { at: number; why: string } {
    const first = this._own(k).filter((e) => !e.allDay && e.start.getHours() < 10).sort((a, b) => a.start.getTime() - b.start.getTime())[0];
    const usual = hm(k.leave_by ?? this.leaveBy);
    // An early activity pulls the leave time earlier; anything after the usual time happens once they're already out.
    const early = first ? first.start.getHours() * 60 + first.start.getMinutes() - this.travel : Infinity;
    return early < usual ? { at: early, why: first!.title } : { at: usual, why: 'school' };
  }

  /** Everyone's morning steps, pooled: the team fills one row of stars together. */
  private _team(): { done: number; total: number } {
    let done = 0, total = 0;
    for (const k of this.kids) for (const c of this._items[k.name] ?? []) if (c.lane === 'routine' && c.slot === 'am') { total++; if (c.status === 'completed') done++; }
    return { done, total };
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
    const who = next ? (legs.filter((l) => l.at === next.at).length === legs.length ? 'everyone leaves' : `${legs.filter((l) => l.at === next.at).map((l) => l.k.name).join(' & ')} leaves`) : '';
    const today = this._now;
    const priv = this.privateWords.map((w) => w.toLowerCase());
    const team = this._team(), ready = team.total > 0 && team.done === team.total;
    return html`
      <section class="glass board">
        <div style="flex:1"><h1 class="t-title">Out the door</h1>
          <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600)">${this.termLabel}${this.uv >= 3 ? ` · UV ${Math.round(this.uv)} – hats and sunscreen` : ''}</span></div>
        ${team.total ? html`<div class="team" role="img" aria-label="Team morning: ${team.done} of ${team.total} done">
          ${team.total <= 18 ? html`<div class="stars">${Array.from({ length: team.total }, (_, i) => html`<i class=${i < team.done ? 'on' : ''}>★</i>`)}</div>`
            : html`<div class="teambar"><div style="width:${(team.done / team.total) * 100}%"></div></div>`}
          <span style="font-size:15px;font-weight:var(--w-bold, 700)">${ready ? 'Everyone’s ready – go team! 🎉' : 'Team morning: every job done adds a star'}</span></div>` : nothing}
        <div style="display:flex;align-items:center;gap:14px;justify-content:flex-end;flex:1">
          ${left > 0 ? lookArt(getLook(), 'timer', { frac: Math.min(1, left / 60), size: 64 }) : nothing}
          <div style="text-align:right"><div class="leave ${left <= 0 && left > -5 ? 'go' : ''}">${left > 0 ? `${left} min` : left > -5 ? 'Time to go!' : 'Have a great day'}</div>
            <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${next && left > 0 ? `until ${who} at ${t12(next.at)}` : ''}</span></div></div>
      </section>
      <div class="kcols" style="--n:${this.kids.length}">
        ${this.kids.map((k) => {
          const e = kidEntities(k);
          const look = decodeLook(this.hass!.states[e.avatar]?.state, k.look ? decodeLook(k.look) : {});
          const steps = (this._items[k.name] ?? []).filter((c) => c.lane === 'routine' && c.slot === 'am');
          const todo = steps.find((c) => c.status !== 'completed');
          const evs = this.events.filter((ev) => sameDay(ev.start, today) && !priv.some((w) => ev.title.toLowerCase().includes(w)) && (ev.who === k.name || ev.colour === 'family' || ev.title.toLowerCase().includes(k.name.toLowerCase())));
          const bring = this._bring(k, evs);
          const lv = legs.find((l) => l.k === k)!, kl = lv.at - nowM;
          return html`<button class="glass kcol tap" style="--kid:${slotVar(k.colour)}" @click=${() => this.dispatchEvent(new CustomEvent('open-kid', { detail: k.name }))}>
            <div class="khead">${renderAvatar(look, { size: 60, crop: 'head', jump: this._cheer, age: k.age, ring: slotVar(k.colour) })}<h2>${k.name}</h2></div>
            <div class="lchip ${kl <= 0 && kl > -5 ? 'now' : kl <= 10 && kl > 0 ? 'soon' : ''}"><span>Leave ${t12(lv.at)}${lv.why !== 'school' ? ` · ${lv.why}` : ''}</span><span>${kl > 0 ? `${kl} min` : kl > -5 ? 'Go!' : '✓'}</span></div>
            ${steps.length ? (todo ? html`<div class="nextstep"><span class="e">${picFor(todo.summary)}</span><span><small>Next</small>${todo.summary}</span></div>`
              : html`<div class="nextstep set"><span class="e">🌟</span><span><small>Morning jobs</small>All set</span></div>`) : nothing}
            ${bring.length ? html`<span class="label">Bring</span><div class="bring">${bring.map((b) => html`<span>${b}</span>`)}</div>` : nothing}
            <span class="label">Today</span>
            ${evs.length ? evs.slice(0, 4).map((ev) => html`<div class="mev2"><span class="mt">${ev.allDay ? 'All day' : fmtTime(ev.start)}</span><span>${ev.title}</span></div>`)
              : html`<span class="muted" style="font-size:14px">Just school today</span>`}
          </button>`;
        })}
      </div>
      ${this._cheer ? keyed(this._cheer, confetti(this._cheer)) : nothing}`;
  }
}
if (!customElements.get('fh-morning')) customElements.define('fh-morning', FhMorning);
