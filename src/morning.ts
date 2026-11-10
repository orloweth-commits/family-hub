import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { avatarCss, decodeLook, renderAvatar } from './avatar';
import { fmtTime, sameDay } from './dates';
import { kidEntities, slotVar, type BringRule, type CalEvent, type Hass, type KidConfig } from './types';
import { changed, hm, minsNow, parseChore, type Chore, type ParsedChore } from './util';
import { picFor } from './kid';

const DOW = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** "Out the door": school-morning overview, one column per child. */
export class FhMorning extends LitElement {
  static styles = [styles, css`
    :host { display: flex; flex-direction: column; gap: 14px; flex: 1; min-height: 0; }
    .top { border-radius: 26px; padding: 14px 20px; display: flex; align-items: center; gap: 18px; }
    .leave { font-family: 'Bricolage Grotesque', sans-serif; font-size: 40px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
    .leave.soon { color: #dc2626; animation: pulse 1.2s ease-in-out infinite; }
    .cols { flex: 1; min-height: 0; display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 14px; }
    .col { border-radius: 26px; padding: 16px; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow: hidden; text-align: left; border-top: 6px solid var(--kid); }
    .who { display: flex; align-items: center; gap: 12px; }
    .who h2 { font-size: 24px; font-weight: 800; flex: 1; }
    .bar { height: 12px; border-radius: 6px; background: var(--track); overflow: hidden; }
    .bar > div { height: 100%; border-radius: 6px; background: var(--ok); transition: width .6s; }
    .steps { display: flex; flex-wrap: wrap; gap: 8px; }
    .step { display: flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: 600; }
    .step.done { background: color-mix(in srgb, var(--ok) 22%, var(--chip)); text-decoration: line-through; color: var(--ink3); }
    .bring { display: flex; flex-wrap: wrap; gap: 8px; }
    .bring span { padding: 7px 12px; border-radius: 12px; background: color-mix(in srgb, var(--accent) 18%, var(--chip)); font-size: 15px; font-weight: 700; }
    .go { font-size: 15px; font-weight: 800; padding: 7px 12px; border-radius: 12px; background: var(--chip); display: flex; justify-content: space-between; }
    .go.soon { background: #dc2626; color: #fff; }
    .mev2 { display: flex; gap: 10px; font-size: 15px; font-weight: 600; }
    .mev2 .t { width: 72px; color: var(--ink2); flex-shrink: 0; }
    @keyframes pulse { 50% { opacity: .55; } }
    ${unsafeCSS(avatarCss)}
  `];
  static properties = { hass: { attribute: false }, kids: { attribute: false }, events: { attribute: false }, leaveBy: {}, rules: { attribute: false },
    privateWords: { attribute: false }, uv: { type: Number }, termLabel: {}, travel: { type: Number }, _items: { state: true }, _now: { state: true } };
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
    return html`
      <section class="glass top">
        <div style="flex:1"><h1 style="font-size:28px;font-weight:800">Out the door</h1>
          <span class="muted" style="font-size:15px;font-weight:600">${this.termLabel}${this.uv >= 3 ? ` · UV ${Math.round(this.uv)} – hats and sunscreen` : ''}</span></div>
        <div style="text-align:right"><div class="leave ${left <= 10 && left > -5 ? 'soon' : ''}">${left > 0 ? `${left} min` : left > -5 ? 'Time to go!' : 'Have a great day'}</div>
          <span class="muted" style="font-size:14px;font-weight:600">${next && left > 0 ? `until ${who} at ${t12(next.at)}` : ''}</span></div>
      </section>
      <div class="cols" style="--n:${this.kids.length}">
        ${this.kids.map((k) => {
          const e = kidEntities(k);
          const look = decodeLook(this.hass!.states[e.avatar]?.state, k.look ? decodeLook(k.look) : {});
          const steps = (this._items[k.name] ?? []).filter((c) => c.lane === 'routine' && c.slot === 'am');
          const done = steps.filter((c) => c.status === 'completed').length;
          const evs = this.events.filter((ev) => sameDay(ev.start, today) && !priv.some((w) => ev.title.toLowerCase().includes(w)) && (ev.who === k.name || ev.colour === 'family' || ev.title.toLowerCase().includes(k.name.toLowerCase())));
          const bring = this._bring(k, evs);
          const lv = legs.find((l) => l.k === k)!, kl = lv.at - nowM;
          return html`<button class="glass col tap" style="--kid:${slotVar(k.colour)}" @click=${() => this.dispatchEvent(new CustomEvent('open-kid', { detail: k.name }))}>
            <div class="who">${renderAvatar(look, { size: 56, crop: 'head', still: true, age: k.age, ring: slotVar(k.colour) })}<h2>${k.name}</h2>
              <span style="font-size:15px;font-weight:800">${steps.length ? (done === steps.length ? '✅ Ready' : `${done}/${steps.length}`) : ''}</span></div>
            <div class="go ${kl <= 10 && kl > -5 ? 'soon' : ''}"><span>Leave ${t12(lv.at)}${lv.why !== 'school' ? ` · ${lv.why}` : ''}</span><span>${kl > 0 ? `${kl} min` : kl > -5 ? 'Go!' : '✓'}</span></div>
            ${steps.length ? html`<div class="bar"><div style="width:${(done / steps.length) * 100}%"></div></div>
              <div class="steps">${steps.map((c) => html`<span class="step ${c.status === 'completed' ? 'done' : ''}">${picFor(c.summary)} ${c.summary}</span>`)}</div>` : nothing}
            ${bring.length ? html`<span class="label">Bring</span><div class="bring">${bring.map((b) => html`<span>${b}</span>`)}</div>` : nothing}
            <span class="label">Today</span>
            ${evs.length ? evs.slice(0, 4).map((ev) => html`<div class="mev2"><span class="t">${ev.allDay ? 'All day' : fmtTime(ev.start)}</span><span>${ev.title}</span></div>`)
              : html`<span class="muted" style="font-size:14px">Just school today</span>`}
          </button>`;
        })}
      </div>`;
  }
}
if (!customElements.get('fh-morning')) customElements.define('fh-morning', FhMorning);
