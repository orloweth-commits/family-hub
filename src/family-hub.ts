import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { THEMES, themeById, themeStyle, type ThemeId } from './themes';
import { styles } from './styles';
import { LOOKS, LOOK_KEY, LOOK_OPTS_KEY, LookController, getLook, lookArt, lookById, lookPreview, setLook, type DialArc, type LookId, type LookOption } from './looks';
import './ambient';
import { spark } from './sparks';
import './groceries';
import './kid';
import './home';
import './music';
import './weather';
import './doodle';
import './morning';
import './addevent';
import './pin';
import './chat';
import { loadFonts } from './fonts';
import { keyboard, keysCss, typeKey } from './keys';
import { findRoom, kidSpeaker, play, rooms, sleepIn } from './ma';
import { avatarCss, decodeLook, renderAvatar } from './avatar';
import { icon, solid, weatherIcon } from './icons';
import { kidEntities, num, slotVar, type CalEvent, type ColourSlot, type FamilyHubConfig, type Hass, type KidConfig } from './types';
import {
  addDays, fmtClock, fmtDow, fmtLongDate, fmtRange, fmtShortDate, fmtTime, greeting, inWindow,
  sameDay, startOfDay, startOfMonthGrid, startOfWeek
} from './dates';
import { bedtimeFor, changed, FitController, hm, isQuiet, isSchoolDay, kidPrefs, minsNow, panelMsg, saveKidPrefs, scrollCue, getShape, setMuted, setShape, setVolume, sfx, shortNames, ymd, type KidPrefs, type Shape } from './util';

type View = 'day' | 'week' | 'month';
type Page = 'planner' | 'groceries' | 'kid' | 'doodle' | 'music' | 'home' | 'morning' | 'weather';
type Sheet = '' | 'themes' | 'kidprefs' | 'meds' | 'add' | 'sitter' | 'timer' | 'chat';
const VERSION = '0.24.0';
const THEME_KEY = 'family-hub-theme';
const COND: Record<string, string> = {
  'clear-night': 'Clear', cloudy: 'Cloudy', exceptional: 'Wild weather', fog: 'Foggy', hail: 'Hail', lightning: 'Storms', 'lightning-rainy': 'Storms',
  partlycloudy: 'Partly cloudy', pouring: 'Pouring', rainy: 'Rain', snowy: 'Snow', 'snowy-rainy': 'Sleet', sunny: 'Sunny', windy: 'Windy', 'windy-variant': 'Windy'
};
const CHILD_TAGS = 'fh-kid,fh-home,fh-music,fh-groceries,fh-doodle,fh-morning,fh-weather,fh-add-event,fh-chat';


export class FamilyHubCard extends LitElement {
  readonly fitCtl = new FitController(this as never);
  readonly lookCtl = new LookController(this);
  static styles = [styles, keysCss, css`${unsafeCSS(avatarCss)}`];
  static properties = {
    hass: { attribute: false },
    _config: { state: true }, _view: { state: true }, _anchor: { state: true }, _events: { state: true }, _soon: { state: true },
    _medLog: { state: true }, _mx: { state: true }, _theme: { state: true }, _look: { state: true }, _opts: { state: true }, _prefTick: { state: true }, _sheet: { state: true }, _now: { state: true }, _toast: { state: true }, _wx: { state: true },
    _reminders: { state: true }, _remTk: { state: true }, _remJust: { state: true }, _awakeUntil: { state: true }, _nightManual: { state: true }, _page: { state: true }, _kid: { state: true },
    _photo: { state: true }, _calError: { state: true }, _idle: { state: true }, _undo: { state: true }, _dinner: { state: true }, _alarm: { state: true }, _pinAsk: { state: true }
  };

  hass?: Hass;
  private _config!: FamilyHubConfig;
  private _view: View = 'week';
  private _anchor: Date = new Date();
  private _events: CalEvent[] = [];
  /** today + next two days, for the capsule, morning mode and night screen */
  private _soon: CalEvent[] = [];
  private _theme: ThemeId = 'sea';
  private _look: LookId = 'glass';
  /** look options the family has switched on, e.g. { hand: true } */
  private _opts: Record<string, boolean> = {};
  private _prefTick = 0;

  /** The child whose page is open, and his settings (config defaults + what a grown-up changed on the panel). */
  private get _kidOn(): KidConfig | undefined { return this._page === 'kid' ? this._config?.kids?.[this._kid] : undefined; }
  private get _kp(): KidPrefs | undefined { const k = this._kidOn; return k ? kidPrefs(k) : undefined; }
  /** The look on screen right now: a child's own look on his page, otherwise the panel's. */
  private get _lk(): LookId { const p = this._kp; return p && p.look !== 'panel' ? lookById(p.look).id : this._look; }
  private _optOn(o: LookOption): boolean { return this._kp && o.id === 'hand' ? this._kp.font === 'hand' : !!this._opts[o.id]; }
  private _setKidPref(patch: Partial<KidPrefs>): void {
    const k = this._kidOn; if (!k) return;
    saveKidPrefs(k.name, patch); this._prefTick++; sfx('tap');
  }
  /** Looks and settings are for grown-ups when a PIN is set. */
  private _openLooks(): void {
    const k = this._kidOn, open = (): void => { this._sheet = k ? 'kidprefs' : 'themes'; };
    if (this._config.parent_pin) this._pinAsk = { reason: k ? `Change ${k.name}’s settings?` : 'Change the look?', run: open }; else open();
  }
  protected willUpdate(): void {
    if (this._sheet !== 'meds') this._medOpen = false;
    if (!this._config) return;
    if (this._lk !== getLook()) setLook(this._lk);
    setVolume(this._kp ? { full: 1, soft: 0.35, off: 0 }[this._kp.sound] : 1);
  }
  private _sheet: Sheet = '';
  private _now = new Date();
  private _toast = '';
  private _wx: { max?: number; min?: number; uv?: number; rain?: number } = {};
  private _reminders: { uid: string; summary: string }[] = [];
  /** reminders ticked a moment ago: they stay a few seconds so a slip can be tapped back */
  private _remTk: Record<string, number> = {};
  private _remJust = '';
  private _awakeUntil = 0;
  private _nightManual = false;
  private _page: Page = 'planner';
  private _kid = 0;
  private _photo = '';
  private _musicFocus = '';
  private _photos: string[] = [];
  private _photoIdx = 0;
  private _photoTimer?: number;
  private _lastTouch = Date.now();
  private _idle = false;
  private _calError = false;
  private _undo: { ids: string[]; until: number } | null = null;
  private _dinner: { at: number; timer?: number } | null = null;
  private _dinnerCooldown = 0;
  private _alarm = 0;
  private _alarmSeen = 0;
  private _pinAsk: { reason: string; run: () => void } | null = null;
  private _tick?: number;
  private _poll?: number;
  private _fetchedKey = '';
  private _fetchGen = 0;
  private _dayKey = '';
  private _toastTimer?: number;

