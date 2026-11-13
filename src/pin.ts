import { LitElement, html, css } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';
import { sfx } from './sound';

/** Parent PIN pad. Fires `ok` when the right PIN is entered, `cancel` when dismissed. */
/** Wrong tries are counted across every pad on the panel. */
const LOCK = { misses: 0, until: 0 };
/** Whether the digits take a new order each time a pad opens (the card sets this from `pin_shuffle`; on unless that is false). */
let SHUFFLE = true;
export const setPinShuffle = (on: boolean): void => { SHUFFLE = on; };
const ORDER = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
/** The ten digits for one opening of the pad: shuffled, and never left in the usual order. */
const deal = (): string[] => {
  if (!SHUFFLE) return ORDER;
  for (;;) { const d = [...ORDER]; for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } if (d.some((x, i) => x !== ORDER[i])) return d; }
};

export class FhPin extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, css`
    :host([data-phone]) { position: fixed !important; }
    :host { position: absolute; inset: 0; z-index: 35; display: flex; align-items: center; justify-content: center; padding: 12px; background: var(--scrim, rgba(6,16,28,.52)); }
    .pad { border-radius: 32px; padding: 20px 28px 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; width: 340px; max-width: 100%; max-height: 100%; overflow: visible; animation: sheet var(--m-3, 240ms) var(--e-spring, ease) backwards; }
    :host { animation: scrimin var(--m-2, 160ms) var(--e-out, ease) backwards; }
    :host([data-closing]) { animation: fhout var(--m-2, 160ms) var(--e-in, ease-in) forwards; pointer-events: none; }
    .dots { display: flex; gap: 14px; height: 20px; }
    .dots span { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--ink2); transition: background var(--m-2, 160ms); }
    .dots span.on { background: var(--ink); border-color: var(--ink); }
    .grid { display: grid; grid-template-columns: repeat(3, 76px); gap: 12px; }
    .grid button { height: 76px; border-radius: 50%; background: var(--chip-strong); font-size: 28px; font-weight: var(--w-semi, 600); display: flex; align-items: center; justify-content: center; }
    .what { font-size: 15px; font-weight: var(--w-semi, 600); color: var(--ink2); align-self: flex-start; margin-top: -8px; }
    @media (max-height: 640px) { .grid { grid-template-columns: repeat(3, 64px); gap: 8px; } .grid button { height: 64px; } .pad { gap: 10px; } }
    /* the pad fits the space it is given (a page's own pad has only that page's height, and the line that says why can run to four lines): smaller keys first, then the words beside the keys */
    :host { container-type: size; }
    @container (max-height: 700px) { .grid { grid-template-columns: repeat(3, 64px); gap: 8px; } .grid button { height: 64px; } .pad { gap: 10px; padding: 16px 28px 18px; } }
    @container (max-height: 540px) and (min-width: 700px) {
      .pad { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: auto auto auto 1fr; column-gap: 28px; align-items: start; justify-items: start; width: 640px; }
      .grid { grid-column: 2; grid-row: 1 / 5; } .note { text-align: left; }
    }
    @container (max-height: 400px) { .grid { grid-template-columns: repeat(3, 56px); gap: 6px; } .grid button { height: 56px; font-size: 24px; } }
    .bad { animation: shake var(--m-4, 400ms); }
    .note { min-height: 20px; font-size: 15px; font-weight: var(--w-semi, 600); color: var(--danger, #c62a22); text-align: center; }
    .grid button[disabled] { opacity: .4; }
    @keyframes shake { 20%, 60% { transform: translateX(calc(-10px * var(--m-d, 1))); } 40%, 80% { transform: translateX(calc(10px * var(--m-d, 1))); } }
  `];
  static properties = { pin: {}, reason: {}, _typed: { state: true }, _bad: { state: true }, _note: { state: true }, _wait: { state: true } };
  pin = '';
  reason = 'Grown-ups only';
  private _typed = '';
  private _bad = false;
  private _note = '';
  private _wait = 0;
  private _from: HTMLElement | null = null;
  private _tick = 0;
  private _digits: string[] = ORDER;

  connectedCallback(): void {
    super.connectedCallback();
    // remember what had focus, so it can go back there when the pad closes
    let a: Element | null = document.activeElement; while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
    this._from = a as HTMLElement | null;
    this._digits = deal();
    this._wait = Math.max(0, Math.ceil((LOCK.until - Date.now()) / 1000));
    this._tick = window.setInterval(() => { this._wait = Math.max(0, Math.ceil((LOCK.until - Date.now()) / 1000)); if (!this._wait && this._note.startsWith('Too many')) this._note = ''; }, 1000);
    // typed digits, Backspace and Escape work wherever focus happens to be while the pad is open
    window.addEventListener('keydown', this._keys, true);
  }
  disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this._tick); window.removeEventListener('keydown', this._keys, true); const f = this._from; if (f?.isConnected) window.setTimeout(() => f.focus({ preventScroll: true }), 0); }
  firstUpdated(): void { (this.renderRoot.querySelector('.grid button') as HTMLElement | null)?.focus({ preventScroll: true }); }

  private _key(k: string): void {
    if (this._wait) return;
    if (k === 'del') { if (this._typed) sfx('del'); this._typed = this._typed.slice(0, -1); return; }
    if (this._bad) return;
    // every digit sounds the same, so the PIN cannot be learnt by ear
    this._typed += k; this._note = ''; if (this._typed.length < this.pin.length) sfx('pin');
    if (this._typed.length >= this.pin.length) {
      if (this._typed === this.pin) { LOCK.misses = 0; sfx('pinok'); this._leave('ok'); }
      else {
        LOCK.misses += 1; this._bad = true; sfx('pinno');
        // three wrong tries: the pad rests for a minute, so it cannot be guessed by mashing
        if (LOCK.misses >= 3) { LOCK.misses = 0; LOCK.until = Date.now() + 60_000; this._wait = 60; this._note = 'Too many tries. Ask a grown-up to help.'; } else this._note = 'Not that one. Try again.';
        setTimeout(() => { this._bad = false; this._typed = ''; }, 420);
      }
    }
  }
  /** The pad fades out (--m-2) before it tells its owner the answer, so it never just vanishes. */
  private _leave(ev: 'ok' | 'cancel'): void {
    if (this.hasAttribute('data-closing')) return;
    this.setAttribute('data-closing', '');
    window.setTimeout(() => { this.removeAttribute('data-closing'); this.dispatchEvent(new CustomEvent(ev)); }, 160);
  }
  /** Close as if Cancel was pressed (the card's Escape key). */
  cancel(): void { this._leave('cancel'); }
  private _keys = (e: KeyboardEvent): void => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') this._leave('cancel');
    else if (/^[0-9]$/.test(e.key)) this._key(e.key);
    else if (e.key === 'Backspace') this._key('del');
    else if (e.key === 'Tab') { // focus stays on the pad while it is open
      const all = [...this.renderRoot.querySelectorAll<HTMLElement>('button:not([disabled])')], at = all.indexOf(this.renderRoot.querySelector(':focus') as HTMLElement);
      all[(at + (e.shiftKey ? -1 : 1) + all.length) % all.length]?.focus();
    } else return;
    e.preventDefault(); e.stopPropagation();
  };
  render() {
    return html`<div class="glass sheet pad ${this._bad ? 'bad' : ''}" role="dialog" aria-modal="true" aria-label=${`${this.reason} Enter the parent PIN.`} @click=${(e: Event) => e.stopPropagation()}>
      <div style="display:flex;width:100%;align-items:center;gap:10px"><span style="line-height:0;color:var(--accent)">${icon('lock', 24)}</span><h2 class="t-sub" style="flex:1">${this.reason}</h2>
        <button class="round tap" style="width:52px;height:52px;margin-right:-10px" aria-label="Cancel" @click=${() => this._leave('cancel')}>${icon('close', 20)}</button></div>
      <span class="what">Enter the parent PIN to go on.</span>
      <div class="dots" role="img" aria-label="${this._typed.length} of ${this.pin.length} digits entered">${Array.from({ length: this.pin.length }, (_, i) => html`<span class=${i < this._typed.length ? 'on' : ''}></span>`)}</div>
      <div class="note" role="alert">${this._wait ? `Too many tries. Ask a grown-up to help. (${this._wait} s)` : this._note}</div>
      <div class="grid">
        ${[...this._digits.slice(0, 9), '', this._digits[9], 'del'].map((k) => k ? html`<button class="tap" ?disabled=${!!this._wait} aria-label=${k === 'del' ? 'Delete' : k} @click=${() => this._key(k)}>${k === 'del' ? icon('backspace', 28) : k}</button>` : html`<span></span>`)}
      </div>
    </div>`;
  }
}
if (!customElements.get('fh-pin')) customElements.define('fh-pin', FhPin);
