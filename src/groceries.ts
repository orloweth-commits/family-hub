import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { slotVar, type GroceryRecipient, type Hass } from './types';
import { keyboard, keysCss, typeKey } from './keys';
import { getShape, FitController, scrollCue, sfx } from './util';
import { spark } from './sparks';

interface TodoItem { uid: string; summary: string; status: 'needs_action' | 'completed' }

/** Keyword → aisle. Generic grocery words only; first match wins. */
const AISLES: [string, string, string][] = [
  ['Frozen', '--p-1', 'frozen|ice cream|icecream|ice block|icy pole|frozen peas|ice'],
  ['Household', '--p-5', 'dishwasher tablet|tablet|detergent|soap|shampoo|conditioner|toothpaste|paper towel|tissue|toilet|foil|cling wrap|glad wrap|baking paper|bin liner|bag|clean|spray|sponge|nappy|nappies|wipes|battery|batteries'],
  ['Pantry', '--p-3', 'peanut butter|pasta|rice|flour|sugar|oil|sauce|cereal|weet-bix|weetbix|oats|coffee|tea|honey|jam|vegemite|peanut|stock|spice|salt|pepper|noodle|bean|lentil|tin|can|biscuit|cracker|chip|snack|chocolate|nut|muesli'],
  ['Fruit & veg', '--p-4', 'watermelon|apple|banana|avocado|orange|lemon|lime|grape|berr|melon|mango|pear|peach|kiwi|tomato|potato|onion|garlic|carrot|lettuce|spinach|broccoli|cauli|capsicum|cucumber|zucchini|mushroom|herb|coriander|basil|salad|corn|pumpkin|celery|ginger|fruit|veg'],
  ['Dairy & eggs', '--p-1', 'milk|cheese|yoghurt|yogurt|butter|cream|egg|custard'],
  ['Bakery', '--accent', 'bread|sourdough|roll|wrap|bagel|muffin|croissant|bun|loaf|tortilla|crumpet'],
  ['Meat & fish', '--p-2', 'chicken|beef|lamb|pork|mince|sausage|bacon|ham|steak|fish|salmon|prawn|tuna|turkey|meat'],
  ['Drinks', '--p-4', 'juice|water|soft drink|soda|cordial|beer|wine|kombucha']
];
const AISLE_RE = AISLES.map(([a, c, w]) => [a, c, new RegExp(`\\b(${w})`)] as const);
export const aisleOf = (name: string): [string, string] => {
  const n = String(name ?? '').toLowerCase();
  for (const [aisle, colour, re] of AISLE_RE) if (re.test(n)) return [aisle, colour];
  return ['Other', '--p-family'];
};


