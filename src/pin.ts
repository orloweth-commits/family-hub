import { LitElement, html, css } from 'lit';
import { styles } from './styles';
import { LookController } from './looks';
import { icon } from './icons';

/** Parent PIN pad. Fires `ok` when the right PIN is entered, `cancel` when dismissed. */
/** Wrong tries are counted across every pad on the panel. */
const LOCK = { misses: 0, until: 0 };

export class FhPin extends LitElement {
  readonly lookCtl = new LookController(this);
  static styles = [styles, css`
    :host([data-phone]) { position: fixed !important; }
    :host { position: absolute; inset: 0; z-index: 35; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); }
    .pad { border-radius: 32px; padding: 24px 28px; display: flex; flex-direction: column; align-items: center; gap: 16px; width: 340px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
    .dots { display: flex; gap: 14px; height: 20px; }
    .dots span { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--ink2); transition: background .15s; }
    .dots span.on { background: var(--ink); border-color: var(--ink); }
    .grid { display: grid; grid-template-columns: repeat(3, 76px); gap: 12px; }
    .grid button { height: 76px; border-radius: 50%; background: var(--chip-strong); font-size: 28px; font-weight: var(--w-semi, 600); }
    .bad { animation: shake .4s; }
    .note { min-height: 20px; font-size: 15px; font-weight: var(--w-semi, 600); color: var(--danger, #c62a22); text-align: center; }
    .grid button[disabled] { opacity: .4; }
    @keyframes shake { 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
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

  connectedCallback(): void {
    super.connectedCallback();
    // remember what had focus, so it can go back there when the pad closes
    let a: Element | null = document.activeElement; while (a?.shadowRoot?.activeElement) a = a.shadowRoot.activeElement;
    this._from = a as HTMLElement | null;
    this._wait = Math.max(0, Math.ceil((LOCK.until - Date.now()) / 1000));
    this._tick = window.setInterval(() => { this._wait = Math.max(0, Math.ceil((LOCK.until - Date.now()) / 1000)); if (!this._wait && this._note.startsWith('Too many')) this._note = ''; }, 1000);
  }
  disconnectedCallback(): void { super.disconnectedCallback(); clearInterval(this._tick); const f = this._from; if (f?.isConnected) window.setTimeout(() => f.focus({ preventScroll: true }), 0); }
  firstUpdated(): void { (this.renderRoot.querySelector('.grid button') as HTMLElement | null)?.focus({ preventScroll: true }); }

  private _key(k: string): void {
    if (this._wait) return;
    if (k === 'del') { this._typed = this._typed.slice(0, -1); return; }
    if (this._bad) return;
    this._typed += k; this._note = '';
    if (this._typed.length >= this.pin.length) {
      if (this._typed === this.pin) { LOCK.misses = 0; this.dispatchEvent(new CustomEvent('ok')); }
      else {
        LOCK.misses += 1; this._bad = true;
        // three wrong tries: the pad rests for a minute, so it cannot be guessed by mashing
        if (LOCK.misses >= 3) { LOCK.misses = 0; LOCK.until = Date.now() + 60_000; this._wait = 60; this._note = 'Too many tries. Ask a grown-up to help.'; } else this._note = 'That’s not it. Try again.';
        setTimeout(() => { this._bad = false; this._typed = ''; }, 420);
      }
    }
  }
  private _keys = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { e.preventDefault(); this.dispatchEvent(new CustomEvent('cancel')); }
    else if (/^[0-9]$/.test(e.key)) { e.preventDefault(); this._key(e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); this._key('del'); }
    else if (e.key === 'Tab') { // focus stays on the pad while it is open
      const all = [...this.renderRoot.querySelectorAll<HTMLElement>('button:not([disabled])')], at = all.indexOf(this.renderRoot.querySelector(':focus') as HTMLElement);
      e.preventDefault(); all[(at + (e.shiftKey ? -1 : 1) + all.length) % all.length]?.focus();
    }
  };
  render() {
    return html`<div class="glass pad ${this._bad ? 'bad' : ''}" role="dialog" aria-modal="true" aria-label="Parent PIN" @click=${(e: Event) => e.stopPropagation()} @keydown=${this._keys}>
      <div style="display:flex;width:100%;align-items:center"><h2 class="t-sub" style="flex:1">${this.reason}</h2>
        <button class="round tap" style="width:44px;height:44px" aria-label="Cancel" @click=${() => this.dispatchEvent(new CustomEvent('cancel'))}>${icon('close', 18)}</button></div>
      <div class="dots" role="img" aria-label="${this._typed.length} of ${this.pin.length} digits entered">${Array.from({ length: this.pin.length }, (_, i) => html`<span class=${i < this._typed.length ? 'on' : ''}></span>`)}</div>
      <div class="note" role="alert">${this._wait ? `Too many tries. Ask a grown-up to help. (${this._wait} s)` : this._note}</div>
      <div class="grid">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => k ? html`<button class="tap" ?disabled=${!!this._wait} aria-label=${k === 'del' ? 'Delete' : k} @click=${() => this._key(k)}>${k === 'del' ? '⌫' : k}</button>` : html`<span></span>`)}
      </div>
    </div>`;
  }
}
if (!customElements.get('fh-pin')) customElements.define('fh-pin', FhPin);
