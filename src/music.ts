import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController, getLook, lookArt } from './looks';
import { icon, solid } from './icons';
import { slotVar, type ColourSlot, type Hass, type HassEntity, type KidConfig, type StationConfig } from './types';
import { FitController, isQuiet, scrollCue, shortNames, windDown } from './util';
import { keyboard, keysCss, typeKey } from './keys';
import { findRoom, hasMa, kidSpeaker, loadShelf, pinToShelf, play, queue, rooms, search, shelfEntity, sibling, sleepIn, type MediaHit, type QueueInfo, type ShelfItem } from './ma';
import './pin';

type Tab = 'rooms' | 'search' | 'shelves' | 'juke' | 'radio' | 'call';
interface Pick extends MediaHit { who: string; t: number; done?: boolean }
interface Juke { day: string; on: boolean; who: string; picks: Pick[] }
/** Survives page switches: radio lookup is a 1,500-row browse, so do it once per session. */
const CACHE: { thumbs: Record<string, string>; res: Record<string, string>; key: string } = { thumbs: {}, res: {}, key: '' };
const LAST: Record<string, string> = {};
const DEFAULT_STATIONS: StationConfig[] = [{ name: 'ABC Kids listen', match: 'ABC Kids listen' }, { name: 'ABC Jazz', match: 'ABC Jazz' }];
const CALLS = ['Dinner’s ready!', 'Time to get ready, please.', 'Please come to the kitchen.', 'Five minutes until bedtime.', 'Time to leave – shoes on!', 'I love you!'];
const TYPE_LABEL: Record<string, string> = { track: 'Song', album: 'Album', playlist: 'Playlist', artist: 'Artist', radio: 'Radio', podcast: 'Podcast', audiobook: 'Story' };
const today = (): string => new Date().toDateString();
const ls = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) as T; } catch { return d; } };
const lsSet = (k: string, v: unknown): void => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked */ } };

/**
 * Music: what is playing and where, one search across every service, a shelf of favourites per child,
 * a take-turns jukebox, radio, and a way to call a room.
 */
