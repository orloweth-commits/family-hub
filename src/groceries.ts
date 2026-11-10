import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { slotVar, type GroceryRecipient, type Hass } from './types';
import { keyboard, keysCss, typeKey } from './keys';
import { FitController, scrollCue } from './util';

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
  const n = name.toLowerCase();
  for (const [aisle, colour, re] of AISLE_RE) if (re.test(n)) return [aisle, colour];
  return ['Other', '--p-family'];
};


export class FhGroceries extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, keysCss, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; }
    .list { width: 420px; flex-shrink: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 8px; }
    .items { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 6px; }
    .item { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 14px; background: var(--chip); width: 100%; text-align: left; }
    .box { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 2px solid var(--ink3); }
    .done .box { background: var(--ok); border-color: var(--ok); color: #fff; }
    .done .txt { color: var(--ink3); text-decoration: line-through; }
    .txt { flex: 1; font-size: 17px; font-weight: var(--w-semi, 600); }
    .tag { font-size: 12px; font-weight: var(--w-bold, 700); padding: 4px 9px; border-radius: 999px; white-space: nowrap; }
    .items[data-fit] { gap: 3px; }
    .items[data-fit] .item { padding: 6px 10px; }
    .items[data-fit] .txt { font-size: 15px; }
    .items[data-fit] .box { width: 22px; height: 22px; }
    .list:has(.items[data-fit='2']), .list:has(.items[data-fit='3']) { width: 560px; }
    .items[data-fit='2'], .items[data-fit='3'] { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8px; align-content: start; }
    .items[data-fit='2'] > :not(.item), .items[data-fit='3'] > :not(.item) { grid-column: 1 / -1; }
    .items[data-fit='2'] .tag, .items[data-fit='3'] .tag { display: none; }
    /* the wider list borrows room from the keyboard, so its keys slim down a little */
    .list:has(.items[data-fit='2']) + .add .key, .list:has(.items[data-fit='3']) + .add .key { width: 52px; height: 58px; }
    .list:has(.items[data-fit='2']) + .add .key.wide, .list:has(.items[data-fit='3']) + .add .key.wide { width: 78px; }
    .list:has(.items[data-fit='2']) + .add .key.space, .list:has(.items[data-fit='3']) + .add .key.space { width: 340px; }
    :host([data-shape='tall']) .items[data-fit='3'] { grid-template-columns: repeat(3, 1fr); }
    :host([data-shape='tall']) .items[data-fit] .tag { display: inline; }
    :host([data-shape='tall']) .add .key:not(.wide):not(.space) { width: 64px !important; height: 64px !important; }
    :host([data-shape='tall']) .add .key.space { width: 420px !important; }
    :host([data-shape='tall']) .add .key.wide { width: 96px !important; }
    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .list { width: auto !important; flex: 1; min-height: 0; }
    :host([data-shape='tall']) .add { flex: 0 0 auto; }
    .add { flex: 1; min-width: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
    .field { flex: 1; height: 60px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: 24px; font-weight: var(--w-semi, 600); color: var(--ink);
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); outline: none; }
    .field::placeholder { color: var(--ink3); font-weight: 500; }
    .keys { flex: 1; justify-content: flex-end; }
    .chip { height: 38px; padding: 0 14px; border-radius: 999px; background: var(--chip); font-size: 14px; font-weight: var(--w-semi, 600); }
    .who { height: 48px; padding: 0 18px 0 8px; border-radius: 999px; display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: var(--w-semi, 600); }
  `];

  static properties = {
    hass: { attribute: false },
    entity: {},
    usuals: { attribute: false },
    recipients: { attribute: false },
    _items: { state: true },
    _typed: { state: true },
    _caps: { state: true },
    _toast: { state: true }
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

  disconnectedCallback(): void { super.disconnectedCallback(); this._unsub?.(); this._unsub = undefined; this._subFor = ''; }

  protected updated(c: PropertyValues): void {
    if ((c.has('hass') || c.has('entity')) && this.hass && this._subFor !== this.entity) this._subscribe();
    this.renderRoot.querySelectorAll('.scrolly').forEach(scrollCue);
  }

  private async _subscribe(): Promise<void> {
    this._unsub?.();
    this._subFor = this.entity;
    const conn = this.hass?.connection;
    if (!conn) return;
    try {
      this._unsub = await conn.subscribeMessage<{ items: TodoItem[] }>((m) => { this._items = m.items; }, { type: 'todo/item/subscribe', entity_id: this.entity });
    } catch (e) { console.warn('Family Hub: grocery subscribe failed', e); }
  }

  private _say(m: string): void { this._toast = m; clearTimeout(this._toastTimer); this._toastTimer = window.setTimeout(() => { this._toast = ''; }, 2600); }

  private _add(name = this._typed): void {
    const n = name.trim();
    if (!n || !this.hass) return;
    const nice = n.charAt(0).toUpperCase() + n.slice(1);
    if (this._items.some((i) => i.status === 'needs_action' && i.summary.toLowerCase() === nice.toLowerCase())) { this._say(`${nice} is already on the list`); this._typed = ''; this._caps = true; return; }
    this.hass.callService('todo', 'add_item', { item: nice }, { entity_id: this.entity });
    this._typed = ''; this._caps = true;
  }
  private _toggle(i: TodoItem): void {
    this.hass?.callService('todo', 'update_item', { item: i.uid, status: i.status === 'completed' ? 'needs_action' : 'completed' }, { entity_id: this.entity });
  }
  private _clearDone(): void { this.hass?.callService('todo', 'remove_completed_items', {}, { entity_id: this.entity }); }

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
    const open = this._items.filter((i) => i.status === 'needs_action');
    const done = this._items.filter((i) => i.status === 'completed');
    const sorted = [...open].sort((a, b) => aisleOf(a.summary)[0].localeCompare(aisleOf(b.summary)[0]));
    return html`
      <section class="glass list" aria-label="Shopping list">
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <h1 class="t-title">Groceries</h1>
          <span class="muted" style="font-size:14px;font-weight:var(--w-semi, 600)">${open.length} to buy</span>
        </div>
        <div class="items scrolly" data-fits @scroll=${scrollCue}>
          ${sorted.map((i) => this._row(i))}
          ${done.length ? html`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
            <span class="label">In the trolley</span>
            <button class="tap muted" style="font-size:13px;font-weight:var(--w-bold, 700)" @click=${() => this._clearDone()}>Clear ${done.length}</button></div>
            ${done.map((i) => this._row(i))}` : nothing}
          ${!this._items.length ? html`<div class="empty"><span style="color:var(--accent)">${icon('cart', 40)}</span><span>Nothing on the list yet</span></div>` : nothing}
        </div>
        <span class="muted" style="font-size:12px">Also live in the Home Assistant app – tick things off in the shop.</span>
      </section>

      <section class="glass add" aria-label="Add an item">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="muted" style="font-size:15px;font-weight:var(--w-semi, 600);flex:1">Send the list to</span>
          ${this.recipients.map((r) => html`<button class="who glass tap" @click=${() => this._send(r)}>
            <span class="avatar" style="width:34px;height:34px;font-size:14px;background:${slotVar(r.colour)}">${r.name[0]}</span>${r.name}</button>`)}
          ${!this.recipients.length ? html`<span class="muted" style="font-size:13px">(add phones in the card settings)</span>` : nothing}
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <input class="field" .value=${this._typed} inputmode="none" autocomplete="off" placeholder="Type an item…" aria-label="New item"
            @input=${(e: InputEvent) => { this._typed = (e.target as HTMLInputElement).value; }}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._add(); }} />
          <button class="tap primary" style="height:60px;padding:0 26px;border-radius:16px;font-size:18px;font-weight:var(--w-bold, 700)" @click=${() => this._add()}>Add</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center">
          <span class="muted" style="font-size:13px;font-weight:var(--w-bold, 700);margin-right:4px">Usuals</span>
          ${this.usuals.map((u) => html`<button class="chip quick tap" @click=${() => this._add(u)}>+ ${u}</button>`)}
        </div>
        ${keyboard((k) => { [this._typed, this._caps] = typeKey(this._typed, k, this._caps); }, this._caps, () => { this._caps = !this._caps; })}
      </section>
      ${this._toast ? html`<div class="toast" role="status">${this._toast}</div>` : nothing}`;
  }

  private _row(i: TodoItem): TemplateResult {
    const [aisle, colour] = aisleOf(i.summary);
    const doneCls = i.status === 'completed' ? 'done' : '';
    return html`<button class="item row tap fade ${doneCls}" aria-pressed=${String(i.status === 'completed')} @click=${() => this._toggle(i)}>
      <span class="box check">${i.status === 'completed' ? html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : nothing}</span>
      <span class="txt content">${i.summary}</span>
      <span class="tag" style="color:color-mix(in srgb, var(${colour}) 62%, var(--ink));background:color-mix(in srgb, var(${colour}) 14%, transparent)">${aisle}</span>
    </button>`;
  }
}

if (!customElements.get('fh-groceries')) customElements.define('fh-groceries', FhGroceries);
