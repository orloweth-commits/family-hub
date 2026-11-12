import { LitElement, html, svg, css, nothing, type TemplateResult, type PropertyValues } from 'lit';
import { styles } from './styles';
import { LookController, getLook } from './looks';
import type { Hass, HassEntity } from './types';
import { FitController, changed, sfx } from './util';
import './radar';

/** What the page reads besides the weather entity. Every part is optional and found by itself where it can be. */
export interface WeatherPageConfig {
  /** an hourly weather entity, when the daily one does not give hours itself */
  hourly?: string;
  /** prefix of the observation sensors, e.g. `mytown` for sensor.mytown_temp_feels_like (Bureau of Meteorology integration) */
  observations?: string;
  /** prefix of the forecast sensors, e.g. `mysuburb` for sensor.mysuburb_uv_max_index_0 */
  forecast?: string;
  /** the warnings sensor */
  warnings?: string;
  /** rain radar (RainViewer pictures over a map, loaded from the internet); false leaves it out */
  radar?: boolean;
  /** wind map (Windy, loaded from the internet); false leaves it out */
  wind?: boolean;
  /** radar zoom to start at: 4 (half the country) to 7 (the city and its surrounds); 6 unless set */
  zoom?: number;
}

interface Day { datetime: string; condition?: string; temperature?: number; templow?: number; precipitation?: number; precipitation_probability?: number; uv_index?: number }
interface Hour extends Day { wind_speed?: number; wind_bearing?: number | string; wind_gust_speed?: number; humidity?: number }

