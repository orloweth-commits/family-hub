import { css, html, nothing, svg } from 'lit';
import { dot, field, spots, type Scene } from './types';

const BUBBLES = spots(9, 77, 0, 100);

export const reef: Scene = {
  css: css`
    .bubble { top: auto; bottom: -24px; width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.7); scale: var(--s); animation: rise 13s linear infinite; animation-delay: calc(var(--d) * -1.6s); }
    @keyframes rise { from { transform: translate(0, 0); opacity: 0; } 12% { opacity: .8; } 50% { transform: translate(14px, -50vh); } to { transform: translate(-8px, -104vh); opacity: 0; } }
    .paddle { transform-box: fill-box; transform-origin: top center; animation: paddle 1.4s ease-in-out infinite alternate; } @keyframes paddle { from { transform: rotate(-16deg); } to { transform: rotate(16deg); } }
  `,
  always: (c) => html`${BUBBLES.map((p) => html`<i class="dot bubble" style=${dot('bubble', p)}></i>`)}`,
  cast: [
    { id: 'fish', ms: 18000, move: 'across bobbing', art: svg`<svg viewBox="0 0 70 36" width="58"><path d="M14 18L2 8v20z" fill="#ff9f1c"/><ellipse cx="38" cy="18" rx="26" ry="13" fill="#ffbf69"/><path d="M30 6q8 12 0 24M42 6q8 12 0 24" stroke="#fff" stroke-width="3" fill="none"/><circle cx="54" cy="15" r="2.6" fill="#123"/></svg>`, weight: 2, y: [20, 80] },
    { id: 'turtle', ms: 30000, move: 'across bobbing', art: svg`<svg viewBox="0 0 90 50" width="78"><path class="paddle" d="M30 34l-12 12 16-4zM58 34l10 12-15-4z" fill="#5fa777"/><ellipse cx="44" cy="26" rx="26" ry="16" fill="#3d8b63"/><path d="M26 26h36M35 14l6 24M53 14l-6 24" stroke="#2c6b4a" stroke-width="2" fill="none"/><circle cx="76" cy="24" r="8" fill="#6fbf8b"/><circle cx="79" cy="22" r="1.6" fill="#123"/></svg>`, y: [20, 80] },
  ],
};
