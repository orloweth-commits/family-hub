import { css, html, nothing, svg } from 'lit';
import { dot, field, spots, type Scene } from './types';

const FLIES = spots(7, 5, 30, 85), LEAVES = spots(4, 404, 0, 100);
const leaf = svg`<svg viewBox="0 0 40 24" width="34"><path d="M2 12Q14-4 38 12Q14 28 2 12z" fill="#8a9a5b"/><path d="M4 12h32" stroke="#5f6f3a" stroke-width="1.5"/></svg>`;

export const bush: Scene = {
  css: css`
    .firefly { width: 5px; height: 5px; background: #fff3a8; box-shadow: 0 0 10px 3px rgba(255,243,168,.75); animation: glow 3.4s ease-in-out infinite alternate, drift 9s ease-in-out infinite alternate; animation-delay: calc(var(--d) * -1s); }
    @keyframes glow { from { opacity: .05; } to { opacity: .95; } } @keyframes drift { from { transform: translate(-14px, 8px); } to { transform: translate(16px, -12px); } }
    .mote { top: -30px; opacity: .55; animation: fall 26s linear infinite; animation-delay: calc(var(--d) * -3.2s); }
    @keyframes fall { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(-22vw, 112vh) rotate(540deg); } }
    .wings { transform-box: fill-box; transform-origin: center; animation: wings .22s ease-in-out infinite alternate; }
    @keyframes wings { from { transform: scaleX(1); } to { transform: scaleX(.35); } }
  `,
  always: (c) => (c.tod === 'day' ? html`${LEAVES.map((p) => html`<i class="dot mote" style=${dot('mote', p)}>${leaf}</i>`)}` : html`${FLIES.map((p) => html`<i class="dot firefly" style=${dot('firefly', p)}></i>`)}`),
  cast: [
    { id: 'leaf', ms: 14000, move: 'down', art: svg`<svg viewBox="0 0 40 24" width="34"><path d="M2 12Q14-4 38 12Q14 28 2 12z" fill="#8a9a5b"/><path d="M4 12h32" stroke="#5f6f3a" stroke-width="1.5"/></svg>`, flip: false },
    { id: 'butterfly', ms: 15000, move: 'flit', art: svg`<svg viewBox="0 0 44 36" width="36"><g class="wings"><path d="M22 18Q6-2 3 12t19 8z" fill="#f4a261"/><path d="M22 18Q38-2 41 12t-19 8z" fill="#e76f51"/><path d="M22 20Q10 34 8 24t14-4z" fill="#e9c46a"/><path d="M22 20Q34 34 36 24t-14-4z" fill="#f4a261"/></g><rect x="20.6" y="10" width="2.8" height="16" rx="1.4" fill="#3d2a18"/></svg>`, weight: 2, flip: false, y: [4, 14] },
  ],
};
