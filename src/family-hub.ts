import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
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
import { art, moonAge, type ArtData } from './art';
import './addevent';
import { setPinShuffle } from './pin';
import './chat';
import { AI_NOTE } from './chat';
import './settings';
import { configError } from './validate';
import { setMediaHass } from './media';
import { ArtMode, artCss, artNight, artView, brightTarget } from './artmode';
import { artListOf } from './artlib';
import { syncNightly } from './nightly';
import { pinFresh, resumeNow } from './settings-store';
import { setWeekendExtra } from './util';
import { forgetLines, houseVoice, lineReady, setVoice, voiceSync } from './voice';
import { loadFonts } from './fonts';
import { keyboard, keysCss, typeKey } from './keys';
import { findRoom, kidSpeaker, play, rooms, sleepIn } from './ma';
import { avatarCss, decodeLook, renderAvatar } from './avatar';
import { icon, solid, weatherIcon } from './icons';
import { BEAT_MS, USE_FLUSH_MS, UseLog, agoWords, calHealth, calWarning, haTrust, isWall, restoreCalls, snapParse, snapText, snapshotOf, useTotals, type HaTrust } from './trust';
import { BINS, isBin, askByChild, askFor, calShows, kidEntities, num, slotVar, type CalEvent, type ColourSlot, type FamilyHubConfig, type Hass, type KidConfig, type PersonConfig } from './types';
import {
  addDays, fmtClock, fmtDow, fmtLongDate, fmtRange, fmtShortDate, fmtTime, greeting, inWindow,
  sameDay, startOfDay, startOfMonthGrid, startOfWeek, fmtSpan, whenOn } from './dates';
import { afterBedtime, bedtimeFor, changed, FitController, hm, isQuiet, isSchoolDay, kidPrefs, minsNow, panelMsg, saveKidPrefs, scrollCue, getNarrow, getShape, linger, watched, wasSlow, inTime, SlowError, SLOW_SAY, setMuted, setNarrow, setShape, setSounds, setSoundTheme, setVolume, sfx, sfxAsked, shortNames, ymd, type KidPrefs, type Shape } from './util';

/** The picture for a day with nothing on: a kite in the sun. */
const FREE_DAY = html`<svg viewBox="0 0 160 110" width="160" height="110" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="120" cy="32" r="14"></circle><path d="M120 6v6M120 52v6M94 32h6M140 32h6M102 14l4 4M134 46l4 4M102 50l4-4M134 18l4-4"></path>
  <path d="M28 60l24-30 16 24-28 14zM52 30l-12 38M28 60l40-6"></path><path d="M40 68c3 9-9 11-5 20s14 5 19 12"></path>
  <path d="M6 102c16-8 30-8 46 0s30 8 46 0 30-8 56 0" stroke-width="2.5"></path></svg>`;

type View = 'day' | 'week' | 'month';
type Page = 'planner' | 'groceries' | 'kid' | 'doodle' | 'music' | 'home' | 'morning' | 'weather';
type Sheet = '' | 'more' | 'themes' | 'kidprefs' | 'meds' | 'add' | 'sitter' | 'timer' | 'chat' | 'event' | 'settings';
const VERSION = '0.34.1';
const THEME_KEY = 'family-hub-theme';
const SOUNDS_KEY = 'family-hub-sounds';
const COND: Record<string, string> = {
  'clear-night': 'Clear', cloudy: 'Cloudy', exceptional: 'Wild weather', fog: 'Foggy', hail: 'Hail', lightning: 'Storms', 'lightning-rainy': 'Storms',
  partlycloudy: 'Partly cloudy', pouring: 'Pouring', rainy: 'Rain', snowy: 'Snow', 'snowy-rainy': 'Sleet', sunny: 'Sunny', windy: 'Windy', 'windy-variant': 'Windy'
};
const CHILD_TAGS = 'fh-kid,fh-home,fh-music,fh-groceries,fh-doodle,fh-morning,fh-weather,fh-add-event,fh-chat';


export class FamilyHubCard extends LitElement {
  readonly fitCtl = new FitController(this as never);
  readonly lookCtl = new LookController(this);
  static styles = [styles, keysCss, css`${unsafeCSS(avatarCss)}`, css`${unsafeCSS(artCss)}`];
  static properties = {
    hass: { attribute: false },
    _config: { state: true }, _view: { state: true }, _anchor: { state: true }, _events: { state: true }, _soon: { state: true },
    _medLog: { state: true }, _mx: { state: true }, _theme: { state: true }, _look: { state: true }, _opts: { state: true }, _snd: { state: true }, _prefTick: { state: true }, _sheet: { state: true }, _evOpen: { state: true }, _evAsk: { state: true }, _evBusy: { state: true }, _editEv: { state: true }, _editScope: { state: true }, _now: { state: true }, _toast: { state: true }, _wx: { state: true },
    _reminders: { state: true }, _remTk: { state: true }, _bump: { state: true }, _wantsChat: { state: true }, _remJust: { state: true }, _nightManual: { state: true }, _page: { state: true }, _kid: { state: true },
    _photo: { state: true }, _calError: { state: true }, _idle: { state: true }, _toastAct: { state: true }, _dinner: { state: true }, _off: { state: true }, _alarm: { state: true }, _pinAsk: { state: true }, _asker: { state: true }, _wifiUntil: { state: true }, _calTick: { state: true },
    _remState: { state: true }, _remShow: { state: true }, _mLines: { state: true }, _evKey: { state: true }, _compact: { state: true }, _top: { state: true }, _bot: { state: true }
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
  /** touch sounds on this screen: on, quiet (soft) or off; starts from the card's `sounds` setting */
  private _snd: 'on' | 'quiet' | 'off' = 'on';
  private _sfxOn = false;
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
  protected willUpdate(ch: PropertyValues): void {
    // Music opened straight from a child's page is still that child's: his calm setting goes with him. Any other page ends it.
    if (ch.has('_page')) { if (this._page !== 'music') this._musicKid = ''; else if (ch.get('_page') === 'kid') this._musicKid = this._config?.kids?.[this._kid]?.name ?? ''; }
    // a child who cannot read yet gets Doodle's tools along the bottom. Since his page's dock is only his face and Home, "from his page" means Doodle is the first place he goes after Home, within two minutes of leaving it
    if (ch.has('_page')) { if (ch.get('_page') === 'kid' && this._config?.kids?.[this._kid]?.mode === 'picture') { this._leftPicKid = Date.now(); this._picHops = 0; } else this._picHops++; }
    if (ch.has('_page') && this._page === 'doodle') this._doodleLow = this._picHops <= 1 && Date.now() - this._leftPicKid < 120_000;
    // remember what opened a sheet, so focus can go back to it when the sheet closes
    // (a sheet that opens after the PIN pad goes back to whatever opened the pad)
    // the PIN pad never opens over a sheet that did not ask for it
    if (ch.has('_pinAsk') && this._pinAsk && this._sheet && this._pinAsk.sheet !== this._sheet) { this._pinAsk = null; this._say('Close this first, then try again.'); }
    if (ch.has('_pinAsk') && this._pinAsk && !ch.get('_pinAsk')) this._pinFrom = this._focused();
    if (ch.has('_sheet') && this._sheet && !ch.get('_sheet')) { const f = this._focused(), inPad = !!f && ((f.getRootNode() as ShadowRoot).host?.localName === 'fh-pin'); this._opener = f && !inPad ? f : this._pinFrom; }
    if (this._sheet !== 'meds') this._medOpen = false;
    if (!this._config) return;
    if (this._lk !== getLook()) setLook(this._lk);
    setVolume(this._kp ? { full: 1, soft: 0.35, off: 0 }[this._kp.sound] : 1);
    setSoundTheme(this._kidOn?.theme ?? this._theme);
    // a sheet says that it opened or closed (not the one the page loads with)
    if (this._sfxOn && ch.has('_sheet') && !ch.get('_sheet') !== !this._sheet) sfx(this._sheet ? 'open' : 'close');
    this._sfxOn = true;
  }
  private _sheet: Sheet = '';
  private _now = new Date();
  private _toast = '';
  /** a toast may carry one action (Undo, Try again) */
  private _toastAct: { label: string; run: () => void } | null = null;
  private _opener: HTMLElement | null = null;
  private _pinFrom: HTMLElement | null = null;
  /** reminders: loaded, could not be loaded, or the list is not in Home Assistant */
  private _remState: 'ok' | 'failed' | 'missing' = 'ok';
  /** how many reminders fit the card (the rest are counted in "+N more") */
  private _remShow = 99;
  /** how many event lines fit a month cell */
  private _mLines = 1;
  /** which range the events on screen belong to: an empty state is only shown once that range has loaded */
  private _evKey = '';
  /** the screen is smaller than the design canvas: the frame tightens (it is never scaled down) */
  private _compact = false;
  /** where sheets may sit: below the header, above the dock */
  private _top = 110;
  private _bot = 122;
  private _wx: { max?: number; min?: number; uv?: number; rain?: number } = {};
  private _reminders: { uid: string; summary: string }[] = [];
  /** reminders ticked a moment ago: they stay a few seconds so a slip can be tapped back */
  private _remTk: Record<string, number> = {};
  /** reminders whose call to Home Assistant is still out, those waiting on it to leave, and a count per row so the latest touch wins */
  private _remOut = new Set<string>(); private _remDue = new Set<string>(); private _remSeq: Record<string, number> = {};
  /** the control last pressed, so a slow answer from Home Assistant can be shown on it */
  private _pressEl: Element | null = null; private _pressAt = 0;
  /** set for a moment when time is added to the kitchen timer: the digits roll and the ring sweeps */
  private _bump = 0;
  private _remJust = '';
  private _nightManual = false;
  private _page: Page = 'planner';
  private _kid = 0;
  private _photo = '';
  private _musicFocus = '';
  /** the child whose page Music was opened from (his calm setting applies there), or '' */
  private _musicKid = '';
  private _photos: string[] = [];
  private _photoIdx = 0;
  private _photoTimer?: number;
  private _lastTouch = Date.now();
  private _idle = false;
  private _calError = false;
  /** trust guards (trust.ts): when each calendar last answered, when this screen last stamped the heartbeat, and today's opens and taps */
  private _calSeen: Record<string, number> = {}; private _calSince = Date.now(); private _calTick = 0;
  private _beatAt = 0; private _use = new UseLog(); private _useAt = Date.now() - USE_FLUSH_MS + 60_000;
  private _wifiUntil = 0;
  private _vis = (): void => { if (document.visibilityState === 'hidden') void this._use.flush(this.hass, this._config?.health?.use_log); };
  /** What Home Assistant needs for the trust guards (the snapshot automation, the restore script, the panel watch), built from this configuration. Used when the card is set up; nothing on screen calls it. */
  trustSetup(): HaTrust { return haTrust(this._config); }
  /** The snapshot record and the use counts in TypeScript, for the tests and the restore drill: `customElements.get('family-hub-card').trust`. */
  /** the brightness the screen should have for a given sun and room light (artmode.ts), for the tests and for calibrating at the wall */
  static bright = brightTarget;
  static trust = { snapshotOf, snapText, snapParse, restoreCalls, useTotals, haTrust };
  private _dinner: { at: number; timer?: number } | null = null;
  private _dinnerCooldown = 0;
  private _alarm = 0;
  private _alarmSeen = 0;
  private _pinAsk: { reason: string; run: () => void; sheet?: string } | null = null;
  /** who the open Ask sheet is for: a child's name; '' for a grown-up (or anyone, when Ask is not set by child); null while it is still asking who */
  private _asker: string | null = '';
  private _tick?: number;
  private _poll?: number;
  private _fetchedKey = '';
  private _fetchGen = 0;
  private _dayKey = '';
  private _toastTimer?: number;

  setConfig(config: FamilyHubConfig): void {
    // the rules live in validate.ts, where Settings applies the same ones before it saves
    const bad = configError(config); if (bad) throw new Error(bad);
    if (this._page === 'kid' && !(config.kids ?? [])[this._kid]) this._page = 'planner';
    setWeekendExtra(config.bedtime_weekend_extra);
    setVoice(config.voice, () => this.hass); forgetLines(); this._voiceSynced = false;
    setPinShuffle(config.pin_shuffle !== false);
    this._config = config;
    let snd: string | null = null;
    try { snd = localStorage.getItem(SOUNDS_KEY); } catch { /* storage unavailable */ }
    this._snd = snd === 'on' || snd === 'quiet' || snd === 'off' ? snd : config.sounds === false ? 'off' : config.sounds === 'quiet' ? 'quiet' : 'on';
    setSounds(this._snd === 'off' ? false : this._snd === 'quiet' ? 'quiet' : true);
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
    this.addEventListener('click', this._swallow, true); window.addEventListener('pointerup', this._wakeUp, true); window.addEventListener('pointercancel', this._wakeUp, true);
    this.addEventListener('click', this._tapMark, true); this.addEventListener('click', this._tapSfx);
    loadFonts('Inter', 'Bricolage Grotesque');
    this._tick = window.setInterval(() => this._onTick(), 1000);
    // Settings was open when the dashboard drew the card again (it does after a save): it comes back open, on the same pane
    if (resumeNow()) this._sheet = 'settings';
    this._poll = window.setInterval(() => { this._fetchedKey = ''; this._refresh(); this._loadSoon(); }, 5 * 60_000);
    this.addEventListener('pointerdown', this._touched, { capture: true });
    document.addEventListener('visibilitychange', this._vis);
    window.addEventListener('keydown', this._keys);
    (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(() => { if (this.isConnected) this._fitFrame(); });
    window.addEventListener('resize', this._onResize); this._onResize();
    this._ro = new ResizeObserver(() => this._onResize()); this._ro.observe(this);
  }
  /**
   * Fit the screen. The panel is designed on a fixed canvas (1280×800 wide, 900×1280 tall). A bigger screen scales it up.
   * A screen as wide as the canvas but shorter (a laptop inside Home Assistant) is never scaled down (controls would fall
   * under 44 px and words under their size): the frame goes compact instead: a 56 px header without the greeting,
   * 12 px gutters and a narrower right rail. Phones are never scaled down either.
   */
  private _onResize = (): void => {
    const fixed = Number(this._config?.scale);
    const head = parseFloat(getComputedStyle(this).getPropertyValue('--header-height')) || 0;
    const w = this.getBoundingClientRect().width || window.innerWidth;
    const hgt = window.innerHeight - head;
    // a phone is narrower than any tablet: it gets its own arrangement and scrolls like a normal phone page
    // (a phone on its side is short rather than narrow: it must not get the wall layout shrunk to fit)
    const shape: Shape = w < 600 || (window.innerHeight < 500 && w < 1000) ? 'phone' : hgt > w * 1.15 ? 'tall' : 'wide';
    if (shape === 'phone' && getShape() !== 'phone' && this._view === 'week') { this._view = 'day'; this._viewWas = 'week'; }
    else if (shape !== 'phone' && getShape() === 'phone' && this._viewWas) { if (this._view === 'day') this._view = this._viewWas; this._viewWas = ''; }
    setShape(shape);
    const [dw, dh] = shape === 'tall' ? [900, 1280] : [1280, 800];
    // wide enough for the canvas (a laptop, the wall): never below 1, a short screen goes compact. Narrower than the canvas (a tablet):
    // the pages do not yet reflow to a narrower canvas, so the width alone sets the scale, and a short screen still goes compact.
    // never below 1 at any size: a screen smaller than the canvas (a tablet, a laptop inside Home Assistant) keeps every control and word at its
    // size; the frame goes compact and the pages reflow by width (data-n1 under 1240 px, data-n2 under 1100 px, data-n3 under 900 px).
    const wz = w / dw, hz = hgt / dh;
    const z = fixed > 0 ? Math.max(1, fixed) : shape === 'phone' ? Math.min(1.25, Math.max(1, w / 430)) : Math.min(1.6, Math.max(1, Math.min(wz, hz)));
    const compact = shape !== 'phone' && (w / z < dw - 4 || hgt / z < dh - 4);
    setNarrow(shape === 'phone' ? 0 : w / z < 900 ? 3 : w / z < 1100 ? 2 : w / z < 1240 ? 1 : 0);
    if (Math.abs(z - this._z) > 0.01 || compact !== this._compact) { this._z = Math.round(z * 100) / 100; this._compact = compact; this.requestUpdate(); }
    else if (this.hasUpdated) this._fitFrame();
  };
  private _z = 1;
  private _viewWas: '' | 'week' = '';
  private _ro?: ResizeObserver;
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this._swallow, true); window.removeEventListener('pointerup', this._wakeUp, true); window.removeEventListener('pointercancel', this._wakeUp, true); this._art.dispose();
    this.removeEventListener('click', this._tapMark, true); this.removeEventListener('click', this._tapSfx);
    window.removeEventListener('resize', this._onResize); this._ro?.disconnect(); window.removeEventListener('keydown', this._keys);
    clearInterval(this._tick); clearInterval(this._poll); clearInterval(this._photoTimer);
    clearTimeout(this._toastTimer); clearTimeout(this._dinner?.timer); clearTimeout(this._off?.timer);
    this._photoTimer = undefined; this._photos = [];
    this.removeEventListener('pointerdown', this._touched, { capture: true });
    document.removeEventListener('visibilitychange', this._vis);
  }
  private _touched = (): void => {
    this._lastTouch = Date.now(); if (this._idle) this._idle = false;
    this._use.tap(this._sheet ? `s-${this._sheet}` : this._page);
    if (this._page === 'music') this._musicAt = Date.now();
    // the touch that wakes the panel from its artwork does only that: whatever lies under the finger is not pressed
    if (this._art.on) { this._wakeDown = true; this._art.wake(); }
  };
  /** The screensaver (artmode.ts). Presence counts as a touch. */
  private _art = new ArtMode(this, () => this._config, () => { this._lastTouch = Date.now(); if (this._idle) this._idle = false; });
  private _nightKey = '';
  private _musicAt = 0; private _wakeDown = false; private _swallowUntil = 0;
  private _wakeUp = (): void => { if (this._wakeDown) { this._wakeDown = false; this._swallowUntil = Date.now() + 120; } };
  private _swallow = (e: Event): void => { if (this._wakeDown || Date.now() < this._swallowUntil) { e.stopImmediatePropagation(); e.preventDefault(); } };
  /** True while the artwork must not come up (or must give way): something is counting, sounding, being asked or being typed. */
  private _artBlocked(): boolean {
    if (this._timerLeft() !== null || this._dinner || this._off || this._alarm || this._sheet || this._pinAsk) return true;
    // someone choosing music is given longer, but only while something is actually playing
    if (this._page === 'music' && Date.now() - this._musicAt < 10 * 60_000 && Object.values(this.hass?.states ?? {}).some((x) => x.entity_id.startsWith('media_player.') && x.state === 'playing')) return true;
    const f = this._focused();
    if (f && (f.matches('input, textarea, select') || f.isContentEditable)) return true;
    const page = this.renderRoot.querySelector('fh-music, fh-kid, fh-doodle') as (HTMLElement & { _calling?: boolean; _practice?: unknown; _studio?: boolean }) | null;
    return !!(page?._calling || page?._practice || page?.shadowRoot?.querySelector('fh-studio [aria-busy="true"], fh-pin'));
  }
  /** A line or two for the artwork's clock: when to leave, what is next, the bins, the weather. Never the whole planner. */
  private _artLines(): string[] {
    const c = this._config, now = this._now, t = now.getTime(), out: string[] = [];
    if (this._morningWindow(now)) {
      const mins = minsNow(now), leave = [...new Set((c.kids ?? []).map((k) => hm(k.leave_by ?? c.morning?.leave_by ?? '08:15')))].filter((m) => m > mins && m - mins <= 90).sort((a, b) => a - b)[0];
      if (leave !== undefined) out.push(leave - mins === 1 ? 'Leave in 1 minute' : `Leave in ${leave - mins} minutes`);
    }
    const next = this._soon.find((e) => !e.allDay && e.start.getTime() > t && e.start.getTime() - t < 18 * 3_600_000 && !this._private(e.title));
    if (next) { const mins = Math.round((next.start.getTime() - t) / 60000); out.push(mins <= 45 ? `${next.title} in ${mins} min` : `${sameDay(next.start, now) ? '' : 'Tomorrow: '}${next.title} at ${fmtTime(next.start)}`); }
    const bn = this._bins(now);
    if (bn && bn.bins.length && (sameDay(bn.night, now) || sameDay(bn.night, addDays(now, 1)))) out.push(`${sameDay(bn.night, now) ? 'Bins out tonight' : 'Bins out tomorrow night'}: ${bn.bins.join(' and ')}`);
    const w = this.hass?.states[c.weather ?? ''];
    if (w) { const temp = Number(w.attributes.temperature), max = this._wx.max; out.push([COND[w.state] ?? '', Number.isFinite(temp) ? `${Math.round(temp)}°` : '', max !== undefined && now.getHours() < 15 ? `top of ${Math.round(max)}°` : ''].filter(Boolean).join(' · ')); }
    return out.filter(Boolean).slice(0, 2);
  }

