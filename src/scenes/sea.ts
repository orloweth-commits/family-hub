import { css, html, nothing, svg } from 'lit';
import { dot, field, spots, type Scene } from './types';

const GLINTS = spots(12, 21, 58, 90);

export const sea: Scene = {
  css: css`
    .glint { width: 5px; height: 5px; background: #fff; box-shadow: 0 0 8px 2px rgba(255,255,255,.8); scale: var(--s); opacity: 0; animation: glint 5s ease-in-out infinite; animation-delay: calc(var(--d) * -1s); }
    @keyframes glint { 0%, 70%, 100% { opacity: 0; transform: scale(.4); } 82% { opacity: .9; transform: scale(1.2) rotate(45deg); } }
    .flap { transform-box: fill-box; transform-origin: center; animation: flap .7s ease-in-out infinite alternate; } .flap.late { animation-delay: -.35s; }
    @keyframes flap { from { transform: scaleY(1); } to { transform: scaleY(.25); } }
  `,
  always: (c) => html`${GLINTS.map((p) => html`<i class="dot glint" style=${dot('glint', p)}></i>`)}`,
  cast: [
    { id: 'gulls', ms: 20000, move: 'across', art: svg`<svg viewBox="0 0 90 40" width="86" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path class="flap" d="M6 16q9-10 16 0q7-10 16 0"/><path class="flap late" d="M48 30q7-8 13 0q6-8 13 0"/></svg>`, weight: 2 },
    { id: 'balloon', ms: 40000, move: 'up', art: svg`<svg viewBox="0 0 40 60" width="34"><path d="M20 2C8 2 3 12 3 20c0 10 10 18 13 22h8c3-4 13-12 13-22C37 12 32 2 20 2z" fill="#e63946"/><path d="M20 2c-5 6-5 34-2 40M20 2c5 6 5 34 2 40" stroke="#ffd166" stroke-width="3" fill="none"/><path d="M15 44l2 8h6l2-8" stroke="#6b4a2b" stroke-width="1.4" fill="none"/><rect x="15" y="51" width="10" height="7" rx="1.5" fill="#8a5a2b"/></svg>`, flip: false },
  ],
};