export class FhGroceries extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, keysCss, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; }
    /* one layout however long the list is: the list keeps its width, so the keyboard never moves under a finger */
    .list { width: 520px; flex-shrink: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 8px; }
    .items { flex: 1; min-height: 0; overflow: auto; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px 8px; align-content: start; padding: 6px; margin: -6px; }
    .items > :not(.item) { grid-column: 1 / -1; }
    .item { display: flex; align-items: center; gap: 10px; min-height: 44px; /* token */ padding: 7px 10px; border-radius: 14px; background: var(--chip); width: 100%; min-width: 0; text-align: left; }
    .box { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 2px solid var(--ink2); }
    .done .box { background: var(--ok); border-color: var(--ok); color: var(--on-ok, #fff); }
    .done .strike { color: var(--ink2); }
    .txt { flex: 1; min-width: 0; font-size: 16px; font-weight: var(--w-semi, 600); line-height: 1.2; overflow-wrap: anywhere; }
    .tag { font-size: 13px; font-weight: var(--w-bold, 700); padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
    .label { font-size: 13px; }
    .note { font-size: 13px; }
    .trolley { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 6px; }
    .clear { height: 44px; /* token */ padding: 0 16px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-bold, 700); white-space: nowrap; }
    .failed { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; font-size: 17px; font-weight: var(--w-semi, 600); padding: 16px; }
    .failed .retry { height: 52px; padding: 0 22px; border-radius: 999px; background: var(--chip-strong); box-shadow: inset 0 0 0 2px var(--ink2); font-size: 16px; font-weight: var(--w-bold, 700); }
    /* two columns leave no room for the aisle chip; the list is still sorted by aisle. Phones show it. */
    :host(:not([data-phone])) .tag { display: none; }
    :host([data-shape='tall']) .items { grid-template-columns: repeat(3, minmax(0, 1fr)); }

    :host([data-shape='tall']) .add .key:not(.wide):not(.space) { width: 64px; height: 64px; }
    :host([data-shape='tall']) .add .key.space { width: 420px; }
    :host([data-shape='tall']) .add .key.wide { width: 96px; }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .list { width: auto; flex: 1; min-height: 0; }
    :host([data-shape='tall']) .add { flex: 0 0 auto; }
    :host([data-phone]) { flex: none; flex-direction: column; min-width: 0; }
    :host([data-phone]) .add { order: -1; padding: 14px; border-radius: 22px; flex: none; }
    :host([data-phone]) .list { flex: none; width: auto; padding: 14px; border-radius: 22px; }
    :host([data-phone]) .items { overflow: visible; flex: none; grid-template-columns: minmax(0, 1fr); padding: 0; margin: 0; }
    :host([data-phone]) .keys { display: none; }
    :host([data-phone]) .entry { flex-wrap: wrap; }
    :host([data-phone]) .entry .field { flex: 1 1 180px; height: 52px; font-size: 20px; }
    :host([data-phone]) .entry .lead { height: 52px; flex: 0 0 auto; }
    .add { flex: 1; min-width: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
    .entry { display: flex; gap: 10px; align-items: center; min-width: 0; }
    .field { flex: 1; min-width: 0; width: 0; height: 60px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: var(--w-semi, 600); color: var(--ink);
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); outline: none; }
    .field:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
    .field::placeholder { color: var(--ink2); font-weight: 500; }
    .entry .lead { height: 60px; padding: 0 26px; font-size: 18px; flex-shrink: 0; }
    .usuals { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .usuals > span { font-size: 13px; font-weight: var(--w-bold, 700); margin-right: 4px; }
    /* the keyboard takes the room that is left: taller keys, not an empty band above them */
    .keys { flex: 1; min-height: 0; justify-content: center; }
    :host(:not([data-shape='tall']):not([data-phone])) .krow { flex: 1 1 52px; max-height: 78px; min-height: 44px; }
    :host(:not([data-shape='tall']):not([data-phone])) .key { height: 100%; width: 56px; }
    :host(:not([data-shape='tall']):not([data-phone])) .key.wide { width: 86px; }
    :host(:not([data-shape='tall']):not([data-phone])) .key.space { width: 380px; }
    .chip { height: 44px; /* token */ padding: 0 12px; border-radius: 999px; background: var(--chip); font-size: 15px; font-weight: var(--w-semi, 600); }
    .who { height: 48px; padding: 0 18px 0 8px; border-radius: 999px; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: var(--w-semi, 600); }
    .toast.act { display: flex; align-items: center; gap: 14px; pointer-events: auto; padding: 8px 8px 8px 22px; }
    .toast .undo { height: 44px; /* token */ min-width: 72px; padding: 0 18px; border-radius: 999px; background: #fff; color: #14141a; font-size: 15px; font-weight: var(--w-heavy, 800); }
    .toast .undo:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  `];

  static properties = {
    _tk: { state: true }, _just: { state: true },
    hass: { attribute: false },
    entity: {},
    usuals: { attribute: false },
    recipients: { attribute: false },
    _items: { state: true },
    _typed: { state: true },
    _caps: { state: true },
    _toast: { state: true }, _undo: { state: true }, _failed: { state: true }, _hidden: { state: true }
  };

  hass?: Hass;
  entity = 'todo.shopping_list';
  usuals: string[] = ['Milk', 'Bread', 'Eggs', 'Bananas', 'Cheese', 'Coffee'];
  recipients: GroceryRecipient[] = [];
  private _items: TodoItem[] = [];
  private _typed = '';
  private _caps = true;
  private _toast = '';
  private _unsub?: () => void;
  private _subFor = '';
  private _toastTimer?: number;
  /** what the toast's Undo button does, while it is offered */
  private _undo?: () => void;
  /** the list could not be loaded: say so, rather than showing an empty list */
  private _failed = false;
  /** ticked items that were just cleared: out of sight at once, removed for good when the Undo window closes */
  private _hidden: string[] = [];
  private _clearTimer?: number;

  disconnectedCallback(): void { super.disconnectedCallback(); this._commitClear(); this._unsub?.(); this._unsub = undefined; this._subFor = ''; }

  protected updated(c: PropertyValues): void {
    if ((c.has('hass') || c.has('entity')) && this.hass && this._subFor !== this.entity) this._subscribe();
    this.renderRoot.querySelectorAll('.scrolly').forEach(scrollCue);
  }

  private async _subscribe(): Promise<void> {
    this._unsub?.();
    this._subFor = this.entity;
    const conn = this.hass?.connection;
    if (!conn) { this._failed = true; return; }
    try {
      const ent = this.entity;
      const un = await conn.subscribeMessage<{ items: TodoItem[] }>((m) => { this._items = (m.items ?? []).filter((i) => i && typeof i.summary === 'string'); this._failed = false; }, { type: 'todo/item/subscribe', entity_id: ent });
      // the page may have gone, or moved to another list, while Home Assistant was answering: do not keep a subscription nobody will close
      if (!this.isConnected || this._subFor !== ent) { un(); return; }
      this._unsub = un; this._failed = false;
    } catch (e) { console.warn('Family Hub: grocery subscribe failed', e); this._failed = true; }
  }

  private _say(m: string, undo?: () => void): void { this._toast = m; this._undo = undo; clearTimeout(this._toastTimer); this._toastTimer = window.setTimeout(() => { this._toast = ''; this._undo = undefined; }, undo ? 6000 : 2600); }

  private _add(name = this._typed): void {
    const n = name.trim();
    if (!n) { this._say('Type something first'); return; }
    if (!this.hass) return;
    const nice = n.charAt(0).toUpperCase() + n.slice(1), typed = name === this._typed;
    if (this._items.some((i) => i.status === 'needs_action' && i.summary.toLowerCase() === nice.toLowerCase())) { this._say(`${nice} is already on the list`); this._typed = ''; this._caps = true; return; }
    // a failed add says so and gives the words back, so nothing typed is lost
    Promise.resolve(this.hass.callService('todo', 'add_item', { item: nice }, { entity_id: this.entity })).catch(() => { this._say(`Couldn’t add ${nice}. Try again`); if (typed && !this._typed) { this._typed = nice; this._caps = false; } });
    if (typed) { this._typed = ''; this._caps = true; }
  }
  private _toggle(i: TodoItem): void {
    // the touch is answered at once: the tick, its sound and the service call all happen now. The row keeps its place for a few seconds, so a slip can be tapped back.
    const to = this._shown(i) === 'completed' ? 'needs_action' : 'completed';
    sfx(to === 'completed' ? 'tick' : 'untick');
    if (to === 'completed') { const row = [...this.renderRoot.querySelectorAll('button.item')].find((b) => b.querySelector('.strike')?.textContent === i.summary), list = this.renderRoot.querySelector('.items');
      if (row) spark('tick', row.querySelector('.check') ?? row);
      // the last thing on the list: a ute delivers it (at most once a day)
      if (list && this._items.every((x) => x.uid === i.uid || this._shown(x) === 'completed') && localStorage.getItem('fh-truck') !== new Date().toDateString()) { try { localStorage.setItem('fh-truck', new Date().toDateString()); } catch { /* private mode */ } spark('truck', list); } }
    clearTimeout(this._tk[i.uid]?.t);
    this._tk = { ...this._tk, [i.uid]: { to, was: this._tk[i.uid]?.was ?? i.status, t: window.setTimeout(() => { const { [i.uid]: _, ...rest } = this._tk; this._tk = rest; }, 4000) } };
    this._just = i.uid; window.setTimeout(() => { if (this._just === i.uid) this._just = ''; }, 700);
    Promise.resolve(this.hass?.callService('todo', 'update_item', { item: i.uid, status: to }, { entity_id: this.entity })).catch(() => {
      clearTimeout(this._tk[i.uid]?.t); const { [i.uid]: _, ...rest } = this._tk; this._tk = rest; this._say(`Couldn’t ${to === 'completed' ? 'tick' : 'untick'} ${i.summary}. Try again`); });
  }
  private _tk: Record<string, { to: string; was: string; t: number }> = {};
  private _just = '';
  /** what the row shows (the touch wins until Home Assistant catches up) and which group it sits in (where it was, for a few seconds) */
  private _shown(i: TodoItem): string { return this._tk[i.uid]?.to ?? i.status; }
  private _group(i: TodoItem): string { return this._tk[i.uid]?.was ?? i.status; }
  /** Clearing takes the ticked items out of sight at once; they are only removed when the Undo window closes (or the page is left). */
  private _clearDone(): void {
    this._commitClear();
    const ids = this._items.filter((i) => this._group(i) === 'completed' && this._shown(i) === 'completed').map((i) => i.uid);
    if (!ids.length) return;
    this._hidden = ids;
    this._clearTimer = window.setTimeout(() => this._commitClear(), 6000);
    this._say(`Cleared ${ids.length} ticked ${ids.length === 1 ? 'item' : 'items'}`, () => { clearTimeout(this._clearTimer); this._clearTimer = undefined; this._hidden = []; this._say('Put back'); });
  }
  private _commitClear(): void {
    clearTimeout(this._clearTimer); this._clearTimer = undefined;
    const ids = this._hidden; if (!ids.length) return;
    this._hidden = [];
    Promise.resolve(this.hass?.callService('todo', 'remove_item', { item: ids }, { entity_id: this.entity })).catch(() => { if (this.isConnected) this._say('Couldn’t clear the ticked items. Try again'); });
    if (this._undo) { this._toast = ''; this._undo = undefined; }
  }

  private _send(r: GroceryRecipient): void {
    const left = this._items.filter((i) => i.status === 'needs_action');
    if (!left.length) { this._say('The list is empty'); return; }
    const svc = r.notify?.replace(/^notify\./, '');
    if (!svc || !this.hass?.services?.notify?.[svc]) { this._say(`Set up the Home Assistant app on ${r.name}’s phone first`); return; }
    const grouped = new Map<string, string[]>();
    for (const i of left) { const a = aisleOf(i.summary)[0]; grouped.set(a, [...(grouped.get(a) ?? []), i.summary]); }
    const message = [...grouped].map(([a, xs]) => `${a}: ${xs.join(', ')}`).join('\n');
    this.hass.callService('notify', svc, { title: `Groceries (${left.length})`, message, data: { url: '/todo?entity_id=' + this.entity } });
    this._say(`List sent to ${r.name}’s phone`);
  }

  render(): TemplateResult {
    const open = this._items.filter((i) => this._group(i) === 'needs_action');
    const done = this._items.filter((i) => this._group(i) === 'completed' && !this._hidden.includes(i.uid));
    const sorted = [...open].sort((a, b) => aisleOf(a.summary)[0].localeCompare(aisleOf(b.summary)[0]));
    return html`
      <section class="glass list" aria-label="Shopping list">
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <h1 class="t-title">Groceries</h1>
          ${this._failed ? nothing : html`<span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600)">${open.length} to buy</span>`}
        </div>
        ${this._failed ? html`<div class="failed" role="alert"><span style="color:var(--ink2)">${icon('cart', 40)}</span><span>Can’t reach the shopping list.</span>
          <button class="retry tap" @click=${() => { this._subFor = ''; this._subscribe(); }}>Try again</button></div>` : html`
        <div class="items scrolly" @scroll=${scrollCue}>
          ${sorted.map((i) => this._row(i))}
          ${done.length ? html`<div class="trolley">
            <span class="label">In the trolley</span>
            <button class="clear tap" @click=${() => this._clearDone()}>Clear ticked (${done.filter((i) => this._shown(i) === 'completed').length})</button></div>
            ${done.map((i) => this._row(i))}` : nothing}
          ${!open.length && !done.length ? html`<div class="empty" style="padding:24px 0"><span style="color:var(--ink2)">${icon('cart', 40)}</span><span style="font-size:17px;font-weight:var(--w-semi, 600)">Nothing on the list yet</span><span style="font-size:15px">Type an item or tap a usual to add it.</span></div>` : nothing}
        </div>`}
        <span class="muted note">Also live in the Home Assistant app – tick things off in the shop.</span>
      </section>

      <section class="glass add" aria-label="Add an item">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600);flex:1 1 auto">Send the list to</span>
          ${this.recipients.map((r) => html`<button class="who glass tap" @click=${() => this._send(r)}>
            <span class="avatar" style="width:34px;height:34px;font-size:14px;background:${slotVar(r.colour)}">${r.name[0]}</span>${r.name}</button>`)}
          ${!this.recipients.length ? html`<span class="muted" style="font-size:13px">(add phones in the card settings)</span>` : nothing}
        </div>
        <div class="entry">
          <input class="field" .value=${this._typed} inputmode=${getShape() === 'phone' ? 'text' : 'none'} autocomplete="off" placeholder="Type an item…" aria-label="New item"
            @input=${(e: InputEvent) => { this._typed = (e.target as HTMLInputElement).value; }}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._add(); }} />
          <button class="tap lead" @click=${() => this._add()}>Add</button>
        </div>
        <div class="usuals">
          <span class="muted">Usuals</span>
          ${this.usuals.map((u) => html`<button class="chip quick tap" aria-label="Add ${u}" @click=${() => this._add(u)}>+ ${u}</button>`)}
        </div>
        ${keyboard((k) => { [this._typed, this._caps] = typeKey(this._typed, k, this._caps); }, this._caps, () => { this._caps = !this._caps; })}
      </section>
      ${this._toast ? html`<div class="toast ${this._undo ? 'act' : ''}" role="status"><span>${this._toast}</span>${this._undo ? html`<button class="undo tap" @click=${() => this._undo?.()}>Undo</button>` : nothing}</div>` : nothing}`;
  }

  private _row(i: TodoItem): TemplateResult {
    const [aisle, colour] = aisleOf(i.summary);
    const ticked = this._shown(i) === 'completed', doneCls = ticked ? 'done' : '';
    return html`<button class="item row tap fade ${doneCls}" ?data-just=${this._just === i.uid} aria-pressed=${String(ticked)} @click=${() => this._toggle(i)}>
      <span class="box check">${ticked ? html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : nothing}</span>
      <span class="txt content"><span class="strike">${i.summary}</span></span>
      <span class="tag" style="color:color-mix(in srgb, var(${colour}) 62%, var(--ink));background:color-mix(in srgb, var(${colour}) 14%, transparent)">${aisle}</span>
    </button>`;
  }
}

if (!customElements.get('fh-groceries')) customElements.define('fh-groceries', FhGroceries);
