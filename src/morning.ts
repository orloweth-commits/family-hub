import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './styles';
import { LookController, getLook, lookArt } from './looks';
import { confetti, fxCss } from './fx';
import { avatarCss, decodeLook, renderAvatar } from './avatar';
import { addDays, fmtTime, sameDay, startOfDay, whenOn } from './dates';
import { kidEntities, slotVar, type BringRule, type CalEvent, type Hass, type KidConfig } from './types';
import { changed, hm, minsNow, parseChore, sfx, type Chore, type ParsedChore } from './util';

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
/** Is this event on that day? The planner's own rule, so an event that began yesterday and is still running (a camp) shows here too. */
const onDay = (ev: CalEvent, d: Date): boolean => { const s = startOfDay(d), e = addDays(s, 1); return ev.start < e && ev.end > s && !(ev.allDay && ev.end.getTime() === s.getTime()); };
const star = (on: boolean): TemplateResult => html`<svg class="tstar ${on ? 'lit' : ''}" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 2.800l2.850 5.900 6.450.900-4.700 4.550 1.150 6.450L12 17.500l-5.750 3.100 1.150-6.450L2.700 9.600l6.450-.900z"></path></svg>`;

/** A picture for something to bring or wear, for a child who cannot read yet: the emoji already in its name, or one that fits the words. */
const TILE_PICS: [RegExp, string][] = [[/hat|cap/i, '🧢'], [/sunscreen|sun cream/i, '🧴'], [/library|book|reader/i, '📚'], [/swim|bathers|togs|towel/i, '🩱'], [/sport|uniform|shirt/i, '👕'], [/shoe|runner|boot/i, '👟'], [/jumper|jacket|coat|rain/i, '🧥'],
  [/lunch|sandwich/i, '🥪'], [/fruit|snack|crunch/i, '🍎'], [/water|drink|bottle/i, '🚰'], [/trumpet/i, '🎺'], [/clarinet|recorder|flute/i, '🎶'], [/violin|guitar/i, '🎻'], [/music|instrument|band/i, '🎵'], [/homework|note|form|slip/i, '📝'],
  [/tennis|racquet/i, '🎾'], [/ball|soccer|footy|netball/i, '⚽'], [/scooter|bike|helmet/i, '🛴'], [/toy|teddy|show/i, '🧸'], [/art|paint|smock/i, '🎨']];
export const tileOf = (item: string): [string, string] => {
  const m = /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/u.exec(item);
  const name = item.replace(/\p{Extended_Pictographic}|\uFE0F|\u200D/gu, '').trim() || item;
  return [m ? m[0] : TILE_PICS.find(([re]) => re.test(item))?.[1] ?? '🎒', name];
};
/**
 * "Out the door": the school-morning board.
 * Progress is shown for the team as a whole (one row of stars everyone fills together, and one pooled line of words), never child
 * against child: a column says when that child leaves, what to bring and what is on today. Nothing in a column says how far
 * through the morning its child is, because three columns side by side would turn that into a race.
 */
