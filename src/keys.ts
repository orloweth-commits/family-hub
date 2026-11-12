import { html, css, nothing, type TemplateResult } from 'lit';

/* ------------------------------------------------------------------ *
 * The one on-screen keyboard. Every text box on the panel uses it, so the
 * keys sit in the same place and looks style them once (the `key` role).
 * ------------------------------------------------------------------ */

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

/** Applies a key press: returns the new text and whether the next letter is a capital. */
export const typeKey = (text: string, k: string, caps: boolean): [string, boolean] => {
  if (k === 'del') { const t = text.slice(0, -1); return [t, !t.length]; }
  if (k === ' ') return [text + ' ', caps];
  if (/\d/.test(k)) return [text + k, caps];
  if (/^[?!',.]$/.test(k)) return [text + k, /[?!.]/.test(k) ? true : caps]; // a new sentence starts with a capital
  return [text + (caps ? k.toUpperCase() : k), false];
};

export const keyboard = (press: (k: string) => void, caps: boolean, flipCaps: () => void, compact = false, digits = false, punct = false): TemplateResult => html`
  <div class="keys ${compact ? 'compact' : ''}" role="group" aria-label="Keyboard">
    ${digits ? html`<div class="krow">${[...'1234567890'].map((k) => html`<button class="key" @click=${() => press(k)}>${k}</button>`)}</div>` : nothing}
    ${ROWS.map((r, i) => html`<div class="krow">
      ${i === 2 ? html`<button class="key wide" aria-label="Capital letter" aria-pressed=${String(caps)} @click=${flipCaps}>⇧</button>` : nothing}
      ${[...r].map((k) => html`<button class="key" @click=${() => press(k)}>${caps ? k.toUpperCase() : k}</button>`)}
      ${i === 2 ? html`<button class="key wide" aria-label="Delete" @click=${() => press('del')}>⌫</button>` : nothing}
    </div>`)}
    <div class="krow ${punct ? 'pk' : ''}">${punct ? [['?', 'Question mark'], ['!', 'Exclamation mark'], ['’', 'Apostrophe']].map(([k, n]) => html`<button class="key" aria-label=${n} @click=${() => press(k === '’' ? "'" : k)}>${k}</button>`) : nothing}<button class="key space" aria-label="Space" @click=${() => press(' ')}>space</button>${punct ? [[',', 'Comma'], ['.', 'Full stop']].map(([k, n]) => html`<button class="key" aria-label=${n} @click=${() => press(k)}>${k}</button>`) : nothing}</div>
  </div>`;

export const keysCss = css`
  .keys { display: flex; flex-direction: column; gap: 8px; }
  .krow { display: flex; gap: 8px; justify-content: center; }
  .key { width: 64px; height: 64px; border-radius: 14px; background: var(--chip-strong); box-shadow: 0 2px 0 rgba(0,0,0,.12); font-size: 24px; font-weight: 500; transition: transform var(--mt-1, 80ms) ease; }
  .key:active { transform: scale(.92); background: var(--chip); }
  .key.wide { width: 96px; font-size: 20px; }
  .key.wide[aria-pressed='true'] { background: var(--sel-bg); color: var(--sel-ink); box-shadow: var(--sel-ring); }
  .key.space { width: 420px; font-size: 17px; }
  .keys.compact, .keys.compact .krow { gap: 6px; }
  .keys.compact .key { width: 56px; height: 48px; border-radius: 12px; font-size: 22px; }
  .keys.compact .key.wide { width: 84px; font-size: 18px; }
  .keys.compact .key.space { width: 420px; font-size: 16px; }
  .keys .krow.pk .key.space, .keys.compact .krow.pk .key.space { width: 240px; }
  /* in a box narrower than the row, the keys give way together (never under a 44 px target) rather than running off the edge */
  .keys, .krow { min-width: 0; }
  .keys .key { flex-shrink: 1; min-width: 44px; }
  .keys .key.space { min-width: 0; }
`;
