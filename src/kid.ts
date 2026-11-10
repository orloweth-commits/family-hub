import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { styles } from './styles';
import { icon } from './icons';
import {
  avatarCss, decodeLook, levelInfo, nextUnlock, prevThreshold, renderAvatar, unlocksBetween, growBetween, applyItem, type Look, type Unlock
} from './avatar';
import { confetti, fxCss } from './fx';
import { addDays, fmtDow, fmtTime, sameDay, startOfDay } from './dates';
import { kidEntities, num, slotVar, type Hass, type KidConfig, type RewardConfig } from './types';
import { bedtimeFor, hm, changed, daySlot, parseChore, say, sfx, windDown, type Chore, type ParsedChore, type Sfx, type Slot } from './util';
import './studio';
import './pin';

interface KEvent { title: string; start: Date; allDay: boolean; family: boolean }

/** Picture-mode icons for common jobs (first keyword match wins). */
const PICS: [RegExp, string][] = [
  [/teeth|tooth/i, '🪥'], [/dress|clothes|pyjama/i, '👕'], [/bowl|breakfast|dish|plate|sink/i, '🥣'], [/toy/i, '🧸'], [/shoe|hat/i, '👟'],
  [/story|book|read/i, '📚'], [/bed\b|make bed/i, '🛏️'], [/bath|shower|wash/i, '🛁'], [/table/i, '🍽️'], [/bag/i, '🎒'],
  [/trumpet/i, '🎺'], [/clarinet|practice|music/i, '🎵'], [/homework|school/i, '✏️'], [/tidy|clean|room/i, '🧹'],
  [/scooter/i, '🛴'], [/swim/i, '🏊'], [/dog|cat|pet|feed/i, '🐾'], [/water|plant/i, '🪴'], [/bin|rubbish/i, '🗑️'], [/dishwasher/i, '🍽️']
];
export const picFor = (s: string): string => PICS.find(([re]) => re.test(s))?.[1] ?? '⭐';
const t12 = (s: string): string => { const m = hm(s), h = Math.floor(m / 60) % 24; return `${h % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
const SLOT_NAME: Record<Slot, string> = { am: 'Morning', after: 'After school', bed: 'Bedtime', any: 'Any time' };
const FEELINGS: [string, string][] = [['😄', 'great'], ['🙂', 'good'], ['😐', 'okay'], ['😟', 'worried'], ['😢', 'sad']];
const UNDO_MS = 10 * 60_000;

const DEFAULT_REWARDS: RewardConfig[] = [{ name: 'Pick the family movie', cost: 100 }, { name: 'Choose Friday dinner', cost: 80 }];

const lsGet = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) as T; } catch { return d; } };
const lsSet = (k: string, v: unknown): void => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };

export class FhKid extends LitElement {
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .hero { width: 330px; flex-shrink: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; align-items: center; gap: 10px; position: relative; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: -40% -20% auto; height: 70%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 45%, transparent), transparent); pointer-events: none; }
    .name { font-size: 34px; font-weight: 800; line-height: 1; }
    .rank { padding: 6px 12px; border-radius: 999px; background: var(--kid); color: #fff; font-size: 13px; font-weight: 800; letter-spacing: .02em; }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }
    .stat { border-radius: 18px; background: var(--chip); padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; position: relative; }
    .stat b { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
    .stat span { font-size: 13px; font-weight: 600; color: var(--ink2); }
    .dots { display: flex; gap: 5px; }
    .dots button { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--ink3); padding: 0; }
    .dots button.g { background: var(--ok); border-color: var(--ok); }
    .dots button.o { border-style: dashed; opacity: .55; }
    .dots button.t { box-shadow: 0 0 0 2px var(--chip-strong), 0 0 0 4px var(--kid); }
    .next { width: 100%; display: flex; align-items: center; gap: 10px; border-radius: 18px; background: var(--chip); padding: 8px 12px 8px 8px; }
    .jobs { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
    .list { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 2px; }
    .sec { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; }
    .sec h2 { font-size: 18px; font-weight: 800; }
    .sec span { font-size: 13px; color: var(--ink2); font-weight: 600; }
    .job { display: flex; align-items: center; gap: 14px; padding: 10px 14px; min-height: 54px; flex-shrink: 0; border-radius: 18px; background: var(--chip); text-align: left; width: 100%; position: relative; }
    .job .box { width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid var(--ink3); flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; transition: all .25s cubic-bezier(.2,1.4,.4,1); }
    .job.done .box { background: var(--ok); border-color: var(--ok); transform: scale(1.08); }
    .job.done .t { color: var(--ink3); text-decoration: line-through; }
    .job .t { flex: 1; font-size: 18px; font-weight: 600; }
    .plus { font-size: 14px; font-weight: 800; padding: 5px 10px; border-radius: 999px; background: color-mix(in srgb, var(--kid) 22%, transparent); white-space: nowrap; }
    .grow { background: color-mix(in srgb, var(--ok) 18%, transparent); }
    .play { height: 40px; padding: 0 14px; border-radius: 999px; background: var(--primary); color: var(--on-primary); font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
    .later { padding: 10px 14px; border-radius: 16px; background: var(--chip-soft); font-size: 14px; font-weight: 600; color: var(--ink2); display: flex; justify-content: space-between; }
    .pics { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; align-content: start; }
    .pic { border-radius: 24px; background: var(--chip); padding: 14px 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; min-height: 150px; justify-content: center; }
    .pic .e { font-size: 64px; line-height: 1.1; transition: transform .3s cubic-bezier(.2,1.6,.4,1); }
    .pic.done { background: color-mix(in srgb, var(--ok) 25%, var(--chip)); }
    .pic.done .e { transform: scale(.85) rotate(-8deg); opacity: .6; }
    .pic .tick { position: absolute; top: 10px; right: 10px; width: 38px; height: 38px; border-radius: 50%; background: var(--ok); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 800; animation: avPop .4s cubic-bezier(.2,1.4,.4,1); }
    .stars { color: #f5b301; font-size: 20px; letter-spacing: 2px; }
    .avbtn { position: relative; flex: 0 1 223px; min-height: 110px; display: flex; justify-content: center; }
    .avbtn .avwrap, .avbtn svg { height: 100% !important; width: auto !important; max-height: 223px; }
    .starjar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0 3px; line-height: 1.05; }
    .starjar > i { font-style: normal; color: #f5b301; font-size: 24px; }
    .side { width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; scrollbar-width: none; border-radius: 24px; }
    .side::-webkit-scrollbar { display: none; }
    .side > .card { flex-shrink: 0; }
    .side > .tabcard { flex: 0 1 auto; min-height: 180px; overflow-y: auto; scrollbar-width: none; gap: 8px; }
    .rw { display: flex; align-items: center; gap: 10px; padding: 5px 6px 5px 10px; flex-shrink: 0; border-radius: 14px; background: var(--chip); }
    .rw .n { flex: 1; font-size: 15px; font-weight: 600; line-height: 1.2; }
    .rw button { height: 36px; padding: 0 12px; border-radius: 999px; font-size: 14px; font-weight: 700; background: var(--primary); color: var(--on-primary); white-space: nowrap; }
    .rw button.save { background: var(--track); color: var(--ink2); }
    .jar { display: flex; align-items: center; gap: 12px; }
    .wk { display: flex; gap: 10px; font-size: 14px; align-items: baseline; }
    .wk .d { width: 78px; flex-shrink: 0; font-weight: 700; color: var(--ink2); font-size: 13px; }
    .ring { position: relative; width: 52px; height: 52px; }
    .ring svg { transform: rotate(-90deg); }
    .ring b { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; }
    .feel { display: flex; justify-content: space-between; }
    .tabs { display: flex; gap: 6px; padding: 4px; border-radius: 999px; background: var(--chip-soft); }
    .tab { flex: 1; height: 40px; border-radius: 999px; font-size: 14px; font-weight: 700; color: var(--ink2); }
    .tab[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .feel button { font-size: 30px; width: 46px; height: 46px; border-radius: 50%; }
    .feel button:active { background: var(--chip-strong); }
    .celebrate { position: absolute; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); border-radius: 28px; }
    .cbox { border-radius: 32px; padding: 26px 30px; display: flex; flex-direction: column; align-items: center; gap: 16px; max-width: 720px; animation: sheet .5s cubic-bezier(.2,1.3,.3,1) both; }
    .unl { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
    .unl > div { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; animation: avPop .6s cubic-bezier(.2,1.4,.4,1) both; }
    @keyframes avPop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
    .wind { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; text-align: center; color: var(--ink2); }
    ${unsafeCSS(avatarCss)}
    ${unsafeCSS(fxCss)}
  `];

  static properties = {
    hass: { attribute: false }, kid: { attribute: false }, familyCalendars: { attribute: false }, pin: {}, owed: {}, jarTarget: { type: Number }, jarReward: {},
    privateWords: { attribute: false }, quiet: { type: Boolean },
    _chores: { state: true }, _events: { state: true }, _jump: { state: true }, _bursts: { state: true }, _confetti: { state: true },
    _studio: { state: true }, _celebrate: { state: true }, _pinAsk: { state: true }, _msg: { state: true }, _practice: { state: true }, _now: { state: true }, _feel: { state: true }, _tab: { state: true }
  };

  hass?: Hass;
  kid!: KidConfig;
  familyCalendars: string[] = [];
  pin = '';
  owed = 'todo.rewards_owed';
  jarTarget = 120;
  jarReward = 'a family treat';
  privateWords: string[] = [];
  quiet = false;
  private _chores: ParsedChore[] = [];
  private _events: KEvent[] = [];
  private _jump = 0;
  private _bursts: { id: number; text: string }[] = [];
  private _confetti = 0;
  private _studio = false;
  private _celebrate: Unlock[] | null = null;
  private _pinAsk: { reason: string; run: () => void } | null = null;
  private _msg = '';
  private _practice: { uid: string; end: number; mins: number } | null = null;
  private _now = new Date();
  private _feel = '';
  private _tab: 'rewards' | 'week' = 'rewards';
  private _unsub?: () => void;
  private _subFor = '';
  private _subGen = 0;
  private _evFor = '';
  private _busy = new Set<string>();
  private _tick?: number;

  connectedCallback(): void {
    super.connectedCallback();
    this._tick = window.setInterval(() => { this._now = new Date(); this._checkPractice(); }, 1000);
  }
  disconnectedCallback(): void { super.disconnectedCallback(); this._unsub?.(); this._unsub = undefined; this._subFor = ''; clearInterval(this._tick); }

  private get _e() { return kidEntities(this.kid); }
  private get _star(): number { return this.kid.star ?? 10; }
  private get _jack(): boolean { return this.kid.mode === 'picture'; }
  private get _life(): number { return num(this.hass, this._e.lifetime); }
  private get _grow(): number { return num(this.hass, this._e.grow); }
  private _lookCache: [string, Look] | null = null;
  private get _look(): Look {
    const raw = this.hass?.states[this._e.avatar]?.state ?? '';
    if (this._lookCache?.[0] !== raw) this._lookCache = [raw, decodeLook(raw, this.kid.look ? decodeLook(this.kid.look) : {})];
    return this._lookCache[1];
  }
  private get _wind(): boolean { return windDown(this.kid.bedtime, this._now); }

  protected shouldUpdate(ch: PropertyValues): boolean {
    if (ch.size === 1 && ch.has('hass') && this.kid) {
      const e = this._e;
      return changed(ch.get('hass') as Hass | undefined, this.hass, [e.points, e.lifetime, e.week, e.goal, e.grow, e.avatar, 'input_number.family_jar']);
    }
    if (ch.size === 1 && ch.has('_now')) return this._now.getSeconds() === 0 || !!this._practice;
    return true;
  }

  protected updated(ch: PropertyValues): void {
    if (!this.hass || !this.kid) return;
    const e = this._e;
    if (this._subFor !== e.chores && this.hass.connection) {
      this._unsub?.(); this._unsub = undefined; this._subFor = e.chores; this._chores = [];
      const gen = ++this._subGen, list = e.chores;
      this.hass.connection.subscribeMessage<{ items: Chore[] }>((m) => { if (gen === this._subGen) this._chores = m.items.map(parseChore); }, { type: 'todo/item/subscribe', entity_id: list })
        .then((u) => { if (gen === this._subGen) this._unsub = u; else u(); }).catch(() => { this._chores = []; });
      this._practice = lsGet(`fh-practice-${e.slug}`, null);
    }
    if (this._evFor !== this.kid.name) { this._evFor = this.kid.name; this._tab = 'rewards'; this._loadWeek(); }
    if (ch.has('hass')) this._checkUnlocks();
  }

  /* ---------------- unlock celebrations (high-water marks, never replay) ---------------- */
  private _checkUnlocks(): void {
    if (this._celebrate || !this.hass?.states[this._e.lifetime]) return;
    const life = this._life, grow = this._grow, slug = this._e.slug;
    const seen = lsGet<number | null>(`family-hub-seen-${slug}`, null), seenG = lsGet<number | null>(`family-hub-seen-grow-${slug}`, null);
    if (seen === null || seenG === null) { lsSet(`family-hub-seen-${slug}`, Math.max(seen ?? 0, life)); lsSet(`family-hub-seen-grow-${slug}`, Math.max(seenG ?? 0, grow)); return; }
    const fresh = [...unlocksBetween(seen, life), ...growBetween(seenG, grow)];
    if (fresh.length) {
      const f = this.kid.favourites ?? [];
      this._celebrate = [...fresh].sort((a, b) => Number(f.includes(b.id)) - Number(f.includes(a.id)));
      this._confetti++;
      this._sound('unlock');
      if (this._jack) say(`Wow Jack! You unlocked ${fresh[0].label}!`);
    }
  }
  private _closeCelebrate(open: boolean): void {
    const slug = this._e.slug;
    lsSet(`family-hub-seen-${slug}`, Math.max(lsGet(`family-hub-seen-${slug}`, 0), this._life));
    lsSet(`family-hub-seen-grow-${slug}`, Math.max(lsGet(`family-hub-seen-grow-${slug}`, 0), this._grow));
    this._celebrate = null;
    if (open && !this._wind) this._studio = true;
  }

  private async _loadWeek(): Promise<void> {
    if (!this.hass) return;
    const a = startOfDay(new Date()), b = addDays(a, 8), kid = this.kid.name;
    const cals = [{ id: this._e.calendar, family: false }, ...this.familyCalendars.map((id) => ({ id, family: true }))].filter((c) => this.hass!.states[c.id]);
    const out: KEvent[] = [];
    const priv = this.privateWords.map((w) => w.toLowerCase());
    await Promise.all(cals.map(async (c) => {
      try {
        const rows = await this.hass!.callApi<any[]>('GET', `calendars/${c.id}?start=${encodeURIComponent(a.toISOString())}&end=${encodeURIComponent(b.toISOString())}`);
        for (const r of rows) {
          const title: string = r.summary ?? '(busy)';
          if (priv.some((w) => title.toLowerCase().includes(w))) continue;
          out.push({ title, start: r.start?.date ? new Date(`${r.start.date}T00:00:00`) : new Date(r.start.dateTime), allDay: !!r.start?.date, family: c.family });
        }
      } catch { /* ignore */ }
    }));
    if (kid !== this.kid.name) return;
    out.sort((x, y) => x.start.getTime() - y.start.getTime());
    this._events = out;
  }

  /* ---------------- ticking ---------------- */
  private _sound(s: Sfx): void { if (!this.quiet && !this._wind) sfx(s); else if (s === 'tick') sfx('tap'); }
  private _award(c: ParsedChore, sign: 1 | -1): Promise<unknown> {
    const data: Record<string, unknown> = { kid: this._e.slug, points: sign * c.pts, lifetime: true, jar: c.lane === 'job' ? sign : 0, grow: c.lane === 'grow' ? sign : 0, reason: `${sign > 0 ? '' : 'un-ticked '}${c.summary}` };
    if (!c.pts && c.lane !== 'job' && c.lane !== 'grow') return Promise.resolve();
    return this.hass!.callService('script', 'fh_add_points', data);
  }

  private _toggle(c: ParsedChore, viaPin = false): void {
    if (!this.hass || this._busy.has(c.uid)) return;
    const done = c.status === 'completed';
    const ticks = lsGet<Record<string, number>>('fh-ticks', {});
    if (done && Date.now() - (ticks[c.uid] ?? 0) < 2000) return; // double-tap guard: a fresh tick can't be undone by the same flurry
    if (done && !viaPin && Date.now() - (ticks[c.uid] ?? 0) > UNDO_MS) {
      if (this.pin) this._pinAsk = { reason: `Untick “${c.summary}”?`, run: () => this._toggle(c, true) };
      else this._say('Need to change that? Ask a grown-up.');
      return;
    }
    this._doToggle(c, done, ticks);
  }

  private async _doToggle(c: ParsedChore, done: boolean, ticks: Record<string, number>): Promise<void> {
    this._busy.add(c.uid);
    const prev = this._chores;
    this._chores = prev.map((x) => x.uid === c.uid ? { ...x, status: done ? 'needs_action' : 'completed' } : x);
    try {
      await this.hass!.callService('todo', 'update_item', { item: c.uid, status: done ? 'needs_action' : 'completed' }, { entity_id: this._e.chores });
      await this._award(c, done ? -1 : 1);
      if (done) { delete ticks[c.uid]; lsSet('fh-ticks', ticks); this._sound('untick'); return; }
      ticks[c.uid] = Date.now(); lsSet('fh-ticks', ticks);
      this._sound(c.lane === 'job' ? 'coin' : 'tick');
      this._jump++;
      const id = Date.now();
      const text = c.lane === 'grow' ? '🌱' : c.pts ? (this._jack ? '★'.repeat(Math.max(1, Math.round(c.pts / this._star))) : `+${c.pts}`) : '✓';
      this._bursts = [...this._bursts, { id, text }];
      setTimeout(() => { this._bursts = this._bursts.filter((b) => b.id !== id); }, 1300);
      if (this._jack) say(`${c.summary}. Done! ${c.pts ? 'Here’s a star!' : ''}`);
      this._maybeAllDone();
    } catch (err) {
      console.warn('Family Hub: chore update failed', err);
      this._chores = prev;
      this._say('Couldn’t save that one – try again');
    } finally { this._busy.delete(c.uid); }
  }

  private _maybeAllDone(): void {
    const slot = daySlot(bedtimeFor(this.kid.bedtime, this._now), this._now);
    const now = this._chores.filter((c) => c.lane === 'routine' && (c.slot === slot));
    const jobs = this._chores.filter((c) => c.lane === 'job');
    const set = now.length ? now : jobs;
    if (!set.length || set.some((c) => c.status !== 'completed')) return;
    const key = `fh-alldone-${this._e.slug}-${new Date().toDateString()}-${slot}`;
    if (lsGet(key, false)) return;
    lsSet(key, true);
    const n = this.kid.name;
    if (!this._wind) { this._confetti++; this._sound(((this.kid.sound as Sfx) ?? 'done')); setTimeout(() => this._sound('done'), 700); }
    if (this._jack) say(slot === 'am' ? `You did your whole morning, ${n}!` : slot === 'bed' ? `All ready for bed, ${n}. Sleep well!` : `All done, ${n}!`);
    this._say(slot === 'bed' ? `All set for bed, ${n}. Sleep well.` : [`All done, ${n}. You stuck with it today.`, `That’s everything, ${n}. Nice and steady.`, `Legend effort, ${n}.`][Math.floor(Math.random() * 3)]);
  }

  /* ---------------- practice timer ---------------- */
  private _startPractice(c: ParsedChore): void {
    this._practice = { uid: c.uid, end: Date.now() + c.minutes * 60_000, mins: c.minutes };
    lsSet(`fh-practice-${this._e.slug}`, this._practice);
    this._sound('tap');
    this._say(`${c.minutes} minutes on the clock. You’ve got this.`);
  }
  private _stopPractice(): void { this._practice = null; lsSet(`fh-practice-${this._e.slug}`, null); }
  private _checkPractice(): void {
    const p = this._practice;
    if (!p || Date.now() < p.end) return;
    const c = this._chores.find((x) => x.uid === p.uid);
    this._stopPractice();
    if (c && c.status !== 'completed') { this._doToggle(c, false, lsGet('fh-ticks', {})); this._say(`Practice done – ${p.mins} minutes. Sounding good!`); }
  }

  /* ---------------- rewards ---------------- */
  private _redeem(r: RewardConfig, checked = false): void {
    const have = num(this.hass, this._e.points);
    if (have < r.cost) {
      this._sound('locked');
      if (this._jack) say(`Not yet! ${Math.ceil((r.cost - have) / this._star)} more stars for ${r.name}.`);
      this._say(`Saving up: ${this._jack ? `${Math.ceil((r.cost - have) / this._star)} more stars` : `${r.cost - have} to go`}. You’ll get there.`);
      return;
    }
    const needs = r.approve ?? r.cost >= 60;
    if (needs && this.pin && !checked) { this._pinAsk = { reason: `${this.kid.name}: ${r.name}?`, run: () => this._redeem(r, true) }; return; }
    this.hass!.callService('script', 'fh_add_points', { kid: this._e.slug, points: -r.cost, lifetime: false, reason: `reward: ${r.name}` });
    if (this.owed && this.hass!.states[this.owed]) {
      this.hass!.callService('todo', 'add_item', { item: `${this.kid.name}: ${r.name}`, description: `${new Date().toLocaleDateString('en-AU')} · ${r.cost} pts${needs && !this.pin ? ' · needs a grown-up OK' : ''}` }, { entity_id: this.owed });
    }
    this._confetti++; this._jump++; this._sound('unlock');
    if (this._jack) say(`Yay! ${r.name}!`);
    this._say(needs ? `Nice saving, ${this.kid.name}. A grown-up will sort out: ${r.name}.` : `Nice saving, ${this.kid.name}! ${r.name} – your pick.`);
  }

  private _feelPick(f: string): void { this._feel = f; this._sound('tap'); if (this._jack) say('Thanks for telling me. Want a hug?'); }
  private _feelReply(kind: 'hug' | 'chat' | 'ok'): void {
    if (kind === 'chat') this.hass?.callService('persistent_notification', 'create', { title: `${this.kid.name} would like a chat`, message: `${this.kid.name} said he’s feeling ${this._feel} and would like a chat later.`, notification_id: `fh_chat_${this._e.slug}` });
    this._say(kind === 'hug' ? 'Go find a grown-up for a big hug 🤗' : kind === 'chat' ? 'A grown-up will come and chat soon.' : 'Good to know. Thanks for sharing.');
    this._feel = '';
  }

  private _dayOff(i: number): void {
    const w = (this.hass?.states[this._e.week]?.state ?? '-------').padEnd(7, '-').slice(0, 7);
    const run = () => {
      const n = w[i] === 'O' ? '-' : 'O';
      this.hass!.callService('input_text', 'set_value', { entity_id: this._e.week, value: w.slice(0, i) + n + w.slice(i + 1) });
      this._say(n === 'O' ? 'Marked as a day off.' : 'Day off removed.');
    };
    if (!this.pin) { this._say('Set a parent PIN to mark days off.'); return; }
    this._pinAsk = { reason: 'Mark this as a day off?', run };
  }

  private _msgTimer?: number;
  private _say(m: string): void { this._msg = m; clearTimeout(this._msgTimer); this._msgTimer = window.setTimeout(() => { this._msg = ''; }, 2800); }

  /* ---------------- render ---------------- */
  render(): TemplateResult | typeof nothing {
    if (!this.kid || !this.hass) return nothing;
    if (this._studio) return html`<fh-studio .hass=${this.hass} .kid=${this.kid} .look=${this._look} .life=${this._life} .grow=${this._grow} @close=${() => { this._studio = false; this._jump++; }}></fh-studio>`;
    const e = this._e, h = this.hass;
    const missing = !h.states[e.points] || !h.states[e.chores];
    return html`<div style="display:contents;--kid:${slotVar(this.kid.colour)}">
      ${this._hero()}
      ${missing ? html`<section class="glass jobs"><div class="empty"><h2 style="font-size:22px">Set up ${this.kid.name}’s page</h2>
        <span>Create <b>${e.chores}</b> and <b>${e.points}</b> in Home Assistant.</span></div></section>` : this._jobs()}
      <div class="side">${this._wind ? html`${this._windCard()}<section class="glass card">${this._weekBody()}</section>` : this._tabs()}${this._jar()}${this._wind ? nothing : this._feelCard()}</div>
      ${this._bursts.map((b) => html`<span class="burst" style="left:150px;top:260px">${b.text}</span>`)}
      ${this._confetti && !this._wind ? keyed(this._confetti, confetti(this._confetti)) : nothing}
      ${this._celebrate ? this._celebration() : nothing}
      ${this._pinAsk ? html`<fh-pin .pin=${String(this.pin)} reason=${this._pinAsk.reason} @ok=${() => { const r = this._pinAsk!.run; this._pinAsk = null; r(); }} @cancel=${() => { this._pinAsk = null; }}></fh-pin>` : nothing}
      ${this._msg ? html`<div class="toast" role="status">${this._msg}</div>` : nothing}
    </div>`;
  }

  private _hero(): TemplateResult {
    const e = this._e, h = this.hass!, life = this._life, look = this._look, pts = num(h, e.points);
    const li = levelInfo(life), goal = h.states[e.goal]?.state;
    const nx = nextUnlock(life, this.kid.favourites, goal && goal !== 'unknown' ? goal : undefined), from = prevThreshold(life);
    const pct = nx ? Math.max(4, Math.round(((life - from) / Math.max(1, nx.req - from)) * 100)) : 100;
    const w = (h.states[e.week]?.state ?? '-------').padEnd(7, '-').slice(0, 7);
    const todayIdx = (this._now.getDay() + 6) % 7;
    const goodToday = this._goodToday();
    const goodCount = [...w].filter((c, i) => c === 'G' || (i === todayIdx && goodToday)).length;
    return html`<section class="glass hero" aria-label="${this.kid.name}’s avatar">
      <button class="tap avbtn" aria-label="Make ${this.kid.name} jump" @click=${() => { this._jump++; this._sound((this.kid.sound as Sfx) ?? 'tap'); if (this._jack) say(`Hi Jack! You have ${Math.floor(pts / this._star)} stars.`); }}>
        ${renderAvatar(look, { size: 186, jump: this._jump, label: `${this.kid.name}’s avatar`, age: this.kid.age })}</button>
      <div style="display:flex;align-items:center;gap:10px;z-index:1"><h1 class="name">${this.kid.name}</h1>${this._jack ? nothing : html`<span class="rank">${li.rank}</span>`}</div>
      ${this._jack ? html`
        <div class="stat" style="width:100%;align-items:center;flex-direction:row;gap:12px"><span style="font-size:40px">🫙</span>
          <span style="display:flex;flex-direction:column;gap:2px">${(() => { const n = Math.floor(pts / this._star); return n > 10 ? html`<b class="stars" style="font-size:30px">★ ${n}</b>` : n ? html`<span class="starjar">${'★'.repeat(n).split('').map((x) => html`<i>${x}</i>`)}</span>` : html`<b class="stars" style="font-size:26px">☆</b>`; })()}
          <span>${Math.floor(pts / this._star)} stars in my jar</span></span></div>`
      : html`
        <div style="width:100%;display:flex;flex-direction:column;gap:5px"><div class="xp"><div style="width:${Math.round((li.into / li.need) * 100)}%"></div></div>
          <span class="muted" style="font-size:13px;font-weight:600;text-align:right">${li.need - li.into} more to ${li.nextRank}</span></div>
        <div class="stats">
          <div class="stat"><b>${pts || '✨'}</b><span>${pts ? 'points to spend' : 'Ready to start'}</span></div>
          <div class="stat"><span>Good days</span><div class="dots">${[...w].map((c, i) => html`<button aria-label="${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}${c === 'O' ? ', day off' : ''}" class="${c === 'G' || (i === todayIdx && goodToday) ? 'g' : c === 'O' ? 'o' : ''} ${i === todayIdx ? 't' : ''}" @click=${() => this._dayOff(i)}></button>`)}</div>
            <span>${goodCount >= 5 ? 'Full week ⭐' : `${goodCount} this week`}</span></div>
        </div>`}
      ${this._wind ? html`<div class="next"><span style="font-size:13px;font-weight:700;padding:6px">🌙 Studio opens in the morning</span></div>`
        : nx ? html`<div class="next">
        <span class="shimmer" style="border-radius:50%;line-height:0">${renderAvatar(applyItem(look, nx.cat, nx.id, nx.swatch), { size: 46, crop: 'head', still: true, age: this.kid.age })}</span>
        <span style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0"><span style="font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${goal === nx.id ? '♥ Saving for' : 'Next'}: ${nx.label}</span>
          <div class="xp" style="height:7px"><div style="width:${pct}%"></div></div>
          ${this._jack ? nothing : html`<span class="muted" style="font-size:12px;font-weight:600">${nx.req - life} to go</span>`}</span>
      </div>` : html`<div class="next"><span style="font-size:13px;font-weight:700;padding:6px">You’ve unlocked the whole collection! New gear drops next term.</span></div>`}
      ${this.kid.special_time && !this._jack ? html`<span class="muted" style="font-size:13px;font-weight:600">💛 Your time: ${this.kid.special_time}</span>` : nothing}
      ${this._wind ? nothing : html`<button class="pill tap primary" style="height:52px;width:100%;justify-content:center;font-size:16px;margin-top:auto" @click=${() => { this._studio = true; this._sound('tap'); }}>${icon('star', 20)}${this._jack ? '🎨 My look' : 'Style studio'}</button>`}
    </section>`;
  }

  private _goodToday(): boolean {
    const r = this._chores.filter((c) => c.lane === 'routine'), j = this._chores.filter((c) => c.lane === 'job');
    const rd = r.filter((c) => c.status === 'completed' && c.slot !== 'bed').length, rAll = r.filter((c) => c.slot !== 'bed').length;
    const jd = j.filter((c) => c.status === 'completed').length;
    return (r.length + j.length) > 0 && rd === rAll && (j.length === 0 || jd >= Math.min(2, j.length));
  }

  private _jobs(): TemplateResult {
    const bt = bedtimeFor(this.kid.bedtime, this._now);
    const slot = daySlot(bt, this._now);
    const list = this._chores;
    const routineNow = list.filter((c) => c.lane === 'routine' && (c.slot === slot || (c.slot === 'any' && !this._wind)));
    const jobs = this._wind ? [] : list.filter((c) => c.lane === 'job' && (c.slot === 'any' || c.slot === slot || (slot === 'after' && c.slot === 'am')));
    const grow = this._wind ? list.filter((c) => c.lane === 'grow' && c.slot === 'bed') : list.filter((c) => c.lane === 'grow' && c.slot !== 'bed' || (c.lane === 'grow' && slot === 'bed'));
    const later = list.filter((c) => c.lane === 'routine' && c.status !== 'completed' && c.slot !== slot && c.slot !== 'any' && ((slot === 'am') || (slot === 'after' && c.slot === 'bed')));
    const visible = [...routineNow, ...jobs, ...grow];
    const done = visible.filter((c) => c.status === 'completed').length, total = visible.length;
    const left = total - done;
    const C = 2 * Math.PI * 22, frac = total ? done / total : 0;
    const sub = this._wind ? (left ? `Bedtime jobs: ${left} left · bed at ${t12(bt)}` : 'All set for bed. Sleep well 🌙')
      : left ? `${left} left ${slot === 'am' ? 'this morning' : slot === 'after' ? 'this afternoon' : 'tonight'}` : later.length ? 'All done for now 🎉' : 'All done – fresh start tomorrow';
    return html`<section class="glass jobs" aria-label="Jobs">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="flex:1"><h1 style="font-size:26px;font-weight:800">${this._wind ? 'Wind down' : this._jack ? (slot === 'am' ? 'My morning' : slot === 'bed' ? 'My bedtime' : 'My jobs') : 'Today'}</h1>
          <span class="muted" style="font-size:14px;font-weight:600">${sub}</span></div>
        ${this._jack ? html`<button class="round tap" style="width:52px;height:52px;font-size:24px" aria-label="Read my jobs" @click=${() => say(routineNow.filter((c) => c.status !== 'completed').map((c) => c.summary).join('. ') || 'All done! Great job!')}>🔊</button>` : nothing}
        <div class="ring" aria-label="${done} of ${total} done"><svg width="52" height="52" viewBox="0 0 52 52"><circle cx="26" cy="26" r="22" fill="none" stroke="var(--track)" stroke-width="6"></circle>
          <circle cx="26" cy="26" r="22" fill="none" stroke="var(--ok)" stroke-width="6" stroke-linecap="round" stroke-dasharray=${C} stroke-dashoffset=${C * (1 - frac)} style="transition:stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)"></circle></svg><b>${done}/${total}</b></div>
      </div>
      <div class="list">
        ${this._jack ? html`<div class="pics">${routineNow.map((c) => this._pic(c))}</div>`
          : html`
            ${routineNow.length ? html`<div class="sec"><h2>${SLOT_NAME[slot]} routine</h2><span>just what we do</span></div>${routineNow.map((c) => this._row(c))}` : nothing}
            ${jobs.length ? html`<div class="sec"><h2>Family jobs</h2><span>earn points · fill the jar</span></div>${jobs.map((c) => this._row(c))}` : nothing}
            ${grow.length ? html`<div class="sec"><h2>Growing</h2><span>for you – surprises along the way</span></div>${grow.map((c) => this._row(c))}` : nothing}`}
        ${later.length && !this._wind ? html`<div class="later"><span>Later: ${SLOT_NAME[later[0].slot]} (${later.length})</span><span>${later.map((c) => this._jack ? picFor(c.summary) : '').join(' ')}</span></div>` : nothing}
        ${!visible.length ? html`<div class="wind"><span style="font-size:44px">🌤️</span><span>Nothing right now. Enjoy!</span></div>` : nothing}
      </div>
    </section>`;
  }

  private _row(c: ParsedChore): TemplateResult {
    const d = c.status === 'completed', p = this._practice?.uid === c.uid ? this._practice : null;
    const left = p ? Math.max(0, p.end - this._now.getTime()) : 0;
    return html`<div class="job ${d ? 'done' : ''}" style="padding-right:10px">
      <button class="tap" style="display:flex;align-items:center;gap:14px;flex:1;text-align:left;min-height:34px" aria-pressed=${String(d)} @click=${() => this._toggle(c)}>
        <span class="box">${d ? '✓' : ''}</span>
        ${this.kid.mode === 'mixed' ? html`<span style="font-size:28px">${picFor(c.summary)}</span>` : nothing}
        <span class="t">${c.summary}</span></button>
      ${c.lane === 'grow' && c.minutes && !d ? (p ? html`<button class="play tap" @click=${() => this._stopPractice()}>⏸ ${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}</button>`
        : html`<button class="play tap" aria-label="Start ${c.minutes} minute timer" @click=${() => this._startPractice(c)}>▶ ${c.minutes} min</button>`) : nothing}
      ${c.lane === 'job' ? html`<span class="plus">+${c.pts}</span>` : c.lane === 'grow' && (d || !c.minutes) ? html`<span class="plus grow">🌱</span>` : nothing}
    </div>`;
  }

  private _pic(c: ParsedChore): TemplateResult {
    const d = c.status === 'completed', stars = Math.max(1, Math.round(c.pts / this._star));
    return html`<button class="pic tap ${d ? 'done' : ''}" aria-pressed=${String(d)} @click=${() => this._toggle(c)}>
      <span class="e">${picFor(c.summary)}</span><span style="font-size:17px;font-weight:700;text-align:center">${c.summary}</span>
      ${c.pts ? html`<span class="stars">${'★'.repeat(stars)}</span>` : nothing}${d ? html`<span class="tick">✓</span>` : nothing}</button>`;
  }

  private _rewards(): TemplateResult {
    const have = num(this.hass, this._e.points), list = this.kid.rewards ?? DEFAULT_REWARDS, st = this._star;
    return html`${list.map((r) => {
        const ok = have >= r.cost;
        return html`<div class="rw"><span style="font-size:24px">${r.icon ?? '🎁'}</span><span class="n">${r.name}</span>
          <button class="tap ${ok ? '' : 'save'}" @click=${() => this._redeem(r)}>${this._jack ? (Math.round(r.cost / st) > 5 ? `${Math.round(r.cost / st)} ★` : '★'.repeat(Math.max(1, Math.round(r.cost / st)))) : ok ? `${r.cost}` : `${r.cost - have} to go`}</button></div>`;
      })}`;
  }

  private _tabs(): TemplateResult {
    const t = this._tab, tab = (id: 'rewards' | 'week', label: string) => html`<button class="tab tap" aria-pressed=${String(t === id)} @click=${() => { this._tab = id; this._sound('tap'); if (this._jack) say(label); }}>${label}</button>`;
    return html`<section class="glass card tabcard" aria-label=${t === 'rewards' ? 'Rewards' : 'Week'}>
      <div class="tabs">${tab('rewards', this._jack ? '⭐ My stars' : '🎁 Rewards')}${tab('week', this._jack ? '📅 Coming up' : '📅 My week')}</div>
      ${t === 'rewards' ? this._rewards() : this._weekBody()}</section>`;
  }

  private _windCard(): TemplateResult {
    return html`<section class="glass card"><span class="label">Rewards</span><span style="font-size:15px;font-weight:600">The shop opens again in the morning 🌙</span>
      <span class="muted" style="font-size:13px">Bedtime ${t12(bedtimeFor(this.kid.bedtime, this._now))}</span></section>`;
  }

  private _jar(): TemplateResult {
    const n = num(this.hass, 'input_number.family_jar'), t = this.jarTarget || 120, f = Math.min(1, n / t);
    if (!this.hass?.states['input_number.family_jar']) return html``;
    return html`<section class="glass card" aria-label="Family jar"><div class="jar">
      <svg width="34" height="42" viewBox="0 0 48 60" aria-hidden="true"><rect x="8" y="2" width="32" height="7" rx="3" fill="var(--ink3)"></rect>
        <path d="M6 12 H42 V52 a6 6 0 0 1 -6 6 H12 a6 6 0 0 1 -6 -6 Z" fill="var(--chip-strong)" stroke="var(--ink3)" stroke-width="2"></path>
        <clipPath id="jc"><path d="M8 14 H40 V52 a4 4 0 0 1 -4 4 H12 a4 4 0 0 1 -4 -4 Z"></path></clipPath>
        <rect clip-path="url(#jc)" x="6" y=${58 - 44 * f} width="36" height=${44 * f} fill="var(--accent)" style="transition:all .8s"></rect></svg>
      <span style="flex:1;display:flex;flex-direction:column;gap:2px"><span class="label">Family jar</span>
        <span style="font-size:15px;font-weight:700">${n >= t ? 'Full! Time for ' + this.jarReward : `${t - n} marbles to ${this.jarReward}`}</span>
      </span></div></section>`;
  }

  private _feelCard(): TemplateResult {
    return html`<section class="glass card" aria-label="How are you feeling">
      ${this._feel ? html`<span style="font-size:15px;font-weight:600">Thanks for telling me. Want a hug or a chat?</span>
        <div style="display:flex;gap:8px"><button class="pill tap" @click=${() => this._feelReply('hug')}>🤗 Hug</button><button class="pill tap" @click=${() => this._feelReply('chat')}>💬 Chat later</button><button class="pill tap" @click=${() => this._feelReply('ok')}>I’m OK</button></div>`
        : html`<span class="label">How are you feeling?</span><div class="feel">${FEELINGS.map(([e, w]) => html`<button class="tap" aria-label=${w} @click=${() => this._feelPick(w)}>${e}</button>`)}</div>`}
    </section>`;
  }

  private _weekBody(): TemplateResult {
    const today = new Date(), evs = this._events.filter((e) => e.allDay ? e.start >= startOfDay(today) : e.start.getTime() > today.getTime() - 3_600_000).slice(0, 5);
    const label = (d: Date): string => {
      if (sameDay(d, today)) return 'Today';
      const n = Math.round((startOfDay(d).getTime() - startOfDay(today).getTime()) / 86_400_000);
      if (this._jack) return `${n} sleep${n > 1 ? 's' : ''}`;
      return n === 1 ? 'Tomorrow' : fmtDow(d);
    };
    return html`${this._wind ? html`<span class="label">${this._jack ? 'Coming up' : `${this.kid.name}’s week`}</span>` : nothing}
      ${evs.length ? evs.map((e, i) => html`<div class="wk"><span class="d">${i && label(evs[i - 1].start) === label(e.start) ? '' : label(e.start)}</span>
        <span style="flex:1;font-weight:600;display:flex;gap:6px;align-items:baseline"><span class="dot" style="width:8px;height:8px;background:${e.family ? 'var(--p-family)' : 'var(--kid)'}"></span>
          <span>${e.title}${e.allDay ? '' : html` <span class="muted" style="font-weight:500">· ${fmtTime(e.start)}</span>`}</span></span></div>`)
        : html`<span class="muted" style="font-size:14px">Nothing on this week.</span>`}`;
  }

  private _celebration(): TemplateResult {
    const items = this._celebrate!, look = this._look;
    return html`<div class="celebrate" @click=${(e: Event) => { if (e.target === e.currentTarget) this._closeCelebrate(false); }}>
      <div class="glass cbox" role="dialog" aria-label="New unlocks">
        <span class="rank" style="font-size:14px">${items.some((u) => GROW_IDS.has(u.id)) ? 'SURPRISE!' : `NEW UNLOCK${items.length > 1 ? 'S' : ''}`}</span>
        <h1 style="font-size:34px;font-weight:800;text-align:center">${this.kid.name}, you unlocked ${items.length > 1 ? `${items.length} things` : items[0].label}!</h1>
        <div class="unl">${items.slice(0, 8).map((u, i) => html`<div style="animation-delay:${0.15 + i * 0.12}s">
          ${renderAvatar(applyItem(look, u.cat, u.id, u.swatch), { size: 96, crop: u.cat.crop, still: true, age: this.kid.age })}${u.label}</div>`)}</div>
        <div style="display:flex;gap:12px"><button class="pill tap" style="height:52px;padding:0 20px" @click=${() => this._closeCelebrate(false)}>Later</button>
          ${this._wind ? nothing : html`<button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" @click=${() => this._closeCelebrate(true)}>${icon('star', 18)}Try it on</button>`}</div>
      </div>
    </div>`;
  }
}
import { GROW_UNLOCKS } from './avatar';
const GROW_IDS = new Set(GROW_UNLOCKS.map((u) => u.id));
if (!customElements.get('fh-kid')) customElements.define('fh-kid', FhKid);
