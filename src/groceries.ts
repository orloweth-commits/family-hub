import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { slotVar, type GroceryRecipient, type Hass } from './types';
import { keyboard, keysCss, typeKey } from './keys';
import { flip, getShape, FitController, linger, places, scrollCue, sfx, watched, wasSlow, inTime, SlowError, SLOW_SAY } from './util';
import { followList, houseUp } from './house';
/** a row that has just been touched: what it shows, where it sat, whether Home Assistant has answered yet (out), whether its four seconds are up (due) */
interface Held { to: string; was: string; t: number; n: number; out: boolean; due: boolean; busy: boolean }
import { spark } from './sparks';
/** the tick on a usual that is already on the list */
const USUAL_TICK = html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>`;
import { canListen, hearOnce } from './chat';

/** What was said, as things to buy: "milk and eggs, and some bread" is three. At most eight, so a misheard sentence cannot fill the list. */
export const saidItems = (text: string): string[] => [...new Set(String(text ?? '').replace(/[.!?]+$/g, '').split(/\s*(?:,|;|\band\b|\bplus\b|\bthen\b)\s*/i).map((s) => s.replace(/^(?:some|a|an|the|please add|add|we need|i need|get)\s+/i, '').trim()).filter((s) => s.length > 1))].slice(0, 8);

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
/** A group of this many or fewer stays whole in one column (4d: backlog 109); a longer one carries on into the next column under "…, more". */
const WHOLE = 7;
/** The open items, already sorted by aisle, as one group per aisle: [aisle, its colour, its items]. */
const groupsOf = <T extends { summary: string }>(sorted: T[]): [string, string, T[]][] => {
  const out: [string, string, T[]][] = [];
  for (const i of sorted) { const [a, c] = aisleOf(i.summary), last = out[out.length - 1]; if (last && last[0] === a) last[2].push(i); else out.push([a, c, [i]]); }
  return out;
};


export class FhGroceries extends LitElement {
  readonly lookCtl = new LookController(this);
  readonly fitCtl = new FitController(this as never);
  static styles = [styles, keysCss, css`
    :host { display: flex; gap: 16px; flex: 1; min-height: 0; position: relative; }
    /* the list has the room (0.38.3): it keeps its full width whether the keys are up or away, so nothing moves under a finger; the narrow panel beside it holds the box and the usuals */
    .list { flex: 1 1 0; min-width: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 8px; }
    .scroll { flex: 1; min-height: 0; overflow: auto; padding: 6px; margin: -6px; }
    /* the aisles flow down one column and on into the next, so a short list fills the width too and a heading never wastes a row; the page scrolls down, never sideways */
    .items { column-width: 204px; column-gap: 12px; column-fill: balance; }
    .items > *, .items > .grp > * { break-inside: avoid; margin-bottom: var(--ig, 6px); }
    /* each aisle is a group: a short one stays whole in one column, a long one carries on into the next under "…, more" (4d: backlog 109) */
    .items > .grp { break-inside: auto; margin-bottom: 0; }
    .items > .grp[data-whole] { break-inside: avoid; }
    .grp > .aisle { break-after: avoid; }
    .grp > .cont { break-before: column; }
    .items > .trolley, .items > .empty { column-span: all; }
    /* while the keys are over the lower part of the page, the list can still be scrolled clear of them */
    :host([data-shape='wide']:not([data-n3])[data-keys]) .scroll { padding-bottom: 308px; }
    .item { display: flex; align-items: center; gap: 10px; min-height: 44px; /* token */ padding: 7px 10px; border-radius: 14px; background: var(--chip); width: 100%; min-width: 0; text-align: left; }
    .box { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 2px solid var(--ink2); }
    .done .box { background: var(--ok); border-color: var(--ok); color: var(--on-ok, #fff); }
    .done .strike { color: var(--ink2); }
    .txt { flex: 1; min-width: 0; font-size: var(--fs-3); font-weight: var(--w-semi, 600); line-height: 1.2; overflow-wrap: anywhere; }
    .tag { font-size: var(--fs-1); font-weight: var(--w-bold, 700); padding: 3px 8px; border-radius: 999px; white-space: nowrap; }
    .label { font-size: var(--fs-1); }
    .aisle { display: flex; align-items: center; gap: 8px; padding-top: 6px; }
    .aisle > i { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .sayit { height: 56px; padding: 0 18px; border-radius: 999px; background: var(--chip-strong); font-size: var(--fs-3); font-weight: var(--w-bold, 700); white-space: nowrap; flex-shrink: 0; }
    .sayit[aria-pressed='true'] { box-shadow: inset 0 0 0 3px var(--accent); }
    .hidekeys { align-self: center; height: 52px; padding: 0 22px; flex-shrink: 0; white-space: nowrap; font-size: var(--fs-3); }
    /* the keys: a tray that slides up over the lower part of the page, with the box on top of it, and goes away again */
    .tray { border-radius: 28px; padding: 16px 22px; display: flex; flex-direction: column; gap: 12px; align-items: center; min-width: 0; }
    .tray .entry { width: min(100%, 900px); }
    :host([data-shape='wide']:not([data-n3])) .tray { position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; backdrop-filter: blur(34px) saturate(1.2); -webkit-backdrop-filter: blur(34px) saturate(1.2);
      box-shadow: 0 -18px 44px -18px rgba(0,0,0,.45), inset 0 0 0 1px color-mix(in srgb, var(--ink) 10%, transparent); animation: trayup var(--mt-3, 240ms) var(--e-out, ease-out) backwards; }
    /* a second layer of the look's own glass, so the list under the tray does not read through the keys */
    :host([data-shape='wide']:not([data-n3])) .tray::before, :host([data-shape='wide']:not([data-n3])) .tray::after { content: ''; position: absolute; inset: 0; border-radius: inherit; background: var(--glass); z-index: -1; }
    /* on a wide page the keys sit under the list and the box under its own panel, so the tray is only as tall as the keys */
    :host([data-shape='wide']:not([data-n3])) .tray { flex-direction: row; align-items: center; gap: 16px; padding: 16px 22px; }
    :host([data-shape='wide']:not([data-n3])) .tray .keys, :host([data-shape='wide']:not([data-n3])) .tray .keysgone { order: -1; flex: 1 1 0; min-width: 0; height: 256px; } /* five rows since batch 5: numbers and ? ! ' , . as well as the letters */
    :host([data-shape='wide']:not([data-n3])) .tray .entry { flex: 0 0 340px; width: auto; flex-wrap: wrap; align-content: center; }
    :host([data-shape='wide']:not([data-n3])) .tray .entry .field { flex: 1 1 100%; }
    :host([data-shape='wide']:not([data-n3])) .tray .entry .lead, :host([data-shape='wide']:not([data-n3])) .tray .entry .sayit { flex: 1 1 0; padding: 0 12px; }
    :host([data-shape='wide']:not([data-n3])) .tray .hidekeys { flex: 1 1 100%; }
    :host([data-shape='wide'][data-n1]:not([data-n3])) .tray .entry { flex-basis: 290px; }
    :host([data-shape='wide']:not([data-n3])) .tray[data-closing] { animation: traydown var(--mt-2, 160ms) var(--e-in, ease-in) forwards; pointer-events: none; }
    :host([data-shape='wide']:not([data-n3])) .tray .krow { flex: 0 0 46px; max-height: none; }
    @keyframes trayup { from { transform: translateY(104%); } }
    @keyframes traydown { to { transform: translateY(104%); } }
    :host([data-shape='wide'][data-n3]) .tray { order: -1; flex: none; }
    :host([data-shape='tall']) .tray { flex: 0 0 auto; }
    :host([data-shape='tall']) .tray .key:not(.wide):not(.space) { width: 64px; height: 64px; }
    :host([data-shape='tall']) .tray .key.space { width: 420px; }
    :host([data-shape='tall']) .tray .key.wide { width: 96px; }
    .keyhint { font-size: var(--fs-2); }
    .note { font-size: var(--fs-1); }
    .trolley { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 6px; }
    .clear { height: 44px; /* token */ padding: 0 16px; border-radius: 999px; background: var(--chip); font-size: var(--fs-2); font-weight: var(--w-bold, 700); white-space: nowrap; }
    .failed { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; font-size: var(--fs-3); font-weight: var(--w-semi, 600); padding: 16px; }
    .failed .retry { height: 52px; padding: 0 22px; border-radius: 999px; background: var(--chip-strong); box-shadow: inset 0 0 0 2px var(--ink2); font-size: var(--fs-3); font-weight: var(--w-bold, 700); }
    /* two columns leave no room for the aisle chip; the list is still sorted by aisle. Phones show it. */
    :host(:not([data-phone])) .tag { display: none; }
    :host([data-shape='tall']) .items { columns: 3; }

    :host([data-shape='tall']) { flex-direction: column; }
    :host([data-shape='tall']) .list { width: auto; flex: 1; min-height: 0; }
    :host([data-shape='tall']) .add { flex: 0 0 auto; }
    :host([data-phone]) { flex: none; flex-direction: column; min-width: 0; }
    :host([data-phone]) .add { order: -1; padding: 14px; border-radius: 22px; flex: none; }
    :host([data-phone]) .list { flex: none; width: auto; padding: 14px; border-radius: 22px; }
    :host([data-phone]) .scroll { overflow: visible; flex: none; padding: 0; margin: 0; }
    :host([data-phone]) .items { columns: 1; }
    :host([data-phone]) .keys { display: none; }
    :host([data-phone]) .entry { flex-wrap: wrap; }
    :host([data-phone]) .entry .field { flex: 1 1 180px; height: 52px; font-size: var(--fs-4); }
    :host([data-phone]) .entry .lead { height: 52px; flex: 0 0 auto; }
    /* tablets narrower than the canvas: the list narrows so the keyboard keeps whole keys; under 900 px the two stack and the page scrolls */
    :host([data-shape='wide'][data-n2]) .list { padding: 16px; }
    :host([data-shape='wide'][data-n1]:not([data-n3])) .add { flex-basis: 330px; }
    :host([data-n2]) .add { padding: 16px; }
    :host([data-n2]) .krow, :host([data-n2]) .keys { gap: 6px; }
    :host([data-shape='wide'][data-n3]) { flex-direction: column; overflow-y: auto; gap: 12px; }
    :host([data-shape='wide'][data-n3]) .add { order: -1; flex: none; gap: 10px; }
    :host([data-shape='wide'][data-n3]) .krow { flex: 0 0 48px; }
    :host([data-shape='wide'][data-n3]) .list { width: auto; flex: none; }
    :host([data-shape='wide'][data-n3]) .scroll { overflow: visible; flex: none; }
    :host([data-shape='wide'][data-n3]) .items { columns: 3; }
    :host([data-shape='tall'][data-n3]) .tray .key.space { width: 380px; }
    .add { flex: 0 0 384px; min-width: 0; border-radius: 28px; padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
    .entry { display: flex; gap: 10px; align-items: center; min-width: 0; }
    /* in the narrow panel the box has a line to itself, with Add (and Say it) under it */
    :host([data-shape='wide']:not([data-n3])) .add .entry { flex-wrap: wrap; }
    :host([data-shape='wide']:not([data-n3])) .add .entry .field { flex: 1 1 100%; }
    :host([data-shape='wide']:not([data-n3])) .add .entry .lead, :host([data-shape='wide']:not([data-n3])) .add .entry .sayit { flex: 1 1 0; padding: 0 12px; }
    .field { flex: 1; min-width: 0; width: 0; height: 60px; border-radius: 16px; background: var(--chip-strong); border: 0; padding: 0 18px; font: inherit; font-size: var(--fs-5); font-weight: var(--w-semi, 600); color: var(--ink);
      box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--primary) 50%, transparent); outline: none; }
    .field:focus-visible { outline: 3px solid var(--ink); outline-offset: 3px; }
    /* (4e, backlog 118) in the dark a field waiting to be typed in has a hairline; the theme's ring is for the one being typed in */
    :host([data-dark]) .field { box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--ink3) 60%, transparent); } :host([data-dark]) .field:focus { box-shadow: inset 0 0 0 2.5px var(--primary); }
    .field::placeholder { color: var(--ink2); font-weight: 500; }
    .entry .lead { height: 60px; padding: 0 26px; font-size: var(--fs-3); flex-shrink: 0; }
    /* the usuals are large chips, one tap each: big enough for the smallest hand and to read from across the kitchen */
    .usuals { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; align-content: start; }
    .usuals > span { grid-column: 1 / -1; font-size: var(--fs-1); font-weight: var(--w-bold, 700); }
    /* (the full check, 0.38.23) in the narrow panel always two across: on a tablet the panel is 330 px and one across ran the usuals under the dock */
    :host([data-shape='wide']:not([data-n3])) .usuals { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    /* with the keys up the tray covers the lower part of the page: the usuals close up, three across, so every one stays in reach above it (4d: backlog 109) */
    /* while typing, "Send the list to" steps aside so every usual stays above the taller key tray (batch 5: five rows of keys) */
    :host([data-keys][data-shape='wide']:not([data-n3])) .sendrow { display: none !important; }
    :host([data-keys][data-shape='wide']:not([data-n3])) .usuals { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    :host([data-keys][data-shape='wide']:not([data-n3])) .add .usuals .chip.quick { min-height: 52px; padding: 4px 10px; border-radius: 16px; font-size: var(--fs-2); }
    .add .usuals .chip.quick { height: auto; min-height: 64px; padding: 6px 16px; border-radius: 20px; font-size: var(--fs-3); font-weight: var(--w-bold, 700); text-align: left; line-height: 1.15; white-space: normal; overflow-wrap: anywhere; min-width: 0; }
    :host([data-phone]) .add .usuals .chip.quick { min-height: 52px; }
    /* (the second review's cut, item 9) a usual already on the list: a tick in the colour every tick on the page has, in place of the plus */
    .add .usuals .chip.quick[data-on] { display: inline-flex; align-items: center; gap: 8px; color: var(--ink2); }
    .uon { display: inline-grid; place-items: center; flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; background: var(--ok); color: var(--on-ok, #fff); line-height: 0; }
    /* the keyboard takes the room that is left: taller keys, not an empty band above them */
    .keys { flex: 1; min-height: 0; justify-content: center; }
    :host(:not([data-shape='tall']):not([data-phone])) .krow { flex: 1 1 52px; max-height: 78px; min-height: 44px; }
    :host(:not([data-shape='tall']):not([data-phone])) .key { height: 100%; width: 56px; }
    :host(:not([data-shape='tall']):not([data-phone])) .key.wide { width: 86px; }
    :host(:not([data-shape='tall']):not([data-phone])) .key.space { width: 380px; }
    .chip { height: 44px; /* token */ padding: 0 12px; border-radius: 999px; background: var(--chip); font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
    /* in the narrow panel the words have their own line, so two phones sit side by side under them and never wrap one by one */
    :host([data-shape='wide']:not([data-n3])) .sendl { flex-basis: 100% !important; }
    .who { height: 48px; padding: 0 18px 0 8px; border-radius: 999px; display: flex; align-items: center; gap: 8px; font-size: var(--fs-2); font-weight: var(--w-semi, 600); }
    .toast.act { display: flex; align-items: center; gap: 14px; pointer-events: auto; padding: 8px 8px 8px 22px; }
    .toast .undo { height: 44px; /* token */ min-width: 72px; padding: 0 18px; border-radius: 999px; background: #fff; color: #14141a; font-size: var(--fs-2); font-weight: var(--w-heavy, 800); }
    .toast .undo:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
  `];

  static properties = {
    _tk: { state: true }, _just: { state: true }, _sending: { state: true },
    hass: { attribute: false },
    entity: {}, pipeline: {}, _keys: { state: true }, _hearing: { state: true },
    usuals: { attribute: false },
    recipients: { attribute: false },
    _items: { state: true },
    _typed: { state: true },
    _caps: { state: true },
    _toast: { state: true }, _undo: { state: true }, _sticky: { state: true }, _adding: { state: true }, _failed: { state: true }, _hidden: { state: true }, _cont: { state: true }
  };

  hass?: Hass;
  entity = 'todo.shopping_list';
  /** the Assist pipeline that turns speech into words (Ask's), for "Say it"; '' when there is none */
  pipeline = '';
  /** the on-screen keys: the list comes first, and the keys come up when the field is touched */
  private _keys = false;
  private _hearing: { stop: () => void } | null = null;
  /** "Say it": listen once, then add each thing that was said. Shown only where the browser gives a page the microphone (https). */
  private _sayIt(): void {
    if (this._hearing) { this._hearing.stop(); return; }
    if (!this.hass?.connection || !this.pipeline) return;
    const h = hearOnce(this.hass, this.pipeline); this._hearing = h;
    h.text.then((t) => { if (this._hearing !== h) return; this._hearing = null; const items = saidItems(t); if (!items.length) { this._say('I did not catch that. Try again, or type it.'); return; } for (const i of items) this._add(i, null); this._say(`Heard: ${items.join(', ')}`); },
      () => { if (this._hearing !== h) return; this._hearing = null; this._say('The microphone is not available on this screen.'); });
  }
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
  /** where a long aisle carries on into another column: the item at the top of that column → its aisle (it gets a "…, more" heading). Measured after drawing (`_measureCont`) */
  private _cont: Record<string, string> = {};
  private _contKey = ''; private _contStep = 0;
  /** ticked items that were just cleared: out of sight at once, removed for good when the Undo window closes */
  private _hidden: string[] = [];
  private _clearTimer?: number;

  /** a font that arrives after the list was measured moves the columns' breaks: measure again (a look's own hand-written font, Fridge's) */
  private _fontsIn = (): void => { this._contKey = ''; this.requestUpdate(); };
  /** (the full check, 0.38.23) the hint under the usuals is the least needed line in the panel: shown only where it fits whole (a tablet, or the wall with long usuals, ran it past the panel's foot) */
  private _hintRo?: ResizeObserver;
  private _fitHint(): void {
    const add = this.renderRoot.querySelector<HTMLElement>('.add'), hint = add?.querySelector<HTMLElement>('[data-keyhint]');
    if (!add || !hint) return;
    hint.style.display = '';
    if (add.scrollHeight > add.clientHeight + 1) hint.style.display = 'none';
  }
  connectedCallback(): void { super.connectedCallback(); document.fonts?.addEventListener?.('loadingdone', this._fontsIn); if (typeof ResizeObserver !== 'undefined') { this._hintRo ??= new ResizeObserver(() => this._fitHint()); this._hintRo.observe(this); } }
  disconnectedCallback(): void { super.disconnectedCallback(); this._hintRo?.disconnect(); document.fonts?.removeEventListener?.('loadingdone', this._fontsIn); this._hearing?.stop(); this._hearing = null; this._commitClear(); this._unsub?.(); this._unsub = undefined; this._subFor = ''; }

  protected updated(c: PropertyValues): void {
    if ((c.has('hass') || c.has('entity')) && this.hass && this._subFor !== this.entity) this._subscribe();
    // the box moves into the tray with the keys: it keeps the caret, so a real keyboard still types; with the keys away it lets go (a focused box holds the screensaver back)
    if (c.has('_keys')) { this.toggleAttribute('data-keys', this._keys); const f = this.renderRoot.querySelector<HTMLInputElement>('.entry .field'); if (this._keys) f?.focus({ preventScroll: true }); else f?.blur(); }
    this.renderRoot.querySelectorAll('.scrolly').forEach(scrollCue);
    // a long list changes without the rows travelling: sixty rows moving at once is a blur, and slow on a wall panel
    if (this._places) { if (this._places.size <= 40) flip(this.renderRoot, '.row[data-key]', this._places); this._places = null; }
    this._measureCont();
    this._fitHint();
  }

  /**
   * A long aisle that the columns break carries on at the top of the next column under its own heading ("Fruit & veg, more").
   * Measured, not guessed: each item of a long group that the columns put in another column than the thing before it gets that
   * heading, and the heading starts its column by itself (a column break before it, where the columns broke anyway), so its own
   * height cannot move it under the item before. The columns are balanced again with it; a break that then falls elsewhere in a
   * long group is found the next time round (at most three). Done once for each list, width and font, so it never goes round in circles.
   */
  private _measureCont(): void {
    const box = this.renderRoot.querySelector<HTMLElement>('.items');
    if (!box) return;
    const key = `${box.clientWidth}|${box.getAttribute('data-fit') ?? ''}|${[...box.querySelectorAll<HTMLElement>('.grp')].map((g) => `${g.dataset.g}:${[...g.querySelectorAll<HTMLElement>('.row[data-key]')].map((r) => r.dataset.key).join(',')}`).join('/')}`;
    if (key !== this._contKey) { this._contKey = key; this._contStep = 0; if (Object.keys(this._cont).length) { this._cont = {}; return; } }
    if (this._contStep >= 3) return;
    this._contStep++;
    // (the column a thing sits in, from layout: a row may be part-way through its move (flip), which getBoundingClientRect would include)
    const x = (e: Element | null): number => (e as HTMLElement | null)?.offsetLeft ?? -1;
    const next = { ...this._cont };
    for (const g of box.querySelectorAll<HTMLElement>('.grp:not([data-whole])')) {
      for (const r of g.querySelectorAll<HTMLElement>('.row[data-key]')) {
        const prev = r.previousElementSibling;
        if (prev && !prev.classList.contains('cont') && Math.abs(x(r) - x(prev)) > 20) next[r.dataset.key!] = g.dataset.g!;
      }
    }
    if (JSON.stringify(next) !== JSON.stringify(this._cont)) this._cont = next; else this._contStep = 3;
  }

  private async _subscribe(): Promise<void> {
    this._unsub?.();
    this._subFor = this.entity;
    const conn = this.hass?.connection;
    if (!conn) { this._failed = true; return; }
    // followed live; while Home Assistant is away the list stays as it was last read (house.ts), and it is followed afresh when it is back
    this._unsub = followList<TodoItem>(conn, this.entity, (items) => { this._items = items.filter((i) => i && typeof i.summary === 'string'); this._failed = false; }, () => { this._failed = true; });
  }

  /** A message. One marked `stay` (something was not saved) remains until it is dismissed. */
  private _sticky = false;
  private _say(m: string, undo?: () => void, stay = false): void { this._toast = m; this._undo = undo; this._sticky = stay; clearTimeout(this._toastTimer); if (!stay) this._toastTimer = window.setTimeout(() => { this._toast = ''; this._undo = undefined; }, undo ? 6000 : 2600); }
  /** Items on their way to the list: each shows as a waiting row until Home Assistant has it, so a slow link never looks like a missed tap. */
  private _adding: string[] = [];

  private _add(name = this._typed, el: Element | null = this.renderRoot.querySelector('.add .lead')): void {
    const n = name.trim();
    if (!n) { this._say('Type something first'); return; }
    if (!this.hass) return;
    if (!houseUp()) { sfx('error'); this._say(SLOW_SAY); return; } // (Home Assistant is not answering: the words stay in the box)
    const nice = n.charAt(0).toUpperCase() + n.slice(1), typed = name === this._typed;
    if (this._onList(nice)) { this._say(`${nice} is already on the list`); if (typed) { this._typed = ''; this._caps = true; } return; }
    // a failed add says so and gives the words back, so nothing typed is lost
    if (this._adding.includes(nice)) return; // already on its way
    this._adding = [...this._adding, nice]; sfx('send');
    void watched(el, Promise.resolve(this.hass.callService('todo', 'add_item', { item: nice }, { entity_id: this.entity }))).then((ok) => { this._adding = this._adding.filter((x) => x !== nice); if (ok) return; sfx('error'); this._say(wasSlow() ? SLOW_SAY : `Couldn’t add ${nice}. Try again`); if (typed && !this._typed) { this._typed = nice; this._caps = false; } });
    if (typed) { this._typed = ''; this._caps = true; }
  }
  private _toggle(i: TodoItem): void {
    // the touch is answered at once: the tick, its sound and the service call all happen now. The row keeps its place for a few seconds, so a slip can be tapped back.
    if (this._tk[i.uid]?.out) return; // a second tap while the first is still on its way is not sent
    if (!houseUp()) { sfx('error'); this._say(SLOW_SAY); return; }
    const to = this._shown(i) === 'completed' ? 'needs_action' : 'completed';
    sfx(to === 'completed' ? 'tick' : 'untick');
    if (to === 'completed') { const row = [...this.renderRoot.querySelectorAll('button.item')].find((b) => b.querySelector('.strike')?.textContent === i.summary), list = this.renderRoot.querySelector('.items');
      if (row) spark('tick', row.querySelector('.check') ?? row);
      // the last thing on the list: a ute delivers it (at most once a day)
      if (list && this._items.every((x) => x.uid === i.uid || this._shown(x) === 'completed') && localStorage.getItem('fh-truck') !== new Date().toDateString()) { try { localStorage.setItem('fh-truck', new Date().toDateString()); } catch { /* private mode */ } spark('truck', list); } }
    clearTimeout(this._tk[i.uid]?.t);
    const n = (this._tk[i.uid]?.n ?? 0) + 1; // the latest touch on a row wins
    const drop = (): void => { const { [i.uid]: _, ...rest } = this._tk; this._tk = rest; };
    const patch = (p: Partial<Held>): void => { const e = this._tk[i.uid]; if (e && e.n === n) this._tk = { ...this._tk, [i.uid]: { ...e, ...p } }; };
    // the tick holds until Home Assistant has answered (however long that takes), and the row keeps its place for at least four seconds
    this._tk = { ...this._tk, [i.uid]: { to, was: this._tk[i.uid]?.was ?? i.status, n, out: true, due: false, busy: false,
      t: window.setTimeout(() => { const e = this._tk[i.uid]; if (!e || e.n !== n) return; if (e.out) patch({ due: true }); else drop(); }, 4000) } };
    const slow = window.setTimeout(() => patch({ busy: true }), 250);
    this._just = i.uid; window.setTimeout(() => { if (this._just === i.uid) this._just = ''; }, 700);
    inTime(this.hass?.callService('todo', 'update_item', { item: i.uid, status: to }, { entity_id: this.entity })).then(() => '', (err: unknown) => (err instanceof SlowError ? 'slow' : 'no')).then((bad) => {
      clearTimeout(slow); const e = this._tk[i.uid]; if (!e || e.n !== n) return;
      if (bad) { clearTimeout(e.t); drop(); sfx('error'); this._say(bad === 'slow' ? SLOW_SAY : `Couldn’t ${to === 'completed' ? 'tick' : 'untick'} ${i.summary}. Try again`); return; }
      if (e.due) drop(); else patch({ out: false, busy: false });
    });
  }
  private _tk: Record<string, Held> = {};
  /** where the rows were before this render, so one that changes group can travel there */
  private _places: Map<string, DOMRect> | null = null;
  protected willUpdate(c: PropertyValues): void { this._places = this.hasUpdated && (c.has('_tk') || c.has('_items') || c.has('_hidden')) ? places(this.renderRoot, '.row[data-key]') : null; }
  private _just = '';
  /** what the row shows (the touch wins until Home Assistant catches up) and which group it sits in (where it was, for a few seconds) */
  private _shown(i: TodoItem): string { return this._tk[i.uid]?.to ?? i.status; }
  /** (the second review's cut, item 9) whether a thing is on the list still to buy, or on its way there: a usual that is shows a tick, and a tap does not add it twice */
  private _onList(name: string): boolean { const n = name.trim().toLowerCase(); return this._adding.some((a) => a.toLowerCase() === n) || this._items.some((i) => this._shown(i) === 'needs_action' && i.summary.trim().toLowerCase() === n); }
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
    const n = ids.length;
    if (this._undo) { this._toast = ''; this._undo = undefined; }
    // a clear that did not happen is said until someone has seen it: the ticked items are still on the list
    inTime(this.hass?.callService('todo', 'remove_item', { item: ids }, { entity_id: this.entity })).catch((e: unknown) => { if (this.isConnected) this._say(e instanceof SlowError ? `${SLOW_SAY} The ${n === 1 ? 'ticked item is' : `${n} ticked items are`} still on the list.` : `Couldn’t clear the ${n === 1 ? 'ticked item' : `${n} ticked items`}. Try again`, undefined, true); });
  }

  private _sending = '';
  private async _send(r: GroceryRecipient): Promise<void> {
    if (this._sending) return;
    const left = this._items.filter((i) => i.status === 'needs_action');
    if (!left.length) { this._say('The list is empty'); return; }
    const svc = r.notify?.replace(/^notify\./, '');
    if (!svc || !this.hass?.services?.notify?.[svc]) { this._say(`Set up the Home Assistant app on ${r.name}’s phone first`); return; }
    const grouped = new Map<string, string[]>();
    for (const i of left) { const a = aisleOf(i.summary)[0]; grouped.set(a, [...(grouped.get(a) ?? []), i.summary]); }
    const message = [...grouped].map(([a, xs]) => `${a}: ${xs.join(', ')}`).join('\n');
    // say it was sent only when Home Assistant took it
    this._sending = r.name;
    let ok = false;
    try { await this.hass.callService('notify', svc, { title: `Groceries (${left.length})`, message, data: { url: '/todo?entity_id=' + this.entity } }); ok = true; } catch { /* told below */ }
    this._sending = '';
    if (this.isConnected) this._say(ok ? `List sent to ${r.name}’s phone` : `The list didn’t reach ${r.name}’s phone. Try again`);
  }

  render(): TemplateResult {
    const [toast, toastOut] = linger(this, 'toast', this._toast ? { msg: this._toast, undo: !!this._undo, stay: this._sticky } : null);
    const adding = this._adding.filter((n) => !this._items.some((i) => i.status === 'needs_action' && i.summary.toLowerCase() === n.toLowerCase()));
    const open = this._items.filter((i) => this._group(i) === 'needs_action');
    const done = this._items.filter((i) => this._group(i) === 'completed' && !this._hidden.includes(i.uid));
    const sorted = [...open].sort((a, b) => aisleOf(a.summary)[0].localeCompare(aisleOf(b.summary)[0]));
    // grouped by aisle: each group under its own heading (a list of one or two things needs none)
    const heads = sorted.length > 2, canSay = !!this.pipeline && canListen();
    // the keys come up as a tray over the lower part of the page, and the box goes with them; a phone has its own keyboard and keeps the box where it is
    const [tray, trayOut] = linger(this, 'tray', this._keys ? 1 : 0, 200);
    const entry = (up: boolean): TemplateResult => html`<div class="entry">
          <input class="field" .value=${this._typed} inputmode=${getShape() === 'phone' ? 'text' : 'none'} autocomplete="off" placeholder="Type an item…" aria-label="New item"
            @pointerdown=${() => { if (getShape() !== 'phone') this._keys = true; }}
            @input=${(e: InputEvent) => { this._typed = (e.target as HTMLInputElement).value; }}
            @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._add(); }} />
          <button class="tap lead" @click=${() => this._add()}>Add</button>
          ${canSay ? html`<button class="tap sayit" data-act="say" aria-pressed=${String(!!this._hearing)} aria-label=${this._hearing ? 'Listening. Tap to stop' : 'Say what to add'} @click=${() => this._sayIt()}>${this._hearing ? 'Listening…' : '🎤 Say it'}</button>` : nothing}
          ${up ? html`<button class="pill tap hidekeys" data-act="hide-keys" @click=${() => { this._keys = false; }}>Hide the keys</button>` : nothing}
        </div>`;
    return html`
      <section class="glass list" aria-label="Shopping list">
        <div style="display:flex;align-items:baseline;justify-content:space-between">
          <h1 class="t-title">Groceries</h1>
          ${this._failed ? nothing : html`<span class="muted" style="font-size:var(--fs-2);font-weight:var(--w-semi, 600)">${open.length} to buy</span>`}
        </div>
        ${this._failed ? html`<div class="failed" role="alert"><span style="color:var(--ink2)">${icon('cart', 40)}</span><span>Can’t reach the shopping list.</span>
          <button class="retry tap" @click=${() => { this._subFor = ''; this._subscribe(); }}>Try again</button></div>` : html`
        <div class="scroll scrolly" @scroll=${scrollCue}><div class="items">
          ${adding.map((n) => html`<div class="item row pending" role="status" aria-busy="true" data-busy><span class="box check"></span><span class="txt content"><span class="strike">${n}</span></span><span class="tag">Adding…</span></div>`)}
          ${heads ? groupsOf(sorted).map(([aisle, colour, rows]) => html`<div class="grp" data-g=${aisle} ?data-whole=${rows.length <= WHOLE}>
              <div class="aisle label" role="heading" aria-level="2" data-aisle=${aisle}><i style="background:var(${colour})" aria-hidden="true"></i>${aisle}</div>
              ${rows.map((i) => html`${this._cont[i.uid] === aisle ? html`<div class="aisle label cont" data-cont=${aisle} data-for=${i.uid} aria-hidden="true"><i style="background:var(${colour})"></i>${aisle}, more</div>` : nothing}${this._row(i)}`)}</div>`)
            : sorted.map((i) => this._row(i))}
          ${done.length ? html`<div class="trolley">
            <span class="label">In the trolley</span>
            <button class="clear tap" @click=${() => this._clearDone()}>Clear ticked (${done.filter((i) => this._shown(i) === 'completed').length})</button></div>
            ${done.map((i) => this._row(i))}` : nothing}
          ${!open.length && !done.length && !adding.length ? html`<div class="empty" style="padding:24px 0"><span style="color:var(--ink2)">${icon('cart', 40)}</span><span style="font-size:var(--fs-3);font-weight:var(--w-semi, 600)">Nothing on the list yet</span><span style="font-size:var(--fs-2)">Type an item or tap a usual to add it.</span></div>` : nothing}
        </div></div>`}
        <span class="muted note">Also live in the Home Assistant app – tick things off in the shop.</span>
      </section>

      <section class="glass add" aria-label="Add an item">
        <div class="sendrow" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <span class="muted sendl" style="font-size:var(--fs-2);font-weight:var(--w-semi, 600);flex:1 1 auto">Send the list to</span>
          ${this.recipients.map((r) => html`<button class="who glass tap" ?disabled=${!!this._sending} ?data-busy=${this._sending === r.name} aria-busy=${this._sending === r.name ? 'true' : nothing} @click=${() => void this._send(r)}>
            <span class="avatar" style="width:34px;height:34px;font-size:var(--fs-2);background:${slotVar(r.colour)}">${r.name[0]}</span>${r.name}</button>`)}
          ${!this.recipients.length ? html`<span class="muted" style="font-size:var(--fs-1)">(add phones in the card settings)</span>` : nothing}
        </div>
        ${tray ? nothing : entry(false)}
        <div class="usuals">
          <span class="muted">Usuals</span>
          ${this.usuals.map((u) => this._onList(u)
            ? html`<button class="chip quick tap" data-on aria-label="${u}: on the list already" @click=${() => { sfx('tap'); this._say(`${u.charAt(0).toUpperCase() + u.slice(1)} is already on the list`); }}><span class="uon" aria-hidden="true">${USUAL_TICK}</span>${u}</button>`
            : html`<button class="chip quick tap" aria-label="Add ${u}" @click=${(e: Event) => this._add(u, e.currentTarget as Element)}>+ ${u}</button>`)}
        </div>
        ${this._keys ? nothing : html`<span class="muted keyhint" data-keyhint>Touch the box to type. Usuals are one tap.</span>`}
      </section>
      ${tray ? html`<section class="glass tray" aria-label="Type an item" ?data-closing=${trayOut}>
        ${entry(true)}
        ${trayOut ? html`<div class="keysgone" aria-hidden="true"></div>` : keyboard((k) => { [this._typed, this._caps] = typeKey(this._typed, k, this._caps); }, this._caps, () => { this._caps = !this._caps; }, true, true, true)}
      </section>` : nothing}
      <div class="says" role="status" aria-live="polite">${toast ? html`<div class="toast ${toast.undo || toast.stay ? 'act' : ''}" ?data-closing=${toastOut}><span>${toast.msg}</span>${toast.undo ? html`<button class="undo tap" @click=${() => { sfx('undo'); this._undo?.(); }}>Undo</button>` : toast.stay ? html`<button class="undo tap" @click=${() => { this._toast = ''; this._sticky = false; }}>OK</button>` : nothing}</div>` : nothing}</div>`;
  }

  private _row(i: TodoItem): TemplateResult {
    const [aisle, colour] = aisleOf(i.summary);
    const ticked = this._shown(i) === 'completed', doneCls = ticked ? 'done' : '';
    return html`<button class="item row tap ${doneCls}" data-key=${i.uid} ?data-busy=${!!this._tk[i.uid]?.busy} aria-busy=${this._tk[i.uid]?.busy ? 'true' : nothing} ?data-just=${this._just === i.uid} aria-pressed=${String(ticked)} @click=${() => this._toggle(i)}>
      <span class="box check">${ticked ? html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M5 12.5l4.5 4.5L19 7.5"></path></svg>` : nothing}</span>
      <span class="txt content"><span class="strike">${i.summary}</span></span>
      <span class="tag" style="color:color-mix(in srgb, var(${colour}) 62%, var(--ink));background:color-mix(in srgb, var(${colour}) 14%, transparent)">${aisle}</span>
    </button>`;
  }
}

if (!customElements.get('fh-groceries')) customElements.define('fh-groceries', FhGroceries);
