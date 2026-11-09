import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { icon } from './icons';
import { avatarCss, decodeLook, level, nextUnlock, prevThreshold, renderAvatar, unlocksBetween, applyItem, type Look, type Unlock } from './avatar';
import { confetti, fxCss } from './fx';
import { addDays, fmtDow, fmtTime, sameDay, startOfDay } from './dates';
import { kidEntities, num, slotVar, type Hass, type KidConfig, type RewardConfig } from './types';
import './studio';
import './pin';

interface Chore { uid: string; summary: string; status: 'needs_action' | 'completed'; description?: string }
interface KEvent { title: string; start: Date; allDay: boolean; family: boolean }

const pts = (c: Chore): number => { const m = /(\d+)/.exec(c.description ?? ''); return m ? Number(m[1]) : 10; };

/** Picture-mode icons for common jobs (first keyword match wins). */
const PICS: [RegExp, string][] = [
  [/teeth|tooth/i, '🪥'], [/dress|clothes/i, '👕'], [/breakfast|lunch|dinner|eat/i, '🥣'], [/toy/i, '🧸'], [/shoe/i, '👟'],
  [/book|read/i, '📚'], [/bed/i, '🛏️'], [/bath|shower|wash/i, '🛁'], [/table/i, '🍽️'], [/dish/i, '🍽️'], [/bag/i, '🎒'],
  [/trumpet/i, '🎺'], [/clarinet|practice|music/i, '🎵'], [/homework|school/i, '✏️'], [/tidy|clean|room/i, '🧹'],
  [/scooter/i, '🛴'], [/swim/i, '🏊'], [/dog|cat|pet|feed/i, '🐾'], [/water|plant/i, '🪴'], [/bin|rubbish/i, '🗑️']
];
const picFor = (s: string): string => PICS.find(([re]) => re.test(s))?.[1] ?? '⭐';

const DEFAULT_REWARDS: RewardConfig[] = [{ name: 'Extra screen time', cost: 50 }, { name: 'Pick dessert', cost: 60 }, { name: 'Park trip', cost: 100 }];

