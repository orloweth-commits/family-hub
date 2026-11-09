import { LitElement, html, css, nothing, type TemplateResult } from 'lit';
import { styles } from './styles';
import { icon, solid } from './icons';
import type { Hass, HassEntity, StationConfig } from './types';

type Tab = 'rooms' | 'radio' | 'apple' | 'spotify';
/** Survives page switches: radio lookup is a 1,500-row browse, so do it once per session. */
const CACHE: { thumbs: Record<string, string>; res: Record<string, string>; key: string } = { thumbs: {}, res: {}, key: '' };
const LAST: Record<string, string> = {};
const DEFAULT_STATIONS: StationConfig[] = [{ name: 'ABC Kids listen', match: 'ABC Kids listen' }, { name: 'ABC Jazz', match: 'ABC Jazz' }];

/** Music: every speaker in the house, a focused "now playing" hero, and local radio. */
export class FhMusic extends LitElement {
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .hero { width: 420px; flex-shrink: 0; border-radius: 28px; padding: 22px; display: flex; flex-direction: column; gap: 14px; position: relative; overflow: hidden; color: #fff; background: #111; }
    .hero .bg { position: absolute; inset: -40px; background: var(--art) center / cover; filter: blur(40px) saturate(160%) brightness(.65); transform: scale(1.2); transition: background .6s; }
    .hero > *:not(.bg) { position: relative; }
    .cover { width: 100%; aspect-ratio: 1; max-height: 300px; border-radius: 22px; background: var(--art, linear-gradient(135deg, var(--accent), var(--primary))) center / cover; box-shadow: 0 20px 50px -12px rgba(0,0,0,.6); align-self: center; max-width: 300px; transition: transform .5s cubic-bezier(.2,1.2,.4,1); }
    .cover.paused { transform: scale(.88); }
    .ctl { display: flex; align-items: center; justify-content: center; gap: 30px; }
    .ctl button { color: #fff; }
    .big { width: 70px; height: 70px; border-radius: 50%; background: #fff; color: #111 !important; display: flex; align-items: center; justify-content: center; }
    input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: rgba(255,255,255,.3); outline: none; }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 26px; height: 26px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
    .panel { flex: 1; min-width: 0; border-radius: 28px; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
    .tabs { display: flex; gap: 6px; }
    .tabs button { height: 42px; padding: 0 18px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: 600; }
    .tabs button[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
    .grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; align-content: start; }
    .room { border-radius: 20px; background: var(--chip); padding: 12px; display: flex; gap: 12px; align-items: center; text-align: left; }
    .room[aria-pressed='true'] { background: var(--chip-strong); box-shadow: 0 0 0 3px var(--primary); }
    .thumb { width: 52px; height: 52px; border-radius: 12px; background: var(--art, var(--track)) center / cover; flex-shrink: 0; display: flex; align-items: flex-end; justify-content: center; gap: 3px; padding-bottom: 8px; }
    .eq i { width: 4px; border-radius: 2px; background: #fff; animation: eq .9s ease-in-out infinite alternate; box-shadow: 0 0 4px rgba(0,0,0,.4); }
    .eq i:nth-child(2) { animation-delay: .3s; } .eq i:nth-child(3) { animation-delay: .6s; }
    @keyframes eq { from { height: 4px; } to { height: 22px; } }
    .st { border-radius: 20px; background: var(--chip); padding: 10px; display: flex; flex-direction: column; gap: 8px; text-align: left; font-size: 14px; font-weight: 700; }
    .st .img { aspect-ratio: 1; border-radius: 14px; background: var(--art, linear-gradient(135deg, var(--p-1), var(--p-3))) center / contain no-repeat, #fff; display: flex; align-items: center; justify-content: center; font-family: 'Bricolage Grotesque', sans-serif; font-size: 26px; font-weight: 800; color: var(--ink2); }
    .st.on { box-shadow: 0 0 0 3px var(--ok); }
    .soon { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; padding: 20px; }
    .soon .logo { width: 96px; height: 96px; border-radius: 26px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 44px; box-shadow: 0 14px 30px -10px rgba(0,0,0,.45); }
  `];

  static properties = { hass: { attribute: false }, players: { attribute: false }, stations: { attribute: false }, source: {}, preferred: {},
    _tab: { state: true }, _focus: { state: true }, _thumbs: { state: true }, _resolved: { state: true }, _msg: { state: true } };
  hass?: Hass;
  players: string[] = [];
  stations: (string | StationConfig)[] = [];
  source = 'media-source://radio_browser/country/AU';
  preferred = '';
  private _tab: Tab = 'rooms';
  private _focus = '';
  private _thumbs: Record<string, string> = {};
  private _resolved: Record<string, string> = {};
  private _loaded = false;
  private _msg = '';
  private _t?: number;

  private _say(m: string): void { this._msg = m; clearTimeout(this._t); this._t = window.setTimeout(() => { this._msg = ''; }, 2400); }

  private get _list(): HassEntity[] {
    const h = this.hass!;
    const ids = this.players.length ? this.players : Object.keys(h.states).filter((id) => id.startsWith('media_player.'));
    return ids.map((id) => h.states[id]).filter((s): s is HassEntity => !!s && s.state !== 'unavailable');
  }
  private get _cur(): HassEntity | undefined {
    const l = this._list;
    return l.find((p) => p.entity_id === this._focus) ?? l.find((p) => p.entity_id === this.preferred) ?? l.find((p) => p.state === 'playing') ?? l[0];
  }
  private get _stations(): StationConfig[] {
    const s = this.stations.length ? this.stations : DEFAULT_STATIONS;
    return s.map((x) => typeof x === 'string' ? { name: x, match: x } : x);
  }

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

  private _svc(service: string, data: Record<string, unknown> = {}): void {
    const p = this._cur;
    if (p) this.hass!.callService('media_player', service, { entity_id: p.entity_id, ...data });
  }
  private _play(st: StationConfig): void {
    const p = this._cur, id = this._resolved[st.name];
    if (!p) return;
    if (!id) { this._say(`Couldn’t find ${st.name} – check the station list`); return; }
    this.hass!.callService('media_player', 'play_media', { entity_id: p.entity_id, media_content_id: id, media_content_type: 'music' })
      .then(() => { LAST[p.entity_id] = st.name; this.requestUpdate(); this._say(`${st.name} on ${p.attributes.friendly_name}`); })
      .catch((e: any) => this._say(`${p.attributes.friendly_name} couldn’t play that: ${e?.message ?? 'error'}`));
  }

  render(): TemplateResult | typeof nothing {
    if (!this.hass) return nothing;
    const p = this._cur;
    return html`${p ? this._hero(p) : html`<section class="glass hero"><div class="soon">No speakers found</div></section>`}
      <section class="glass panel">
        <div style="display:flex;align-items:center;gap:12px"><h1 style="flex:1;font-size:26px;font-weight:800">Music</h1>
          <div class="tabs" role="tablist">${([['rooms', 'Speakers'], ['radio', 'Radio'], ['apple', 'Apple Music'], ['spotify', 'Spotify']] as [Tab, string][])
            .map(([id, l]) => html`<button class="tap" role="tab" aria-pressed=${String(this._tab === id)} @click=${() => { this._tab = id; if (id === 'radio') this._loadRadio(); }}>${l}</button>`)}</div></div>
        ${this._tab === 'radio' && !Object.keys(this._resolved).length ? html`<span class="muted" style="font-size:13px">Tuning in…</span>` : nothing}
        ${this._tab === 'rooms' ? this._rooms() : this._tab === 'radio' ? this._radio() : this._soon(this._tab)}
      </section>
      ${this._msg ? html`<div class="toast" role="status">${this._msg}</div>` : nothing}`;
  }

  private _hero(p: HassEntity): TemplateResult {
    const a = p.attributes, playing = p.state === 'playing', art = a.entity_picture ? `url(${a.entity_picture})` : '';
    const vol = typeof a.volume_level === 'number' ? Math.round(a.volume_level * 100) : null;
    return html`<section class="glass hero" style=${art ? `--art:${art}` : ''} aria-label="Now playing">
      <div class="bg"></div>
      <div style="display:flex;align-items:center;gap:8px"><span class="live" style="${playing ? '' : 'animation:none;background:rgba(255,255,255,.5)'}"></span>
        <span style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;opacity:.8">${playing ? 'Playing on' : 'Ready on'} ${a.friendly_name}</span></div>
      <div class="cover ${playing ? '' : 'paused'}"></div>
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0">
        <span class="display" style="font-size:26px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.media_title ?? (p.state === 'off' ? 'Off' : 'Nothing playing')}</span>
        <span style="font-size:16px;opacity:.75;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.media_artist ?? a.media_album_name ?? 'Pick a station or start something on your phone'}</span>
      </div>
      <div class="ctl">
        <button class="tap" aria-label="Previous" @click=${() => this._svc('media_previous_track')}>${solid('prev', 30)}</button>
        <button class="tap big" aria-label=${playing ? 'Pause' : 'Play'} @click=${() => this._svc('media_play_pause')}>${solid(playing ? 'pause' : 'play', 32)}</button>
        <button class="tap" aria-label="Next" @click=${() => this._svc('media_next_track')}>${solid('next', 30)}</button>
      </div>
      ${vol !== null ? html`<div style="display:flex;align-items:center;gap:12px;margin-top:auto"><span style="opacity:.7">${icon('music', 18)}</span>
        <input type="range" min="0" max="100" .value=${String(vol)} aria-label="Volume" @change=${(e: Event) => this._svc('volume_set', { volume_level: Number((e.target as HTMLInputElement).value) / 100 })}>
        <span style="width:34px;text-align:right;font-size:13px;font-weight:700;opacity:.8">${vol}</span></div>` : nothing}
    </section>`;
  }

  private _rooms(): TemplateResult {
    const cur = this._cur?.entity_id;
    return html`<div class="grid">${this._list.map((p) => {
      const a = p.attributes, playing = p.state === 'playing';
      return html`<button class="room tap" aria-pressed=${String(p.entity_id === cur)} @click=${() => { this._focus = p.entity_id; }}>
        <span class="thumb ${playing ? 'eq' : ''}" style=${a.entity_picture ? `--art:url(${a.entity_picture})` : ''}>${playing ? html`<i></i><i></i><i></i>` : icon('music', 20)}</span>
        <span style="display:flex;flex-direction:column;min-width:0;gap:2px"><span style="font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.friendly_name}</span>
          <span class="muted" style="font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:capitalize">${playing ? (a.media_title ?? 'Playing') : p.state}</span></span>
      </button>`;
    })}</div>`;
  }

  private _radio(): TemplateResult {
    const cur = this._cur, playingName = cur && cur.state === 'playing' ? LAST[cur.entity_id] : '';
    return html`<span class="muted" style="font-size:13px">Tap a station to play it on <b>${this._cur?.attributes.friendly_name ?? 'a speaker'}</b>. Pick a different speaker in the Speakers tab.</span>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${this._stations.map((s) => {
        const th = this._thumbs[s.name], on = playingName === s.name;
        return html`<button class="st tap ${on ? 'on' : ''}" @click=${() => this._play(s)}>
          <span class="img" style=${th ? `--art:url(${th})` : `background:linear-gradient(135deg, var(--p-${(s.name.length % 5) + 1}), var(--primary));color:#fff`}>${th ? '' : s.name.split(' ').map((w) => w[0]).join('').slice(0, 3)}</span>${s.name}</button>`;
      })}</div>`;
  }

  private _soon(t: Tab): TemplateResult {
    const apple = t === 'apple';
    return html`<div class="soon">
      <span class="logo" style="background:${apple ? 'linear-gradient(135deg,#fa2d48,#fc5c7d)' : '#1db954'}">${solid('play', 44)}</span>
      <h2 style="font-size:24px">${apple ? 'Apple Music' : 'Spotify'} is nearly ready</h2>
      <span class="muted" style="max-width:420px">This needs the Music Assistant add-on in Home Assistant${apple ? '' : ' and a Spotify Premium account'}. Once it’s connected, playlists and search will appear here and play to any speaker.</span>
      <span class="muted" style="font-size:13px">Until then, AirPlay from a phone to any HomePod or the Sonos works as normal.</span>
    </div>`;
  }
}
if (!customElements.get('fh-music')) customElements.define('fh-music', FhMusic);