  setConfig(config: FamilyHubConfig): void {
    if (!config) throw new Error('Family Hub: missing configuration');
    for (const k of config.kids ?? []) if (!k.name) throw new Error('Family Hub: every kid needs a name');
    for (const c of config.calendars ?? []) if (!c.entity?.startsWith('calendar.')) throw new Error(`Family Hub: "${c.entity}" isn't a calendar entity`);
    if (config.parent_pin !== undefined && !/^\d{4,8}$/.test(String(config.parent_pin))) throw new Error('Family Hub: parent_pin should be 4–8 digits (put it in quotes)');
    this._config = config;
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage unavailable */ }
    this._theme = themeById(saved || config.theme || 'sea').id;
    let look: string | null = null;
    try { look = localStorage.getItem(LOOK_KEY); } catch { /* storage unavailable */ }
    this._look = lookById(look || config.look).id;
    setLook(this._look);
    try { this._opts = JSON.parse(localStorage.getItem(LOOK_OPTS_KEY) || '{}') ?? {}; } catch { this._opts = {}; }
    if (this._morningWindow()) this._page = 'morning';
    this._onResize();
  }
  getCardSize(): number { return 12; }
  static getStubConfig(): FamilyHubConfig { return { type: 'custom:family-hub-card', family_name: 'everyone', theme: 'sea' }; }

  connectedCallback(): void {
    super.connectedCallback();
    loadFonts('Inter', 'Bricolage Grotesque');
    this._tick = window.setInterval(() => this._onTick(), 1000);
    this._poll = window.setInterval(() => { this._fetchedKey = ''; this._refresh(); this._loadSoon(); }, 5 * 60_000);
    this.addEventListener('pointerdown', this._touched, { capture: true });
    window.addEventListener('resize', this._onResize); this._onResize();
    this._ro = new ResizeObserver(() => this._onResize()); this._ro.observe(this);
  }
  /**
   * Fit the screen. The panel is designed on a fixed canvas (1280×800 wide, 900×1280 tall) and scaled up or down
   * so the whole canvas is always visible: nothing is cut off and nothing needs scrolling just because the screen is small.
   */
  private _onResize = (): void => {
    const fixed = Number(this._config?.scale);
    const head = parseFloat(getComputedStyle(this).getPropertyValue('--header-height')) || 0;
    const w = this.getBoundingClientRect().width || window.innerWidth;
    const hgt = window.innerHeight - head;
    // a phone is narrower than any tablet: it gets its own arrangement and scrolls like a normal phone page
    const shape: Shape = w < 600 ? 'phone' : hgt > w * 1.15 ? 'tall' : 'wide';
    if (shape === 'phone' && getShape() !== 'phone' && this._view === 'week') this._view = 'day';
    setShape(shape);
    const [dw, dh] = shape === 'tall' ? [900, 1280] : [1280, 800];
    const z = fixed > 0 ? fixed : shape === 'phone' ? Math.min(1.25, Math.max(0.8, w / 430)) : Math.min(1.6, Math.max(0.6, Math.min(w / dw, hgt / dh)));
    if (Math.abs(z - this._z) > 0.01) { this._z = Math.round(z * 100) / 100; this.requestUpdate(); }
  };
  private _z = 1;
  private _ro?: ResizeObserver;
  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._onResize); this._ro?.disconnect();
    clearInterval(this._tick); clearInterval(this._poll); clearInterval(this._photoTimer);
    this._photoTimer = undefined; this._photos = [];
    this.removeEventListener('pointerdown', this._touched, { capture: true });
  }
  private _touched = (): void => { this._lastTouch = Date.now(); if (this._idle) this._idle = false; };

  private _onTick(): void {
    const now = new Date(), timerOn = this._timerLeft() !== null;
    // second-by-second only while something is counting down; otherwise every 15 s
    if (timerOn || this._dinner || this._undo || now.getSeconds() % 15 === 0) this._now = now;
    if (this._undo && Date.now() > this._undo.until) this._undo = null;
    if (now.getSeconds() % 15) return;
    setMuted(isQuiet(now, this._config?.quiet?.start ?? '20:00', this._config?.quiet?.end ?? '06:30'));
    const idleFor = Date.now() - this._lastTouch;
    if (!this._idle && idleFor > 60_000) this._idle = true;
    const idle = (this._config?.idle_seconds ?? 180) * 1000;
    const home: Page = this._morningWindow() ? 'morning' : 'planner';
    if (idle > 0 && idleFor > idle && (this._page !== home || this._sheet)) { this._page = home; this._sheet = ''; this._view = 'week'; this._anchor = new Date(); }
    const d = ymd(now);
    if (d !== this._dayKey) { this._dayKey = d; if (idleFor > idle) this._anchor = new Date(); this._fetchedKey = ''; this._refresh(); this._loadSoon(); }
  }

  /** Pass fresh hass to the open page without re-rendering the whole card. */
  protected shouldUpdate(ch: PropertyValues): boolean {
    if (ch.size === 1 && ch.has('hass') && this._config) {
      const old = ch.get('hass') as Hass | undefined;
      this.renderRoot?.querySelectorAll(CHILD_TAGS).forEach((el) => { (el as any).hass = this.hass; });
      return changed(old, this.hass, this._watch());
    }
    return true;
  }
  private _watch(): string[] {
    const c = this._config;
    return [c.weather, c.music_player, c.reminders, 'timer.kitchen', 'input_text.fh_panel_message', 'input_number.family_jar',
      ...(c.people ?? []).map((p) => p.entity), ...(c.kids ?? []).map((k) => kidEntities(k).avatar),
      ...(c.meds ?? []).flatMap((m) => [`input_datetime.fh_med_${m.id}`, `input_text.fh_med_${m.id}_by`])].filter((x): x is string => !!x);
  }

  protected updated(ch: PropertyValues): void {
    if (ch.has('hass')) this._watchJar();
    if (ch.has('hass') || ch.has('_view') || ch.has('_anchor')) this._refresh();
    if (ch.has('hass')) this._checkAlarm();
    const root = this.renderRoot.querySelector('.fh');
    if (root) for (const o of lookById(this._lk).options ?? []) root.toggleAttribute(`data-opt-${o.id}`, this._optOn(o));
    if (this._page === 'planner' && this._view === 'week') this._measureWeek();
    this.renderRoot.querySelectorAll('.scrolly').forEach(scrollCue);
  }

  /** Short labels for everyone on the panel, kept distinct ("Ju" and "Ja" rather than two "J"s). */
  private get _short(): Record<string, string> {
    const c = this._config;
    return shortNames([...(c.people ?? []).map((p) => p.name), ...(c.kids ?? []).map((k) => k.name),
      ...(c.calendars ?? []).map((x) => x.name ?? this.hass?.states[x.entity]?.attributes.friendly_name ?? x.entity)]);
  }
  /** The person chip: their colour and their initial, so colour is never the only cue. */
  private _chip(who: string, colour: ColourSlot | undefined, sm = false): TemplateResult {
    return html`<span class="init ${sm ? 'sm' : ''}" style="--c:${slotVar(colour)}" role="img" aria-label=${who}>${this._short[who] ?? (who[0] ?? '').toUpperCase()}</span>`;
  }

  /** Hide event cards that don't fully fit a day column and count them into "+N more". */
  private _clip: Record<string, number> = {};
  private _measureWeek(): void {
    const next: Record<string, number> = {};
    this.renderRoot.querySelectorAll<HTMLElement>('.evs').forEach((box) => {
      const evs = [...box.querySelectorAll<HTMLElement>(':scope > .ev')];
      for (const ev of evs) { ev.style.display = ''; ev.style.visibility = ''; }
      let n = 0;
      // finished events make room first, so what is still to come stays visible
      for (const ev of evs) {
        if (box.scrollHeight <= box.clientHeight + 1) break;
        if (ev.classList.contains('past')) { ev.style.display = 'none'; n++; }
      }
      const h = box.clientHeight; let cut = false;
      for (const ev of evs) {
        if (ev.style.display === 'none') continue;
        const hide = cut || ev.offsetTop + ev.offsetHeight > h + 1;
        ev.style.visibility = hide ? 'hidden' : ''; if (hide) { n++; cut = true; }
      }
      if (n) next[box.dataset.day!] = n;
    });
    if (JSON.stringify(next) !== JSON.stringify(this._clip)) { this._clip = next; this.requestUpdate(); }
  }

  // ---------- data ----------
  private _range(): [Date, Date] {
    if (this._view === 'day') { const s = startOfDay(this._anchor); return [s, addDays(s, 1)]; }
    if (this._view === 'month') { const s = startOfMonthGrid(this._anchor); return [s, addDays(s, 42)]; }
    const s = startOfWeek(this._anchor); return [s, addDays(s, 7)];
  }
  private _refresh(): void {
    if (!this.hass || !this._config) return;
    const [a, b] = this._range();
    const key = `${this._view}|${a.toISOString()}`;
    if (key === this._fetchedKey) return;
    const first = !this._fetchedKey && !this._dayKey;
    this._fetchedKey = key;
    this._loadEvents(a, b).then((ev) => { if (ev) this._events = ev; });
    this._loadWeather();
    this._loadReminders();
    if (first || !this._soon.length) this._loadSoon();
    if (this._config.photos && !this._photos.length && !this._photoTimer) this._loadPhotos();
  }
  private async _loadSoon(): Promise<void> {
    const a = startOfDay(new Date());
    const ev = await this._loadEvents(a, addDays(a, 3), true);
    if (ev) this._soon = ev;
  }

  private async _loadPhotos(): Promise<void> {
    const h = this.hass!, root = this._config.photos!;
    this._photoTimer = window.setInterval(() => this._nextPhoto(), (this._config.photo_minutes ?? 10) * 60_000);
    try {
      const r = await h.callWS<{ children: { media_content_id: string; media_class: string }[] }>({ type: 'media_source/browse_media', media_content_id: root });
      this._photos = r.children.filter((c) => c.media_class === 'image').map((c) => c.media_content_id);
      for (let i = this._photos.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this._photos[i], this._photos[j]] = [this._photos[j], this._photos[i]]; }
      this._nextPhoto();
    } catch (e) { console.warn('Family Hub: photo folder not found', root, e); }
  }
  private async _nextPhoto(): Promise<void> {
    if (!this._photos.length || !this.hass) return;
    const id = this._photos[this._photoIdx++ % this._photos.length];
    try {
      const r = await this.hass.callWS<{ url: string }>({ type: 'media_source/resolve_media', media_content_id: id });
      const img = new Image();
      img.onload = () => { this._photo = r.url; };
      img.src = r.url;
    } catch { /* skip */ }
  }

  private async _loadEvents(a: Date, b: Date, soon = false): Promise<CalEvent[] | null> {
    const cals = this._config.calendars ?? [];
    if (!cals.length || !this.hass) return [];
    const gen = soon ? 0 : ++this._fetchGen;
    const out: CalEvent[] = [];
    let failed = 0;
    await Promise.all(cals.map(async (c) => {
      try {
        const rows = await this.hass!.callApi<any[]>('GET', `calendars/${c.entity}?start=${encodeURIComponent(a.toISOString())}&end=${encodeURIComponent(b.toISOString())}`);
        const who = c.name ?? this.hass!.states[c.entity]?.attributes.friendly_name ?? c.entity;
        for (const r of rows) {
          const allDay = !!r.start?.date;
          const start = allDay ? new Date(`${r.start.date}T00:00:00`) : new Date(r.start.dateTime);
          const end = allDay ? new Date(`${r.end.date}T00:00:00`) : new Date(r.end.dateTime);
          out.push({ title: r.summary ?? '(busy)', start, end, allDay, colour: c.colour, who });
        }
      } catch (e) { failed++; console.warn('Family Hub: calendar fetch failed', c.entity, e); }
    }));
    this._calError = failed === cals.length;
    if (!soon && gen !== this._fetchGen) return null; // a newer request won
    out.sort((x, y) => Number(y.allDay) - Number(x.allDay) || x.start.getTime() - y.start.getTime());
    return out;
  }

  private async _loadWeather(): Promise<void> {
    const w = this._config.weather;
    if (!w || !this.hass?.states[w]) return;
    try {
      const res = await this.hass.callWS<any>({ type: 'call_service', domain: 'weather', service: 'get_forecasts', service_data: { type: 'daily' }, target: { entity_id: w }, return_response: true });
      const f = res?.response?.[w]?.forecast?.[0];
      this._wx = { max: f?.temperature, min: f?.templow, uv: f?.uv_index, rain: f?.precipitation };
    } catch { this._wx = {}; }
  }
  /** Ticking a reminder completes it in its to-do list straight away. It stays, struck through, for four seconds; tapping it again in that time puts it back. */
  private _tickReminder(r: { uid: string; summary: string }): void {
    const t = this._config.reminders; if (!t || !this.hass) return;
    const undo = r.uid in this._remTk;
    clearTimeout(this._remTk[r.uid]);
    if (undo) { const { [r.uid]: _, ...rest } = this._remTk; this._remTk = rest; }
    else this._remTk = { ...this._remTk, [r.uid]: window.setTimeout(() => { const { [r.uid]: _, ...rest } = this._remTk; this._remTk = rest; this._reminders = this._reminders.filter((x) => x.uid !== r.uid); this._loadReminders(); }, 4000) };
    sfx(undo ? 'untick' : 'tick');
    if (!undo) { const el = [...this.renderRoot.querySelectorAll('button.rem')].find((b) => b.textContent?.trim() === r.summary)?.querySelector('.check'); if (el) spark('tick', el); }
    this._remJust = r.uid; window.setTimeout(() => { if (this._remJust === r.uid) this._remJust = ''; }, 700);
    this.hass.callService('todo', 'update_item', { item: r.uid, status: undo ? 'needs_action' : 'completed' }, { entity_id: t }).catch(() => { this._say('Couldn’t tick that off. Is Home Assistant reachable?'); const { [r.uid]: _, ...rest } = this._remTk; this._remTk = rest; });
    if (!undo) this._say(`Done: ${r.summary}. Tap it again to undo.`, 4000);
  }
  private async _loadReminders(): Promise<void> {
    const t = this._config.reminders;
    if (!t || !this.hass?.states[t]) { this._reminders = []; return; }
    try {
      const res = await this.hass.callWS<{ items: { uid: string; summary: string; status: string }[] }>({ type: 'todo/item/list', entity_id: t });
      this._reminders = res.items.filter((i) => i.status === 'needs_action' || i.uid in this._remTk).slice(0, 5);
    } catch { this._reminders = []; }
  }

  private _private(title: string): boolean {
    const t = title.toLowerCase();
    return (this._config.private ?? []).some((w) => t.includes(w.toLowerCase()));
  }
  private _eventsOn(d: Date, list = this._events): CalEvent[] {
    const s = startOfDay(d), e = addDays(s, 1);
    return list.filter((ev) => ev.start < e && ev.end > s && !(ev.allDay && ev.end.getTime() === s.getTime()));
  }
  private _morningWindow(d = new Date()): boolean {
    const c = this._config, m = c?.morning;
    if (!m || !c.kids?.length) return false;
    return isSchoolDay(d, c.school_terms, c.public_holidays) && inWindow(d, m.start ?? '06:30', m.end ?? '08:45');
  }
  private _termLabel(d = new Date()): string {
    const s = ymd(d), terms = this._config.school_terms ?? [];
    const i = terms.findIndex(([a, b]) => s >= a && s <= b);
    if (i < 0) return isSchoolDay(d, terms, this._config.public_holidays) ? 'School day' : 'Holidays';
    const start = new Date(`${terms[i][0]}T00:00:00`);
    const wk = Math.floor((startOfWeek(d).getTime() - startOfWeek(start).getTime()) / (7 * 86_400_000)) + 1;
    const m = start.getMonth(); // WA terms start Feb, Apr, Jul, Oct
    return `Term ${m <= 2 ? 1 : m <= 5 ? 2 : m <= 8 ? 3 : 4}, week ${wk}`;
  }

  // ---------- timer, alarm, meds ----------
  private _timerLeft(): number | null {
    const t = this.hass?.states['timer.kitchen'];
    if (!t) return null;
    if (t.state === 'active' && t.attributes.finishes_at) return Math.max(0, new Date(t.attributes.finishes_at).getTime() - Date.now());
    if (t.state === 'paused' && t.attributes.remaining) { const [h, m, s] = String(t.attributes.remaining).split(':').map(Number); return ((h * 60 + m) * 60 + s) * 1000; }
    return null;
  }
  /** Share of the timer still to run (falls back to a 10-minute scale). */
  private _timerFrac(left: number | null): number {
    if (left === null) return 0;
    const d = String(this.hass?.states['timer.kitchen']?.attributes.duration ?? ''), [h, m, s] = d.split(':').map(Number);
    const total = d && Number.isFinite(s) ? ((h * 60 + m) * 60 + s) * 1000 : 600_000;
    return left / Math.max(total, left, 1);
  }
  private _jarWas: number | null = null;
  /** A marble drops into the jar when its count goes up while someone is looking. */
  private _watchJar(): void {
    const v = Number(this.hass?.states['input_number.family_jar']?.state); if (!Number.isFinite(v)) return;
    if (this._jarWas !== null && v > this._jarWas) { const j = this.renderRoot.querySelector('.jarpic'); if (j) { spark('marble', j); sfx('jar'); } }
    this._jarWas = v;
  }
  private _addTimer(min: number): void { this.hass?.callService('script', 'fh_timer_add', { minutes: min }); sfx('tap'); const t = this.renderRoot.querySelector('.timerrow'); if (t) spark(this._timerLeft() !== null ? 'add' : 'rocket', t); }
  private _checkAlarm(): void {
    const m = panelMsg(this.hass);
    if (m?.alarm && m.ts && m.ts !== this._alarmSeen && Date.now() / 1000 - m.ts < 120) {
      this._alarmSeen = m.ts; this._alarm = m.ts; sfx('alarm');
      let n = 0;
      const rep = window.setInterval(() => { if (!this._alarm || ++n > 12) { clearInterval(rep); this._alarm = 0; return; } sfx('alarm'); }, 5000);
    }
  }
  /** Where a daily medicine stands. A helper that has never been set reads as midnight today, given by "unknown": that is not a dose. */
  private _medStatus(id: string, time: string): { given: Date | null; by: string; due: boolean; late: boolean; missing: boolean } {
    const st = this.hass?.states[`input_datetime.fh_med_${id}`];
    const raw = this.hass?.states[`input_text.fh_med_${id}_by`]?.state ?? '';
    const by = ['unknown', 'unavailable'].includes(raw) ? '' : raw;
    const ts = st?.attributes.timestamp ? new Date(st.attributes.timestamp * 1000) : null;
    const neverSet = !!ts && !by && ts.getHours() === 0 && ts.getMinutes() === 0 && ts.getSeconds() === 0;
    const given = ts && !neverSet && sameDay(ts, new Date()) ? ts : null;
    const n = minsNow(this._now), t = hm(time);
    return { given, by, due: !given && n >= t - 60, late: !given && n > t + 45, missing: !st || st.state === 'unavailable' };
  }
  /** Recording or removing a dose is a grown-up's job: ask for the PIN once each time the sheet is opened (meds_pin: false turns this off). */
  private _medOpen = false;
  private _medGuard(reason: string, run: () => void): void {
    if (this._medOpen || !this._config.parent_pin || this._config.meds_pin === false) { run(); return; }
    this._pinAsk = { reason, run: () => { this._medOpen = true; run(); } };
  }
  private _medBusy = '';
  private async _giveMed(id: string, by: string): Promise<void> {
    const h = this.hass!;
    if (this._medBusy) return;
    this._medBusy = id; this.requestUpdate();
    try {
      await h.callService('input_datetime', 'set_datetime', { entity_id: `input_datetime.fh_med_${id}`, timestamp: Math.floor(Date.now() / 1000) });
      await h.callService('input_text', 'set_value', { entity_id: `input_text.fh_med_${id}_by`, value: by });
      h.callService('persistent_notification', 'dismiss', { notification_id: `fh_meds_${id.split('_').pop()}` }).catch(() => undefined);
      sfx('tick');
      this._say(`Logged – given by ${by}`);
    } catch {
      this._say('That was not recorded: Home Assistant did not answer. Please try again.', 7000);
    } finally { this._medBusy = ''; this.requestUpdate(); }
  }

  /* ----- other medicine given (paracetamol and the like): a plain record, newest first ----- */
  private _medLog: { at: Date; who: string; what: string; by: string; uid?: string }[] = [];
  private _mx: { what: string; other: string; who: string; ago: number; by: string; caps: boolean } = { what: '', other: '', who: '', ago: 0, by: '', caps: true };
  private static MED_KEY = 'family-hub-med-log';
  private async _loadMedLog(): Promise<void> {
    const parse = (t: string, uid?: string) => { const [at, who, what, by] = t.split('|'); const d = new Date(at); return Number.isNaN(d.getTime()) || !what ? null : { at: d, who, what, by: by ?? '', uid }; };
    const id = this._config.med_log;
    let rows: (ReturnType<typeof parse>)[] = [];
    if (id && this.hass?.states[id]) {
      try { rows = (await this.hass.callWS<{ items: { uid: string; summary: string }[] }>({ type: 'todo/item/list', entity_id: id })).items.map((i) => parse(i.summary, i.uid)); } catch { /* shown as empty */ }
    } else {
      try { rows = (JSON.parse(localStorage.getItem(FamilyHubCard.MED_KEY) ?? '[]') as string[]).map((t) => parse(t)); } catch { /* */ }
    }
    this._medLog = rows.filter((r): r is NonNullable<typeof r> => !!r).sort((x, y) => y.at.getTime() - x.at.getTime());
  }
  private async _logMed(): Promise<void> {
    const m = this._mx, what = (m.what === 'other' ? m.other : m.what).trim();
    if (!what || !m.who) { this._say(!what ? 'Choose the medicine first.' : 'Choose who it was for.'); return; }
    const at = new Date(Date.now() - m.ago * 60000), line = `${at.toISOString()}|${m.who}|${what}|${m.by}`;
    const id = this._config.med_log;
    try {
      if (id && this.hass?.states[id]) await this.hass.callService('todo', 'add_item', { item: line }, { entity_id: id });
      else { const all = JSON.parse(localStorage.getItem(FamilyHubCard.MED_KEY) ?? '[]') as string[]; localStorage.setItem(FamilyHubCard.MED_KEY, JSON.stringify([line, ...all].slice(0, 60))); }
      sfx('tick'); this._say(`Logged: ${what} for ${m.who} at ${fmtTime(at)}`);
      this._mx = { what: '', other: '', who: '', ago: 0, by: m.by, caps: true };
      await this._loadMedLog();
    } catch { this._say('That could not be saved. Try again.'); }
  }
  private async _unlogMed(r: { at: Date; who: string; what: string; by: string; uid?: string }): Promise<void> {
    const id = this._config.med_log;
    try {
      if (r.uid && id) await this.hass!.callService('todo', 'remove_item', { item: r.uid }, { entity_id: id });
      else { const line = `${r.at.toISOString()}|${r.who}|${r.what}|${r.by}`; localStorage.setItem(FamilyHubCard.MED_KEY, JSON.stringify((JSON.parse(localStorage.getItem(FamilyHubCard.MED_KEY) ?? '[]') as string[]).filter((t) => t !== line))); }
      await this._loadMedLog(); this._say('Removed from the record');
    } catch { this._say('That could not be removed.'); }
  }

  /** Which bins go out on the bin night of the week `d` falls in: the weekly ones, plus whichever of the alternating ones has its turn. */
  private _bins(d: Date): { night: Date; bins: string[] } | null {
    const b = this._config.bins;
    if (!b) return null;
    const night = addDays(d, (b.day - d.getDay() + 7) % 7), alt = b.alternate ?? [];
    let turn: string[] = [];
    if (alt.length) {
      const a0 = b.anchor ? new Date(`${b.anchor}T00:00:00`) : new Date(2026, 0, 5);
      const weeks = Math.round((new Date(night.getFullYear(), night.getMonth(), night.getDate()).getTime() - a0.getTime()) / (7 * 86400000));
      turn = [alt[((weeks % alt.length) + alt.length) % alt.length]];
    }
    return { night, bins: [...(b.always ?? []), ...turn] };
  }
  private _binDots(bins: string[]): TemplateResult {
    const col: Record<string, string> = { green: '#2e9e4f', yellow: '#f2c230', red: '#d93a3a', blue: '#2f7fd6', purple: '#8b5cf6' };
    return html`${bins.map((n) => html`<i class="bin" style="background:${col[n.toLowerCase()] ?? 'var(--ink2)'}" aria-hidden="true"></i>`)}`;
  }

  // ---------- actions ----------
  /** Toasts stay long enough for a slow reader: at least 4.5 s, longer for longer messages. */
  private _say(msg: string, ms = Math.max(4500, msg.split(/\s+/).length * 450)): void {
    this._toast = msg;
    clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => { this._toast = ''; }, ms);
  }
  private _setTheme(id: ThemeId): void {
    this._theme = id; sfx('tap');
    try { localStorage.setItem(THEME_KEY, id); } catch { /* ignore */ }
  }
  private _setLook(id: LookId): void {
    this._look = id; setLook(id); sfx('tap');
    try { localStorage.setItem(LOOK_KEY, id); } catch { /* ignore */ }
  }
  private _toggleOpt(id: string): void {
    this._opts = { ...this._opts, [id]: !this._opts[id] }; sfx('tap');
    try { localStorage.setItem(LOOK_OPTS_KEY, JSON.stringify(this._opts)); } catch { /* ignore */ }
  }
  private _shift(dir: number): void {
    const a = this._anchor;
    this._anchor = this._view === 'day' ? addDays(a, dir) : this._view === 'week' ? addDays(a, 7 * dir) : new Date(a.getFullYear(), a.getMonth() + dir, 1);
  }
  private _allOn(): void {
    const ids = this._config.all_on;
    this.hass?.callService('light', 'turn_on', { entity_id: ids?.length ? ids : 'all' });
    sfx('tap');
    this._say(ids?.length ? 'Living areas on' : 'All lights on');
  }
  private _allOff(): void {
    const on = Object.values(this.hass?.states ?? {}).filter((s) => s.entity_id.startsWith('light.') && s.state === 'on').map((s) => s.entity_id);
    if (!on.length) { this._say('Everything’s already off'); return; }
    this.hass?.callService('light', 'turn_off', { entity_id: on });
    sfx('untick');
    this._undo = { ids: on, until: Date.now() + 10_000 };
  }
  private _undoOff(): void {
    if (!this._undo) return;
    this.hass?.callService('light', 'turn_on', { entity_id: this._undo.ids });
    this._undo = null;
    this._say('Back on');
  }
  /** A timed job tagged @song: play the tidy-up song on the child's speaker for that long, then fade it out. */
  private _tidySong(k: KidConfig, minutes: number): void {
    const h = this.hass, list = h ? rooms(h, this._config.music_players ?? []) : [];
    const room = h && (kidSpeaker(h, k, list) ?? findRoom(h, list, this._config.music_player) ?? list[0]);
    if (!h || !room) return;
    if (!minutes) { h.callService('media_player', 'media_pause', { entity_id: room.entity_id }); return; }
    const song = k.tidy_song ?? this._config.tidy_song;
    if (!song) { this._say('Set tidy_song in the card settings to add music to this job'); return; }
    play(h, room.entity_id, song, 'play').then(() => sleepIn(h, room.entity_id, minutes)).catch(() => this._say(`${room.attributes.friendly_name} couldn’t play the tidy-up song`));
  }

  private _dinnerStart(): void {
    if (Date.now() < this._dinnerCooldown) { this._say('Already called – give them a minute'); return; }
    sfx('tap');
    const timer = window.setTimeout(() => this._dinnerGo(), 3000);
    this._dinner = { at: Date.now() + 3000, timer };
  }
  private _dinnerCancel(): void { clearTimeout(this._dinner?.timer); this._dinner = null; this._say('Cancelled'); }
  private _dinnerGo(): void {
    this._dinner = null;
    const s = this._config.announce_script;
    if (!s || !this.hass) { this._say('Set announce_script in the card settings'); return; }
    this.hass.callService('script', 'turn_on', { entity_id: s });
    this._dinnerCooldown = Date.now() + 60_000;
    sfx('done');
    this._say('Calling everyone for dinner 🍽️');
  }
  private _media(service: string): void {
    const m = this._config.music_player;
    if (m) this.hass?.callService('media_player', service, { entity_id: m });
  }
  /** Ask, the children's chat. After any child's bedtime, and in quiet hours, it is for grown-ups to open. */
  private _chatLate(now = new Date()): boolean {
    const c = this._config, n = minsNow(now);
    return isQuiet(now, c.quiet?.start ?? '20:00', c.quiet?.end ?? '06:30') || (c.kids ?? []).some((k) => n >= hm(bedtimeFor(k.bedtime, now)) || n < 5 * 60);
  }
  private _openChat(): void {
    const c = this._config, open = (): void => { this._sheet = 'chat'; };
    if (!c.chat?.agent) return;
    if (c.chat.pin_after_bedtime === false || !this._chatLate()) open();
    else if (c.parent_pin) this._pinAsk = { reason: 'Chat after bedtime?', run: open };
    else this._say('The helper is asleep now. Come back in the morning.');
  }
  private _openKid(name: string): void {
    const i = (this._config.kids ?? []).findIndex((k) => k.name === name);
    if (i >= 0) { this._kid = i; this._page = 'kid'; }
  }

  // ---------- render ----------
  render(): TemplateResult | typeof nothing {
    if (!this._config) return nothing;
    const kid = this._page === 'kid' ? this._config.kids?.[this._kid] : undefined;
    const theme = themeById(kid?.theme ?? this._theme);
    const night = this._isNight();
    const look = lookById(this._lk);
    // themed looks take their tokens from the photo theme; the others define theirs in the look stylesheet
    const skin = look.themed ? `${themeStyle(theme)}${this._photo ? `;--bg:url('${this._photo}')` : ''};` : '';
    const hr = this._now.getHours(), todKey = hr >= 21 || hr < 6 ? 'night' : hr >= 18 ? 'eve' : 'day';
    const kp = this._kp, calm = this._config.calm === false ? false : kp ? kp.calm : this._config.calm === true;
    const h = this._now.getHours();
    const tod = h < 5 || h >= 21 ? 'rgba(10,20,60,.28)' : h < 7 ? 'rgba(255,170,150,.16)' : h >= 17 && h < 19 ? 'rgba(255,150,60,.14)' : h >= 19 ? 'rgba(30,40,110,.2)' : 'transparent';
    const rainy = /rain|pour|storm|lightning/.test(this.hass?.states[this._config.weather ?? '']?.state ?? '');
    if (night) return html`<div class="fh" lang="en-AU" data-tod="night" style=${`${skin}--z:${this._z}`}>${this._night()}</div>`;
    return html`
      <div lang="en-AU" class="fh ${this._idle ? 'idle' : ''} ${rainy ? 'rainy' : ''}" data-tod=${todKey} ?data-calm=${calm} style=${`${skin}--tod:${tod};--z:${this._z}`}>
        ${this._config.ambient === false || this._photo ? nothing : html`<fh-ambient .look=${this._lk} .theme=${theme.id} .tod=${todKey} .calm=${calm} .demo=${this._config.ambient_demo ?? ''}></fh-ambient><fh-ambient front .look=${this._lk} .theme=${theme.id} .tod=${todKey} .calm=${calm} .demo=${this._config.ambient_demo ?? ''}></fh-ambient>`}
        ${this._header()}
        <div class="body">${this._body()}</div>
        ${this._dock()}
        ${this._sheetView()}
        ${this._dinner ? this._dinnerView() : nothing}
        ${this._undo ? html`<div class="toast" role="status" style="display:flex;align-items:center;gap:14px">Lights off <button class="pill tap" style="height:36px;background:#fff;color:#111" @click=${() => this._undoOff()}>Undo</button></div>`
          : this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : nothing}
        ${this._alarm ? this._alarmView() : nothing}
        ${this._pinAsk ? html`<fh-pin .pin=${String(this._config.parent_pin ?? '')} reason=${this._pinAsk.reason} @ok=${() => { const r = this._pinAsk!.run; this._pinAsk = null; r(); }} @cancel=${() => { this._pinAsk = null; }}></fh-pin>` : nothing}
      </div>`;
  }

  private _body(): TemplateResult {
    const c = this._config;
    const fam = (c.calendars ?? []).filter((x) => x.colour === 'family').map((x) => x.entity);
    switch (this._page) {
      case 'groceries':
        return html`<fh-groceries .hass=${this.hass} .entity=${c.groceries ?? 'todo.shopping_list'} .usuals=${c.grocery_usuals ?? ['Milk', 'Bread', 'Eggs', 'Bananas', 'Cheese', 'Coffee']} .recipients=${c.grocery_recipients ?? []}></fh-groceries>`;
      case 'kid': {
        const k = c.kids?.[this._kid];
        if (!k) break;
        const quiet = isQuiet(this._now, c.quiet?.start ?? '20:00', c.quiet?.end ?? '06:30');
        return html`<fh-kid .hass=${this.hass} .kid=${k} .familyCalendars=${fam} .pin=${String(c.parent_pin ?? '')} .owed=${'todo.rewards_owed'}
          .jarTarget=${c.jar?.target ?? 120} .jarReward=${c.jar?.reward ?? 'a family treat'} .privateWords=${c.private ?? []} .quiet=${quiet} .oneAtATime=${kidPrefs(k).focus} @song=${(e: CustomEvent<{ minutes: number }>) => this._tidySong(k, e.detail.minutes)}></fh-kid>`;
      }
      case 'home': return html`<fh-home .hass=${this.hass} .pin=${String(c.parent_pin ?? '')} .hide=${c.home_hide ?? []} .hideScripts=${c.announce_script ? [c.announce_script] : []}
        @say=${(e: CustomEvent<string>) => this._say(e.detail)} @music=${(e: CustomEvent<string>) => { this._musicFocus = e.detail; this._page = 'music'; }}></fh-home>`;
      case 'music': return html`<fh-music .hass=${this.hass} .players=${c.music_players ?? []} .stations=${c.radio ?? []} .source=${c.radio_source ?? 'media-source://radio_browser/country/AU'} .preferred=${this._musicFocus || (c.music_player ?? '')}
        .kids=${c.kids ?? []} .people=${c.people ?? []} .pin=${String(c.parent_pin ?? '')} .quiet=${c.quiet ?? {}} .sleepMinutes=${c.music_sleep_minutes ?? 30} .map=${c.music_map ?? []} .hide=${c.music_hide ?? []} .moments=${c.music_moments ?? []} .lock=${c.music_lock !== false} .callVolume=${c.call_volume ?? 70} .callLanguage=${c.call_language ?? 'en-AU'} .callVoice=${c.call_voice ?? ''} .theme=${this._theme}></fh-music>`;
      case 'weather': return html`<fh-weather .hass=${this.hass} .entity=${c.weather ?? ''} .page=${c.weather_page ?? {}} .theme=${this._theme}></fh-weather>`;
      case 'doodle': return html`<fh-doodle .hass=${this.hass} .artists=${(c.kids ?? []).map((k) => k.name)} .pin=${String(c.parent_pin ?? '')}></fh-doodle>`;
      case 'morning': return html`<fh-morning .hass=${this.hass} .kids=${c.kids ?? []} .events=${this._soon} .leaveBy=${c.morning?.leave_by ?? '08:15'} .rules=${c.bring_rules ?? []}
        .privateWords=${c.private ?? []} .uv=${this._wx.uv ?? 0} .termLabel=${this._termLabel()} .travel=${c.morning?.travel ?? 15} @open-kid=${(e: CustomEvent<string>) => this._openKid(e.detail)}></fh-morning>`;
      default: break;
    }
    return html`${this._planner()}${this._aside()}`;
  }

  private _isNight(): boolean {
    if (this._nightManual) return true;
    const n = this._config.night;
    if (!n || this._alarm) return false;
    return inWindow(this._now, n.start, n.end) && Date.now() > this._awakeUntil;
  }

  /** One fixed row of at most two chips, most urgent first, so the header never changes height. */
  private _capsule(): TemplateResult {
    const c = this._config, chips: [number, TemplateResult][] = [];
    const left = this._timerLeft();
    // the planner already shows the timer in its side card, so only repeat it there in the last minute
    if (left !== null && (this._page !== 'planner' || left < 60000)) {
      const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
      chips.push([1, html`<button class="cap tap ${left < 60000 ? 'hot' : ''}" aria-label="Kitchen timer, ${mm} minutes ${ss} seconds left" @click=${() => { this._sheet = 'timer'; }}>⏲ <b>${mm}:${String(ss).padStart(2, '0')}</b></button>`]);
    }
    const msg = panelMsg(this.hass);
    if (msg && !msg.alarm) chips.push([4, html`<span class="cap">${msg.t}</span>`]);
    {
      const t12 = (t: string) => { const [h, mi] = t.split(':').map(Number); return `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
      const all = (c.meds ?? []).map((m) => ({ m, s: this._medStatus(m.id, m.time) }));
      const due = all.filter((x) => x.s.due), late = due.some((x) => x.s.late), done = all.filter((x) => x.s.given);
      const open = () => { this._sheet = 'meds'; };
      if (due.length === 1) { const { m, s } = due[0]; chips.push([s.late ? 0 : 2, html`<button class="cap tap ${s.late ? 'hot' : ''}" @click=${open}>💊 ${m.who ? `${m.who}: ` : ''}${s.late ? 'overdue' : 'due'} ${t12(m.time)}</button>`]); }
      else if (due.length > 1) { const who = due.map((x) => x.m.who).filter(Boolean).join(', '); chips.push([late ? 0 : 2, html`<button class="cap tap ${late ? 'hot' : ''}" aria-label=${`Medication: ${due.length} ${late ? 'overdue' : 'due'}${who ? `: ${who}` : ''}`} @click=${open}>💊 ${due.length} ${late ? 'overdue' : 'due'}${who ? html`<span class="ell">: ${who}</span>` : nothing}</button>`]); }
      else if (done.length && this._now.getHours() < 12) chips.push([5, html`<button class="cap tap ok" aria-label="Medication given" @click=${open}>💊 ✓ ${done.length === 1 ? fmtTime(done[0].s.given!) : `${done.length} given`}</button>`]);
    }
    const bn = this._bins(this._now);
    if (bn && sameDay(bn.night, this._now) && bn.bins.length) chips.push([this._now.getHours() >= 16 ? 2 : 5, html`<span class="cap" aria-label=${`Bin night: ${bn.bins.join(' and ')} bins go out tonight`}>🗑 Bins tonight ${this._binDots(bn.bins)}<span class="ell">${bn.bins.join(' + ')}</span></span>`]);
    const now = Date.now();
    const next = this._soon.find((e) => !e.allDay && e.start.getTime() > now && e.start.getTime() - now < 12 * 3_600_000 && !this._private(e.title));
    if (next) {
      const mins = Math.round((next.start.getTime() - now) / 60000);
      const when = mins < 60 ? `in ${mins} min` : `${sameDay(next.start, new Date()) ? '' : 'Tomorrow '}${fmtTime(next.start)}`;
      chips.push([3, html`<span class="cap evcap">${this._chip(next.who, next.colour)}<span class="ell">${next.title}</span><span style="white-space:nowrap">· ${when}</span></span>`]);
    }
    const m = c.music_player ? this.hass?.states[c.music_player] : undefined;
    if (m?.state === 'playing' && this._page !== 'music' && this._page !== 'planner') chips.push([6, html`<button class="cap tap" @click=${() => { this._page = 'music'; }}>♪ ${m.attributes.media_title ?? 'Playing'}</button>`]);
    return html`<div class="capsule" aria-live="polite">${chips.sort((x, y) => x[0] - y[0]).slice(0, 2).map((x) => x[1])}</div>`;
  }

  /** On a child's page: only his own next event (and the kitchen timer in its last minute). */
  private _kidCapsule(k: KidConfig): TemplateResult {
    const now = Date.now(), chips: TemplateResult[] = [], left = this._timerLeft();
    if (left !== null && left < 60000) chips.push(html`<button class="cap tap hot" @click=${() => { this._sheet = 'timer'; }}>⏲ <b>0:${String(Math.floor(left / 1000)).padStart(2, '0')}</b></button>`);
    const n = k.name.toLowerCase();
    const next = this._soon.find((e) => !e.allDay && e.start.getTime() > now && e.start.getTime() - now < 12 * 3_600_000 && !this._private(e.title) && (e.who === k.name || e.title.toLowerCase().includes(n)));
    if (next) {
      const mins = Math.round((next.start.getTime() - now) / 60000);
      const when = mins < 60 ? `in ${mins} min` : `${sameDay(next.start, new Date()) ? '' : 'Tomorrow '}${fmtTime(next.start)}`;
      chips.push(html`<span class="cap evcap">${this._chip(k.name, k.colour)}<span class="ell">Next: ${next.title}</span><span style="white-space:nowrap">· ${when}</span></span>`);
    }
    return html`<div class="capsule" aria-live="polite">${chips}</div>`;
  }

  private _header(): TemplateResult {
    const c = this._config, h = this.hass, now = this._now, clk = fmtClock(now);
    const w = c.weather ? h?.states[c.weather] : undefined;
    const temp = w?.attributes.temperature;
    const wx = this._wx, kid = this._kidOn;
    return html`
      <header ?data-tight=${!kid && !!(c.meds?.length || c.med_log) && !!(c.babysitter || c.emergency)}>
        <div class="clock">
          ${lookArt(this._lk, 'clock', { now, arcs: this._arcs(this._eventsOn(now, this._soon)) })}
          <span style="font-size:16px;font-weight:var(--w-semi, 600)" class="muted">${greeting(now)}${kid ? `, ${kid.name}` : c.family_name ? `, ${c.family_name}` : ''}</span>
          <span style="display:flex;align-items:baseline;gap:10px"><span class="display hm">${clk.hm}</span><span class="muted" style="font-size:16px;font-weight:var(--w-semi, 600)">${clk.ampm} · ${fmtShortDate(now)}</span></span>
        </div>
        ${kid ? this._kidCapsule(kid) : this._capsule()}
        <div class="right">
          ${w && !kid ? html`
            <button class="glass weather tap" aria-label="Weather" @click=${() => { if (c.weather_page !== false) this._page = 'weather'; }}>
              <span style="color:var(--accent)">${icon(weatherIcon(w.state), 28)}</span>
              <span style="display:flex;flex-direction:column;line-height:1.15">
                <span style="font-weight:var(--w-bold, 700);font-size:20px">${temp !== undefined ? `${Math.round(temp)}°` : '–'}${wx.max !== undefined ? html`<span class="muted" style="font-size:13px;font-weight:var(--w-semi, 600)"> · top ${Math.round(wx.max)}°</span>` : nothing}</span>
                <span class="muted" style="font-size:13px;font-weight:var(--w-semi, 600)">${COND[w.state] ?? w.state}${wx.rain ? ` · ${wx.rain} mm` : ''}</span>
              </span>
              ${(wx.uv ?? 0) >= 3 ? html`<span class="badge" title="UV ${wx.uv}">🧢 UV ${Math.round(wx.uv!)}</span>` : nothing}
              ${(wx.max ?? 0) >= 35 ? html`<span class="badge hot">🥵 Hot</span>` : nothing}
            </button>` : nothing}
          ${(c.people ?? []).length && !kid ? html`
            <button class="glass presence tap" aria-label=${`Who is home. ${this._whoHome()}`} @click=${() => this._say(this._whoHome())}>
              <span class="phome" aria-hidden="true">${icon('home', 18)}</span>
              ${c.people!.map((p) => {
                const home = p.entity ? h?.states[p.entity]?.state === 'home' : true;
                return html`<span class="avatar ${home ? '' : 'away'}" aria-hidden="true" style="--c:${slotVar(p.colour)}">${this._short[p.name] ?? p.name[0]}</span>`;
              })}
            </button>` : nothing}
          ${c.chat?.agent ? html`<button class="glass tap round" style="width:52px;height:52px" data-act="ask" aria-label="Ask a question" @click=${() => this._openChat()}>${icon('ask', 24)}</button>` : nothing}
          <button class="glass tap round" style="width:52px;height:52px" data-act="looks" aria-label=${kid ? `${kid.name}’s settings` : 'Looks and themes'} @click=${() => this._openLooks()}>${icon('palette')}</button>
          ${(c.meds?.length || c.med_log) && !kid ? html`<button class="glass tap round" style="width:52px;height:52px;font-size:22px" data-act="meds" aria-label="Medication" @click=${() => { this._sheet = 'meds'; this._loadMedLog(); }}>💊</button>` : nothing}
          ${(c.babysitter || c.emergency) && !kid ? html`<button class="glass tap round" style="width:52px;height:52px;font-size:20px" aria-label="House info" @click=${() => { this._sheet = 'sitter'; }}>ℹ️</button>` : nothing}
          <button class="glass tap round" style="width:52px;height:52px" data-act="night" aria-label="Night mode" @click=${() => { this._nightManual = true; }}>${icon('moon')}</button>
        </div>
      </header>`;
  }

  private _planner(): TemplateResult {
    const v = this._view, [a, b] = this._range();
    const head = v === 'week' ? ['This week', fmtRange(a, addDays(b, -1))] : v === 'day' ? [sameDay(a, new Date()) ? 'Today' : fmtDow(a), fmtLongDate(a)] : [this._anchor.toLocaleDateString('en-AU', { month: 'long' }), String(this._anchor.getFullYear())];
    if (v === 'week' && !sameDay(startOfWeek(new Date()), a)) head[0] = 'Week of';
    const cals = this._config.calendars ?? [];
    return html`
      <section class="glass planner" aria-label="Family planner">
        <div class="bar">
          <div style="display:flex;flex-direction:column;line-height:1.15;min-width:190px">
            <h1 class="t-title">${head[0]}</h1>
            <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${head[1]}</span>
          </div>
          <button class="round tap" aria-label="Previous" @click=${() => this._shift(-1)}>${icon('left', 20)}</button>
          <button class="round tap" aria-label="Next" @click=${() => this._shift(1)}>${icon('right', 20)}</button>
          <button class="pill tap" @click=${() => { this._anchor = new Date(); }}>Today</button>
          <button class="tap lead" @click=${() => { this._sheet = 'add'; }}>${icon('plus', 22)}Add</button>
          <span style="flex:1"></span>
          <div class="seg" role="group" aria-label="View">
            ${(['day', 'week', 'month'] as View[]).map((x) => html`<button class="tap" aria-pressed=${String(v === x)} @click=${() => { this._view = x; }}>${x[0].toUpperCase() + x.slice(1)}</button>`)}
          </div>
        </div>
        ${cals.length ? html`<div class="legend">${cals.map((c) => { const n = c.name ?? this.hass?.states[c.entity]?.attributes.friendly_name ?? c.entity; return html`<span style="display:flex;align-items:center;gap:6px">${this._chip(n, c.colour)}${n}</span>`; })}</div>` : nothing}
        ${this._calError ? html`<button class="pill tap" style="background:#fee2e2;color:#7f1d1d;align-self:flex-start" @click=${() => { location.reload(); }}>Calendars couldn’t load – tap to reload</button>` : nothing}
        ${!cals.length ? html`<div class="empty"><span style="color:var(--accent)">${icon('calendar', 40)}</span><h2 class="t-sub">Connect your calendars</h2><span>Add Google Calendar in Home Assistant, then list the calendars in this card's settings.</span></div>`
          : v === 'week' ? this._week(a) : v === 'day' ? this._day(a) : this._month()}
      </section>`;
  }

  private _arcs(evs: CalEvent[]): DialArc[] {
    return evs.filter((e) => !this._private(e.title)).map((e) => ({ start: e.start, end: e.end, allDay: e.allDay, colour: slotVar(e.colour) }));
  }

  /** 'past' once an event has finished today, 'next' for the next thing coming up. */
  private _evState(e: CalEvent): string {
    const now = Date.now();
    if (!e.allDay && e.end.getTime() < now) return 'past';
    const next = this._soon.find((x) => !x.allDay && x.start.getTime() > now && x.start.getTime() - now < 12 * 3_600_000 && !this._private(x.title));
    return next && next.title === e.title && next.start.getTime() === e.start.getTime() ? 'next' : '';
  }

  private _evCard(e: CalEvent): TemplateResult {
    if (this._private(e.title)) return html`<div class="ev priv"><span class="t">${e.allDay ? '' : fmtTime(e.start)}</span><span>💊</span></div>`;
    return html`<div class="ev ${this._evState(e)}" style="--c:${slotVar(e.colour)}">
      <span class="t">${e.allDay ? 'All day' : fmtTime(e.start)}</span>
      <span class="n content">${e.title}</span>
      <span class="w">${e.who}</span>
    </div>`;
  }

  private _week(a: Date): TemplateResult {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, i) => addDays(a, i));
    const cols = days.map((d) => (sameDay(d, today) ? '1.4fr' : '1fr')).join(' ');
    return html`<div class="week fade" style="grid-template-columns:${cols}">
      ${days.map((d) => {
        const evs = this._eventsOn(d), isToday = sameDay(d, today);
        const pub = evs.filter((e) => !this._private(e.title)), priv = evs.filter((e) => this._private(e.title));
        const key = ymd(d), hidden = this._clip[key] ?? 0;
        return html`<div class="col ${isToday ? 'today' : ''}">
          <div class="dayhead"><span class="muted" style="font-size:14px;font-weight:var(--w-bold, 700)">${fmtDow(d)}</span><span class="num">${d.getDate()}</span>${lookArt(this._lk, 'day', { arcs: this._arcs(pub) })}${priv.length ? html`<span class="pchip" title="Private reminder">💊</span>` : nothing}</div>
          <div class="evs" data-day=${key}>${pub.map((e) => this._evCard(e))}</div>
          ${hidden ? html`<button class="more tap" @click=${() => { this._anchor = d; this._view = 'day'; }}>+${hidden} more</button>` : nothing}
        </div>`;
      })}
    </div>`;
  }

  private _day(a: Date): TemplateResult {
    const evs = this._eventsOn(a), today = sameDay(a, new Date());
    const list = html`<div class="daylist fade scrolly" data-fits @scroll=${scrollCue}>
      ${evs.length ? evs.map((e) => this._private(e.title) ? html`<div class="dayrow" style="opacity:.7"><span style="width:90px;font-size:16px;font-weight:var(--w-semi, 600)" class="muted">${e.allDay ? 'All day' : fmtTime(e.start)}</span><span style="font-size:18px">💊 Private</span></div>` : html`
        <div class="dayrow ${this._evState(e)}" style="--c:${slotVar(e.colour)}">
          <span style="width:90px;font-size:16px;font-weight:var(--w-bold, 700)" class="muted">${e.allDay ? 'All day' : fmtTime(e.start)}</span>
          <span style="flex:1;display:flex;flex-direction:column;gap:3px"><span class="content" style="font-size:20px;font-weight:var(--w-bold, 700)">${e.title}</span>
          <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600);display:flex;align-items:center;gap:6px">${this._chip(e.who, e.colour, true)}${e.who}</span></span>
        </div>`) : html`<div class="empty"><h2 class="t-sub">Nothing on</h2><span>A free day!</span></div>`}
    </div>`;
    // a look may picture the whole day (a clock, a strip…); the list then sits beside it
    const art = lookArt(this._lk, 'dayview', { arcs: this._arcs(evs), now: today ? this._now : undefined, size: 340 });
    return art === nothing ? list : html`<div class="dayview fade"><div class="dayart">${art}</div>${list}</div>`;
  }

  private _month(): TemplateResult {
    const s = startOfMonthGrid(this._anchor), m = this._anchor.getMonth(), today = new Date();
    return html`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px" class="fade">
      <div class="mhead">${Array.from({ length: 7 }, (_, i) => html`<span>${fmtDow(addDays(s, i))}</span>`)}</div>
      <div class="month">
        ${Array.from({ length: 42 }, (_, i) => addDays(s, i)).map((d) => {
          const evs = this._eventsOn(d).filter((e) => !this._private(e.title)), isToday = sameDay(d, today);
          return html`<button class="cell tap ${d.getMonth() !== m ? 'out' : ''} ${isToday ? 'today' : ''}" style="text-align:left" aria-label="${fmtLongDate(d)}${isToday ? ', today' : ''}, ${evs.length ? `${evs.length} event${evs.length > 1 ? 's' : ''}` : 'nothing on'}" @click=${() => { this._anchor = d; this._view = 'day'; }}>
            <span style="font-size:14px;font-weight:var(--w-bold, 700)">${d.getDate()}</span>
            ${evs.slice(0, 2).map((e) => html`<span class="mev">${this._chip(e.who, e.colour, true)}${e.title}</span>`)}
            ${evs.length > 2 ? html`<span class="mev muted">+${evs.length - 2}</span>` : nothing}
          </button>`;
        })}
      </div>
    </div>`;
  }

  private _aside(): TemplateResult {
    const c = this._config, m = c.music_player ? this.hass?.states[c.music_player] : undefined;
    const playing = m?.state === 'playing';
    const left = this._timerLeft();
    const mm = left !== null ? Math.floor(left / 60000) : 0, ss = left !== null ? Math.floor((left % 60000) / 1000) : 0;
    const jar = num(this.hass, 'input_number.family_jar'), target = c.jar?.target ?? 120;
    return html`<aside>
      ${m ? html`<section class="glass card np ${playing ? 'playing' : ''}" aria-label="Now playing">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="label">${playing ? 'Now playing' : 'Music'}</span><span class="muted" style="font-size:12px">${m.attributes.friendly_name}</span></div>
        <div class="np-main" style="display:flex;align-items:center;gap:12px">
          <div class="art" style=${m.attributes.entity_picture ? `--pic:url(${m.attributes.entity_picture})` : ''}></div>
          <div class="np-row" style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1">
            <span style="font-size:16px;font-weight:var(--w-bold, 700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.attributes.media_title ?? (m.state === 'off' ? 'Off' : 'Nothing playing')}</span>
            <span class="muted" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.attributes.media_artist ?? ''}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:22px">
          <button class="tap" aria-label="Previous track" @click=${() => this._media('media_previous_track')}>${solid('prev')}</button>
          <button class="tap round" style="width:54px;height:54px" aria-label=${playing ? 'Pause' : 'Play'} @click=${() => this._media('media_play_pause')}>${solid(playing ? 'pause' : 'play', 20)}</button>
          <button class="tap" aria-label="Next track" @click=${() => this._media('media_next_track')}>${solid('next')}</button>
        </div>
      </section>` : nothing}

      <section class="glass card" aria-label="Kitchen timer">
        <span class="label">Kitchen timer</span>
        <div class="timerrow ${left !== null ? 'on' : ''}">${lookArt(this._lk, 'timer', { frac: this._timerFrac(left) })}<span class="display" role="timer" aria-label="Kitchen timer" style="font-size:32px;font-weight:var(--w-bold, 700);font-variant-numeric:tabular-nums">${left !== null ? `${mm}:${String(ss).padStart(2, '0')}` : '0:00'}</span>
          <span class="muted hint" style="font-size:13px">${left !== null ? 'running · beeps everywhere' : 'tap to start'}</span>
          ${left !== null ? html`<button class="tap muted" style="margin-left:auto;font-size:14px;font-weight:var(--w-bold, 700)" @click=${() => this.hass?.callService('timer', 'cancel', { entity_id: 'timer.kitchen' })}>Clear</button>` : nothing}</div>
        <div class="grid3">${[1, 5, 10].map((n) => html`<button class="tap quick" @click=${() => this._addTimer(n)}>+${n} min</button>`)}</div>
      </section>

      <section class="glass card scrolly" aria-label="Reminders" style="flex:1;min-height:0;overflow-y:auto">
        ${this.hass?.states['input_number.family_jar'] ? html`<div style="display:flex;align-items:center;gap:10px"><span class="jarpic" style="font-size:24px">🫙</span>
          <span style="flex:1;display:flex;flex-direction:column;gap:4px"><span style="font-size:14px;font-weight:var(--w-bold, 700)">Family jar · ${jar >= target ? 'full! 🎉' : `${jar}/${target}`}</span>
          <div class="xpbar meter"><div style="width:${Math.min(100, (jar / target) * 100)}%"></div></div></span></div>` : nothing}
        <span class="label">Reminders</span>
        ${this._reminders.length ? this._reminders.map((r) => { const done = r.uid in this._remTk; return html`<button class="rem tap ${done ? 'done' : ''}" ?data-just=${this._remJust === r.uid} aria-pressed=${String(done)} @click=${() => this._tickReminder(r)}><span class="ring check">${done ? html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : nothing}</span><span class="content"><span class="strike">${r.summary}</span></span></button>`; })
          : html`<span class="muted" style="font-size:14px">${c.reminders ? 'All done!' : 'Pick a to-do list for reminders in the card settings.'}</span>`}
      </section>
    </aside>`;
  }

  private _dock(): TemplateResult {
    const item = (ic: string, label: string, on: () => void, current = false) =>
      html`<button class="item tap" data-nav=${ic} aria-current=${current ? 'page' : 'false'} @click=${() => { sfx('tap'); on(); }}>${icon(ic, 26)}${label}</button>`;
    const kids = this._config.kids ?? [];
    return html`<nav class="glass dock" aria-label="Main">
      ${kids.map((k, i) => {
        const e = kidEntities(k), raw = this.hass?.states[e.avatar]?.state;
        const look = raw || k.look ? decodeLook(raw, k.look ? decodeLook(k.look) : {}) : null;
        const on = this._page === 'kid' && this._kid === i;
        return html`<button class="item kidbtn tap" style="--kidc:${slotVar(k.colour)}" aria-current=${on ? 'page' : 'false'} @click=${() => { sfx('tap'); this._kid = i; this._page = 'kid'; }}>
          <span class="avatar" style="width:44px;height:44px;background:${slotVar(k.colour)}">${look ? renderAvatar(look, { size: 44, crop: 'head', still: true, label: k.name, age: k.age, ring: slotVar(k.colour) }) : k.name[0]}</span>${k.name}</button>`;
      })}
      ${kids.length ? html`<span class="sep" aria-hidden="true"></span>` : nothing}
      ${this._morningWindow() ? item('sun', 'Morning', () => { this._page = 'morning'; }, this._page === 'morning') : nothing}
      ${item('calendar', 'Planner', () => { this._page = 'planner'; }, this._page === 'planner')}
      ${item('cart', 'Groceries', () => { this._page = 'groceries'; }, this._page === 'groceries')}
      ${item('pencil', 'Doodle', () => { this._page = 'doodle'; }, this._page === 'doodle')}
      ${item('music', 'Music', () => { this._page = 'music'; }, this._page === 'music')}
      ${this._config.weather && this._config.weather_page !== false ? item('cloud', 'Weather', () => { this._page = 'weather'; }, this._page === 'weather') : nothing}
      ${item('home', 'Home', () => { this._page = 'home'; }, this._page === 'home')}
      <span class="sep" aria-hidden="true"></span>
      <button class="item tap" data-nav="lights-on" @click=${() => this._allOn()}><span style="color:var(--accent)">${icon('bulb', 26)}</span>All on</button>
      <button class="item tap" data-nav="lights-off" @click=${() => this._allOff()}>${icon('bulbOff', 26)}All off</button>
      <button class="item tap ${Date.now() < this._dinnerCooldown ? 'called' : ''}" data-nav="dinner" @click=${() => this._dinnerStart()}>${icon('megaphone', 26)}${Date.now() < this._dinnerCooldown ? 'Called ✓' : 'Dinner'}</button>
    </nav>`;
  }

  private _dinnerView(): TemplateResult {
    const n = Math.max(1, Math.ceil(((this._dinner?.at ?? 0) - Date.now()) / 1000));
    return html`<div class="scrim"><section class="glass sheet" style="width:min(520px,90%);align-items:center;text-align:center" role="alertdialog" aria-label="Calling dinner">
      <span style="font-size:56px">🍽️</span><h2 class="t-head">Calling everyone in ${n}…</h2>
      <span class="muted">${isQuiet(this._now, '19:30', '07:00') ? 'Quiet hours: kitchen and lounge only' : 'Lounge, kitchen and bedrooms'}</span>
      <button class="pill tap" style="height:56px;padding:0 28px;font-size:17px" @click=${() => this._dinnerCancel()}>Cancel</button></section></div>`;
  }

  private _alarmView(): TemplateResult {
    return html`<button class="alarm" @click=${() => { this._alarm = 0; this.hass?.callService('input_text', 'set_value', { entity_id: 'input_text.fh_panel_message', value: '' }); }}>
      <span style="font-size:96px">⏰</span><span class="display" style="font-size:64px;font-weight:var(--w-heavy, 800);text-align:center;padding:0 40px">${panelMsg(this.hass)?.t || 'Timer’s done!'}</span><span style="font-size:20px;font-weight:var(--w-semi, 600)">Tap to stop</span></button>`;
  }

  private _sheetView(): TemplateResult | typeof nothing {
    const s = this._sheet;
    if (!s) return nothing;
    const close = () => { this._sheet = ''; };
    if (s === 'add') return html`<fh-add-event .hass=${this.hass} .calendars=${this._config.calendars ?? []} .defaultCal=${this._config.add_calendar ?? ''} .places=${this._config.address_search !== false}
      @click=${close} @close=${close} @saved=${(e: CustomEvent<string>) => { close(); this._say(`Added “${e.detail}”`); this._fetchedKey = ''; this._refresh(); this._loadSoon(); }}></fh-add-event>`;
    if (s === 'chat') { const ch = this._config.chat, name = ch?.name || 'Ask';
      if (!ch?.agent) return nothing;
      return html`<div class="scrim" @click=${(e: Event) => { if (e.target === e.currentTarget) close(); }}>
        <section class="glass sheet chatsheet" role="dialog" aria-modal="true" aria-label=${name}>${this._sheetHead(name, 'Ask a question, or tap a picture.')}
          <fh-chat .hass=${this.hass} .agent=${ch.agent} .pipeline=${ch.pipeline ?? ''} .helper=${name} .pin=${!!this._config.parent_pin} @close=${close} @pin=${(e: CustomEvent<{ reason: string; run: () => void }>) => { this._pinAsk = e.detail; }}></fh-chat></section></div>`; }
    const body = s === 'themes' ? this._themeBody() : s === 'kidprefs' ? this._kidPrefsBody() : s === 'meds' ? this._medsBody() : s === 'timer' ? this._timerBody() : this._sitterBody();
    return html`<div class="scrim" @click=${(e: Event) => { if (e.target === e.currentTarget) close(); }}>
      <section class="glass sheet" role="dialog" aria-modal="true" aria-label=${{ themes: 'Pick a look', kidprefs: 'Settings', meds: 'Medication', timer: 'Kitchen timer', sitter: 'House info' }[s] ?? 'Panel'} style=${s === 'themes' ? '' : s === 'sitter' || s === 'meds' ? 'width:min(860px,94%)' : s === 'kidprefs' ? 'width:min(860px,94%);gap:14px' : 'width:min(640px,92%)'}>${body}</section></div>`;
  }
  private _sheetHead(title: string, sub = ''): TemplateResult {
    return html`<div style="display:flex;align-items:flex-start;gap:16px">
      <div style="flex:1"><h2 class="t-head">${title}</h2>${sub ? html`<span class="muted">${sub}</span>` : nothing}</div>
      <button class="round tap" aria-label="Close" @click=${() => { this._sheet = ''; }}>${icon('close', 18)}</button></div>`;
  }
  private _themeBody(): TemplateResult {
    return html`${this._sheetHead('Pick a look', 'Changes the whole panel.')}
      <div class="themes looks">
        ${LOOKS.map((l) => html`<button class="tcard tap" aria-pressed=${String(l.id === this._look)} @click=${() => this._setLook(l.id)}>
          ${lookPreview(l, 120, themeStyle(themeById(this._theme)))}
          <span style="font-size:16px;font-weight:var(--w-bold, 700)">${l.name}</span><span class="muted" style="font-size:13px">${l.tagline}</span>
        </button>`)}
      </div>
      ${(lookById(this._look).options ?? []).map((o) => this._optRow(o, !!this._opts[o.id], () => this._toggleOpt(o.id)))}
      ${!lookById(this._look).themed ? nothing : html`<span class="label">Background</span>
      <div class="themes">
        ${THEMES.map((t) => html`<button class="tcard tap" aria-pressed=${String(t.id === this._theme)} @click=${() => this._setTheme(t.id)}>
          <span class="tprev" style=${themeStyle(t)}>${[1, 2, 3, 4, 5].map((n) => html`<span style="background:var(--p-${n})"></span>`)}</span>
          <span style="font-size:16px;font-weight:var(--w-bold, 700)">${t.name}</span><span class="muted" style="font-size:13px">${t.tagline}</span>
        </button>`)}
      </div>`}
      <div style="display:flex;justify-content:space-between;align-items:center">
        ${!lookById(this._look).themed ? html`<span></span>` : html`<button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" @click=${() => { const o = THEMES.filter((t) => t.id !== this._theme); this._setTheme(o[Math.floor(Math.random() * o.length)].id); }}>${icon('shuffle', 20)}Surprise me</button>`}
        <span class="muted" style="font-size:12px">Family Hub v${VERSION}</span>
      </div>`;
  }
  /** A look's switch: a two-way toggle when it names both sides (Print | Handwriting), otherwise an on/off switch. */
  private _optRow(o: LookOption, on: boolean, flip: () => void): TemplateResult {
    if (o.off && o.on) return html`<div class="setrow"><span class="setlabel"><b>${o.label}</b>${o.hint ? html`<span class="muted">${o.hint}</span>` : nothing}</span>
      <div class="seg" role="group" aria-label=${o.label}>
        <button class="tap" aria-pressed=${String(!on)} @click=${() => { if (on) flip(); }}>${o.off}</button>
        <button class="tap" aria-pressed=${String(on)} style=${o.onStyle ?? ''} @click=${() => { if (!on) flip(); }}>${o.on}</button></div></div>`;
    return this._switchRow(o.label, o.hint ?? '', on, flip);
  }
  private _switchRow(label: string, hint: string, on: boolean, flip: () => void): TemplateResult {
    return html`<div class="setrow"><span class="setlabel"><b>${label}</b>${hint ? html`<span class="muted">${hint}</span>` : nothing}</span>
      <button class="tap opt" role="switch" aria-checked=${String(on)} aria-label=${label} @click=${flip}><span class="sw" aria-hidden="true"></span></button></div>`;
  }
  private _kidPrefsBody(): TemplateResult {
    const k = this._kidOn, p = this._kp;
    if (!k || !p) return html``;
    void this._prefTick;
    const eff = lookById(this._lk), hand = eff.options?.find((o) => o.id === 'hand');
    const looks: [string, string, string][] = [['panel', 'Same as the panel', `Follows the family’s choice (${lookById(this._look).name})`], ...LOOKS.map((l): [string, string, string] => [l.id, l.name, l.tagline])];
    return html`${this._sheetHead(`${k.name}’s settings`, `Only for ${k.name}’s page.`)}
      <div class="themes" style="grid-template-columns:repeat(4,minmax(0,1fr))">
        ${looks.map(([id, name, tag]) => html`<button class="tcard tap" aria-pressed=${String(p.look === id)} @click=${() => this._setKidPref({ look: id })}>
          ${id === 'panel' ? html`<span class="tprev" style="height:84px;background:var(--chip);align-items:center;justify-content:center">${icon('home', 30)}</span>` : lookPreview(lookById(id), 84, themeStyle(themeById(this._theme)))}
          <span style="font-size:16px;font-weight:var(--w-bold, 700)">${name}</span><span class="muted" style="font-size:13px">${tag}</span></button>`)}
      </div>
      ${hand ? this._optRow(hand, p.font === 'hand', () => this._setKidPref({ font: p.font === 'hand' ? 'print' : 'hand' })) : nothing}
      ${this._switchRow('One job at a time', 'Shows Now, Next and Later instead of the whole list.', p.focus, () => this._setKidPref({ focus: !p.focus }))}
      ${this._switchRow('Calm mode', 'No looping motion or tilted cards.', p.calm, () => this._setKidPref({ calm: !p.calm }))}
      <div class="setrow"><span class="setlabel"><b>Sounds</b><span class="muted">Timers and alarms always sound.</span></span>
        <div class="seg" role="group" aria-label="Sounds">${(['full', 'soft', 'off'] as const).map((v) => html`<button class="tap" aria-pressed=${String(p.sound === v)} @click=${() => this._setKidPref({ sound: v })}>${v[0].toUpperCase() + v.slice(1)}</button>`)}</div></div>`;
  }
  private _medsBody(): TemplateResult {
    const c = this._config, parents = c.parents ?? (c.people ?? []).map((p) => p.name), kids = (c.kids ?? []).map((k) => k.name);
    const m = this._mx, extras = c.med_extras ?? ['Paracetamol', 'Ibuprofen'], now = this._now;
    const set = (patch: Partial<typeof m>) => { this._mx = { ...m, ...patch }; };
    const at = new Date(now.getTime() - m.ago * 60000);
    const recent = this._medLog.filter((r) => now.getTime() - r.at.getTime() < 48 * 3_600_000);
    const since = (d: Date) => { const mins = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60000)); return mins < 60 ? `${mins} min ago` : mins < 48 * 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min ago` : ''; };
    const t12 = (hhmm: string) => { const [h, mi] = hhmm.split(':').map(Number); return `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
    const pick = (on: boolean, label: string, go: () => void) => html`<button class="tap mchip" aria-pressed=${String(on)} @click=${go}>${label}</button>`;
    return html`${this._sheetHead('Medication', 'Kept off the kids’ pages and the night screen.')}
      <div class="med2">
        <div class="icol">
          <span class="label">Every day</span>
          ${(c.meds ?? []).map((d) => {
            const s = this._medStatus(d.id, d.time);
            return html`<div class="card" style="background:var(--chip);border-radius:18px;gap:8px">
              <div style="display:flex;align-items:center;gap:10px"><span style="font-size:24px" aria-hidden="true">💊</span>
                <span style="flex:1;display:flex;flex-direction:column;min-width:0"><b style="font-size:17px">${d.who ? `${d.who} – ` : ''}${d.label}</b><span class="muted">Due ${t12(d.time)}</span></span>
                <b style="font-size:15px;color:${s.given ? 'var(--ok)' : s.late ? 'var(--danger, #dc2626)' : 'var(--ink2)'}">${s.given ? `✓ ${fmtTime(s.given)}${s.by ? ` · ${s.by}` : ''}` : s.missing ? 'Not set up' : s.late ? 'Overdue' : 'Not yet'}</b></div>
              ${s.missing ? html`<span class="muted" role="note">Not set up yet: Home Assistant has no helper called <b>input_datetime.fh_med_${d.id}</b>, so this cannot be recorded here.</span>`
                : s.given ? nothing : html`<div style="display:flex;gap:8px;flex-wrap:wrap">${parents.map((p) => html`<button class="pill tap primary" style="height:46px;padding:0 16px;font-size:15px" ?disabled=${this._medBusy === d.id} @click=${() => this._medGuard('Record this medicine?', () => { void this._giveMed(d.id, p); })}>Given by ${p}</button>`)}</div>`}
            </div>`;
          })}
          <span class="label">Given in the last two days</span>
          ${recent.length ? recent.map((r) => html`<div class="irow"><span style="min-width:0"><b>${r.who}</b> · ${r.what}<br><small class="muted">${r.at.toLocaleDateString('en-AU', { weekday: 'short' })} ${fmtTime(r.at)}${r.by ? ` · ${r.by}` : ''} · ${since(r.at)}</small></span>
            <button class="tap" style="width:44px;height:44px;border-radius:50%;flex-shrink:0" aria-label=${`Remove ${r.what} for ${r.who} from the record`} @click=${() => this._medGuard('Remove this from the record?', () => { void this._unlogMed(r); })}>${icon('close', 16)}</button></div>`)
            : html`<span class="iline muted">Nothing else has been given.</span>`}
        </div>
        <div class="icol">
          <span class="label">Something else given</span>
          <div class="mrow">${extras.map((x) => pick(m.what === x, x, () => set({ what: x })))}${pick(m.what === 'other', 'Other…', () => set({ what: 'other' }))}</div>
          ${m.what === 'other' ? html`<input class="field" style="height:48px;font-size:18px" inputmode="none" aria-label="Which medicine" placeholder="Which medicine?" .value=${m.other} @input=${(e: Event) => set({ other: (e.target as HTMLInputElement).value })}>
            ${keyboard((k) => { const [t, caps] = typeKey(m.other, k, m.caps); set({ other: t, caps }); }, m.caps, () => set({ caps: !m.caps }), true)}` : nothing}
          <span class="label">For</span>
          <div class="mrow">${kids.map((k) => pick(m.who === k, k, () => set({ who: k })))}</div>
          <span class="label">When</span>
          <div class="mrow" style="align-items:center">
            <button class="tap mchip" aria-label="Five minutes earlier" @click=${() => set({ ago: Math.min(24 * 60, m.ago + 5) })}>− 5 min</button>
            <b class="display" style="font-size:24px;min-width:104px;text-align:center;font-variant-numeric:tabular-nums" aria-live="polite">${m.ago ? fmtTime(at) : 'Now'}</b>
            <button class="tap mchip" aria-label="Five minutes later" ?disabled=${m.ago === 0} @click=${() => set({ ago: Math.max(0, m.ago - 5) })}>+ 5 min</button>
            ${m.ago ? html`<span class="muted" style="font-size:13px;font-weight:var(--w-semi, 600)">${m.ago} min ago</span>` : nothing}
          </div>
          ${parents.length ? html`<span class="label">Given by</span><div class="mrow">${parents.map((p) => pick(m.by === p, p, () => set({ by: p })))}</div>` : nothing}
          <button class="tap lead" style="height:56px;font-size:17px;margin-top:6px" @click=${() => this._medGuard('Add to the medicine record?', () => { void this._logMed(); })}>Add to the record</button>
          <span class="muted" style="font-size:12.5px;line-height:1.35">A record only: it shows what was given and when. Follow the label or your doctor for doses and how long to wait.</span>
        </div>
      </div>`;
  }
  private _timerBody(): TemplateResult {
    const left = this._timerLeft() ?? 0, mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
    return html`${this._sheetHead('Kitchen timer')}
      <span style="align-self:center;line-height:0">${lookArt(this._lk, 'timer', { frac: this._timerFrac(this._timerLeft()), size: 170 })}</span>
      <span class="display" style="font-size:88px;font-weight:var(--w-bold, 700);text-align:center;font-variant-numeric:tabular-nums">${mm}:${String(ss).padStart(2, '0')}</span>
      <div class="grid3" style="gap:10px">${[1, 5, 10].map((n) => html`<button class="tap quick" style="height:56px;font-size:18px" @click=${() => this._addTimer(n)}>+${n} min</button>`)}</div>
      <button class="pill tap" style="height:52px;justify-content:center" @click=${() => { this.hass?.callService('timer', 'cancel', { entity_id: 'timer.kitchen' }); this._sheet = ''; }}>Cancel timer</button>`;
  }
  /** In words, who is home and who is away. */
  private _whoHome(): string {
    const ppl = this._config.people ?? [], here = ppl.filter((p) => !p.entity || this.hass?.states[p.entity]?.state === 'home').map((p) => p.name), out = ppl.filter((p) => !here.includes(p.name)).map((p) => p.name);
    const join = (n: string[]) => n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : n[0];
    return [here.length ? `${join(here)} ${here.length > 1 ? 'are' : 'is'} home` : '', out.length ? `${join(out)} ${out.length > 1 ? 'are' : 'is'} away` : ''].filter(Boolean).join(' · ') + '.';
  }
  private _sosT = 0;
  private _sos: '' | 'hold' | 'sending' | 'sent' | 'failed' = '';
  private _sosNote = '';
  /** Hold for a second and a half: long enough that a small hand leaning on the glass does not send it. */
  private _sosDown(): void {
    if (this._sos === 'sending') return;
    this._sos = 'hold'; this.requestUpdate();
    clearTimeout(this._sosT);
    this._sosT = window.setTimeout(() => this._sosSend(), 1500);
  }
  private _sosUp(): void { if (this._sos === 'hold') { clearTimeout(this._sosT); this._sos = ''; this._sosNote = 'Keep holding until the bar is full.'; this.requestUpdate(); } }
  private async _sosSend(): Promise<void> {
    const e = this._config.emergency, to = e?.notify ?? [];
    this._sos = 'sending'; this._sosNote = ''; this.requestUpdate();
    const at = fmtTime(new Date());
    const results = await Promise.allSettled(to.map((svc) => {
      const [domain, service] = svc.includes('.') ? svc.split('.') : ['notify', svc];
      return this.hass!.callService(domain, service, {
        title: '🚨 Emergency at home',
        message: e?.message ?? `The emergency button on the family panel was pressed at ${at}. Call home now.`,
        // loud even on silent or Do Not Disturb: iPhone (critical alert) and Android (alarm channel)
        data: { push: { sound: { name: 'default', critical: 1, volume: 1 }, 'interruption-level': 'critical' }, ttl: 0, priority: 'high', channel: 'alarm_stream', tag: 'fh-emergency' }
      });
    }));
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    this._sos = ok ? 'sent' : 'failed';
    this._sosNote = ok === to.length ? `Sent to ${ok === 1 ? 'one phone' : `${ok} phones`} at ${at}. If it is serious, call 000 now.` : ok ? `Sent to ${ok} of ${to.length} phones. Ring them as well.` : 'It could not be sent. Ring them on the numbers below.';
    sfx(ok ? 'done' : 'tap'); this.requestUpdate();
  }
  private _sitterBody(): TemplateResult {
    const c = this._config, b = c.babysitter ?? {}, e = c.emergency, now = this._now;
    // a line such as "Dad: 0400 000 000" is a contact; anything else is a note
    const phone = /^(.{1,40}?):\s*(\+?[\d ()-]{8,})$/;
    const contacts = [...(b.contacts ?? []), ...(b.lines ?? []).map((l) => phone.exec(l)).filter((m): m is RegExpExecArray => !!m).map((m) => ({ name: m[1], phone: m[2].trim() }))];
    const notes = [...(b.lines ?? []).filter((l) => !phone.test(l)), ...(b.notes ?? [])];
    const beds = (c.kids ?? []).filter((k) => k.bedtime).map((k) => ({ name: k.name, at: bedtimeFor(k.bedtime, now) }));
    const tonight = this._eventsOn(now, this._soon).filter((x) => !x.allDay && x.end > now && !this._private(x.title)).slice(0, 4);
    const t12 = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
    const h3 = (t: string) => html`<span class="label">${t}</span>`;
    return html`${this._sheetHead(b.title ?? 'House info', 'For babysitters, grandparents and visitors')}
      <div class="sos">
        <div class="sos000"><b>In an emergency call 000</b><span>Ambulance, fire or police. Poisons Information: 13 11 26.</span>
          ${b.address ? html`<span class="sosaddr">You are at <b>${b.address}</b></span>` : nothing}</div>
        ${e?.notify?.length ? html`<button class="sosbtn tap" data-s=${this._sos} aria-label=${`Hold to alert ${e.who ?? 'the parents'}`} aria-describedby="sosnote"
          @pointerdown=${() => this._sosDown()} @pointerup=${() => this._sosUp()} @pointerleave=${() => this._sosUp()} @pointercancel=${() => this._sosUp()}
          @keydown=${(ev: KeyboardEvent) => { if ((ev.key === 'Enter' || ev.key === ' ') && !ev.repeat) this._sosDown(); }} @keyup=${() => this._sosUp()} @contextmenu=${(ev: Event) => ev.preventDefault()}>
          <i aria-hidden="true"></i><span aria-hidden="true" style="font-size:26px">🚨</span>
          <span><b>${this._sos === 'sending' ? 'Sending…' : this._sos === 'sent' ? 'Alert sent' : `Alert ${e.who ?? 'the parents'}`}</b><small>${this._sos === 'sent' ? 'Hold again to send another' : 'Press and hold'}</small></span></button>` : nothing}
      </div>
      <span id="sosnote" role="status" class="sosnote">${this._sosNote}</span>
      <div class="info2">
        <div class="icol">
          ${contacts.length ? html`${h3('Who to ring')}${contacts.map((p) => html`<div class="irow"><b>${p.name}</b><span class="display" style="font-size:20px;font-variant-numeric:tabular-nums">${p.phone}</span></div>`)}` : nothing}
          ${b.wifi ? html`${h3('Wi-Fi')}<div class="irow"><b>${b.wifi.name}</b><span>${b.wifi.password ?? ''}</span></div>` : nothing}
          ${(c.people ?? []).length ? html`${h3('Who is home')}<div class="iline">${this._whoHome()}</div>` : nothing}
        </div>
        <div class="icol">
          ${beds.length ? html`${h3('Bedtimes tonight')}${beds.map((k) => html`<div class="irow"><b>${k.name}</b><span>${t12(k.at)}</span></div>`)}` : nothing}
          ${tonight.length ? html`${h3('Still on today')}${tonight.map((x) => html`<div class="irow"><b class="ell">${x.title}</b><span style="white-space:nowrap">${fmtTime(x.start)}</span></div>`)}` : nothing}
          ${this._bins(now) ? html`${h3('Bin night')}<div class="irow"><b>${sameDay(this._bins(now)!.night, now) ? 'Tonight' : this._bins(now)!.night.toLocaleDateString('en-AU', { weekday: 'long' })}</b><span style="display:inline-flex;align-items:center;gap:6px">${this._binDots(this._bins(now)!.bins)}${this._bins(now)!.bins.join(' + ')}</span></div>` : nothing}
          ${notes.length ? html`${h3('Good to know')}${notes.map((l) => html`<div class="iline">${l}</div>`)}` : nothing}
        </div>
      </div>`;
  }

  private _night(): TemplateResult {
    const now = this._now, clk = fmtClock(now), early = now.getHours() < 6;
    const day = early ? now : addDays(now, 1);
    const evs = this._eventsOn(day, this._soon).filter((e) => !this._private(e.title)).slice(0, 3);
    // burn-in care: the whole screen wanders on a slow path that takes hours to repeat, so no pixel rests
    const t = now.getHours() * 60 + now.getMinutes();
    const dx = Math.round(Math.sin(t / 7) * 38), dy = Math.round(Math.cos(t / 11) * 24);
    const amber = this._arcs(this._eventsOn(now, this._soon)).map((x) => ({ ...x, colour: 'rgba(255,178,107,.7)' }));
    const art = lookArt(this._lk, 'night', { now, arcs: amber, size: 230 });
    return html`<button class="night" aria-label="Wake the panel" @click=${() => { this._nightManual = false; this._awakeUntil = Date.now() + 10 * 60_000; this._lastTouch = Date.now(); }}>
      <div class="nwander" style="transform:translate(${dx}px, ${dy}px)">
      <div class="nclock">${art === nothing ? nothing : html`<span class="nart">${art}</span>`}<div><span class="display big">${clk.hm}</span><div class="ndate">${fmtLongDate(now)}</div></div></div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px">
        ${evs.length ? html`<div class="dglass" style="width:460px;border-radius:28px;padding:22px 24px;display:flex;flex-direction:column;gap:12px">
          <span style="font-size:13px;font-weight:var(--w-semi, 600);text-transform:uppercase;letter-spacing:.06em;opacity:.8">${early ? 'Today' : 'Tomorrow'}</span>
          ${evs.map((e) => html`<div style="display:flex;align-items:center;gap:12px;font-size:18px"><span style="width:80px;opacity:.8">${e.allDay ? 'All day' : fmtTime(e.start)}</span>${e.title}</div>`)}
        </div>` : html`<span></span>`}
        <span class="breathe" style="font-size:16px;opacity:.7">Tap anywhere to wake</span>
      </div>
      </div>
    </button>`;
  }
}

if (!customElements.get('family-hub-card')) customElements.define('family-hub-card', FamilyHubCard);
const w = window as unknown as { customCards?: unknown[] };
w.customCards = w.customCards || [];
w.customCards.push({ type: 'family-hub-card', name: 'Family Hub', description: 'Glassy, themeable family planner for wall panels.', preview: false });
console.info(`%c FAMILY-HUB %c v${VERSION} `, 'background:#0b5fa5;color:#fff;border-radius:3px 0 0 3px;padding:2px 6px', 'background:#ffd166;color:#0b2236;border-radius:0 3px 3px 0;padding:2px 6px');