export class FhKid extends LitElement {
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .hero { width: 330px; flex-shrink: 0; border-radius: 28px; padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: -40% -20% auto; height: 70%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 45%, transparent), transparent); pointer-events: none; }
    .name { font-size: 34px; font-weight: 800; line-height: 1; }
    .lvl { padding: 5px 12px; border-radius: 999px; background: var(--kid); color: var(--on-person); font-size: 13px; font-weight: 800; letter-spacing: .03em; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
    .stat { border-radius: 18px; background: var(--chip); padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; position: relative; }
    .stat b { font-family: 'Bricolage Grotesque', sans-serif; font-size: 30px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
    .stat span { font-size: 12px; font-weight: 600; color: var(--ink2); }
    .next { width: 100%; display: flex; align-items: center; gap: 10px; border-radius: 18px; background: var(--chip); padding: 8px 12px 8px 8px; }
    .jobs { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; }
    .list { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 8px; }
    .job { display: flex; align-items: center; gap: 14px; padding: 13px 14px; border-radius: 18px; background: var(--chip); text-align: left; width: 100%; position: relative; }
    .job .box { width: 32px; height: 32px; border-radius: 50%; border: 2.5px solid var(--ink3); flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all .25s cubic-bezier(.2,1.4,.4,1); }
    .job.done .box { background: var(--ok); border-color: var(--ok); color: #fff; transform: scale(1.1); }
    .job.done .t { color: var(--ink3); text-decoration: line-through; }
    .job .t { flex: 1; font-size: 18px; font-weight: 600; }
    .plus { font-size: 13px; font-weight: 800; padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, var(--kid) 22%, transparent); }
    .pics { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; align-content: start; }
    .pic { border-radius: 24px; background: var(--chip); padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; transition: transform .2s; }
    .pic .e { font-size: 58px; line-height: 1.1; transition: transform .3s cubic-bezier(.2,1.6,.4,1); }
    .pic.done { background: color-mix(in srgb, var(--ok) 25%, var(--chip)); }
    .pic.done .e { transform: scale(.85) rotate(-8deg); opacity: .6; }
    .pic .tick { position: absolute; top: 10px; right: 10px; width: 34px; height: 34px; border-radius: 50%; background: var(--ok); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; animation: avPop .4s cubic-bezier(.2,1.4,.4,1); }
    .stars { color: #f5b301; font-size: 18px; letter-spacing: 2px; }
    .side { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; min-height: 0; }
    .rw { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 14px; background: var(--chip); }
    .rw .n { flex: 1; font-size: 15px; font-weight: 600; }
    .rw button { height: 34px; padding: 0 12px; border-radius: 999px; font-size: 13px; font-weight: 700; background: var(--primary); color: var(--on-primary); }
    .rw button[disabled] { background: var(--track); color: var(--ink3); cursor: default; }
    .wk { display: flex; gap: 10px; font-size: 14px; align-items: baseline; }
    .wk .d { width: 74px; flex-shrink: 0; font-weight: 700; color: var(--ink2); font-size: 13px; }
    .ring { position: relative; width: 52px; height: 52px; }
    .ring svg { transform: rotate(-90deg); }
    .ring b { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; }
    .celebrate { position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); border-radius: 28px; }
    .cbox { border-radius: 32px; padding: 26px 30px; display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 720px; animation: sheet .5s cubic-bezier(.2,1.3,.3,1) both; }
    .unl { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .unl > div { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; animation: avPop .6s cubic-bezier(.2,1.4,.4,1) both; }
    @keyframes avPop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
    ${unsafeCSS(avatarCss)}
    ${unsafeCSS(fxCss)}
  `];

  static properties = {
    hass: { attribute: false }, kid: { attribute: false }, familyCalendars: { attribute: false }, pin: {}, reminders: {},
    _chores: { state: true }, _events: { state: true }, _jump: { state: true }, _bursts: { state: true }, _confetti: { state: true },
    _studio: { state: true }, _celebrate: { state: true }, _pinFor: { state: true }, _msg: { state: true }
  };

  hass?: Hass;
  kid!: KidConfig;
  familyCalendars: string[] = [];
  pin = '';
  reminders = '';
  private _chores: Chore[] = [];
  private _events: KEvent[] = [];
  private _jump = 0;
  private _bursts: { id: number; n: number }[] = [];
  private _confetti = 0;
  private _studio = false;
  private _celebrate: Unlock[] | null = null;
  private _pinFor: RewardConfig | null = null;
  private _msg = '';
  private _unsub?: () => void;
  private _subFor = '';
  private _evFor = '';
  private _busy = new Set<string>();

  disconnectedCallback(): void { super.disconnectedCallback(); this._unsub?.(); this._subFor = ''; }

  protected updated(ch: PropertyValues): void {
    if (!this.hass || !this.kid) return;
    const e = kidEntities(this.kid);
    if (this._subFor !== e.chores && this.hass.connection) {
      this._unsub?.(); this._subFor = e.chores; this._chores = [];
      this.hass.connection.subscribeMessage<{ items: Chore[] }>((m) => { this._chores = m.items; }, { type: 'todo/item/subscribe', entity_id: e.chores })
        .then((u) => { this._unsub = u; }).catch(() => { this._chores = []; });
    }
    if (this._evFor !== this.kid.name) { this._evFor = this.kid.name; this._loadWeek(); }
    if (ch.has('hass')) this._checkUnlocks();
  }

  private get _e() { return kidEntities(this.kid); }
  private get _life(): number { return num(this.hass, this._e.lifetime); }
  private get _look(): Look { return decodeLook(this.hass?.states[this._e.avatar]?.state, this.kid.look ? decodeLook(this.kid.look) : {}); }
  private get _seenKey(): string { return `family-hub-seen-${this.kid.name.toLowerCase()}`; }

  private _checkUnlocks(): void {
    const st = this.hass?.states[this._e.lifetime];
    if (!st || this._celebrate) return;
    const life = this._life;
    let seen: number | null = null;
    try { const s = localStorage.getItem(this._seenKey); seen = s === null ? null : Number(s); } catch { /* */ }
    if (seen === null || life < seen) { try { localStorage.setItem(this._seenKey, String(life)); } catch { /* */ } return; }
    const fresh = unlocksBetween(seen, life);
    if (fresh.length) { this._celebrate = fresh; this._confetti++; }
    else if (life !== seen) { try { localStorage.setItem(this._seenKey, String(life)); } catch { /* */ } }
  }
  private _closeCelebrate(open: boolean): void {
    try { localStorage.setItem(this._seenKey, String(this._life)); } catch { /* */ }
    this._celebrate = null;
    if (open) this._studio = true;
  }

  private async _loadWeek(): Promise<void> {
    if (!this.hass) return;
    const a = startOfDay(new Date()), b = addDays(a, 7);
    const cals = [{ id: this._e.calendar, family: false }, ...this.familyCalendars.map((id) => ({ id, family: true }))].filter((c) => this.hass!.states[c.id]);
    const out: KEvent[] = [];
    await Promise.all(cals.map(async (c) => {
      try {
        const rows = await this.hass!.callApi<any[]>('GET', `calendars/${c.id}?start=${encodeURIComponent(a.toISOString())}&end=${encodeURIComponent(b.toISOString())}`);
        for (const r of rows) out.push({ title: r.summary ?? '(busy)', start: r.start?.date ? new Date(`${r.start.date}T00:00:00`) : new Date(r.start.dateTime), allDay: !!r.start?.date, family: c.family });
      } catch { /* ignore */ }
    }));
    out.sort((x, y) => x.start.getTime() - y.start.getTime());
    this._events = out;
  }

  private async _addPoints(n: number, lifetimeToo = true): Promise<void> {
    const h = this.hass!, e = this._e;
    const set = (id: string, v: number) => h.states[id] ? h.callService('input_number', 'set_value', { entity_id: id, value: Math.max(0, Math.min(100000, v)) }) : Promise.resolve();
    await Promise.all([set(e.points, num(h, e.points) + n), lifetimeToo ? set(e.lifetime, num(h, e.lifetime) + n) : Promise.resolve()]);
  }

  private async _toggle(c: Chore): Promise<void> {
    if (!this.hass || this._busy.has(c.uid)) return;
    this._busy.add(c.uid);
    const done = c.status === 'completed', n = pts(c);
    this._chores = this._chores.map((x) => x.uid === c.uid ? { ...x, status: done ? 'needs_action' : 'completed' } : x);
    try {
      await this.hass.callService('todo', 'update_item', { item: c.uid, status: done ? 'needs_action' : 'completed' }, { entity_id: this._e.chores });
      await this._addPoints(done ? -n : n);
      if (!done) {
        this._jump++;
        const id = Date.now();
        this._bursts = [...this._bursts, { id, n }];
        setTimeout(() => { this._bursts = this._bursts.filter((b) => b.id !== id); }, 1300);
        if (this._chores.every((x) => x.status === 'completed')) { this._confetti++; this._say(`All done, ${this.kid.name}! Legend.`); }
      }
    } catch (err) { console.warn('Family Hub: chore update failed', err); this._say('Couldn’t update that one – try again'); }
    finally { this._busy.delete(c.uid); }
  }

  private _redeem(r: RewardConfig, checked = false): void {
    const have = num(this.hass, this._e.points);
    if (have < r.cost) { this._say(`${r.cost - have} more points needed`); return; }
    if (this.pin && !checked) { this._pinFor = r; return; }
    this._pinFor = null;
    this._addPoints(-r.cost, false);
    if (this.reminders && this.hass?.states[this.reminders]) this.hass.callService('todo', 'add_item', { item: `${this.kid.name} redeemed: ${r.name}` }, { entity_id: this.reminders });
    this._confetti++;
    this._jump++;
    this._say(`Enjoy your ${r.name.toLowerCase()}!`);
  }

  private _msgTimer?: number;
  private _say(m: string): void { this._msg = m; clearTimeout(this._msgTimer); this._msgTimer = window.setTimeout(() => { this._msg = ''; }, 2600); }

  render(): TemplateResult | typeof nothing {
    if (!this.kid || !this.hass) return nothing;
    if (this._studio) return html`<fh-studio .hass=${this.hass} .kid=${this.kid} .look=${this._look} .life=${this._life} @close=${() => { this._studio = false; this._jump++; }}></fh-studio>`;
    const e = this._e, h = this.hass, life = this._life, look = this._look;
    const missing = !h.states[e.points] || !h.states[e.chores];
    return html`<div style="display:contents;--kid:${slotVar(this.kid.colour)}">
      ${this._hero(life, look)}
      ${missing ? html`<section class="glass jobs"><div class="empty"><h2 style="font-size:22px">Set up ${this.kid.name}’s page</h2>
        <span>Create <b>${e.chores}</b> and <b>${e.points}</b> in Home Assistant, or point this kid at your own entities in the card settings.</span></div></section>` : this._jobs()}
      <div class="side">${this._rewards()}${this._week()}</div>
      ${this._bursts.map((b) => html`<span class="burst" style="left:200px;top:300px">+${b.n}</span>`)}
      ${this._confetti ? confetti(this._confetti) : nothing}
      ${this._celebrate ? this._celebration(look) : nothing}
      ${this._pinFor ? html`<fh-pin .pin=${this.pin} reason=${`Redeem ${this._pinFor.name}?`} @ok=${() => this._redeem(this._pinFor!, true)} @cancel=${() => { this._pinFor = null; }}></fh-pin>` : nothing}
      ${this._msg ? html`<div class="toast" role="status">${this._msg}</div>` : nothing}
    </div>`;
  }

  private _hero(life: number, look: Look): TemplateResult {
    const e = this._e, h = this.hass!;
    const lv = level(life), xp = life % 100;
    const nx = nextUnlock(life), from = prevThreshold(life);
    const pct = nx ? Math.round(((life - from) / (nx.req - from)) * 100) : 100;
    const streak = num(h, e.streak);
    return html`<section class="glass hero" aria-label="${this.kid.name}’s avatar">
      <button class="tap" style="position:relative" aria-label="Make ${this.kid.name} jump" @click=${() => { this._jump++; }}>${renderAvatar(look, { size: 200, jump: this._jump, label: `${this.kid.name}’s avatar` })}</button>
      <div style="display:flex;align-items:center;gap:10px;z-index:1"><h1 class="name">${this.kid.name}</h1><span class="lvl">LVL ${lv}</span></div>
      <div style="width:100%;display:flex;flex-direction:column;gap:5px"><div class="xp"><div style="width:${xp}%"></div></div>
        <span class="muted" style="font-size:12px;font-weight:600;text-align:right">${100 - xp} XP to level ${lv + 1}</span></div>
      <div class="stats">
        <div class="stat"><b>${num(h, e.points)}</b><span>points to spend</span></div>
        <div class="stat"><b>${streak}${streak >= 3 ? '🔥' : ''}</b><span>day streak</span></div>
      </div>
      ${nx ? html`<div class="next">
        <span class="shimmer" style="border-radius:50%;line-height:0">${renderAvatar(applyItem(look, nx.cat, nx.id, nx.swatch), { size: 46, crop: nx.cat.crop === 'head' ? 'head' : 'head', still: true })}</span>
        <span style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0"><span style="font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Next: ${nx.label}</span>
          <div class="xp" style="height:7px"><div style="width:${pct}%"></div></div>
          <span class="muted" style="font-size:11px;font-weight:600">${nx.req - life} points to go · ${life} earned all-time</span></span>
      </div>` : html`<div class="next"><span style="font-size:13px;font-weight:700;padding:6px">Everything unlocked. Absolute legend.</span></div>`}
      <button class="pill tap primary" style="height:50px;width:100%;justify-content:center;font-size:16px;margin-top:auto" @click=${() => { this._studio = true; }}>${icon('star', 20)}Style studio</button>
    </section>`;
  }

  private _jobs(): TemplateResult {
    const list = this._chores, done = list.filter((c) => c.status === 'completed').length, total = list.length;
    const mode = this.kid.mode ?? 'text', C = 2 * Math.PI * 22, frac = total ? done / total : 0;
    return html`<section class="glass jobs" aria-label="Jobs">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="flex:1"><h1 style="font-size:26px;font-weight:800">${mode === 'picture' ? 'My jobs' : 'Today’s jobs'}</h1>
          <span class="muted" style="font-size:13px">${total ? (done === total ? 'All done – nice work!' : `${total - done} to go · resets overnight`) : 'No jobs yet'}</span></div>
        <div class="ring" aria-label="${done} of ${total} done"><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="var(--track)" stroke-width="6"></circle>
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--ok)" stroke-width="6" stroke-linecap="round" stroke-dasharray=${C} stroke-dashoffset=${C * (1 - frac)} style="transition:stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)"></circle></svg><b>${done}/${total}</b></div>
      </div>
      ${mode === 'picture' ? html`<div class="pics">${list.map((c) => {
        const d = c.status === 'completed', stars = Math.max(1, Math.round(pts(c) / 10));
        return html`<button class="pic tap ${d ? 'done' : ''}" aria-pressed=${String(d)} @click=${() => this._toggle(c)}>
          <span class="e">${picFor(c.summary)}</span><span style="font-size:16px;font-weight:700">${c.summary}</span>
          <span class="stars">${'★'.repeat(stars)}</span>${d ? html`<span class="tick">✓</span>` : nothing}</button>`;
      })}</div>` : html`<div class="list">${list.map((c) => {
        const d = c.status === 'completed';
        return html`<button class="job tap ${d ? 'done' : ''}" aria-pressed=${String(d)} @click=${() => this._toggle(c)}>
          <span class="box">${d ? '✓' : ''}</span>
          ${mode === 'mixed' ? html`<span style="font-size:28px">${picFor(c.summary)}</span>` : nothing}
          <span class="t">${c.summary}</span><span class="plus">+${pts(c)}</span></button>`;
      })}</div>`}
    </section>`;
  }

  private _rewards(): TemplateResult {
    const have = num(this.hass, this._e.points), list = this.kid.rewards ?? DEFAULT_REWARDS;
    return html`<section class="glass card" aria-label="Rewards">
      <span class="label">Rewards</span>
      ${list.map((r) => html`<div class="rw"><span style="font-size:22px">${r.icon ?? '🎁'}</span><span class="n">${r.name}</span>
        <button class="tap" ?disabled=${have < r.cost} @click=${() => this._redeem(r)}>${r.cost} pts</button></div>`)}
    </section>`;
  }

  private _week(): TemplateResult {
    const today = new Date(), evs = this._events.slice(0, 7);
    return html`<section class="glass card" style="flex:1;min-height:0;overflow:hidden" aria-label="${this.kid.name}’s week">
      <span class="label">${this.kid.name}’s week</span>
      ${evs.length ? evs.map((e) => html`<div class="wk"><span class="d">${sameDay(e.start, today) ? 'Today' : sameDay(e.start, addDays(today, 1)) ? 'Tomorrow' : fmtDow(e.start)}</span>
        <span style="flex:1;font-weight:600;display:flex;gap:6px;align-items:baseline"><span class="dot" style="width:8px;height:8px;background:${e.family ? 'var(--p-family)' : 'var(--kid)'}"></span>
          <span>${e.title}${e.allDay ? '' : html` <span class="muted" style="font-weight:500">· ${fmtTime(e.start)}</span>`}</span></span></div>`)
        : html`<span class="muted" style="font-size:14px">Nothing on this week.</span>`}
    </section>`;
  }

  private _celebration(look: Look): TemplateResult {
    const items = this._celebrate!;
    return html`<div class="celebrate" @click=${(e: Event) => { if (e.target === e.currentTarget) this._closeCelebrate(false); }}>
      <div class="glass cbox" role="dialog" aria-label="New unlocks">
        <span class="lvl" style="font-size:14px">NEW UNLOCK${items.length > 1 ? 'S' : ''}</span>
        <h1 style="font-size:36px;font-weight:800;text-align:center">${this.kid.name}, you unlocked ${items.length > 1 ? `${items.length} things` : items[0].label}!</h1>
        <div class="unl">${items.slice(0, 8).map((u, i) => html`<div style="animation-delay:${0.15 + i * 0.12}s">
          ${renderAvatar(applyItem(look, u.cat, u.id, u.swatch), { size: 96, crop: u.cat.crop, still: true })}${u.label}</div>`)}</div>
        <div style="display:flex;gap:12px"><button class="pill tap" style="height:50px;padding:0 20px" @click=${() => this._closeCelebrate(false)}>Later</button>
          <button class="pill tap primary" style="height:50px;padding:0 22px;font-size:16px" @click=${() => this._closeCelebrate(true)}>${icon('star', 18)}Try it on</button></div>
      </div>
    </div>`;
  }
}
if (!customElements.get('fh-kid')) customElements.define('fh-kid', FhKid);
