import { LitElement, html, css } from 'lit';
import { styles } from './styles';
import { icon } from './icons';

/** Parent PIN pad. Fires `ok` when the right PIN is entered, `cancel` when dismissed. */
export class FhPin extends LitElement {
  static styles = [styles, css`
    :host { position: absolute; inset: 0; z-index: 35; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.35); }
    .pad { border-radius: 32px; padding: 24px 28px; display: flex; flex-direction: column; align-items: center; gap: 16px; width: 340px; animation: sheet .38s cubic-bezier(.2,.9,.3,1.15) both; }
    .dots { display: flex; gap: 14px; height: 20px; }
    .dots span { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--ink2); transition: background .15s; }
    .dots span.on { background: var(--ink); border-color: var(--ink); }
    .grid { display: grid; grid-template-columns: repeat(3, 76px); gap: 12px; }
    .grid button { height: 76px; border-radius: 50%; background: var(--chip-strong); font-size: 28px; font-weight: 600; }
    .bad { animation: shake .4s; }
    @keyframes shake { 20%, 60% { transform: translateX(-10px); } 40%, 80% { transform: translateX(10px); } }
  `];
  static properties = { pin: {}, reason: {}, _typed: { state: true }, _bad: { state: true } };
  pin = '';
  reason = 'Grown-ups only';
  private _typed = '';
  private _bad = false;

  private _key(k: string): void {
    if (k === 'del') { this._typed = this._typed.slice(0, -1); return; }
    this._typed += k;
    if (this._typed.length >= this.pin.length) {
      if (this._typed === this.pin) this.dispatchEvent(new CustomEvent('ok'));
      else { this._bad = true; setTimeout(() => { this._bad = false; this._typed = ''; }, 420); }
    }
  }
  render() {
    return html`<div class="glass pad ${this._bad ? 'bad' : ''}" role="dialog" aria-label="Parent PIN" @click=${(e: Event) => e.stopPropagation()}>
      <div style="display:flex;width:100%;align-items:center"><h2 style="flex:1;font-size:22px">${this.reason}</h2>
        <button class="round tap" aria-label="Cancel" @click=${() => this.dispatchEvent(new CustomEvent('cancel'))}>${icon('close', 18)}</button></div>
      <div class="dots">${Array.from({ length: this.pin.length }, (_, i) => html`<span class=${i < this._typed.length ? 'on' : ''}></span>`)}</div>
      <div class="grid">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((k) => k ? html`<button class="tap" aria-label=${k === 'del' ? 'Delete' : k} @click=${() => this._key(k)}>${k === 'del' ? '⌫' : k}</button>` : html`<span></span>`)}
      </div>
    </div>`;
  }
}
if (!customElements.get('fh-pin')) customElements.define('fh-pin', FhPin);
