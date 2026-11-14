import { LitElement, html, css, unsafeCSS, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { avatarCss, applyItem, decodeLook, encodeLook, isUnlocked, isWorn, levelInfo, nextUnlock, prevThreshold, renderAvatar, type Category, type Item, type Look } from './avatar';
import { FitController, linger, say, scrollCue, sfx } from './util';
import { confetti, fxCss } from './fx';
import { kidEntities, num, slotVar, type Hass, type KidConfig } from './types';
import { catalogueOf, itemEmoji, lookFile, lookKey, lookPrompt, wardrobeLook } from './wardrobe';
import { cropJpeg, keepMedia, localFiles, painter, paint } from './media';
import { ART_DEFAULTS, loadArt, logArt, looksToday, monthSpend, type ArtConfig, type ArtItem } from './artlib';

/** Looks being painted right now, by file: the painting carries on if the child leaves the studio, and a second tap never starts a second one. */
const painting = new Map<string, { at: number; done: Promise<string> }>();
const WAITS = ['Mixing the colours…', 'Sketching your face…', 'Finding the right hat…', 'Painting very carefully…', 'Adding the sparkle…', 'Nearly there…'];
/** Have a look painted from the child's character sheet, keep the picture in Home Assistant's media and note it in the record. Gives the file's name. */
const paintLook = (hass: Hass, kid: KidConfig, look: Look, art: ArtConfig): Promise<string> => {
  const file = lookFile(kidEntities(kid).slug, look), going = painting.get(file);
  if (going) return going.done;
  const done = (async (): Promise<string> => {
    const made = await paint(hass, painter(hass, art.painter), 'Family Hub look', lookPrompt(look, kid.about), [kid.sheet!]);
    const jpg = await cropJpeg(await (await fetch(made.url)).blob(), 768, 1, 1 / 3);
    if (!await keepMedia(hass, file, jpg)) throw new Error('The picture could not be kept');
    await logArt(hass, art.list || 'todo.family_hub_art', file, { kind: 'look', who: [kid.name] });
    return file;
  })().finally(() => { painting.delete(file); });
  painting.set(file, { at: Date.now(), done });
  return done;
};

/** How many locked things a group shows: the nearest few. The rest appear as they come within reach, so the catalogue never looks mostly closed. */
export const LOCKED_SHOWN = 3;
/** What a group shows: everything unlocked, the nearest locked things (by points first; surprises fill any places left), and whatever he is saving for. */
export const shownItems = (items: Item[], life: number, grow: number, goal = ''): { show: Item[]; hidden: number } => {
  const locked = items.filter((it) => !isUnlocked(it, life, grow));
  const near = [...locked.filter((it) => !it[3]).sort((a, b) => a[2] - b[2]), ...locked.filter((it) => it[3]).sort((a, b) => (a[3] ?? 0) - (b[3] ?? 0))].slice(0, LOCKED_SHOWN);
  const keep = new Set(near.map((it) => it[0])); if (goal) keep.add(goal);
  const show = items.filter((it) => isUnlocked(it, life, grow) || keep.has(it[0]));
  return { show, hidden: items.length - show.length };
};

/** Avatar Studio: try on everything he has, and see the next few things he can earn. */
export class FhStudio extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; min-width: 0; position: relative; }
    .mirror { width: 380px; flex-shrink: 0; border-radius: 28px; padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; overflow: hidden; }
    .mirror::before { content: ''; position: absolute; inset: auto -30% -30%; height: 60%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 40%, transparent), transparent); }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .grid, :host([data-phone]) .gridwrap { overflow: visible; flex: none; }
    :host([data-shape='tall']) .mirror { width: auto; flex-direction: row; flex-wrap: wrap; justify-content: center; }
    .shelf { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    /* eight tabs in two even rows of four (the picture tabs of a child who cannot read stay in one row) */
    .tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; } .tabs.pics { display: flex; flex-wrap: wrap; }
    .tabs button { height: 44px; /* token */ padding: 0 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-radius: 999px; background: var(--chip); font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
    .pill { font-size: var(--fs-2); }
    .sfoot { display: flex; gap: 10px; width: 100%; margin-top: auto; z-index: 1; }
    /* a sheet's footer stacks and sticks on a phone; the studio's two buttons stay side by side under the picture */
    :host([data-phone]) .mirror > .sfoot { position: static; flex-direction: row; align-items: stretch; margin: 0; padding: 0; background: none; -webkit-backdrop-filter: none; backdrop-filter: none; flex: 1 1 100%; gap: 10px; }
    /* four tabs across a phone: the picture sits over the word, so no word is cut */
    :host([data-phone]) .tabs:not(.pics) button { height: 54px; padding: 4px 2px; font-size: var(--fs-1); line-height: 1.15; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border-radius: 16px; }
    :host([data-phone]) .tabs:not(.pics) .te { font-size: var(--fs-3); line-height: 1; }
    /* the youngest reaches the lower half of a wall panel only: in his studio the way back sits under his picture, just above Done, and the rows of things to choose (and of colours) go under the tiles */
    :host(:not([data-phone]):not([data-shape='tall'])) .mirror.low > .shead { order: 2; margin-top: auto; }
    :host(:not([data-phone]):not([data-shape='tall'])) .mirror.low > .sfoot { order: 3; margin-top: 0; }
    :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low > .tabs { order: 3; }
    :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low > .sw { order: 2; }
    :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .grid { align-content: safe end; }
    /* on a wall panel (900 px or taller) he reaches the lower half only, so his things to choose are one row along the bottom of the card that slides sideways: nothing to choose sits above his reach.
       The row fades at the end that has more, and a big arrow there moves it along for a child who does not know to swipe. */
    .rowgo { display: none; }
    @media (min-height: 900px) {
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low { justify-content: flex-end; gap: 6px; padding-bottom: 12px; }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low > .gridwrap { flex: 0 0 auto; flex-direction: row; align-items: center; gap: 4px; }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .grid { flex: 1 1 0; min-width: 0; display: flex; align-items: stretch; gap: 12px; overflow-x: auto; overflow-y: hidden; overscroll-behavior: contain; scroll-snap-type: x proximity; scrollbar-width: none; padding: 4px 6px; }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .grid::-webkit-scrollbar { display: none; }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .cell { flex: 0 0 164px; scroll-snap-align: start; scroll-margin-left: 6px; }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .tile { white-space: nowrap; justify-content: center; padding: 4px 6px 5px; gap: 4px; }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .grid[data-fwd]:not([data-back]) { -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 56px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 56px), transparent); }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .grid[data-back]:not([data-fwd]) { -webkit-mask-image: linear-gradient(to left, #000 calc(100% - 56px), transparent); mask-image: linear-gradient(to left, #000 calc(100% - 56px), transparent); }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .grid[data-back][data-fwd] { -webkit-mask-image: linear-gradient(to right, transparent, #000 56px calc(100% - 56px), transparent); mask-image: linear-gradient(to right, transparent, #000 56px calc(100% - 56px), transparent); }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .rowgo { display: flex; visibility: hidden; }
      :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .grid[data-fwd] ~ .rowgo.fwd, :host(:not([data-phone]):not([data-shape='tall'])) .shelf.low .grid[data-back] ~ .rowgo.back { visibility: visible; }
      .rowgo { flex: 0 0 60px; width: 60px; height: 60px; /* token */ border-radius: 50%; align-items: center; justify-content: center; background: var(--ink); color: var(--ring-halo, #fff); }
      .rowgo.back { order: -1; }
    }
    .gridwrap { flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column; position: relative; }
    .pill[disabled] { opacity: 1; background: var(--chip-soft); color: var(--ink2); }
    /* "Undo all" with nothing to undo is only resting: no padlock and no dashed edge in any look (those mean "locked") */
    :host([data-look]) .sfoot .pill[disabled] { outline: none; background: var(--chip-soft); color: var(--ink2); } :host([data-look]) .sfoot .pill[disabled]::before { content: none; }
    .label { font-size: var(--fs-2); }
    /* what the studio says sits over the mirror, above its two buttons: never over the things to choose from */
    :host(:not([data-shape='tall'])) .toast { left: 18px; right: auto; margin: 0; max-width: 344px; bottom: 84px; }
    .tabs button[aria-selected='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    .heart { position: absolute; bottom: 30px; right: 2px; width: 44px; height: 44px; /* token */ border-radius: 50%; background: var(--chip-strong); font-size: var(--fs-4); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
    .grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; align-content: start; grid-auto-rows: max-content; padding: 6px 6px 18px; }
    .lock { display: inline-flex; align-items: center; gap: 3px; }
    .lock svg { flex-shrink: 0; }
    .cell { position: relative; display: flex; } .cell > .tile { flex: 1; min-width: 0; }
    .tile { border-radius: 20px; background: var(--chip); padding: 8px 6px 9px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; font-size: var(--fs-2); font-weight: var(--w-bold, 700); text-align: center; }
    .tile[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); background: var(--chip-strong); }
    .tile.locked .av { filter: grayscale(1) brightness(.85); opacity: .55; }
    .lock { position: absolute; top: 8px; right: 8px; padding: 3px 8px; border-radius: 999px; background: #16161c; color: #fff; font-size: var(--fs-2); font-weight: var(--w-heavy, 800); z-index: 2; }
    .cell > .heart { z-index: 2; }
    .sw { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .sw button { width: 44px; height: 44px; /* token */ border-radius: 50%; position: relative; box-shadow: inset 0 0 0 2px rgba(255,255,255,.6); }
    .sw button[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,.8); }
    .sw button.locked::after { content: '🔒'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: var(--fs-2); background: rgba(0,0,0,.35); border-radius: 50%; }
    /* "more to come": not a button, so it has no fill and no outline */
    .cell.more { align-items: center; justify-content: center; flex-direction: column; gap: 4px; min-height: 96px; padding: 8px; border-radius: 20px; border: 2px dashed var(--track); color: var(--ink2); font-size: var(--fs-2); font-weight: var(--w-semi, 600); text-align: center; text-wrap: balance; }
    .cell.more .e { font-size: var(--fs-6); line-height: 1; }
    .swmore { font-size: var(--fs-2); font-weight: var(--w-semi, 600); color: var(--ink2); white-space: nowrap; }
    /* his rank lives here, where it pays off, under the studio's title */
    .rankline { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; margin-top: 4px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); color: var(--ink2); }
    .rankline .rank { padding: 4px 10px; border-radius: 999px; background: var(--kid); color: #fff; font-size: var(--fs-2); font-weight: var(--w-heavy, 800); letter-spacing: .02em; }
    .new { position: absolute; top: 8px; left: 8px; padding: 3px 7px; border-radius: 999px; background: #14141a; color: #fff; font-size: var(--fs-2); font-weight: var(--w-heavy, 800); }
    /* a painted character: his picture, and what he has chosen that is not painted yet */
    .tile .emo { display: flex; align-items: center; justify-content: center; width: 92px; height: 76px; font-size: var(--fs-d2); line-height: 1; }
    .tile.locked .emo { filter: grayscale(1); opacity: .5; }
    .easel { position: relative; z-index: 1; width: 300px; height: 300px; border-radius: 30px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.22); }
    .easel fh-pic { width: 100%; height: 100%; }
    .easel[data-old] fh-pic { filter: saturate(.55) brightness(.92); }
    .easel .blank { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: var(--fs-d5); background: var(--chip); }
    .parts { z-index: 1; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; max-width: 100%; }
    .parts span { width: 44px; height: 44px; /* token */ border-radius: 50%; background: var(--chip-strong); display: inline-flex; align-items: center; justify-content: center; font-size: var(--fs-5); line-height: 1; }
    .pnote { z-index: 1; font-size: var(--fs-2); font-weight: var(--w-semi, 600); text-align: center; text-wrap: balance; min-height: 20px; }
    .wet { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: color-mix(in srgb, var(--kid) 34%, rgba(20,20,26,.72)); color: #fff; text-align: center; padding: 18px; font-size: var(--fs-3); font-weight: var(--w-bold, 700); }
    .wet .brush { font-size: var(--fs-d3); animation: brush 1.6s ease-in-out infinite alternate; animation-iteration-count: var(--loops, infinite); }
    @keyframes brush { from { transform: translate(calc(-26px * var(--m-d, 1)), 0) rotate(-14deg); } to { transform: translate(calc(26px * var(--m-d, 1)), calc(-8px * var(--m-d, 1))) rotate(12deg); } }
    .wet .bar { width: 76%; height: 10px; border-radius: 999px; background: rgba(255,255,255,.28); overflow: hidden; } .wet .bar i { display: block; height: 100%; border-radius: inherit; background: #fff; transition: width 1s linear; }
    ${unsafeCSS(avatarCss)}
    ${unsafeCSS(fxCss)}
  `];

  static properties = { hass: { attribute: false }, kid: { attribute: false }, art: { attribute: false }, look: { attribute: false }, life: { type: Number }, grow: { type: Number },
    _files: { state: true }, _record: { state: true }, _wet: { state: true }, _tickN: { state: true },
    _draft: { state: true }, _tab: { state: true }, _shake: { state: true }, _msg: { state: true }, _jump: { state: true }, _confetti: { state: true } };

  hass?: Hass;
  kid!: KidConfig;
  look!: Look;
  life = 0;
  grow = 0;
  private _draft?: Look;
  private _tab = '';
  private _shake = '';
  private _msg = '';
  private _jump = 0;
  private _confetti = 0;
  private _t?: number;

  /** the card's `art` option */
  art: ArtConfig = {};
  private _files: Set<string> | null = null;
  private _record: ArtItem[] | null | undefined;
  /** the file being painted while he watches */
  private _wet = '';
  private _tickN = 0; private _wetT?: number;
  /** his character is a painted picture: his looks are painted from his character sheet */
  private get _painted(): boolean { return !!this.kid?.sheet; }
  private get _cats(): Category[] { return catalogueOf(this._painted); }
  private get d(): Look { const l = this._draft ?? this.look; return this._painted ? wardrobeLook(l) : l; }
  /** the picture he starts with (the card's `look` for him): it is his plain look, whatever its file is called */
  private get _base(): Look { return decodeLook('', this.kid.look ? decodeLook(this.kid.look) : {}); }
  private get _file(): string { const b = this._base; return b.img && lookKey(this.d) === lookKey(wardrobeLook(b)) ? b.img : lookFile(kidEntities(this.kid).slug, this.d); }
  private get _list(): string { return this.art.list || 'todo.family_hub_art'; }
  private async _loadPainted(fresh = false): Promise<void> {
    if (!this._painted || !this.hass) return;
    const [files, record] = await Promise.all([localFiles(this.hass, fresh), loadArt(this.hass, this._list)]);
    this._files = new Set(files); this._record = record;
  }
  /** Why a new look cannot be painted just now, in words for the child; empty when it can. */
  private get _cannot(): string {
    if (!this.hass || !painter(this.hass, this.art.painter) || !this.hass.states[this._list] || this._record === null) return 'The painter isn’t set up yet. Ask a grown-up.';
    if (this._record === undefined) return ' ';
    if (monthSpend(this._record, this.art.cost ?? ART_DEFAULTS.cost).usd >= (this.art.cap ?? ART_DEFAULTS.cap)) return 'The painter is having a rest until next month.';
    if (this._left <= 0) return 'That’s all the new looks for today. Come back tomorrow!';
    return '';
  }
  /** The day's limit as a rule of the game, always in view: "2 paints left today". Empty until the record has loaded, or with no painter. */
  private get _paints(): string {
    if (!this.hass || !painter(this.hass, this.art.painter) || !this._record) return '';
    const n = this._left; return n ? `🖌️ ${n} paint${n === 1 ? '' : 's'} left today.` : '🖌️ No paints left today. More tomorrow!';
  }
  private get _left(): number { return Math.max(0, (this.art.looks_per_day ?? ART_DEFAULTS.looks) - looksToday(this._record ?? [], this.kid.name)); }
  /** Wear the look he has put together: at once when it has been painted before, else have it painted (half a minute or so). */
  private async _wear(): Promise<void> {
    const look = this.d, file = this._file, hass = this.hass, id = kidEntities(this.kid).avatar;
    if (!hass || this._wet) return;
    if (!hass.states[id]) { this._say(`Create ${id} in Home Assistant to save looks`); return; }
    const put = async (): Promise<boolean> => { try { await hass.callService('input_text', 'set_value', { entity_id: id, value: encodeLook({ ...look, img: file }) }); return true; } catch { this._say('Couldn’t save – try again'); return false; } };
    if (!this._files?.has(file) && file !== this._base.img) {
      if (this._cannot) { sfx('locked'); this._say(this._cannot); return; }
      this._wet = file; this._tickN = 0; sfx('tap');
      if (this._picMode) say('Painting your new look. It takes a little while.');
      this._wetT = window.setInterval(() => { this._tickN++; }, 1000);
      try { await paintLook(hass, this.kid, look, this.art); }
      catch (e) { console.warn('Family Hub: the look could not be painted', e); this._say('The painter couldn’t finish that one. Try again in a minute.'); return; }
      finally { clearInterval(this._wetT); this._wet = ''; void this._loadPainted(true); }
      this._files = new Set([...(this._files ?? []), file]);
    }
    if (await put()) { this._draft = undefined; this._confetti++; this._jump++; sfx('coin'); }
  }
  private _say(m: string): void { this._msg = m; clearTimeout(this._t); this._t = window.setTimeout(() => { this._msg = ''; }, 2200); }

  private get _picMode(): boolean { return this.kid.mode === 'picture'; }
  /** The fade under a list that scrolls down, and (the youngest's single row on a wall panel) which ends of the row have more. */
  private _cue = (x: Event | Element): void => {
    scrollCue(x);
    const el = (x instanceof Event ? x.currentTarget : x) as HTMLElement | null; if (!el) return;
    el.toggleAttribute('data-fwd', el.scrollWidth - el.scrollLeft - el.clientWidth > 6); el.toggleAttribute('data-back', el.scrollLeft > 6);
  };
  private _along(dir: number): void {
    const g = this.renderRoot.querySelector('.grid') as HTMLElement | null; if (!g) return;
    g.scrollBy({ left: dir * Math.max(176, g.clientWidth - 2 * 176), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  private _ro?: ResizeObserver;
  connectedCallback(): void { super.connectedCallback(); void this._loadPainted(); this._ro = new ResizeObserver(() => { const g = this.renderRoot.querySelector('.grid'); if (g) this._cue(g); }); this._ro.observe(this); }
  disconnectedCallback(): void { super.disconnectedCallback(); this._ro?.disconnect(); clearInterval(this._wetT); }
  protected updated(c: PropertyValues): void {
    const g = this.renderRoot.querySelector('.grid') as HTMLElement | null; if (!g) return;
    // a new row starts with what he is wearing in view (the row's own start when that is near it)
    if (c.has('_tab') && g.scrollWidth > g.clientWidth + 6) { const on = g.querySelector<HTMLElement>(".tile[aria-pressed='true']")?.parentElement, gr = g.getBoundingClientRect(), r = on?.getBoundingClientRect(); g.scrollLeft = r ? Math.max(0, g.scrollLeft + r.left - gr.left - (gr.width - r.width) / 2) : 0; }
    else if (c.has('_tab')) g.scrollLeft = 0;
    this._cue(g);
  }
  private get _goal(): string { return this.hass?.states[kidEntities(this.kid).goal]?.state ?? ''; }
  private _pick(cat: Category, it: Item, swatch = false): void {
    if (this._wet) return;
    if (!isUnlocked(it, this.life, this.grow)) {
      this._shake = `${cat.id}:${it[0]}`; setTimeout(() => { this._shake = ''; }, 460);
      sfx('locked');
      if (this._picMode) { say('Not yet! Keep collecting stars.'); return; }
      if (it[3]) this._say(`${it[1]} is a surprise – keep practising and reading!`);
      else this._say(`${it[1]} is ${it[2] - this.life} away. Tap ♥ to make it your goal.`);
      return;
    }
    sfx('tap');
    if (this._picMode) say(it[1]);
    this._draft = applyItem(this.d, cat, it[0], swatch);
    this._jump++;
  }
  private _setGoal(it: Item): void {
    const id = kidEntities(this.kid).goal;
    if (!this.hass?.states[id]) return;
    const v = this._goal === it[0] ? '' : it[0];
    this.hass.callService('input_text', 'set_value', { entity_id: id, value: v });
    sfx('coin');
    this._say(v ? `Saving for ${it[1]} ♥` : 'Goal cleared');
  }

  private _random(): void {
    let l = { ...this.d };
    for (const c of this._cats) {
      if (c.id === 'face' && !this._painted) continue;
      const ok = c.items.filter((i) => isUnlocked(i, this.life, this.grow));
      const it = ok[Math.floor(Math.random() * ok.length)];
      if (it) l = applyItem(l, c, it[0]);
      if (c.swatch && c.swatch.key !== 'skin') { const s = c.swatch.items.filter((i) => isUnlocked(i, this.life, this.grow)); l = applyItem(l, c, s[Math.floor(Math.random() * s.length)][0], true); }
    }
    this._draft = l; this._jump++;
  }

  private async _save(): Promise<void> {
    const id = kidEntities(this.kid).avatar;
    if (this.hass?.states[id]) {
      try { await this.hass.callService('input_text', 'set_value', { entity_id: id, value: encodeLook(this.d) }); }
      catch { this._say('Couldn’t save – try again'); return; }
    } else { this._say(`Create ${id} in Home Assistant to save looks`); return; }
    this._confetti++;
    setTimeout(() => this.dispatchEvent(new CustomEvent('close')), 900);
  }

  render(): TemplateResult {
    const [msg, msgOut] = linger(this, 'msg', this._msg);
    const cats = this._cats, cat = cats.find((c) => c.id === this._tab) ?? cats[0], painted = this._painted;
    const nx = nextUnlock(this.life, this.kid.favourites, this._goal || undefined, cats), from = prevThreshold(this.life, cats);
    // a painted look is "new" when its picture is not the one he is wearing
    const dirty = painted ? lookKey(this.d) !== lookKey(wardrobeLook(this.look)) : !!this._draft && encodeLook(this._draft) !== encodeLook(this.look);
    const have = painted && (!!this._files?.has(this._file) || this._file === this._base.img), wet = !!this._wet, cannot = painted && dirty && !have ? this._cannot.trim() : '';
    const leave = (): void => { if (painted || !dirty) this.dispatchEvent(new CustomEvent('close')); else void this._save(); };
    const recent = (req: number) => req > 0 && req <= this.life && req > this.life - 100;
    // rank names are for the younger two: a child in older mode, and one who cannot read, see none
    const li = !this._picMode && !this.kid.older ? levelInfo(this.life) : null;
    const items = shownItems(cat.items, this.life, this.grow, this._goal), sw = cat.swatch ? shownItems(cat.swatch.items, this.life, this.grow) : null;
    return html`<div style="display:contents;--kid:${slotVar(this.kid.colour)}">
      <section class="glass mirror ${this._picMode ? 'low' : ''}">
        <div class="shead" style="display:flex;width:100%;align-items:center;gap:10px;z-index:1">
          <button class="round tap" aria-label=${dirty && !painted ? 'Back, and keep this look' : 'Back'} @click=${leave}>${icon('left', 18)}</button>
          <div style="flex:1;min-width:0"><h1 class="t-title">${this.kid.name}’s studio</h1>${li ? html`<div class="rankline"><span class="rank">${li.rank}</span><span>${li.need - li.into} more to ${li.nextRank}</span></div>` : nothing}</div>
          <button class="round tap" aria-label="Surprise look" ?disabled=${wet} @click=${() => this._random()}>${icon('shuffle', 18)}</button>
        </div>
        ${painted ? html`
          <div class="easel" ?data-old=${dirty && !have && !wet} role="img" aria-label=${wet ? 'Your new look is being painted' : dirty && !have ? 'The look you are wearing now. Your new one has not been painted yet' : `${this.kid.name}’s look`}>
            ${have || this.look.img ? html`<fh-pic .media=${have ? this._file : this.look.img}></fh-pic>` : html`<span class="blank" aria-hidden="true">🎨</span>`}
            ${wet ? html`<div class="wet"><span class="brush" aria-hidden="true">🖌️</span><span aria-live="polite">${WAITS[Math.min(WAITS.length - 1, Math.floor(this._tickN / 8))]}</span><span class="bar" aria-hidden="true"><i style="width:${Math.min(96, Math.round((this._tickN / 45) * 100))}%"></i></span></div>` : nothing}
          </div>
          ${dirty && !have ? html`<div class="parts" aria-label="What you have picked">${cats.filter((c) => !['none', 'own', 'plain', 'smile'].includes(String(this.d[c.key])) || c.id === 'tops').map((c) => html`<span title=${c.label}>${itemEmoji(c, String(this.d[c.key]))}</span>`)}</div>` : nothing}
          <span class="pnote" role="status">${wet ? 'You can keep watching, or go back: it will be ready soon.' : cannot ? cannot : dirty && !have ? `Tap Paint it to see your new look. ${this._paints}` : dirty ? 'You’ve had this look before.' : this._paints}</span>`
        : html`<button class="tap" data-avpop style="z-index:1" aria-label="Jump" @click=${() => { this._jump++; }}>${renderAvatar(this.d, { size: 240, jump: this._jump, age: this.kid.age })}</button>`}
        ${nx && !this._picMode ? html`<div style="width:100%;z-index:1;display:flex;flex-direction:column;gap:5px">
          <span style="font-size:var(--fs-2);font-weight:var(--w-bold, 700)">${this._goal === nx.id ? '♥ Saving for' : 'Next unlock'}: ${nx.label} <span class="muted">· ${nx.req - this.life} to go</span></span>
          <div class="xp"><div style="width:${Math.round(((this.life - from) / (nx.req - from)) * 100)}%"></div></div></div>` : nothing}
        <div class="sfoot">
          <button class="pill tap" style="flex:1;height:50px;justify-content:center" ?disabled=${!dirty || wet} @click=${() => { this._draft = undefined; this._jump++; }}>Undo all</button>
          ${painted ? html`<button class="pill tap primary" data-act="paint" style="flex:1.4;height:50px;justify-content:center;font-size:var(--fs-3)" ?disabled=${wet || (dirty && !have && !!cannot)} aria-busy=${wet ? 'true' : nothing} @click=${() => { if (dirty) void this._wear(); else leave(); }}>${wet ? 'Painting…' : !dirty ? 'Done' : have ? 'Wear this look' : html`🖌️ Paint it!`}</button>`
          : html`<button class="pill tap primary" style="flex:1.4;height:50px;justify-content:center;font-size:var(--fs-3)" @click=${() => this._save()}>${dirty ? 'Save my look' : 'Done'}</button>`}
        </div>
      </section>
      <section class="glass shelf ${this._picMode ? 'low' : ''}">
        <div class="tabs ${this._picMode ? 'pics' : ''}" role="tablist">${cats.map((c) => html`<button class="tap" role="tab" aria-label=${c.label} aria-selected=${String(c.id === this._tab)} style=${this._picMode ? 'font-size:var(--fs-5);width:58px;height:52px;padding:0' : ''} @click=${() => { this._tab = c.id; sfx('tap'); if (this._picMode) say(c.label); }}>${this._picMode ? c.emoji : html`<span class="te" aria-hidden="true">${c.emoji}</span> ${c.label}`}</button>`)}</div>
        ${cat.swatch ? html`<div class="sw"><span class="label" style="min-width:60px;margin-right:6px;flex-shrink:0">${cat.swatch.label}</span>
          ${sw!.show.map((s) => { const locked = !isUnlocked(s, this.life, this.grow); return html`<button class="tap ${locked ? 'locked' : ''} ${this._shake === `${cat.id}:${s[0]}` ? 'shake' : ''}"
            title=${s[1]} aria-label=${`${s[1]}${locked ? `, unlocks at ${s[2]} points` : ''}`} aria-pressed=${String(this.d[cat.swatch!.key] === s[0])}
            style="background:${s[0]}" @click=${() => this._pick(cat, s, true)}></button>`; })}${sw!.hidden ? html`<span class="swmore">+${sw!.hidden} more later</span>` : nothing}</div>` : nothing}
        <div class="gridwrap"><div class="grid scrolly" @scroll=${this._cue}>
          ${items.show.map((it) => {
            const locked = !isUnlocked(it, this.life, this.grow), worn = isWorn(this.d, cat, it[0]), surprise = !!it[3];
            return html`<div class="cell"><button class="tile tap ${locked ? 'locked shimmer' : ''} ${this._shake === `${cat.id}:${it[0]}` ? 'shake' : ''}" aria-pressed=${String(worn)} @click=${() => this._pick(cat, it)}>
              <span class="av">${locked && surprise ? html`<span style="display:flex;width:92px;height:${painted ? 76 : cat.crop === 'head' ? 92 : 110}px;align-items:center;justify-content:center;font-size:var(--fs-d1)">🎁</span>` : painted ? html`<span class="emo" aria-hidden="true">${itemEmoji(cat, it[0])}</span>` : renderAvatar(applyItem(this.d, cat, it[0]), { size: 92, crop: cat.crop, still: true, age: this.kid.age })}</span>${locked && surprise ? 'Surprise' : it[1]}
              ${locked ? html`<span class="lock">${surprise ? '🌱' : html`<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.500" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>${this._picMode ? html`<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="#f5b301" d="M12 2.800l2.850 5.900 6.450.900-4.700 4.550 1.150 6.450L12 17.500l-5.750 3.100 1.150-6.450L2.700 9.600l6.450-.900z"></path></svg>` : it[2]}`}</span>` : recent(it[2]) ? html`<span class="new">NEW</span>` : nothing}
            </button>
              ${locked && !surprise && !this._picMode ? html`<button class="heart tap" aria-pressed=${String(this._goal === it[0])} aria-label=${this._goal === it[0] ? `${it[1]} is my goal` : `Make ${it[1]} my goal`} @click=${() => this._setGoal(it)}><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 20.500C5 15.500 3 12 3 8.800A4.700 4.700 0 0 1 12 6.700 4.700 4.700 0 0 1 21 8.800c0 3.200-2 6.700-9 11.700z" fill=${this._goal === it[0] ? '#e11d48' : 'none'} stroke=${this._goal === it[0] ? '#9f1239' : 'currentColor'} stroke-width="2" stroke-linejoin="round"></path></svg></button>` : nothing}</div>`;
          })}
          ${items.hidden ? html`<div class="cell more" role="note" aria-label="${items.hidden} more to discover later"><span class="e" aria-hidden="true">✨</span>${this._picMode ? nothing : html`<span>${items.hidden} more to discover</span>`}</div>` : nothing}
        </div>${this._picMode ? html`<button class="tap rowgo back" aria-label="Go back along the row" @click=${() => this._along(-1)}>${icon('left', 30)}</button><button class="tap rowgo fwd" aria-label="More to choose" @click=${() => this._along(1)}>${icon('right', 30)}</button>` : nothing}</div>
      </section>
      ${this._confetti ? confetti(this._confetti) : nothing}
      ${msg ? html`<div class="toast" role="status" ?data-closing=${msgOut}>${msg}</div>` : nothing}
    </div>`;
  }
}
if (!customElements.get('fh-studio')) customElements.define('fh-studio', FhStudio);