export class FhMorning extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, css`
    :host { display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; position: relative; }
    .board { border-radius: 26px; padding: 12px 20px; display: flex; align-items: center; gap: 18px; }
    .team { flex: 1.4; display: flex; flex-direction: column; gap: 4px; align-items: center; }
    /* the stars sit in balanced rows (5 and 4, never 8 and a lone one) where the browser can balance; otherwise they wrap as before */
    .stars { display: block; text-align: center; text-wrap: balance; line-height: 0; } .stars > * { display: inline-block; margin: 1px 2px; vertical-align: top; }
    .tstar path { fill: none; stroke: var(--ink2); stroke-width: 1.500; stroke-linejoin: round; }
    .tstar.lit path { fill: #f5b301; stroke: #8a5a00; }
    .tstar.lit { animation: starpop var(--m-5, 900ms) cubic-bezier(.3,1.8,.5,1) both; }
    .label { font-size: 14px; }
    @keyframes starpop { from { transform: scale(calc(1 - .8 * var(--m-d, 1))) rotate(calc(-40deg * var(--m-d, 1))); } }
    .teambar { width: 100%; height: 14px; border-radius: 7px; background: var(--track); overflow: hidden; }
    .teambar > div { height: 100%; border-radius: 7px; background: #f5b301; box-shadow: inset 0 0 0 1.5px #8a5a00; transition: width var(--mt-5, 900ms); }
    .leave { font-family: 'Bricolage Grotesque', sans-serif; font-size: 36px; font-weight: var(--w-heavy, 800); line-height: 1; font-variant-numeric: tabular-nums; }
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
    .khead { display: flex; align-items: center; gap: 12px; }
    .khead h2 { font-size: 24px; font-weight: var(--w-heavy, 800); flex: 1; }
    /* the one line about jobs on this board, pooled for the whole family */
    .nextstep { padding: 6px 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-bold, 700); text-align: center; }
    .nextstep.set { background: color-mix(in srgb, var(--ok) 20%, var(--chip)); }
    .bring { display: flex; flex-wrap: wrap; gap: 8px; }
    .bring span { padding: 7px 12px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 18%, var(--chip)); font-size: 15px; font-weight: var(--w-bold, 700); }
    .lchip { font-size: 15px; font-weight: var(--w-heavy, 800); padding: 8px 12px; border-radius: 12px; background: var(--chip); display: flex; justify-content: space-between; }
    .lchip.soon { background: color-mix(in srgb, var(--accent) 32%, var(--chip)); }
    .lchip.now { background: color-mix(in srgb, var(--accent) 55%, var(--chip)); animation: hop var(--m-5, 900ms) cubic-bezier(.3,1.5,.5,1) 3; }
    /* what the whole family has on is said once, across the top, not in every column */
    .fam { border-radius: 22px; padding: 8px 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; flex-shrink: 0; }
    .fam .fev { display: inline-flex; align-items: baseline; gap: 8px; padding: 7px 14px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-bold, 700); }
    .fam .fev .mt { color: var(--ink2); font-weight: var(--w-semi, 600); white-space: nowrap; }
    /* the lower half of each column is for someone who cannot read yet: a bar that fills as leaving time comes, and a picture for each thing to bring or wear */
    .klow { margin-top: auto; display: flex; flex-direction: column; gap: 10px; padding-top: 8px; }
    .kgo { display: flex; flex-direction: column; gap: 6px; }
    .kgo .gobar { position: relative; height: 28px; border-radius: 14px; background: var(--track); box-shadow: inset 0 0 0 2px var(--ink2); overflow: hidden; }
    .kgo .gobar > i { position: absolute; inset: 0 auto 0 0; width: var(--f, 0%); min-width: 14px; border-radius: 14px; background: var(--kid); transition: width var(--mt-5, 900ms) var(--e-out, ease); }
    .kgo .gobar > span { position: absolute; right: 3px; top: 50%; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; background: var(--chip-strong); color: var(--ink); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 800; line-height: 1; }
    .kgo.soon .gobar { box-shadow: inset 0 0 0 3px var(--accent); }
    .kgo.now .gobar { animation: hop var(--m-5, 900ms) cubic-bezier(.3,1.5,.5,1) 3; }
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
    // what the whole family has on (the family calendar, not naming one child) is said once across the top
    const fam = this.events.filter((ev) => onDay(ev, today) && ev.colour === 'family' && !priv.some((w) => ev.title.toLowerCase().includes(w)) && !this.kids.some((k) => ev.who === k.name || ev.title.toLowerCase().includes(k.name.toLowerCase())))
      .map((ev, i) => ({ ev, i, k: whenOn(ev, today).sort })).sort((x, y) => x.k - y.k || x.i - y.i).map((x) => x.ev);
    return html`
      <section class="glass board">
        <div style="flex:1"><h1 class="t-title">Out the door</h1>
          <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600)">${this.termLabel}${this.uv >= 3 ? ` · UV ${Math.round(this.uv)} – hats and sunscreen` : ''}</span></div>
        ${team.total ? html`<div class="team" role="img" aria-label="Team morning: ${team.done} of ${team.total} done">
          ${team.total <= 18 ? html`<div class="stars">${Array.from({ length: team.total }, (_, i) => star(i < team.done))}</div>`
            : html`<div class="teambar"><div style="width:${(team.done / team.total) * 100}%"></div></div>`}
          <span class="nextstep ${ready ? 'set' : ''}">${ready ? 'Morning jobs: all done. Go team! 🎉' : `Morning jobs: ${team.total - team.done} to go between us`}</span></div>` : nothing}
        <div style="display:flex;align-items:center;gap:14px;justify-content:flex-end;flex:1">
          ${left > 0 ? lookArt(getLook(), 'timer', { frac: Math.min(1, left / 60), size: 64 }) : nothing}
          <div style="text-align:right"><div class="leave ${left <= 0 && left > -5 ? 'go' : ''}">${left > 0 ? `${left} min` : left > -5 ? 'Time to go!' : 'Have a great day'}</div>
            <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600)">${next && left > 0 ? `until ${who} at ${t12(next.at)}` : ''}</span></div></div>
      </section>
      ${fam.length ? html`<section class="glass fam" aria-label="Everyone today"><span class="label">Everyone today</span>${fam.slice(0, 4).map((ev) => html`<span class="fev"><span class="mt">${whenOn(ev, today).label}</span><span>${ev.title}</span></span>`)}</section>` : nothing}
      <div class="kcols" style="--n:${this.kids.length}">
        ${this.kids.map((k) => {
          const e = kidEntities(k);
          const look = decodeLook(this.hass!.states[e.avatar]?.state, k.look ? decodeLook(k.look) : {});
          const evs = this._own(k);
          const bring = this._bring(k, evs);
          const lv = legs.find((l) => l.k === k)!, kl = lv.at - nowM;
          const goCls = kl <= 0 && kl > -5 ? 'now' : kl <= 10 && kl > 0 ? 'soon' : '';
          return html`<button class="glass kcol tap" style="--kid:${slotVar(k.colour)}" aria-label=${`${k.name}: ${kl > 0 ? `leaves at ${t12(lv.at)}, in ${kl} minutes` : kl > -5 ? 'time to go' : 'has left'}${bring.length ? `. Bring and wear: ${bring.map((x) => tileOf(x)[1]).join(', ')}` : ''}. Opens ${k.name}’s page`} @click=${() => this.dispatchEvent(new CustomEvent('open-kid', { detail: k.name }))}>
            <div class="khead">${renderAvatar(look, { size: 60, crop: 'head', jump: this._cheer, age: k.age, ring: slotVar(k.colour) })}<h2>${k.name}</h2></div>
            <span class="label">Today</span>
            ${evs.length ? evs.slice(0, 3).map((ev) => html`<div class="mev2"><span class="mt">${whenOn(ev, today).label}</span><span>${ev.title}</span></div>`)
              : html`<span class="muted" style="font-size:15px">Just school today</span>`}
            <div class="klow">
              <div class="kgo ${goCls}" data-part="countdown">
                <div class="gobar" style="--f:${Math.round(Math.max(0, Math.min(1, 1 - kl / 60)) * 100)}%"><i></i><span aria-hidden="true">${kl > -5 ? '🚪' : '✓'}</span></div>
                <div class="lchip ${goCls}"><span>Leave ${t12(lv.at)}${lv.why !== 'school' ? ` · ${lv.why}` : ''}</span><span>${kl > 0 ? `${kl} min` : kl > -5 ? 'Go!' : '✓'}</span></div>
              </div>
              ${bring.length ? html`<div class="tiles" data-part="bring">${bring.map((x) => { const [pic, name] = tileOf(x); return html`<span class="tile"><span class="te" aria-hidden="true">${pic}</span><span class="tl">${name}</span></span>`; })}</div>` : nothing}
            </div>
          </button>`;
        })}
      </div>
      ${this._cheer ? keyed(this._cheer, confetti(this._cheer)) : nothing}`;
  }
}
if (!customElements.get('fh-morning')) customElements.define('fh-morning', FhMorning);