  private _onTick(): void {
    const now = new Date(), timerOn = this._timerLeft() !== null;
    if (this._config) {
      const was = this._art.on;
      const night = this._isNight();
      this._art.tick(Date.now() - this._lastTouch, this._artBlocked(), this._eventsOn(now, this._soon).map((e) => e.title), night);
      if (this._art.on !== was) this._now = now;
      // "Night" lasts until the panel is next woken
      if (!this._art.on && this._nightManual) this._nightManual = false;
      this._art.backlight(this._art.on ? (night ? 'night' : 'art') : 'hub', now.getTime());
    }
    // second-by-second only while something is counting down; otherwise every 15 s
    if (timerOn || this._dinner || this._off || now.getSeconds() % 15 === 0) this._now = now;
    if (now.getSeconds() % 15) return;
    { const hc = this._config?.health, t = Date.now();
      // the wall panel tells Home Assistant it is alive; other screens stay quiet, so a phone can't make a dead panel look well
      if (hc?.heartbeat && this.hass?.states[hc.heartbeat] && isWall() && t - this._beatAt >= BEAT_MS) { this._beatAt = t; Promise.resolve(this.hass.callService('input_datetime', 'set_datetime', { timestamp: Math.floor(t / 1000) }, { entity_id: hc.heartbeat })).catch(() => { this._beatAt = t - BEAT_MS + 60_000; }); }
      if (hc?.use_log && t - this._useAt >= USE_FLUSH_MS) { this._useAt = t; void this._use.flush(this.hass, hc.use_log); }
      if (now.getSeconds() === 0) this._calTick++; }
    setMuted(this._config?.quiet?.mute === true && isQuiet(now, this._config?.quiet?.start ?? '20:00', this._config?.quiet?.end ?? '06:30'));
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
    if (ch.has('hass')) setMediaHass(this.hass);
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

  /** A pressed header or dock button plays its drawing's little movement once (data-just). A dock place that is about to open plays its arrival instead (see updated). Only one button moves at a time. */
  private _moveT = 0;
  private _move(el: Element | null, attr: 'data-just' | 'data-arrive', ms: number): void {
    if (!el) return;
    this.renderRoot.querySelectorAll('[data-just], [data-arrive]').forEach((x) => { if (x.matches('.dock .item, .right > .hb')) { x.removeAttribute('data-just'); x.removeAttribute('data-arrive'); } });
    void (el as HTMLElement).offsetWidth; el.setAttribute(attr, ''); clearTimeout(this._moveT); this._moveT = window.setTimeout(() => el.removeAttribute(attr), ms);
  }
  private _btnJust = (e: Event): void => {
    const b = (e.target as Element | null)?.closest?.('.dock .item, .right > .hb'); if (!b || b.matches('.kidbtn')) return;
    if (b.hasAttribute('data-arrive') || (b.matches('.dock .item[aria-current]') && b.getAttribute('aria-current') !== 'page')) return; // it has just become the page (the page is drawn before this runs), or is about to: its arrival plays
    this._move(b, 'data-just', 700);
  };
  /** the voice in use has been copied to Home Assistant's side since the settings last changed (voice.ts, voiceSync) */
  private _voiceSynced = false;
  protected updated(ch: PropertyValues): void {
    if (!this._voiceSynced && this.hass?.states && this._config?.voice?.sync) { this._voiceSynced = true; void voiceSync(this.hass, this._config.chat?.pipeline); }
    if (ch.has('_page') && ch.get('_page') !== undefined && this._page !== 'kid') this._move(this.renderRoot.querySelector('.dock .item[aria-current="page"]:not(.kidbtn)'), 'data-arrive', 900);
    if (ch.has('hass')) this._watchJar();
    if (ch.has('_page')) this._use.open(this._page);
    if (ch.has('_sheet')) { if (this._sheet) this._use.open(`s-${this._sheet}`); if (this._sheet !== 'sitter' && this._wifiUntil) this._wifiUntil = 0; }
    // the nightly artwork reads its limit and its style from the record: keep that line in step with this screen
    if (this.hass && this._config) { const key = `${JSON.stringify(this._config.art ?? {})}|${this._lk}|${!!this.hass.states[artListOf(this._config)]}`; if (key !== this._nightKey) { this._nightKey = key; void syncNightly(this.hass, this._config, this._lk); } }
    if (ch.has('hass') || ch.has('_view') || ch.has('_anchor') || this._span !== this._spanWas) { this._spanWas = this._span; this._refresh(); }
    if (ch.has('hass')) this._checkAlarm();
    const root = this.renderRoot.querySelector('.fh');
    if (root) for (const o of lookById(this._lk).options ?? []) root.toggleAttribute(`data-opt-${o.id}`, this._optOn(o));
    if (this._page === 'planner' && this._view === 'week') this._measureWeek();
    this._fitFrame();
    this.renderRoot.querySelectorAll('.scrolly').forEach(scrollCue);
    { const d = this.renderRoot.querySelector<HTMLElement>('nav.dock'); d?.toggleAttribute('data-more', d.scrollWidth - d.scrollLeft - d.clientWidth > 6); }
    // one entrance for a change of page or planner view (waking from the night screen is not a change of page)
    if (ch.has('_page') || ch.has('_kid') || ch.has('_view')) { const b = this.renderRoot.querySelector<HTMLElement>('.fh > .body'); if (b) { b.removeAttribute('data-in'); void b.offsetWidth; b.setAttribute('data-in', ''); } }
    // what lies behind an open sheet or the PIN pad is out of reach of the keyboard and of a screen reader
    { const behind = !!this._sheet || !!this._pinAsk || this._art.on; this.renderRoot.querySelectorAll<HTMLElement>('.fh > header, .fh > .body, .fh > nav.dock').forEach((x) => { x.inert = behind; }); }
    // the PIN pad has gone and a sheet is open: focus goes into the sheet, not back to the header behind it
    if (ch.has('_pinAsk') && !this._pinAsk && this._sheet && !ch.has('_sheet') && this._sheet !== 'add') this._focusSheet();
    if (ch.has('_sheet')) {
      if (this._sheet) { if (this._sheet !== 'add') this._focusSheet(); }
      else if (ch.get('_sheet')) { const o = this._opener; this._opener = null; if (o?.isConnected) o.focus({ preventScroll: true }); }
    }
  }

  /** Focus goes into the sheet that has just opened. The Ask sheet puts it in the question field, except on a touch screen, where a focused field could raise the system keyboard. */
  private _focusSheet(): void {
    const sheet = this.renderRoot.querySelector<HTMLElement>('.scrim > .sheet'); if (!sheet) return;
    const chat = sheet.querySelector('fh-chat') as (HTMLElement & { focusField?: () => void; updateComplete?: Promise<unknown> }) | null;
    sheet.focus({ preventScroll: true });
    if (chat?.focusField && !window.matchMedia('(pointer: coarse)').matches) void chat.updateComplete?.then(() => { if (this._sheet === 'chat' && !this._pinAsk) chat.focusField!(); });
  }
  /** The element that has focus, looking through shadow roots. */
  private _focused(): HTMLElement | null {
    let a: Element | null = document.activeElement; while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
    return a instanceof HTMLElement && a !== document.body ? a : null;
  }
  /** Escape closes whatever is on top (the PIN pad, then the dinner countdown, then a sheet); Tab stays inside an open sheet. */
  private _keys = (e: KeyboardEvent): void => {
    // a key is a touch: it keeps the screensaver away, and brings the panel back from it
    this._lastTouch = Date.now(); if (this._idle) this._idle = false; if (this._art.on) this._art.wake();
    if (e.key === 'Escape' && !e.defaultPrevented) {
      if (this._pinAsk) { const pad = this.renderRoot.querySelector('fh-pin') as (HTMLElement & { cancel?: () => void }) | null; if (pad?.cancel) pad.cancel(); else this._pinAsk = null; } else if (this._dinner) this._dinnerCancel(); else if (this._off) this._offCancel(); else if (this._sheet) this._sheet = ''; else return;
      e.preventDefault();
    } else if (e.key === 'Tab' && this._sheet && this._sheet !== 'add' && !this._pinAsk) {
      const sheet = this.renderRoot.querySelector<HTMLElement>('.scrim > .sheet'); if (!sheet) return;
      // the stops are gathered through nested shadow roots (the Ask sheet's controls live inside fh-chat), in the order they are drawn
      const all: HTMLElement[] = [], walk = (root: ParentNode): void => { root.querySelectorAll<HTMLElement>('*').forEach((x) => { if (x.matches('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]') && x.offsetParent !== null) all.push(x); if (x.shadowRoot) walk(x.shadowRoot); }); };
      walk(sheet);
      const now = this._focused(), at = now ? all.indexOf(now) : -1;
      if (!all.length) return;
      const lost = at < 0 && now !== sheet;
      if (lost || (e.shiftKey ? at <= 0 : at === all.length - 1)) { e.preventDefault(); all[e.shiftKey ? all.length - 1 : 0].focus(); }
    }
  };

  /**
   * After each render and resize, measure what cannot be known from CSS alone:
   * the header row (which chips fit), where sheets may sit, how many reminders and month lines fit.
   */
  private _fitFrame(): void {
    const root = this.renderRoot, fh = root.querySelector<HTMLElement>('.fh'), hd = root.querySelector<HTMLElement>('header');
    if (!fh || !hd) return;
    this._fitHeader(hd);
    if (getShape() !== 'phone') {
      const dock = root.querySelector<HTMLElement>('nav.dock'), body = root.querySelector<HTMLElement>('.fh > .body'), row = parseFloat(getComputedStyle(fh).rowGap) || 16;
      // where the bars are joined to the page (the Glass frame) a sheet needs only a small step in from them, not a whole row gap
      const gap = body && body.offsetTop - (hd.offsetTop + hd.offsetHeight) < 2 ? 8 : row;
      const top = Math.round(hd.offsetTop + hd.offsetHeight + gap), bot = dock ? Math.round(fh.clientHeight - dock.offsetTop + gap) : this._bot;
      if (Math.abs(top - this._top) > 1) this._top = top;
      if (Math.abs(bot - this._bot) > 1) this._bot = bot;
    }
    const list = root.querySelector<HTMLElement>('.remlist');
    if (list) {
      const total = this._reminders.length; let show = total;
      if (getShape() !== 'phone' && total * 44 > list.clientHeight + 1) show = Math.max(1, Math.floor((list.clientHeight - 16) / 44));
      if (show !== this._remShow) this._remShow = show;
    }
    const cell = root.querySelector<HTMLElement>('.month .cell');
    if (cell) {
      // counted from the cell's outer height, so every look shows the same number of lines in the same cell
      const n = Math.max(0, Math.floor((cell.offsetHeight - 12 - 20) / 21));
      if (n !== this._mLines) this._mLines = n;
    }
  }
  /**
   * One header row. Chips are whole or absent, never cut: when the row is too full the weather chip loses its badge, then its
   * second line; then lesser chips (the next event, bins, a message) go; then who-is-home; then the weather chip.
   * A medication or timer chip is the last thing to go. The round pill button hides while a medication chip is showing.
   */
  private _fitHeader(hd: HTMLElement): void {
    const cap = hd.querySelector<HTMLElement>('.capsule'); if (!cap) return;
    const chips = [...cap.querySelectorAll<HTMLElement>('.cap')], med = chips.find((c) => c.dataset.kind === 'med');
    const wide = getShape() === 'wide', phone = getShape() === 'phone';
    const over = (): boolean => cap.scrollWidth > cap.clientWidth + 1 || hd.scrollWidth > hd.clientWidth + 1;
    const run = (medChip: boolean): void => {
      for (const c of chips) c.hidden = false;
      cap.removeAttribute('data-one'); hd.removeAttribute('data-fit'); hd.toggleAttribute('data-medchip', medChip);
      if (phone) return;
      const steps: string[] = [], step = (s: string): void => { if (over()) { steps.push(s); hd.setAttribute('data-fit', steps.join(' ')); } };
      const drop = (min: number, keep: number): void => { for (let i = chips.length - 1; i >= 0 && over(); i--) if (Number(chips[i].dataset.p) >= min && chips.filter((c) => !c.hidden).length > keep) chips[i].hidden = true; };
      if (wide) { step('nobadge'); step('slim'); }
      drop(3, 0);
      if (wide) { step('nowho'); step('nowx'); }
      drop(0, 1);
      if (over()) cap.setAttribute('data-one', '');
      // a chip that went may have left room: give the weather chip back what still fits
      while (steps.length) { const s = steps.pop()!; hd.setAttribute('data-fit', steps.join(' ')); if (over()) { steps.push(s); break; } }
      if (steps.length) hd.setAttribute('data-fit', steps.join(' ')); else hd.removeAttribute('data-fit');
    };
    run(!!med);
    if (med?.hidden) run(false);
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
  private static _pen: CanvasRenderingContext2D | null | undefined;
  private _measureWeek(): void {
    const next: Record<string, number> = {};
    this.renderRoot.querySelectorAll<HTMLElement>('.week > .col').forEach((col) => {
      const box = col.querySelector<HTMLElement>('.evs'); if (!box) return;
      const evs = [...box.querySelectorAll<HTMLElement>(':scope > .ev')];
      for (const ev of evs) ev.style.display = '';
      col.removeAttribute('data-tight'); col.removeAttribute('data-wrap');
      // only a word that is longer than its column may be hyphenated; everything else wraps between words
      const pen = (FamilyHubCard._pen ??= document.createElement('canvas').getContext('2d'));
      if (pen) for (const n of box.querySelectorAll<HTMLElement>('.ev .n')) { n.removeAttribute('data-hy'); /* measured at its full size: a marked title is set smaller */ const f = getComputedStyle(n); pen.font = `${f.fontWeight} ${f.fontSize} ${f.fontFamily}`; n.toggleAttribute('data-hy', Math.max(0, ...(n.textContent ?? '').split(/[\s\u2011-]+/).map((w) => pen.measureText(w).width)) > n.clientWidth); }
      // the room for events is measured, not guessed: the column, less its padding and its heading
      const cs = getComputedStyle(col), gap = parseFloat(cs.rowGap) || 0, eg = parseFloat(getComputedStyle(box).rowGap) || 0, head = col.querySelector<HTMLElement>('.dayhead');
      const avail = col.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - (head ? head.offsetHeight + gap : 0);
      let hs = evs.map((e) => e.offsetHeight);
      const on = evs.map(() => true);
      const total = (): number => { let t = 0, k = 0; on.forEach((o, i) => { if (o) { t += hs[i]; k++; } }); return t + Math.max(0, k - 1) * eg; };
      // a full day first drops the "where" lines; then finished events make room, oldest first; then the latest ones go
      if (total() > avail + 1) { col.setAttribute('data-tight', ''); hs = evs.map((e) => e.offsetHeight); }
      // a day with room to spare lets each "where" run to a second line instead of cutting it short
      else if (box.querySelector('.loc')) { col.setAttribute('data-wrap', ''); const was = hs; hs = evs.map((e) => e.offsetHeight); if (total() > avail + 1) { col.removeAttribute('data-wrap'); hs = was; } }
      if (total() > avail + 1) {
        const room = avail - 30 - gap; // the "+N more" pill sits directly under the last event shown
        for (let i = 0; i < evs.length && total() > room + 1; i++) if (evs[i].classList.contains('past')) on[i] = false;
        for (let i = evs.length - 1; i >= 0 && total() > room + 1; i--) on[i] = false;
        // a tall card may have gone and left room that a smaller one fills: nothing is hidden while it would fit
        for (let i = evs.length - 1; i >= 0; i--) if (!on[i]) { on[i] = true; if (total() > room + 1) on[i] = false; }
      }
      evs.forEach((ev, i) => { ev.style.display = on[i] ? '' : 'none'; });
      const n = on.filter((o) => !o).length;
      if (n) next[box.dataset.day!] = n;
    });
    if (JSON.stringify(next) !== JSON.stringify(this._clip)) { this._clip = next; this.requestUpdate(); }
  }

  // ---------- data ----------
  private _range(): [Date, Date] {
    if (this._view === 'day') { const s = startOfDay(this._anchor); return [s, addDays(s, 1)]; }
    if (this._view === 'month') { const s = startOfMonthGrid(this._anchor); return [s, addDays(s, 42)]; }
    const n = this._span, s = n < 7 ? startOfDay(this._anchor) : startOfWeek(this._anchor); return [s, addDays(s, n)];
  }
  /** How many days the week view shows: all seven where they fit, five or three on a narrower tablet (then starting from the chosen day, not from Monday). */
  private get _span(): number {
    const n = getNarrow(), s = getShape();
    return s === 'phone' ? 7 : s === 'tall' ? (n >= 3 ? 5 : 7) : n >= 3 ? 3 : n >= 2 ? 5 : 7;
  }
  private _spanWas = 7;
  /** Doodle was opened from the page of a child who cannot read: its colours and brushes run along the bottom edge, where he can reach */
  private _doodleLow = false;
  private _leftPicKid = 0; private _picHops = 9;
  private _refresh(): void {
    if (!this.hass || !this._config) return;
    const [a, b] = this._range();
    const key = `${this._view}|${a.toISOString()}`;
    if (key === this._fetchedKey) return;
    const first = !this._fetchedKey && !this._dayKey;
    this._fetchedKey = key;
    this._loadEvents(a, b).then((ev) => { if (ev && !(this._calError && this._events.length && this._evKey === key)) { this._events = ev; this._evKey = key; } }); // a failed poll keeps the last good week on screen
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
        this._calSeen[c.entity] = Date.now();
        const who = c.name ?? this.hass!.states[c.entity]?.attributes.friendly_name ?? c.entity;
        for (const r of rows ?? []) {
          if (!calShows(c, String(r?.summary ?? ''))) continue;
          // one odd row (no start, no end) must not lose the rest of that calendar
          const allDay = !!r?.start?.date, sv = allDay ? `${r.start.date}T00:00:00` : r?.start?.dateTime;
          const start = new Date(sv); if (!sv || isNaN(start.getTime())) continue;
          const ev = allDay ? (r.end?.date ? `${r.end.date}T00:00:00` : '') : r.end?.dateTime;
          let end = new Date(ev); if (!ev || isNaN(end.getTime())) end = new Date(start.getTime() + (allDay ? 86_400_000 : 3_600_000));
          out.push({ title: String(r.summary ?? '').trim() || '(busy)', start, end, allDay, colour: c.colour, who, location: String(r.location ?? '').trim() || undefined, description: String(r.description ?? '').trim() || undefined, entity: c.entity, uid: r.uid ? String(r.uid) : undefined, recurrenceId: r.recurrence_id ? String(r.recurrence_id) : undefined, repeats: !!(r.rrule || r.recurrence_id), rrule: r.rrule ? String(r.rrule) : undefined });
        }
      } catch (e) { failed++; console.warn('Family Hub: calendar fetch failed', c.entity, e); }
    }));
    this._calError = failed === cals.length; this._calTick++;
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
    // a second tap while the first is still on its way to Home Assistant is not sent
    if (this._remOut.has(r.uid)) return;
    const undo = r.uid in this._remTk;
    clearTimeout(this._remTk[r.uid]);
    const drop = (): void => { const { [r.uid]: _, ...rest } = this._remTk; this._remTk = rest; };
    const leave = (): void => { drop(); this._remDue.delete(r.uid); this._reminders = this._reminders.filter((x) => x.uid !== r.uid); void this._loadReminders(); };
    // the row leaves four seconds after the tick, but never before Home Assistant has answered
    if (undo) drop();
    else this._remTk = { ...this._remTk, [r.uid]: window.setTimeout(() => { if (this._remOut.has(r.uid)) this._remDue.add(r.uid); else leave(); }, 4000) };
    sfx(undo ? 'untick' : 'tick');
    const row = [...this.renderRoot.querySelectorAll('button.rem')].find((b) => b.textContent?.trim() === r.summary);
    if (!undo) { const el = row?.querySelector('.check'); if (el) spark('tick', el); }
    this._remJust = r.uid; window.setTimeout(() => { if (this._remJust === r.uid) this._remJust = ''; }, 700);
    const n = (this._remSeq[r.uid] = (this._remSeq[r.uid] ?? 0) + 1); this._remOut.add(r.uid);
    void watched(row, this.hass.callService('todo', 'update_item', { item: r.uid, status: undo ? 'needs_action' : 'completed' }, { entity_id: t })).then((ok) => {
      if (this._remSeq[r.uid] !== n) return; // a later touch on the same row has taken over
      this._remOut.delete(r.uid);
      if (ok) { if (this._remDue.has(r.uid)) leave(); return; }
      // it did not work: the row goes back to how it was, and a calm line says so
      clearTimeout(this._remTk[r.uid]); this._remDue.delete(r.uid);
      if (undo) void this._loadReminders(); else drop();
      sfx('error');
      this._say(wasSlow() ? SLOW_SAY : undo ? 'That did not save. It is still ticked off.' : 'That did not save. Try again in a moment.');
    });
    // the toast carries Undo for eight seconds, longer than the row stays
    if (!undo) this._say(`Done: ${r.summary}`, 8000, { label: 'Undo', run: () => this._untickReminder(r) });
  }
  /** Undo from the toast: while the row is still there it is the same as tapping it again; after it has left, the reminder is put back in its list. */
  private _untickReminder(r: { uid: string; summary: string }): void {
    const t = this._config.reminders; if (!t || !this.hass) return;
    if (this._remOut.has(r.uid)) { window.setTimeout(() => this._untickReminder(r), 300); return; } // the tick is still on its way: Undo follows it
    if (r.uid in this._remTk) { this._tickReminder(r); return; }
    void watched(null, this.hass.callService('todo', 'update_item', { item: r.uid, status: 'needs_action' }, { entity_id: t })).then((ok) => { void this._loadReminders(); this._say(ok ? `Back on the list: ${r.summary}` : 'That did not save. It is still ticked off.'); });
  }
  private async _loadReminders(): Promise<void> {
    const t = this._config.reminders;
    if (!t || !this.hass?.states[t]) { this._reminders = []; this._remState = t ? 'missing' : 'ok'; return; }
    try {
      const res = await this.hass.callWS<{ items: { uid: string; summary: string; status: string }[] }>({ type: 'todo/item/list', entity_id: t });
      this._reminders = res.items.filter((i) => i.status === 'needs_action' || i.uid in this._remTk); this._remState = 'ok';
    } catch { this._reminders = []; this._remState = 'failed'; }
  }

  private _private(title: string): boolean {
    const t = title.toLowerCase();
    return (this._config.private ?? []).some((w) => t.includes(w.toLowerCase()));
  }
  private _eventsOn(d: Date, list = this._events): CalEvent[] {
    const s = startOfDay(d), e = addDays(s, 1);
    // sorted by where each event really begins that day: all-day first, then what runs on from yesterday, then by start time
    return list.filter((ev) => ev.start < e && ev.end > s && !(ev.allDay && ev.end.getTime() === s.getTime())).map((ev, i) => ({ ev, i, k: whenOn(ev, s).sort })).sort((x, y) => x.k - y.k || x.i - y.i).map((x) => x.ev);
  }
  /** The event whose details are open, and the day it was opened from. */
  private _evOpen: { ev: CalEvent; day: Date } | null = null;
  private _evAsk: '' | 'delete' | 'edit' = '';
  private _editScope: '' | 'one' | 'future' = '';
  private _evBusy = false;
  private _editEv: CalEvent | null = null;
  private _openEvent(ev: CalEvent, day: Date): void { if (this._private(ev.title)) return; sfx('tap'); this._evAsk = ''; this._evBusy = false; this._evOpen = { ev, day: startOfDay(day) }; this._sheet = 'event'; }
  /** What the calendar an event lives in lets this screen do with it: delete needs the calendar's "delete", a change needs "update" or (remove and add again) "delete" and "create". For one of a repeating series it asks which: just this one, this and all later ones, or (to delete) all of them. */
  private _evCan(ev: CalEvent): { del: boolean; edit: boolean } {
    const f = Number(this.hass?.states[ev.entity ?? '']?.attributes.supported_features ?? 0), ok = !!ev.uid && !!ev.entity;
    return { del: ok && !!(f & 2), edit: ok && (!ev.repeats || !!ev.recurrenceId) && (!!(f & 4) || (f & 3) === 3) };
  }
  /** Changing or deleting an event is a grown-up's job: with a PIN set, it is asked first. */
  private _evGuard(reason: string, run: () => void): void { if (this._config.parent_pin) this._pinAsk = { reason, sheet: 'event', run }; else run(); }
  private async _deleteEvent(scope: 'one' | 'future' | 'all'): Promise<void> {
    const o = this._evOpen; if (!o || !o.ev.uid || !o.ev.entity || !this.hass || this._evBusy) return;
    const ev = o.ev; this._evBusy = true;
    const msg: Record<string, unknown> = { type: 'calendar/event/delete', entity_id: ev.entity, uid: ev.uid };
    if (ev.recurrenceId && scope !== 'all') { msg.recurrence_id = ev.recurrenceId; if (scope === 'future') msg.recurrence_range = 'THISANDFUTURE'; }
    try {
      await inTime(this.hass.callWS(msg), 15_000);
      this._evBusy = false; this._evAsk = ''; if (this._sheet === 'event') this._sheet = '';
      this._say(`Deleted: ${ev.title}${ev.repeats ? { all: ' (all of them)', one: ' (just this one)', future: ' (this and later ones)' }[scope] : ''}`);
      this._fetchedKey = ''; this._refresh(); void this._loadSoon();
    } catch { this._evBusy = false; sfx('error'); this._say(`${ev.title} was not deleted: Home Assistant did not answer. Please try again.`, 8000); }
  }
  /** What a screen reader hears for an event: "Dentist, Tuesday 5:00 pm, Charlie". */
  private _evName(ev: CalEvent, day: Date): string {
    return `${ev.title}, ${day.toLocaleDateString('en-AU', { weekday: 'long' })} ${whenOn(ev, day).label}, ${ev.who}${ev.location ? `, at ${ev.location}` : ''}`;
  }
  private _eventBody(): TemplateResult | typeof nothing {
    const o = this._evOpen; if (!o) return nothing;
    const { ev, day } = o, part = whenOn(ev, day).label;
    // the calendar's notes are shown as plain text: line breaks kept, any markup taken out, nothing run as HTML
    const notes = (ev.description ?? '').replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, ' ').replace(/<br\s*\/?>|<\/p>|<\/div>|<\/li>/gi, '\n').replace(/<(p|div|li)(\s[^>]*)?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '’').replace(/&amp;/g, '&').replace(/[ \t]{2,}/g, ' ').replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    const row = (ic: TemplateResult, body: unknown, cls = '') => html`<div class="evrow ${cls}"><span class="evic" aria-hidden="true">${ic}</span><span class="evtx">${body}</span></div>`;
    return html`<div class="shead"><h2 class="t-head evtitle" id="evt">${ev.title}</h2></div>
      <div class="evd" style="--c:${slotVar(ev.colour)}">
        ${row(icon('calendar', 22), fmtLongDate(day), 'evday')}
        ${row(icon('timer', 22), html`${fmtSpan(ev)}${/^(Day|until|continues)/.test(part) ? html`<span class="muted evpart"> · ${part === 'continues' ? 'continues all day' : part.replace(/^Day/, 'day')}</span>` : nothing}`, 'evwhen')}
        ${row(this._chip(ev.who, ev.colour), ev.who, 'evwho2')}
        ${ev.location ? row(icon('pin', 22), ev.location, 'evplace') : nothing}
        ${notes ? html`<div class="evnotebox"><span class="label" id="evnl">Notes</span><p class="evnotes scrolly" aria-labelledby="evnl" tabindex="0" @scroll=${scrollCue}>${notes}</p></div>` : nothing}
      </div>
      ${this._evFoot(ev)}`;
  }
  private _evFoot(ev: CalEvent): TemplateResult {
    const can = this._evCan(ev), busy = this._evBusy, series = !!(ev.repeats && ev.recurrenceId);
    const edit = (scope: '' | 'one' | 'future'): void => { this._evAsk = ''; this._editScope = scope; this._editEv = ev; this._sheet = 'add'; };
    if (this._evAsk === 'edit') return html`<div class="sfoot evask rep" role="group" aria-label="Change which?">
        <span class="muted evq">This one repeats. Change just this one, or this and all later ones?</span>
        <button class="pill tap" data-act="ev-keep" @click=${() => { this._evAsk = ''; }}>Cancel</button>
        <button class="pill tap" data-act="ev-edit-one" @click=${() => edit('one')}>Just this one</button>
        <button class="pill tap" data-act="ev-edit-future" @click=${() => edit('future')}>This and later ones</button></div>`;
    if (this._evAsk === 'delete') return html`<div class="sfoot evask ${ev.repeats ? 'rep' : ''}" role="group" aria-label="Delete this event?">
        <span class="muted evq">${ev.repeats ? 'This one repeats. Which should be deleted?' : 'Delete this event? It comes off everyone’s calendar.'}</span>
        <button class="pill tap" data-act="ev-keep" ?disabled=${busy} @click=${() => { this._evAsk = ''; }}>Keep it</button>
        ${series ? html`<button class="pill tap evdel" data-act="ev-del-one" ?disabled=${busy} @click=${() => void this._deleteEvent('one')}>Just this one</button>
          <button class="pill tap evdel" data-act="ev-del-future" ?disabled=${busy} @click=${() => void this._deleteEvent('future')}>This and later ones</button>` : nothing}
        <button class="lead tap evgo" data-act="ev-del-all" ?disabled=${busy} aria-busy=${String(busy)} @click=${() => void this._deleteEvent('all')}>${busy ? 'Deleting…' : ev.repeats ? 'All of them' : 'Delete'}</button></div>`;
    return html`<div class="sfoot"><span class="muted">${!can.del && !can.edit ? 'This calendar can only be changed in its own app.' : ev.repeats ? 'This one repeats.' : ''}</span>
        ${can.del ? html`<button class="pill tap evdel" data-act="ev-delete" @click=${() => this._evGuard('Delete this event?', () => { this._evAsk = 'delete'; })}>${icon('bin', 20)}Delete</button>` : nothing}
        ${can.edit ? html`<button class="pill tap" data-act="ev-edit" @click=${() => this._evGuard('Change this event?', () => { if (series) this._evAsk = 'edit'; else edit(''); })}>${icon('pencil', 20)}Change</button>` : nothing}
        <button class="lead tap" data-act="ev-close" @click=${() => { this._sheet = ''; }}>Close</button></div>`;
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
    if (t.state === 'active' && t.attributes.finishes_at) { const left = new Date(t.attributes.finishes_at).getTime() - Date.now(); return left < -60_000 ? null : Math.max(0, left); }
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
  /** Ask Home Assistant to do something. Resolves true when it did; when it did not, says so and resolves false. It never throws. */
  private async _call(domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>, el: Element | null = Date.now() - this._pressAt < 1200 ? this._pressEl : null): Promise<boolean> {
    // the control that asked shows it is waiting (data-busy) when the answer takes more than 250 ms
    const ok = await watched(el?.isConnected ? el : null, this.hass?.callService(domain, service, data, target));
    if (!ok) this._say(wasSlow() ? SLOW_SAY : 'That did not work. Try again in a moment.');
    return ok;
  }
  protected firstUpdated(): void {
    const note = (e: Event): void => { const el = (e.composedPath() as EventTarget[]).find((n): n is Element => n instanceof Element && n.matches('button, [role=button], [role=switch]')); if (el && (el.getRootNode() as ShadowRoot).host === this) { this._pressEl = el; this._pressAt = Date.now(); } };
    for (const t of ['pointerdown', 'keydown', 'click']) this.renderRoot.addEventListener(t, note, true);
    // a child asked for a grown-up from their page: remembered until this page is closed, shown on the shared pages only
    this.addEventListener('fh-kid-wants-chat', (e) => { const name = String((e as CustomEvent<{ name?: string }>).detail?.name ?? '').trim(); if (name && !this._wantsChat.includes(name)) this._wantsChat = [...this._wantsChat, name]; });
  }
  /** children who tapped "Chat with a grown-up" this session and have not been answered yet */
  private _wantsChat: string[] = [];
  private _addTimer(min: number): void {
    const was = this._timerLeft() !== null; sfx(was ? 'tap' : 'timer');
    void this._call('script', 'fh_timer_add', { minutes: min }).then((ok) => { const t = this.renderRoot.querySelector('.timerrow'); if (ok && t) spark(was ? 'add' : 'rocket', t);
      // the new time arrives with a small roll of the digits and a quick sweep of the ring
      if (ok) { const b = Date.now(); this._bump = b; window.setTimeout(() => { if (this._bump === b) this._bump = 0; }, 450); } });
  }
  /** The timer's digits: when time has just been added they roll up 12 px into place (--m-2). */
  private _roll(txt: string): TemplateResult | string { return this._bump ? keyed(this._bump, html`<span class="troll">${txt}</span>`) as TemplateResult : txt; }
  private _cancelling = false;
  /** Cancel the kitchen timer. A slip can be undone: the toast puts the time that was left back on. */
  private async _cancelTimer(): Promise<void> {
    const left = this._timerLeft(); if (left === null || this._cancelling) return;
    this._cancelling = true; // one Cancel at a time
    try { if (!(await this._call('timer', 'cancel', { entity_id: 'timer.kitchen' }))) return; } finally { this._cancelling = false; }
    if (this._sheet === 'timer') this._sheet = '';
    const s = Math.max(1, Math.round(left / 1000)), p2 = (n: number): string => String(n).padStart(2, '0');
    const duration = `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
    sfx('untick');
    this._say('Timer cancelled', 8000, { label: 'Undo', run: () => { void this._call('timer', 'start', { entity_id: 'timer.kitchen', duration }).then((ok) => { if (ok) this._say('Timer back on'); }); } });
  }
  private _checkAlarm(): void {
    const m = panelMsg(this.hass);
    if (m?.alarm && m.ts && m.ts !== this._alarmSeen && Date.now() / 1000 - m.ts < 120) {
      this._alarmSeen = m.ts; this._alarm = m.ts; sfx('alarm');
      let n = 0;
      const rep = window.setInterval(() => { if (!this._alarm || ++n > 12) { clearInterval(rep); this._alarm = 0; return; } sfx('alarm'); }, 5000);
    }
  }
  /** Where a daily medicine stands. A helper that has never been set reads as midnight today, given by "unknown": that is not a dose. */
  private _medStatus(id: string, time: string): { given: Date | null; by: string; due: boolean; late: boolean; stale: boolean; missing: boolean } {
    const st = this.hass?.states[`input_datetime.fh_med_${id}`];
    const raw = this.hass?.states[`input_text.fh_med_${id}_by`]?.state ?? '';
    const by = ['unknown', 'unavailable'].includes(raw) ? '' : raw;
    const ts = st?.attributes.timestamp ? new Date(st.attributes.timestamp * 1000) : null;
    const neverSet = !!ts && !by && ts.getHours() === 0 && ts.getMinutes() === 0 && ts.getSeconds() === 0;
    const given = ts && !neverSet && sameDay(ts, new Date()) ? ts : null;
    const n = minsNow(this._now), t = hm(time);
    // overdue is red for its first hour; after that it has been seen, and it settles to amber
    return { given, by, due: !given && n >= t - 60, late: !given && n > t + 45, stale: !given && n > t + 105, missing: !st || st.state === 'unavailable' };
  }
  /** Recording or removing a dose is a grown-up's job: ask for the PIN once each time the sheet is opened (meds_pin: false turns this off). */
  private _medOpen = false;
  private _medGuard(reason: string, run: () => void): void {
    if (this._medOpen || !this._config.parent_pin || this._config.meds_pin === false) { run(); return; }
    this._pinAsk = { reason, sheet: 'meds', run: () => { this._medOpen = true; run(); } };
  }
  /** "Later": the header chip is put away until this time (this screen only). The sheet and the round pill button stay. */
  private _medLater = ((): number => { try { return Number(localStorage.getItem('family-hub-med-later')) || 0; } catch { return 0; } })();
  private _medSnooze(mins: number): void {
    this._medLater = mins ? Date.now() + mins * 60_000 : 0;
    try { if (mins) localStorage.setItem('family-hub-med-later', String(this._medLater)); else localStorage.removeItem('family-hub-med-later'); } catch { /* ignore */ }
    if (mins) { this._sheet = ''; this._say(`Medicine reminder back at ${fmtTime(new Date(this._medLater))}`); } else this.requestUpdate();
  }
  private _medBusy = ''; private _medBy = '';
  private async _giveMed(id: string, by: string): Promise<void> {
    const h = this.hass!;
    if (this._medBusy) return;
    this._medBusy = id; this._medBy = by; this.requestUpdate();
    // what the helpers said before, so a slip can be taken back
    const was = { ts: h.states[`input_datetime.fh_med_${id}`]?.attributes.timestamp as number | undefined, by: h.states[`input_text.fh_med_${id}_by`]?.state ?? '' };
    const midnight = Math.floor(startOfDay(new Date()).getTime() / 1000), oldBy = ['unavailable', ''].includes(was.by) ? 'unknown' : was.by;
    let step = 0;
    try {
      // the name is written before the time: the row only reads as given once the time is in, so a slow link can never show the time beside the person who gave it yesterday
      await inTime(h.callService('input_text', 'set_value', { entity_id: `input_text.fh_med_${id}_by`, value: by })); step = 1;
      await inTime(h.callService('input_datetime', 'set_datetime', { entity_id: `input_datetime.fh_med_${id}`, timestamp: Math.floor(Date.now() / 1000) })); step = 2;
      h.callService('persistent_notification', 'dismiss', { notification_id: `fh_meds_${id.split('_').pop()}` }).catch(() => undefined);
      sfx('tick');
      const d = (this._config.meds ?? []).find((m) => m.id === id);
      this._say(`Recorded${d?.who ? ` for ${d.who}` : ''}: ${d?.label ?? 'dose'}, given by ${by}`, 10_000, { label: 'Undo', run: () => this._medGuard('Take this record back?', () => void this._ungiveMed(id, was)) });
    } catch (e) {
      // half a record is no record: whatever was written is put back, so the row is not left ticked or under the wrong name
      h.callService('input_text', 'set_value', { entity_id: `input_text.fh_med_${id}_by`, value: oldBy }).catch(() => undefined);
      if (step === 1) h.callService('input_datetime', 'set_datetime', { entity_id: `input_datetime.fh_med_${id}`, timestamp: was.ts ?? midnight }).catch(() => undefined);
      this._say(e instanceof SlowError ? `${SLOW_SAY} Nothing was recorded.` : 'That was not recorded: Home Assistant did not answer. Please try again.', 7000);
    } finally { this._medBusy = ''; this._medBy = ''; this.requestUpdate(); }
  }

  /** Undo of "Given by": today's record for that medicine is cleared by putting both helpers back to what they said before. */
  private async _ungiveMed(id: string, was: { ts?: number; by: string }): Promise<void> {
    const h = this.hass!, midnight = Math.floor(startOfDay(new Date()).getTime() / 1000);
    try {
      await h.callService('input_datetime', 'set_datetime', { entity_id: `input_datetime.fh_med_${id}`, timestamp: was.ts ?? midnight });
      await h.callService('input_text', 'set_value', { entity_id: `input_text.fh_med_${id}_by`, value: ['unavailable'].includes(was.by) ? 'unknown' : was.by });
      sfx('untick'); this._say('Record taken back. Nothing is recorded for today.');
    } catch { this._say('That was not taken back: Home Assistant did not answer. Please try again.', 7000); }
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
      if (id && this.hass?.states[id]) await inTime(this.hass.callService('todo', 'add_item', { item: line }, { entity_id: id }));
      else { const all = JSON.parse(localStorage.getItem(FamilyHubCard.MED_KEY) ?? '[]') as string[]; localStorage.setItem(FamilyHubCard.MED_KEY, JSON.stringify([line, ...all].slice(0, 60))); }
      sfx('tick'); this._say(`Logged: ${what} for ${m.who} at ${fmtTime(at)}`);
      this._mx = { what: '', other: '', who: '', ago: 0, by: m.by, caps: true };
      await this._loadMedLog(); this.requestUpdate(); await this.updateComplete;
      // the new line is brought into view (the record can be longer than the sheet)
      { const iso = at.toISOString(), row = [...this.renderRoot.querySelectorAll<HTMLElement>('.sheet .irow[data-at]')].find((x) => x.dataset.at === iso); row?.scrollIntoView({ block: 'nearest', behavior: this.renderRoot.querySelector('.fh[data-calm]') ? 'auto' : 'smooth' }); }
    } catch (e) { this._say(e instanceof SlowError ? SLOW_SAY : 'That could not be saved. Try again.'); }
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
    // only the bins this household has: a colour saved from an older list (blue, purple) is not read out
    const night = addDays(d, (b.day - d.getDay() + 7) % 7), alt = (b.alternate ?? []).filter(isBin);
    let turn: string[] = [];
    if (alt.length) {
      const a0 = b.anchor ? new Date(`${b.anchor}T00:00:00`) : new Date(2026, 0, 5);
      const weeks = Math.round((new Date(night.getFullYear(), night.getMonth(), night.getDate()).getTime() - a0.getTime()) / (7 * 86400000));
      turn = [alt[((weeks % alt.length) + alt.length) % alt.length]];
    }
    return { night, bins: [...(b.always ?? []).filter(isBin), ...turn] };
  }
  private _binDots(bins: string[]): TemplateResult {
    return html`${bins.map((n) => html`<i class="bin" style="background:${BINS[n.toLowerCase()]?.col ?? 'var(--ink2)'}" aria-hidden="true"></i>`)}`;
  }

  // ---------- actions ----------
  /** Toasts stay long enough for a slow reader: at least 4.5 s, longer for longer messages, and at least 5 s when they carry an action. */
  private _say(msg: string, ms = Math.max(4500, msg.split(/\s+/).length * 450), act: { label: string; run: () => void } | null = null): void {
    this._toast = msg; this._toastAct = act;
    clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => { this._toast = ''; this._toastAct = null; }, act ? Math.max(5000, ms) : ms);
  }
  private _setTheme(id: ThemeId): void {
    this._theme = id; setSoundTheme(id); sfx('look');
    try { localStorage.setItem(THEME_KEY, id); } catch { /* ignore */ }
  }
  private _setLook(id: LookId): void {
    this._look = id; setLook(id); sfx('look');
    try { localStorage.setItem(LOOK_KEY, id); } catch { /* ignore */ }
  }
  private _toggleOpt(id: string): void {
    this._opts = { ...this._opts, [id]: !this._opts[id] }; sfx(this._opts[id] ? 'on' : 'off');
    try { localStorage.setItem(LOOK_OPTS_KEY, JSON.stringify(this._opts)); } catch { /* ignore */ }
  }
  private _setSounds(m: 'on' | 'quiet' | 'off'): void {
    this._snd = m; setSounds(m === 'off' ? false : m === 'quiet' ? 'quiet' : true); sfx('tap');
    try { localStorage.setItem(SOUNDS_KEY, m); } catch { /* ignore */ }
  }
  /** Any plain button says "tap" (a switch says on or off) unless its own handler has already asked for a sound. A part of the page that is keeping quiet marks itself `data-hush`. */
  private _asksAt = 0;
  private _tapWhat: 'tap' | 'on' | 'off' | '' = '';
  /** On the way down, before any handler has run: what this press is (a switch is read before it flips). */
  private _tapMark = (e: Event): void => {
    this._asksAt = sfxAsked(); this._tapWhat = '';
    let b: HTMLElement | null = null;
    for (const n of e.composedPath()) { if (!(n instanceof HTMLElement)) continue; if (n.hasAttribute('data-hush')) return; if (!b && (n.classList.contains('tap') || n.getAttribute('role') === 'switch')) b = n; if (n === this) break; }
    if (b) this._tapWhat = b.getAttribute('role') === 'switch' ? (b.getAttribute('aria-checked') === 'true' ? 'off' : 'on') : 'tap';
  };
  /** On the way back up, after the handlers and the re-draw they asked for: a sheet that opened, a tick, a page change have spoken by now. */
  private _tapSfx = (): void => { const at = this._asksAt, s = this._tapWhat; if (s) window.setTimeout(() => { if (sfxAsked() === at) sfx(s); }, 0); };
  private _shift(dir: number): void {
    const a = this._anchor;
    this._anchor = this._view === 'day' ? addDays(a, dir) : this._view === 'week' ? addDays(a, this._span * dir) : new Date(a.getFullYear(), a.getMonth() + dir, 1);
  }
  /** One dock scene at a time: further taps wait until Home Assistant has answered. */
  private _sceneBusy = false;
  private async _allOn(checked = false): Promise<void> {
    if (this._sceneBusy) return;
    // after any child's bedtime a wall of light is a grown-up's call
    const c = this._config, late = afterBedtime(c.kids, c.quiet);
    if (!checked && late && c.parent_pin) { this._pinAsk = { reason: 'It is after bedtime. Turn the lights on?', run: () => void this._allOn(true) }; return; }
    const ids = c.all_on, S = this.hass?.states ?? {};
    // only what this tap turns on can be undone: lights that were already on stay on
    const off = (ids?.length ? ids : Object.keys(S).filter((id) => id.startsWith('light.'))).filter((id) => S[id] && S[id].state !== 'on' && S[id].state !== 'unavailable');
    sfx('tap');
    this._sceneBusy = true;
    const ok = await this._call('light', 'turn_on', { entity_id: ids?.length ? ids : 'all' });
    this._sceneBusy = false;
    if (!ok) return;
    const what = ids?.length ? 'Living areas on' : 'All lights on';
    if (!off.length) { this._say(what); return; }
    this._say(what, 10_000, { label: 'Undo', run: () => { void this._call('light', 'turn_off', { entity_id: off }).then((done) => { if (done) this._say('Back off'); }); } });
  }
  /**
   * What "All off" leaves alone: everything named in `keep_on`, anything inside a group named there, and any group that has one of
   * those inside it (switching the group off would switch its kept member off with it; its other members are still switched off one by one).
   */
  private _kept(): Set<string> {
    const S = this.hass?.states ?? {}, kept = new Set<string>();
    const inside = (id: string): string[] => { const m = S[id]?.attributes.entity_id; return Array.isArray(m) ? m.filter((x): x is string => typeof x === 'string') : []; };
    const add = (id: string): void => { if (kept.has(id)) return; kept.add(id); inside(id).forEach(add); };
    (this._config.keep_on ?? []).forEach(add);
    if (!kept.size) return kept;
    // groups that hold something kept, however deep
    for (let grew = true; grew;) { grew = false; for (const id of Object.keys(S)) if (!kept.has(id) && inside(id).some((m) => kept.has(m))) { kept.add(id); grew = true; } }
    return kept;
  }
  private _off: { at: number; timer?: number } | null = null;
  private _offCancel(say = true): void { if (!this._off) return; clearTimeout(this._off.timer); this._off = null; if (say) this._say('Cancelled. The lights stay on.'); }
  private async _allOff(go = false): Promise<void> {
    if (this._sceneBusy) return;
    const lit = Object.values(this.hass?.states ?? {}).filter((s) => s.entity_id.startsWith('light.') && s.state === 'on'), kept = this._kept();
    const on = lit.filter((s) => !kept.has(s.entity_id)).map((s) => s.entity_id);
    // how many things stay on: the lights themselves, not the groups that only hold them
    const stay = lit.filter((s) => kept.has(s.entity_id)), leaves = stay.filter((s) => !Array.isArray(s.attributes.entity_id)), n = (leaves.length || stay.length);
    const keptSay = n ? ` (${n} thing${n === 1 ? '' : 's'} kept on)` : '';
    if (!on.length) { this._offCancel(false); this._say(n ? `Nothing else to turn off${keptSay}` : 'Everything’s already off'); return; }
    // one tap must not black out the house: a three-second wait with Cancel, as Dinner has (all_off_wait: 0 goes at once)
    const wait = Math.max(0, Number(this._config.all_off_wait ?? 3)) * 1000;
    if (!go && wait) { if (this._off) return; sfx('tap'); this._off = { at: Date.now() + wait, timer: window.setTimeout(() => { this._off = null; void this._allOff(true); }, wait) }; return; }
    this._sceneBusy = true;
    const ok = await this._call('light', 'turn_off', { entity_id: on }, undefined, ...(go ? [this.renderRoot.querySelector('nav [data-nav="lights-off"]')] : []));
    this._sceneBusy = false;
    if (!ok) return;
    sfx('untick');
    this._say(n ? `All off${keptSay}` : 'Lights off', 10_000, { label: 'Undo', run: () => { void this._call('light', 'turn_on', { entity_id: on }).then((ok2) => { if (ok2) this._say('Back on'); }); } });
  }
  /** A timed job tagged @song: play the tidy-up song on the child's speaker for that long, then fade it out. */
  private _tidySong(k: KidConfig, minutes: number): void {
    const h = this.hass, list = h ? rooms(h, this._config.music_players ?? []) : [];
    const room = h && (kidSpeaker(h, k, list) ?? findRoom(h, list, this._config.music_player) ?? list[0]);
    if (!h || !room) return;
    if (!minutes) { void this._call('media_player', 'media_pause', { entity_id: room.entity_id }); return; }
    const song = k.tidy_song ?? this._config.tidy_song;
    if (!song) { this._say('Set tidy_song in the card settings to add music to this job'); return; }
    play(h, room.entity_id, song, 'play').then(() => sleepIn(h, room.entity_id, minutes)).catch(() => this._say(`${room.attributes.friendly_name} couldn’t play the tidy-up song`));
  }

  private _dinnerStart(): void {
    if (Date.now() < this._dinnerCooldown) { this._say('Already called – give them a minute'); return; }
    sfx('tap');
    const timer = window.setTimeout(() => { void this._dinnerGo(); }, 3000);
    this._dinner = { at: Date.now() + 3000, timer };
  }
  private _dinnerCancel(): void { clearTimeout(this._dinner?.timer); this._dinner = null; this._say('Cancelled'); }
  private async _dinnerGo(): Promise<void> {
    this._dinner = null;
    const s = this._config.announce_script;
    if (!s || !this.hass) { this._say('Set announce_script in the card settings'); return; }
    // With a house voice the script is told which recording to play (fh_file), or '' when the file is not there, so that it speaks the line instead.
    // A script that does not know these variables ignores them.
    const variables = this._config.voice ? { variables: { fh_line: 'dinner', fh_file: await lineReady('dinner'), fh_voice: houseVoice()?.voice ?? '' } } : {};
    if (!(await this._call('script', 'turn_on', { entity_id: s, ...variables }, undefined, this.renderRoot.querySelector('nav [data-nav="dinner"]')))) return;
    this._dinnerCooldown = Date.now() + 60_000;
    sfx('done');
    this._say('Calling everyone for dinner');
  }
  private _media(service: string): void {
    const m = this._config.music_player;
    if (m) void this._call('media_player', service, { entity_id: m });
  }
  /** Ask, the children's chat. After any child's bedtime, and in quiet hours, it is for grown-ups to open. */
  private _chatLate(now = new Date()): boolean {
    const c = this._config;
    return afterBedtime(c.kids, c.quiet, now);
  }
  private _openChat(): void {
    const c = this._config, kid = this._kidOn, rules = askByChild(c.kids);
    // Ask set by child: on his own page it is his Ask; anywhere else the sheet first asks who is asking. Not set by child: it opens for anyone, as it always did.
    const open = (): void => { this._asker = !rules ? '' : kid && askFor(kid).mode !== 'off' ? kid.name : null; this._sheet = 'chat'; };
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
    const look = lookById(this._lk);
    // themed looks take their tokens from the photo theme; the others define theirs in the look stylesheet
    const skin = look.themed ? `${themeStyle(theme)}${this._photo ? `;--bg:url('${this._photo}')` : ''};` : '';
    const hr = this._now.getHours(), todKey = hr >= 21 || hr < 6 ? 'night' : hr >= 18 ? 'eve' : 'day';
    const kp = this._kp, mk = this._page === 'music' && this._musicKid ? this._config.kids?.find((k) => k.name === this._musicKid) : undefined;
    // calm: everywhere when the house says so; otherwise a child's page (and Music opened from it) follows his own choice, and the shared pages move.
    // A child's page is animated until calm is chosen (Oliver, 14 Nov 2026).
    const calm = this._config.calm === true || (kp ? kp.calm : mk ? kidPrefs(mk).calm : false);
    const h = this._now.getHours();
    const tod = h < 5 || h >= 21 ? 'rgba(10,20,60,.28)' : h < 7 ? 'rgba(255,170,150,.16)' : h >= 17 && h < 19 ? 'rgba(255,150,60,.14)' : h >= 19 ? 'rgba(30,40,110,.2)' : 'transparent';
    const rainy = /rain|pour|storm|lightning/.test(this.hass?.states[this._config.weather ?? '']?.state ?? '');
    // things that fade out before they leave: the sheet, the toast, the PIN pad's question and the screensaver
    const [sheet, sheetOut] = linger(this, 'sheet', this._sheet), [toast, toastOut] = linger(this, 'toast', this._toast ? { msg: this._toast, act: this._toastAct } : null), [artUp, artOut] = linger(this, 'art', this._art.on, 250);
    return html`
      <div lang="en-AU" class="fh ${this._idle ? 'idle' : ''} ${rainy ? 'rainy' : ''}" data-tod=${todKey} data-dow=${this._now.getDay()} ?data-calm=${calm} ?data-compact=${this._compact} style=${`${skin}--tod:${tod};--z:${this._z};--top:${this._top}px;--bot:${this._bot}px`}>
        ${this._config.ambient === false || this._photo ? nothing : html`<fh-ambient .look=${this._lk} .theme=${theme.id} .tod=${todKey} .calm=${calm} .hold=${!!(sheet || this._alarm)} .demo=${this._config.ambient_demo ?? ''}></fh-ambient><fh-ambient front .look=${this._lk} .theme=${theme.id} .tod=${todKey} .calm=${calm} .hold=${!!(sheet || this._alarm)} .demo=${this._config.ambient_demo ?? ''}></fh-ambient>`}
        ${this._header()}
        <div class="body">${this._body()}</div>
        ${this._dock()}
        ${this._sheetView(sheet, sheetOut)}
        ${this._dinner ? this._dinnerView() : nothing}
        ${this._off ? this._offView() : nothing}
        <div class="toasts" role="status" aria-live="polite">${toast ? html`<div class="toast" ?data-closing=${toastOut}><span>${toast.msg}</span>${toast.act ? html`<button class="tap" @click=${() => { const a = this._toastAct; this._toast = ''; this._toastAct = null; clearTimeout(this._toastTimer); sfx('undo'); a?.run(); }}>${toast.act.label}</button>` : nothing}</div>` : nothing}</div>
        ${artUp ? this._artView(artOut, calm, theme.id, todKey) : nothing}
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
        return html`<fh-kid .hass=${this.hass} .kid=${k} .art=${c.art ?? {}} .familyCalendars=${fam} .calRules=${c.calendars ?? []} .pin=${String(c.parent_pin ?? '')} .owed=${'todo.rewards_owed'}
          .jarTarget=${c.jar?.target ?? 120} .jarReward=${c.jar?.reward ?? 'a family treat'} .privateWords=${c.private ?? []} .quiet=${quiet} .oneAtATime=${kidPrefs(k).focus} .ask=${!!c.chat?.agent && (!askByChild(c.kids) || askFor(k).mode !== 'off')} @ask=${() => this._openChat()} @song=${(e: CustomEvent<{ minutes: number }>) => this._tidySong(k, e.detail.minutes)}></fh-kid>`;
      }
      case 'home': return html`<fh-home .hass=${this.hass} .pin=${String(c.parent_pin ?? '')} .hide=${c.home_hide ?? []} .hideScripts=${c.announce_script ? [c.announce_script] : []}
        @say=${(e: CustomEvent<string>) => this._say(e.detail)} @music=${(e: CustomEvent<string>) => { this._musicFocus = e.detail; this._page = 'music'; }}></fh-home>`;
      case 'music': return html`<fh-music .hass=${this.hass} .players=${c.music_players ?? []} .stations=${c.radio ?? []} .source=${c.radio_source ?? 'media-source://radio_browser/country/AU'} .preferred=${this._musicFocus || (c.music_player ?? '')}
        .kids=${c.kids ?? []} .people=${c.people ?? []} .pin=${String(c.parent_pin ?? '')} .quiet=${c.quiet ?? {}} .sleepMinutes=${c.music_sleep_minutes ?? 30} .map=${c.music_map ?? []} .hide=${c.music_hide ?? []} .moments=${c.music_moments ?? []} .lock=${c.music_lock !== false} .views=${c.music_views ?? []} .callVolume=${c.call_volume ?? 70} .callLanguage=${c.call_language ?? 'en-AU'} .callVoice=${c.call_voice ?? ''} .theme=${this._theme}></fh-music>`;
      case 'weather': return html`<fh-weather .hass=${this.hass} .entity=${c.weather ?? ''} .page=${c.weather_page ?? {}} .theme=${this._theme}></fh-weather>`;
      case 'doodle': return html`<fh-doodle .hass=${this.hass} ?low=${this._doodleLow} .artists=${(c.kids ?? []).map((k) => k.name)} .kids=${c.kids ?? []} .pin=${String(c.parent_pin ?? '')}></fh-doodle>`;
      case 'morning': return html`<fh-morning .hass=${this.hass} .kids=${c.kids ?? []} .events=${this._soon} .leaveBy=${c.morning?.leave_by ?? '08:15'} .rules=${c.bring_rules ?? []}
        .privateWords=${c.private ?? []} .uv=${this._wx.uv ?? 0} .termLabel=${this._termLabel()} .travel=${c.morning?.travel ?? 15} @open-kid=${(e: CustomEvent<string>) => this._openKid(e.detail)}></fh-morning>`;
      default: break;
    }
    return html`${this._planner()}${this._aside()}`;
  }

  private _artView(closing: boolean, calm: boolean, theme: string, tod: string): TemplateResult {
    const now = this._now, clk = fmtClock(now), night = this._isNight();
    const arcs = this._arcs(this._eventsOn(now, this._soon)).map((x) => (night ? { ...x, colour: 'rgba(255,178,107,.7)' } : x));
    return artView(this._art, { now, hm: clk.hm, ampm: clk.ampm, date: fmtLongDate(now), art: lookArt(this._lk, 'night', { now, arcs, size: 190 }), lines: closing ? [] : this._artLines(), night, closing, calm, look: this._lk, theme, tod,
      onWake: (e: Event) => { if (e.type === 'keydown') { e.preventDefault(); this._lastTouch = Date.now(); this._art.wake(); } } });
  }
  /** Night: a grown-up chose "Night", or it is the night window, or a child's bedtime has passed. The screensaver then shows its pictures dimmer and warmer, and the screen is at its lowest. */
  private _isNight(): boolean {
    const n = this._config.night;
    return this._nightManual || (!!n && inWindow(this._now, n.start, n.end)) || artNight(this._config.kids, this._config.quiet, this._now);
  }

  /** One fixed row of at most two chips, most urgent first, so the header never changes height. */
  private _capsule(): TemplateResult {
    const c = this._config, chips: [number, TemplateResult][] = [];
    const left = this._timerLeft();
    // the planner already shows the timer in its side card, so only repeat it there in the last minute
    if (left !== null && (this._page !== 'planner' || left < 60000)) {
      const mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
      chips.push([left < 60000 ? 1 : 2.2, html`<button class="cap tap ${left < 60000 ? 'hot' : ''}" data-kind="timer" data-p="1" aria-label="Kitchen timer, ${mm} minutes ${ss} seconds left" @click=${() => { this._sheet = 'timer'; }}>${icon('timer', 20)}<b>${mm}:${String(ss).padStart(2, '0')}</b></button>`]);
    }
    const msg = panelMsg(this.hass);
    if (msg && !msg.alarm) chips.push([4, html`<span class="cap" data-kind="msg" data-p="4"><span class="ell">${msg.t}</span></span>`]);
    {
      const all = (c.meds ?? []).map((m) => ({ m, s: this._medStatus(m.id, m.time) }));
      const due = all.filter((x) => x.s.due), late = due.some((x) => x.s.late), done = all.filter((x) => x.s.given);
      const open = () => { this._sheet = 'meds'; void this._loadMedLog(); };
      // a shared wall: the chip says how many, never who (names are inside the sheet). "Later" in the sheet puts it away for half an hour.
      if (due.length && Date.now() >= this._medLater) {
        const red = due.some((x) => x.s.late && !x.s.stale), word = late ? 'overdue' : 'due', p = red ? 0 : late ? 1.5 : 2;
        chips.push([p, html`<button class="cap tap ${red ? 'hot' : ''}" ?data-warm=${late && !red} data-kind="med" data-p=${red ? 0 : 2} aria-label=${`Medicine: ${due.length} ${word}`} @click=${open}>${art('pill', 22)}<span style="white-space:nowrap">${due.length} ${word}</span></button>`]);
      }
      else if (!due.length && done.length && this._now.getHours() < 12) chips.push([5, html`<button class="cap tap ok" data-kind="med" data-p="5" aria-label=${`Medication given${done.length === 1 ? ` at ${fmtTime(done[0].s.given!)}` : `: ${done.length}`}`} @click=${open}>${art('pill', 22)}${icon('check', 18)}<span>${done.length === 1 ? fmtTime(done[0].s.given!) : `${done.length} given`}</span></button>`]);
    }
    // a child tapped "Chat with a grown-up": shown to the grown-ups on the shared pages (never on a child's page), until one of them taps it away
    if (this._page !== 'kid') for (const n of this._wantsChat) chips.push([0.5, html`<button class="cap tap" data-kind="chat" data-p="1" aria-label=${`${n} would like a chat. Tap to dismiss`} @click=${() => { this._wantsChat = this._wantsChat.filter((x) => x !== n); }}>${icon('ask', 20)}<span>${n} would like a chat</span></button>`]);
    const bn = this._bins(this._now);
    if (bn && sameDay(bn.night, this._now) && bn.bins.length) { const p = this._now.getHours() >= 16 ? 2.5 : 5; chips.push([p, html`<span class="cap" data-kind="bin" data-p=${p >= 3 ? 5 : 3} role="img" aria-label=${`Bin night: ${bn.bins.join(' and ')} bins go out tonight`}>${icon('bin', 20)}<span>Bins tonight</span>${this._binDots(bn.bins)}<span>${bn.bins.join(' + ')}</span></span>`]); }
    const now = Date.now();
    const next = this._soon.find((e) => !e.allDay && e.start.getTime() > now && e.start.getTime() - now < 12 * 3_600_000 && !this._private(e.title));
    if (next) {
      const mins = Math.round((next.start.getTime() - now) / 60000);
      const when = mins < 60 ? `in ${mins} min` : `${sameDay(next.start, new Date()) ? '' : 'Tomorrow '}${fmtTime(next.start)}`;
      chips.push([3, html`<button class="cap evcap tap" data-kind="next" data-p="3" aria-label=${`Next: ${this._evName(next, next.start)}`} @click=${() => this._openEvent(next, next.start)}>${this._chip(next.who, next.colour)}<span class="ell">${next.title}</span><span style="white-space:nowrap">· ${when}</span></button>`]);
    }
    const m = c.music_player ? this.hass?.states[c.music_player] : undefined;
    if (m?.state === 'playing' && this._page !== 'music' && this._page !== 'planner') chips.push([6, html`<button class="cap tap" data-kind="music" data-p="6" aria-label=${`Playing: ${m.attributes.media_title ?? 'music'}. Open Music`} @click=${() => { this._page = 'music'; }}>${icon('music', 20)}<span class="ell">${m.attributes.media_title ?? 'Playing'}</span></button>`]);
    // at most two chips, most urgent first; _fitHeader then takes out whole chips that do not fit the row
    // the header says two things at most: the one most urgent thing (medicine, the timer, someone asking for a chat, the bins, a message, the music) and what is next on the calendar
    const nextUp = chips.find((x) => x[0] === 3), urgent = chips.filter((x) => x[0] !== 3).sort((x, y) => x[0] - y[0])[0];
    return html`<div class="capsule" aria-live="polite">${[urgent, nextUp].filter((x): x is [number, TemplateResult] => !!x).map((x) => x[1])}</div>`;
  }

  /** On a child's page: only his own next event (and the kitchen timer in its last minute). */
  private _kidCapsule(k: KidConfig): TemplateResult {
    const now = Date.now(), chips: TemplateResult[] = [], left = this._timerLeft();
    if (left !== null && left < 60000) chips.push(html`<button class="cap tap hot" data-kind="timer" data-p="1" aria-label="Kitchen timer, ${Math.floor(left / 1000)} seconds left" @click=${() => { this._sheet = 'timer'; }}>${icon('timer', 20)}<b>0:${String(Math.floor(left / 1000)).padStart(2, '0')}</b></button>`);
    const n = k.name.toLowerCase();
    const next = this._soon.find((e) => !e.allDay && e.start.getTime() > now && e.start.getTime() - now < 12 * 3_600_000 && !this._private(e.title) && (e.who === k.name || e.title.toLowerCase().includes(n)));
    if (next) {
      const mins = Math.round((next.start.getTime() - now) / 60000);
      const when = mins < 60 ? `in ${mins} min` : `${sameDay(next.start, new Date()) ? '' : 'Tomorrow '}${fmtTime(next.start)}`;
      chips.push(html`<button class="cap evcap tap" data-kind="next" data-p="3" aria-label=${`Next: ${this._evName(next, next.start)}`} @click=${() => this._openEvent(next, next.start)}>${this._chip(k.name, k.colour)}<span class="ell">Next: ${next.title}</span><span style="white-space:nowrap">· ${when}</span></button>`);
    }
    return html`<div class="capsule" aria-live="polite">${chips}</div>`;
  }

  private _header(): TemplateResult {
    const c = this._config, h = this.hass, now = this._now, clk = fmtClock(now);
    const w = c.weather ? h?.states[c.weather] : undefined;
    const temp = w?.attributes.temperature;
    const wx = this._wx, kid = this._kidOn;
    // who-is-home only knows about people Home Assistant tracks
    const tracked = (c.people ?? []).filter((p) => p.entity);
    return html`
      <header>
        <div class="clock">
          ${lookArt(this._lk, 'clock', { now, arcs: this._arcs(this._eventsOn(now, this._soon)) })}
          <span style="font-size:var(--fs-3);font-weight:var(--w-semi, 600)" class="muted greet">${greeting(now)}${kid ? `, ${kid.name}` : c.family_name ? `, ${c.family_name}` : ''}</span>
          <span style="display:flex;align-items:baseline;gap:10px"><span class="display hm">${clk.hm}</span><span class="muted" style="font-size:var(--fs-3);font-weight:var(--w-semi, 600)">${clk.ampm} · ${fmtShortDate(now)}</span></span>
        </div>
        ${kid ? this._kidCapsule(kid) : this._capsule()}
        <div class="right" @click=${this._btnJust}>
          ${w && !kid ? html`
            <button class="glass weather tap" aria-label="Weather" @click=${() => { if (c.weather_page !== false) this._page = 'weather'; }}>
              ${art('cloud', 34, this._artData(false))}
              <span style="display:flex;flex-direction:column;line-height:1.15">
                <span style="font-weight:var(--w-bold, 700);font-size:var(--fs-4)">${temp !== undefined ? `${Math.round(temp)}°` : '–'}${wx.max !== undefined ? html`<span class="muted wtop" style="font-size:var(--fs-1);font-weight:var(--w-semi, 600)"> · top ${Math.round(wx.max)}°</span>` : nothing}</span>
                <span class="muted wsub" style="font-size:var(--fs-1);font-weight:var(--w-semi, 600)">${COND[w.state] ?? (['unavailable', 'unknown', ''].includes(w.state) ? 'No weather' : w.state)}${wx.rain ? ` · ${wx.rain} mm` : ''}</span>
              </span>
              ${lookArt(this._lk, 'wx', { wx: { state: w.state, uv: wx.uv, rain: wx.rain, max: wx.max } })}
              ${(wx.uv ?? 0) >= 3 ? html`<span class="badge" title="UV ${wx.uv}">${icon('sun', 14)}UV ${Math.round(wx.uv!)}</span>` : nothing}
              ${(wx.max ?? 0) >= 35 ? html`<span class="badge hot">${icon('thermo', 14)}Hot</span>` : nothing}
            </button>` : nothing}
          ${c.chat?.agent && !(this._kidOn && askByChild(c.kids) && askFor(this._kidOn).mode === 'off') ? html`<button class="glass tap round hb" data-act="ask" aria-label="Ask a question" @click=${() => this._openChat()}>${art('ask', 24)}<span class="rl" aria-hidden="true">Ask</span></button>` : nothing}
          ${kid ? html`<button class="glass tap round hb" data-act="looks" aria-label=${`${kid.name}’s settings`} @click=${() => this._openLooks()}>${icon('cog')}<span class="rl" aria-hidden="true">Settings</span></button>`
            : html`<button class="glass tap round hb" data-act="more" aria-label="More: looks, ${c.meds?.length || c.med_log ? 'medicine, ' : ''}house info, night${tracked.length ? ' and who is home' : ''}" aria-haspopup="dialog" @click=${() => { this._sheet = 'more'; }}>${icon('more')}<span class="rl" aria-hidden="true">More</span></button>`}
        </div>
      </header>`;
  }

  private _planner(): TemplateResult {
    const v = this._view, [a, b] = this._range();
    const head = v === 'week' ? ['This week', fmtRange(a, addDays(b, -1))] : v === 'day' ? [sameDay(a, new Date()) ? 'Today' : fmtDow(a), fmtLongDate(a)] : [this._anchor.toLocaleDateString('en-AU', { month: 'long' }), String(this._anchor.getFullYear())];
    if (v === 'week' && this._span < 7) head[0] = sameDay(a, new Date()) ? `Next ${this._span} days` : `${this._span} days`;
    else if (v === 'week' && !sameDay(startOfWeek(new Date()), a)) head[0] = 'Week of';
    const cals = this._config.calendars ?? [];
    return html`
      <section class="glass planner" aria-label="Family planner">
        <div class="bar">
          <div style="display:flex;flex-direction:column;line-height:1.15;min-width:190px">
            <h1 class="t-title">${head[0]}</h1>
            <span class="muted" style="font-size:var(--fs-2);font-weight:var(--w-semi, 600)">${head[1]}</span>
          </div>
          <button class="round tap" aria-label="Previous" @click=${() => this._shift(-1)}>${icon('left', 20)}</button>
          <button class="round tap" aria-label="Next" @click=${() => this._shift(1)}>${icon('right', 20)}</button>
          <button class="pill tap" @click=${() => { this._anchor = new Date(); }}>Today</button>
          ${cals.length ? html`<button class="tap lead" data-act="add" @click=${() => { this._editEv = null; this._sheet = 'add'; }}>${icon('plus', 22)}Add</button>` : nothing}
          <span style="flex:1"></span>
          <div class="seg" role="group" aria-label="View">
            ${(['day', 'week', 'month'] as View[]).map((x) => html`<button class="tap" aria-pressed=${String(v === x)} @click=${() => { this._view = x; }}>${x[0].toUpperCase() + x.slice(1)}</button>`)}
          </div>
        </div>
        ${cals.length ? html`<div class="legend">${cals.map((c) => { const n = c.name ?? this.hass?.states[c.entity]?.attributes.friendly_name ?? c.entity; return html`<span style="display:flex;align-items:center;gap:6px">${this._chip(n, c.colour)}${n}</span>`; })}${this._calNote()}</div>` : nothing}
        ${!cals.length ? html`<div class="empty"><span style="color:var(--accent)">${icon('calendar', 40)}</span><h2 class="t-sub">Connect your calendars</h2><span>Add Google Calendar in Home Assistant, then list the calendars in this card's settings.</span></div>`
          // a load that failed is not an empty week: say so, and offer to try again
          : this._calError ? html`<div class="empty calfail" role="alert"><span class="pic">${icon('calendar', 44)}</span><h2 class="t-sub">Can’t reach the calendars.</h2>
            <button class="pill tap" style="height:52px;padding:0 24px;font-size:var(--fs-3)" @click=${() => { this._fetchedKey = ''; this._refresh(); void this._loadSoon(); }}>Try again</button></div>`
          : v === 'week' ? this._week(a) : v === 'day' ? this._day(a) : this._month()}
      </section>`;
  }

  /** The planner's quiet word on how fresh the calendars are, or the plain warning when one has stopped answering. No warning at night: nobody can act on it then. */
  private _calNote(): TemplateResult | typeof nothing {
    const cals = this._config.calendars ?? [];
    if (!cals.length || this._calError) return nothing;
    const h = calHealth(this.hass, cals, this._calSeen, this._calSince, Date.now(), this._config.health?.calendar_minutes ?? 30), warn = this._isNight() ? '' : calWarning(h);
    if (warn) return html`<span class="calnote" data-warn role="status">${icon('alert', 18)}<span>${warn}</span><button class="pill tap" data-act="cal-retry" @click=${() => { this._fetchedKey = ''; this._refresh(); void this._loadSoon(); }}>Try again</button></span>`;
    return h.age === null ? nothing : html`<span class="calnote" data-act="cal-age">Updated ${agoWords(h.age)}</span>`;
  }
  private _wifiAsk(): void {
    this._pinAsk = { reason: 'Show the Wi-Fi password?', sheet: 'sitter', run: () => { this._wifiUntil = Date.now() + 120_000; window.setTimeout(() => { if (this._wifiUntil && Date.now() >= this._wifiUntil) this._wifiUntil = 0; }, 120_200); } };
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

  private _evCard(e: CalEvent, d: Date): TemplateResult {
    const when = whenOn(e, d).label;
    if (this._private(e.title)) return html`<div class="ev priv" role="img" aria-label="Private reminder"><span class="t">${e.allDay ? '' : when}</span>${icon('lock', 16)}</div>`;
    return html`<button class="ev tap ${this._evState(e)}" style="--c:${slotVar(e.colour)}" aria-label=${this._evName(e, d)} @click=${() => this._openEvent(e, d)}>
      <span class="t">${when}</span>
      <span class="n content">${e.title.replace(/(\S)-(\S)/g, '$1\u2011$2')}</span>
      <span class="w">${e.who}</span>
      ${e.location ? html`<span class="loc">${icon('pin', 14)}<span class="ell">${e.location}</span></span>` : nothing}
    </button>`;
  }

  private _week(a: Date): TemplateResult {
    const today = new Date();
    const days = Array.from({ length: this._span }, (_, i) => addDays(a, i));
    // nobody has touched the panel for a minute: today takes more of the week and the other days step back, for a glance from across the room
    const rest = this._idle && days.some((d) => sameDay(d, today)) && !this._sheet;
    const cols = days.map((d) => (sameDay(d, today) ? (rest ? '2.3fr' : '1.4fr') : '1fr')).join(' ');
    const none = this._evKey === this._fetchedKey && !this._events.length;
    return html`<div class="weekwrap"><div class="week" ?data-rest=${rest} style="grid-template-columns:${cols}">
      ${days.map((d) => {
        const evs = this._eventsOn(d), isToday = sameDay(d, today);
        const pub = evs.filter((e) => !this._private(e.title)), priv = evs.filter((e) => this._private(e.title));
        const key = ymd(d), hidden = this._clip[key] ?? 0;
        return html`<div class="col ${isToday ? 'today' : ''}">
          <div class="dayhead"><span class="muted" style="font-size:var(--fs-2);font-weight:var(--w-bold, 700)">${fmtDow(d)}</span><span class="num">${d.getDate()}</span>${lookArt(this._lk, 'day', { now: d, arcs: this._arcs(pub) })}${priv.length ? html`<span class="pchip" role="img" aria-label="Private reminder" title="Private reminder">${icon('lock', 15)}</span>` : nothing}</div>
          <div class="evs" data-day=${key}>${pub.map((e) => this._evCard(e, d))}</div>
          ${hidden ? html`<button class="more tap" aria-label="${hidden} more on ${fmtLongDate(d)}" @click=${() => { this._anchor = d; this._view = 'day'; }}><span class="mpill">+${hidden} more</span></button>` : nothing}
        </div>`;
      })}
    </div>${none ? html`<div class="quiet"><span>${this._span < 7 ? 'Nothing planned' : 'Nothing planned this week'}</span></div>` : nothing}</div>`;
  }

  private _day(a: Date): TemplateResult {
    const evs = this._eventsOn(a), today = sameDay(a, new Date());
    const list = html`<div class="daylist scrolly" data-fits @scroll=${scrollCue}>
      ${evs.length ? evs.map((e) => this._private(e.title) ? html`<div class="dayrow"><span style="width:90px;font-size:var(--fs-3);font-weight:var(--w-semi, 600)" class="muted">${whenOn(e, a).label}</span><span class="muted" style="font-size:var(--fs-3);display:inline-flex;align-items:center;gap:8px">${icon('lock', 18)}Private</span></div>` : html`
        <button class="dayrow tap ${this._evState(e)}" style="--c:${slotVar(e.colour)}" aria-label=${this._evName(e, a)} @click=${() => this._openEvent(e, a)}>
          <span style="width:90px;font-size:var(--fs-3);font-weight:var(--w-bold, 700)" class="muted dwhen">${whenOn(e, a).label}</span>
          <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px"><span class="content" style="font-size:var(--fs-4);font-weight:var(--w-bold, 700)">${e.title}</span>
          <span class="muted evwho" style="font-size:var(--fs-2);font-weight:var(--w-semi, 600);display:flex;align-items:center;gap:6px">${this._chip(e.who, e.colour, true)}${e.who}</span>
          ${e.location ? html`<span class="muted loc">${icon('pin', 16)}<span class="ell">${e.location}</span></span>` : nothing}</span>
        </button>`) : this._evKey !== this._fetchedKey ? nothing : html`<div class="empty freeday"><span class="pic">${FREE_DAY}</span><h2 class="t-sub">Nothing on.</h2><span style="font-size:var(--fs-3)">A free day!</span></div>`}
    </div>`;
    // a look may picture the whole day (a clock, a strip…); the list then sits beside it
    const art = lookArt(this._lk, 'dayview', { arcs: this._arcs(evs), now: today ? this._now : undefined, size: 340 });
    return art === nothing ? list : html`<div class="dayview"><div class="dayart">${art}</div>${list}</div>`;
  }

  private _month(): TemplateResult {
    const s = startOfMonthGrid(this._anchor), m = this._anchor.getMonth(), today = new Date();
    return html`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px">
      <div class="mhead">${Array.from({ length: 7 }, (_, i) => html`<span>${fmtDow(addDays(s, i))}</span>`)}</div>
      <div class="month">
        ${Array.from({ length: 42 }, (_, i) => addDays(s, i)).map((d) => {
          const evs = this._eventsOn(d).filter((e) => !this._private(e.title)), isToday = sameDay(d, today);
          return html`<button class="cell tap ${d.getMonth() !== m ? 'out' : ''} ${isToday ? 'today' : ''}" style="text-align:left" aria-label="${fmtLongDate(d)}${isToday ? ', today' : ''}, ${evs.length ? `${evs.length} event${evs.length > 1 ? 's' : ''}` : 'nothing on'}" @click=${(e: Event) => { const line = (e.target as Element).closest?.('.mev[data-i]'), hit = line ? evs[Number(line.getAttribute('data-i'))] : undefined; if (hit) this._openEvent(hit, d); else { this._anchor = d; this._view = 'day'; } }}>
            <span class="mtop"><span>${d.getDate()}</span>${evs.length > this._mLines ? html`<span class="mmore">+${evs.length - this._mLines}</span>` : nothing}</span>
            ${evs.slice(0, this._mLines).map((e, k) => html`<span class="mev ${k < this._mLines - Math.min(evs.length, this._mLines) ? 'two' : ''}" data-i=${k} title=${this._evName(e, d)}>${this._chip(e.who, e.colour, true)}<span class="ell">${e.title}</span></span>`)}
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
    const timerOk = !!this.hass?.states['timer.kitchen'], cut = Math.max(0, this._reminders.length - this._remShow);
    return html`<aside>
      ${m ? html`<section class="glass card np ${playing ? 'playing' : ''}" aria-label=${`${playing ? 'Now playing' : 'Music'}, ${m.attributes.friendly_name ?? ''}`}>
        <div class="np-main" style="display:flex;align-items:center;gap:10px">
          <div class="art" style=${m.attributes.entity_picture ? `--pic:url(${m.attributes.entity_picture})` : ''}></div>
          <div class="np-row" style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1">
            <span style="font-size:var(--fs-2);font-weight:var(--w-bold, 700);line-height:1.2;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere">${m.attributes.media_title ?? (m.state === 'off' ? 'Off' : 'Nothing playing')}</span>
            <span class="muted" style="font-size:var(--fs-1);line-height:1.25;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;overflow:hidden;overflow-wrap:anywhere">${[m.attributes.media_artist, m.attributes.friendly_name].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
        <div class="ctl">
          <button class="tap" aria-label="Previous track" @click=${() => this._media('media_previous_track')}>${solid('prev')}</button>
          <button class="tap round" style="width:48px;height:48px" aria-label=${playing ? 'Pause' : 'Play'} @click=${() => this._media('media_play_pause')}>${solid(playing ? 'pause' : 'play', 20)}</button>
          <button class="tap" aria-label="Next track" @click=${() => this._media('media_next_track')}>${solid('next')}</button>
        </div>
      </section>` : nothing}

      <section class="glass card tmr" aria-label="Kitchen timer">
        ${!timerOk ? html`<span class="label">Kitchen timer</span><span class="muted" style="font-size:var(--fs-2);font-weight:var(--w-semi, 600)">Kitchen timer is not set up</span>` : html`
        <span class="label">Kitchen timer</span>
        <div class="timerrow ${left !== null ? 'on' : ''}" ?data-bump=${!!this._bump}>${lookArt(this._lk, 'timer', { frac: this._timerFrac(left) })}<button class="tap display tread" data-act="timer" aria-label=${left !== null ? `Kitchen timer, ${mm} minutes ${ss} seconds left. Open the timer` : 'Kitchen timer, not running. Open the timer'} @click=${() => { this._sheet = 'timer'; }}>${this._roll(left !== null ? `${mm}:${String(ss).padStart(2, '0')}` : '0:00')}</button>
          ${left !== null ? html`<button class="tap tcancel" aria-label="Cancel the kitchen timer" @click=${() => { void this._cancelTimer(); }}>Cancel</button>` : nothing}</div>
        <div class="grid3">${[1, 5, 10].map((n) => html`<button class="tap quick" aria-label=${`Add ${n} minute${n > 1 ? 's' : ''}`} @click=${() => this._addTimer(n)}>+${n} min</button>`)}</div>
        ${left === null ? html`<span class="muted hint" style="font-size:var(--fs-1);white-space:nowrap">Tap +1, +5 or +10 to start</span>` : nothing}`}
      </section>

      ${this.hass?.states['input_number.family_jar'] ? html`<section class="glass card jar" aria-label=${`Family jar: ${jar >= target ? 'full' : `${jar} of ${target}`}`}><span class="jarpic" style="line-height:0;color:var(--accent)">${icon('jar', 24)}</span>
          <span style="flex:1;display:flex;flex-direction:column;gap:4px;min-width:0"><span style="font-size:var(--fs-2);font-weight:var(--w-bold, 700)">Family jar · ${jar >= target ? 'full! 🎉' : `${jar}/${target}`}</span>
          <div class="xpbar meter"><div style="width:${Math.min(100, (jar / target) * 100)}%"></div></div></span></section>` : nothing}

      <section class="glass card rems" aria-label="Reminders">
        <span class="label">Reminders</span>
        ${this._remState !== 'ok' ? html`<span class="muted remfail" role="alert" style="font-size:var(--fs-2);font-weight:var(--w-semi, 600);line-height:1.3">${this._remState === 'missing' ? 'The reminders list is not in Home Assistant. Check the card settings.' : 'Can’t load the reminders.'}</span>
          ${this._remState === 'failed' ? html`<button class="pill tap" style="align-self:flex-start" @click=${() => { void this._loadReminders(); }}>Try again</button>` : nothing}`
          : html`<div class="remlist">${this._remList(cut)}</div>`}
      </section>
    </aside>`;
  }
  private _remList(cut: number): TemplateResult {
    const c = this._config;
    return html`${this._reminders.length ? this._reminders.slice(0, this._remShow).map((r) => { const done = r.uid in this._remTk; return html`<button class="rem tap ${done ? 'done' : ''}" ?data-just=${this._remJust === r.uid} aria-pressed=${String(done)} @click=${() => this._tickReminder(r)}><span class="ring check">${done ? html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : nothing}</span><span class="content"><span class="strike">${r.summary}</span></span></button>`; })
          : html`<span class="muted" style="font-size:var(--fs-2);line-height:1.3">${c.reminders ? 'Nothing to remember' : 'Pick a to-do list for reminders in the card settings.'}</span>`}
      ${cut ? html`<span class="remmore">+${cut} more</span>` : nothing}`;
  }

  /** What the dock's drawings show of this house, now: only things the card already knows. */
  private _artData(playing: boolean): ArtData {
    const c = this._config, st = this.hass?.states ?? {}, now = this._now, mins = now.getHours() * 60 + now.getMinutes();
    const w = c.weather ? st[c.weather] : undefined, mpS = c.music_player ? st[c.music_player] : undefined;
    const sunUp = st['sun.sun'] ? st['sun.sun'].state === 'above_horizon' : now.getHours() >= 6 && now.getHours() < 19;
    const pic = playing ? (mpS?.attributes.entity_picture as string | undefined) : undefined;
    const g = c.groceries ? Number(st[c.groceries]?.state) : NaN;
    const m0 = hm(c.morning?.start ?? '06:30'), m1 = hm(c.morning?.end ?? '08:45');
    return { day: now.getDate(), dow: now.toLocaleDateString('en-AU', { weekday: 'short' }), cond: w?.state, dark: !sunUp, playing,
      cover: pic ? (/^(https?:|data:)/.test(pic) ? pic : this.hass?.hassUrl ? this.hass.hassUrl(pic) : pic) : undefined,
      count: Number.isFinite(g) ? g : undefined, lit: Object.values(st).filter((s) => s.entity_id.startsWith('light.') && s.state === 'on').length,
      frac: (mins - m0) / Math.max(1, m1 - m0), moon: moonAge(now), south: (this.hass?.config?.latitude ?? -32) < 0 };
  }
  private _dock(): TemplateResult {
    const mp = this._config.music_player, playing = !!mp && this.hass?.states[mp]?.state === 'playing';
    const live = this._artData(playing);
    const item = (ic: string, label: string, on: () => void, current = false) =>
      html`<button class="item tap" data-nav=${ic} aria-current=${current ? 'page' : 'false'} ?data-playing=${ic === 'music' && playing} @click=${() => { sfx('nav'); on(); }}>${art(ic, 26, live)}<span class="lb" data-t=${label}>${label}</span></button>`;
    const kids = this._config.kids ?? [];
    // on a child's page the dock is his face and the way home: nothing else to look at or press
    if (this._page === 'kid' && kids[this._kid]) { const k = kids[this._kid], e = kidEntities(k), raw = this.hass?.states[e.avatar]?.state, look = raw || k.look ? decodeLook(raw, k.look ? decodeLook(k.look) : {}) : null;
      return html`<nav class="glass dock" data-kid aria-label="Main" @click=${this._btnJust}>
        <button class="item kidbtn tap" style="--kidc:${slotVar(k.colour)}" aria-current="page"><span class="avatar" style="width:44px;height:44px;background:${slotVar(k.colour)}">${look ? renderAvatar(look, { size: 44, crop: 'head', still: true, label: k.name, age: k.age, ring: slotVar(k.colour) }) : k.name[0]}</span><span class="lb kn" data-t=${k.name}>${k.name}</span></button>
        <span class="sep" aria-hidden="true"></span>
        ${item('home', 'Home', () => { this._page = this._morningWindow() ? 'morning' : 'planner'; }, false)}
      </nav>`; }
    return html`<nav class="glass dock" aria-label="Main" @click=${this._btnJust} @scroll=${(e: Event) => { const d = e.currentTarget as HTMLElement; d.toggleAttribute('data-more', d.scrollWidth - d.scrollLeft - d.clientWidth > 6); }}>
      ${kids.map((k, i) => {
        const e = kidEntities(k), raw = this.hass?.states[e.avatar]?.state;
        const look = raw || k.look ? decodeLook(raw, k.look ? decodeLook(k.look) : {}) : null;
        const on = this._page === 'kid' && this._kid === i;
        return html`<button class="item kidbtn tap" style="--kidc:${slotVar(k.colour)}" aria-current=${on ? 'page' : 'false'} @click=${() => { sfx('nav'); this._kid = i; this._page = 'kid'; }}>
          <span class="avatar" style="width:44px;height:44px;background:${slotVar(k.colour)}">${look ? renderAvatar(look, { size: 44, crop: 'head', still: true, label: k.name, age: k.age, ring: slotVar(k.colour) }) : k.name[0]}</span><span class="lb kn" data-t=${k.name}>${k.name}</span></button>`;
      })}
      ${kids.length ? html`<span class="sep" aria-hidden="true"></span>` : nothing}
      ${this._morningWindow() ? item('sun', 'Morning', () => { this._page = 'morning'; }, this._page === 'morning') : nothing}
      ${item('calendar', 'Planner', () => { this._page = 'planner'; }, this._page === 'planner')}
      ${item('cart', 'Groceries', () => { this._page = 'groceries'; }, this._page === 'groceries')}
      ${item('pencil', 'Doodle', () => { this._page = 'doodle'; }, this._page === 'doodle')}
      ${item('music', 'Music', () => { this._page = 'music'; }, this._page === 'music')}
      ${this._config.weather && this._config.weather_page !== false ? item('cloud', 'Weather', () => { this._page = 'weather'; }, this._page === 'weather') : nothing}
      ${item('home', 'Home', () => { this._page = 'home'; }, this._page === 'home')}
      <span class="sep wide" aria-hidden="true"></span>
      <button class="item tap" data-nav="lights-on" @click=${() => this._allOn()}>${art('bulb', 26, live)}All on</button>
      <button class="item tap" data-nav="lights-off" @click=${() => this._allOff()}>${art('bulbOff', 26, live)}All off</button>
      ${this._config.announce_script ? html`<button class="item tap ${Date.now() < this._dinnerCooldown ? 'called' : ''}" data-nav="dinner" @click=${() => this._dinnerStart()}>${art('megaphone', 26)}${Date.now() < this._dinnerCooldown ? 'Called ✓' : 'Dinner'}</button>` : nothing}
    </nav>`;
  }

  private _dinnerView(): TemplateResult {
    const n = Math.max(1, Math.ceil(((this._dinner?.at ?? 0) - Date.now()) / 1000));
    return html`<div class="scrim"><section class="glass sheet" data-w="s" style="width:min(520px,100%);align-items:center;text-align:center" role="alertdialog" aria-modal="true" aria-label="Calling dinner">
      <span style="color:var(--accent);line-height:0">${icon('megaphone', 56)}</span><h2 class="t-head">Calling everyone in ${n}…</h2>
      <span class="muted">${isQuiet(this._now, '19:30', '07:00') ? 'Quiet hours: kitchen and lounge only' : 'Lounge, kitchen and bedrooms'}</span>
      <button class="pill tap" style="height:60px;padding:0 28px;font-size:var(--fs-3)" @click=${() => this._dinnerCancel()}>Cancel</button></section></div>`;
  }

  private _offView(): TemplateResult {
    const n = Math.max(1, Math.ceil(((this._off?.at ?? 0) - Date.now()) / 1000));
    return html`<div class="scrim"><section class="glass sheet" data-w="s" data-offwait style="width:min(520px,100%);align-items:center;text-align:center" role="alertdialog" aria-modal="true" aria-label="Turning the lights off">
      <span style="color:var(--accent);line-height:0">${icon('bulbOff', 56)}</span><h2 class="t-head">Lights off in ${n}…</h2>
      <span class="muted">Every light in the house${(this._config.keep_on ?? []).length ? ', except the ones kept on' : ''}</span>
      <button class="pill tap" style="height:60px;padding:0 28px;font-size:var(--fs-3)" @click=${() => this._offCancel()}>Cancel</button></section></div>`;
  }

  private _alarmView(): TemplateResult {
    return html`<button class="alarm" @click=${() => { this._alarm = 0; void this._call('input_text', 'set_value', { entity_id: 'input_text.fh_panel_message', value: '' }); }}>
      <span style="line-height:0">${icon('timer', 96)}</span><span class="display" style="font-size:var(--fs-d3);font-weight:var(--w-heavy, 800);text-align:center;padding:0 40px">${panelMsg(this.hass)?.t || 'Timer’s done!'}</span><span style="font-size:var(--fs-4);font-weight:var(--w-semi, 600)">Tap to stop</span></button>`;
  }

  /** Settings is for grown-ups: the PIN is asked every time, except within a minute of the last time it was given for Settings. With no PIN yet, Settings opens on its first step: setting one. */
  private _openSettings(): void {
    const open = (): void => { this._sheet = 'settings'; };
    if (this._config.parent_pin && !pinFresh()) this._pinAsk = { reason: 'Open Settings?', sheet: 'sitter', run: open }; else open();
  }
  private _sheetView(s: Sheet, out: boolean): TemplateResult | typeof nothing {
    if (!s) return nothing;
    const close = () => { this._sheet = ''; };
    if (s === 'settings') return html`<fh-settings .hass=${this.hass} .config=${this._config} ?data-closing=${out} @close=${close} @fh-config=${(e: CustomEvent<FamilyHubConfig>) => this.setConfig(e.detail)}></fh-settings>`;
    if (s === 'add') return html`<fh-add-event .hass=${this.hass} .calendars=${this._config.calendars ?? []} .defaultCal=${this._config.add_calendar ?? ''} .edit=${this._editEv} .scope=${this._editEv ? this._editScope : ''} .places=${this._config.address_search !== false}
      ?data-closing=${out} @click=${close} @close=${close} @saved=${(e: CustomEvent<string>) => { const was = this._editEv; if (this._sheet === 'add') close(); this._say(was ? (e.detail.startsWith('!') ? `The new one was added, but the old “${was.title}” could not be removed. Please delete it by hand.` : `Changed: ${e.detail}`) : `Added: ${e.detail}`, was && e.detail.startsWith('!') ? 10000 : undefined); this._fetchedKey = ''; this._refresh(); void this._loadSoon(); }}
      @failed=${(e: CustomEvent<string>) => this._say(`${e.detail} was not ${this._editEv ? 'changed' : 'added'}: Home Assistant did not answer`, 8000)}></fh-add-event>`;
    if (s === 'chat') { const ch = this._config.chat, hv = this._config.voice, name = ch?.name || 'Ask', kids = this._config.kids ?? [];
      if (!ch?.agent) return nothing;
      const who = this._asker, kid = who ? kids.find((k) => k.name === who) : undefined, rule = kid ? askFor(kid) : undefined, pics = rule?.mode === 'pictures';
      // set by child and opened from a shared page: first, who is asking? Each child then gets his own kind of Ask and his own time; a grown-up goes through the PIN
      const pick = who === null ? html`<div class="askwho" role="group" aria-label="Who is asking?">
          ${kids.filter((k) => askFor(k).mode !== 'off').map((k) => { const e = kidEntities(k), raw = this.hass?.states[e.avatar]?.state, look = raw || k.look ? decodeLook(raw, k.look ? decodeLook(k.look) : {}) : null;
            return html`<button class="whobtn tap" data-who=${e.slug} style="--kidc:${slotVar(k.colour)}" @click=${() => { sfx('tap'); this._asker = k.name; }}>
              <span class="avatar" style="width:104px;height:104px;background:${slotVar(k.colour)};font-size:var(--fs-d1)">${look ? renderAvatar(look, { size: 104, crop: 'head', still: true, label: k.name, age: k.age, ring: slotVar(k.colour) }) : k.name[0]}</span><span class="wn">${k.name}</span></button>`; })}
          <button class="whobtn tap" data-who="grown-up" @click=${() => { const run = (): void => { this._asker = ''; }; sfx('tap'); if (this._config.parent_pin) this._pinAsk = { reason: 'Ask as a grown-up?', run, sheet: 'chat' }; else run(); }}>
            <span class="avatar" style="width:104px;height:104px;background:var(--chip-strong);color:var(--ink)">${icon('lock', 40)}</span><span class="wn">A grown-up</span></button>
        </div>` : nothing;
      return html`<div class="scrim" ?data-closing=${out} @click=${(e: Event) => { if (e.target === e.currentTarget) close(); }}>
        <section class="glass sheet chatsheet" tabindex="-1" role="dialog" aria-modal="true" aria-label=${name} ?data-who=${who === null}>${this._sheetHead(name, who === null ? 'Who is asking?' : pics ? 'Tap a picture.' : 'Ask a question, or tap a picture.')}
          <p class="ainote">${AI_NOTE}</p>
          ${who === null ? pick : keyed(who, html`<fh-chat .hass=${this.hass} ?low=${pics || (this._page === 'kid' && this._kidOn?.mode === 'picture')} .agent=${ch.agent} .pipeline=${ch.pipeline ?? ''} .tts=${ch.tts ?? hv?.tts ?? ''} .ttsVoice=${ch.tts ? ch.tts_voice ?? '' : hv?.voice ?? ''} .ttsLanguage=${ch.tts ? ch.tts_language ?? '' : hv?.language ?? ''} .helper=${name} .pin=${!!this._config.parent_pin}
            .mode=${pics ? 'pictures' : 'full'} .who=${kid ? kidEntities(kid).slug : ''} .minutes=${rule?.minutes ?? 0} @close=${close} @pin=${(e: CustomEvent<{ reason: string; run: () => void }>) => { this._pinAsk = { ...e.detail, sheet: 'chat' }; }}></fh-chat>`)}</section></div>`; }
    const body = s === 'more' ? this._moreBody() : s === 'event' ? this._eventBody() : s === 'themes' ? this._themeBody() : s === 'kidprefs' ? this._kidPrefsBody() : s === 'meds' ? this._medsBody() : s === 'timer' ? this._timerBody() : this._sitterBody();
    return html`<div class="scrim" ?data-closing=${out} @click=${(e: Event) => { if (e.target === e.currentTarget) close(); }}>
      <section class="glass sheet scrolly" tabindex="-1" role="dialog" aria-modal="true" aria-label=${{ more: 'More', themes: 'Pick a look', kidprefs: 'Settings', meds: 'Medication', timer: 'Kitchen timer', sitter: 'House info', event: this._evOpen ? `${this._evOpen.ev.title}, details` : 'Event' }[s] ?? 'Panel'}
        data-sheet=${s} data-w=${s === 'themes' || s === 'sitter' ? 'l' : s === 'timer' || s === 'event' || s === 'more' ? 's' : 'm'} @scroll=${scrollCue}>${body}</section></div>`;
  }
  /** "More": what left the header to keep it calm. Looks, medicine, house info and night as big named buttons, and who is home. */
  private _moreBody(): TemplateResult {
    const c = this._config, h = this.hass, tracked = (c.people ?? []).filter((p) => p.entity);
    const go = (act: string, ic: string, label: string, sub: string, run: () => void): TemplateResult =>
      html`<button class="morebtn tap" data-act=${act} @click=${run}>${art(ic, 36, { moon: moonAge(this._now), south: (this.hass?.config?.latitude ?? -32) < 0 })}<span><b>${label}</b><span class="muted">${sub}</span></span></button>`;
    return html`${this._sheetHead('More', '', '')}
      <div class="moregrid">
        ${go('looks', 'palette', 'Looks', 'Change how the panel looks', () => { this._sheet = ''; this._openLooks(); })}
        ${c.meds?.length || c.med_log ? go('meds', 'pill', 'Medicine', 'Given today, and the record', () => { this._sheet = 'meds'; void this._loadMedLog(); }) : nothing}
        ${go('info', 'info', 'House info', 'For babysitters and visitors', () => { this._sheet = 'sitter'; })}
        ${go('night', 'moon', 'Night', 'Dim the screen now', () => { this._sheet = ''; this._nightManual = true; this._art.enter(this._eventsOn(this._now, this._soon).map((e) => e.title)); })}
      </div>
      ${tracked.length ? html`<button class="glass presence tap" style="align-self:flex-start" aria-label=${`Who is home. ${this._whoHome()}`} @click=${() => this._say(this._whoHome())}>
        <span class="phome" aria-hidden="true">${icon('home', 18)}</span>${tracked.map((p) => this._face(p, h?.states[p.entity!]?.state === 'home'))}<span class="muted" style="font-size:var(--fs-2);font-weight:var(--w-semi, 600)">${this._whoHome()}</span></button>` : nothing}`;
  }
  private _sheetHead(title: string, sub = '', ic = '', extra: TemplateResult | typeof nothing = nothing): TemplateResult {
    return html`<div class="shead">
      <div style="flex:1;min-width:0"><h2 class="t-head">${ic ? html`<span style="color:var(--accent);line-height:0">${icon(ic, 26)}</span>` : nothing}${title}</h2>${sub ? html`<span class="muted">${sub}</span>` : nothing}</div>
      ${extra}
      <button class="round tap xbtn" aria-label="Close" @click=${() => { this._sheet = ''; }}>${icon('close', 20)}</button></div>`;
  }
  private _themeBody(): TemplateResult {
    return html`${this._sheetHead('Pick a look', 'Changes the whole panel.', 'palette')}
      <div class="themes looks">
        ${LOOKS.map((l) => html`<button class="tcard tap" aria-pressed=${String(l.id === this._look)} @click=${() => this._setLook(l.id)}>
          ${lookPreview(l, 96, themeStyle(themeById(this._theme)))}
          <span style="font-size:var(--fs-3);font-weight:var(--w-bold, 700)">${l.name}</span><span class="muted" style="font-size:var(--fs-1)">${l.tagline}</span>
        </button>`)}
      </div>
      ${(lookById(this._look).options ?? []).map((o) => this._optRow(o, !!this._opts[o.id], () => this._toggleOpt(o.id)))}
      <div class="setrow"><span class="setlabel"><b>Sounds</b><span class="muted">Taps, ticks and keys from this screen. Timers always sound.</span></span>
        <div class="seg" role="group" aria-label="Sounds" data-set="sounds">${([['off', 'Off'], ['quiet', 'Soft'], ['on', 'On']] as const).map(([v, l]) => html`<button class="tap" aria-pressed=${String(this._snd === v)} @click=${() => this._setSounds(v)}>${l}</button>`)}</div></div>
      ${!lookById(this._look).themed ? nothing : html`<span class="label">Background</span>
      <div class="themes">
        ${THEMES.map((t) => html`<button class="tcard tap" aria-pressed=${String(t.id === this._theme)} @click=${() => this._setTheme(t.id)}>
          <span class="tprev" style=${themeStyle(t)}>${[1, 2, 3, 4, 5].map((n) => html`<span style="background:var(--p-${n})"></span>`)}</span>
          <span style="font-size:var(--fs-3);font-weight:var(--w-bold, 700)">${t.name}</span><span class="muted" style="font-size:var(--fs-1)">${t.tagline}</span>
        </button>`)}
      </div>`}
      <div style="display:flex;justify-content:space-between;align-items:center">
        ${!lookById(this._look).themed ? html`<span></span>` : html`<button class="pill tap" style="height:52px;padding:0 22px;font-size:var(--fs-3)" @click=${() => { const o = THEMES.filter((t) => t.id !== this._theme); this._setTheme(o[Math.floor(Math.random() * o.length)].id); }}>${icon('shuffle', 20)}Surprise me</button>`}
        <span class="muted" style="font-size:var(--fs-1)">Family Hub v${VERSION}</span>
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
      <div class="themes kidlooks">
        ${looks.map(([id, name, tag]) => html`<button class="tcard tap" aria-pressed=${String(p.look === id)} @click=${() => this._setKidPref({ look: id })}>
          ${id === 'panel' ? html`<span class="tprev" style="height:84px;background:var(--chip);align-items:center;justify-content:center">${icon('home', 30)}</span>` : lookPreview(lookById(id), 84, themeStyle(themeById(this._theme)))}
          <span style="font-size:var(--fs-3);font-weight:var(--w-bold, 700)">${name}</span><span class="muted" style="font-size:var(--fs-1)">${tag}</span></button>`)}
      </div>
      ${hand ? this._optRow(hand, p.font === 'hand', () => this._setKidPref({ font: p.font === 'hand' ? 'print' : 'hand' })) : nothing}
      ${this._switchRow('One job at a time', 'Shows Now and Next, with “Show all” one tap away. Off shows the whole list.', p.focus, () => this._setKidPref({ focus: !p.focus }))}
      ${this._switchRow('Calm mode', 'No looping motion or tilted cards.', p.calm, () => this._setKidPref({ calm: !p.calm }))}
      <div class="setrow"><span class="setlabel"><b>Days off</b><span class="muted">A sick day or a holiday never counts against ${k.name}’s week.</span></span>
        <button class="pill tap" data-act="days-off" @click=${() => { this._sheet = ''; (this.renderRoot.querySelector('fh-kid') as (HTMLElement & { openDays?: () => void }) | null)?.openDays?.(); }}>Mark days off</button></div>
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
    const local = !(c.med_log && this.hass?.states[c.med_log]);
    // "Later" puts the reminder chip at the top of the screen away for half an hour (a grown-up's call, like recording a dose)
    const due = (c.meds ?? []).some((d) => { const s = this._medStatus(d.id, d.time); return s.due && !s.missing; }), away = Date.now() < this._medLater;
    const later = !due ? nothing : away ? html`<button class="pill tap ghost" data-act="med-back" style="height:48px;padding:0 16px;font-size:var(--fs-2);flex-shrink:0" aria-label=${`The reminder is put away until ${fmtTime(new Date(this._medLater))}. Show it now`} @click=${() => this._medSnooze(0)}><span><span class="lt30">Back at ${fmtTime(new Date(this._medLater))} · </span>show now</span></button>`
      : html`<button class="pill tap ghost" data-act="med-later" style="height:48px;padding:0 16px;font-size:var(--fs-2);flex-shrink:0" aria-label="Remind us later: put the reminder away for 30 minutes" @click=${() => this._medGuard('Remind us about the medicine later?', () => this._medSnooze(30))}><span>Later<span class="lt30">&nbsp;(30 min)</span></span></button>`;
    return html`${this._sheetHead('Medication', 'Kept off the kids’ pages and the night screen.', 'pill', later)}
      <div class="med2">
        <div class="icol">
          <span class="label">Every day</span>
          ${(c.meds ?? []).map((d) => {
            const s = this._medStatus(d.id, d.time);
            return html`<div class="card" style="background:var(--chip);border-radius:18px;gap:8px">
              <div style="display:flex;align-items:center;gap:10px"><span style="line-height:0;color:var(--ink2)">${icon('pill', 24)}</span>
                <span style="flex:1;display:flex;flex-direction:column;min-width:0"><b style="font-size:var(--fs-3)">${d.who ? `${d.who} – ` : ''}${d.label}</b><span class="muted">Due ${t12(d.time)}</span></span>
                ${this._medBusy === d.id ? html`<b style="font-size:var(--fs-2);color:var(--ink2)" role="status" data-saving>Saving… · ${this._medBy}</b>`
                : html`<b style="font-size:var(--fs-2);color:${s.given ? 'var(--ok)' : s.late ? 'var(--danger, #dc2626)' : 'var(--ink2)'}">${s.given ? `✓ ${fmtTime(s.given)}${s.by ? ` · ${s.by}` : ''}` : s.missing ? 'Not set up' : s.late ? 'Overdue' : 'Not yet'}</b>`}</div>
              ${s.missing ? html`<span class="muted" role="note">Not set up yet, so it cannot be recorded here. A grown-up can finish setting it up in Settings, under Medicines.</span>`
                : s.given && this._medBusy !== d.id ? nothing : html`<div style="display:flex;gap:8px;flex-wrap:wrap">${parents.map((p) => html`<button class="pill tap ${s.late ? 'primary' : 'ghost'}" data-act="given" style="height:52px;padding:0 18px;font-size:var(--fs-2)" ?disabled=${this._medBusy === d.id} @click=${() => this._medGuard('Record this medicine?', () => { void this._giveMed(d.id, p); })}>Given by ${p}</button>`)}</div>`}
            </div>`;
          })}
          <span class="label">${local ? 'Kept on this screen only' : 'Given in the last two days'}</span>
          ${recent.length ? recent.map((r) => html`<div class="irow" data-at=${r.at.toISOString()}><span style="min-width:0"><b>${r.who}</b> · ${r.what}<br><small class="muted">${r.at.toLocaleDateString('en-AU', { weekday: 'short' })} ${fmtTime(r.at)}${r.by ? ` · ${r.by}` : ''} · ${since(r.at)}</small></span>
            <button class="tap" style="width:44px;height:44px;border-radius:50%;flex-shrink:0" aria-label=${`Remove ${r.what} for ${r.who} from the record`} @click=${() => this._medGuard('Remove this from the record?', () => { void this._unlogMed(r); })}>${icon('close', 16)}</button></div>`)
            : html`<span class="iline muted">Nothing else has been given.</span>`}
        </div>
        <div class="icol">
          <span class="label">Something else given</span>
          <div class="mrow">${extras.map((x) => pick(m.what === x, x, () => set({ what: x })))}${pick(m.what === 'other', 'Other…', () => set({ what: 'other' }))}</div>
          ${m.what === 'other' ? html`<input class="field" style="height:48px;font-size:var(--fs-3)" inputmode="none" aria-label="Which medicine" placeholder="Which medicine?" .value=${m.other} @input=${(e: Event) => set({ other: (e.target as HTMLInputElement).value })}>
            ${keyboard((k) => { const [t, caps] = typeKey(m.other, k, m.caps); set({ other: t, caps }); }, m.caps, () => set({ caps: !m.caps }), true)}` : nothing}
          <span class="label">For</span>
          <div class="mrow">${kids.map((k) => pick(m.who === k, k, () => set({ who: k })))}</div>
          <span class="label">When</span>
          <div class="mrow" style="align-items:center">
            <button class="tap mchip" aria-label="Five minutes earlier" @click=${() => set({ ago: Math.min(24 * 60, m.ago + 5) })}>− 5 min</button>
            <b class="display" style="font-size:var(--fs-5);min-width:104px;text-align:center;font-variant-numeric:tabular-nums" aria-live="polite">${m.ago ? fmtTime(at) : 'Now'}</b>
            <button class="tap mchip" aria-label="Five minutes later" ?disabled=${m.ago === 0} @click=${() => set({ ago: Math.max(0, m.ago - 5) })}>+ 5 min</button>
            ${m.ago ? html`<span class="muted" style="font-size:var(--fs-1);font-weight:var(--w-semi, 600)">${m.ago} min ago</span>` : nothing}
          </div>
          ${parents.length ? html`<span class="label">Given by</span><div class="mrow">${parents.map((p) => pick(m.by === p, p, () => set({ by: p })))}</div>` : nothing}
        </div>
      </div>
      <div class="sfoot">
        <span class="muted">A record only: it shows what was given and when. Follow the label or your doctor for doses and how long to wait.${local ? html` <span role="note" data-medlocal>“Something else given” is kept on this screen only. No other screen or phone will show it until a shared list is connected to the panel.</span>` : nothing}</span>
        <button class="tap ${(m.what === 'other' ? m.other.trim() : m.what) ? 'lead' : 'ghost'}" data-act="log" style="height:60px;padding:0 26px;font-size:var(--fs-3);border-radius:999px;font-weight:var(--w-bold, 700);display:inline-flex;align-items:center;flex-shrink:0" @click=${() => this._medGuard('Add to the medicine record?', () => { void this._logMed(); })}>Add to the record</button>
      </div>`;
  }
  private _timerBody(): TemplateResult {
    const on = this._timerLeft() !== null, left = this._timerLeft() ?? 0, mm = Math.floor(left / 60000), ss = Math.floor((left % 60000) / 1000);
    if (!this.hass?.states['timer.kitchen']) return html`${this._sheetHead('Kitchen timer', '', 'timer')}<span class="muted" style="font-size:var(--fs-3);font-weight:var(--w-semi, 600)">Kitchen timer is not set up</span>
      <span class="muted">Add a timer helper called <b>timer.kitchen</b> in Home Assistant and it will appear here.</span>`;
    return html`${this._sheetHead('Kitchen timer', on ? 'Beeps everywhere when it finishes.' : 'Tap +1, +5 or +10 to start', 'timer')}
      <div ?data-bump=${!!this._bump} style="display:flex;align-items:center;justify-content:center;gap:24px"><span style="line-height:0">${lookArt(this._lk, 'timer', { frac: this._timerFrac(this._timerLeft()), size: 130 })}</span>
      <span class="display" role="timer" aria-label=${`${mm} minutes ${ss} seconds left`} style="font-size:var(--fs-d5);line-height:1;font-weight:var(--w-bold, 700);text-align:center;font-variant-numeric:tabular-nums">${this._roll(`${mm}:${String(ss).padStart(2, '0')}`)}</span></div>
      <div class="grid3" style="gap:12px">${[1, 5, 10].map((n) => html`<button class="tap ${n === 5 ? 'lead' : 'quick'}" data-act="plus" style="height:60px;font-size:var(--fs-3);white-space:nowrap;${n === 5 ? '' : 'border-radius:999px;font-weight:var(--w-bold, 700)'}" aria-label=${`Add ${n} minute${n > 1 ? 's' : ''}`} @click=${() => this._addTimer(n)}>+${n} min</button>`)}</div>
      <button class="pill tap" style="height:52px;justify-content:center;font-size:var(--fs-3);background:transparent" aria-label="Cancel the kitchen timer" ?disabled=${!on} @click=${() => { void this._cancelTimer(); }}>Cancel</button>`;
  }
  /** In words, who is home and who is away. */
  /** Who is home, as a face: a child's own avatar, or the picture Home Assistant holds for the person. With no picture, the name (never a lone initial: that is a code). */
  private _face(p: PersonConfig, home: boolean): TemplateResult {
    const c = this._config, ki = (c.kids ?? []).findIndex((k) => k.name === p.name), k = ki >= 0 ? c.kids![ki] : undefined;
    const raw = k ? this.hass?.states[kidEntities(k).avatar]?.state : '', look = k && (raw || k.look) ? decodeLook(raw, k.look ? decodeLook(k.look) : {}) : null;
    const pic = String(this.hass?.states[p.entity!]?.attributes.entity_picture ?? '');
    if (look) return html`<span class="pface ${home ? '' : 'away'}" aria-hidden="true" style="--c:${slotVar(p.colour)}">${renderAvatar(look, { size: 36, crop: 'head', still: true, label: p.name, age: k!.age, ring: slotVar(p.colour) })}</span>`;
    if (pic) return html`<span class="pface ${home ? '' : 'away'}" aria-hidden="true" style="--c:${slotVar(p.colour)}"><img src=${pic} alt="" draggable="false" @error=${(e: Event) => { (e.target as HTMLElement).hidden = true; }}></span>`;
    return html`<span class="pname ${home ? '' : 'away'}" aria-hidden="true" style="--c:${slotVar(p.colour)}">${p.name.split(' ')[0]}${home ? '' : ' · out'}</span>`;
  }
  private _whoHome(): string {
    // only people Home Assistant tracks are spoken for: someone without a person entity is neither home nor away
    const ppl = (this._config.people ?? []).filter((p) => p.entity).map((p) => ({ name: p.name, st: this.hass?.states[p.entity!]?.state }));
    const here = ppl.filter((p) => p.st === 'home').map((p) => p.name), out = ppl.filter((p) => p.st === 'not_home').map((p) => p.name);
    const lost = ppl.filter((p) => !p.st || p.st === 'unavailable' || p.st === 'unknown').map((p) => p.name);
    // any other state is the name of a zone: "Sam is at School"
    const at = ppl.filter((p) => p.st && !['home', 'not_home', 'unavailable', 'unknown'].includes(p.st)).map((p) => `${p.name} is at ${p.st}`);
    const join = (n: string[]) => n.length > 1 ? `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}` : n[0];
    if (!ppl.length) return 'Nobody is being followed.';
    return [here.length ? `${join(here)} ${here.length > 1 ? 'are' : 'is'} home` : '', ...at, out.length ? `${join(out)} ${out.length > 1 ? 'are' : 'is'} away` : '', lost.length ? `${join(lost)}: not known` : ''].filter(Boolean).join(' · ') + '.';
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
    const bins = this._bins(now), tracked = (c.people ?? []).some((p) => p.entity);
    // the sections flow into columns that the browser keeps level (styles: .info2)
    const secs: TemplateResult[] = [];
    if (contacts.length) secs.push(html`${h3('Who to ring')}${contacts.map((p) => html`<a class="irow tap" href=${`tel:${p.phone.replace(/[^\d+]/g, '')}`} aria-label=${`Ring ${p.name} on ${p.phone}`}><b>${p.name}</b><span class="display" style="font-size:var(--fs-4);font-variant-numeric:tabular-nums">${p.phone}</span></a>`)}`);
    if (beds.length) secs.push(html`${h3('Bedtimes tonight')}${beds.map((k) => html`<div class="irow"><b>${k.name}</b><span>${t12(k.at)}</span></div>`)}`);
    if (tonight.length) secs.push(html`${h3('Still on today')}${tonight.map((x) => html`<div class="irow"><b class="ell">${x.title}</b><span style="white-space:nowrap">${whenOn(x, now).label}</span></div>`)}`);
    if (bins) secs.push(html`${h3('Bin night')}<div class="irow"><b>${sameDay(bins.night, now) ? 'Tonight' : `${bins.night.toLocaleDateString('en-AU', { weekday: 'long' })} night`}</b><span style="display:inline-flex;align-items:center;gap:6px">${this._binDots(bins.bins)}${bins.bins.join(' + ')}</span></div>`);
    if (b.wifi) secs.push(html`${h3('Wi-Fi')}<div class="irow"><span>Network</span><b>${b.wifi.name}</b></div>${b.wifi.password ? html`<div class="irow" data-act="wifi-pw" style="align-items:center"><span>Password</span>${!c.parent_pin || Date.now() < this._wifiUntil ? html`<b>${b.wifi.password}</b>` : html`<button class="pill tap" data-act="wifi-show" aria-label="Show the Wi-Fi password. Needs the grown-ups’ PIN" @click=${() => this._wifiAsk()}>${icon('lock', 16)}Show</button>`}</div>` : nothing}`);
    if (tracked) secs.push(html`${h3('Who is home')}<div class="iline">${this._whoHome()}</div>`);
    if (notes.length) secs.push(html`${h3('Good to know')}${notes.map((l) => html`<div class="iline">${l}</div>`)}`);
    const cog = html`<button class="round tap" style="width:52px;height:52px;flex-shrink:0" data-act="settings" aria-label="Settings, for grown-ups" @click=${() => this._openSettings()}>${icon('cog', 22)}</button>`;
    return html`${this._sheetHead(b.title ?? 'House info', 'For babysitters, grandparents and visitors', 'info', cog)}
      <div class="sos">
        <div class="sos000"><b>In an emergency call 000</b><span>Ambulance, fire or police. Poisons Information: 13 11 26.</span>
          ${b.address ? html`<span class="sosaddr">You are at <b>${b.address}</b></span>` : nothing}</div>
        ${e?.notify?.length ? html`<button class="sosbtn tap" data-s=${this._sos} aria-label=${`Hold to alert ${e.who ?? 'the parents'}`} aria-describedby="sosnote"
          @pointerdown=${() => this._sosDown()} @pointerup=${() => this._sosUp()} @pointerleave=${() => this._sosUp()} @pointercancel=${() => this._sosUp()}
          @keydown=${(ev: KeyboardEvent) => { if ((ev.key === 'Enter' || ev.key === ' ') && !ev.repeat) this._sosDown(); }} @keyup=${() => this._sosUp()} @contextmenu=${(ev: Event) => ev.preventDefault()}>
          <i aria-hidden="true"></i><span aria-hidden="true" style="line-height:0">${icon('alert', 30)}</span>
          <span><b>${this._sos === 'sending' ? 'Sending…' : this._sos === 'sent' ? 'Alert sent' : `Alert ${e.who ?? 'the parents'}`}</b><small>${this._sos === 'sent' ? 'Hold again to send another' : 'Press and hold'}</small></span></button>` : nothing}
      </div>
      <span id="sosnote" role="status" class="sosnote">${this._sosNote}</span>
      <div class="info2">${secs.map((x) => html`<div class="icol">${x}</div>`)}</div>`;
  }

}

if (!customElements.get('family-hub-card')) customElements.define('family-hub-card', FamilyHubCard);
const w = window as unknown as { customCards?: unknown[] };
w.customCards = w.customCards || [];
w.customCards.push({ type: 'family-hub-card', name: 'Family Hub', description: 'Glassy, themeable family planner for wall panels.', preview: false });
console.info(`%c FAMILY-HUB %c v${VERSION} `, 'background:#0b5fa5;color:#fff;border-radius:3px 0 0 3px;padding:2px 6px', 'background:#ffd166;color:#0b2236;border-radius:0 3px 3px 0;padding:2px 6px');