const COND: Record<string, string> = {
  'clear-night': 'Clear night', cloudy: 'Cloudy', exceptional: 'Wild weather', fog: 'Foggy', hail: 'Hail', lightning: 'Storms', 'lightning-rainy': 'Storms and rain',
  partlycloudy: 'Partly cloudy', pouring: 'Heavy rain', rainy: 'Rain', snowy: 'Snow', 'snowy-rainy': 'Sleet', sunny: 'Sunny', windy: 'Windy', 'windy-variant': 'Windy'
};
const POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const WORDS: Record<string, string> = { N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west' };
const deg = (b: unknown): number | undefined => typeof b === 'number' ? b : typeof b === 'string' && POINTS.includes(b.toUpperCase()) ? POINTS.indexOf(b.toUpperCase()) * 22.5 : undefined;
const point = (b: unknown): string => typeof b === 'string' ? b.toUpperCase() : typeof b === 'number' ? POINTS[Math.round(b / 22.5) % 16] : '';
const from = (b: unknown): string => { const p = point(b); return WORDS[p] ?? p; };
const num = (e: HassEntity | undefined): number | undefined => { const n = Number(e?.state); return e && e.state !== '' && Number.isFinite(n) ? n : undefined; };
const txt = (e: HassEntity | undefined): string | undefined => e && !['unknown', 'unavailable', ''].includes(e.state) ? e.state : undefined;
const clock = (iso: string | undefined): string => {
  const d = iso ? new Date(iso) : undefined;
  if (!d || Number.isNaN(d.getTime())) return '';
  const h = d.getHours(), m = d.getMinutes();
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
};
const hourLabel = (d: Date): string => { const h = d.getHours(); return h === 0 ? '12 am' : h === 12 ? '12 pm' : `${h % 12} ${h < 12 ? 'am' : 'pm'}`; };
/** cold is blue, mild is green-gold, hot is red: one scale for every temperature on the page */
const tcol = (t: number): string => `hsl(${Math.round(Math.max(5, Math.min(210, 210 - ((t - 5) / 30) * 205)))} 78% 54%)`;
const uvWord = (n: number): string => n >= 11 ? 'Extreme' : n >= 8 ? 'Very high' : n >= 6 ? 'High' : n >= 3 ? 'Moderate' : 'Low';

/* ---- the sky, drawn: one picture per kind of weather, on a 64 × 64 square ---- */
const CLOUD = 'M18 46a10 10 0 0 1 1.6-19.9A14 14 0 0 1 46.5 24 9.5 9.5 0 0 1 46 46z';
const sun = (x = 32, y = 32, r = 11) => svg`<g class="sun" style="transform-origin:${x}px ${y}px"><g class="rays">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => svg`<path d="M${x} ${y - r - 4}v-6" transform="rotate(${a} ${x} ${y})"></path>`)}</g><circle class="disc" cx=${x} cy=${y} r=${r}></circle></g>`;
const moon = (x = 32, y = 32, s = 1) => svg`<g transform="translate(${x - 32 * s} ${y - 32 * s}) scale(${s})"><path class="moon" d="M44 38.5A15 15 0 1 1 26.5 19a12 12 0 0 0 17.5 19.500z"></path><path class="star s1" d="M46 14l1.3 3.2 3.2 1.3-3.2 1.300L46 23l-1.3-3.2-3.2-1.3 3.2-1.300z"></path><path class="star s2" d="M52 30l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"></path></g>`;
const cloud = (cls = '', t = '') => svg`<path class="cloud ${cls}" d=${CLOUD} transform=${t}></path>`;
const drops = (n: number) => svg`<g class="drops">${Array.from({ length: n }, (_, i) => svg`<path class="drop" style="animation-delay:${-(i * 0.37) % 1.2}s" d="M${32 - (n - 1) * 5 + i * 10} 50l-2.5 7"></path>`)}</g>`;
const bolt = svg`<path class="bolt" d="M34 44l-7 10h6l-3 9 10-12h-6l4-7z"></path>`;
const glyph = (cond = ''): TemplateResult => {
  switch (cond) {
    case 'sunny': return sun();
    case 'clear-night': return moon();
    case 'partlycloudy': return svg`${sun(22, 22, 9)}${cloud('drift', 'translate(4 6)')}`;
    case 'cloudy': return svg`${cloud('back', 'translate(10 -8) scale(.8)')}${cloud('drift', 'translate(-2 4)')}`;
    case 'rainy': return svg`${cloud('', 'translate(0 -8)')}${drops(3)}`;
    case 'pouring': return svg`${cloud('dark', 'translate(0 -8)')}${drops(5)}`;
    case 'lightning': return svg`${cloud('dark', 'translate(0 -10)')}${bolt}`;
    case 'lightning-rainy': return svg`${cloud('dark', 'translate(0 -10)')}${bolt}${drops(2)}`;
    case 'hail': case 'snowy': case 'snowy-rainy': return svg`${cloud('', 'translate(0 -8)')}<g class="drops">${[20, 32, 44].map((x, i) => svg`<circle class="flake" style="animation-delay:${-i * 0.4}s" cx=${x} cy="52" r="2.2"></circle>`)}</g>`;
    case 'fog': return svg`${cloud('', 'translate(0 -12) scale(.95)')}<g class="gusts"><path d="M12 46h40M18 53h34M14 60h30"></path></g>`;
    case 'windy': case 'windy-variant': case 'exceptional': return svg`<g class="gusts"><path d="M8 24h30a6 6 0 1 0-6-6M8 34h42a6 6 0 1 1-6 6M8 44h22a5 5 0 1 1-5 5"></path></g>`;
    default: return cloud();
  }
};
const sky = (cond: string | undefined, size: number): TemplateResult => html`<svg class="sky" viewBox="0 0 64 64" width=${size} height=${size} role="img" aria-label=${COND[cond ?? ''] ?? cond ?? ''}>${glyph(cond)}</svg>`;

/** How each look and world talks about the weather. */
const TITLES: Record<string, [string, string, string, string]> = {
  glass: ['Right now', 'The next hours', 'The week ahead', 'From above'],
  fridge: ['Today', 'Later on', 'This week', 'Rain and wind'],
  orbit: ['Surface conditions', 'Next 24 hours', 'Seven-day outlook', 'Ground scan']
};
const MASCOT: Record<string, string> = { sea: '🐬', sunset: '⛵', reef: '🐠', bush: '🦘', space: '🚀', fridge: '🧲', orbit: '🛰️' };

/** Weather: what it is doing now, the next hours, the week, and the rain and wind seen from above. */
export class FhWeather extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, css`
    :host { display: grid; flex: 1; min-height: 0; gap: 16px; grid-template-columns: 330px minmax(0, 1fr) 300px; grid-template-rows: minmax(0, 1fr) auto; }
    section { border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; min-width: 0; min-height: 0; }
    h2 { font-size: 19px; font-weight: var(--w-heavy, 800); }
    .wnow { grid-area: 1 / 1 / 3 / 2; overflow: auto; }
    .wmaps { grid-area: 1 / 2; padding: 12px; }
    .wweek { grid-area: 1 / 3 / 3 / 4; }
    .whours { grid-area: 2 / 2; padding-bottom: 10px; }
    :host([data-shape='tall']) { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: auto auto minmax(300px, 1fr); }
    :host([data-shape='tall']) .wnow { grid-area: 1 / 1; }
    :host([data-shape='tall']) .wweek { grid-area: 1 / 2; }
    :host([data-shape='tall']) .whours { grid-area: 2 / 1 / 3 / 3; }
    :host([data-shape='tall']) .wmaps { grid-area: 3 / 1 / 4 / 3; }
    :host([data-phone]) { display: flex; flex-direction: column; flex: none; }
    :host([data-phone]) .wmaps { height: 420px; }
    :host([data-phone]) section { border-radius: 22px; }

    /* now */
    .top { display: flex; align-items: center; gap: 12px; }
    .wtemp { font-size: 68px; line-height: .95; font-weight: var(--w-heavy, 800); font-variant-numeric: tabular-nums; letter-spacing: -.03em; }
    .wtemp sup { font-size: .45em; vertical-align: top; position: relative; top: .1em; }
    .cond { font-size: 17px; font-weight: var(--w-bold, 700); }
    .wtip { display: flex; gap: 10px; align-items: flex-start; padding: 10px 12px; border-radius: 16px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); line-height: 1.3; }
    .wtip .m { font-size: 22px; line-height: 1; }
    .said { font-size: 14px; line-height: 1.4; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .facts { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .wfact { border-radius: 14px; background: var(--chip-soft); padding: 6px 10px; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
    .wfact.wide { grid-column: span 2; flex-direction: row; align-items: center; gap: 12px; }
    .wfact.col { flex-direction: column; align-items: flex-start; gap: 1px; }
    .wfact b { font-size: 17px; font-weight: var(--w-bold, 700); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wfact small { font-size: 12.500px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .wwarn { display: flex; gap: 10px; align-items: center; padding: 10px 12px; border-radius: 16px; background: var(--danger, #dc2626); color: #fff; font-size: 15px; font-weight: var(--w-bold, 700); line-height: 1.25; }
    .wcomp { flex-shrink: 0; }
    .wcomp .ring { fill: none; stroke: var(--ink2); stroke-width: 1.5; opacity: .5; }
    .wcomp text { font-size: 9px; font-weight: 700; fill: var(--ink2); text-anchor: middle; dominant-baseline: central; }
    .wcomp .needle { fill: var(--accent); transform-origin: 32px 32px; }
    .wcomp .sway { transform-origin: 32px 32px; animation: sway 3.600s ease-in-out infinite; animation-play-state: var(--motion, running); }
    @keyframes sway { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(6deg); } }

    /* hours */
    .hscroll { overflow-x: auto; overflow-y: hidden; margin: 0 -6px; padding: 0 6px; scrollbar-width: none; }
    .hscroll::-webkit-scrollbar { display: none; }
    .hchart text { font-size: 12px; font-weight: 600; fill: var(--ink2); text-anchor: middle; }
    .hchart .tv { font-size: 14px; font-weight: 800; fill: var(--ink); }
    .hchart .line { fill: none; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
    .hchart .area { opacity: .16; }
    .hchart .rainbar { fill: #3b9ae1; }
    .hchart .raintxt { fill: #2b84c8; font-size: 11px; font-weight: 700; }
    .hchart .day { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; fill: var(--accent); }
    .hchart .split { stroke: var(--ink2); stroke-width: 1; stroke-dasharray: 2 4; opacity: .5; }

    /* week */
    .days { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 4px; overflow: auto; }
    .wday { display: grid; grid-template-columns: 52px 40px 1fr; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 14px; min-height: 52px; }
    .wday.today { background: var(--chip); }
    .wday .dn { font-size: 16px; font-weight: var(--w-bold, 700); }
    .wday .dn small { display: block; font-size: 12px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .wday .rng { display: grid; grid-template-columns: 30px 1fr 30px; align-items: center; gap: 6px; font-size: 15px; font-weight: var(--w-bold, 700); font-variant-numeric: tabular-nums; }
    .wday .lo { color: var(--ink2); text-align: right; }
    .wday .wet { grid-column: 1 / -1; font-size: 12px; font-weight: 700; color: #2b84c8; margin-top: -2px; }
    .track { height: 8px; border-radius: 4px; background: var(--track); position: relative; }
    .wbar { position: absolute; top: 0; bottom: 0; border-radius: 4px; min-width: 8px; }

    /* maps */
    .mhead { display: flex; align-items: center; gap: 10px; padding: 2px 6px 0; }
    .mhead h2 { flex: 1; }
    .mbox { flex: 1; min-height: 0; border-radius: 18px; overflow: hidden; position: relative; background: var(--chip-soft); }
    .mbox iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    .none { margin: auto; padding: 20px; text-align: center; color: var(--ink2); font-weight: var(--w-semi, 600); font-size: 15px; line-height: 1.4; max-width: 340px; }
    .credit { font-size: 11px; color: var(--ink2); padding: 0 6px; }

    /* the drawn sky */
    .sky { flex-shrink: 0; overflow: visible; }
    .sky .disc { fill: #ffc533; }
    .sky .rays { stroke: #ffb300; stroke-width: 3.5; stroke-linecap: round; fill: none; transform-origin: inherit; transform-box: view-box; animation: spin 40s linear infinite; animation-play-state: var(--motion, running); }
    .sky .sun { transform-box: view-box; }
    .sky .moon { fill: #f4dc7a; stroke: rgba(90, 70, 10, .35); stroke-width: 1.5; }
    .sky .star { fill: #ffe27a; animation: twk 3.200s ease-in-out infinite; animation-play-state: var(--motion, running); }
    .sky .s2 { animation-delay: -1.500s; }
    .sky .cloud { fill: #fff; stroke: rgba(40, 60, 90, .22); stroke-width: 1.5; }
    .sky .cloud.back { fill: #dfe7ef; }
    .sky .cloud.dark { fill: #aab6c4; }
    .sky .drift { animation: drift 9s ease-in-out infinite; animation-play-state: var(--motion, running); }
    .sky .drop { stroke: #3b9ae1; stroke-width: 3; stroke-linecap: round; fill: none; animation: fall 1.200s linear infinite; animation-play-state: var(--motion, running); }
    .sky .flake { fill: #bfe3ff; stroke: #7fb7e0; animation: fall 1.800s linear infinite; animation-play-state: var(--motion, running); }
    .sky .bolt { fill: #ffd21f; stroke: #e0a800; stroke-width: 1; stroke-linejoin: round; animation: flash 4s steps(1) infinite; animation-play-state: var(--motion, running); }
    .sky .gusts { fill: none; stroke: var(--ink2); stroke-width: 3.5; stroke-linecap: round; animation: drift 5s ease-in-out infinite; animation-play-state: var(--motion, running); }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes twk { 50% { opacity: .25; } }
    @keyframes drift { 0%, 100% { translate: -1.500px 0; } 50% { translate: 2.500px 0; } }
    @keyframes fall { 0% { translate: 1px -4px; opacity: 0; } 25% { opacity: 1; } 100% { translate: -2px 7px; opacity: 0; } }
    @keyframes flash { 0%, 100% { opacity: 1; } 6% { opacity: .2; } 9% { opacity: 1; } 12% { opacity: .2; } 16% { opacity: 1; } }
  `];

  static properties = { hass: { attribute: false }, entity: {}, page: { attribute: false }, theme: {}, _days: { state: true }, _hours: { state: true }, _map: { state: true }, _failed: { state: true } };
  hass?: Hass;
  entity = '';
  page: WeatherPageConfig = {};
  theme = '';
  private _days: Day[] = [];
  private _hours: Hour[] = [];
  private _map: 'radar' | 'wind' = 'radar';
  private _failed = false;
  private _timer?: number;
  private _loadedFor = '';

  connectedCallback(): void {
    super.connectedCallback();
    this._timer = window.setInterval(() => this._load(), 10 * 60000);
  }
  disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this._timer); }

  /** The Bureau's sensors, found by what they are called unless the config names them. */
  private get _obs(): string {
    if (this.page.observations) return this.page.observations;
    const id = Object.keys(this.hass?.states ?? {}).find((k) => k.startsWith('sensor.') && k.endsWith('_temp_feels_like'));
    return id ? id.slice(7, -16) : '';
  }
  private get _fc(): string {
    if (this.page.forecast) return this.page.forecast;
    const own = this.entity.split('.')[1] ?? '';
    if (this.hass?.states[`sensor.${own}_short_text_0`] || this.hass?.states[`sensor.${own}_extended_text_0`]) return own;
    const id = Object.keys(this.hass?.states ?? {}).find((k) => k.startsWith('sensor.') && /_(extended_text|uv_max_index|rain_chance)_0$/.test(k));
    return id ? id.slice(7).replace(/_(extended_text|uv_max_index|rain_chance)_0$/, '') : '';
  }
  private get _warnId(): string {
    if (this.page.warnings) return this.page.warnings;
    const guess = `sensor.${this._fc}_warnings`;
    return this.hass?.states[guess] ? guess : Object.keys(this.hass?.states ?? {}).find((k) => k.startsWith('sensor.') && k.endsWith('_warnings') && Array.isArray(this.hass!.states[k].attributes.warnings)) ?? '';
  }
  private get _hourlyId(): string {
    if (this.page.hourly) return this.page.hourly;
    const guess = `${this.entity}_hourly`;
    return this.hass?.states[guess] ? guess : this.entity;
  }
  private _o(key: string): HassEntity | undefined { return this._obs ? this.hass?.states[`sensor.${this._obs}_${key}`] : undefined; }
  private _f(key: string): HassEntity | undefined { return this._fc ? this.hass?.states[`sensor.${this._fc}_${key}_0`] : undefined; }
  private _ids(): string[] {
    const o = this._obs, f = this._fc;
    return [this.entity, this._hourlyId, this._warnId,
      ...['temp', 'temp_feels_like', 'humidity', 'wind_speed_kilometre', 'wind_direction', 'gust_speed_kilometre', 'rain_since_9am'].map((k) => `sensor.${o}_${k}`),
      ...['extended_text', 'uv_max_index', 'uv_start_time', 'uv_end_time', 'rain_chance', 'rain_amount_range', 'fire_danger'].map((k) => `sensor.${f}_${k}_0`)];
  }

  protected shouldUpdate(ch: PropertyValues): boolean {
    if (ch.size === 1 && ch.has('hass')) {
      return changed(ch.get('hass') as Hass | undefined, this.hass, this._ids());
    }
    return true;
  }
  protected willUpdate(): void {
    if (this.hass && this.entity && this._loadedFor !== this.entity) { this._loadedFor = this.entity; this._load(); }
  }

  private async _forecast(id: string, type: 'daily' | 'hourly'): Promise<Day[]> {
    const res = await this.hass!.callWS<any>({ type: 'call_service', domain: 'weather', service: 'get_forecasts', service_data: { type }, target: { entity_id: id }, return_response: true });
    return res?.response?.[id]?.forecast ?? [];
  }
  private async _load(): Promise<void> {
    if (!this.hass || !this.entity) return;
    const [d, h] = await Promise.allSettled([this._forecast(this.entity, 'daily'), this._forecast(this._hourlyId, 'hourly')]);
    if (d.status === 'fulfilled' && d.value.length) this._days = d.value;
    if (h.status === 'fulfilled') this._hours = h.value;
    this._failed = d.status === 'rejected' && !this._days.length;
  }

  /* ---------------- what to say ---------------- */

  private _today(): Day | undefined {
    const key = new Date().toDateString();
    return this._days.find((d) => new Date(d.datetime).toDateString() === key) ?? this._days[0];
  }
  private _uv(): { max?: number; from: string; to: string } {
    const hours = this._hours.filter((h) => new Date(h.datetime).toDateString() === new Date().toDateString());
    const sensor = num(this._f('uv_max_index'));
    const max = sensor ?? this._today()?.uv_index ?? (hours.length ? Math.max(...hours.map((h) => h.uv_index ?? 0)) : undefined);
    return { max, from: clock(txt(this._f('uv_start_time'))), to: clock(txt(this._f('uv_end_time'))) };
  }
  /** One plain sentence a child can act on: the most important thing about today. */
  private _tip(): string {
    const t = this._today(), uv = this._uv(), now = new Date();
    const chance = num(this._f('rain_chance')) ?? t?.precipitation_probability ?? 0;
    const gust = num(this._o('gust_speed_kilometre')) ?? 0;
    const top = t?.temperature, temp = num(this._o('temp')) ?? this.hass?.states[this.entity]?.attributes.temperature;
    const state = this.hass?.states[this.entity]?.state ?? '';
    const night = now.getHours() >= 19 || now.getHours() < 5;
    if (/lightning/.test(state)) return 'Storms about. Stay inside until the thunder has gone.';
    if (/rain|pour/.test(state)) return 'It is raining. Raincoat or umbrella if you go out.';
    if (!night && chance >= 60) return `Rain is likely today (${Math.round(chance)}%). Pack a raincoat.`;
    if (!night && top !== undefined && top >= 35) return `A very hot day, up to ${Math.round(top)}°. Water bottle, hat and shade.`;
    if (!night && (uv.max ?? 0) >= 3) return `Sun is strong today (UV ${Math.round(uv.max!)}). Hat and sunscreen${uv.from && uv.to ? ` from ${uv.from} to ${uv.to}` : ''}.`;
    if (gust >= 45) return 'Very windy. Hold on to your hat.';
    if (temp !== undefined && temp < 14) return 'It is chilly. Jumper weather.';
    if (night) return t?.templow !== undefined && t.templow < 12 ? 'A cold night coming. Extra blanket.' : 'A calm night. Sleep well.';
    if (chance >= 30) return `It might rain later (${Math.round(chance)}%).`;
    return 'A good day to be outside.';
  }

  /* ---------------- drawing ---------------- */

  private _titles(): [string, string, string, string] { return TITLES[getLook()] ?? TITLES.glass; }

  private _compass(bearing: unknown): TemplateResult {
    const d = deg(bearing);
    return html`<svg class="wcomp" viewBox="0 0 64 64" width="58" height="58" aria-hidden="true">
      ${svg`<circle class="ring" cx="32" cy="32" r="22"></circle>
        <text x="32" y="5">N</text><text x="59" y="32">E</text><text x="32" y="59.5">S</text><text x="5" y="32">W</text>
        ${d === undefined ? nothing : svg`<g class="sway"><path class="needle" transform="rotate(${d + 180} 32 32)" d="M32 13l6.5 16h-4.500v19h-4v-19h-4.500z"></path></g>`}`}
    </svg>`;
  }

  private _now(): TemplateResult {
    const w = this.hass?.states[this.entity], a = w?.attributes ?? {}, t = this._today();
    const temp = num(this._o('temp')) ?? a.temperature, feels = num(this._o('temp_feels_like')) ?? a.apparent_temperature;
    const wind = num(this._o('wind_speed_kilometre')) ?? a.wind_speed, gust = num(this._o('gust_speed_kilometre')) ?? a.wind_gust_speed;
    const dir = txt(this._o('wind_direction')) ?? a.wind_bearing, hum = num(this._o('humidity')) ?? a.humidity;
    const since = num(this._o('rain_since_9am')), chance = num(this._f('rain_chance')) ?? t?.precipitation_probability;
    const range = txt(this._f('rain_amount_range')), uv = this._uv(), fire = txt(this._f('fire_danger'));
    const rise = clock(txt(this._f('astronomical_sunrise_time'))), set = clock(txt(this._f('astronomical_sunset_time')));
    const said = txt(this._f('extended_text'));
    const warns = ((this.hass?.states[this._warnId]?.attributes.warnings ?? []) as { short_title?: string; title?: string; phase?: string; expiry_time?: string }[])
      .filter((x) => x.phase !== 'cancelled' && (!x.expiry_time || new Date(x.expiry_time).getTime() > Date.now()));
    const fact = (big: unknown, small: string, cls = '') => html`<div class="wfact ${cls}"><b>${big}</b><small>${small}</small></div>`;
    return html`<section class="glass wnow scrolly">
      <h2>${this._titles()[0]}</h2>
      ${warns.map((x) => html`<div class="wwarn" role="alert"><span aria-hidden="true">⚠️</span><span>${x.short_title ?? x.title}</span></div>`)}
      <div class="top">
        ${sky(w?.state, 80)}
        <div>
          <div class="wtemp display">${temp !== undefined ? html`${Math.round(temp)}<sup>°</sup>` : '–'}</div>
          <div class="cond">${COND[w?.state ?? ''] ?? w?.state ?? ''}</div>
        </div>
      </div>
      <div class="muted" style="font-size:15px;font-weight:var(--w-semi, 600)">
        ${feels !== undefined ? html`Feels like ${Math.round(feels)}°` : nothing}${t?.temperature !== undefined ? html`${feels !== undefined ? ' · ' : ''}Top ${Math.round(t.temperature)}°` : nothing}${t?.templow !== undefined && t.templow !== t.temperature ? html` · Low ${Math.round(t.templow)}°` : nothing}
      </div>
      <div class="wtip"><span class="m" aria-hidden="true">${MASCOT[getLook() === 'glass' ? this.theme : getLook()] ?? '🌤️'}</span><span>${this._tip()}</span></div>
      <div class="facts">
        ${wind !== undefined ? html`<div class="wfact wide">${this._compass(dir)}<span style="display:flex;flex-direction:column;min-width:0"><b>${Math.round(wind)} km/h</b><small>Wind${dir !== undefined ? ` from the ${from(dir)}` : ''}${gust !== undefined ? ` · gusts ${Math.round(gust)}` : ''}</small></span></div>` : nothing}
        ${chance !== undefined ? fact(`${Math.round(chance)}%`, `Chance of rain${range && range !== '0' ? ` · ${range} mm` : ''}`) : nothing}
        ${since !== undefined ? fact(`${since} mm`, 'Rain since 9 am') : nothing}
        ${uv.max !== undefined ? fact(`UV ${Math.round(uv.max)}`, uv.from && uv.to && uv.max >= 3 ? `${uvWord(uv.max)} · cover up ${uv.from} to ${uv.to}` : uvWord(uv.max)) : nothing}
        ${hum !== undefined ? fact(`${Math.round(hum)}%`, 'Humidity') : nothing}
        ${rise && set ? fact(html`${rise} <span class="muted" style="font-weight:var(--w-semi, 600)">to</span> ${set}`, 'Sunrise to sunset', 'wide col') : nothing}
        ${fire ? fact(fire, 'Fire danger', 'wide col') : nothing}
      </div>
      ${said ? html`<p class="said">${said}</p>` : nothing}
    </section>`;
  }

  private _hoursChart(): TemplateResult {
    const now = Date.now() - 30 * 60000;
    const hs = this._hours.filter((h) => new Date(h.datetime).getTime() >= now).slice(0, 24);
    if (hs.length < 2) return html`<section class="glass whours"><h2>${this._titles()[1]}</h2><p class="muted" style="font-size:14px">Hour-by-hour weather is not available from this forecast.</p></section>`;
    const W = 58, H = 158, n = hs.length, temps = hs.map((h) => h.temperature ?? 0);
    const lo = Math.min(...temps), hi = Math.max(...temps), y = (t: number) => 98 - ((t - lo) / Math.max(1, hi - lo)) * 24;
    const x = (i: number) => i * W + W / 2;
    const pts = hs.map((h, i) => `${x(i)} ${y(h.temperature ?? lo)}`);
    return html`<section class="glass whours">
      <h2>${this._titles()[1]}</h2>
      <div class="hscroll" tabindex="0" role="img" aria-label=${`Next ${n} hours: ${hs.filter((_, i) => i % 3 === 0).map((h) => `${hourLabel(new Date(h.datetime))} ${Math.round(h.temperature ?? 0)} degrees`).join(', ')}`}>
        <svg class="hchart" width=${n * W} height=${H} viewBox="0 0 ${n * W} ${H}">
          ${svg`<defs><linearGradient id="tg" gradientUnits="userSpaceOnUse" x1="0" x2=${n * W} y1="0" y2="0">${hs.map((h, i) => svg`<stop offset=${i / (n - 1)} stop-color=${tcol(h.temperature ?? lo)}></stop>`)}</linearGradient></defs>
          <path class="area" fill="url(#tg)" d="M${x(0)} 122L${pts.join('L')}L${x(n - 1)} 122z"></path>
          <path class="line" stroke="url(#tg)" d="M${pts.join('L')}"></path>
          ${hs.map((h, i) => {
            const d = new Date(h.datetime), p = h.precipitation_probability ?? 0, newDay = i > 0 && d.getHours() === 0;
            return svg`
              ${newDay ? svg`<path class="split" d="M${i * W} 18V${H - 4}"></path><text class="day" x=${i * W + 4} y="11" style="text-anchor:start">${d.toLocaleDateString('en-AU', { weekday: 'short' })}</text>` : nothing}
              <text x=${x(i)} y=${newDay ? 26 : 13}>${i === 0 ? 'Now' : hourLabel(d)}</text>
              <svg class="sky" x=${x(i) - 15} y="30" width="30" height="30" viewBox="0 0 64 64">${glyph(h.condition)}</svg>
              <circle cx=${x(i)} cy=${y(h.temperature ?? lo)} r="3.5" fill=${tcol(h.temperature ?? lo)}></circle>
              <text class="tv" x=${x(i)} y=${y(h.temperature ?? lo) - 9}>${Math.round(h.temperature ?? 0)}°</text>
              ${p >= 10 ? svg`<rect class="rainbar" x=${x(i) - 13} y=${150 - (p / 100) * 14} width="26" height=${(p / 100) * 14 + 2} rx="2"></rect><text class="raintxt" x=${x(i)} y="133">${Math.round(p)}%</text>` : svg`<text x=${x(i)} y="146" style="font-size:11px;opacity:.75">${h.wind_speed !== undefined ? `${Math.round(h.wind_speed)} km/h` : ''}</text>`}`;
          })}`}
        </svg>
      </div>
    </section>`;
  }

  private _week(): TemplateResult {
    const days = this._days.slice(0, 7), today = new Date().toDateString();
    const lows = days.map((d) => d.templow ?? d.temperature ?? 0), highs = days.map((d) => d.temperature ?? 0);
    const lo = Math.min(...lows), hi = Math.max(...highs), span = Math.max(1, hi - lo);
    return html`<section class="glass wweek">
      <h2>${this._titles()[2]}</h2>
      ${!days.length ? html`<p class="muted" style="font-size:14px">${this._failed ? 'The forecast could not be loaded. It will try again shortly.' : 'Loading the forecast…'}</p>` : html`
      <div class="days" role="list">
        ${days.map((d, i) => {
          const dt = new Date(d.datetime), isToday = dt.toDateString() === today, p = d.precipitation_probability ?? 0;
          const l = d.templow ?? d.temperature ?? lo, h = d.temperature ?? hi, same = d.templow === undefined || d.templow === d.temperature;
          const name = isToday ? 'Today' : dt.toLocaleDateString('en-AU', { weekday: 'short' });
          return html`<div class="wday ${isToday ? 'today' : ''}" role="listitem" aria-label=${`${isToday ? 'Today' : dt.toLocaleDateString('en-AU', { weekday: 'long' })}: ${COND[d.condition ?? ''] ?? ''}, ${same ? '' : `${Math.round(l)} to `}${Math.round(h)} degrees${p >= 20 ? `, ${Math.round(p)} percent chance of rain` : ''}`}>
            <span class="dn">${name}<small>${dt.getDate()} ${dt.toLocaleDateString('en-AU', { month: 'short' })}</small></span>
            ${sky(i === 0 && d.condition === 'clear-night' ? 'clear-night' : d.condition, 38)}
            <span class="rng">
              <span class="lo">${same ? '' : `${Math.round(l)}°`}</span>
              <span class="track"><span class="wbar" style="left:${same ? ((h - lo) / span) * 100 - 4 : ((l - lo) / span) * 100}%;right:${100 - ((h - lo) / span) * 100}%;background:linear-gradient(90deg, ${tcol(l)}, ${tcol(h)})"></span></span>
              <span>${Math.round(h)}°</span>
              ${p >= 20 ? html`<span class="wet">💧 ${Math.round(p)}%${d.precipitation ? ` · ${d.precipitation} mm` : ''}</span>` : nothing}
            </span>
          </div>`;
        })}
      </div>`}
    </section>`;
  }

  private get _dark(): boolean { return getLook() === 'orbit' || (getLook() === 'glass' && this.theme === 'space'); }
  private _windUrl(): string {
    // rounded to a tenth of a degree (about 10 km): enough to centre the map, without sending the address of the house
    const lat = Math.round((this.hass?.config?.latitude ?? -31.95) * 10) / 10, lon = Math.round((this.hass?.config?.longitude ?? 115.86) * 10) / 10;
    const q = new URLSearchParams({ lat: String(lat), lon: String(lon), detailLat: String(lat), detailLon: String(lon), zoom: '6', level: 'surface', overlay: 'wind', product: 'ecmwf', menu: '', message: 'true', marker: '', calendar: 'now', pressure: '', type: 'map', location: 'coordinates', detail: '', metricWind: 'km/h', metricTemp: '°C', radarRange: '-1' });
    return `https://embed.windy.com/embed2.html?${q}`;
  }
  private _maps(): TemplateResult | typeof nothing {
    const wantRadar = this.page.radar !== false, wantWind = this.page.wind !== false;
    if (!wantRadar && !wantWind) return nothing;
    const lat = this.hass?.config?.latitude, lon = this.hass?.config?.longitude;
    const tab = !wantRadar ? 'wind' : !wantWind ? 'radar' : this._map;
    const btn = (id: 'radar' | 'wind', label: string) => html`<button class="tap" aria-pressed=${tab === id} @click=${() => { sfx('tap'); this._map = id; }}>${label}</button>`;
    return html`<section class="glass wmaps">
      <div class="mhead"><h2>${this._titles()[3]}</h2>${wantRadar && wantWind ? html`<div class="seg" role="group" aria-label="Which map">${btn('radar', 'Rain radar')}${btn('wind', 'Wind')}</div>` : nothing}</div>
      <div class="mbox">
        ${tab === 'radar'
          ? lat !== undefined && lon !== undefined ? html`<fh-radar .lat=${lat} .lon=${lon} .zoom=${this.page.zoom ?? 6} ?dark=${this._dark}></fh-radar>` : html`<p class="none">The radar needs to know where home is. Set the location in Home Assistant’s settings.</p>`
          : html`<iframe title="Wind map" loading="lazy" referrerpolicy="no-referrer" src=${this._windUrl()}></iframe>`}
      </div>
      <span class="credit">${tab === 'radar' ? 'Radar: RainViewer · Map: Esri and its data providers' : 'Wind: Windy.com'}</span>
    </section>`;
  }

  protected render(): TemplateResult {
    if (!this.entity || !this.hass?.states[this.entity]) return html`<section class="glass" style="grid-column:1 / -1"><h2>Weather</h2><p class="muted">Add a weather entity to the card (<code>weather: weather.your_town</code>) to see the forecast here.</p></section>`;
    return html`${this._now()}${this._maps()}${this._week()}${this._hoursChart()}`;
  }
}
customElements.define('fh-weather', FhWeather);