export class FhMusic extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, keysCss, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .stage { width: 380px; flex-shrink: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; position: relative; overflow: hidden; color: #fff; background: #111; }
    .stage .bg { position: absolute; inset: -40px; background: var(--art) center / cover; filter: blur(40px) saturate(160%) brightness(.65); transform: scale(1.2); transition: background .6s; }
    .stage > *:not(.bg) { position: relative; }
    .deck { flex: 1 1 0; min-height: 120px; display: flex; align-items: center; justify-content: center; }
    .cover { height: 100%; max-height: 250px; aspect-ratio: 1; border-radius: 22px; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 20px 50px -12px rgba(0,0,0,.6); transition: transform .5s cubic-bezier(.2,1.2,.3,1); }
    .cover.paused { transform: scale(.9); }
    .bar { height: 4px; border-radius: 2px; background: rgba(255,255,255,.25); overflow: hidden; }
    .bar > i { display: block; height: 100%; background: #fff; border-radius: 2px; transition: width 1s linear; }
    .ctl { display: flex; align-items: center; justify-content: space-between; }
    .ctl button { color: #fff; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .ctl button[aria-pressed='true'] { background: rgba(255,255,255,.22); }
    .ctl .go { width: 66px; height: 66px; background: #fff; color: #111; }
    .upnext { display: flex; align-items: center; gap: 8px; min-height: 30px; font-size: 13px; font-weight: var(--w-semi, 600); opacity: .85; white-space: nowrap; overflow: hidden; }
    .mini { display: flex; align-items: center; gap: 10px; }
    .mini .tog { height: 40px; padding: 0 12px; border-radius: 999px; background: rgba(255,255,255,.14); color: #fff; font-size: 13px; font-weight: var(--w-bold, 700); white-space: nowrap; }
    .mini .tog[aria-pressed='true'] { background: #fff; color: #111; }
    input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: var(--rail, rgba(255,255,255,.3)); outline: none; margin: 10px 0; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%; background: var(--knob, #fff); box-shadow: 0 2px 6px rgba(0,0,0,.3); }
    .panel { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tabs button { height: 42px; padding: 0 15px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: var(--w-semi, 600); }
    .tabs button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; align-content: start; }
    .grid[data-fit] { gap: 6px; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
    .spk { border-radius: 20px; background: var(--chip); padding: 10px 12px; display: flex; flex-direction: column; gap: 2px; --rail: var(--track); --knob: var(--primary); }
    .spk.focus { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .spk.inmix { box-shadow: 0 0 0 3px var(--ok); }
    .spk .top { display: flex; align-items: center; gap: 10px; }
    .spk .rsel { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; text-align: left; min-height: 44px; }
    .grid[data-fit] .spk input { margin: 6px 0; }
    .thumb { width: 44px; height: 44px; border-radius: 12px; background: var(--art, var(--track)) center / cover; flex-shrink: 0; display: flex; align-items: flex-end; justify-content: center; gap: 3px; padding-bottom: 7px; }
    .eq i { width: 4px; border-radius: 2px; background: #fff; animation: eq .9s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); box-shadow: 0 0 4px rgba(0,0,0,.4); }
    .eq i:nth-child(2) { animation-delay: .3s; } .eq i:nth-child(3) { animation-delay: .6s; }
    @keyframes eq { from { height: 4px; } to { height: 20px; } }
    .join { width: 44px; height: 44px; border-radius: 50%; background: var(--track); font-size: 20px; font-weight: var(--w-heavy, 800); flex-shrink: 0; }
    .join[aria-pressed='true'] { background: var(--ok); color: var(--on-ok, #fff); }
    .field { flex: 1; min-width: 0; height: 52px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 16px; font: inherit; font-size: 20px; font-weight: var(--w-semi, 600); color: var(--ink); outline: none; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); }
    .hits { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; align-content: start; }
    .hits[data-fit] { gap: 3px 10px; }
    .hit { display: flex; align-items: center; gap: 10px; padding: 6px 10px 6px 6px; min-height: 52px; border-radius: 14px; background: var(--chip); text-align: left; min-width: 0; }
    .hits[data-fit] .hit { min-height: 46px; padding: 3px 10px 3px 4px; }
    .hit[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .hit .art, .pickrow .art { width: 40px; height: 40px; border-radius: 9px; background: var(--art, var(--track)) center / cover; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--ink2); }
    .hit .tx { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
    .hit .tx b, .hit .tx span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .hit .tx b { font-size: 15px; font-weight: var(--w-bold, 700); }
    .hit .tx span { font-size: 12px; color: var(--ink2); font-weight: var(--w-semi, 600); }
    .kind { font-size: 11px; font-weight: var(--w-heavy, 800); padding: 3px 8px; border-radius: 999px; background: var(--track); color: var(--ink2); flex-shrink: 0; }
    .acts { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .covers { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(132px, 1fr)); gap: 12px; align-content: start; }
    .covers[data-fit] { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
    .st { border-radius: 20px; background: var(--chip); padding: 10px; display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 14px; font-weight: var(--w-bold, 700); position: relative; min-width: 0; }
    .st .img { aspect-ratio: 1; border-radius: 14px; background: var(--art, linear-gradient(135deg, var(--p-1), var(--p-3))) center / cover no-repeat, #fff; display: flex; align-items: center; justify-content: center; font-family: 'Bricolage Grotesque', sans-serif; font-size: 30px; font-weight: var(--w-heavy, 800); color: #fff; }
    .st .lbl { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2; }
    .st.on { box-shadow: 0 0 0 3px var(--ok); }
    .st .x { position: absolute; top: 4px; right: 4px; width: 36px; height: 36px; border-radius: 50%; background: #dc2626; color: #fff; font-size: 18px; font-weight: var(--w-heavy, 800); }
    .chiprow { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .pchip { height: 44px; padding: 0 14px 0 8px; border-radius: 999px; background: var(--chip); display: inline-flex; align-items: center; gap: 8px; font-size: 15px; font-weight: var(--w-semi, 600); }
    .pchip[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--c, var(--primary)); }
    .pchip .avatar { width: 30px; height: 30px; font-size: 13px; background: var(--c); }
    .picks { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 6px; }
    .picks[data-fit] { gap: 3px; }
    .pickrow { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 14px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); min-height: 48px; }
    .pickrow.played { opacity: .5; }
    .pickrow .nm { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .banner { padding: 10px 14px; border-radius: 16px; background: color-mix(in srgb, var(--accent) 24%, var(--chip)); font-size: 15px; font-weight: var(--w-bold, 700); display: flex; align-items: center; gap: 10px; }
    .msgs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .msgs button { min-height: 52px; padding: 6px 12px; border-radius: 16px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); text-align: left; }
    .msgs button[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .soft { color: var(--ink2); font-size: 13px; font-weight: var(--w-semi, 600); }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .stage { width: auto; flex-direction: row; flex-wrap: wrap; align-items: center; }
    :host([data-shape='tall']) .stage > *:not(.bg) { flex: 1 1 100%; }
    :host([data-shape='tall']) .stage { gap: 6px; padding: 14px 18px; flex: 0 0 auto; }
    :host([data-shape='tall']) .panel { min-height: 0; }
    :host([data-shape='tall']) .deck { flex: 0 0 140px; height: 140px; min-height: 0; }
    :host([data-shape='tall']) .stage .titles { flex: 1 1 0; min-width: 0; }
  `];

  static properties = { hass: { attribute: false }, players: { attribute: false }, stations: { attribute: false }, source: {}, preferred: {}, kids: { attribute: false }, people: { attribute: false }, pin: {}, quiet: { attribute: false }, sleepMinutes: { type: Number },
    _tab: { state: true }, _focus: { state: true }, _thumbs: { state: true }, _resolved: { state: true }, _msg: { state: true }, _q: { state: true }, _text: { state: true }, _caps: { state: true }, _hits: { state: true }, _busy: { state: true }, _keys: { state: true },
    _sel: { state: true }, _shelf: { state: true }, _items: { state: true }, _edit: { state: true }, _juke: { state: true }, _keep: { state: true }, _callTo: { state: true }, _callMsg: { state: true }, _pinAsk: { state: true }, _pinTo: { state: true }, _adding: { state: true }, _now: { state: true }, _ckeys: { state: true } };
  hass?: Hass;
  players: string[] = [];
  stations: (string | StationConfig)[] = [];
  source = 'media-source://radio_browser/country/AU';
  preferred = '';
  kids: KidConfig[] = [];
  people: { name: string; colour: ColourSlot }[] = [];
  pin = '';
  quiet: { start?: string; end?: string } = {};
  sleepMinutes = 30;
  private _tab: Tab = 'rooms';
  private _focus = '';
  private _thumbs: Record<string, string> = {};
  private _resolved: Record<string, string> = {};
  private _loaded = false;
  private _msg = '';
  private _t?: number;
  private _q: QueueInfo | null = null;
  private _qKey = '';
  private _text = '';
  private _caps = true;
  private _hits: MediaHit[] | null = null;
  private _busy = false;
  private _keys = true;
  private _sel = '';
  private _shelf = 'Family';
  private _items: Record<string, ShelfItem[]> = {};
  private _edit = false;
  private _juke: Juke = ((j: Juke) => (j.day === today() ? j : { day: today(), on: false, who: '', picks: [] }))(ls<Juke>('fh-juke', { day: '', on: false, who: '', picks: [] }));
  private _keep = ls('fh-keep', false);
  private _callTo: string[] = [];
  private _callMsg = '';
  private _pinAsk: { reason: string; run: () => void } | null = null;
  private _pinTo: MediaHit | null = null;
  private _adding = false;
  private _ckeys = false;
  private _now = Date.now();
  private _tick?: number;
  private _was = '';
  private _lastUri = '';
  private _lastCall = 0;
  private _fedFor = '';
  private _fedName = '';

  connectedCallback(): void { super.connectedCallback(); this._tick = window.setInterval(() => { if (this._cur?.state === 'playing') this._now = Date.now(); }, 1000); }
  disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this._tick); }
  private _say(m: string): void { this._msg = m; clearTimeout(this._t); this._t = window.setTimeout(() => { this._msg = ''; }, 3200); }

  private get _list(): HassEntity[] { return rooms(this.hass!, this.players); }
  private get _cur(): HassEntity | undefined {
    const l = this._list;
    return l.find((p) => p.entity_id === this._focus) ?? findRoom(this.hass!, l, this.preferred) ?? l.find((p) => p.state === 'playing') ?? l[0];
  }
  private get _stations(): StationConfig[] {
    const s = this.stations.length ? this.stations : DEFAULT_STATIONS;
    return s.map((x) => typeof x === 'string' ? { name: x, match: x } : x);
  }
  private get _everyone(): { name: string; colour: ColourSlot }[] { return [...this.people.filter((p) => !this.kids.some((k) => k.name === p.name)), ...this.kids.map((k) => ({ name: k.name, colour: k.colour }))]; }
  /** Tonight's DJ, if a child has cashed in the reward. */
  private get _dj(): string { const d = ls<{ kid: string; day: string } | null>('fh-dj', null); return d && d.day === today() ? d.kid : ''; }
  private _name(p?: HassEntity): string { return String(p?.attributes.friendly_name ?? 'a speaker'); }
  private _mix(p?: HassEntity): string[] { return ((p?.attributes.group_members as string[] | undefined) ?? []).filter((id) => id !== p?.entity_id); }
  private _guard(reason: string, run: () => void): void { if (this.pin) this._pinAsk = { reason, run }; else run(); }

  private async _loadRadio(): Promise<void> {
    const key = this.source + JSON.stringify(this.stations);
    if (CACHE.key === key) { this._thumbs = CACHE.thumbs; this._resolved = CACHE.res; return; }
    if (this._loaded || !this.hass) return;
    this._loaded = true;
    try {
      const r = await this.hass.callWS<{ children: { title: string; media_content_id: string; thumbnail?: string }[] }>({ type: 'media_source/browse_media', media_content_id: this.source });
      const thumbs: Record<string, string> = {}, res: Record<string, string> = {};
      for (const st of this._stations) {
        const want = st.id ? (st.id.startsWith('media-source://') ? st.id : `media-source://radio_browser/${st.id}`) : '';
        const hit = r.children.find((c) => want ? c.media_content_id === want : c.title.toLowerCase().includes((st.match ?? st.name).toLowerCase()));
        if (hit) { res[st.name] = hit.media_content_id; if (hit.thumbnail) thumbs[st.name] = hit.thumbnail; } else if (want) res[st.name] = want;
      }
      this._thumbs = thumbs; this._resolved = res;
      Object.assign(CACHE, { thumbs, res, key });
    } catch (e) { console.warn('Family Hub: radio browse failed', e); this._loaded = false; }
  }


  protected updated(ch: PropertyValues): void {
    const p = this._cur;
    if (!this.hass || !p) return;
    // refresh "up next" when the track or the room changes
    const key = `${p.entity_id}|${p.attributes.media_content_id ?? ''}|${p.state === 'playing'}`;
    if (key !== this._qKey) { this._qKey = key; queue(this.hass, p.entity_id).then((q) => { this._q = q; this._feed(); }); }
    if (ch.has('hass')) {
      // the music ran out: the jukebox plays the next pick, otherwise "keep it going" starts a radio from the last thing played
      const state = `${p.entity_id}:${p.state}`;
      if (this._was === `${p.entity_id}:playing` && p.state === 'idle') { if (!this._feed(true) && this._keep && this._lastUri) play(this.hass, p.entity_id, this._lastUri, 'play', true).catch(() => { /* this service has no radio mode */ }); }
      this._was = state;
    }
  }

  private _play(st: StationConfig): void {
    const p = this._cur, id = this._resolved[st.name];
    if (!p) return;
    if (!id) { this._say(`Couldn’t find ${st.name} – check the station list`); return; }
    this.hass!.callService('media_player', 'play_media', { entity_id: p.entity_id, media_content_id: id, media_content_type: 'music' })
      .then(() => { LAST[p.entity_id] = st.name; this.requestUpdate(); this._say(`${st.name} in ${this._name(p)}`); })
      .catch((e: any) => this._say(`${this._name(p)} couldn’t play that: ${e?.message ?? 'error'}`));
  }

  /* ---------------- transport ---------------- */
  private _svc(service: string, data: Record<string, unknown> = {}, id = this._cur?.entity_id): void { if (id) this.hass!.callService('media_player', service, { entity_id: id, ...data }); }
  private _start(m: MediaHit, mode: 'play' | 'next' | 'add' = 'play', radio = false, room = this._cur): void {
    if (!room) { this._say('No speaker to play on'); return; }
    this._lastUri = m.uri;
    play(this.hass!, room.entity_id, m.uri, mode, radio)
      .then(() => this._say(mode === 'play' ? `${radio ? 'Radio from ' : ''}${m.name} on ${this._name(room)}` : mode === 'next' ? `${m.name} plays next` : `${m.name} added to the queue`))
      .catch((e: any) => this._say(`${this._name(room)} couldn’t play that: ${e?.message ?? 'error'}`));
  }
  private _heart(): void {
    const b = this._cur && sibling(this.hass!, this._cur.entity_id, /^button\..*favou?rite_current_song$/);
    if (!b || this.hass!.states[b].state === 'unavailable') { this._say('Nothing playing to save'); return; }
    this.hass!.callService('button', 'press', {}, { entity_id: b }); this._say('Saved to favourites ♥');
  }
  private _sleep(): void {
    const p = this._cur; if (!p) return;
    this._say(sleepIn(this.hass!, p.entity_id, this.sleepMinutes) ? `${this._name(p)} will fade out in ${this.sleepMinutes} minutes` : 'The sleep timer needs the Family Hub sleep script in Home Assistant');
  }

  /* ---------------- rooms ---------------- */
  private _join(id: string): void {
    const p = this._cur; if (!p || id === p.entity_id) return;
    if (this._mix(p).includes(id)) this.hass!.callService('media_player', 'unjoin', {}, { entity_id: id });
    else this.hass!.callService('media_player', 'join', { group_members: [id] }, { entity_id: p.entity_id }).catch((e: any) => this._say(`Couldn’t add that room: ${e?.message ?? 'error'}`));
  }
  private _everywhere(on: boolean): void {
    const p = this._cur; if (!p) return;
    if (on) this.hass!.callService('media_player', 'join', { group_members: this._list.map((x) => x.entity_id).filter((id) => id !== p.entity_id) }, { entity_id: p.entity_id }).catch((e: any) => this._say(`Couldn’t group every room: ${e?.message ?? 'error'}`));
    else for (const id of this._mix(p)) this.hass!.callService('media_player', 'unjoin', {}, { entity_id: id });
  }
  private _move(to: HassEntity): void {
    const from = this._cur; if (!from) return;
    this.hass!.callService('music_assistant', 'transfer_queue', { source_player: from.entity_id, auto_play: true }, { entity_id: to.entity_id })
      .then(() => { this._focus = to.entity_id; this._say(`Music moved to ${this._name(to)}`); }).catch((e: any) => this._say(`Couldn’t move the music: ${e?.message ?? 'error'}`));
  }

  /* ---------------- search ---------------- */
  private async _search(): Promise<void> {
    const text = this._text.trim(); if (!text || this._busy) return;
    this._busy = true; this._sel = '';
    try { this._hits = await search(this.hass!, text, this._cur?.entity_id); this._keys = false; }
    catch (e: any) { this._hits = []; this._say(`Search didn’t work: ${e?.message ?? 'error'}`); }
    finally { this._busy = false; }
  }

  /* ---------------- shelves ---------------- */
  private get _shelfNames(): string[] { return ['Family', ...this.kids.map((k) => k.name)]; }
  private async _loadShelves(): Promise<void> {
    const out: Record<string, ShelfItem[]> = {};
    for (const n of this._shelfNames) out[n] = await loadShelf(this.hass!, shelfEntity(n));
    this._items = out;
  }
  private _shelfPlay(m: ShelfItem): void {
    const kid = this.kids.find((k) => k.name === this._shelf);
    const room = (kid && kidSpeaker(this.hass!, kid, this._list)) ?? this._cur;
    this._start(m, 'play', false, room);
    // at wind-down a child's shelf plays quietly towards sleep
    if (kid && room && windDown(kid.bedtime)) { if (sleepIn(this.hass!, room.entity_id, this.sleepMinutes)) window.setTimeout(() => this._say(`Fading out in ${this.sleepMinutes} minutes. Sleep well.`), 3400); }
  }
  private _pin(to: string, calm: boolean): void {
    const m = this._pinTo, e = shelfEntity(to); if (!m) return;
    this._pinTo = null;
    if (!this.hass!.states[e]) { this._say(`Create the to-do list ${e} in Home Assistant first`); return; }
    pinToShelf(this.hass!, e, m, calm).then(() => { this._say(`Pinned to ${to === 'Family' ? 'the family shelf' : `${to}’s shelf`}`); this._loadShelves(); });
  }
  private _unpin(m: ShelfItem): void { this.hass!.callService('todo', 'remove_item', { item: m.uid }, { entity_id: shelfEntity(this._shelf) }).then(() => this._loadShelves()); }

  /* ---------------- jukebox ---------------- */
  private _saveJuke(j: Partial<Juke>): void { this._juke = { ...this._juke, ...j }; lsSet('fh-juke', this._juke); }
  /** Whose pick is next: tonight's DJ first, then whoever has had the fewest turns. */
  private _nextPick(): Pick | undefined {
    const pend = this._juke.picks.filter((p) => !p.done), turns = (w: string): number => this._juke.picks.filter((p) => p.done && p.who === w).length;
    return pend.sort((a, b) => Number(b.who === this._dj) - Number(a.who === this._dj) || turns(a.who) - turns(b.who) || a.t - b.t)[0];
  }
  /** Keep exactly one pick queued ahead, so the order can stay fair as people add songs. */
  private _feed(ended = false): boolean {
    const p = this._cur, j = this._juke;
    if (!j.on || !p || !this.hass) return false;
    const idle = p.state !== 'playing' && p.state !== 'buffering', track = String(p.attributes.media_content_id ?? '');
    // what follows the current song is already one of tonight's picks: nothing to do yet
    const ours = !!this._q?.next && this._q.next.name === this._fedName;
    if (!(ended || idle) && (!this._q || ours)) return false;
    if (!ended && !idle && this._fedFor === track) return false; // one pick queued per song: the queue has not caught up yet
    const n = this._nextPick(); if (!n) return false;
    this._fedFor = track; this._fedName = n.name;
    n.done = true; this._saveJuke({ picks: [...j.picks] }); this._lastUri = n.uri;
    // nothing playing: start it. Otherwise it follows the current song, replacing whatever else was queued.
    play(this.hass, p.entity_id, n.uri, ended || idle ? 'play' : this._q?.next ? 'replace_next' : 'add').catch((e: any) => this._say(`Couldn’t queue ${n.name}: ${e?.message ?? 'error'}`));
    this._qKey = '';
    return true;
  }
  private _addPick(m: MediaHit): void {
    const who = this._juke.who || this._everyone[0]?.name || 'Someone';
    this._saveJuke({ on: true, picks: [...this._juke.picks, { ...m, who, t: Date.now() }] });
    this._say(`${who} added ${m.name}`); this._adding = false; this._tab = 'juke'; this._feed();
  }

  /* ---------------- call a room ---------------- */
  private _call(checked = false): void {
    const msg = this._callMsg.trim(), to = this._callTo.length ? this._callTo : [];
    const tts = Object.keys(this.hass!.states).filter((e) => e.startsWith('tts.')).sort((a, b) => Number(b.includes('cloud')) - Number(a.includes('cloud')))[0];
    if (!msg) { this._say('Pick or type a message first'); return; }
    if (!to.length) { this._say('Pick a room first'); return; }
    if (!tts) { this._say('Home Assistant has no voice set up for speaking'); return; }
    if (Date.now() - this._lastCall < 15_000) { this._say('Give it a moment before calling again'); return; }
    if (!checked && this.pin && isQuiet(new Date(), this.quiet.start ?? '20:00', this.quiet.end ?? '06:30')) { this._pinAsk = { reason: 'Quiet time. Call anyway?', run: () => this._call(true) }; return; }
    this._lastCall = Date.now();
    for (const id of to) this.hass!.callService('tts', 'speak', { media_player_entity_id: id, message: msg, cache: true }, { entity_id: tts }).catch((e: any) => this._say(`Couldn’t call ${this._name(this.hass!.states[id])}: ${e?.message ?? 'error'}`));
    this._say(`Calling ${to.length === 1 ? this._name(this.hass!.states[to[0]]) : `${to.length} rooms`}`);
  }

  /* ---------------- render ---------------- */
  render(): TemplateResult | typeof nothing {
    if (!this.hass) return nothing;
    const p = this._cur, ma = hasMa(this.hass);
    const tabs: [Tab, string][] = [['rooms', 'Rooms'], ...(ma ? [['search', 'Search'], ['shelves', 'Shelves'], ['juke', 'Jukebox']] as [Tab, string][] : []), ['radio', 'Radio'], ['call', 'Call a room']];
    const open = (id: Tab): void => { this._tab = id; this._adding = false; if (id === 'radio') this._loadRadio(); if (id === 'shelves') this._loadShelves(); };
    return html`${p ? this._hero(p) : html`<section class="glass stage"><div class="deck">No speakers found</div></section>`}
      <section class="glass panel">
        <div style="display:flex;align-items:center;gap:12px"><h1 class="t-title" style="flex:1">Music</h1>
          <div class="tabs" role="tablist">${tabs.map(([id, l]) => html`<button class="tap" role="tab" aria-pressed=${String(this._tab === id)} @click=${() => open(id)}>${l}</button>`)}</div></div>
        ${this._tab === 'rooms' ? this._rooms() : this._tab === 'search' ? this._searchTab() : this._tab === 'shelves' ? this._shelves() : this._tab === 'juke' ? this._jukeTab() : this._tab === 'radio' ? this._radio() : this._callTab()}
      </section>
      ${this._pinTo ? this._pinSheet() : nothing}
      ${this._pinAsk ? html`<fh-pin .pin=${String(this.pin)} reason=${this._pinAsk.reason} @ok=${() => { const r = this._pinAsk!.run; this._pinAsk = null; r(); }} @cancel=${() => { this._pinAsk = null; }}></fh-pin>` : nothing}
      ${this._msg ? html`<div class="toast" role="status">${this._msg}</div>` : nothing}`;
  }

  private _hero(p: HassEntity): TemplateResult {
    const a = p.attributes, playing = p.state === 'playing', art = a.entity_picture ? `url(${a.entity_picture})` : '';
    const vol = typeof a.volume_level === 'number' ? Math.round(a.volume_level * 100) : null, mix = this._mix(p).length, q = this._q;
    const dur = Number(a.media_duration) || 0, at = a.media_position_updated_at ? new Date(a.media_position_updated_at).getTime() : 0;
    const pos = dur ? Math.min(dur, (Number(a.media_position) || 0) + (playing && at ? (this._now - at) / 1000 : 0)) : 0, frac = dur ? pos / dur : 0;
    const deck = lookArt(getLook(), 'player', { img: a.entity_picture, frac, playing });
    return html`<section class="glass stage" style=${art ? `--art:${art}` : ''} aria-label="Now playing">
      <div class="bg"></div>
      <div style="display:flex;align-items:center;gap:8px"><span class="live" style="${playing ? '' : 'animation:none;background:rgba(255,255,255,.5)'}"></span>
        <span style="font-size:13px;font-weight:var(--w-bold, 700);text-transform:uppercase;letter-spacing:.06em;opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${playing ? 'Playing in' : 'Ready in'} ${this._name(p)}${mix ? ` + ${mix} more` : ''}</span></div>
      <div class="deck">${deck === nothing ? html`<div class="cover ${playing ? '' : 'paused'}"></div>` : deck}</div>
      <div class="titles" style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <span class="display" style="font-size:24px;font-weight:var(--w-heavy, 800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.media_title ?? (p.state === 'off' ? 'Off' : 'Nothing playing')}</span>
        <span style="font-size:15px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.media_artist ?? a.media_album_name ?? 'Search, pick from a shelf or tap a station'}</span>
      </div>
      ${dur ? html`<div class="bar" role="progressbar" aria-label="Track progress" aria-valuenow=${Math.round(frac * 100)} aria-valuemin="0" aria-valuemax="100"><i style="width:${frac * 100}%"></i></div>` : nothing}
      <div class="ctl">
        <button class="tap" aria-label="Shuffle" aria-pressed=${String(!!a.shuffle)} @click=${() => this._svc('shuffle_set', { shuffle: !a.shuffle })}>${icon('shuffle', 22)}</button>
        <button class="tap" aria-label="Previous" @click=${() => this._svc('media_previous_track')}>${solid('prev', 28)}</button>
        <button class="tap go" aria-label=${playing ? 'Pause' : 'Play'} @click=${() => this._svc('media_play_pause')}>${solid(playing ? 'pause' : 'play', 30)}</button>
        <button class="tap" aria-label="Next" @click=${() => this._svc('media_next_track')}>${solid('next', 28)}</button>
        <button class="tap" aria-label="Save this song to favourites" @click=${() => this._heart()}>♥</button>
      </div>
      <div class="upnext">${q?.next ? html`<span style="opacity:.7">Up next</span><b style="overflow:hidden;text-overflow:ellipsis">${q.next.name}</b>${q.items > 2 ? html`<span style="opacity:.7">+${q.items - 2} more</span>` : nothing}` : this._juke.on ? html`<span>🎶 Jukebox is on · ${this._juke.picks.filter((x) => !x.done).length} waiting</span>` : nothing}</div>
      <div class="mini">
        <button class="tog tap" aria-pressed=${String(this._keep)} title="When the music runs out, carry on with similar songs" @click=${() => { this._keep = !this._keep; lsSet('fh-keep', this._keep); this._say(this._keep ? 'When the music runs out, I’ll keep it going' : 'The music will stop at the end'); }}>∞ Keep going</button>
        <button class="tog tap" @click=${() => this._sleep()}>🌙 Sleep ${this.sleepMinutes}</button>
      </div>
      ${vol !== null ? html`<div style="display:flex;align-items:center;gap:12px"><span style="opacity:.7">${icon('music', 18)}</span>
        <input type="range" min="0" max="100" .value=${String(vol)} aria-label="Volume in ${this._name(p)}" @change=${(e: Event) => this._svc('volume_set', { volume_level: Number((e.target as HTMLInputElement).value) / 100 })}>
        <span style="width:30px;text-align:right;font-size:13px;font-weight:var(--w-bold, 700);opacity:.8">${vol}</span></div>` : nothing}
    </section>`;
  }

  private _rooms(): TemplateResult {
    const cur = this._cur, mix = this._mix(cur), ma = hasMa(this.hass!);
    const sonos = Object.keys(this.hass!.states).find((id) => id.startsWith('media_player.') && (this.hass!.entities?.[id] as { platform?: string } | undefined)?.platform === 'sonos');
    const tv = sonos && this.hass!.states[sonos].attributes.source === 'TV' ? sonos : '';
    const sw = (re: RegExp, label: string): TemplateResult | typeof nothing => {
      const id = tv && sibling(this.hass!, tv, re); if (!id) return nothing;
      const on = this.hass!.states[id].state === 'on';
      return html`<button class="pill tap" aria-pressed=${String(on)} style=${on ? 'background:var(--primary);color:var(--on-primary)' : ''} @click=${() => this.hass!.callService('switch', on ? 'turn_off' : 'turn_on', {}, { entity_id: id })}>${label} ${on ? 'on' : 'off'}</button>`;
    };
    return html`<div class="acts">
        <button class="pill tap primary" @click=${() => this._everywhere(true)}>Everywhere</button>
        ${mix.length ? html`<button class="pill tap" @click=${() => this._everywhere(false)}>Just ${this._name(cur)}</button>` : nothing}
        <span class="soft" style="flex:1">Tap a room to control it. ＋ adds it to the music.</span>
        ${tv ? html`<span class="soft">TV sound</span>${sw(/^switch\..*night_sound$/, 'Night')}${sw(/^switch\..*speech_enhancement$/, 'Clear speech')}` : nothing}
      </div>
      <div class="grid scrolly" data-fits @scroll=${scrollCue}>${this._list.map((p) => {
      const a = p.attributes, playing = p.state === 'playing', focus = p.entity_id === cur?.entity_id, inmix = mix.includes(p.entity_id);
      const vol = typeof a.volume_level === 'number' ? Math.round(a.volume_level * 100) : null;
      return html`<div class="spk ${focus ? 'focus' : inmix ? 'inmix' : ''}">
        <div class="top"><button class="rsel tap" aria-pressed=${String(focus)} @click=${() => { this._focus = p.entity_id; }}>
          <span class="thumb ${playing ? 'eq' : ''}" style=${a.entity_picture ? `--art:url(${a.entity_picture})` : ''}>${playing ? html`<i></i><i></i><i></i>` : icon('music', 20)}</span>
          <span style="display:flex;flex-direction:column;min-width:0;gap:2px"><span style="font-size:15px;font-weight:var(--w-bold, 700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.friendly_name}</span>
            <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${inmix ? `With ${this._name(cur)}` : playing ? (a.media_title ?? 'Playing') : p.state[0].toUpperCase() + p.state.slice(1)}</span></span></button>
          ${focus ? nothing : html`<button class="join tap" aria-pressed=${String(inmix)} aria-label="${inmix ? 'Remove' : 'Add'} ${a.friendly_name} ${inmix ? 'from' : 'to'} the music" @click=${() => this._join(p.entity_id)}>${inmix ? '✓' : '＋'}</button>`}</div>
        ${vol !== null ? html`<input type="range" min="0" max="100" .value=${String(vol)} aria-label="Volume in ${a.friendly_name}" @change=${(e: Event) => this._svc('volume_set', { volume_level: Number((e.target as HTMLInputElement).value) / 100 }, p.entity_id)}>` : nothing}
        ${!focus && !inmix && ma && cur?.state === 'playing' ? html`<button class="pill tap" style="height:36px;font-size:13px;align-self:flex-start" @click=${() => this._move(p)}>Move the music here</button>` : nothing}
      </div>`;
    })}</div>`;
  }

  private _searchTab(): TemplateResult {
    const hits = this._hits, sel = hits?.find((h) => h.uri === this._sel);
    return html`${this._adding ? html`<div class="banner">🎶 Adding to the jukebox for ${this._juke.who || 'everyone'}<span style="flex:1"></span><button class="pill tap" style="height:36px" @click=${() => { this._adding = false; this._tab = 'juke'; }}>Back</button></div>` : nothing}
      <div style="display:flex;gap:10px"><input class="field" inputmode="none" aria-label="Search for music" placeholder="A song, an album, a story…" .value=${this._text}
          @focus=${() => { this._keys = true; }} @input=${(e: Event) => { this._text = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._search(); }}>
        <button class="pill tap primary" style="height:52px;padding:0 22px;font-size:16px" ?disabled=${this._busy} @click=${() => this._search()}>${this._busy ? 'Looking…' : 'Search'}</button>
        ${hits ? html`<button class="round tap" style="width:52px;height:52px;font-size:17px;font-weight:var(--w-heavy, 800)" aria-label=${this._keys ? 'Hide the keyboard' : 'Show the keyboard'} @click=${() => { this._keys = !this._keys; }}>${this._keys ? icon('close', 20) : 'Aa'}</button>` : nothing}</div>
      ${this._keys ? html`<div style="margin:auto 0">${keyboard((k) => { [this._text, this._caps] = typeKey(this._text, k, this._caps); }, this._caps, () => { this._caps = !this._caps; }, true)}</div>` : nothing}
      ${hits && !this._keys ? (hits.length ? html`<div class="hits scrolly" data-fits @scroll=${scrollCue}>${hits.map((h) => html`<button class="hit tap" aria-pressed=${String(h.uri === this._sel)} @click=${() => { this._sel = h.uri; }}>
          <span class="art" style=${h.img ? `--art:url(${h.img})` : ''}>${h.img ? '' : icon('music', 18)}</span>
          <span class="tx"><b>${h.name}</b><span>${h.sub ?? ''}</span></span><span class="kind">${TYPE_LABEL[h.type] ?? h.type}</span></button>`)}</div>
        <div class="acts">${sel ? (this._adding ? html`<button class="pill tap primary" style="height:48px;padding:0 20px" @click=${() => this._addPick(sel)}>＋ Add to the jukebox</button>`
          : html`<button class="pill tap primary" style="height:48px;padding:0 20px" @click=${() => this._start(sel)}>▶ Play in ${this._name(this._cur)}</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(sel, 'next')}>Play next</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(sel, 'add')}>＋ Queue</button>
            <button class="pill tap" style="height:48px" @click=${() => this._start(sel, 'play', true)}>∞ Radio from this</button>
            <button class="pill tap" style="height:48px" @click=${() => this._guard('Pin to a shelf?', () => { this._pinTo = sel; })}>📌 Pin</button>`) : html`<span class="soft">Tap a result to play it, queue it or pin it to a shelf.</span>`}</div>`
        : html`<div class="empty"><span>Nothing found for “${this._text}”. Try fewer words.</span></div>`) : nothing}`;
  }

  private _pinSheet(): TemplateResult {
    const m = this._pinTo!;
    return html`<div class="scrim" style="border-radius:28px" @click=${(e: Event) => { if (e.target === e.currentTarget) this._pinTo = null; }}>
      <section class="glass sheet" role="dialog" aria-modal="true" aria-label="Pin to a shelf" style="width:min(560px,92%);gap:12px">
        <h2 class="t-head">Pin “${m.name}”</h2><span class="soft">Whose shelf? Calm picks are the only ones offered at wind-down.</span>
        ${this._shelfNames.map((n) => html`<div class="setrow"><b style="font-size:17px">${n === 'Family' ? 'Family shelf' : `${n}’s shelf`}</b><span style="display:flex;gap:8px">
          <button class="pill tap primary" @click=${() => this._pin(n, false)}>Pin</button><button class="pill tap" @click=${() => this._pin(n, true)}>🌙 Pin as calm</button></span></div>`)}
        <button class="pill tap" style="align-self:flex-end" @click=${() => { this._pinTo = null; }}>Cancel</button></section></div>`;
  }

  private _shelves(): TemplateResult {
    const kid = this.kids.find((k) => k.name === this._shelf), wind = !!kid && windDown(kid.bedtime);
    const all = this._items[this._shelf] ?? [], list = wind ? all.filter((x) => x.calm) : all;
    const room = (kid && kidSpeaker(this.hass!, kid, this._list)) ?? this._cur;
    const colour = (n: string): string => slotVar(this.kids.find((k) => k.name === n)?.colour ?? 'family');
    return html`<div class="chiprow">${this._shelfNames.map((n) => html`<button class="pchip tap" style="--c:${colour(n)}" aria-pressed=${String(this._shelf === n)} @click=${() => { this._shelf = n; this._edit = false; }}>
        <span class="avatar">${n[0]}</span>${n}</button>`)}
        <span style="flex:1"></span><span class="soft">Plays in ${this._name(room)}</span>
        ${all.length ? html`<button class="pill tap" @click=${() => { if (this._edit) this._edit = false; else this._guard('Change this shelf?', () => { this._edit = true; }); }}>${this._edit ? 'Done' : 'Edit'}</button>` : nothing}</div>
      ${wind ? html`<div class="banner">🌙 Wind-down: calm picks only, fading out after ${this.sleepMinutes} minutes.</div>` : nothing}
      ${list.length ? html`<div class="covers scrolly" data-fits @scroll=${scrollCue}>${list.map((m) => html`<button class="st tap" @click=${() => { if (!this._edit) this._shelfPlay(m); }}>
          <span class="img" style=${m.img ? `--art:url(${m.img})` : ''}>${m.img ? '' : m.name[0]}</span><span class="lbl">${m.calm ? '🌙 ' : ''}${m.name}</span>
          ${this._edit ? html`<span class="x tap" role="button" aria-label="Remove ${m.name}" @click=${(e: Event) => { e.stopPropagation(); this._unpin(m); }}>✕</span>` : nothing}</button>`)}</div>`
        : html`<div class="empty"><span style="font-size:40px">📚</span><h2 class="t-sub">${wind ? 'Nothing calm pinned yet' : 'Nothing pinned yet'}</h2>
          <span>${this.hass!.states[shelfEntity(this._shelf)] ? 'Search for an album, a playlist or a story, then tap Pin.' : `This shelf needs the to-do list ${shelfEntity(this._shelf)} in Home Assistant.`}</span></div>`}`;
  }

  private _jukeTab(): TemplateResult {
    const j = this._juke, short = shortNames(this._everyone.map((p) => p.name)), col = (n: string): string => slotVar(this._everyone.find((p) => p.name === n)?.colour ?? 'family');
    const next = this._nextPick();
    return html`${this._dj ? html`<div class="banner">🎧 ${this._dj} is the DJ tonight: ${this._dj}’s picks play first.</div>` : nothing}
      <div class="chiprow"><span class="soft">Who’s choosing?</span>${this._everyone.map((p) => html`<button class="pchip tap" style="--c:${slotVar(p.colour)}" aria-pressed=${String(j.who === p.name)} @click=${() => this._saveJuke({ who: p.name })}>
        <span class="avatar">${short[p.name] ?? p.name[0]}</span>${p.name}</button>`)}</div>
      <div class="acts"><button class="pill tap primary" style="height:48px;padding:0 20px" ?disabled=${!j.who} @click=${() => { this._adding = true; this._tab = 'search'; this._keys = true; this._hits = null; this._text = ''; this._caps = true; }}>＋ ${j.who ? `${j.who} adds a song` : 'Pick who’s choosing'}</button>
        <button class="pill tap" aria-pressed=${String(j.on)} style="height:48px;${j.on ? 'background:var(--ok);color:var(--on-ok,#fff)' : ''}" @click=${() => { this._saveJuke({ on: !j.on }); if (!j.on) this._feed(); }}>${j.on ? 'Jukebox is on' : 'Jukebox is off'}</button>
        <span class="soft" style="flex:1">Everyone gets a turn: the next song comes from whoever has had the fewest.</span>
        ${j.picks.length ? html`<button class="pill tap" @click=${() => this._saveJuke({ picks: [] })}>Clear</button>` : nothing}</div>
      ${j.picks.length ? html`<div class="picks scrolly" data-fits @scroll=${scrollCue}>${[...j.picks].sort((a, b) => Number(!!b.done) - Number(!!a.done) || a.t - b.t).map((p) => html`<div class="pickrow ${p.done ? 'played' : ''}">
          <span class="init" style="--c:${col(p.who)}" role="img" aria-label=${p.who}>${short[p.who] ?? p.who[0]}</span><span class="art" style=${p.img ? `--art:url(${p.img})` : ''}></span>
          <span class="nm">${p.name}${p.sub ? html` <span class="muted" style="font-weight:var(--w-semi, 600)">· ${p.sub}</span>` : nothing}</span>
          <span class="soft">${p.done ? 'Played' : p === next ? 'Next' : 'Waiting'}</span></div>`)}</div>`
        : html`<div class="empty"><span style="font-size:40px">🎶</span><h2 class="t-sub">The jukebox is empty</h2><span>Pick who’s choosing, then add a song.</span></div>`}`;
  }

  private _radio(): TemplateResult {
    const cur = this._cur, playingName = cur && cur.state === 'playing' ? LAST[cur.entity_id] : '';
    return html`<span class="muted" style="font-size:13px">Tap a station to play it on <b>${this._cur?.attributes.friendly_name ?? 'a speaker'}</b>. Pick a different room in the Rooms tab.</span>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${this._stations.map((s) => {
        const th = this._thumbs[s.name], on = playingName === s.name;
        return html`<button class="st tap ${on ? 'on' : ''}" @click=${() => this._play(s)}>
          <span class="img" style=${th ? `--art:url(${th})` : `background:linear-gradient(135deg, var(--p-${(s.name.length % 5) + 1}), var(--primary));color:#fff`}>${th ? '' : s.name.split(' ').map((w) => w[0]).join('').slice(0, 3)}</span>${s.name}</button>`;
      })}</div>`;
  }


  private _callTab(): TemplateResult {
    const all = this._list.map((p) => p.entity_id), every = all.length > 0 && all.every((id) => this._callTo.includes(id));
    const flip = (id: string): void => { this._callTo = this._callTo.includes(id) ? this._callTo.filter((x) => x !== id) : [...this._callTo, id]; };
    return html`<div class="chiprow"><span class="soft">Where?</span>
        <button class="pchip tap" style="padding:0 14px" aria-pressed=${String(every)} @click=${() => { this._callTo = every ? [] : all; }}>Everyone</button>
        ${this._list.map((p) => html`<button class="pchip tap" style="padding:0 14px" aria-pressed=${String(this._callTo.includes(p.entity_id))} @click=${() => flip(p.entity_id)}>${p.attributes.friendly_name}</button>`)}</div>
      <div class="msgs" style=${this._ckeys ? 'display:none' : ''}>${CALLS.map((m) => html`<button class="tap" aria-pressed=${String(this._callMsg === m)} @click=${() => { this._callMsg = m; }}>${m}</button>`)}</div>
      <div style="display:flex;gap:10px"><input class="field" inputmode="none" aria-label="Message to say" placeholder="Or type what to say…" .value=${this._callMsg} @focus=${() => { this._ckeys = true; }} @input=${(e: Event) => { this._callMsg = (e.target as HTMLInputElement).value; }}>
        <button class="pill tap primary" style="height:52px;padding:0 24px;font-size:16px" @click=${() => this._call()}>📣 Say it</button></div>
      ${this._ckeys ? html`<div style="margin:auto 0 0">${keyboard((k) => { [this._callMsg, this._caps] = typeKey(this._callMsg, k, this._caps); }, this._caps, () => { this._caps = !this._caps; }, true)}</div>`
        : html`<span class="soft">It is spoken over the music in that room, then the music carries on.</span>`}`;
  }
}
if (!customElements.get('fh-music')) customElements.define('fh-music', FhMusic);
