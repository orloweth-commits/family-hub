import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { THEMES, themeById, themeStyle, type ThemeId } from './themes';
import { styles } from './styles';
import './groceries';
import { icon, solid, weatherIcon } from './icons';
import { slotVar, type CalEvent, type FamilyHubConfig, type Hass } from './types';
import {
  addDays, fmtClock, fmtDow, fmtLongDate, fmtMonthYear, fmtRange, fmtShortDate, fmtTime, greeting, inWindow,
  sameDay, startOfDay, startOfMonthGrid, startOfWeek
} from './dates';

type View = 'day' | 'week' | 'month';
type Page = 'planner' | 'groceries';
const VERSION = '0.2.0';
const THEME_KEY = 'family-hub-theme';

function loadFonts(): void {
  if (document.getElementById('family-hub-fonts')) return;
  const l = document.createElement('link');
  l.id = 'family-hub-fonts';
  l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(l);
}

export class FamilyHubCard extends LitElement {
  static styles = styles;
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _view: { state: true },
    _anchor: { state: true },
    _events: { state: true },
    _loading: { state: true },
    _theme: { state: true },
    _showThemes: { state: true },
    _flash: { state: true },
    _now: { state: true },
    _toast: { state: true },
    _rain: { state: true },
    _reminders: { state: true },
    _timerEnd: { state: true },
    _timerLabel: { state: true },
    _awakeUntil: { state: true },
    _nightManual: { state: true },
    _page: { state: true }
  };

  hass?: Hass;
  private _config!: FamilyHubConfig;
  private _view: View = 'week';
  private _anchor: Date = new Date();
  private _events: CalEvent[] = [];
  private _loading = false;
  private _theme: ThemeId = 'sea';
  private _showThemes = false;
  private _flash = 0;
  private _now = new Date();
  private _toast = '';
  private _rain: number | null = null;
  private _reminders: { summary: string }[] = [];
  private _timerEnd = 0;
  private _timerLabel = 'Timer';
  private _awakeUntil = 0;
  private _nightManual = false;
  private _page: Page = 'planner';
  private _tick?: number;
  private _poll?: number;
  private _fetchedKey = '';
  private _toastTimer?: number;

  setConfig(config: FamilyHubConfig): void {
    if (!config) throw new Error('Family Hub: missing configuration');
    this._config = config;
    let saved: string | null = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch { /* storage unavailable */ }
    this._theme = themeById(saved || config.theme || 'sea').id;
  }

  getCardSize(): number { return 12; }

  static getStubConfig(): FamilyHubConfig { return { type: 'custom:family-hub-card', family_name: 'Family', theme: 'sea' }; }

  connectedCallback(): void {
    super.connectedCallback();
    loadFonts();
    this._tick = window.setInterval(() => { this._now = new Date(); }, 15_000);
    this._poll = window.setInterval(() => { this._fetchedKey = ''; this._refresh(); }, 5 * 60_000);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this._tick);
    clearInterval(this._poll);
  }

  protected updated(changed: PropertyValues): void {
    if (changed.has('hass') || changed.has('_view') || changed.has('_anchor')) this._refresh();
  }

  // ---------- data ----------
  private _range(): [Date, Date] {
    if (this._view === 'day') { const s = startOfDay(this._anchor); return [s, addDays(s, 1)]; }
    if (this._view === 'month') { const s = startOfMonthGrid(this._anchor); return [s, addDays(s, 42)]; }
    const s = startOfWeek(this._anchor); return [s, addDays(s, 7)];
  }

  private async _refresh(): Promise<void> {
    if (!this.hass || !this._config) return;
    const [a, b] = this._range();
    const key = `${this._view}|${a.toISOString()}`;
    if (key === this._fetchedKey) return;
    this._fetchedKey = key;
    this._loadEvents(a, b);
    this._loadWeather();
    this._loadReminders();
  }

  private async _loadEvents(a: Date, b: Date): Promise<void> {
    const cals = this._config.calendars ?? [];
    if (!cals.length || !this.hass) { this._events = []; return; }
    this._loading = true;
    const out: CalEvent[] = [];
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
      } catch (e) { console.warn('Family Hub: calendar fetch failed', c.entity, e); }
    }));
    out.sort((x, y) => Number(y.allDay) - Number(x.allDay) || x.start.getTime() - y.start.getTime());
    this._events = out;
    this._loading = false;
  }

  private async _loadWeather(): Promise<void> {
    const w = this._config.weather;
    if (!w || !this.hass?.states[w]) return;
    try {
      const res = await this.hass.callWS<any>({ type: 'call_service', domain: 'weather', service: 'get_forecasts', service_data: { type: 'daily' }, target: { entity_id: w }, return_response: true });
      const f = res?.response?.[w]?.forecast?.[0];
      this._rain = typeof f?.precipitation_probability === 'number' ? f.precipitation_probability : null;
    } catch { this._rain = null; }
  }

  private async _loadReminders(): Promise<void> {
    const t = this._config.reminders;
    if (!t || !this.hass?.states[t]) { this._reminders = []; return; }
    try {
      const res = await this.hass.callWS<{ items: { summary: string; status: string }[] }>({ type: 'todo/item/list', entity_id: t });
      this._reminders = res.items.filter((i) => i.status === 'needs_action').slice(0, 5);
    } catch { this._reminders = []; }
  }

  private _eventsOn(d: Date): CalEvent[] {
    const s = startOfDay(d), e = addDays(s, 1);
    return this._events.filter((ev) => ev.start < e && ev.end > s && !(ev.allDay && ev.end.getTime() === s.getTime()));
  }

  // ---------- actions ----------
  private _say(msg: string): void {
    this._toast = msg;
    clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => { this._toast = ''; }, 2400);
  }
  private _setTheme(id: ThemeId): void {
    this._theme = id;
    this._flash = this._flash === 1 ? 2 : 1;
    try { localStorage.setItem(THEME_KEY, id); } catch { /* ignore */ }
  }
  private _shift(dir: number): void {
    const a = this._anchor;
    this._anchor = this._view === 'day' ? addDays(a, dir) : this._view === 'week' ? addDays(a, 7 * dir) : new Date(a.getFullYear(), a.getMonth() + dir, 1);
  }
  private _lights(on: boolean): void {
    this.hass?.callService('light', on ? 'turn_on' : 'turn_off', { entity_id: 'all' });
    this._say(on ? 'All lights on' : 'All lights off');
  }
  private _dinner(): void {
    const s = this._config.announce_script;
    if (s && this.hass) { this.hass.callService('script', 'turn_on', { entity_id: s }); this._say('Announcing: dinner’s ready!'); }
    else this._say('Dinner’s ready announcement is coming in the next update');
  }
  private _media(service: string): void {
    const m = this._config.music_player;
    if (m) this.hass?.callService('media_player', service, { entity_id: m });
  }
  private _addTimer(min: number): void {
    const base = this._timerEnd > Date.now() ? this._timerEnd : Date.now();
    this._timerEnd = base + min * 60_000;
    this._now = new Date();
    if (!this._timerTick) this._timerTick = window.setInterval(() => { this._now = new Date(); if (this._timerEnd && Date.now() > this._timerEnd + 60_000) { this._timerEnd = 0; clearInterval(this._timerTick); this._timerTick = undefined; } }, 1000);
  }
  private _timerTick?: number;

  // ---------- render ----------
  render(): TemplateResult | typeof nothing {
    if (!this._config) return nothing;
    const theme = themeById(this._theme);
    const night = this._isNight();
    return html`
      <div class="fh" style=${themeStyle(theme)}>
        ${this._header()}
        <div class="body">
          ${this._page === 'groceries'
            ? html`<fh-groceries .hass=${this.hass} .entity=${this._config.groceries ?? 'todo.shopping_list'} .usuals=${this._config.grocery_usuals ?? ['Milk', 'Bread', 'Eggs', 'Bananas', 'Cheese', 'Coffee']} .recipients=${this._config.grocery_recipients ?? []}></fh-groceries>`
            : html`${this._planner()}${this._aside()}`}
        </div>
        ${this._dock()}
        ${this._showThemes ? this._themeSheet() : nothing}
        ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : nothing}
        ${this._flash === 1 ? html`<div class="flash"></div>` : nothing}
        ${this._flash === 2 ? html`<div class="flash"></div>` : nothing}
        ${night ? this._night() : nothing}
      </div>`;
  }

  private _isNight(): boolean {
    if (this._nightManual) return true;
    const n = this._config.night;
    if (!n) return false;
    return inWindow(this._now, n.start, n.end) && Date.now() > this._awakeUntil;
  }

  private _header(): TemplateResult {
    const c = this._config, h = this.hass, now = this._now, clk = fmtClock(now);
    const w = c.weather ? h?.states[c.weather] : undefined;
    const temp = w?.attributes.temperature;
    const cond = (w?.state ?? '').replace(/-/g, ' ');
    return html`
      <header>
        <div class="clock">
          <span style="font-size:15px;font-weight:600" class="muted">${greeting(now)}${c.family_name ? `, ${c.family_name}` : ''}</span>
          <span style="display:flex;align-items:baseline;gap:10px"><span class="display hm">${clk.hm}</span><span class="muted" style="font-size:15px;font-weight:600">${clk.ampm} · ${fmtShortDate(now)}</span></span>
        </div>
        ${(c.kids ?? []).length ? html`
          <nav class="glass kids" aria-label="Children">
            ${c.kids!.map((k) => html`
              <button class="kid tap" type="button" @click=${() => this._say(`${k.name}’s screen is coming in the next update`)}>
                <span class="avatar" style="width:36px;height:36px;background:${slotVar(k.colour)}">${k.name[0]}</span>${k.name}
              </button>`)}
          </nav>` : nothing}
        <div class="right">
          ${w ? html`
            <div class="glass weather">
              <span style="color:var(--accent)">${icon(weatherIcon(w.state), 26)}</span>
              <span style="display:flex;flex-direction:column;line-height:1.15">
                <span style="font-weight:600;font-size:18px">${temp !== undefined ? `${Math.round(temp)}°` : '–'}</span>
                <span class="muted" style="font-size:12px;text-transform:capitalize">${cond}${this._rain !== null ? ` · ${this._rain}% rain` : ''}</span>
              </span>
            </div>` : nothing}
          ${(c.people ?? []).length ? html`
            <div class="glass presence" aria-label="Who is home">
              ${c.people!.map((p) => {
                const home = p.entity ? h?.states[p.entity]?.state === 'home' : true;
                return html`<span class="avatar" title="${p.name} – ${home ? 'home' : 'away'}" style="width:30px;height:30px;font-size:12px;background:${slotVar(p.colour)};opacity:${home ? 1 : 0.35}">${p.name[0]}</span>`;
              })}
            </div>` : nothing}
          <button class="glass tap round" style="width:48px;height:48px" aria-label="Themes" @click=${() => { this._showThemes = true; }}>${icon('palette')}</button>
          <button class="glass tap round" style="width:48px;height:48px" aria-label="Night mode" @click=${() => { this._nightManual = true; }}>${icon('moon')}</button>
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
          <div style="display:flex;flex-direction:column;line-height:1.15;min-width:200px">
            <h1 style="font-size:26px;font-weight:800">${head[0]}</h1>
            <span class="muted" style="font-size:13px">${head[1]}</span>
          </div>
          <button class="round tap" aria-label="Previous" @click=${() => this._shift(-1)}>${icon('left', 18)}</button>
          <button class="round tap" aria-label="Next" @click=${() => this._shift(1)}>${icon('right', 18)}</button>
          <button class="pill tap" @click=${() => { this._anchor = new Date(); }}>Today</button>
          <span style="flex:1"></span>
          <div class="seg" role="group" aria-label="View">
            ${(['day', 'week', 'month'] as View[]).map((x) => html`<button class="tap" aria-pressed=${String(v === x)} @click=${() => { this._view = x; }}>${x[0].toUpperCase() + x.slice(1)}</button>`)}
          </div>
        </div>
        ${cals.length ? html`<div class="legend">${cals.map((c) => html`<span style="display:flex;align-items:center;gap:6px"><span class="dot" style="background:${slotVar(c.colour)}"></span>${c.name ?? this.hass?.states[c.entity]?.attributes.friendly_name ?? c.entity}</span>`)}</div>` : nothing}
        ${!cals.length ? html`<div class="empty"><span style="color:var(--accent)">${icon('calendar', 40)}</span><h2 style="font-size:22px">Connect your calendars</h2><span>Add Google Calendar in Home Assistant, then list the calendars in this card's settings.</span></div>`
          : v === 'week' ? this._week(a) : v === 'day' ? this._day(a) : this._month()}
      </section>`;
  }

  private _evCard(e: CalEvent): TemplateResult {
    return html`<div class="ev" style="background:color-mix(in srgb, ${slotVar(e.colour)} 16%, transparent)">
      <span class="t">${e.allDay ? 'All day' : fmtTime(e.start)}</span>
      <span class="n">${e.title}</span>
      <span class="w"><span class="dot" style="width:7px;height:7px;background:${slotVar(e.colour)}"></span>${e.who}</span>
    </div>`;
  }

  private _week(a: Date): TemplateResult {
    const today = new Date();
    return html`<div class="week fade">
      ${Array.from({ length: 7 }, (_, i) => addDays(a, i)).map((d) => {
        const evs = this._eventsOn(d), isToday = sameDay(d, today);
        return html`<div class="col ${isToday ? 'today' : ''}">
          <div class="dayhead"><span class="muted" style="font-size:13px;font-weight:600">${fmtDow(d)}</span><span class="num">${d.getDate()}</span>${isToday ? html`<span class="live" aria-label="Today"></span>` : nothing}</div>
          ${evs.slice(0, 4).map((e) => this._evCard(e))}
          ${evs.length > 4 ? html`<span class="more">+${evs.length - 4} more</span>` : nothing}
        </div>`;
      })}
    </div>`;
  }

  private _day(a: Date): TemplateResult {
    const evs = this._eventsOn(a);
    return html`<div class="daylist fade">
      ${evs.length ? evs.map((e) => html`
        <div class="dayrow" style="background:color-mix(in srgb, ${slotVar(e.colour)} 16%, transparent)">
          <span style="width:84px;font-size:15px;font-weight:600" class="muted">${e.allDay ? 'All day' : fmtTime(e.start)}</span>
          <span style="flex:1;display:flex;flex-direction:column;gap:3px"><span style="font-size:18px;font-weight:600">${e.title}</span>
          <span class="muted" style="display:flex;align-items:center;gap:6px;font-size:13px"><span class="dot" style="width:8px;height:8px;background:${slotVar(e.colour)}"></span>${e.who}</span></span>
        </div>`) : html`<div class="empty"><h2 style="font-size:22px">Nothing on</h2><span>A free day!</span></div>`}
    </div>`;
  }

  private _month(): TemplateResult {
    const s = startOfMonthGrid(this._anchor), m = this._anchor.getMonth(), today = new Date();
    return html`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px" class="fade">
      <div class="mhead">${Array.from({ length: 7 }, (_, i) => html`<span>${fmtDow(addDays(s, i))}</span>`)}</div>
      <div class="month">
        ${Array.from({ length: 42 }, (_, i) => addDays(s, i)).map((d) => {
          const evs = this._eventsOn(d), isToday = sameDay(d, today);
          return html`<button class="cell tap ${d.getMonth() !== m ? 'out' : ''} ${isToday ? 'today' : ''}" style="text-align:left" @click=${() => { this._anchor = d; this._view = 'day'; }}>
            <span style="font-size:13px;font-weight:700">${d.getDate()}</span>
            ${evs.slice(0, 2).map((e) => html`<span class="mev"><span class="dot" style="width:6px;height:6px;background:${slotVar(e.colour)}"></span>${e.title}</span>`)}
            ${evs.length > 2 ? html`<span class="mev muted">+${evs.length - 2}</span>` : nothing}
          </button>`;
        })}
      </div>
    </div>`;
  }

  private _aside(): TemplateResult {
    const c = this._config, m = c.music_player ? this.hass?.states[c.music_player] : undefined;
    const playing = m?.state === 'playing';
    const pos = m?.attributes.media_position, dur = m?.attributes.media_duration;
    const left = this._timerEnd ? Math.max(0, this._timerEnd - this._now.getTime()) : 0;
    const timerDone = !!this._timerEnd && left === 0;
    const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
    return html`<aside>
      ${m ? html`<section class="glass card" aria-label="Now playing">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="label">${playing ? 'Now playing' : 'Music'}</span><span class="muted" style="font-size:12px">${m.attributes.friendly_name}</span></div>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="art" style=${m.attributes.entity_picture ? `background-image:url(${m.attributes.entity_picture})` : ''}></div>
          <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
            <span style="font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.attributes.media_title ?? (m.state === 'off' ? 'Off' : 'Nothing playing')}</span>
            <span class="muted" style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.attributes.media_artist ?? ''}</span>
          </div>
        </div>
        ${pos && dur ? html`<div class="progress"><div style="width:${Math.min(100, (pos / dur) * 100)}%"></div></div>` : nothing}
        <div style="display:flex;align-items:center;justify-content:center;gap:22px">
          <button class="tap" aria-label="Previous track" @click=${() => this._media('media_previous_track')}>${solid('prev')}</button>
          <button class="tap primary round" style="width:52px;height:52px" aria-label=${playing ? 'Pause' : 'Play'} @click=${() => this._media('media_play_pause')}>${solid(playing ? 'pause' : 'play', 20)}</button>
          <button class="tap" aria-label="Next track" @click=${() => this._media('media_next_track')}>${solid('next')}</button>
        </div>
      </section>` : nothing}

      <section class="glass card ${timerDone ? 'timer-done' : ''}" aria-label="Kitchen timer">
        <span class="label">Timer</span>
        <div style="display:flex;align-items:baseline;gap:10px"><span class="display" style="font-size:30px;font-weight:700;font-variant-numeric:tabular-nums">${this._timerEnd ? `${mm}:${String(ss).padStart(2, '0')}` : '0:00'}</span>
          <span class="muted" style="font-size:13px">${timerDone ? 'Done!' : this._timerEnd ? 'running' : 'tap to start'}</span>
          ${this._timerEnd ? html`<button class="tap muted" style="margin-left:auto;font-size:13px;font-weight:600" @click=${() => { this._timerEnd = 0; }}>Clear</button>` : nothing}</div>
        <div class="grid3">${[1, 5, 10].map((n) => html`<button class="tap" @click=${() => this._addTimer(n)}>+${n} min</button>`)}</div>
      </section>

      <section class="glass card" aria-label="Reminders" style="flex:1;min-height:0">
        <span class="label">Reminders</span>
        ${this._reminders.length ? this._reminders.map((r) => html`<div class="rem"><span class="ring"></span>${r.summary}</div>`)
          : html`<span class="muted" style="font-size:14px">${c.reminders ? 'All done!' : 'Pick a to-do list for reminders in the card settings.'}</span>`}
      </section>
    </aside>`;
  }

  private _dock(): TemplateResult {
    const soon = (n: string) => () => this._say(`${n} is coming in the next update`);
    const item = (ic: string, label: string, on?: () => void, current = false) =>
      html`<button class="item tap" aria-current=${current ? 'page' : 'false'} @click=${on ?? (() => undefined)}>${icon(ic, 24)}${label}</button>`;
    return html`<nav class="glass dock" aria-label="Main">
      ${item('calendar', 'Planner', () => { this._page = 'planner'; }, this._page === 'planner')}
      ${item('cart', 'Groceries', () => { this._page = 'groceries'; }, this._page === 'groceries')}
      ${item('pencil', 'Doodle', soon('The doodle pad'))}
      ${item('music', 'Music', soon('Music'))}
      ${item('home', 'Home', soon('The Home screen'))}
      <span class="sep" aria-hidden="true"></span>
      <button class="item tap" @click=${() => this._lights(true)}><span style="color:var(--accent)">${icon('bulb', 24)}</span>All on</button>
      <button class="item tap" @click=${() => this._lights(false)}>${icon('bulbOff', 24)}All off</button>
      <span class="sep" aria-hidden="true"></span>
      <button class="cta tap primary" @click=${() => this._dinner()}>${icon('megaphone', 24)}Dinner's ready</button>
    </nav>`;
  }

  private _themeSheet(): TemplateResult {
    return html`<div class="scrim" @click=${(e: Event) => { if (e.target === e.currentTarget) this._showThemes = false; }}>
      <section class="glass sheet" role="dialog" aria-label="Themes">
        <div style="display:flex;align-items:flex-start;gap:16px">
          <div style="flex:1"><h2 style="font-size:28px;font-weight:800">Pick a theme</h2><span class="muted">Changes the whole panel.</span></div>
          <button class="round tap" aria-label="Close" @click=${() => { this._showThemes = false; }}>${icon('close', 18)}</button>
        </div>
        <div class="themes">
          ${THEMES.map((t) => html`<button class="tcard tap" aria-pressed=${String(t.id === this._theme)} @click=${() => this._setTheme(t.id)}>
            <span class="tprev" style=${themeStyle(t)}>${[1, 2, 3, 4, 5].map((n) => html`<span style="background:var(--p-${n})"></span>`)}</span>
            <span style="font-size:16px;font-weight:700">${t.name}</span><span class="muted" style="font-size:13px">${t.tagline}</span>
          </button>`)}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" @click=${() => { const o = THEMES.filter((t) => t.id !== this._theme); this._setTheme(o[Math.floor(Math.random() * o.length)].id); }}>${icon('shuffle', 20)}Surprise me</button>
          <span class="muted" style="font-size:12px">Family Hub v${VERSION}</span>
        </div>
      </section>
    </div>`;
  }

  private _night(): TemplateResult {
    const clk = fmtClock(this._now), tomorrow = addDays(new Date(), 1);
    const evs = this._eventsOn(tomorrow).slice(0, 3);
    return html`<button class="night" aria-label="Wake the panel" @click=${() => { this._nightManual = false; this._awakeUntil = Date.now() + 10 * 60_000; }}>
      <div><span class="display big">${clk.hm}</span><div style="font-size:26px;font-weight:500;color:#d1d1d6;margin-top:10px">${fmtLongDate(this._now)}</div></div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:24px">
        ${evs.length ? html`<div class="dglass" style="width:460px;border-radius:28px;padding:22px 24px;display:flex;flex-direction:column;gap:12px">
          <span style="font-size:13px;font-weight:600;color:#d1d1d6;text-transform:uppercase;letter-spacing:.06em">Tomorrow</span>
          ${evs.map((e) => html`<div style="display:flex;align-items:center;gap:12px;font-size:17px"><span style="width:76px;color:#d1d1d6">${e.allDay ? 'All day' : fmtTime(e.start)}</span>${e.title}</div>`)}
        </div>` : html`<span></span>`}
        <span class="breathe" style="font-size:16px;color:#d1d1d6">Tap anywhere to wake</span>
      </div>
    </button>`;
  }
}

if (!customElements.get('family-hub-card')) customElements.define('family-hub-card', FamilyHubCard);
const w = window as unknown as { customCards?: unknown[] };
w.customCards = w.customCards || [];
w.customCards.push({ type: 'family-hub-card', name: 'Family Hub', description: 'Glassy, themeable family planner for wall panels.', preview: false });
console.info(`%c FAMILY-HUB %c v${VERSION} `, 'background:#0b5fa5;color:#fff;border-radius:3px 0 0 3px;padding:2px 6px', 'background:#ffd166;color:#0b2236;border-radius:0 3px 3px 0;padding:2px 6px');
