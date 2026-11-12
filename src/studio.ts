import { LitElement, html, css, unsafeCSS, nothing, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { avatarCss, applyItem, CATALOGUE, encodeLook, isUnlocked, isWorn, nextUnlock, prevThreshold, renderAvatar, type Category, type Item, type Look } from './avatar';
import { say, sfx } from './util';
import { confetti, fxCss } from './fx';
import { kidEntities, num, slotVar, type Hass, type KidConfig } from './types';

/** Avatar Studio: try on everything, locked items show what they need. */
export class FhStudio extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    .mirror { width: 380px; flex-shrink: 0; border-radius: 28px; padding: 18px; display: flex; flex-direction: column; align-items: center; gap: 14px; position: relative; overflow: hidden; }
    .mirror::before { content: ''; position: absolute; inset: auto -30% -30%; height: 60%; background: radial-gradient(closest-side, color-mix(in srgb, var(--kid) 40%, transparent), transparent); }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-phone]) { flex: none; }
    :host([data-phone]) .grid { overflow: visible; flex: none; }
    :host([data-shape='tall']) .mirror { width: auto; flex-direction: row; flex-wrap: wrap; justify-content: center; }
    .shelf { flex: 1; min-width: 0; border-radius: 28px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
    .tabs { display: flex; gap: 6px; flex-wrap: wrap; }
    .tabs button { height: 40px; padding: 0 16px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: var(--w-semi, 600); }
    .tabs button[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
    .heart { position: absolute; bottom: 34px; right: 6px; width: 32px; height: 32px; border-radius: 50%; background: var(--chip-strong); font-size: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
    .grid { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 10px; align-content: start; padding: 4px; }
    .tile { border-radius: 20px; background: var(--chip); padding: 8px 6px 9px; display: flex; flex-direction: column; align-items: center; gap: 6px; position: relative; font-size: 12px; font-weight: var(--w-bold, 700); text-align: center; }
    .tile[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--primary); background: var(--chip-strong); }
    .tile.locked .av { filter: grayscale(1) brightness(.85); opacity: .55; }
    .lock { position: absolute; top: 8px; right: 8px; padding: 3px 8px; border-radius: 999px; background: rgba(15,15,20,.78); color: #fff; font-size: 11px; font-weight: var(--w-heavy, 800); }
    .sw { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .sw button { width: 36px; height: 36px; border-radius: 50%; position: relative; box-shadow: inset 0 0 0 2px rgba(255,255,255,.6); }
    .sw button[aria-pressed='true'] { box-shadow: 0 0 0 3px var(--ink), inset 0 0 0 2px rgba(255,255,255,.8); }
    .sw button.locked::after { content: '🔒'; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 14px; background: rgba(0,0,0,.35); border-radius: 50%; }
    .new { position: absolute; top: 8px; left: 8px; padding: 3px 7px; border-radius: 999px; background: var(--accent); color: #fff; font-size: 10px; font-weight: var(--w-heavy, 800); }
    ${unsafeCSS(avatarCss)}
    ${unsafeCSS(fxCss)}
  `];

  static properties = { hass: { attribute: false }, kid: { attribute: false }, look: { attribute: false }, life: { type: Number }, grow: { type: Number },
    _draft: { state: true }, _tab: { state: true }, _shake: { state: true }, _msg: { state: true }, _jump: { state: true }, _confetti: { state: true } };

  hass?: Hass;
  kid!: KidConfig;
  look!: Look;
  life = 0;
  grow = 0;
  private _draft?: Look;
  private _tab = 'hair';
  private _shake = '';
  private _msg = '';
  private _jump = 0;
  private _confetti = 0;
  private _t?: number;

  private get d(): Look { return this._draft ?? this.look; }
  private _say(m: string): void { this._msg = m; clearTimeout(this._t); this._t = window.setTimeout(() => { this._msg = ''; }, 2200); }

  private get _picMode(): boolean { return this.kid.mode === 'picture'; }
  private get _goal(): string { return this.hass?.states[kidEntities(this.kid).goal]?.state ?? ''; }
  private _pick(cat: Category, it: Item, swatch = false): void {
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
    for (const c of CATALOGUE) {
      if (c.id === 'face') continue;
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
    const cat = CATALOGUE.find((c) => c.id === this._tab) ?? CATALOGUE[0];
    const nx = nextUnlock(this.life, this.kid.favourites, this._goal || undefined), from = prevThreshold(this.life);
    const dirty = !!this._draft && encodeLook(this._draft) !== encodeLook(this.look);
    const recent = (req: number) => req > 0 && req <= this.life && req > this.life - 100;
    return html`<div style="display:contents;--kid:${slotVar(this.kid.colour)}">
      <section class="glass mirror">
        <div style="display:flex;width:100%;align-items:center;gap:10px;z-index:1">
          <button class="round tap" aria-label="Back" @click=${() => this.dispatchEvent(new CustomEvent('close'))}>${icon('left', 18)}</button>
          <h1 class="t-title" style="flex:1">${this.kid.name}’s studio</h1>
          <button class="round tap" aria-label="Surprise look" @click=${() => this._random()}>${icon('shuffle', 18)}</button>
        </div>
        <button class="tap" style="z-index:1" aria-label="Jump" @click=${() => { this._jump++; }}>${renderAvatar(this.d, { size: 240, jump: this._jump, age: this.kid.age })}</button>
        ${nx && !this._picMode ? html`<div style="width:100%;z-index:1;display:flex;flex-direction:column;gap:5px">
          <span style="font-size:14px;font-weight:var(--w-bold, 700)">${this._goal === nx.id ? '♥ Saving for' : 'Next unlock'}: ${nx.label} <span class="muted">· ${nx.req - this.life} to go</span></span>
          <div class="xp"><div style="width:${Math.round(((this.life - from) / (nx.req - from)) * 100)}%"></div></div></div>` : nothing}
        <div style="display:flex;gap:10px;width:100%;margin-top:auto;z-index:1">
          <button class="pill tap" style="flex:1;height:50px;justify-content:center" ?disabled=${!dirty} @click=${() => { this._draft = undefined; this._jump++; }}>Undo all</button>
          <button class="pill tap primary" style="flex:1.4;height:50px;justify-content:center;font-size:16px" @click=${() => this._save()}>${dirty ? 'Save my look' : 'Done'}</button>
        </div>
      </section>
      <section class="glass shelf">
        <div class="tabs" role="tablist">${CATALOGUE.map((c) => html`<button class="tap" role="tab" aria-label=${c.label} aria-pressed=${String(c.id === this._tab)} style=${this._picMode ? 'font-size:26px;width:58px;height:52px;padding:0' : ''} @click=${() => { this._tab = c.id; sfx('tap'); if (this._picMode) say(c.label); }}>${this._picMode ? c.emoji : html`${c.emoji} ${c.label}`}</button>`)}</div>
        ${cat.swatch ? html`<div class="sw"><span class="label" style="width:60px">${cat.swatch.label}</span>
          ${cat.swatch.items.map((s) => { const locked = !isUnlocked(s, this.life, this.grow); return html`<button class="tap ${locked ? 'locked' : ''} ${this._shake === `${cat.id}:${s[0]}` ? 'shake' : ''}"
            title=${s[1]} aria-label=${`${s[1]}${locked ? `, unlocks at ${s[2]} points` : ''}`} aria-pressed=${String(this.d[cat.swatch!.key] === s[0])}
            style="background:${s[0]}" @click=${() => this._pick(cat, s, true)}></button>`; })}</div>` : nothing}
        <div class="grid">
          ${cat.items.map((it) => {
            const locked = !isUnlocked(it, this.life, this.grow), worn = isWorn(this.d, cat, it[0]), surprise = !!it[3];
            return html`<button class="tile tap ${locked ? 'locked shimmer' : ''} ${this._shake === `${cat.id}:${it[0]}` ? 'shake' : ''}" aria-pressed=${String(worn)} @click=${() => this._pick(cat, it)}>
              <span class="av">${locked && surprise ? html`<span style="display:flex;width:92px;height:${cat.crop === 'head' ? 92 : 110}px;align-items:center;justify-content:center;font-size:44px">🎁</span>` : renderAvatar(applyItem(this.d, cat, it[0]), { size: 92, crop: cat.crop, still: true, age: this.kid.age })}</span>${locked && surprise ? 'Surprise' : it[1]}
              ${locked ? html`<span class="lock">${surprise ? '🌱' : `🔒 ${this._picMode ? '★' : it[2]}`}</span>` : recent(it[2]) ? html`<span class="new">NEW</span>` : nothing}
              ${locked && !surprise && !this._picMode ? html`<span class="heart tap" role="button" aria-label="Make ${it[1]} my goal" @click=${(e: Event) => { e.stopPropagation(); this._setGoal(it); }}>${this._goal === it[0] ? '❤️' : '♡'}</span>` : nothing}
            </button>`;
          })}
        </div>
      </section>
      ${this._confetti ? confetti(this._confetti, 50) : nothing}
      ${this._msg ? html`<div class="toast" role="status">${this._msg}</div>` : nothing}
    </div>`;
  }
}
if (!customElements.get('fh-studio')) customElements.define('fh-studio', FhStudio);
